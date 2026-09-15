import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(apiRoot, '../..');
const sourceSchema = resolve(workspaceRoot, 'prisma/schema.prisma');
const temporarySchema = resolve(workspaceRoot, 'prisma/.render-schema.prisma');
const prismaCli = resolve(workspaceRoot, 'node_modules/prisma/build/index.js');

const source = readFileSync(sourceSchema, 'utf8');
const generatorPattern = /generator client\s*\{[\s\S]*?\}/;
const generatorMatch = source.match(generatorPattern);

if (!generatorMatch) {
  throw new Error('Prisma client generator block was not found.');
}

const generatorBlock = /\boutput\s*=/.test(generatorMatch[0])
  ? generatorMatch[0]
  : generatorMatch[0].replace(
      /\n\}/,
      '\n  output = "../apps/api/generated/prisma"\n}',
    );

writeFileSync(temporarySchema, source.replace(generatorPattern, generatorBlock));
console.log('Generating Prisma Client to apps/api/generated/prisma');

try {
  const result = spawnSync(
    process.execPath,
    [prismaCli, 'generate', `--schema=${temporarySchema}`],
    {
      cwd: workspaceRoot,
      env: process.env,
      stdio: 'inherit',
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
} finally {
  rmSync(temporarySchema, { force: true });
}
