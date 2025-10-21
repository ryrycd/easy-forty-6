export function normalizeUS(input){
  const d = String(input||'').replace(/\D/g,'');
  if (d.length===10) return '+1'+d;
  if (d.length===11 && d.startsWith('1')) return '+'+d;
  if (/^\+\d{10,15}$/.test(input||'')) return input;
  return null;
}
export function json(body, status=200, headers={}){
  return new Response(JSON.stringify(body,null,2),{status,headers:{'content-type':'application/json; charset=UTF-8',...headers}});
}
export const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,X-ADMIN-KEY','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'};
