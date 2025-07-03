import { ForkliftResource } from './types';
import { warehouseConfig } from './warehouseLayout';

export class ResourceSimulator {
  private forklifts: ForkliftResource[] = [];
  private animationId: number | null = null;
  private listeners: ((forklifts: ForkliftResource[]) => void)[] = [];
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 3000; // Update every 3 seconds for better performance

  constructor() {
    this.initializeForklifts();
  }

  private initializeForklifts() {
    this.forklifts = [
      {
        id: 'FL-001',
        x: 100,
        y: 150,
        loaded: true,
        trail: [],
        speed: 2.3,
        status: 'active',
      },
      {
        id: 'FL-002',
        x: 300,
        y: 250,
        loaded: false,
        trail: [],
        speed: 1.8,
        status: 'active',
      },
      {
        id: 'FL-003',
        x: 500,
        y: 180,
        loaded: true,
        trail: [],
        speed: 2.1,
        status: 'active',
      },
    ];
  }

  start() {
    if (this.animationId) return;
    
    const animate = () => {
      const now = Date.now();
      
      // Always update positions for smooth animation
      this.updatePositions();
      
      // Only notify listeners at the specified interval
      if (now - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
        this.notifyListeners();
        this.lastUpdateTime = now;
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private updatePositions() {
    const now = Date.now();
    
    this.forklifts.forEach(forklift => {
      // Add current position to trail
      forklift.trail.push({
        x: forklift.x,
        y: forklift.y,
        loaded: forklift.loaded,
        timestamp: now,
      });

      // Keep only last 5 minutes of trail data
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      forklift.trail = forklift.trail.filter(point => point.timestamp > fiveMinutesAgo);

      // Simulate realistic movement patterns
      const movementSpeed = forklift.speed * 0.5; // Scale for animation
      
      // Random movement with some bias towards aisles
      const deltaX = (Math.random() - 0.5) * movementSpeed * 2;
      const deltaY = (Math.random() - 0.5) * movementSpeed * 2;
      
      forklift.x += deltaX;
      forklift.y += deltaY;

      // Keep within warehouse bounds
      const maxX = warehouseConfig.aisles.length * (warehouseConfig.cellWidth * 2 + warehouseConfig.aisleWidth);
      const maxY = warehouseConfig.binsPerAisle * warehouseConfig.cellHeight;
      
      forklift.x = Math.max(50, Math.min(maxX - 50, forklift.x));
      forklift.y = Math.max(50, Math.min(maxY - 50, forklift.y));

      // Randomly change load status occasionally
      if (Math.random() < 0.002) { // 0.2% chance per frame
        forklift.loaded = !forklift.loaded;
      }
    });
  }

  addListener(callback: (forklifts: ForkliftResource[]) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (forklifts: ForkliftResource[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.forklifts]));
  }

  getForklifts(): ForkliftResource[] {
    return [...this.forklifts];
  }

  getForkliftById(id: string): ForkliftResource | undefined {
    return this.forklifts.find(forklift => forklift.id === id);
  }
}

export const resourceSimulator = new ResourceSimulator();
