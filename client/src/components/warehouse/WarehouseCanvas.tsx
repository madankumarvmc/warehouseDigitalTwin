import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva';
import { warehouseLayout } from '@/lib/warehouse/warehouseLayout';
import { HeatmapData, ForkliftResource, BOPTResource, ViewportState } from '@/lib/warehouse/types';
import { heatmapColors } from '@/lib/warehouse/heatmapGenerator';

interface WarehouseCanvasProps {
  heatmapData: HeatmapData[];
  forklifts: ForkliftResource[];
  bopts: BOPTResource[];
  activeLayers: Record<string, boolean>;
  activeHeatmapType: string;
  layerOpacity: Record<string, number>;
  onResourceSelect: (id: string) => void;
  selectedResource: string | null;
  showTrails: boolean;
  searchHighlight: string[];
}

function WarehouseCanvas({
  heatmapData,
  forklifts,
  bopts,
  activeLayers,
  activeHeatmapType,
  layerOpacity,
  onResourceSelect,
  selectedResource,
  showTrails,
  searchHighlight,
}: WarehouseCanvasProps) {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomTimeoutRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert HSL color string to RGB values for Konva
  const hslToRgb = useCallback((hsl: string, alpha: number = 1) => {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return `rgba(25, 118, 210, ${alpha})`;
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
  }, []);

  // Helper function to check if element is in viewport
  const isInViewport = useCallback((x: number, y: number, width: number, height: number) => {
    const stage = stageRef.current;
    if (!stage) return true;
    
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    
    const viewportLeft = -stageX / scale;
    const viewportTop = -stageY / scale;
    const viewportRight = viewportLeft + dimensions.width / scale;
    const viewportBottom = viewportTop + dimensions.height / scale;
    
    return !(x + width < viewportLeft || 
             x > viewportRight || 
             y + height < viewportTop || 
             y > viewportBottom);
  }, [dimensions]);

  // Render warehouse grid with viewport culling
  const renderWarehouseGrid = useCallback(() => {
    const elements = [];
    const { cellWidth, cellHeight, aisleWidth } = warehouseLayout;

    // Aisles are now just empty space between storage bins (no explicit rendering needed)

    return elements;
  }, [isInViewport]);

  // Render heatmap overlay
  const renderHeatmap = useCallback(() => {
    if (!activeLayers[activeHeatmapType] || !heatmapData.length) return [];

    const elements = [];
    const colors = heatmapColors[activeHeatmapType as keyof typeof heatmapColors];
    const opacity = layerOpacity[activeHeatmapType] || 0.8;

    heatmapData.forEach(({ cellId, value }) => {
      const cell = warehouseLayout.cells.find(c => c.cellId === cellId);
      if (!cell || value === 0) return;

      // Only render if in viewport
      if (!isInViewport(cell.x, cell.y, cell.width, cell.height)) return;

      // Interpolate between start and end colors based on value
      const alpha = value * opacity;
      const color = value > 0.5 ? 
        hslToRgb(colors.end, alpha) : 
        hslToRgb(colors.start, alpha);

      elements.push(
        <Rect
          key={`heatmap-${cellId}`}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          fill={color}
          perfectDrawEnabled={false}
          listening={false}
        />
      );
    });

    return elements;
  }, [activeLayers, activeHeatmapType, heatmapData, layerOpacity, hslToRgb]);

  // Render search highlights
  const renderSearchHighlights = useCallback(() => {
    if (!searchHighlight.length) return [];

    const elements = [];
    searchHighlight.forEach(cellId => {
      const cell = warehouseLayout.cells.find(c => c.cellId === cellId);
      if (!cell) return;

      elements.push(
        <Rect
          key={`highlight-${cellId}`}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          stroke="hsl(207, 90%, 54%)"
          strokeWidth={3}
          fill="hsla(207, 90%, 54%, 0.3)"
        />
      );
    });

    return elements;
  }, [searchHighlight]);

  // Render resource trails
  const renderResourceTrails = useCallback(() => {
    if (!showTrails || !selectedResource) return [];

    // Find the selected resource in either forklifts or BOPTs
    const allResources = [...forklifts, ...bopts];
    const resource = allResources.find(r => r.id === selectedResource);
    if (!resource || resource.trail.length < 2) return [];

    const elements = [];
    const trailPoints = resource.trail.flatMap(point => [point.x, point.y]);

    // Simplified trail as single line path for better performance
    elements.push(
      <Line
        key={`trail-${selectedResource}`}
        points={trailPoints}
        stroke="hsl(207, 90%, 54%)"
        strokeWidth={2}
        opacity={0.7}
        dash={[4, 4]}
        lineCap="round"
        lineJoin="round"
        perfectDrawEnabled={false}
        listening={false}
      />
    );

    return elements;
  }, [showTrails, selectedResource, forklifts, bopts]);

  // Render forklifts
  const renderForklifts = useCallback(() => {
    if (!activeLayers.resources) return [];

    const elements = [];
    forklifts.forEach(forklift => {
      const isSelected = selectedResource === forklift.id;
      
      // Forklift body (circular)
      elements.push(
        <Circle
          key={`forklift-${forklift.id}`}
          x={forklift.x}
          y={forklift.y}
          radius={isSelected ? 12 : 8}
          fill={forklift.loaded ? 'hsl(39, 100%, 50%)' : 'hsl(122, 39%, 49%)'}
          stroke={isSelected ? 'hsl(207, 90%, 54%)' : 'transparent'}
          strokeWidth={2}
          onClick={() => onResourceSelect(forklift.id)}
          onTap={() => onResourceSelect(forklift.id)}
        />
      );

      // Load indicator
      if (forklift.loaded) {
        elements.push(
          <Rect
            key={`load-${forklift.id}`}
            x={forklift.x - 4}
            y={forklift.y - 12}
            width={8}
            height={4}
            fill="hsl(4, 90%, 58%)"
          />
        );
      }

      // Forklift ID
      elements.push(
        <Text
          key={`id-${forklift.id}`}
          x={forklift.x}
          y={forklift.y + 15}
          text={forklift.id}
          fontSize={10}
          fontFamily="Roboto"
          fill="hsl(0, 0%, 88.2%)"
          align="center"
          offsetX={15}
        />
      );
    });

    return elements;
  }, [activeLayers.resources, forklifts, selectedResource, onResourceSelect]);

  // Render BOPTs
  const renderBOPTs = useCallback(() => {
    if (!activeLayers.resources) return [];

    const elements = [];
    bopts.forEach(bopt => {
      const isSelected = selectedResource === bopt.id;
      
      // BOPT body (rectangular to distinguish from forklifts)
      elements.push(
        <Rect
          key={`bopt-${bopt.id}`}
          x={bopt.x - (isSelected ? 8 : 6)}
          y={bopt.y - (isSelected ? 6 : 4)}
          width={isSelected ? 16 : 12}
          height={isSelected ? 12 : 8}
          fill={bopt.loaded ? 'hsl(39, 100%, 50%)' : 'hsl(265, 89%, 78%)'}
          stroke={isSelected ? 'hsl(207, 90%, 54%)' : 'transparent'}
          strokeWidth={2}
          cornerRadius={2}
          onClick={() => onResourceSelect(bopt.id)}
          onTap={() => onResourceSelect(bopt.id)}
        />
      );

      // Load indicator for BOPTs
      if (bopt.loaded) {
        elements.push(
          <Rect
            key={`bopt-load-${bopt.id}`}
            x={bopt.x - 3}
            y={bopt.y - 10}
            width={6}
            height={3}
            fill="hsl(4, 90%, 58%)"
          />
        );
      }

      // BOPT ID
      elements.push(
        <Text
          key={`bopt-id-${bopt.id}`}
          x={bopt.x}
          y={bopt.y + 15}
          text={bopt.id}
          fontSize={9}
          fontFamily="Roboto"
          fill="hsl(0, 0%, 88.2%)"
          align="center"
          offsetX={20}
        />
      );
    });

    return elements;
  }, [activeLayers.resources, bopts, selectedResource, onResourceSelect]);

  // Optimized zoom with immediate response and minimal re-renders
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    // Faster zoom for immediate response
    const scaleBy = 1.2;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    // Direct stage updates for immediate response
    stage.scale({ x: clampedScale, y: clampedScale });
    
    const newPos = {
      x: pointer.x - ((pointer.x - stage.x()) / oldScale) * clampedScale,
      y: pointer.y - ((pointer.y - stage.y()) / oldScale) * clampedScale,
    };
    
    stage.position(newPos);
    stage.batchDraw();
  }, []);

  // Handle drag
  const handleDragEnd = useCallback((e: any) => {
    setViewport(prev => ({
      ...prev,
      panX: e.target.x(),
      panY: e.target.y(),
    }));
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full canvas-container">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        draggable
        onDragEnd={handleDragEnd}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        x={viewport.panX}
        y={viewport.panY}
        perfectDrawEnabled={false}
        listening={true}
      >
        <Layer 
          perfectDrawEnabled={false}
          listening={false}
          imageSmoothingEnabled={false}
        >
          {renderWarehouseGrid()}
          {renderHeatmap()}
          {renderSearchHighlights()}
          {renderResourceTrails()}
          {renderForklifts()}
          {renderBOPTs()}
        </Layer>
      </Stage>
    </div>
  );
}

export { WarehouseCanvas };
export default React.memo(WarehouseCanvas);
