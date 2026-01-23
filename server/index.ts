import express from 'express';
import cors from 'cors';
import path from 'path';
import { registerRoutes } from './routes.js';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve();

async function startServer() {
  const app = express();
  const port = 5000;

  app.use(cors());
  app.use(express.json());

  registerRoutes(app);

  let useVite = false;
  
  try {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    useVite = true;
    console.log('Running in development mode with Vite');
  } catch (e) {
    console.log('Running in production mode, serving static files');
    const distPath = path.resolve(currentDir, '.');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(console.error);
