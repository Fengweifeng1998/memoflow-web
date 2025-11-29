import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Fallback to empty string to ensure valid JS generation if env var is missing
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});