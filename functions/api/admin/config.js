import { json, CORS } from '../../../lib/validation.js';
import { requireAdmin } from './_auth.js';
import { setSetting } from '../../../lib/store.js';

export async function onRequestOptions(){ return new Response(null,{status:204, headers:CORS}); }
export async function onRequestPost(context){
  try{
    requireAdmin(context.request, context.env);
    const url = new URL(context.request.url);
    const action = url.searchParams.get('action') || '';
    const DB = context.env.DB;
    if (action === 'resetNow') {
      await DB.prepare('UPDATE links SET assigned_count=0, completed_count=0').run();
      await setSetting(DB,'last_reset', new Date().toISOString());
      return json({ ok:true });
    }
    const body = await context.request.json();
    if (typeof body.autoResetWeekly === 'boolean') {
      await setSetting(DB,'auto_weekly_reset', body.autoResetWeekly?'true':'false');
    }
    return json({ ok:true });
  }catch(e){ return json({ error: e.message }, 401); }
}