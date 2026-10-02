import {openDatabase} from '../server/database.mjs';
const DB = await openDatabase();
try { console.log('Banco atualizado. Migrações aplicadas:', (await DB.prepare('SELECT name,applied_at FROM app_migrations ORDER BY name').all()).results); }
finally { DB.close(); }
