/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function obterVersao(): string {
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return tag.replace(/^v/, '');
  } catch {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    return pkg.version;
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(obterVersao()),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
