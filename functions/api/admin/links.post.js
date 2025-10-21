import { json } from '../../../lib/validation.js';
import { requireAdmin } from './_common.js';

export async function onRequestPost({ request, env }){
  try{
    requireAdmin(request, env);
    const b = await request.json().catch(()=>({}));
    const url = String(b.url||'');
    const cap = Math.max(1, Number(b.cap||50));
    const weekly = Math.max(0, Number(b.weekly_target||0));
    await env.DB.prepare('INSERT INTO links(url,cap,weekly_target,position,active) VALUES (?,?,?,?,1)')
      .bind(url, cap, weekly, (await env.DB.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM links').first()).p).run();
    return json({ ok:true });
  }catch(e){ return json({ error:e.message }, 401); }
}
export { onRequestOptions } from './_common.js';
