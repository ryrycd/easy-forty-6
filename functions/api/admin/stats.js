import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestGet(context){
  try{
    requireAdmin(context.request, context.env);
    const DB = context.env.DB;
    const { results } = await DB.prepare('SELECT * FROM links ORDER BY position ASC, id ASC').all();
    return json({ links: results || [] });
  }catch(e){ return json({ error: e.message }, 401); }
}