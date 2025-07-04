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

// Persistent trail storage to ensure data consistency when time range changes
interface PersistentTrailData {
  [resourceId: string]: {
    baseTrail: TrailPoint[];
    maxTimeRange: number;
    lastGenerated: number;
  };
}

const trailStorage: PersistentTrailData = {};

// Clear existing trails to regenerate with new work hours logic
Object.keys(trailStorage).forEach(key => delete trailStorage[key]);

// Define key warehouse locations for realistic movement using actual dock and staging positions
function getWarehouseZones() {
  const dockDoors = warehouseLayout.dockDoorPositions;
  const stagingAreas = warehouseLayout.stagingAreas;
  
  return {
    // Use actual dock doors for receiving/shipping
    RECEIVING: dockDoors[0] ? { 
      x: dockDoors[0].x + dockDoors[0].width / 2, 
      y: dockDoors[0].y + dockDoors[0].height / 2, 
      id: dockDoors[0].id 
    } : { x: 50, y: 50, id: 'RECV-01' },
    
    SHIPPING: dockDoors[2] ? { 
      x: dockDoors[2].x + dockDoors[2].width / 2, 
      y: dockDoors[2].y + dockDoors[2].height / 2, 
      id: dockDoors[2].id 
    } : { x: 50, y: 400, id: 'SHIP-01' },
    
    // Use actual staging areas
    STAGING_1: stagingAreas[0] ? { 
      x: stagingAreas[0].x + stagingAreas[0].width / 2, 
      y: stagingAreas[0].y + stagingAreas[0].height / 2, 
      id: stagingAreas[0].id 
    } : { x: 100, y: 100, id: 'STAGE-01' },
    
    STAGING_2: stagingAreas[1] ? { 
      x: stagingAreas[1].x + stagingAreas[1].width / 2, 
      y: stagingAreas[1].y + stagingAreas[1].height / 2, 
      id: stagingAreas[1].id 
    } : { x: 100, y: 200, id: 'STAGE-02' },
    
    MAINTENANCE: { x: 60, y: 500, id: 'MAINT-01' },
    OFFICE: { x: 60, y: 250, id: 'OFFICE-01' }
  };
}

// Get aisle centers for realistic movement patterns
function getAisleCenter(aisleIndex: number): { x: number, y: number } {
  const { aisleWidth, cellWidth, dockOffset } = warehouseLayout;
  const x = dockOffset + aisleIndex * (cellWidth * 2 + aisleWidth) + cellWidth + (aisleWidth / 2);
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
  const now = Date.now();
  const timeSpan = timeRange * 60 * 1000;
  
  // Check if we have existing data for this resource
  const existingData = trailStorage[forkliftId];
  
  if (existingData && timeRange <= existingData.maxTimeRange) {
    // Return filtered data from existing trail for shorter time ranges
    const cutoffTime = now - timeSpan;
    return existingData.baseTrail.filter(point => point.timestamp >= cutoffTime);
  }
  
  // Generate new trail data (extending existing if needed)
  const primaryAisle = parseInt(forkliftId.split('-')[1]) % 5;
  const seed = forkliftId.charCodeAt(forkliftId.length - 1) + 1000; // Fixed seed for consistency
  const random = new SeededRandom(seed);
  
  const warehouseZones = getWarehouseZones();
  const startingZones = [
    ...Object.values(warehouseZones),
    ...Array.from({length: 5}, (_, i) => {
      const center = getAisleCenter(i);
      return { x: center.x, y: center.y + (random.next() - 0.5) * 200, id: `AISLE-${i}` };
    })
  ];
  
  let trail: TrailPoint[] = [];
  let currentTime: number;
  let currentLocation: { x: number; y: number; id: string };
  let isLoaded: boolean;
  
  if (existingData && timeRange > existingData.maxTimeRange) {
    // Extend existing trail
    trail = [...existingData.baseTrail];
    const lastPoint = trail[trail.length - 1];
    currentTime = lastPoint.timestamp;
    currentLocation = { x: lastPoint.x, y: lastPoint.y, id: lastPoint.locationId };
    isLoaded = lastPoint.loaded;
  } else {
    // Start fresh
    currentTime = now - timeSpan;
    currentLocation = startingZones[Math.floor(random.next() * startingZones.length)];
    isLoaded = random.next() < 0.3;
    
    trail.push({
      x: currentLocation.x,
      y: currentLocation.y,
      loaded: isLoaded,
      timestamp: currentTime,
      locationId: currentLocation.id,
      action: 'transit'
    });
  }
  
  // Generate points for the full time range requested
  const totalTimeSpan = timeRange * 60 * 1000;
  
  // Define 8-hour work period within the time range
  const workDayDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const workStartOffset = Math.max(0, (totalTimeSpan - workDayDuration) / 2);
  const workStartTime = (now - totalTimeSpan) + workStartOffset;
  const workEndTime = Math.min(now, workStartTime + workDayDuration);
  
  // Only generate movements during work hours
  if (currentTime < workStartTime) {
    currentTime = workStartTime;
  }
  
  const targetTime = Math.min(now, workEndTime);
  
  while (currentTime < targetTime) {
    // Realistic movement timing based on load status
    let movementDuration: number;
    if (isLoaded) {
      // Movement with load: 1-12 minutes (slower, more careful)
      movementDuration = (1 + random.next() * 11) * 60 * 1000;
    } else {
      // Movement without load: 2-15 minutes (faster but can include longer travels)
      movementDuration = (2 + random.next() * 13) * 60 * 1000;
    }
    
    currentTime += movementDuration;
    
    if (currentTime > targetTime) break;
    
    let nextLocation;
    
    // Realistic movement patterns
    if (random.next() < 0.6) {
      const targetAisle = random.next() < 0.7 ? primaryAisle : Math.floor(random.next() * 5);
      const aisleData = getRandomCellInAisle(targetAisle);
      nextLocation = { x: aisleData.x, y: aisleData.y, id: aisleData.cellId };
    } else {
      const zones = Object.values(warehouseZones);
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
    
    // Toggle load state occasionally to create realistic pickup/dropoff patterns
    if (random.next() < 0.4) {
      isLoaded = !isLoaded;
    }
    
    currentLocation = nextLocation;
  }
  
  // Store the generated trail
  trailStorage[forkliftId] = {
    baseTrail: trail,
    maxTimeRange: timeRange,
    lastGenerated: now
  };
  
  // Return filtered data for requested time range
  const cutoffTime = now - timeSpan;
  return trail.filter(point => point.timestamp >= cutoffTime);
}

// Generate realistic BOPT movement trail (more horizontal, cross-aisle movement)
function generateBOPTTrail(boptId: string, timeRange: number): TrailPoint[] {
  const now = Date.now();
  const timeSpan = timeRange * 60 * 1000;
  
  // Check if we have existing data for this resource
  const existingData = trailStorage[boptId];
  
  if (existingData && timeRange <= existingData.maxTimeRange) {
    // Return filtered data from existing trail for shorter time ranges
    const cutoffTime = now - timeSpan;
    return existingData.baseTrail.filter(point => point.timestamp >= cutoffTime);
  }
  
  // Generate new trail data (extending existing if needed)
  const seed = boptId.charCodeAt(boptId.length - 1) + 2000; // Fixed seed for consistency
  const random = new SeededRandom(seed);
  
  const warehouseZones = getWarehouseZones();
  const startingLocations = [
    warehouseZones.RECEIVING,
    warehouseZones.SHIPPING,
    warehouseZones.STAGING_1,
    ...Array.from({length: 8}, (_, i) => {
      const x = 100 + (i * 100);
      const y = 150 + (random.next() * 300);
      return { x, y, id: `CROSS-${i}` };
    })
  ];
  
  let trail: TrailPoint[] = [];
  let currentTime: number;
  let currentLocation: { x: number; y: number; id: string };
  let isLoaded: boolean;
  
  if (existingData && timeRange > existingData.maxTimeRange) {
    // Extend existing trail
    trail = [...existingData.baseTrail];
    const lastPoint = trail[trail.length - 1];
    currentTime = lastPoint.timestamp;
    currentLocation = { x: lastPoint.x, y: lastPoint.y, id: lastPoint.locationId };
    isLoaded = lastPoint.loaded;
  } else {
    // Start fresh
    currentTime = now - timeSpan;
    currentLocation = startingLocations[Math.floor(random.next() * startingLocations.length)];
    isLoaded = random.next() < 0.4;
    
    trail.push({
      x: currentLocation.x,
      y: currentLocation.y,
      loaded: isLoaded,
      timestamp: currentTime,
      locationId: currentLocation.id,
      action: 'transit'
    });
  }
  
  // Generate points for the full time range requested
  const totalTimeSpan = timeRange * 60 * 1000;
  
  // Define 8-hour work period within the time range
  const workDayDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const workStartOffset = Math.max(0, (totalTimeSpan - workDayDuration) / 2);
  const workStartTime = (now - totalTimeSpan) + workStartOffset;
  const workEndTime = Math.min(now, workStartTime + workDayDuration);
  
  // Only generate movements during work hours
  if (currentTime < workStartTime) {
    currentTime = workStartTime;
  }
  
  const targetTime = Math.min(now, workEndTime);
  
  while (currentTime < targetTime) {
    // Realistic movement timing based on load status
    let movementDuration: number;
    if (isLoaded) {
      // Movement with load: 1-12 minutes (slower, more careful)
      movementDuration = (1 + random.next() * 11) * 60 * 1000;
    } else {
      // Movement without load: 2-15 minutes (faster but can include longer travels)
      movementDuration = (2 + random.next() * 13) * 60 * 1000;
    }
    
    currentTime += movementDuration;
    
    if (currentTime > targetTime) break;
    
    let nextLocation;
    
    // BOPTs move more horizontally across warehouse
    if (random.next() < 0.7) {
      const targetAisle = Math.floor(random.next() * 5);
      const aisleData = getRandomCellInAisle(targetAisle);
      nextLocation = { x: aisleData.x, y: aisleData.y, id: aisleData.cellId };
    } else {
      const zones = Object.values(warehouseZones);
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
  
  // Store the generated trail
  trailStorage[boptId] = {
    baseTrail: trail,
    maxTimeRange: timeRange,
    lastGenerated: now
  };
  
  // Return filtered data for requested time range
  const cutoffTime = now - timeSpan;
  return trail.filter(point => point.timestamp >= cutoffTime);
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