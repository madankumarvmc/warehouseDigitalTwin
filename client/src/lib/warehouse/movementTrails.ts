import { warehouseLayout } from './warehouseLayout';

// Seeded random number generator for consistent trails
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export interface TrailPoint {
  x: number;
  y: number;
  loaded: boolean;
  timestamp: number;
  locationId: string; // Cell ID or area identifier
  action?: 'pickup' | 'dropoff' | 'transit';
}

export interface MovementTrail {
  resourceId: string;
  resourceType: 'forklift' | 'bopt';
  trail: TrailPoint[];
  timeRange: number; // in minutes
}

// Define key warehouse locations for realistic movement
const WAREHOUSE_ZONES = {
  RECEIVING: { x: 50, y: 50, id: 'RECV-01' },
  SHIPPING: { x: 750, y: 550, id: 'SHIP-01' },
  STAGING: { x: 400, y: 100, id: 'STAGE-01' },
  MAINTENANCE: { x: 100, y: 500, id: 'MAINT-01' },
  OFFICE: { x: 50, y: 250, id: 'OFFICE-01' }
};

// Get aisle centers for realistic movement patterns
function getAisleCenter(aisleIndex: number): { x: number, y: number } {
  const aisleWidth = warehouseLayout.aisleWidth;
  const cellWidth = warehouseLayout.cellWidth;
  const x = aisleIndex * (cellWidth * 2 + aisleWidth) + cellWidth + (aisleWidth / 2);
  return { x, y: 300 }; // Middle of warehouse height
}

// Get random cell in specific aisle
function getRandomCellInAisle(aisleIndex: number): { x: number, y: number, cellId: string } {
  const aisleCells = warehouseLayout.cells.filter(cell => 
    cell.aisle === String.fromCharCode(65 + aisleIndex) // A, B, C, D, E
  );
  if (aisleCells.length === 0) {
    const center = getAisleCenter(aisleIndex);
    return { x: center.x, y: center.y, cellId: `${String.fromCharCode(65 + aisleIndex)}-UNKNOWN` };
  }
  
  const randomCell = aisleCells[Math.floor(Math.random() * aisleCells.length)];
  return { 
    x: randomCell.x + randomCell.width / 2, 
    y: randomCell.y + randomCell.height / 2,
    cellId: randomCell.cellId 
  };
}

// Generate realistic forklift movement trail
function generateForkliftTrail(forkliftId: string, timeRange: number): TrailPoint[] {
  const trail: TrailPoint[] = [];
  const now = Date.now();
  const timeSpan = timeRange * 60 * 1000; // Convert to milliseconds
  const primaryAisle = parseInt(forkliftId.split('-')[1]) % 5; // Assign primary aisle based on ID
  
  // Create seeded random generator based on resource ID and time range
  const seed = forkliftId.charCodeAt(forkliftId.length - 1) + timeRange;
  const random = new SeededRandom(seed);
  
  // Create more diverse starting locations across warehouse
  const startingZones = [
    ...Object.values(WAREHOUSE_ZONES),
    ...Array.from({length: 5}, (_, i) => {
      const center = getAisleCenter(i);
      return { x: center.x, y: center.y + (random.next() - 0.5) * 200, id: `AISLE-${i}` };
    })
  ];
  
  let currentTime = now - timeSpan;
  let currentLocation = startingZones[Math.floor(random.next() * startingZones.length)];
  let isLoaded = random.next() < 0.3; // 30% chance to start loaded
  
  // Start position
  trail.push({
    x: currentLocation.x,
    y: currentLocation.y,
    loaded: isLoaded,
    timestamp: currentTime,
    locationId: currentLocation.id,
    action: 'transit'
  });
  
  // Generate movement sequence based on time range (more points for longer ranges)
  const movementInterval = Math.max(30000, (timeSpan / 20)); // 20 moves max, min 30 seconds apart
  const numMoves = Math.min(20, Math.floor(timeSpan / movementInterval));
  
  for (let i = 0; i < numMoves; i++) {
    currentTime += movementInterval;
    
    // Ensure we don't go past current time
    if (currentTime > now) break;
    
    let nextLocation;
    
    // Determine next destination with varied movement patterns
    if (random.next() < 0.6) {
      // Move within warehouse aisles (60% of time)
      const targetAisle = random.next() < 0.7 ? primaryAisle : Math.floor(random.next() * 5);
      const aisleData = getRandomCellInAisle(targetAisle);
      nextLocation = { x: aisleData.x, y: aisleData.y, id: aisleData.cellId };
    } else {
      // Move to warehouse zones (40% of time)
      const zones = Object.values(WAREHOUSE_ZONES);
      nextLocation = zones[Math.floor(random.next() * zones.length)];
    }
    
    // Add the movement point
    trail.push({
      x: nextLocation.x,
      y: nextLocation.y,
      loaded: isLoaded,
      timestamp: currentTime,
      locationId: nextLocation.id,
      action: 'transit'
    });
    
    // Change load status occasionally
    if (random.next() < 0.3) {
      isLoaded = !isLoaded;
    }
    
    currentLocation = nextLocation;
  }
  
  return trail;
}

// Generate realistic BOPT movement trail (more horizontal, cross-aisle movement)
function generateBOPTTrail(boptId: string, timeRange: number): TrailPoint[] {
  const trail: TrailPoint[] = [];
  const now = Date.now();
  const timeSpan = timeRange * 60 * 1000;
  
  // Create seeded random generator based on resource ID and time range
  const seed = boptId.charCodeAt(boptId.length - 1) + timeRange * 2;
  const random = new SeededRandom(seed);
  
  // BOPTs start from various horizontal locations
  const startingLocations = [
    WAREHOUSE_ZONES.RECEIVING,
    WAREHOUSE_ZONES.SHIPPING,
    WAREHOUSE_ZONES.STAGING,
    ...Array.from({length: 8}, (_, i) => {
      const x = 100 + (i * 100);
      const y = 150 + (random.next() * 300);
      return { x, y, id: `CROSS-${i}` };
    })
  ];
  
  let currentTime = now - timeSpan;
  let currentLocation = startingLocations[Math.floor(random.next() * startingLocations.length)];
  let isLoaded = random.next() < 0.4;
  
  // Start position
  trail.push({
    x: currentLocation.x,
    y: currentLocation.y,
    loaded: isLoaded,
    timestamp: currentTime,
    locationId: currentLocation.id,
    action: 'transit'
  });
  
  // Generate movement sequence based on time range
  const movementInterval = Math.max(45000, (timeSpan / 15));
  const numMoves = Math.min(15, Math.floor(timeSpan / movementInterval));
  
  for (let i = 0; i < numMoves; i++) {
    currentTime += movementInterval;
    
    if (currentTime > now) break;
    
    let nextLocation;
    
    // BOPTs move more horizontally across warehouse
    if (random.next() < 0.7) {
      const targetAisle = Math.floor(random.next() * 5);
      const aisleData = getRandomCellInAisle(targetAisle);
      nextLocation = { x: aisleData.x, y: aisleData.y, id: aisleData.cellId };
    } else {
      const zones = Object.values(WAREHOUSE_ZONES);
      nextLocation = zones[Math.floor(random.next() * zones.length)];
    }
    
    trail.push({
      x: nextLocation.x,
      y: nextLocation.y,
      loaded: isLoaded,
      timestamp: currentTime,
      locationId: nextLocation.id,
      action: 'transit'
    });
    
    if (random.next() < 0.4) {
      isLoaded = !isLoaded;
    }
    
    currentLocation = nextLocation;
  }
  
  return trail;
}

// Generate movement trails for all resources
export function generateMovementTrails(timeRange: number): MovementTrail[] {
  const trails: MovementTrail[] = [];
  
  // Generate forklift trails - match exact IDs from resourceSimulator
  const forkliftIds = ['FL-001', 'FL-002', 'FL-003'];
  forkliftIds.forEach(forkliftId => {
    trails.push({
      resourceId: forkliftId,
      resourceType: 'forklift',
      trail: generateForkliftTrail(forkliftId, timeRange),
      timeRange
    });
  });
  
  // Generate BOPT trails - match exact IDs from resourceSimulator
  const boptIds = ['BOPT-001', 'BOPT-002', 'BOPT-003', 'BOPT-004', 'BOPT-005'];
  boptIds.forEach(boptId => {
    trails.push({
      resourceId: boptId,
      resourceType: 'bopt',
      trail: generateBOPTTrail(boptId, timeRange),
      timeRange
    });
  });
  
  return trails;
}

// Get trail for specific resource
export function getResourceTrail(resourceId: string, timeRange: number): TrailPoint[] {
  const trails = generateMovementTrails(timeRange);
  const resourceTrail = trails.find(t => t.resourceId === resourceId);
  
  // Debug logging to see what's happening
  console.log('Requested trail for:', resourceId);
  console.log('Available trails:', trails.map(t => ({ id: t.resourceId, points: t.trail.length })));
  console.log('Found trail:', resourceTrail ? resourceTrail.trail.length : 'none');
  
  return resourceTrail ? resourceTrail.trail : [];
}