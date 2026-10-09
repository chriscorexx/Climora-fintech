/**
 * Dev-only Electron launcher that filters fontconfig warnings.
 *
 * Chromium's fontconfig integration parses the system font config files
 * (/etc/fonts/conf.d/*.conf) and prints warnings when those files contain
 * unsupported attributes — a system configuration issue, not an application
 * bug. They are dropped here so `npm run dev` output stays readable; real
 * stdout/stderr from the app is forwarded untouched.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// The `electron` package exports the path to its downloaded binary.
const electronPath = require('electron');

if (typeof electronPath !== 'string' || !electronPath) {
  console.error('Electron binary not found. Run `npm install` to download it.');
  process.exit(1);
}

const NOISE = /fontconfig warning|invalid attribute|invalid constant used/i;

const args = ['.', process.env.ELECTRON_EXTRA_ARGS].filter(Boolean);
const child = spawn(electronPath, args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: false,
  env: process.env,
});

const pump = (stream, destination) => {
  let pending = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    pending += chunk;
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      if (line && !NOISE.test(line)) destination.write(`${line}\n`);
    }
  });
  stream.on('end', () => {
    if (pending && !NOISE.test(pending)) destination.write(pending);
  });
};

pump(child.stdout, process.stdout);
pump(child.stderr, process.stderr);

child.on('error', (error) => {
  console.error(`Failed to start Electron: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
