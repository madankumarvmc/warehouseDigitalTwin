import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.get('/api/health', (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get('/api/warehouse/layout', (_req, res) => {
  res.json({
    aisles: ["A1", "A2", "A3", "A4"],
    binsPerAisle: 60,
    levels: 3,
    depth: 2,
    cellWidth: 40,
    cellHeight: 30,
    aisleWidth: 120
  });
});

// Serve static files from dist/public
const publicDir = path.join(__dirname, '..', 'dist', 'public');
app.use(express.static(publicDir));

// Serve index.html for all other routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export default app;