import {loadEnvFile} from 'node:process';
import {join} from 'node:path';
import {root} from './paths.mjs';

export function loadConfig() {
  try { loadEnvFile(join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const production = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT precisa estar entre 1 e 65535.');
  const host = process.env.HOST || '127.0.0.1';
  const origin = process.env.APP_ORIGIN || `http://localhost:${port}`;
  const parsed = new URL(origin);
  if (production && parsed.protocol !== 'https:') throw new Error('Produção exige APP_ORIGIN com HTTPS e proxy reverso.');
  if (!production && !['127.0.0.1','localhost','::1'].includes(host)) throw new Error('Desenvolvimento deve escutar somente em loopback.');
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error('APP_ORIGIN precisa ser uma origem HTTP(S), sem caminho.');
  return {production, port, host, origin};
}
