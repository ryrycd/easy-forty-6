export function requireAdmin(request, env){
  const k1 = request.headers.get('X-ADMIN-KEY') || '';
  const k2 = request.headers.get('X-Admin-Key') || '';
  const k = k1 || k2;
  if (!k || k !== env.ADMIN_KEY) throw new Error('unauthorized');
}