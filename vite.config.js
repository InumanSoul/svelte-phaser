import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('phaser')) {
            return 'phaser';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      phaser: resolve('node_modules/phaser'),
    },
  },
});