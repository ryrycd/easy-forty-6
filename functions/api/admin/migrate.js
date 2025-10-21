import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';

async function hasCol(DB, table, col){
  const { results } = await DB.prepare(`PRAGMA table_info(${table})`).all();
  return (results||[]).some(r=> String(r.name).toLowerCase() === String(col).toLowerCase());
}

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const DB = context.env.DB;
    const adds = [];
    if (!await hasCol(DB,'links','weekly_target')) {
      await DB.prepare('ALTER TABLE links ADD COLUMN weekly_target INTEGER NOT NULL DEFAULT 0').run();
      adds.push('weekly_target');
    }
    if (!await hasCol(DB,'links','valid_until')) {
      await DB.prepare('ALTER TABLE links ADD COLUMN valid_until TEXT').run();
      adds.push('valid_until');
    }
    if (!await hasCol(DB,'links','note')) {
      await DB.prepare('ALTER TABLE links ADD COLUMN note TEXT').run();
      adds.push('note');
    }
    return json({ ok:true, added: adds });
  }catch(e){ return json({ error: e.message }, 401); }
}