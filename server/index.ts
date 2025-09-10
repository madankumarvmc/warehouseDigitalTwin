import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // For Vercel serverless
  if (process.env.VERCEL) {
    return app;
  } else {
    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5008;
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  }
})();

// Export for Vercel
export default async function handler(req: any, res: any) {
  const server = await (async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Simple routes
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    app.get("/api/warehouse/layout", (_req, res) => {
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

    // Serve simple HTML for all other routes
    app.get("*", (_req, res) => {
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
            <p>Application is running ✅</p>
            <p>API endpoints:</p>
            <ul>
              <li><a href="/api/health">/api/health</a></li>
              <li><a href="/api/warehouse/layout">/api/warehouse/layout</a></li>
            </ul>
          </div>
        </body>
        </html>
      `);
    });

    return app;
  })();

  return server(req, res);
}
