import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFile,readdir}from'node:fs/promises';import worker from '../portal/worker.mjs';import {parseRows,workbook,activeRows,parseWorkbook}from'../portal/data.mjs';import {PDFDocument}from'pdf-lib';
const origin='https://example.test';
function runtime(sql){const db=new DatabaseSync(':memory:');db.exec(sql);const wrap=(sql,args=[])=>({bind(...a){return wrap(sql,a)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){db.prepare(sql).run(...args);return {success:true}}});const map=new Map();return {DB:{prepare:wrap,async batch(stmts){db.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}},BUCKET:{async put(k,v){map.set(k,new Uint8Array(v))},async get(k){return map.has(k)?{body:map.get(k)}:null},async delete(k){map.delete(k)}},LIFE_SETUP_KEY:'test-bootstrap-key'};}
const sample={item:'1',name:'PESSOA DE TESTE',cpf:'11144477735',birth:'1980-04-20',marital:'Não informado',relationship:'Titular',holderCpf:'',group:'Teste',death:50000,iea:50000,ipa:100000,ifpd:50000,funeral:10000,funeralType:'Familiar',cost:20,start:'2026-09-01',end:''};
test('complete secure monthly workflow',async()=>{const env=runtime((await Promise.all((await readdir(new URL('../drizzle/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort().map(n=>readFile(new URL('../drizzle/'+n,import.meta.url),'utf8')))).join('\n'));let adminCookie='',rhCookie='';
 async function call(path,{method='GET',body,cookie=adminCookie,headers={}}={}){return worker.fetch(new Request(origin+'/api/vida'+path,{method,headers:{origin,...(cookie?{cookie}:{}),...(body&&!(body instanceof FormData)?{'content-type':'application/json'}:{}),...headers},body:body instanceof FormData?body:body?JSON.stringify(body):undefined}),env);}
 let r=await call('/policies');assert.equal(r.status,401);
 r=await call('/bootstrap',{method:'POST',body:{password:'test-initial-password'},headers:{'x-setup-key':'test-bootstrap-key'}});assert.equal(r.status,201);
 await env.DB.batch([
  env.DB.prepare('INSERT INTO life_companies VALUES(?,?,?,?)').bind('benvenho','EMPRESA FICTÍCIA DE TESTE','00000000000000',new Date().toISOString()),
  env.DB.prepare('INSERT INTO life_policies VALUES(?,?,?,?,?,?,?,?)').bind('benvenho-2026','benvenho','SEGURADORA DE TESTE',null,'2026-09-01',null,'','{}')
 ]);
 r=await call('/login',{method:'POST',body:{username:'originalli',password:'wrong'}});assert.equal(r.status,401);
 r=await call('/login',{method:'POST',body:{username:'originalli',password:'test-initial-password'}});assert.equal(r.status,200);adminCookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
 assert.equal((await call('/policies')).status,403);
 assert.equal((await call('/password',{method:'POST',body:{current:'test-initial-password',password:'test-permanent-password'}})).status,200);
 assert.equal((await call('/policies')).status,401);
 r=await call('/login',{method:'POST',body:{username:'originalli',password:'test-permanent-password'}});adminCookie=r.headers.get('set-cookie').split(';')[0];
 const companies=await (await call('/policies')).json();assert.equal(companies[0].start,'2026-09-01');assert.equal(companies[0].number,null);
 const q='?policy=benvenho-2026&month=2026-09';assert.equal((await call('/export'+q+'&format=xlsx')).status,409);
 r=await call('/users',{method:'POST',body:{name:'RH Teste',username:'rh@example.test',companyId:'benvenho',role:'rh'}});const rh=await r.json();assert.ok(rh.password);
 r=await call('/login',{method:'POST',body:{username:rh.username,password:rh.password}});rhCookie=r.headers.get('set-cookie').split(';')[0];
 await call('/password',{method:'POST',cookie:rhCookie,body:{current:rh.password,password:'rh-new-password-test'}});
 r=await call('/login',{method:'POST',body:{username:rh.username,password:'rh-new-password-test'}});rhCookie=r.headers.get('set-cookie').split(';')[0];
 const second=await (await call('/policy',{method:'POST',body:{name:'OUTRA EMPRESA TESTE',cnpj:'123',insurer:'TESTE',start:'2026-09-01'}})).json();assert.equal((await call('/month?policy='+second.id+'&month=2026-09',{cookie:rhCookie})).status,404);
 assert.equal((await call('/users',{cookie:rhCookie})).status,403);

 assert.equal((await call('/deadlines'+q,{method:'POST',cookie:rhCookie,body:{rhDay:5,technicalDay:10,reminderDays:3}})).status,403);
 assert.equal((await call('/deadlines'+q,{method:'POST',body:{rhDay:5,technicalDay:10,reminderDays:3}})).status,200);
 let monitor=await (await call('/monitor?month=2026-09',{cookie:rhCookie})).json();assert.equal(monitor.rows.length,1);assert.equal(monitor.rows[0].rhDue,'2026-09-05');assert.equal(monitor.rows[0].rhStatus,'Em atraso');
 assert.equal((await call('/monitor?month=2026-09&format=xlsx',{cookie:rhCookie})).status,403);
 assert.equal((await call('/monitor?month=2026-09&format=pdf')).status,200);
 assert.equal((await call('/permissions',{cookie:rhCookie})).status,403);
 assert.equal((await call('/transmission'+q,{method:'POST',body:{fileId:'missing',protocol:'TEST',sentAt:'2026-09-10'}})).status,400);

 const permissionUsers=await (await call('/permissions')).json();const rhId=permissionUsers.users.find(u=>u.role==='rh').id;
 assert.equal((await call('/permissions',{method:'POST',body:{id:rhId,role:'consulta',companies:['benvenho'],permissions:['roster']}})).status,200);
 assert.equal((await call('/me',{cookie:rhCookie})).status,401);
 r=await call('/login',{method:'POST',body:{username:rh.username,password:'rh-new-password-test'}});rhCookie=r.headers.get('set-cookie').split(';')[0];
 assert.equal((await call('/export'+q+'&format=xlsx&template=1',{cookie:rhCookie})).status,403);
 assert.equal((await call('/permissions',{method:'POST',body:{id:rhId,role:'rh',companies:['benvenho'],permissions:['roster','download','movement','export']}})).status,200);
 r=await call('/login',{method:'POST',body:{username:rh.username,password:'rh-new-password-test'}});rhCookie=r.headers.get('set-cookie').split(';')[0];
 const proof=new FormData();proof.set('file',new File(['%PDF-1.7 test'],'comprovante.pdf'));proof.set('kind','envio');const uploaded=await (await call('/upload'+q,{method:'POST',body:proof})).json();
 assert.equal((await call('/transmission'+q,{method:'POST',body:{fileId:uploaded.id,protocol:'TESTE-ENVIO',sentAt:'2026-09-10'}})).status,200);
 monitor=await (await call('/monitor?month=2026-09')).json();assert.equal(monitor.rows.find(r=>r.id==='benvenho-2026').technicalStatus,'Concluído');
 const rows=parseRows([sample],'2026-09');const bytes=workbook(rows,companies[0],'2026-09');assert.deepEqual(parseWorkbook(new Uint8Array(bytes),'2026-09'),rows);
 const form=new FormData();form.set('file',new File([bytes],'teste.xlsx'));form.set('kind','movimentacao');r=await call('/upload'+q,{method:'POST',cookie:rhCookie,body:form});assert.equal(r.status,201);const file=await r.json();assert.ok(file.id);
 const pdfForm=new FormData();pdfForm.set('file',new File(['%PDF-1.7 test'],'boleto.pdf'));pdfForm.set('kind','boleto');assert.equal((await call('/upload'+q,{method:'POST',cookie:rhCookie,body:pdfForm})).status,403);
 const approve={id:file.id,status:'Confirmado',note:'Teste conferido',confirmation:true,previousSnapshot:''};assert.equal((await call('/review'+q,{method:'POST',cookie:rhCookie,body:approve})).status,403);
 assert.equal((await call('/review'+q,{method:'POST',body:approve})).status,400);
 await call('/policy',{method:'POST',body:{id:'benvenho-2026',number:'APOLICE-TESTE',notes:'Teste'}});
 assert.equal((await call('/review'+q,{method:'POST',body:approve})).status,200);
 const month=await (await call('/month'+q,{cookie:rhCookie})).json();assert.equal(month.rows.length,1);assert.equal(month.rows[0].cpf,sample.cpf);
 r=await call('/export'+q+'&format=pdf',{cookie:rhCookie});assert.equal(r.status,200);const pdf=await r.arrayBuffer();assert.ok((await PDFDocument.load(pdf)).getPageCount());
 r=await call('/export'+q+'&format=xlsx',{cookie:rhCookie});assert.equal(r.status,200);assert.equal(parseWorkbook(new Uint8Array(await r.arrayBuffer()),'2026-09').length,1);
 assert.equal((await call('/download?policy='+second.id+'&month=2026-09&id='+file.id,{cookie:rhCookie})).status,404);
 assert.equal((await call('/logout',{method:'POST',cookie:rhCookie,headers:{origin:'https://attacker.test'},body:{}})).status,403);
 assert.equal((await call('/month?policy=benvenho-2026&month=2026-08')).status,400);
 assert.equal((await call('/bootstrap',{method:'POST',body:{password:'another-long-password'},headers:{'x-setup-key':'test-bootstrap-key'}})).status,409);
});
test('reject invalid and duplicated data; preserve missing money',()=>{assert.throws(()=>parseRows([{...sample,cpf:'11111111111'}],'2026-09'));assert.throws(()=>parseRows([sample,sample],'2026-09'));assert.throws(()=>parseRows([{...sample,relationship:'Filho',holderCpf:'123'}],'2026-09'));assert.equal(parseRows([{...sample,cost:''}],'2026-09')[0].cost,null);assert.equal(activeRows([{...sample,end:'2026-08-31'}],'2026-09').length,0);});
