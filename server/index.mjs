// Minty Plays: tiny static file server. No dependencies; Node 20+.
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { latest } from './videos.mjs';
import { subscribers } from './channel.mjs';
import { games } from './games.mjs';

const PORT = Number(process.env.PORT) || 8787;
const DIR = path.resolve(process.env.SITE_DIR || 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

const send = (res, status, body, type = 'text/plain; charset=utf-8', extra = {}) => {
  res.writeHead(status, { 'content-type': type, 'x-content-type-options': 'nosniff', ...(process.env.HSTS ? { 'strict-transport-security': 'max-age=31536000' } : {}), ...extra });
  res.end(body);
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/health') return send(res, 200, '{"ok":true}', 'application/json');
  if (url.pathname === '/api/videos') return send(res, 200, JSON.stringify(await latest('videos')), 'application/json; charset=utf-8', { 'cache-control': 'public, max-age=300' });
  if (url.pathname === '/api/shorts') return send(res, 200, JSON.stringify(await latest('shorts')), 'application/json; charset=utf-8', { 'cache-control': 'public, max-age=300' });
  if (url.pathname === '/api/channel') return send(res, 200, JSON.stringify((await subscribers()) ?? {}), 'application/json; charset=utf-8', { 'cache-control': 'public, max-age=600' });
  if (url.pathname === '/api/games') return send(res, 200, JSON.stringify(await games()), 'application/json; charset=utf-8', { 'cache-control': 'public, max-age=3600' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { rel = '/'; }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(DIR, path.normalize(rel));
  if (!file.startsWith(DIR + path.sep) || path.basename(file).startsWith('.')) return send(res, 404, 'Not found');
  try {
    const data = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    send(res, 200, req.method === 'HEAD' ? undefined : data, TYPES[ext] || 'application/octet-stream', { 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=86400' });
  } catch {
    send(res, 404, 'Not found');
  }
}).listen(PORT, () => console.log(`Minty Plays listening on :${PORT}`));
