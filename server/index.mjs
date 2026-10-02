import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import worker from '../portal/worker.mjs';
import {loadConfig} from './config.mjs';
import {openDatabase} from './database.mjs';
import {fileStorage} from './storage.mjs';
import {staticAssets} from './static.mjs';

export async function startServer({config = loadConfig(), database, storage, assets} = {}) {
  const DB = database || await openDatabase();
  const env = {DB, BUCKET: storage || fileStorage(), ASSETS: assets || staticAssets(),
    LOCAL_DEV: !config.production, LIFE_SETUP_KEY: process.env.LIFE_SETUP_KEY};
  const allowedHosts = new Set([new URL(config.origin).host]);
  if (!config.production) { allowedHosts.add(`localhost:${config.port}`); allowedHosts.add(`127.0.0.1:${config.port}`); }
  const server = createServer(async (incoming, outgoing) => {
    try {
      if (!allowedHosts.has(incoming.headers.host)) { outgoing.writeHead(400); outgoing.end('Host inválido'); return; }
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      // Never trust browser-supplied proxy headers for rate limiting in the local adapter.
      headers.set('cf-connecting-ip', incoming.socket.remoteAddress || 'unknown');
      const chunks = [];
      let length = 0;
      for await (const chunk of incoming) {
        length += chunk.length;
        if (length > 11 * 1024 * 1024) { outgoing.writeHead(413); outgoing.end('Arquivo muito grande'); return; }
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);
      const requestOrigin = config.production ? config.origin : 'http://' + incoming.headers.host;
      const url = new URL(incoming.url, requestOrigin);
      if (url.origin !== requestOrigin) { outgoing.writeHead(400); outgoing.end('URL inválida'); return; }
      const request = new Request(url, {method:incoming.method, headers,
        ...(!['GET','HEAD'].includes(incoming.method) && body.length ? {body} : {})});
      const response = url.pathname === '/api/health' && request.method === 'GET'
        ? new Response(JSON.stringify({ok:true, service:'originalli'}), {headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})
        : await worker.fetch(request, env);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (incoming.method === 'HEAD' || !response.body) outgoing.end();
      else await pipeline(Readable.fromWeb(response.body), outgoing);
    } catch (error) {
      console.error('Falha na requisição:', error.message);
      if (!outgoing.headersSent) { outgoing.writeHead(500, {'Content-Type':'application/json'}); outgoing.end('{"error":"Falha interna no servidor."}'); }
      else outgoing.destroy();
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port, config.host, resolve); });
  if (!config.production) {
    allowedHosts.add(`localhost:${server.address().port}`);
    allowedHosts.add(`127.0.0.1:${server.address().port}`);
  }
  return {server, DB, async close() { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); if (!database) DB.close(); }};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  const app = await startServer({config});
  console.log(`Originalli: ${config.origin}\nPortal: ${config.origin}/vida-grupo/\nBanco e documentos persistentes em .data/`);
  if (!(await app.DB.prepare('SELECT id FROM life_users LIMIT 1').first())) console.log('Primeiro acesso: execute npm.cmd run setup em outro terminal.');
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
}
