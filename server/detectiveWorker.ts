import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

let worker: ChildProcessWithoutNullStreams | undefined;
const pending = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
const unavailable = () => new Error('Savings Detective inference stopped or timed out. Check server/python/requirements.txt in .venv-detective or SOLARIS_PYTHON, then retry.');
export function stopDetectiveWorker() {
  const child = worker; worker = undefined;
  for (const request of pending.values()) { clearTimeout(request.timer); request.reject(unavailable()); }
  pending.clear(); child?.stdin.end(); child?.kill();
}
process.once('exit', stopDetectiveWorker);
function startWorker() {
  if (worker) return worker;
  const local = resolve(process.platform === 'win32' ? '.venv-detective/Scripts/python.exe' : '.venv-detective/bin/python');
  const executable = process.env.SOLARIS_PYTHON || (existsSync(local) ? local : 'python');
  const environment: NodeJS.ProcessEnv = {};
  for (const name of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'APPDATA', 'LOCALAPPDATA', 'USERPROFILE', 'HOME', 'LANG']) if (process.env[name]) environment[name] = process.env[name];
  const child = spawn(executable, ['-u', resolve('server/python/savings_detective.py')], { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'], env: { ...environment, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1', PYTHONIOENCODING: 'utf-8' } });
  worker = child;
  // Consume diagnostics without exposing server paths or credentials to clients.
  child.stderr.on('data', () => {});
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    try {
      const response = JSON.parse(line), request = pending.get(response.id);
      if (!request) return;
      clearTimeout(request.timer); pending.delete(response.id);
      if (response.error) request.reject(new Error('The anomaly dataset failed model validation.'));
      else request.resolve(response.result);
    } catch { stopDetectiveWorker(); }
  });
  const ended = () => { if (worker === child) stopDetectiveWorker(); lines.close(); };
  child.on('error', ended); child.on('exit', ended);
  child.stdin.on('error', ended);
  return child;
}
export const detectiveInference = <T = any>(operation: 'template' | 'infer' | 'weather-template' | 'weather-infer', data: Record<string, unknown> = {}): Promise<T> => {
  if (pending.size >= 20) return Promise.reject(new Error('Savings Detective is busy. Please retry shortly.'));
  const child = startWorker(), id = randomUUID();
  return new Promise((resolveRequest, reject) => {
    const timer = setTimeout(() => { console.warn('Savings Detective Python request timed out.'); stopDetectiveWorker(); }, 45000);
    pending.set(id, { resolve: resolveRequest, reject, timer });
    child.stdin.write(JSON.stringify({ id, operation, ...data }) + '\n', error => { if (error) stopDetectiveWorker(); });
  });
};
