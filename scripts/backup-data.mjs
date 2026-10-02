import {mkdir, cp, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {backup} from 'node:sqlite';
import {openDatabase} from '../server/database.mjs';
import {dataDir, root} from '../server/paths.mjs';

// Stop the server first so the document snapshot and SQL snapshot are consistent.
const destination = join(root,'..','backups','data-'+new Date().toISOString().replaceAll(/[:.]/g,'-'));
await mkdir(destination,{recursive:true});
const DB = await openDatabase();
try {
  await backup(DB.sqlite,join(destination,'originalli.sqlite'));
  await cp(join(dataDir,'documents'),join(destination,'documents'),{recursive:true}).catch(error=>{if(error.code!=='ENOENT')throw error;});
  await writeFile(join(destination,'README.txt'),'Backup privado. Restaurar banco e documents em .data/ com o servidor parado. Não publicar nem versionar.\n');
  console.log('Backup criado:',destination);
} finally { DB.close(); }
