import { createServer } from 'node:http';
import { createDevelopmentApp } from './development.js';
const port = Number(process.env.PORT) || 5173;
const server = createServer();
const dev = await createDevelopmentApp({ httpServer: server });
server.on('request', dev.app);
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE')
    console.error(`端口 ${port} 已被占用。請先在舊終端按 Control+C，或設定 PORT=5174 再啟動。`);
  else console.error(error.message);
  process.exitCode = 1;
  dev.close().finally(() => dev.app.locals.close());
});
server.listen(port, '0.0.0.0', () =>
  console.log(
    `\n SmartFit 2.0 · 前端與 API 共用網址\n http://localhost:${port}\n 保持此終端執行；停止服務請按 Control+C。\n`
  )
);
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await dev.close();
  server.close(() => {
    dev.app.locals.close();
    process.exit(0);
  });
  server.closeAllConnections();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
