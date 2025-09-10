import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  // Handle API routes
  if (url?.startsWith('/api/health')) {
    return res.json({ status: "ok", timestamp: new Date().toISOString() });
  }

  if (url?.startsWith('/api/warehouse/layout')) {
    return res.json({
      aisles: ["A1", "A2", "A3", "A4"],
      binsPerAisle: 60,
      levels: 3,
      depth: 2,
      cellWidth: 40,
      cellHeight: 30,
      aisleWidth: 120
    });
  }

  // Serve HTML for all other routes
  res.setHeader('Content-Type', 'text/html');
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Warehouse Digital Twin</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .status { color: green; font-weight: bold; }
        a { color: #0066cc; }
      </style>
    </head>
    <body>
      <h1>🏭 Warehouse Digital Twin</h1>
      <p class="status">✅ Application is running successfully!</p>
      <h3>Available API Endpoints:</h3>
      <ul>
        <li><a href="/api/health" target="_blank">/api/health</a> - Health check</li>
        <li><a href="/api/warehouse/layout" target="_blank">/api/warehouse/layout</a> - Warehouse layout data</li>
      </ul>
      <p><em>Deployed on Vercel</em></p>
    </body>
    </html>
  `);
}