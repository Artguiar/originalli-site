// This adapter sends no traffic until a real endpoint is explicitly configured.
// crmoriginalli.vercel.app is the application URL, not a verified API endpoint.
export async function dispatchCRM(env, {url, token, transport = fetch, limit = 20} = {}) {
  if (!url) return {configured:false,delivered:0,failed:0};
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('CRM_WEBHOOK_URL exige HTTPS, sem credenciais na URL.');
  const result = {configured:true,delivered:0,failed:0};
  const now = new Date().toISOString();
  const jobs = (await env.DB.prepare(`SELECT id FROM site_outbox WHERE
    (status='pending' AND next_attempt<=?) OR (status='processing' AND locked_until<=?)
    ORDER BY next_attempt LIMIT ?`).bind(now,now,Math.min(Math.max(limit,1),100)).all()).results;
  for (const job of jobs) {
    const started = new Date().toISOString(), lock = new Date(Date.now()+60000).toISOString();
    const claimed = await env.DB.prepare(`UPDATE site_outbox SET status='processing',locked_until=?,attempts=attempts+1
      WHERE id=? AND ((status='pending' AND next_attempt<=?) OR (status='processing' AND locked_until<=?)) RETURNING *`).bind(lock,job.id,started,started).first();
    if (!claimed) continue;
    try {
      const lead = await env.DB.prepare('SELECT id,name,phone,profile,interest,city,page,attribution,consent_version,created FROM site_leads WHERE id=?').bind(claimed.lead_id).first();
      const response = await transport(endpoint, {method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),
        headers:{'Content-Type':'application/json','Idempotency-Key':claimed.id,...(token ? {Authorization:'Bearer '+token} : {})},
        body:JSON.stringify({event:'lead.created',version:1,id:claimed.id,lead:{...lead,attribution:JSON.parse(lead.attribution)}})});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.body?.cancel();
      await env.DB.prepare("UPDATE site_outbox SET status='delivered',delivered_at=?,locked_until=NULL,last_error=NULL WHERE id=? AND locked_until=?").bind(new Date().toISOString(),claimed.id,lock).run();
      result.delivered++;
    } catch (error) {
      const message = /^HTTP \d{3}$/.test(error.message) ? error.message : 'Falha de conexão com CRM';
      await env.DB.prepare('UPDATE site_outbox SET status=?,next_attempt=?,locked_until=NULL,last_error=? WHERE id=? AND locked_until=?').bind(
        claimed.attempts >= 5 ? 'failed' : 'pending',new Date(Date.now()+Math.min(3600000,60000 * 2 ** claimed.attempts)).toISOString(),message,claimed.id,lock).run();
      result.failed++;
    }
  }
  return result;
}
