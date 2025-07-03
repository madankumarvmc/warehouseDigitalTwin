import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Warehouse layout endpoint
  app.get("/api/warehouse/layout", (_req, res) => {
    res.json({
      aisles: ['A1', 'A2', 'A3', 'A4'],
      binsPerAisle: 60,
      levels: 3,
      depth: 2,
      cellWidth: 40,
      cellHeight: 30,
      aisleWidth: 120
    });
  });

  const httpServer = createServer(app);

  // Set up WebSocket for real-time forklift simulation
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws/resources"
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    
    // Send initial forklift positions
    const initialForklifts = [
      { id: 'FL-001', x: 100, y: 150, loaded: true, speed: 2.3, status: 'active' },
      { id: 'FL-002', x: 300, y: 250, loaded: false, speed: 1.8, status: 'active' },
      { id: 'FL-003', x: 500, y: 180, loaded: true, speed: 2.1, status: 'active' }
    ];

    ws.send(JSON.stringify({
      type: 'forklift_positions',
      data: initialForklifts,
      timestamp: Date.now()
    }));

    // Simulate periodic position updates
    const interval = setInterval(() => {
      const updates = initialForklifts.map(forklift => ({
        ...forklift,
        x: forklift.x + (Math.random() - 0.5) * 20,
        y: forklift.y + (Math.random() - 0.5) * 20,
        loaded: Math.random() > 0.9 ? !forklift.loaded : forklift.loaded
      }));

      ws.send(JSON.stringify({
        type: 'forklift_positions',
        data: updates,
        timestamp: Date.now()
      }));
    }, 1000);

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      clearInterval(interval);
    });
  });

  return httpServer;
}
