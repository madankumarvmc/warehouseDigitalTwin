import { HeatmapData, HeatmapType } from './types';
import { warehouseLayout } from './warehouseLayout';

// Seeded random number generator for consistent results
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

export function generateHeatmapData(type: HeatmapType, timeRange: number = 120): HeatmapData[] {
  const random = new SeededRandom(type.charCodeAt(0) * 1000 + timeRange);
  const data: HeatmapData[] = [];

  warehouseLayout.cells.forEach(cell => {
    let value = 0;
    const { aisle, bin, level } = cell;
    const aisleNum = parseInt(aisle.slice(1));
    
    switch (type) {
      case 'volume':
        // Higher volume near entrance (A1) and receiving areas
        value = Math.max(0, 1 - (aisleNum - 1) * 0.3 - Math.abs(bin - 30) * 0.01 + random.next() * 0.3);
        // Apply time range factor
        value *= Math.min(1, timeRange / 120);
        break;
        
      case 'frequency':
        // Similar to volume but with more variance
        value = Math.max(0, 0.8 - (aisleNum - 1) * 0.2 + random.next() * 0.4);
        value *= Math.min(1, timeRange / 60);
        break;
        
      case 'occupancy':
        // Most areas highly occupied, less dependent on time
        value = 0.6 + random.next() * 0.35;
        break;
        
      case 'misplacement':
        // Random sparse errors, more likely in busy areas
        const baseChance = 0.05 * (1.5 - (aisleNum - 1) * 0.2);
        value = random.next() < baseChance ? random.next() : 0;
        break;
        
      case 'expiry':
        // Random sparse warnings, slightly more in older stock areas
        const expiryChance = 0.03 * (level === 3 ? 1.5 : 1);
        value = random.next() < expiryChance ? random.next() : 0;
        break;
        
      case 'exceptions':
        // Very rare critical issues
        value = random.next() < 0.02 ? random.next() : 0;
        break;
    }

    const normalizedValue = Math.min(1, Math.max(0, value));
    
    // Only include cells with significant values (>= 0.1) for performance
    if (normalizedValue >= 0.1) {
      data.push({ cellId: cell.cellId, value: normalizedValue });
    }
  });

  // Sort by value and limit to top 200 most significant cells for performance
  return data
    .sort((a, b) => b.value - a.value)
    .slice(0, 200);
}

export const heatmapColors = {
  volume: { start: 'hsl(207, 90%, 54%)', end: 'hsl(4, 90%, 58%)' },
  frequency: { start: 'hsl(145, 63%, 13%)', end: 'hsl(122, 39%, 49%)' },
  occupancy: { start: 'hsl(39, 100%, 50%)', end: 'hsl(45, 100%, 51%)' },
  misplacement: { start: 'hsl(4, 66%, 47%)', end: 'hsl(14, 100%, 57%)' },
  expiry: { start: 'hsl(39, 100%, 50%)', end: 'hsl(45, 100%, 51%)' },
  exceptions: { start: 'hsl(291, 64%, 42%)', end: 'hsl(292, 76%, 53%)' },
};
