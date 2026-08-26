import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { handleGeminiApi } from './server/aiHandler.ts';
import { handleDeveloperApi } from './server/devApiHandler.ts';

dotenv.config();

function geminiDevServerPlugin(): Plugin {
  return {
    name: 'gemini-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 1. Developer API v1 Endpoints (/api/v1/*)
        if (req.url && req.url.startsWith('/api/v1/')) {
          const path = req.url.split('?')[0];
          const method = req.method || 'GET';

          let bodyData = '';
          req.on('data', (chunk) => {
            bodyData += chunk;
          });
          req.on('end', async () => {
            try {
              const parsedBody = bodyData ? JSON.parse(bodyData) : {};
              const result = await handleDeveloperApi(path, method, req.headers as any, parsedBody);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              console.error('Dev Server Dev API Error:', err);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
            }
          });
          return;
        }

        // 2. AI Service Endpoints (/api/ai/*)
        if (req.url && req.url.startsWith('/api/ai/')) {
          const action = req.url.replace('/api/ai/', '').split('?')[0];
          
          if (req.method === 'POST') {
            let bodyData = '';
            req.on('data', (chunk) => {
              bodyData += chunk;
            });
            req.on('end', async () => {
              try {
                const parsedBody = bodyData ? JSON.parse(bodyData) : {};
                const result = await handleGeminiApi(action, parsedBody);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(result));
              } catch (err: any) {
                console.error('Dev Server AI API Error:', err);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiDevServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
