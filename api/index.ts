import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

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

  // Handle static assets
  if (url?.startsWith('/assets/')) {
    const assetPath = path.join(process.cwd(), 'dist/public', url);
    try {
      if (fs.existsSync(assetPath)) {
        const content = fs.readFileSync(assetPath);
        
        // Set appropriate content type
        if (url.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (url.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
        
        return res.send(content);
      }
    } catch (error) {
      // Fall through to serve index.html
    }
  }

  // Serve the React app's index.html for all other routes
  try {
    const indexPath = path.join(process.cwd(), 'dist/public/index.html');
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }
  } catch (error) {
    // Fallback if built files don't exist
  }

  // Fallback HTML
  res.setHeader('Content-Type', 'text/html');
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Warehouse Digital Twin</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <h1>🏭 Warehouse Digital Twin</h1>
      <p>⚠️ React app build not found. Please run build process.</p>
    </body>
    </html>
  `);
}