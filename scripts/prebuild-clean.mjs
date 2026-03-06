import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const cleanupTargets = [
  '.workspace',
  'workspace_tmp',
  'tsconfig.app.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
];

for (const target of cleanupTargets) {
  try {
    const fullPath = resolve(process.cwd(), target);
    if (existsSync(fullPath)) rmSync(fullPath, { recursive: true, force: true });
  } catch {
    // ignore cleanup issues and continue build
  }
}

