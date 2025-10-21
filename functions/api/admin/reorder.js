import { json } from '../../../lib/validation.js';
import { requireAdmin } from './_common.js';

export async function onRequestPost({ request, env }){
  try{
    requireAdmin(request, env);
    const b = await request.json();
    const ids = Array.isArray(b.ids) ? b.ids : [];
    let pos=1;
    for (const id of ids){
      await env.DB.prepare('UPDATE links SET position=? WHERE id=?').bind(pos++, Number(id)).run();
    }
    return json({ ok:true });
  }catch(e){ return json({ error:e.message }, 401); }
}
export { onRequestOptions } from './_common.js';
