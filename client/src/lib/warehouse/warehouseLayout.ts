import { WarehouseLayout, CellPosition } from './types';

export const warehouseConfig = {
  aisles: ['A1', 'A2', 'A3', 'A4', 'A5'],
  binsPerAisle: 20,
  levels: 2,
  depth: 2,
  cellWidth: 40,
  cellHeight: 30,
  aisleWidth: 120,
};

export function generateWarehouseLayout(): WarehouseLayout {
  const cells: CellPosition[] = [];
  const { cellWidth, cellHeight, aisleWidth } = warehouseConfig;

  for (let aisleIndex = 0; aisleIndex < warehouseConfig.aisles.length; aisleIndex++) {
    const aisleName = warehouseConfig.aisles[aisleIndex];
    
    for (let bin = 1; bin <= warehouseConfig.binsPerAisle; bin++) {
      for (let level = 1; level <= warehouseConfig.levels; level++) {
        for (let depth = 1; depth <= warehouseConfig.depth; depth++) {
          const cellId = `${aisleName}-B${bin.toString().padStart(2, '0')}-L${level}-D${depth}`;
          
          // Calculate position based on aisle layout
          const aisleX = aisleIndex * (cellWidth * 2 + aisleWidth);
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

  return {
    ...warehouseConfig,
    cells,
  };
}

export const warehouseLayout = generateWarehouseLayout();
