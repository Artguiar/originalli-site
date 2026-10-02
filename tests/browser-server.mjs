// Manual browser verification only. Never use this account in the real database.
import {openDatabase} from '../server/database.mjs';
import {startServer} from '../server/index.mjs';
import {passwordHash} from '../portal/worker.mjs';

const DB = await openDatabase(':memory:');
await DB.prepare('INSERT INTO life_users VALUES(?,?,?,?,?,?,?,?)').bind('browser-admin','browser@example.test','Administrador de teste',null,'admin',await passwordHash('browser-initial-password'),1,1).run();
const files = new Map();
const storage = {async put(key,bytes){files.set(key,new Uint8Array(bytes));},async get(key){return files.has(key)?{body:files.get(key)}:null;},async delete(key){files.delete(key);}};
const app = await startServer({config:{production:false,host:'127.0.0.1',port:3001,origin:'http://localhost:3001'},database:DB,storage});
console.log('Servidor de teste em http://localhost:3001 — banco e documentos apenas em memória.');
for (const signal of ['SIGINT','SIGTERM']) process.once(signal,async()=>{await app.close();DB.close();process.exit(0);});
