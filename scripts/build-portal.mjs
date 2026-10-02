import {mkdir, cp, rm, lstat, rename} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {root, publicDir, within} from '../server/paths.mjs';

// public/ is the source; dist/ is always disposable build output.
const output = within(root, 'dist');
if (output !== resolve(root, 'dist')) throw new Error('Destino de build inválido.');
for (const target of [output, within(root,'.cache')]) {
  try { if ((await lstat(target)).isSymbolicLink()) throw new Error('Destino de build não pode ser um link.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const staging = within(root,'.cache','build-'+randomUUID());
const previous = within(root,'.cache','previous-dist-'+randomUUID());
let moved = false;
try {
  await mkdir(join(staging,'server'), {recursive:true});
  await build({absWorkingDir:root,tsconfigRaw:{},entryPoints:['./portal/worker.mjs'],outfile:join(staging,'server/index.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
  await cp(publicDir, join(staging,'client'), {recursive:true});
  await cp(join(root,'drizzle'), join(staging,'migrations'), {recursive:true});
  try { await rename(output,previous); moved = true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { await rename(staging,output); }
  catch (error) { if (moved) await rename(previous,output); throw error; }
  if (moved) await rm(previous,{recursive:true,force:true});
} finally { await rm(staging,{recursive:true,force:true}); }
console.log('Build concluído em dist/: servidor Worker, site e migrações. Fontes em public/ preservadas.');
