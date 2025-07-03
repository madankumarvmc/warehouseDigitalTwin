import { warehouseLayout } from './warehouseLayout';

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
  
  let currentTime = now - timeSpan;
  let currentLocationData = getRandomCellInAisle(primaryAisle);
  let currentLocation = { x: currentLocationData.x, y: currentLocationData.y, id: currentLocationData.cellId };
  let isLoaded = false;
  
  // Start at aisle position
  trail.push({
    x: currentLocation.x,
    y: currentLocation.y,
    loaded: isLoaded,
    timestamp: currentTime,
    locationId: currentLocation.id,
    action: 'transit'
  });
  
  // Generate movement sequence (every 2-3 minutes)
  const movementInterval = 2 * 60 * 1000; // 2 minutes
  const numMoves = Math.floor(timeSpan / movementInterval);
  
  for (let i = 0; i < numMoves; i++) {
    currentTime += movementInterval + (Math.random() * 60 * 1000); // Add some variance
    
    // 80% chance to stay in primary aisle, 20% to venture to other areas
    if (Math.random() < 0.8) {
      // Stay in primary aisle
      const newLocationData = getRandomCellInAisle(primaryAisle);
      currentLocation = { x: newLocationData.x, y: newLocationData.y, id: newLocationData.cellId };
      
      // Simulate pickup/dropoff cycle
      if (!isLoaded && Math.random() < 0.6) {
        // Pickup item
        isLoaded = true;
        trail.push({
          x: currentLocation.x,
          y: currentLocation.y,
          loaded: isLoaded,
          timestamp: currentTime,
          locationId: currentLocation.id,
          action: 'pickup'
        });
      } else if (isLoaded && Math.random() < 0.4) {
        // Dropoff item
        isLoaded = false;
        trail.push({
          x: currentLocation.x,
          y: currentLocation.y,
          loaded: isLoaded,
          timestamp: currentTime,
          locationId: currentLocation.id,
          action: 'dropoff'
        });
      } else {
        // Transit movement
        trail.push({
          x: currentLocation.x,
          y: currentLocation.y,
          loaded: isLoaded,
          timestamp: currentTime,
          locationId: currentLocation.id,
          action: 'transit'
        });
      }
    } else {
      // Move to different area (receiving, shipping, staging)
      const zones = Object.values(WAREHOUSE_ZONES);
      const targetZone = zones[Math.floor(Math.random() * zones.length)];
      
      // Add intermediate points for realistic path
      const steps = 3;
      const deltaX = (targetZone.x - currentLocation.x) / steps;
      const deltaY = (targetZone.y - currentLocation.y) / steps;
      
      for (let step = 1; step <= steps; step++) {
        const stepTime = currentTime + (step * 30000); // 30 seconds per step
        trail.push({
          x: currentLocation.x + (deltaX * step),
          y: currentLocation.y + (deltaY * step),
          loaded: isLoaded,
          timestamp: stepTime,
          locationId: step === steps ? targetZone.id : 'TRANSIT',
          action: 'transit'
        });
      }
      
      currentLocation = { x: targetZone.x, y: targetZone.y, id: targetZone.id };
      currentTime += steps * 30000;
      
      // Likely to change load status at zones
      if (targetZone.id.includes('RECV') && !isLoaded) {
        isLoaded = true;
      } else if (targetZone.id.includes('SHIP') && isLoaded) {
        isLoaded = false;
      }
    }
  }
  
  return trail;
}

// Generate realistic BOPT movement trail (more horizontal, cross-aisle movement)
function generateBOPTTrail(boptId: string, timeRange: number): TrailPoint[] {
  const trail: TrailPoint[] = [];
  const now = Date.now();
  const timeSpan = timeRange * 60 * 1000;
  
  let currentTime = now - timeSpan;
  let currentLocation = WAREHOUSE_ZONES.RECEIVING; // BOPTs often start at receiving
  let isLoaded = false;
  
  // Start at receiving
  trail.push({
    x: currentLocation.x,
    y: currentLocation.y,
    loaded: isLoaded,
    timestamp: currentTime,
    locationId: currentLocation.id,
    action: 'transit'
  });
  
  // BOPTs move more frequently but shorter distances
  const movementInterval = 90 * 1000; // 90 seconds
  const numMoves = Math.floor(timeSpan / movementInterval);
  
  for (let i = 0; i < numMoves; i++) {
    currentTime += movementInterval + (Math.random() * 30 * 1000);
    
    // BOPTs primarily move horizontally between aisles and zones
    if (Math.random() < 0.6) {
      // Move to random aisle (horizontal movement pattern)
      const targetAisle = Math.floor(Math.random() * 5);
      const aisleLocation = getRandomCellInAisle(targetAisle);
      
      // Create horizontal path
      const steps = Math.max(2, Math.floor(Math.abs(aisleLocation.x - currentLocation.x) / 100));
      const deltaX = (aisleLocation.x - currentLocation.x) / steps;
      const deltaY = (aisleLocation.y - currentLocation.y) / steps;
      
      for (let step = 1; step <= steps; step++) {
        const stepTime = currentTime + (step * 20000); // 20 seconds per step
        trail.push({
          x: currentLocation.x + (deltaX * step),
          y: currentLocation.y + (deltaY * step),
          loaded: isLoaded,
          timestamp: stepTime,
          locationId: step === steps ? aisleLocation.cellId : 'TRANSIT',
          action: 'transit'
        });
      }
      
      currentLocation = { x: aisleLocation.x, y: aisleLocation.y, id: aisleLocation.cellId };
      currentTime += steps * 20000;
      
      // BOPTs handle smaller items, frequent load changes
      if (Math.random() < 0.5) {
        isLoaded = !isLoaded;
      }
    } else {
      // Move to zone (staging, shipping, etc.)
      const zones = [WAREHOUSE_ZONES.STAGING, WAREHOUSE_ZONES.SHIPPING, WAREHOUSE_ZONES.RECEIVING];
      const targetZone = zones[Math.floor(Math.random() * zones.length)];
      
      trail.push({
        x: targetZone.x,
        y: targetZone.y,
        loaded: isLoaded,
        timestamp: currentTime,
        locationId: targetZone.id,
        action: targetZone.id.includes('RECV') ? 'pickup' : 'dropoff'
      });
      
      currentLocation = targetZone;
      
      // Change load status at zones
      if (targetZone.id.includes('RECV')) {
        isLoaded = true;
      } else if (targetZone.id.includes('SHIP')) {
        isLoaded = false;
      }
    }
  }
  
  return trail;
}

// Generate movement trails for all resources
export function generateMovementTrails(timeRange: number): MovementTrail[] {
  const trails: MovementTrail[] = [];
  
  // Generate forklift trails
  for (let i = 1; i <= 3; i++) {
    const forkliftId = `FL-${i.toString().padStart(3, '0')}`;
    trails.push({
      resourceId: forkliftId,
      resourceType: 'forklift',
      trail: generateForkliftTrail(forkliftId, timeRange),
      timeRange
    });
  }
  
  // Generate BOPT trails
  for (let i = 1; i <= 5; i++) {
    const boptId = `BOPT-${i.toString().padStart(3, '0')}`;
    trails.push({
      resourceId: boptId,
      resourceType: 'bopt',
      trail: generateBOPTTrail(boptId, timeRange),
      timeRange
    });
  }
  
  return trails;
}

// Get trail for specific resource
export function getResourceTrail(resourceId: string, timeRange: number): TrailPoint[] {
  const trails = generateMovementTrails(timeRange);
  const resourceTrail = trails.find(t => t.resourceId === resourceId);
  return resourceTrail ? resourceTrail.trail : [];
}