import { json } from '../../../lib/validation.js';
import { requireAdmin } from './_common.js';

export async function onRequestPost({ request, env }){
  try{
    requireAdmin(request, env);
    const b = await request.json();
    const n = Math.max(0, Number(b.weekly_target||0));
    await env.DB.prepare('UPDATE links SET weekly_target=?').bind(n).run();
    return json({ ok:true });
  }catch(e){ return json({ error:e.message }, 401); }
}
export { onRequestOptions } from './_common.js';
