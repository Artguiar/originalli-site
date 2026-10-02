import {readFile, stat} from 'node:fs/promises';
import {extname} from 'node:path';
import {within, publicDir} from './paths.mjs';

const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json'};
export function staticAssets(base = publicDir) {
  return {async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Método não permitido', {status:405, headers:{Allow:'GET, HEAD'}});
    try {
      const pathname = decodeURIComponent(new URL(request.url).pathname);
      if (pathname.split('/').some(part => part.startsWith('.') || part.includes('\\'))) return new Response('Não encontrado', {status:404});
      let target = within(base, '.' + pathname);
      if ((await stat(target)).isDirectory()) {
        if (!pathname.endsWith('/')) return Response.redirect(new URL(pathname + '/' + new URL(request.url).search, request.url), 308);
        target = within(target, 'index.html');
      }
      const bytes = await readFile(target);
      return new Response(request.method === 'HEAD' ? null : bytes, {headers:{
        'Content-Type': types[extname(target)] || 'application/octet-stream',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        ...(pathname.startsWith('/vida-grupo/') ? {'Cache-Control':'no-store','X-Frame-Options':'DENY','Referrer-Policy':'same-origin'} : {})
      }});
    } catch (error) {
      if (['ENOENT','ENOTDIR'].includes(error.code) || error instanceof URIError || error.message === 'Caminho fora da pasta permitida.') return new Response('Não encontrado', {status:404});
      throw error;
    }
  }};
}
