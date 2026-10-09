import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const electronPath = require('electron');

if (!electronPath || typeof electronPath !== 'string') {
  console.error('Electron binary not found. Please run `npm install`.');
  process.exit(1);
}

const NOISE = /fontconfig warning|invalid attribute|invalid constant used/i;

const args = ['.', '--no-sandbox'];
const child = spawn(electronPath, args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: false,
  env: {
    ...process.env,
    ELECTRON_RENDERER_URL: process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173',
  },
});

const filterStream = (stream, destination) => {
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

filterStream(child.stdout, process.stdout);
filterStream(child.stderr, process.stderr);

child.on('error', (err) => {
  console.error(`Failed to spawn Electron: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
