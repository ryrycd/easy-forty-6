import { json, CORS } from '../../../lib/validation.js';

function requireAdmin(request, env){
  const k = request.headers.get('X-ADMIN-KEY') || '';
  if (!k || k !== env.ADMIN_KEY) throw new Error('unauthorized');
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestPut(context){
  try{
    requireAdmin(context.request, context.env);
    const id = Number(context.params.id);
    const body = await context.request.json();
    if (body.move === 'up') {
      await context.env.DB.prepare('UPDATE links SET position = position - 1 WHERE id=?').bind(id).run();
    } else if (body.move === 'down') {
      await context.env.DB.prepare('UPDATE links SET position = position + 1 WHERE id=?').bind(id).run();
    }
    if (typeof body.active === 'boolean') {
      await context.env.DB.prepare('UPDATE links SET active=? WHERE id=?').bind(body.active?1:0, id).run();
    }
    if (body.reset) {
      await context.env.DB.prepare('UPDATE links SET assigned_count=0, completed_count=0 WHERE id=?').bind(id).run();
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
