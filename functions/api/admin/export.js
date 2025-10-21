import { requireAdmin } from './_common.js';

export async function onRequestGet({ request, env }){
  try{
    requireAdmin(request, env);
    const rows = await env.DB.prepare(`
      SELECT a.id as assignment_id, u.phone, u.status, u.payout, u.handle, u.zelle,
             a.status as assignment_status, a.created_at, a.link_sent_at, a.completed_at,
             l.id as link_id, l.url as link_url
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      JOIN links l ON a.link_id = l.id
      ORDER BY a.id DESC`).all();
    const header = "assignment_id,phone,status,payout,handle,zelle,assignment_status,created_at,link_sent_at,completed_at,link_id,link_url\n";
    const csv = header + (rows.results||[]).map(r=>[r.assignment_id,r.phone,r.status,r.payout,r.handle,r.zelle,r.assignment_status,r.created_at,r.link_sent_at,r.completed_at,r.link_id,`"${r.link_url}"`].join(',')).join('\n');
    return new Response(csv,{headers:{'content-type':'text/csv; charset=UTF-8','access-control-allow-origin':'*'}});
  }catch(e){ return new Response('unauthorized',{status:401}); }
}
export { onRequestOptions } from './_common.js';
