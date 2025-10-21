export function normalizeUS(input){
  const d = String(input||'').replace(/\D/g,'');
  if (d.length===10) return '+1'+d;
  if (d.length===11 && d.startsWith('1')) return '+'+d;
  if (/^\+\d{10,15}$/.test(input||'')) return input;
  return null;
}
export function maskPhone(e164){
  return (e164||'').replace(/^(\+\d{0,2})(\d{3})(\d{2,})(\d{2})$/, (m,a,b,c,d)=>a+' '+b+'…'+d);
}
export function json(body, status=200, headers={}){
  return new Response(JSON.stringify(body,null,2),{status,headers:{'content-type':'application/json; charset=UTF-8',...headers}});
}
export const CORS = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'Content-Type,X-ADMIN-KEY',
  'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'
};
export const ok = (msg='ok') => json({ok:true,msg});
export function isStopWord(t){ return /\b(stop|unsubscribe|cancel)\b/i.test(t||''); }
export function isHelpWord(t){ return /\bhelp\b/i.test(t||''); }
