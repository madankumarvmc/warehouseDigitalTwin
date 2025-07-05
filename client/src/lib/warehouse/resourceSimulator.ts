import { ForkliftResource, BOPTResource } from './types';
import { warehouseConfig } from './warehouseLayout';

export class ResourceSimulator {
  private forklifts: ForkliftResource[] = [];
  private bopts: BOPTResource[] = [];
  private animationId: number | null = null;
  private listeners: ((resources: { forklifts: ForkliftResource[], bopts: BOPTResource[] }) => void)[] = [];
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 1000; // Check every second for resource scheduling
  private resourceSchedule: Map<string, number> = new Map(); // Track next move time for each resource

  constructor() {
    this.initializeForklifts();
    this.initializeBOPTs();
    this.initializeResourceSchedule();
  }

  private initializeResourceSchedule() {
    const now = Date.now();
    // Stagger initial movement times for realistic warehouse operations
    this.forklifts.forEach((forklift, index) => {
      // Spread forklift movements over 25-35 seconds
      this.resourceSchedule.set(forklift.id, now + (index * 8000) + Math.random() * 10000);
    });
    
    this.bopts.forEach((bopt, index) => {
      // Spread BOPT movements over 30-40 seconds  
      this.resourceSchedule.set(bopt.id, now + (index * 10000) + Math.random() * 15000);
    });
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
    let resourcesMovedThisCycle = 0;
    const maxResourcesPerCycle = 3; // Maximum 3 resources can move simultaneously
    
    // Check forklifts for scheduled movements
    this.forklifts.forEach(forklift => {
      const nextMoveTime = this.resourceSchedule.get(forklift.id) || 0;
      
      if (now >= nextMoveTime && resourcesMovedThisCycle < maxResourcesPerCycle) {
        // Time for this forklift to move
        this.updateForkliftPosition(forklift);
        this.updateResourceTrail(forklift, now);
        
        // Schedule next movement in 25-35 seconds (realistic forklift operation)
        const nextMove = now + 25000 + Math.random() * 10000;
        this.resourceSchedule.set(forklift.id, nextMove);
        
        resourcesMovedThisCycle++;
        console.log(`${forklift.id} moved, next move in ${Math.round((nextMove - now) / 1000)}s`);
      }
    });

    // Check BOPTs for scheduled movements
    this.bopts.forEach(bopt => {
      const nextMoveTime = this.resourceSchedule.get(bopt.id) || 0;
      
      if (now >= nextMoveTime && resourcesMovedThisCycle < maxResourcesPerCycle) {
        // Time for this BOPT to move
        this.updateBOPTPosition(bopt);
        this.updateResourceTrail(bopt, now);
        
        // Schedule next movement in 30-45 seconds (realistic BOPT operation)
        const nextMove = now + 30000 + Math.random() * 15000;
        this.resourceSchedule.set(bopt.id, nextMove);
        
        resourcesMovedThisCycle++;
        console.log(`${bopt.id} moved, next move in ${Math.round((nextMove - now) / 1000)}s`);
      }
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
    // Realistic aisle-based movement patterns (vertical) - increased speed for longer distances
    const movementSpeed = forklift.speed * 2.0; // Increased from 0.8 to 2.0
    
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
    // BOPTs move horizontally across the warehouse - increased speed for longer distances
    const movementSpeed = bopt.speed * 1.8; // Increased from 0.6 to 1.8
    
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
    
    // Occasionally switch aisles for cross-aisle movement (20% chance)
    if (Math.random() < 0.2) {
      const currentAisle = forklift.currentAisle || 0;
      const adjacentAisles = [
        Math.max(0, currentAisle - 1),
        Math.min(warehouseConfig.aisles.length - 1, currentAisle + 1)
      ];
      forklift.currentAisle = adjacentAisles[Math.floor(Math.random() * adjacentAisles.length)];
    }
    
    // Make MUCH longer movements - travel most of aisle length
    const maxBins = Math.floor(maxY / warehouseConfig.cellHeight);
    
    // 80% chance for full aisle traversal, 20% chance for half aisle
    if (Math.random() < 0.8) {
      // Full aisle traversal - go to opposite end
      if (forklift.y < maxY / 2) {
        forklift.targetY = maxY - 40; // Go to bottom end
        forklift.direction = 'down';
      } else {
        forklift.targetY = 40; // Go to top end
        forklift.direction = 'up';
      }
    } else {
      // Half aisle movement - still significant distance
      const currentBin = Math.floor(forklift.y / warehouseConfig.cellHeight);
      const halfAisleDistance = Math.floor(maxBins / 2);
      let targetBin;
      
      if (currentBin < maxBins / 2) {
        targetBin = Math.min(maxBins - 1, currentBin + halfAisleDistance);
        forklift.direction = 'down';
      } else {
        targetBin = Math.max(0, currentBin - halfAisleDistance);
        forklift.direction = 'up';
      }
      
      forklift.targetY = targetBin * warehouseConfig.cellHeight + 30;
    }
  }

  private setNewBOPTTarget(bopt: BOPTResource) {
    const maxX = warehouseConfig.aisles.length * (warehouseConfig.cellWidth * 2 + warehouseConfig.aisleWidth);
    
    // BOPTs traverse entire warehouse width - much longer movements
    const currentAisle = Math.floor((bopt.x - 80) / 120);
    const maxAisle = warehouseConfig.aisles.length - 1;
    
    // 70% chance for full warehouse traversal, 30% for staging areas
    if (Math.random() < 0.7) {
      // Full warehouse width traversal - go to opposite side
      if (bopt.x < maxX / 2) {
        // Currently on left side, move to right side of warehouse
        const rightSideAisles = [3, 4]; // Right side aisles
        const targetAisle = rightSideAisles[Math.floor(Math.random() * rightSideAisles.length)];
        bopt.targetX = 80 + (targetAisle * 120);
        bopt.direction = 'right';
      } else {
        // Currently on right side, move to left side of warehouse
        const leftSideAisles = [0, 1]; // Left side aisles
        const targetAisle = leftSideAisles[Math.floor(Math.random() * leftSideAisles.length)];
        bopt.targetX = 80 + (targetAisle * 120);
        bopt.direction = 'left';
      }
    } else {
      // Move to staging areas at warehouse ends
      const stagingAreas = [50, maxX - 50]; // Far left or far right staging
      bopt.targetX = stagingAreas[Math.floor(Math.random() * stagingAreas.length)];
      bopt.direction = bopt.targetX > bopt.x ? 'right' : 'left';
    }
    
    // Occasionally change Y level for cross-aisle movement
    if (Math.random() < 0.3) {
      const levels = [120, 180, 240, 300]; // Warehouse levels
      bopt.targetY = levels[Math.floor(Math.random() * levels.length)];
    }
    
    // Set direction
    bopt.direction = bopt.targetX > bopt.x ? 'right' : 'left';
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
