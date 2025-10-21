import { json } from '../../lib/validation.js';
import { getUserByPhone, getAssignmentByUser, setLinkSent, completeAssignment, saveEvent, storeProof } from '../../lib/store.js';
import { sendSMS, cancelMessage } from '../../lib/telnyx.js';

async function pipeToR2(env, url, key){
  const r = await fetch(url);
  if (!r.ok) throw new Error('media fetch error');
  const buf = await r.arrayBuffer();
  await env.PROOFS.put(key, buf);
}

export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token || token !== env.WEBHOOK_TOKEN) return json({ error: 'forbidden' }, 403);

    const payload = await request.json();
    const type = payload?.data?.event_type;
    if (type !== 'message.received') return json({ ok:true, ignored:true }); // anti-loop

    const msg = payload?.data?.payload || payload?.data?.record || payload?.data || {};
    const from = msg.from?.phone_number || msg.from || msg.from_number || msg?.from?.address;
    const text = (msg.text || '').trim();
    const media = msg.media || msg.media_urls || msg.parts || [];

    const phone = from;
    if (!phone) return json({ ok:true });

    const user = await getUserByPhone(env.DB, phone);
    if (!user) return json({ ok:true });

    const asg = await getAssignmentByUser(env.DB, user.id);
    await saveEvent(env.DB, user.id, 'inbound', { text, mediaCount: (media?.length||0) });

    // STOP/HELP handling (note: Telnyx also auto-processes STOP on TFN per docs)
    if (/\bhelp\b/i.test(text)) {
      await sendSMS(env, phone, 'Easy Forty help: Finish sign-up, deposit $5, then reply DONE with a screenshot. Questions? support@easyforty.com');
      return json({ ok:true });
    }
    if (/\b(stop|unsubscribe|cancel)\b/i.test(text)) {
      try{ await sendSMS(env, phone, 'You are opted out. Text START to rejoin.'); }catch{}
      return json({ ok:true });
    }

    // State machine
    if (/^ready\b/i.test(text)) {
      const linkRow = await env.DB.prepare('SELECT l.* FROM links l WHERE l.id = ?').bind(asg.link_id).first();
      if (!linkRow) return json({ ok:true });
      const msgText = `Your unique link: ${linkRow.url}
1) Open and sign up as NEW.
2) Deposit $5.
3) Reply DONE and send a screenshot here.`;
      await sendSMS(env, phone, msgText);
      await setLinkSent(env.DB, asg.id);
      // cancel scheduled reminder if set in 1 minute? we keep for 24h until done
      return json({ ok:true });
    }

    if (/^done\b/i.test(text)) {
      await sendSMS(env, phone, 'Great! Please attach a screenshot of your $5 deposit to this thread. (MMS photo).');
      return json({ ok:true });
    }

    // Handle MMS proof
    if (Array.isArray(media) && media.length > 0) {
      // Persist first image
      const first = (media[0].url || media[0].media_url || media[0]);
      const key = `proofs/${user.id}-${asg.id}-${Date.now()}.bin`;
      try{
        await pipeToR2(env, first, key);
        await storeProof(env.DB, asg.id, key);
      }catch(e){
        await sendSMS(env, phone, 'Sorry, we could not save your screenshot. Please try again.');
        return json({ ok:false });
      }
      await completeAssignment(env.DB, asg.id);
      // Cancel scheduled reminder if any
      if (asg.scheduled_msg_id) { try{ await cancelMessage(env, asg.scheduled_msg_id); }catch{} }
      await sendSMS(env, phone, 'Thanks! We will verify and pay via your selected method within ~48 hours.');
      return json({ ok:true });
    }

    // Default: echo hint
    await sendSMS(env, phone, 'Reply READY for your link, DONE when finished, or HELP for help.');
    return json({ ok:true });
  } catch (e) {
    return json({ error: e.message || 'hook error' }, 500);
  }
}
