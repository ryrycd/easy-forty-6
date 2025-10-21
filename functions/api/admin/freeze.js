import { json, CORS } from '../../../lib/validation.js';
import { getSetting, setSetting } from '../../../lib/store.js';

function requireAdmin(request, env){
  const k = request.headers.get('X-ADMIN-KEY') || '';
  if (!k || k !== env.ADMIN_KEY) throw new Error('unauthorized');
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const DB = context.env.DB;
    const cur = await getSetting(DB,'frozen','false');
    const next = cur==='true'?'false':'true';
    await setSetting(DB,'frozen',next);
    return json({ ok:true, frozen: next });
  }catch(e){ return json({ error: e.message }, 401); }
}
