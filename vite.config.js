import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The bundled interview-data.json makes the main chunk large; that is expected.
  build: { chunkSizeWarningLimit: 1000 },
});
