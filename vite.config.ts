import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function devModePlugin() {
  return {
    name: 'dev-mode-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__dev_save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const { css } = JSON.parse(body);
              const targetPath = path.resolve(__dirname, 'src/dev-theme.css');
              fs.writeFileSync(targetPath, css);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }
        next();
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devModePlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
