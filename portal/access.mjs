export const capabilities=['roster','download','movement','documents','billing','review','send','audit','export'];
export const profiles={admin:capabilities,gestor:capabilities,tecnico:['roster','download','movement','documents','review','send','audit','export'],financeiro:['download','billing','audit'],auditor:['roster','download','audit','export'],rh:['roster','download','movement','export'],consulta:['roster','download','export']};
export async function access(env,u){const row=await env.DB.prepare('SELECT config FROM life_permissions WHERE user_id=?').bind(u.id).first();const c=row?JSON.parse(row.config):{};return {...u,permissions:u.role==='admin'?capabilities:(c.permissions||profiles[u.role]||[]),companies:u.role==='admin'?null:(c.companies||[u.company_id].filter(Boolean))};}
export function can(u,p){return u.role==='admin'||u.permissions?.includes(p);}
export function requirePermission(u,p){if(!can(u,p))throw Object.assign(Error('Seu perfil não permite esta operação.'),{status:403});}
export function inScope(u,p){return u.role==='admin'||u.companies?.includes(p.company_id);}
export function visibleFile(u,f){return ['fatura','boleto'].includes(f.kind)?can(u,'billing')||can(u,'roster'):can(u,'roster');}
