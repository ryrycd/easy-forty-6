import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';

async function ensureCols(DB){
  const { results } = await DB.prepare('PRAGMA table_info(links)').all();
  const cols = (results||[]).map(r=> String(r.name).toLowerCase());
  const needWeekly = !cols.includes('weekly_target');
  const needValid = !cols.includes('valid_until');
  const needNote = !cols.includes('note');
  if (needWeekly) await DB.prepare('ALTER TABLE links ADD COLUMN weekly_target INTEGER NOT NULL DEFAULT 0').run();
  if (needValid) await DB.prepare('ALTER TABLE links ADD COLUMN valid_until TEXT').run();
  if (needNote) await DB.prepare('ALTER TABLE links ADD COLUMN note TEXT').run();
}

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const DB = context.env.DB;
    await ensureCols(DB);
    const body = await context.request.json();
    const url = String(body.url||'').trim();
    const cap = Math.max(1, Number(body.cap||50));
    const weekly_target = Math.max(0, Number(body.weekly_target||0));
    const valid_until = body.valid_until || null;
    if (!url) return json({ error:'url required' }, 400);
    const pos = (await DB.prepare('SELECT COALESCE(MAX(position),-1) as p FROM links').first()).p + 1;
    await DB.prepare('INSERT INTO links(url,cap,position,weekly_target,valid_until,active,assigned_count,completed_count) VALUES (?,?,?,?,?,?,0,0)')
      .bind(url, cap, pos, weekly_target, valid_until, 1).run();
    return json({ ok:true });
  }catch(e){
    return json({ error: e.message }, 401);
  }
}