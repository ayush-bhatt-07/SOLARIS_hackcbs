import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
  stdio: 'inherit', windowsHide: true, env: { ...process.env, NODE_ENV: 'production' },
});
process.on('SIGINT', () => server.kill());
process.on('SIGTERM', () => server.kill());
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.on('exit', code => { process.exitCode = code ?? 1; });
