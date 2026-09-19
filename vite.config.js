import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { buildSkillShards } from './scripts/build_skill_shards.mjs';
import { prerenderMonsters } from './scripts/prerender_monsters.mjs';

// After the production bundle is written: one crawlable HTML page per monster + sitemap/robots
function prerender() {
  return {
    name: 'swm-prerender',
    apply: 'build',
    closeBundle() {
      prerenderMonsters({ root: __dirname, log: console.log });
    },
  };
}

// Regenerates public/data/skills/*.json + src/data/monsterSkillsIndex.json from monsterSkillsData.json
// whenever the source is newer — runs for both `vite` (dev) and `vite build`, so the generated files
// stay out of git and can never be stale. It has to happen in configResolved: the dev server takes
// its list of servable public/ files right after this, and anything created later (buildStart) is
// answered with index.html instead.
function skillShards() {
  return {
    name: 'swm-skill-shards',
    configResolved(config) {
      const r = buildSkillShards({ root: config.root });
      if (!r.skipped) config.logger.info(`[swm] skill shards rebuilt: ${r.monsters} monsters → ${r.shards} files`);
    },
  };
}

// Embedded SWM Relay & Profile Sync Server Plugin
function swmSyncServer() {
  return {
    name: 'swm-sync-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Enable Cross-Origin Resource Sharing (CORS) for all devices
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // GET Profile endpoint for cross-device sync
        if (req.method === 'GET' && (req.url.startsWith('/api/profile') || req.url === '/api/profile')) {
          const profilePath = path.resolve(__dirname, 'public/data/my_profile.json');
          if (fs.existsSync(profilePath)) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return fs.createReadStream(profilePath).pipe(res);
          } else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Profile not found' }));
          }
        }

        // POST Profile sync endpoint
        if (req.method === 'POST' && (req.url.startsWith('/api/profile') || req.url === '/api/profile')) {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const profilePath = path.resolve(__dirname, 'public/data/my_profile.json');
              fs.writeFileSync(profilePath, JSON.stringify(data, null, 2));
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, message: 'Profile synced to server successfully' }));
            } catch (err) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST /api/ai/advise — same handler Vercel runs, so the advisor works in dev
        if (req.method === 'POST' && req.url.startsWith('/api/ai/advise')) {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            try {
              const { handleAdvise, requestContext } = await import('./api/ai/advise.js');
              const { status, json } = await handleAdvise({ body: JSON.parse(body || '{}'), ...requestContext(req) });
              res.statusCode = status;
              return res.end(JSON.stringify(json));
            } catch (err) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // /api/guild-rankings — shared guild leaderboards, same handler Vercel runs
        if (req.url.startsWith('/api/guild-rankings')) {
          const url = new URL(req.url, 'http://localhost');
          const query = Object.fromEntries(url.searchParams.entries());
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            try {
              const { handleGuildRankings } = await import('./api/guild-rankings.js');
              const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
              const { status, json } = await handleGuildRankings({ method: req.method, query, body: body ? JSON.parse(body) : null, token });
              res.statusCode = status;
              return res.end(JSON.stringify(json));
            } catch (err) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // /api/live/<key> — live documents + code submissions, same handler Vercel runs
        if (req.url.startsWith('/api/live/')) {
          const url = new URL(req.url, 'http://localhost');
          const key = url.pathname.replace('/api/live/', '').replace(/\/+$/, '');
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            try {
              const { handleLive } = await import('./api/live/[key].js');
              const { status, json, cache } = await handleLive({ key, method: req.method, body: body ? JSON.parse(body) : null, ip: req.socket?.remoteAddress });
              res.statusCode = status;
              if (cache) res.setHeader('Cache-Control', cache);
              return res.end(JSON.stringify(json));
            } catch (err) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // /api/admin/<action> — back-office API, same handler Vercel runs
        if (req.url.startsWith('/api/admin/')) {
          const url = new URL(req.url, 'http://localhost');
          const action = url.pathname.replace('/api/admin/', '').replace(/\/+$/, '');
          const query = Object.fromEntries(url.searchParams.entries());
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            try {
              const { handleAdmin } = await import('./api/admin/[action].js');
              const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
              const { status, json } = await handleAdmin({ action, method: req.method, body: body ? JSON.parse(body) : null, token, query });
              res.statusCode = status;
              return res.end(JSON.stringify(json));
            } catch (err) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST AegisLink Sync Ingestion endpoint
        if (req.method === 'POST' && (req.url === '/api/sync' || req.url.startsWith('/api/sync'))) {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'ok', receivedAt: Date.now() }));
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), skillShards(), prerender(), swmSyncServer()],
  server: {
    host: true
  }
});
