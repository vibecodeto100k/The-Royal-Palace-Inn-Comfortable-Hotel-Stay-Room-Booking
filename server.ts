import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './src/server/db.js';
import { publicRouter } from './src/server/routes/public.js';
import { adminRouter } from './src/server/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize SQLite database, seed schema, default admin & initial 6 rooms
initDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve public assets (favicon.svg, uploads, etc.) directly
app.use(express.static(path.resolve(__dirname, 'public')));

// Fallback for favicon.ico requests
app.get('/favicon.ico', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'favicon.svg'), {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hotel: 'The Royal Palace Inn',
    rooms: 6,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In development: mount Vite dev server as middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    // In production: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[The Royal Palace Inn] Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
