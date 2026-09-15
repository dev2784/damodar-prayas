import { copyFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(apiRoot, '../..');
const sourceSchema = resolve(workspaceRoot, 'prisma/schema.prisma');
const localSchema = resolve(apiRoot, '.render-schema.prisma');
const prismaCli = resolve(workspaceRoot, 'node_modules/prisma/build/index.js');

console.log(`Generating Prisma Client from API workspace: ${apiRoot}`);
copyFileSync(sourceSchema, localSchema);

try {
  const result = spawnSync(
    process.execPath,
    [prismaCli, 'generate', `--schema=${localSchema}`],
    {
      cwd: apiRoot,
      env: process.env,
      stdio: 'inherit',
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
} finally {
  rmSync(localSchema, { force: true });
}
