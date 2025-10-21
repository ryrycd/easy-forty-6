import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const { weekly_target=0 } = await context.request.json();
    await context.env.DB.prepare('UPDATE links SET weekly_target=?').bind(Math.max(0, Number(weekly_target||0))).run();
    return json({ ok:true });
  }catch(e){ return json({ error: e.message }, 401); }
}