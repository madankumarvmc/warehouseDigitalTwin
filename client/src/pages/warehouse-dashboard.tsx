import React, { useState, useCallback, useEffect } from 'react';
import { Activity, MapPin, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WarehouseCanvas from '@/components/warehouse/WarehouseCanvas';
import { CollapsibleSidebar } from '@/components/warehouse/CollapsibleSidebar';
import { MinimapPanel } from '@/components/warehouse/MinimapPanel';
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { useResourceTracking } from '@/hooks/useResourceTracking';
import { warehouseLayout } from '@/lib/warehouse/warehouseLayout';

function WarehouseDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState<string[]>([]);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });

  const {
    activeLayers,
    activeHeatmapType,
    heatmapData,
    timeRange,
    layerOpacity,
    isLoading,
    toggleLayer,
    updateLayerOpacity,
    updateTimeRange,
  } = useWarehouseData();

  const {
    forklifts,
    selectedForklift,
    showTrails,
    selectForklift,
  } = useResourceTracking();

  const handleSKUSearch = useCallback((sku: string) => {
    if (!sku.trim()) {
      setSearchHighlight([]);
      return;
    }

    // Simulate SKU search - find cells that might contain the SKU
    const searchResults = warehouseLayout.cells
      .filter(cell => {
        // Simulate SKU being stored in random locations
        const skuHash = sku.toLowerCase().charCodeAt(0) || 65;
        const cellHash = cell.cellId.charCodeAt(0);
        return (skuHash + cellHash) % 20 === 0; // Roughly 5% of cells
      })
      .map(cell => cell.cellId)
      .slice(0, 10); // Limit to 10 results

    setSearchHighlight(searchResults);

    // Clear highlight after 10 seconds
    setTimeout(() => setSearchHighlight([]), 10000);
  }, []);

  const handleExport = useCallback(async (format: 'png' | 'svg') => {
    try {
      // Import html-to-image dynamically to avoid SSR issues
      const { toPng, toSvg } = await import('html-to-image');
      
      const canvasElement = document.querySelector('.canvas-container');
      if (!canvasElement) return;

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `warehouse-${activeHeatmapType}-${timestamp}.${format}`;

      let dataUrl: string;
      if (format === 'png') {
        dataUrl = await toPng(canvasElement as HTMLElement, { quality: 1.0 });
      } else {
        dataUrl = await toSvg(canvasElement as HTMLElement);
      }

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [activeHeatmapType]);

  const handleZoomPreset = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    // This would be implemented by the canvas component
  }, []);

  // Loading overlay
  if (isLoading) {
    return (
      <div className="h-screen bg-[hsl(0,0%,7.1%)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(207,90%,54%)] border-t-transparent"></div>
          <p className="mt-4 text-[hsl(0,0%,70.2%)]">Loading warehouse data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[hsl(0,0%,7.1%)] text-[hsl(0,0%,88.2%)] flex overflow-hidden relative">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeLayers={activeLayers}
        layerOpacity={layerOpacity}
        timeRange={timeRange}
        onLayerToggle={toggleLayer}
        onOpacityChange={updateLayerOpacity}
        onTimeRangeChange={updateTimeRange}
        onSKUSearch={handleSKUSearch}
        onExport={handleExport}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-80'}`}>
        {/* Top Navigation Bar */}
        <div className="bg-[hsl(0,0%,11.8%)] border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-medium text-[hsl(207,90%,54%)]">
                Warehouse Floor A - Section 1
              </h1>
              <div className="flex items-center space-x-2 text-sm text-[hsl(0,0%,70.2%)]">
                <div className="w-2 h-2 bg-[hsl(122,39%,49%)] rounded-full pulse-animation"></div>
                <span>Live Data</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Performance Metrics */}
              <div className="text-xs text-[hsl(0,0%,70.2%)]">
                <span>FPS: <span className="text-[hsl(122,39%,49%)]">60</span></span>
                <span className="ml-4">Objects: <span className="text-[hsl(207,90%,54%)]">1,440</span></span>
              </div>
              
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2 bg-[hsl(0,0%,17.6%)] rounded px-3 py-1">
                {[25, 50, 100, 200].map(zoom => (
                  <Button
                    key={zoom}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoomPreset(zoom)}
                    className={`text-xs px-2 py-1 ${
                      currentZoom === zoom
                        ? 'text-[hsl(207,90%,54%)] font-medium'
                        : 'text-[hsl(0,0%,70.2%)] hover:text-[hsl(207,90%,54%)]'
                    }`}
                  >
                    {zoom}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas and Minimap Container */}
        <div className="flex-1 flex">
          {/* Main Canvas Area */}
          <div className="flex-1 relative">
            <WarehouseCanvas
              heatmapData={heatmapData}
              forklifts={forklifts}
              activeLayers={activeLayers}
              activeHeatmapType={activeHeatmapType}
              layerOpacity={layerOpacity}
              onForkliftSelect={selectForklift}
              selectedForklift={selectedForklift}
              showTrails={showTrails}
              searchHighlight={searchHighlight}
            />

            {/* Canvas Controls Overlay */}
            <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
              <Button
                className="bg-[hsl(0,0%,17.6%)] hover:bg-gray-600 text-[hsl(0,0%,88.2%)] p-3 rounded-full shadow-lg"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                className="bg-[hsl(0,0%,17.6%)] hover:bg-gray-600 text-[hsl(0,0%,88.2%)] p-3 rounded-full shadow-lg"
                title="Zoom Out"
              >
                <ZoomIn className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                className="bg-[hsl(0,0%,17.6%)] hover:bg-gray-600 text-[hsl(0,0%,88.2%)] p-3 rounded-full shadow-lg"
                title="Reset View"
              >
                <Activity className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="absolute top-4 left-4 space-y-2">
              <div className="bg-[hsl(0,0%,17.6%)] bg-opacity-90 rounded px-3 py-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-[hsl(207,90%,54%)]" />
                  <span>X: <span className="text-[hsl(122,39%,49%)]">{currentPosition.x}</span>, Y: <span className="text-[hsl(122,39%,49%)]">{currentPosition.y}</span></span>
                </div>
              </div>
              <div className="bg-[hsl(0,0%,17.6%)] bg-opacity-90 rounded px-3 py-2 text-sm">
                <div className="flex items-center space-x-2">
                  <ZoomIn className="h-4 w-4 text-[hsl(207,90%,54%)]" />
                  <span>Zoom: <span className="text-[hsl(122,39%,49%)]">{currentZoom}%</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimap Panel */}
          <MinimapPanel
            forklifts={forklifts}
            activeHeatmap={activeHeatmapType}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(WarehouseDashboard);
