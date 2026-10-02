const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const encoder = new TextEncoder();
const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), byte => byte.toString(16).padStart(2,'0')).join('');
const fipeCache = new Map();

async function rateLimit(request, env, namespace, limit) {
  const now = Date.now();
  const key = await digest(namespace + ':' + (request.headers.get('cf-connecting-ip') || 'unknown'));
  const row = await env.DB.prepare(`INSERT INTO site_rate_limits(key,count,expires) VALUES(?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END,
    expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count`).bind(key,now+600000,now,now).first();
  await env.DB.prepare('DELETE FROM site_rate_limits WHERE expires<=?').bind(now).run();
  return row.count <= limit;
}

async function receiveLead(request, env) {
  if (request.method !== 'POST') return json({error:'Método não permitido.'},405,{Allow:'POST'});
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) return json({error:'Origem inválida.'},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'Envie JSON.'},415);
  if (!env.DB) return json({error:'Atendimento indisponível no momento.'},503);
  if (!await rateLimit(request,env,'leads',10)) return json({error:'Muitas solicitações. Aguarde alguns minutos.'},429,{'Retry-After':'600'});
  if (Number(request.headers.get('content-length') || 0) > 16384) return json({error:'Solicitação muito grande.'},413);
  const text = await request.text();
  if (text.length > 16384) return json({error:'Solicitação muito grande.'},413);
  let body;
  try { body = JSON.parse(text); } catch { return json({error:'Dados inválidos.'},400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'Dados inválidos.'},400);
  if (body.website) return json({ok:true,id:crypto.randomUUID()},201);
  const fields = {name:120,phone:30,profile:80,interest:160,city:120,page:300};
  const lead = {};
  for (const [field, max] of Object.entries(fields)) {
    if (typeof body[field] !== 'string' || body[field].trim().length > max) return json({error:'Verifique os campos da solicitação.'},400);
    lead[field] = body[field].trim();
  }
  if (lead.name.length < 2 || !/^\+?[\d\s().-]+$/.test(lead.phone) || !/^\d{10,13}$/.test(lead.phone.replace(/\D/g,'')) || !lead.interest || !lead.profile) return json({error:'Informe nome, telefone válido, perfil e interesse.'},400);
  if (body.consent !== true) return json({error:'Autorize o contato para continuar.'},400);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId || '')) return json({error:'Identificador inválido. Atualize a página.'},400);
  const attribution = {};
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
    if (typeof body.attribution?.[key] === 'string') attribution[key] = body.attribution[key].slice(0,200);
  }
  const hash = await digest(JSON.stringify({...lead,attribution,consent:true}));
  const existing = await env.DB.prepare('SELECT id,payload_hash FROM site_leads WHERE request_id=?').bind(body.requestId).first();
  if (existing) return existing.payload_hash === hash ? json({ok:true,id:existing.id},201) : json({error:'Atualize a página para enviar uma nova solicitação.'},409);
  const id = crypto.randomUUID(), created = new Date().toISOString();
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO site_leads(id,request_id,payload_hash,name,phone,profile,interest,city,page,attribution,consent_version,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,body.requestId,hash,lead.name,lead.phone,lead.profile,lead.interest,lead.city,lead.page,JSON.stringify(attribution),'contact-v1',created),
      env.DB.prepare('INSERT INTO site_outbox(id,lead_id,next_attempt) VALUES(?,?,?)').bind(crypto.randomUUID(),id,created)
    ]);
  } catch (error) {
    // A concurrent retry may have committed the same request first.
    const duplicate = await env.DB.prepare('SELECT id,payload_hash FROM site_leads WHERE request_id=?').bind(body.requestId).first();
    if (duplicate?.payload_hash === hash) return json({ok:true,id:duplicate.id},201);
    throw error;
  }
  return json({ok:true,id},201);
}

async function fipe(request, env) {
  if (request.method !== 'GET') return json({error:'Método não permitido.'},405,{Allow:'GET'});
  const path = new URL(request.url).pathname.slice('/api/fipe/'.length);
  if (!/^(carros|motos|caminhoes)\/marcas(?:\/\d+\/modelos(?:\/\d+\/anos(?:\/(?:\d{4}|32000)-[123])?)?)?$/.test(path)) return json({error:'Consulta inválida.'},400);
  if (!env.DB) return json({error:'Consulta indisponível.'},503);
  if (!await rateLimit(request,env,'fipe',120)) return json({error:'Limite de consultas atingido.'},429,{'Retry-After':'600'});
  const cached = fipeCache.get(path);
  if (cached && cached.expires > Date.now()) return json(cached.data,200,{'Cache-Control':'public, max-age=300'});
  try {
    const response = await (env.FETCH || fetch)('https://parallelum.com.br/fipe/api/v1/' + path, {signal:AbortSignal.timeout(8000),redirect:'error',headers:{Accept:'application/json'}});
    if (!response.ok) return json({error:'Consulta FIPE indisponível.'},502);
    const data = await response.json();
    if (!data || typeof data !== 'object') return json({error:'Resposta FIPE inválida.'},502);
    if (fipeCache.size >= 256) fipeCache.delete(fipeCache.keys().next().value);
    fipeCache.set(path,{data,expires:Date.now()+3600000});
    return json(data,200,{'Cache-Control':'public, max-age=300'});
  } catch { return json({error:'Consulta FIPE indisponível no momento.'},502); }
}

export async function publicAPI(request, env) {
  const path = new URL(request.url).pathname;
  if (path === '/api/leads') return receiveLead(request,env);
  if (path.startsWith('/api/fipe/')) return fipe(request,env);
  return null;
}
