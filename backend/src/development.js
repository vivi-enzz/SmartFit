import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import config from '../../vite.config.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export async function createDevelopmentApp({ httpServer, hmr = true, ...options } = {}) {
  const app = createApp({ ...options, serveFrontend: false });
  const vite = await createServer({
    ...config,
    ...(!hmr ? { optimizeDeps: { noDiscovery: true, include: [] } } : {}),
    configFile: false,
    appType: 'custom',
    server: {
      ...config.server,
      middlewareMode: true,
      proxy: undefined,
      hmr: hmr ? { server: httpServer } : false,
    },
  });
  app.use(vite.middlewares);
  app.get('/{*path}', async (req, res, next) => {
    try {
      const template = await readFile(path.join(root, 'frontend/index.html'), 'utf8');
      res.type('html').send(await vite.transformIndexHtml(req.originalUrl, template));
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
  return { app, close: () => vite.close() };
}
