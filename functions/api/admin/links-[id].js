import { json } from '../../../lib/validation.js';
import { requireAdmin } from './_common.js';

export async function onRequestPut({ request, env, params }){
  try{
    requireAdmin(request, env);
    const id = Number(params.id);
    const b = await request.json();
    if ('active' in b) await env.DB.prepare('UPDATE links SET active=? WHERE id=?').bind(b.active?1:0, id).run();
    if ('cap' in b) await env.DB.prepare('UPDATE links SET cap=? WHERE id=?').bind(Math.max(1,Number(b.cap||1)), id).run();
    if ('weekly_target' in b) await env.DB.prepare('UPDATE links SET weekly_target=? WHERE id=?').bind(Math.max(0,Number(b.weekly_target||0)), id).run();
    if ('valid_until' in b) await env.DB.prepare('UPDATE links SET valid_until=? WHERE id=?').bind(b.valid_until||null, id).run();
    if ('note' in b) await env.DB.prepare('UPDATE links SET note=? WHERE id=?').bind(b.note||null, id).run();
    if ('url' in b) await env.DB.prepare('UPDATE links SET url=? WHERE id=?').bind(String(b.url||''), id).run();
    return json({ ok:true });
  }catch(e){ return json({ error:e.message }, 401); }
}

export async function onRequestDelete({ request, env, params }){
  try{
    requireAdmin(request, env);
    const id = Number(params.id);
    await env.DB.prepare('DELETE FROM links WHERE id=?').bind(id).run();
    return json({ ok:true });
  }catch(e){ return json({ error:e.message }, 401); }
}
export { onRequestOptions } from './_common.js';
