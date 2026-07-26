import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.tsx', server: 'src/server.ts' },
  format: ['cjs', 'esm'],
  clean: true,
  // esbuild strips directives during bundling, so "use client" is re-added to
  // the client entry here. Without it, importing this package from a Next.js
  // Server Component fails.
  esbuildOptions(options) {
    options.banner = { js: '' };
  },
});
