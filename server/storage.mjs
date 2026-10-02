import {mkdir, readFile, writeFile, rename, unlink} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {dataDir, within} from './paths.mjs';

export function fileStorage(base = join(dataDir, 'documents')) {
  function path(key) {
    if (!/^life\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(key)) throw new Error('Chave de documento inválida.');
    return within(base, key);
  }
  return {
    async put(key, bytes) {
      const target = path(key), temporary = target + '.' + randomUUID() + '.tmp';
      await mkdir(dirname(target), {recursive: true});
      try {
        await writeFile(temporary, bytes, {flag: 'wx'});
        await rename(temporary, target);
      } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
    },
    async get(key) {
      try { return {body: new Uint8Array(await readFile(path(key)))}; }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async delete(key) { await unlink(path(key)).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  };
}
