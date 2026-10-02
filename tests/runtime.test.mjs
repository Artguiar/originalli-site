import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root,within} from '../server/paths.mjs';
import {openDatabase} from '../server/database.mjs';
import {fileStorage} from '../server/storage.mjs';
import {startServer} from '../server/index.mjs';
import {passwordHash} from '../portal/worker.mjs';

async function temporary(t) {
  const base = within(root,'.cache','tests'); await mkdir(base,{recursive:true});
  const directory = await mkdtemp(join(base,'runtime-'));
  t.after(()=>rm(within(base,directory),{recursive:true,force:true}));
  return directory;
}

test('database survives restart and migrations do not run twice; failed batch rolls back', async t => {
  const directory = await temporary(t), path = join(directory,'data.sqlite');
  let DB = await openDatabase(path);
  await DB.prepare('INSERT INTO life_companies VALUES(?,?,?,?)').bind('persisted','TEST','000',new Date().toISOString()).run();
  const migrations = (await DB.prepare('SELECT count(*) n FROM app_migrations').first()).n;
  await assert.rejects(()=>DB.batch([
    DB.prepare('INSERT INTO life_companies VALUES(?,?,?,?)').bind('rolled-back','TEST','000','test'),
    DB.prepare('INSERT INTO life_companies VALUES(?,?,?,?)').bind('persisted','DUPLICATE','000','test')
  ]));
  assert.equal(await DB.prepare('SELECT id FROM life_companies WHERE id=?').bind('rolled-back').first(),null);
  DB.close();DB = await openDatabase(path);
  try { assert.equal((await DB.prepare('SELECT count(*) n FROM app_migrations').first()).n,migrations);assert.equal((await DB.prepare('SELECT name FROM life_companies WHERE id=?').bind('persisted').first()).name,'TEST'); }
  finally { DB.close(); }
});

test('documents survive restart and storage refuses traversal', async t => {
  const directory = await temporary(t), key = 'life/company/policy/document';
  await fileStorage(directory).put(key,new Uint8Array([1,2,3]));
  assert.deepEqual(Array.from((await fileStorage(directory).get(key)).body),[1,2,3]);
  await assert.rejects(()=>fileStorage(directory).put('../../escape',new Uint8Array([1])),/Chave/);
  await fileStorage(directory).delete(key);
  assert.equal(await fileStorage(directory).get(key),null);
});

test('HTTP server serves real pages, protects private files and accepts local portal login', async t => {
  const directory = await temporary(t), DB = await openDatabase(join(directory,'app.sqlite'));
  await DB.prepare('INSERT INTO life_users VALUES(?,?,?,?,?,?,?,?)').bind('admin','test@example.test','Test admin',null,'admin',await passwordHash('a-long-test-password'),0,1).run();
  const app = await startServer({config:{production:false,host:'127.0.0.1',port:0,origin:'http://localhost:0'},database:DB,storage:fileStorage(directory)});
  try {
    const origin = 'http://127.0.0.1:'+app.server.address().port;
    const home = await fetch(origin+'/');assert.equal(home.status,200);assert.match(await home.text(),/Originalli/);
    assert.equal((await fetch(origin+'/quem-somos/')).status,200);
    assert.equal((await fetch(origin+'/assets/originalli-logo.svg')).status,200);
    assert.equal((await fetch(origin+'/.data/originalli.sqlite')).status,404);
    assert.equal((await fetch(origin+'/.env')).status,404);
    assert.equal((await fetch(origin+'/api/unknown')).status,404);
    const head = await fetch(origin+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
    const login = await fetch(origin+'/api/vida/login',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({username:'test@example.test',password:'a-long-test-password'})});
    assert.equal(login.status,200);const cookie = login.headers.get('set-cookie');
    assert.match(cookie,/originalli_vida_dev=/);assert.doesNotMatch(cookie,/Secure/);assert.match(cookie,/HttpOnly/);
    const me = await fetch(origin+'/api/vida/me',{headers:{cookie:cookie.split(';')[0]}});assert.equal(me.status,200);assert.equal((await me.json()).role,'admin');
    assert.deepEqual(await (await fetch(origin+'/api/health')).json(),{ok:true,service:'originalli'});
    const blocked = await fetch(origin+'/api/vida/login',{method:'POST',headers:{origin:'https://attacker.test','Content-Type':'application/json'},body:'{}'});assert.equal(blocked.status,403);
    assert.equal((await readFile(join(directory,'app.sqlite'))).length > 0,true);
  } finally { await app.close();DB.close(); }
});
