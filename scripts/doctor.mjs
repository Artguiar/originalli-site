import {access, readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root, publicDir} from '../server/paths.mjs';
import {loadConfig} from '../server/config.mjs';

const config = loadConfig();
let failures = 0;
async function check(label, operation) {
  try { await operation(); console.log('OK:',label); }
  catch (error) { failures++; console.error('FALHA:',label,'—',error.message); }
}
await check('Node.js 24.12 ou superior na linha 24', () => {
  const [major,minor] = process.versions.node.split('.').map(Number);
  if (major !== 24 || minor < 12) throw new Error('Use Node.js 24 LTS, versão 24.12 ou superior.');
});
await check('SQLite nativo disponível', async () => { const {DatabaseSync} = await import('node:sqlite'); const db = new DatabaseSync(':memory:'); db.close(); });
await check('Dependências do portal', async () => { await Promise.all(['pdf-lib','xlsx','fflate','esbuild','drizzle-orm'].map(name=>import(name))); });
await check('Página inicial e assets', async () => { await Promise.all(['index.html','styles.css','app.js','assets/originalli-logo.svg','vida-grupo/index.html'].map(name=>access(join(publicDir,name)))); });
await check('Migrações SQL', async () => { if (!(await readdir(join(root,'drizzle'))).some(name=>name.endsWith('.sql'))) throw new Error('Sem migrações'); });
await check('Referências locais das páginas', async () => {
  async function walk(directory) {
    for (const entry of await readdir(directory,{withFileTypes:true})) {
      const path = join(directory,entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.html')) {
        const text = await readFile(path,'utf8');
        for (const match of text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
          const url = new URL(match[1], 'http://local/' + path.slice(publicDir.length+1).replaceAll('\\','/'));
          if (url.origin !== 'http://local') continue;
          await access(join(publicDir,decodeURIComponent(url.pathname)));
        }
      }
    }
  }
  await walk(publicDir);
});
console.log(`Ambiente: ${config.production?'produção':'desenvolvimento'} | ${config.origin}`);
console.log(`CRM: ${process.env.CRM_WEBHOOK_URL ? 'endpoint configurado; validar contrato antes de enviar' : 'envio desativado; aguardando contrato da API'}`);
if (failures) process.exitCode = 1;
