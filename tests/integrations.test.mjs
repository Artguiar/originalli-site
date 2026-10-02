import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/database.mjs';
import worker, {passwordHash} from '../portal/worker.mjs';
import {publicAPI} from '../integrations/public-api.mjs';
import {dispatchCRM} from '../integrations/crm.mjs';

const origin = 'https://example.test';
function lead(overrides = {}) {
  return {requestId:crypto.randomUUID(),name:'Pessoa de teste',phone:'(43) 99999-1234',profile:'Pessoa física',interest:'Seguro residencial',city:'Londrina/PR',page:'/contato/',attribution:{utm_source:'test'},consent:true,...overrides};
}
function request(body, headers = {}) {
  return new Request(origin+'/api/leads',{method:'POST',headers:{origin,'Content-Type':'application/json','cf-connecting-ip':'test-ip',...headers},body:JSON.stringify(body)});
}

test('lead is persisted once with consent, and queued atomically for existing CRM', async t => {
  const DB = await openDatabase(':memory:'); t.after(()=>DB.close());
  const env = {DB}; const payload = lead();
  assert.equal((await publicAPI(request({...payload,consent:false}),env)).status,400);
  assert.equal((await publicAPI(request(payload,{origin:'https://another.test'}),env)).status,403);
  assert.equal((await publicAPI(request({...payload,phone:'abc1234567890'}),env)).status,400);
  const response = await publicAPI(request(payload),env);
  assert.equal(response.status,201); const first = await response.json();
  assert.deepEqual(await (await publicAPI(request(payload),env)).json(),first);
  assert.equal((await publicAPI(request({...payload,name:'Different person'}),env)).status,409);
  assert.equal((await DB.prepare('SELECT count(*) n FROM site_leads').first()).n,1);
  assert.equal((await DB.prepare('SELECT count(*) n FROM site_outbox').first()).n,1);
  let sent = 0;
  assert.deepEqual(await dispatchCRM(env,{transport:()=>{sent++;throw Error('Must not call');}}),{configured:false,delivered:0,failed:0});
  assert.equal(sent,0);
  assert.equal((await worker.fetch(new Request(origin+'/api/vida/leads'),{DB,BUCKET:{}})).status,401);
});

test('CRM retries failures, claims jobs, and sends a stable idempotency key', async t => {
  const DB = await openDatabase(':memory:'); t.after(()=>DB.close());
  const env = {DB};
  await publicAPI(request(lead()),env);
  const before = await DB.prepare('SELECT * FROM site_outbox').first();
  const failed = await dispatchCRM(env,{url:'https://crm.example.test/leads',transport:async()=>new Response(null,{status:503})});
  assert.equal(failed.failed,1);
  let job = await DB.prepare('SELECT * FROM site_outbox').first();
  assert.equal(job.status,'pending');assert.equal(job.attempts,1);assert.equal(job.last_error,'HTTP 503');
  assert.ok(job.next_attempt > new Date().toISOString());
  await DB.prepare('UPDATE site_outbox SET next_attempt=?').bind('2000-01-01T00:00:00.000Z').run();
  const success = await dispatchCRM(env,{url:'https://crm.example.test/leads',token:'fake-token',transport:async(url,options)=>{
    assert.equal(url.hostname,'crm.example.test');assert.equal(options.headers['Idempotency-Key'],before.id);
    assert.equal(options.headers.Authorization,'Bearer fake-token');
    const payload = JSON.parse(options.body);assert.equal(payload.event,'lead.created');assert.equal(payload.lead.name,'Pessoa de teste');
    return new Response(null,{status:204});
  }});
  assert.equal(success.delivered,1);
  job = await DB.prepare('SELECT * FROM site_outbox').first();assert.equal(job.status,'delivered');assert.equal(job.attempts,2);
  assert.equal((await dispatchCRM(env,{url:'https://crm.example.test/leads',transport:async()=>{throw Error('Must not resend');}})).delivered,0);
  await assert.rejects(()=>dispatchCRM(env,{url:'http://crm.example.test'}),/HTTPS/);
});

test('public endpoint rejects malformed bodies and limits requests', async t => {
  const DB = await openDatabase(':memory:'); t.after(()=>DB.close());
  const env = {DB};
  assert.equal((await publicAPI(request(null),env)).status,400);
  assert.equal((await publicAPI(new Request(origin+'/api/leads'),env)).status,405);
  for (let index=0;index<9;index++) assert.equal((await publicAPI(request(lead({website:'bot-filled'})),env)).status,201);
  assert.equal((await publicAPI(request(lead()),env)).status,429);
  assert.equal((await DB.prepare('SELECT count(*) n FROM site_leads').first()).n,0);
});

test('FIPE proxy allows only known paths, caches results and handles provider failure', async t => {
  const DB = await openDatabase(':memory:'); t.after(()=>DB.close());
  let calls = 0;
  const env = {DB,FETCH:async url=>{calls++;assert.equal(url,'https://parallelum.com.br/fipe/api/v1/carros/marcas');return Response.json([{codigo:'1',nome:'Marca de teste'}]);}};
  const query = new Request(origin+'/api/fipe/carros/marcas');
  assert.equal((await publicAPI(query,env)).status,200);
  assert.equal((await publicAPI(query,env)).status,200);assert.equal(calls,1);
  assert.equal((await publicAPI(new Request(origin+'/api/fipe/https://attacker.test'),env)).status,400);
  assert.equal((await publicAPI(new Request(origin+'/api/fipe/motos/marcas'),{DB,FETCH:async()=>{throw Error('timeout');}})).status,502);
});

test('only authenticated administrator can inspect CRM queue', async t => {
  const DB = await openDatabase(':memory:'); t.after(()=>DB.close());
  const env = {DB,BUCKET:{}};
  await publicAPI(request(lead()),env);
  await DB.prepare('INSERT INTO life_users VALUES(?,?,?,?,?,?,?,?)').bind('admin','admin@example.test','Test admin',null,'admin',await passwordHash('a-long-test-password'),0,1).run();
  const login = await worker.fetch(new Request(origin+'/api/vida/login',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({username:'admin@example.test',password:'a-long-test-password'})}),env);
  assert.equal(login.status,200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const response = await worker.fetch(new Request(origin+'/api/vida/leads',{headers:{cookie}}),env);
  assert.equal(response.status,200);assert.equal((await response.json()).leads[0].crm_status,'pending');
});
