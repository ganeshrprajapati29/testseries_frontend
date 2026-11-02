/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// In development the API runs on :5000 and is proxied so cookies stay same-origin.
const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:5000';

/**
 * `npm run build:hostinger`: static build for shared hosting with the API on another subdomain.
 * Adds an .htaccess (HTTPS, SPA routes, /uploads -> API server) generated from hostinger/htaccess.template.
 */
function hostingerBuild(apiBaseUrl: string | undefined): Plugin {
  let origin: string;
  try {
    const url = new URL(apiBaseUrl ?? '');
    if (url.protocol !== 'https:') throw new Error('https required');
    origin = url.origin;
  } catch {
    throw new Error(`VITE_API_BASE_URL in .env.hostinger must be a full https URL like https://testapi.civilsansad.com/api (got "${apiBaseUrl ?? ''}")`);
  }
  return {
    name: 'hostinger-htaccess',
    apply: 'build',
    generateBundle() {
      const template = readFileSync(path.resolve(import.meta.dirname, 'hostinger/htaccess.template'), 'utf8');
      this.emitFile({ type: 'asset', fileName: '.htaccess', source: template.replaceAll('__API_ORIGIN__', origin) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const isHostinger = mode === 'hostinger';
  const env = loadEnv(mode, import.meta.dirname, 'VITE_');
  return {
    plugins: [react(), tailwindcss(), ...(isHostinger ? [hostingerBuild(env.VITE_API_BASE_URL)] : [])],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: API_TARGET, changeOrigin: false },
        '/uploads': { target: API_TARGET, changeOrigin: false },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: API_TARGET, changeOrigin: false },
        '/uploads': { target: API_TARGET, changeOrigin: false },
      },
    },
    build: {
      outDir: isHostinger ? 'dist-hostinger' : 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 800,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
