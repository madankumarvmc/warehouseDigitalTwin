import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva';
import Konva from 'konva';
import { warehouseLayout } from '@/lib/warehouse/warehouseLayout';
import { HeatmapData, ForkliftResource, BOPTResource, ViewportState } from '@/lib/warehouse/types';
import { heatmapColors } from '@/lib/warehouse/heatmapGenerator';
import { getResourceTrail } from '@/lib/warehouse/movementTrails';

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
  timeRange: number;
  heatmapViewMode?: boolean;
  liveResourcesViewMode?: boolean;
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
  timeRange,
  heatmapViewMode = true,
  liveResourcesViewMode = false,
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

  // Get theme-aware colors
  const getThemeColors = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      binOutline: isDark ? '#ffffff' : '#000000',
      binFill: isDark ? 'hsla(0, 0%, 20%, 0.8)' : 'hsla(0, 0%, 95%, 0.8)',
      dockDoorOpen: isDark ? 'hsl(122, 39%, 49%)' : 'hsl(122, 39%, 35%)',
      dockDoorClosed: isDark ? 'hsl(0, 0%, 60%)' : 'hsl(0, 0%, 40%)',
      dockDoorOccupied: isDark ? 'hsl(39, 100%, 50%)' : 'hsl(39, 100%, 40%)',
      stagingFree: isDark ? 'hsla(210, 24%, 16%, 0.6)' : 'hsla(210, 24%, 90%, 0.6)',
      stagingOccupied: isDark ? 'hsla(39, 100%, 50%, 0.4)' : 'hsla(39, 100%, 50%, 0.3)',
      text: isDark ? '#ffffff' : '#000000'
    };
  }, []);

  // Render warehouse infrastructure (bins, dock doors, staging areas)
  const renderWarehouseGrid = useCallback(() => {
    const elements = [];
    const colors = getThemeColors();

    // Render storage bins with outlines
    warehouseLayout.cells.forEach(cell => {
      if (!isInViewport(cell.x, cell.y, cell.width, cell.height)) return;

      elements.push(
        <Rect
          key={`bin-${cell.cellId}`}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          fill={colors.binFill}
          stroke={colors.binOutline}
          strokeWidth={0.5}
          perfectDrawEnabled={false}
          listening={false}
        />
      );

      // Add cell ID text for better visualization (only at higher zoom levels)
      if (viewport.zoom > 1.5) {
        elements.push(
          <Text
            key={`bin-label-${cell.cellId}`}
            x={cell.x + cell.width / 2}
            y={cell.y + cell.height / 2}
            text={cell.cellId.split('-')[1]} // Show just the bin number
            fontSize={6}
            fontFamily="Roboto"
            fill={colors.text}
            align="center"
            verticalAlign="middle"
            offsetX={10}
            offsetY={3}
            opacity={0.6}
            perfectDrawEnabled={false}
            listening={false}
          />
        );
      }
    });

    // Render dock doors
    warehouseLayout.dockDoorPositions.forEach(dock => {
      if (!isInViewport(dock.x, dock.y, dock.width, dock.height)) return;

      let fillColor = colors.dockDoorClosed;
      if (dock.status === 'open') fillColor = colors.dockDoorOpen;
      if (dock.status === 'occupied') fillColor = colors.dockDoorOccupied;

      elements.push(
        <Rect
          key={`dock-${dock.id}`}
          x={dock.x}
          y={dock.y}
          width={dock.width}
          height={dock.height}
          fill={fillColor}
          stroke={colors.binOutline}
          strokeWidth={2}
          cornerRadius={4}
          perfectDrawEnabled={false}
          listening={false}
        />
      );

      // Dock label
      elements.push(
        <Text
          key={`dock-label-${dock.id}`}
          x={dock.x + dock.width / 2}
          y={dock.y + dock.height / 2}
          text={dock.id}
          fontSize={8}
          fontFamily="Roboto"
          fill={colors.text}
          align="center"
          verticalAlign="middle"
          offsetX={15}
          offsetY={4}
          perfectDrawEnabled={false}
          listening={false}
        />
      );
    });

    // Render staging areas
    warehouseLayout.stagingAreas.forEach(staging => {
      if (!isInViewport(staging.x, staging.y, staging.width, staging.height)) return;

      const fillColor = staging.occupied ? colors.stagingOccupied : colors.stagingFree;

      elements.push(
        <Rect
          key={`staging-${staging.id}`}
          x={staging.x}
          y={staging.y}
          width={staging.width}
          height={staging.height}
          fill={fillColor}
          stroke={colors.binOutline}
          strokeWidth={1}
          strokeDasharray={[5, 5]} // Dashed line for staging areas
          cornerRadius={2}
          perfectDrawEnabled={false}
          listening={false}
        />
      );

      // Staging area label
      elements.push(
        <Text
          key={`staging-label-${staging.id}`}
          x={staging.x + staging.width / 2}
          y={staging.y + staging.height / 2}
          text={staging.id}
          fontSize={8}
          fontFamily="Roboto"
          fill={colors.text}
          align="center"
          verticalAlign="middle"
          offsetX={25}
          offsetY={4}
          opacity={0.8}
          perfectDrawEnabled={false}
          listening={false}
        />
      );
    });

    return elements;
  }, [isInViewport, viewport.zoom, getThemeColors]);

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

  // Render resource trails with color coding using realistic movement data
  const renderResourceTrails = useCallback(() => {
    if (!selectedResource) {
      console.log('No selected resource');
      return [];
    }

    console.log('Rendering trails for:', selectedResource, 'timeRange:', timeRange);
    
    // Get realistic movement trail for the selected resource
    const trail = getResourceTrail(selectedResource, timeRange);
    console.log('Trail points received:', trail.length, 'for timeRange:', timeRange, 'minutes');
    
    if (trail.length < 2) {
      console.log('Not enough trail points, returning empty');
      return [];
    }

    const elements = [];

    // Draw trail as straight lines connecting discrete points
    for (let i = 0; i < trail.length - 1; i++) {
      const current = trail[i];
      const next = trail[i + 1];
      
      // Use the load status from the current point to determine color
      const strokeColor = current.loaded ? 'hsl(120, 100%, 25%)' : 'hsl(39, 100%, 50%)'; // Dark green for loaded, Orange for empty
      
      // Create dashed line connection
      elements.push(
        <Line
          key={`trail-${selectedResource}-${i}`}
          points={[current.x, current.y, next.x, next.y]}
          stroke={strokeColor}
          strokeWidth={2}
          opacity={0.8}
          lineCap="round"
          dash={[8, 4]} // Dashed line pattern
          perfectDrawEnabled={false}
          listening={false}
        />
      );
    }

    // Add numbered waypoint markers at each trail point with sequential numbering
    trail.forEach((point, index) => {
      // Skip first point (starting position) from numbering to reduce clutter
      if (index === 0) return;
      
      const sequentialNumber = index; // 1, 2, 3, 4... based on path sequence
      
      // Waypoint circle with better visibility
      elements.push(
        <Circle
          key={`waypoint-${selectedResource}-${index}`}
          x={point.x}
          y={point.y}
          radius={10}
          fill="hsl(0, 0%, 98%)"
          stroke="hsl(207, 90%, 54%)"
          strokeWidth={2}
          opacity={0.95}
          perfectDrawEnabled={false}
          listening={false}
        />
      );
      
      // Sequential number label - perfectly centered
      const textWidth = sequentialNumber.toString().length * 6; // Approximate text width
      elements.push(
        <Text
          key={`waypoint-number-${selectedResource}-${index}`}
          x={point.x}
          y={point.y + 1} // Slight vertical adjustment for better centering
          text={sequentialNumber.toString()}
          fontSize={10}
          fontFamily="Arial"
          fontStyle="bold"
          fill="hsl(220, 90%, 40%)" // Dark blue for better contrast
          align="center"
          verticalAlign="middle"
          offsetX={textWidth / 2}
          offsetY={5}
          perfectDrawEnabled={false}
          listening={false}
        />
      );
    });

    return elements;
  }, [selectedResource, timeRange]);

  // Render forklifts
  const renderForklifts = useCallback(() => {
    if (!activeLayers.resources) return [];

    const elements = [];
    forklifts.forEach(forklift => {
      const isSelected = selectedResource === forklift.id;
      const hasSelection = selectedResource !== null;
      const opacity = hasSelection && !isSelected ? 0.3 : 1;
      
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
          opacity={opacity}
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
            opacity={opacity}
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
          opacity={opacity}
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
      const hasSelection = selectedResource !== null;
      const opacity = hasSelection && !isSelected ? 0.3 : 1;
      
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
          opacity={opacity}
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
            opacity={opacity}
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
          opacity={opacity}
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
        {/* Background Layer - slightly dimmed when resource is selected for focus */}
        <Layer 
          perfectDrawEnabled={false}
          listening={false}
          imageSmoothingEnabled={false}
          opacity={selectedResource ? 0.7 : 1}
        >
          {renderWarehouseGrid()}
          {renderHeatmap()}
          {renderSearchHighlights()}
        </Layer>

        {/* Resource Layer - always visible */}
        <Layer 
          perfectDrawEnabled={false}
          listening={true}
          imageSmoothingEnabled={false}
        >
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
