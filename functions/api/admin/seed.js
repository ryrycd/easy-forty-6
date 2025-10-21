import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const url = new URL(context.request.url);
    const mode = url.searchParams.get('mode') || 'append';
    const arr = await context.request.json();
    const list = Array.isArray(arr)? arr : [];
    const DB = context.env.DB;
    if (mode === 'replace') {
      await DB.prepare('DELETE FROM links').run();
    }
    let pos = (await DB.prepare('SELECT COALESCE(MAX(position),-1) as p FROM links').first()).p + 1;
    for (const it of list){
      const w = Math.max(0, Number(it.weekly||it.weekly_target||0));
      const vd = it.valid || it.valid_until || null;
      const url = String(it.url||'').trim();
      if (!url) continue;
      await DB.prepare('INSERT INTO links(url,cap,position,weekly_target,valid_until) VALUES (?,?,?,?,?)')
        .bind(url, 50, pos++, w, vd).run();
    }
    return json({ ok:true, count: list.length });
  }catch(e){ return json({ error: e.message }, 401); }
}