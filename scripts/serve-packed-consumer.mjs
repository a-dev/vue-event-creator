import { spawn, spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixture = join(projectRoot, 'tests/package-consumer');
const temporaryRoot = join(projectRoot, '.tmp');
const consumerDirectory = join(temporaryRoot, 'packed-consumer');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
}

await mkdir(temporaryRoot, { recursive: true });
await rm(consumerDirectory, { recursive: true, force: true });
await cp(fixture, consumerDirectory, { recursive: true });

run('bun', ['run', 'build']);

const packResult = spawnSync(
  'npm',
  ['pack', '--ignore-scripts', '--json', '--pack-destination', temporaryRoot],
  {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: join(temporaryRoot, 'npm-cache'),
    },
  },
);
if (packResult.status !== 0) {
  process.stderr.write(packResult.stderr);
  throw new Error('npm pack failed');
}

const [{ filename }] = JSON.parse(packResult.stdout);
const fixtureTarball = join(consumerDirectory, 'vue-event-creator.tgz');
await rename(join(temporaryRoot, filename), fixtureTarball);

const packageJsonPath = join(consumerDirectory, 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
packageJson.dependencies['vue-event-creator'] = `file:./${basename(
  fixtureTarball,
)}`;
await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

const environment = {
  ...process.env,
  BUN_INSTALL_CACHE_DIR: join(temporaryRoot, 'bun-cache'),
  TMPDIR: temporaryRoot,
};
run('bun', ['install'], { cwd: consumerDirectory, env: environment });
run('bun', ['run', 'build'], { cwd: consumerDirectory, env: environment });

const server = spawn(
  'bunx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', '4174'],
  {
    cwd: consumerDirectory,
    env: environment,
    stdio: 'inherit',
  },
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}

server.on('exit', (code) => {
  process.exit(code ?? 0);
});
