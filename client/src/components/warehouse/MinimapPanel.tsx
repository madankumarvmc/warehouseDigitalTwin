import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { warehouseLayout } from '@/lib/warehouse/warehouseLayout';
import { ForkliftResource } from '@/lib/warehouse/types';

interface MinimapPanelProps {
  forklifts: ForkliftResource[];
  activeHeatmap: string;
  sidebarCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function MinimapPanel({ forklifts, activeHeatmap, sidebarCollapsed = false, isCollapsed = false, onToggle }: MinimapPanelProps) {
  const stageRef = useRef<any>(null);

  const renderMiniWarehouse = () => {
    const elements = [];
    const scale = 0.15; // Scale down the warehouse for minimap
    const { cellWidth, cellHeight, aisleWidth } = warehouseLayout;

    // Draw simplified warehouse structure
    for (let aisle = 0; aisle < 4; aisle++) {
      const aisleX = aisle * (cellWidth * 2 + aisleWidth) * scale;
      
      // Aisle
      elements.push(
        <Rect
          key={`mini-aisle-${aisle}`}
          x={aisleX + cellWidth * 2 * scale}
          y={0}
          width={aisleWidth * scale}
          height={60 * cellHeight * scale}
          fill="hsl(0, 0%, 22%)"
        />
      );

      // Racks
      for (let side = 0; side < 2; side++) {
        const rackX = aisleX + side * (cellWidth + aisleWidth) * scale;
        elements.push(
          <Rect
            key={`mini-rack-${aisle}-${side}`}
            x={rackX}
            y={0}
            width={cellWidth * scale}
            height={60 * cellHeight * scale}
            fill="hsl(0, 0%, 33.3%)"
          />
        );
      }
    }

    return elements;
  };

  const renderMiniForklifts = () => {
    const elements = [];
    const scale = 0.15;

    forklifts.forEach(forklift => {
      elements.push(
        <Circle
          key={`mini-forklift-${forklift.id}`}
          x={forklift.x * scale}
          y={forklift.y * scale}
          radius={3}
          fill="hsl(39, 100%, 50%)"
        />
      );
    });

    return elements;
  };

  if (isCollapsed) {
    return (
      <div className="relative">
        {/* Collapsed state - floating toggle button */}
        <Button
          onClick={() => {
            console.log('Minimap toggle clicked!');
            onToggle?.();
          }}
          className="fixed right-2 top-32 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-l-lg shadow-lg z-40 border border-primary-foreground/20"
          title="Show Overview"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${sidebarCollapsed ? 'w-96' : 'w-80'} bg-card border-l border-border p-4 transition-all duration-300 relative`}>
      {/* Header with collapse button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Overview</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-muted-foreground hover:text-primary hover:bg-muted"
          title="Hide Overview"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Minimap Canvas */}
      <div className="relative bg-muted rounded border border-border aspect-square">
        <Stage
          ref={stageRef}
          width={300}
          height={300}
        >
          <Layer>
            {renderMiniWarehouse()}
            {renderMiniForklifts()}
          </Layer>
        </Stage>
        
        {/* Viewport Indicator */}
        <div 
          className="minimap-viewport absolute rounded" 
          style={{ 
            top: '20%', 
            left: '15%', 
            width: '30%', 
            height: '25%' 
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4">
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Legend</h4>
        <div className="space-y-1 text-xs text-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded" />
            <span>Storage Racks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-700 rounded" />
            <span>Aisles</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[hsl(39,100%,50%)] rounded-full" />
            <span>Forklifts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 heatmap-${activeHeatmap} rounded`} />
            <span>Active Heatmap</span>
          </div>
        </div>
      </div>

      {/* Live Statistics */}
      <div className="mt-6">
        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Live Statistics</h4>
        <div className="space-y-2 text-xs text-foreground">
          <div className="flex justify-between">
            <span>Total Positions:</span>
            <span className="text-primary font-medium">1,440</span>
          </div>
          <div className="flex justify-between">
            <span>Occupied:</span>
            <span className="text-[hsl(122,39%,49%)] font-medium">1,286 (89%)</span>
          </div>
          <div className="flex justify-between">
            <span>Active Resources:</span>
            <span className="text-[hsl(39,100%,50%)] font-medium">3</span>
          </div>
          <div className="flex justify-between">
            <span>Alerts:</span>
            <span className="text-[hsl(349,51%,64%)] font-medium">7</span>
          </div>
        </div>
      </div>
    </div>
  );
}
