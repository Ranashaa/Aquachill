import { defineConfig } from 'vitest/config';

// base relative : le build fonctionne à la racine d'un domaine comme dans un sous-dossier
// (ex. https://<user>.github.io/Aquachill/).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
