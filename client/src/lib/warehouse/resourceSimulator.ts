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
        y: 50,
        loaded: true,
        trail: [],
        speed: 2.3,
        status: 'active',
        targetX: 100,
        targetY: 400,
        direction: 'down',
        currentAisle: 0,
      },
      {
        id: 'FL-002',
        x: 300,
        y: 350,
        loaded: false,
        trail: [],
        speed: 1.8,
        status: 'active',
        targetX: 300,
        targetY: 50,
        direction: 'up',
        currentAisle: 1,
      },
      {
        id: 'FL-003',
        x: 500,
        y: 100,
        loaded: true,
        trail: [],
        speed: 2.1,
        status: 'active',
        targetX: 500,
        targetY: 380,
        direction: 'down',
        currentAisle: 2,
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

      // Realistic aisle-based movement patterns
      const movementSpeed = forklift.speed * 0.8; // Increased speed for visible movement
      
      // Calculate aisle center X position
      const aisleWidth = warehouseConfig.aisleWidth;
      const cellWidth = warehouseConfig.cellWidth;
      const aisleX = (forklift.currentAisle || 0) * (cellWidth * 2 + aisleWidth) + cellWidth + aisleWidth / 2;
      
      // Keep forklift in aisle center (slight variation for realism)
      forklift.x = aisleX + (Math.random() - 0.5) * 20;
      
      // Move towards target Y position
      const targetY = forklift.targetY || forklift.y;
      const deltaY = targetY - forklift.y;
      const direction = deltaY > 0 ? 1 : -1;
      
      // Move at consistent speed towards target
      if (Math.abs(deltaY) > movementSpeed) {
        forklift.y += direction * movementSpeed;
      } else {
        forklift.y = targetY;
        // Reached target, set new target at opposite end
        this.setNewTarget(forklift);
      }

      // Keep within warehouse bounds
      const maxY = warehouseConfig.binsPerAisle * warehouseConfig.cellHeight;
      forklift.y = Math.max(30, Math.min(maxY - 30, forklift.y));

      // Change load status at end of aisles (more realistic)
      if (Math.abs(forklift.y - (forklift.targetY || 0)) < 10) {
        if (Math.random() < 0.4) { // 40% chance to change load status at aisle ends
          forklift.loaded = !forklift.loaded;
        }
      }
    });
  }

  private setNewTarget(forklift: ForkliftResource) {
    const maxY = warehouseConfig.binsPerAisle * warehouseConfig.cellHeight;
    
    // Occasionally switch aisles for more dynamic movement
    if (Math.random() < 0.3) {
      const newAisle = Math.floor(Math.random() * warehouseConfig.aisles.length);
      forklift.currentAisle = newAisle;
    }
    
    // Set target to opposite end of current aisle
    if (forklift.y < maxY / 2) {
      forklift.targetY = maxY - 50; // Go to bottom
      forklift.direction = 'down';
    } else {
      forklift.targetY = 50; // Go to top
      forklift.direction = 'up';
    }
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
