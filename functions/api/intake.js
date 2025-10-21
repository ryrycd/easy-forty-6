import { normalizeUS, json, CORS } from '../../lib/validation.js';
import { getSetting, pickActiveLink, assignLink, createUser, saveEvent, setReminderId } from '../../lib/store.js';
import { sendSMS } from '../../lib/telnyx.js';

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestPost(context){
  const { request, env, data } = context;
  try {
    const { DB, PROOFS } = env;
    const body = await request.json();
    if (String(body.honeypot||'').trim() !== '') return json({ ok:true }); // bot
    if (env.FREEZE === 'true') return json({ error: 'Temporarily paused. Please try again later.' }, 503);
    if (!body.consent) return json({ error: 'Consent required.' }, 400);
    const phone = normalizeUS(body.phone);
    if (!phone) return json({ error: 'Invalid phone.' }, 400);

    // Weekly reset if needed
    // (lazy reset approach to avoid cron)
    // await weeklyResetIfNeeded(DB);

    const user = await createUser(DB, {
      phone, status: body.status||'', payout: body.payout||'',
      handle: body.handle||'', zelle: body.zelle||'', consent: !!body.consent
    });
    await saveEvent(DB, user.id, 'intake.submit', { from: request.headers.get('cf-connecting-ip') });

    const frozen = await getSetting(DB,'frozen','false');
    if (frozen === 'true') return json({ error: 'Signups are paused. Please try again later.' }, 503);

    const link = await pickActiveLink(DB);
    if (!link) return json({ error: 'No links available right now.' }, 503);

    const assignmentId = await assignLink(DB, user.id, link.id);

    const intro = `Easy Forty: Thanks for opting in! Steps: 1) Reply READY to get your unique link. 2) Open it, sign up as a NEW user, and deposit $5. 3) Reply DONE and send a screenshot here. Reply HELP for help, STOP to opt out.`;
    await sendSMS(env, phone, intro);

    // Schedule 24h reminder via Telnyx scheduled messaging
    const sendAt = new Date(Date.now() + 24*60*60*1000).toISOString();
    const scheduled = await sendSMS(env, phone, 'Reminder: finish your Easy Forty steps to claim $40. Reply READY for your link or DONE when completed.', { send_at: sendAt });
    if (scheduled?.id) await setReminderId(DB, assignmentId, scheduled.id);

    return json({ ok:true, assignmentId });
  } catch (e) {
    return json({ error: e.message || 'server error' }, 500);
  }
}
