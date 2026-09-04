import { cp, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packedTarballName } from './npm-pack-result.mjs';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixture = join(projectRoot, 'tests/package-consumer');
const temporaryDirectory = await mkdtemp(
  join(tmpdir(), 'vue-event-creator-consumer-'),
);
const consumerDirectory = join(temporaryDirectory, 'consumer');

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

try {
  await cp(fixture, consumerDirectory, { recursive: true });

  const packResult = spawnSync(
    'npm',
    ['pack', '--json', '--pack-destination', temporaryDirectory],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        NPM_CONFIG_CACHE: join(temporaryDirectory, 'npm-cache'),
      },
    },
  );
  if (packResult.status !== 0) {
    process.stderr.write(packResult.stderr);
    throw new Error('npm pack failed');
  }

  const filename = packedTarballName(packResult.stdout);
  const tarballPath = join(temporaryDirectory, filename);
  const fixtureTarball = join(consumerDirectory, 'vue-event-creator.tgz');
  await rename(tarballPath, fixtureTarball);

  const packageJsonPath = join(consumerDirectory, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  packageJson.dependencies['vue-event-creator'] = `file:./${basename(
    fixtureTarball,
  )}`;
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const consumerEnvironment = {
    ...process.env,
    BUN_INSTALL_CACHE_DIR: join(temporaryDirectory, 'bun-cache'),
    TMPDIR: temporaryDirectory,
  };
  run('bun', ['install'], {
    cwd: consumerDirectory,
    env: consumerEnvironment,
  });
  run('bun', ['run', 'build'], {
    cwd: consumerDirectory,
    env: consumerEnvironment,
  });
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
