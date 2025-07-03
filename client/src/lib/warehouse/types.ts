export interface CellPosition {
  cellId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aisle: string;
  bin: number;
  level: number;
  depth: number;
}

export interface HeatmapData {
  cellId: string;
  value: number;
}

export interface ForkliftResource {
  id: string;
  x: number;
  y: number;
  loaded: boolean;
  trail: { x: number; y: number; loaded: boolean; timestamp: number }[];
  speed: number;
  status: 'active' | 'idle' | 'maintenance';
  targetX?: number;
  targetY?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  currentAisle?: number;
}

export type HeatmapType = 'volume' | 'frequency' | 'occupancy' | 'misplacement' | 'expiry' | 'exceptions';

export interface LayerState {
  [key: string]: boolean;
}

export interface WarehouseLayout {
  aisles: string[];
  binsPerAisle: number;
  levels: number;
  depth: number;
  cellWidth: number;
  cellHeight: number;
  aisleWidth: number;
  cells: CellPosition[];
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface TimeRange {
  value: number; // in minutes
  label: string;
}
