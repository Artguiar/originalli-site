import {fileURLToPath} from 'node:url';
import {resolve, relative, isAbsolute} from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const publicDir = resolve(root, 'public');
export const dataDir = resolve(root, '.data');
export const migrationsDir = resolve(root, 'drizzle');

export function within(base, ...parts) {
  const target = resolve(base, ...parts);
  const path = relative(base, target);
  if (path.startsWith('..') || isAbsolute(path)) throw new Error('Caminho fora da pasta permitida.');
  return target;
}
