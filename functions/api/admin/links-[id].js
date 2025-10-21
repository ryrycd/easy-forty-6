import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestPut(context){
  try{
    requireAdmin(context.request, context.env);
    const id = Number(context.params.id);
    const body = await context.request.json();
    if (typeof body.active === 'boolean') {
      await context.env.DB.prepare('UPDATE links SET active=? WHERE id=?').bind(body.active?1:0, id).run();
    }
    if (body.url !== undefined) {
      await context.env.DB.prepare('UPDATE links SET url=? WHERE id=?').bind(String(body.url||'').trim(), id).run();
    }
    if (body.weekly_target !== undefined) {
      await context.env.DB.prepare('UPDATE links SET weekly_target=? WHERE id=?').bind(Math.max(0, Number(body.weekly_target||0)), id).run();
    }
    if (body.valid_until !== undefined) {
      await context.env.DB.prepare('UPDATE links SET valid_until=? WHERE id=?').bind(body.valid_until||null, id).run();
    }
    if (body.note !== undefined) {
      await context.env.DB.prepare('UPDATE links SET note=? WHERE id=?').bind(body.note||null, id).run();
    }
    if (body.move === 'up') {
      await context.env.DB.prepare('UPDATE links SET position = position - 1 WHERE id=?').bind(id).run();
    } else if (body.move === 'down') {
      await context.env.DB.prepare('UPDATE links SET position = position + 1 WHERE id=?').bind(id).run();
    }
    return json({ ok:true });
  }catch(e){ return json({ error: e.message }, 401); }
}
export async function onRequestDelete(context){
  try{
    requireAdmin(context.request, context.env);
    const id = Number(context.params.id);
    await context.env.DB.prepare('DELETE FROM links WHERE id=?').bind(id).run();
    return json({ ok:true });
  }catch(e){ return json({ error: e.message }, 401); }
}