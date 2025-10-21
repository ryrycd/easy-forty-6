import { json } from '../../../lib/validation.js';
import { requireAdmin } from './_common.js';
import { getSetting, setSetting } from '../../../lib/store.js';

export async function onRequestPost({ request, env }){
  try{
    requireAdmin(request, env);
    const cur = await getSetting(env.DB,'frozen','false');
    const next = cur==='true'?'false':'true';
    await setSetting(env.DB,'frozen',next);
    return json({ ok:true, frozen: next });
  }catch(e){ return json({ error:e.message }, 401); }
}
export { onRequestOptions } from './_common.js';
