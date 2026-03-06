import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { extname, dirname, join, resolve } from 'node:path';

const projectRoot = process.cwd();
const sourceDirs = ['src', 'supabase/functions', 'scripts'];
const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const resolvableExtensions = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.webm',
];

const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const declaredPackages = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
]);

const nodeBuiltins = new Set([
  'fs','path','url','util','stream','buffer','process','crypto','http','https','zlib','events','os','assert','module','timers','child_process','net','tls','readline','querystring','string_decoder','worker_threads',
]);

function walkFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];

  const output: string[] = [];
  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
      output.push(...walkFiles(fullPath));
      continue;
    }

    if (codeExtensions.has(extname(entry))) {
      output.push(fullPath);
    }
  }

  return output;
}

function getPackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return `${scope}/${name}`;
  }
  return specifier.split('/')[0];
}

function canResolveFile(basePathWithoutExt: string): boolean {
  for (const extension of resolvableExtensions) {
    const candidate = `${basePathWithoutExt}${extension}`;
    if (existsSync(candidate) && statSync(candidate).isFile()) return true;
  }

  for (const extension of resolvableExtensions) {
    const indexCandidate = join(basePathWithoutExt, `index${extension}`);
    if (existsSync(indexCandidate) && statSync(indexCandidate).isFile()) return true;
  }

  return false;
}

describe('import and dependency integrity', () => {
  it('all imports resolve and all package imports are declared', () => {
    const files = sourceDirs.flatMap((dir) => walkFiles(resolve(projectRoot, dir)));
    const errors: string[] = [];

    const importRegex = /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']/g;
    const dynamicImportRegex = /import\(\s*["']([^"']+)["']\s*\)/g;

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const specifiers: string[] = [];

      for (const match of content.matchAll(importRegex)) {
        specifiers.push(match[1]);
      }
      for (const match of content.matchAll(dynamicImportRegex)) {
        specifiers.push(match[1]);
      }

      for (const specifier of specifiers) {
        if (
          specifier.startsWith('http://') ||
          specifier.startsWith('https://') ||
          specifier.startsWith('npm:') ||
          specifier.startsWith('deno:') ||
          specifier.startsWith('data:')
        ) {
          continue;
        }

        if (specifier.startsWith('./') || specifier.startsWith('../')) {
          const resolvedBase = resolve(dirname(file), specifier);
          if (!canResolveFile(resolvedBase)) {
            errors.push(`[missing file import] ${file} -> ${specifier}`);
          }
          continue;
        }

        if (specifier.startsWith('@/')) {
          const resolvedBase = resolve(projectRoot, 'src', specifier.slice(2));
          if (!canResolveFile(resolvedBase)) {
            errors.push(`[missing alias import] ${file} -> ${specifier}`);
          }
          continue;
        }

        if (specifier.startsWith('node:')) {
          const name = specifier.replace('node:', '').split('/')[0];
          if (!nodeBuiltins.has(name)) {
            errors.push(`[unknown node builtin] ${file} -> ${specifier}`);
          }
          continue;
        }

        const pkg = getPackageName(specifier);
        if (!declaredPackages.has(pkg) && !nodeBuiltins.has(pkg)) {
          errors.push(`[missing package] ${file} -> ${specifier} (expected package: ${pkg})`);
        }
      }
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
