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

// For now, serve a simple HTML page since static files aren't built
app.get('*', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Warehouse Digital Twin</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <div id="root">
        <h1>Warehouse Digital Twin</h1>
        <p>Application is loading...</p>
        <p>API Status: Working ✅</p>
      </div>
    </body>
    </html>
  `);
});

export default app;