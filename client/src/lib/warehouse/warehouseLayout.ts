import { WarehouseLayout, CellPosition, DockDoor, StagingArea } from './types';

export const warehouseConfig = {
  aisles: ['A1', 'A2', 'A3', 'A4', 'A5'],
  binsPerAisle: 12,
  levels: 2,
  depth: 2,
  cellWidth: 40,
  cellHeight: 30,
  aisleWidth: 120,
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

  // Generate storage cells with adjusted X position to make room for docks
  for (let aisleIndex = 0; aisleIndex < warehouseConfig.aisles.length; aisleIndex++) {
    const aisleName = warehouseConfig.aisles[aisleIndex];
    
    for (let bin = 1; bin <= warehouseConfig.binsPerAisle; bin++) {
      for (let level = 1; level <= warehouseConfig.levels; level++) {
        for (let depth = 1; depth <= warehouseConfig.depth; depth++) {
          const cellId = `${aisleName}-B${bin.toString().padStart(2, '0')}-L${level}-D${depth}`;
          
          // Calculate position based on aisle layout - offset to right to make room for docks
          const aisleX = dockOffset + aisleIndex * (cellWidth * 2 + aisleWidth);
          const rackSide = depth === 1 ? 0 : 1; // D1 = left side, D2 = right side
          const x = aisleX + rackSide * (cellWidth + aisleWidth);
          const y = (bin - 1) * cellHeight + (level - 1) * cellHeight * warehouseConfig.binsPerAisle;

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
  const totalWarehouseHeight = warehouseConfig.binsPerAisle * warehouseConfig.levels * cellHeight;
  const dockSpacing = totalWarehouseHeight / dockDoors;
  
  for (let i = 0; i < dockDoors; i++) {
    const dockId = `DOCK-${i + 1}`;
    const dockY = i * dockSpacing + (dockSpacing - dockHeight) / 2;
    
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
