import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

const shouldRunBuildTest = process.env.RUN_BUILD_TEST !== 'false';

describe.skipIf(!shouldRunBuildTest)('production build', () => {
  it('npm run build succeeds', () => {
    const output = execSync('npm run build', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CI: 'true' },
      timeout: 240000,
    });

    expect(output).toContain('vite build');
  }, 240000);
});
