import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer .ts/.tsx over .js/.jsx so TypeScript files always win
    extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 80 },
});
