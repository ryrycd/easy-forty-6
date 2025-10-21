import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const body = await context.request.json();
    const url = String(body.url||'').trim();
    const cap = Math.max(1, Number(body.cap||50));
    const weekly_target = Math.max(0, Number(body.weekly_target||0));
    const valid_until = body.valid_until || null;
    if (!url) return json({ error:'url required' }, 400);
    const pos = (await context.env.DB.prepare('SELECT COALESCE(MAX(position),-1) as p FROM links').first()).p + 1;
    await context.env.DB.prepare('INSERT INTO links(url,cap,position,weekly_target,valid_until) VALUES (?,?,?,?,?)')
      .bind(url, cap, pos, weekly_target, valid_until).run();
    return json({ ok:true });
  }catch(e){ return json({ error: e.message }, 401); }
}