import { ForkliftResource, BOPTResource } from './types';
import { warehouseConfig } from './warehouseLayout';

export class ResourceSimulator {
  private forklifts: ForkliftResource[] = [];
  private bopts: BOPTResource[] = [];
  private animationId: number | null = null;
  private listeners: ((resources: { forklifts: ForkliftResource[], bopts: BOPTResource[] }) => void)[] = [];
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 3000; // Update every 3 seconds for better performance

  constructor() {
    this.initializeForklifts();
    this.initializeBOPTs();
  }

  private initializeForklifts() {
    this.forklifts = [
      {
        id: 'FL-001',
        type: 'forklift',
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
        type: 'forklift',
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
        type: 'forklift',
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

  private initializeBOPTs() {
    this.bopts = [
      {
        id: 'BOPT-001',
        type: 'bopt',
        x: 200,
        y: 80,
        loaded: false,
        trail: [],
        speed: 1.2,
        status: 'active',
        targetX: 450,
        targetY: 80,
        direction: 'right',
        currentAisle: 0,
      },
      {
        id: 'BOPT-002',
        type: 'bopt',
        x: 380,
        y: 200,
        loaded: true,
        trail: [],
        speed: 1.4,
        status: 'active',
        targetX: 120,
        targetY: 200,
        direction: 'left',
        currentAisle: 1,
      },
      {
        id: 'BOPT-003',
        type: 'bopt',
        x: 150,
        y: 320,
        loaded: false,
        trail: [],
        speed: 1.3,
        status: 'active',
        targetX: 520,
        targetY: 320,
        direction: 'right',
        currentAisle: 2,
      },
      {
        id: 'BOPT-004',
        type: 'bopt',
        x: 480,
        y: 140,
        loaded: true,
        trail: [],
        speed: 1.1,
        status: 'active',
        targetX: 80,
        targetY: 140,
        direction: 'left',
        currentAisle: 0,
      },
      {
        id: 'BOPT-005',
        type: 'bopt',
        x: 250,
        y: 280,
        loaded: false,
        trail: [],
        speed: 1.5,
        status: 'active',
        targetX: 420,
        targetY: 280,
        direction: 'right',
        currentAisle: 1,
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
    
    // Update forklifts (vertical movement in aisles)
    this.forklifts.forEach(forklift => {
      this.updateResourceTrail(forklift, now);
      this.updateForkliftPosition(forklift);
    });

    // Update BOPTs (horizontal movement across aisles)
    this.bopts.forEach(bopt => {
      this.updateResourceTrail(bopt, now);
      this.updateBOPTPosition(bopt);
    });
  }

  private updateResourceTrail(resource: ForkliftResource | BOPTResource, now: number) {
    // Add current position to trail
    resource.trail.push({
      x: resource.x,
      y: resource.y,
      loaded: resource.loaded,
      timestamp: now,
    });

    // Keep only last 5 minutes of trail data
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    resource.trail = resource.trail.filter(point => point.timestamp > fiveMinutesAgo);
  }

  private updateForkliftPosition(forklift: ForkliftResource) {
    // Realistic aisle-based movement patterns (vertical)
    const movementSpeed = forklift.speed * 0.8;
    
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
      this.setNewForkliftTarget(forklift);
    }

    // Keep within warehouse bounds
    const maxY = warehouseConfig.binsPerAisle * warehouseConfig.cellHeight;
    forklift.y = Math.max(30, Math.min(maxY - 30, forklift.y));

    // Change load status at end of aisles
    if (Math.abs(forklift.y - (forklift.targetY || 0)) < 10) {
      if (Math.random() < 0.4) {
        forklift.loaded = !forklift.loaded;
      }
    }
  }

  private updateBOPTPosition(bopt: BOPTResource) {
    // BOPTs move horizontally across the warehouse
    const movementSpeed = bopt.speed * 0.6; // Slower than forklifts
    
    // Keep BOPT at consistent Y level with slight variation
    const baseY = bopt.targetY || bopt.y;
    bopt.y = baseY + (Math.random() - 0.5) * 15;
    
    // Move towards target X position
    const targetX = bopt.targetX || bopt.x;
    const deltaX = targetX - bopt.x;
    const direction = deltaX > 0 ? 1 : -1;
    
    // Move at consistent speed towards target
    if (Math.abs(deltaX) > movementSpeed) {
      bopt.x += direction * movementSpeed;
    } else {
      bopt.x = targetX;
      this.setNewBOPTTarget(bopt);
    }

    // Keep within warehouse bounds
    const maxX = warehouseConfig.aisles.length * (warehouseConfig.cellWidth * 2 + warehouseConfig.aisleWidth);
    bopt.x = Math.max(50, Math.min(maxX - 50, bopt.x));

    // Change load status at end points
    if (Math.abs(bopt.x - (bopt.targetX || 0)) < 10) {
      if (Math.random() < 0.3) {
        bopt.loaded = !bopt.loaded;
      }
    }
  }

  private setNewForkliftTarget(forklift: ForkliftResource) {
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

  private setNewBOPTTarget(bopt: BOPTResource) {
    const maxX = warehouseConfig.aisles.length * (warehouseConfig.cellWidth * 2 + warehouseConfig.aisleWidth);
    
    // Occasionally change Y level for more dynamic movement
    if (Math.random() < 0.4) {
      const levels = [80, 140, 200, 280, 320];
      bopt.targetY = levels[Math.floor(Math.random() * levels.length)];
    }
    
    // Set target to opposite end horizontally
    if (bopt.x < maxX / 2) {
      bopt.targetX = maxX - 80; // Go to right
      bopt.direction = 'right';
    } else {
      bopt.targetX = 80; // Go to left
      bopt.direction = 'left';
    }
  }

  addListener(callback: (resources: { forklifts: ForkliftResource[], bopts: BOPTResource[] }) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (resources: { forklifts: ForkliftResource[], bopts: BOPTResource[] }) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ 
      forklifts: [...this.forklifts], 
      bopts: [...this.bopts] 
    }));
  }

  getForklifts(): ForkliftResource[] {
    return [...this.forklifts];
  }

  getBOPTs(): BOPTResource[] {
    return [...this.bopts];
  }

  getAllResources(): { forklifts: ForkliftResource[], bopts: BOPTResource[] } {
    return { forklifts: [...this.forklifts], bopts: [...this.bopts] };
  }

  getResourceById(id: string): ForkliftResource | BOPTResource | undefined {
    const forklift = this.forklifts.find(f => f.id === id);
    if (forklift) return forklift;
    return this.bopts.find(b => b.id === id);
  }

  getForkliftById(id: string): ForkliftResource | undefined {
    return this.forklifts.find(forklift => forklift.id === id);
  }

  getBOPTById(id: string): BOPTResource | undefined {
    return this.bopts.find(bopt => bopt.id === id);
  }
}

export const resourceSimulator = new ResourceSimulator();
