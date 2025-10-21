export async function sendSMS(env, to, text, opts={}){
  const body = { to, text, messaging_profile_id: env.TELNYX_MESSAGING_PROFILE_ID, from: env.TOLLFREE_NUMBER_E164, ...opts };
  const r = await fetch('https://api.telnyx.com/v2/messages',{ method:'POST', headers:{'Authorization':`Bearer ${env.TELNYX_API_KEY}`,'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.errors?.[0]?.detail || 'telnyx error');
  return j.data;
}
export async function cancelMessage(env, id){
  return fetch(`https://api.telnyx.com/v2/messages/${id}`,{ method:'DELETE', headers:{'Authorization':`Bearer ${env.TELNYX_API_KEY}`}});
}
