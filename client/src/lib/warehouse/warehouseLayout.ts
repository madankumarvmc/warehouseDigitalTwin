import { WarehouseLayout, CellPosition, DockDoor, StagingArea } from './types';

export const warehouseConfig = {
  aisles: ['A1', 'A2', 'A3', 'A4', 'A5'],
  binsPerAisle: 12,
  levels: 2,
  depth: 2,
  cellWidth: 50,  // Increased for horizontal layout
  cellHeight: 40, // Increased for horizontal layout
  aisleWidth: 80,  // Aisle spacing for horizontal layout
  // Dock configuration - now at bottom
  dockDoors: 4,
  dockWidth: 80,  // Wider docks for horizontal layout
  dockHeight: 50, // Taller docks
  stagingWidth: 100,  // Larger staging areas
  stagingHeight: 80,
  dockOffset: 150, // Distance from bottom edge
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

  // Generate storage cells - HORIZONTAL AISLES with docks at bottom
  for (let aisleIndex = 0; aisleIndex < warehouseConfig.aisles.length; aisleIndex++) {
    const aisleName = warehouseConfig.aisles[aisleIndex];
    
    for (let bin = 1; bin <= warehouseConfig.binsPerAisle; bin++) {
      for (let level = 1; level <= warehouseConfig.levels; level++) {
        for (let depth = 1; depth <= warehouseConfig.depth; depth++) {
          const cellId = `${aisleName}-B${bin.toString().padStart(2, '0')}-L${level}-D${depth}`;
          
          // HORIZONTAL layout: aisles run left-to-right, bins are sequential horizontally
          const x = 100 + (bin - 1) * cellWidth; // Bins arranged horizontally
          
          // Y position: aisle spacing with levels stacked vertically within each aisle
          const baseY = 80 + aisleIndex * (cellHeight * warehouseConfig.levels + aisleWidth); // Aisle vertical spacing
          const levelOffset = (level - 1) * cellHeight; // Stack levels vertically
          const depthOffset = depth === 1 ? 0 : cellHeight * warehouseConfig.levels + 10; // D1 on top, D2 below with gap
          const y = baseY + levelOffset + depthOffset;

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

  // Generate dock doors at the BOTTOM of warehouse (transverse to horizontal aisles)
  const totalWarehouseWidth = warehouseConfig.binsPerAisle * cellWidth;
  const dockSpacing = totalWarehouseWidth / dockDoors;
  
  // Calculate bottom position (below all aisles)
  const warehouseBottomY = 80 + warehouseConfig.aisles.length * (cellHeight * warehouseConfig.levels * warehouseConfig.depth + aisleWidth) + 50;
  
  for (let i = 0; i < dockDoors; i++) {
    const dockId = `DOCK-${i + 1}`;
    const dockX = 100 + i * dockSpacing + (dockSpacing - dockWidth) / 2;
    
    dockDoorPositions.push({
      id: dockId,
      x: dockX,
      y: warehouseBottomY, // Bottom edge of warehouse
      width: dockWidth,
      height: dockHeight,
      status: i % 3 === 0 ? 'occupied' : (i % 2 === 0 ? 'open' : 'closed')
    });

    // Create staging area for each dock door (above the dock)
    stagingAreas.push({
      id: `STAGING-${i + 1}`,
      dockId: dockId,
      x: dockX - 10, // Slightly wider than dock door
      y: warehouseBottomY - stagingHeight - 10, // Above dock doors
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
