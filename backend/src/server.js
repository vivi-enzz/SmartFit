import { createApp } from './app.js';
const port = Number(process.env.PORT) || 3001;
const app = createApp();
const server = app.listen(port, '0.0.0.0', () =>
  console.log(`SmartFit 演示 API http://localhost:${port} · SQLite · 无真实支付`)
);
const close = () =>
  server.close(() => {
    app.locals.close();
    process.exit(0);
  });
process.on('SIGINT', close);
process.on('SIGTERM', close);
