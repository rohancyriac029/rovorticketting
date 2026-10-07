import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', seed: 'prisma/seed.ts' },
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ['@app/shared'],
});
