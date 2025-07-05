import { WarehouseLayout, CellPosition, DockDoor, StagingArea } from './types';

export const warehouseConfig = {
  aisles: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
  binsPerAisle: 12,
  levels: 2,
  depth: 2,
  cellWidth: 40,
  cellHeight: 30,
  aisleWidth: 120,
  // Transverse aisle configuration
  transverseAisleWidth: 80, // Width of the horizontal corridor
  transverseAislePosition: 6, // Between bin 6 and 7 (after dock 2, before dock 3)
  // Dock configuration
  dockDoors: 4,
  dockWidth: 60,
  dockHeight: 40,
  stagingWidth: 80,
  stagingHeight: 60,
  dockOffset: 150, // Distance from left edge
};

export function generateWarehouseLayout(): WarehouseLayout {
  const cells: CellPosition[] = [];
  const dockDoorPositions: DockDoor[] = [];
  const stagingAreas: StagingArea[] = [];
  
  const { 
    cellWidth, 
    cellHeight, 
    aisleWidth, 
    dockDoors, 
    dockWidth, 
    dockHeight, 
    stagingWidth, 
    stagingHeight, 
    dockOffset 
  } = warehouseConfig;

  // Generate storage cells with transverse aisle - split into upper and lower sections
  for (let aisleIndex = 0; aisleIndex < warehouseConfig.aisles.length; aisleIndex++) {
    const aisleName = warehouseConfig.aisles[aisleIndex];
    
    for (let bin = 1; bin <= warehouseConfig.binsPerAisle; bin++) {
      // Skip bins at transverse aisle position to create the horizontal corridor
      if (bin === warehouseConfig.transverseAislePosition || bin === warehouseConfig.transverseAislePosition + 1) {
        continue;
      }
      
      for (let level = 1; level <= warehouseConfig.levels; level++) {
        for (let depth = 1; depth <= warehouseConfig.depth; depth++) {
          const cellId = `${aisleName}-B${bin.toString().padStart(2, '0')}-L${level}-D${depth}`;
          
          // Calculate position based on aisle layout - offset to right to make room for docks
          const aisleX = dockOffset + aisleIndex * (cellWidth * 2 + aisleWidth);
          const rackSide = depth === 1 ? 0 : 1; // D1 = left side, D2 = right side
          const x = aisleX + rackSide * (cellWidth + aisleWidth);
          
          // Adjust Y position based on whether bin is before or after transverse aisle
          let y;
          if (bin < warehouseConfig.transverseAislePosition) {
            // Upper section - bins 1 to (transverseAislePosition - 1)
            y = (bin - 1) * cellHeight + (level - 1) * cellHeight * (warehouseConfig.transverseAislePosition - 1);
          } else {
            // Lower section - bins after transverse aisle, with gap for corridor
            const adjustedBin = bin - 2; // Account for the 2 bins removed for transverse aisle
            const transverseGap = warehouseConfig.transverseAisleWidth;
            const upperSectionHeight = (warehouseConfig.transverseAislePosition - 1) * cellHeight * warehouseConfig.levels;
            y = upperSectionHeight + transverseGap + (adjustedBin - warehouseConfig.transverseAislePosition + 1) * cellHeight + (level - 1) * cellHeight * (warehouseConfig.binsPerAisle - warehouseConfig.transverseAislePosition - 1);
          }

          cells.push({
            cellId,
            x,
            y,
            width: cellWidth,
            height: cellHeight,
            aisle: aisleName,
            bin,
            level,
            depth,
          });
        }
      }
    }
  }

  // Generate dock doors on the left side
  // Calculate total warehouse height including transverse aisle
  const upperSectionHeight = (warehouseConfig.transverseAislePosition - 1) * cellHeight * warehouseConfig.levels;
  const lowerSectionHeight = (warehouseConfig.binsPerAisle - warehouseConfig.transverseAislePosition - 1) * cellHeight * warehouseConfig.levels;
  const totalWarehouseHeight = upperSectionHeight + warehouseConfig.transverseAisleWidth + lowerSectionHeight;
  const dockSpacing = totalWarehouseHeight / dockDoors;
  
  // Distribute docks properly: 2 in upper section, 2 in lower section
  const dock1Y = upperSectionHeight / 4;
  const dock2Y = upperSectionHeight * 3 / 4;
  const dock3Y = upperSectionHeight + warehouseConfig.transverseAisleWidth + lowerSectionHeight / 4;
  const dock4Y = upperSectionHeight + warehouseConfig.transverseAisleWidth + lowerSectionHeight * 3 / 4;
  
  const dockPositions = [dock1Y, dock2Y, dock3Y, dock4Y];
  
  for (let i = 0; i < dockDoors; i++) {
    const dockId = `DOCK-${i + 1}`;
    const dockY = dockPositions[i];
    
    dockDoorPositions.push({
      id: dockId,
      x: 10, // Left edge of warehouse
      y: dockY,
      width: dockWidth,
      height: dockHeight,
      status: i % 3 === 0 ? 'occupied' : (i % 2 === 0 ? 'open' : 'closed')
    });

    // Create staging area for each dock door
    stagingAreas.push({
      id: `STAGING-${i + 1}`,
      dockId: dockId,
      x: 80, // Adjacent to dock doors
      y: dockY - 10, // Slightly larger than dock door
      width: stagingWidth,
      height: stagingHeight,
      occupied: i % 4 === 0 // Some staging areas are occupied
    });
  }

  return {
    ...warehouseConfig,
    cells,
    dockDoorPositions,
    stagingAreas,
  };
}

export const warehouseLayout = generateWarehouseLayout();
