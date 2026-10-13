/**
 * Starts the backend API and the frontend together with one command:
 *
 *   npm run dev        (from the project root)
 *
 * Output from both is shown with a coloured prefix, and stopping this
 * process (Ctrl+C) stops both.
 */
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const apps = [
  { name: 'api', cwd: path.join(root, 'backend'), color: '\x1b[33m' },
  { name: 'web', cwd: path.join(root, 'frontend'), color: '\x1b[36m' },
];

let stopping = false;

const children = apps.map(({ name, cwd, color }) => {
  const child = spawn(npm, ['run', 'dev'], { cwd, shell: process.platform === 'win32', env: process.env });
  const prefix = `${color}[${name}]\x1b[0m `;
  const print = (stream) => (chunk) => {
    chunk.toString().split(/\r?\n/).filter((line) => line.trim()).forEach((line) => stream.write(`${prefix}${line}\n`));
  };
  child.stdout.on('data', print(process.stdout));
  child.stderr.on('data', print(process.stderr));
  child.on('exit', (code) => {
    if (stopping) return;
    console.log(`${prefix}stopped (exit code ${code}). Stopping the other process too.`);
    stop(code || 1);
  });
  return child;
});

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => {
    if (child.exitCode !== null) return;
    // On Windows the npm wrapper does not forward signals, so end the whole process tree.
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    else child.kill('SIGTERM');
  });
  setTimeout(() => process.exit(exitCode), 500);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
