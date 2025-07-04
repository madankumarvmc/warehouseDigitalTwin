import React, { useState, useCallback, useEffect } from 'react';
import { Activity, MapPin, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WarehouseCanvas from '@/components/warehouse/WarehouseCanvas';
import { CollapsibleSidebar } from '@/components/warehouse/CollapsibleSidebar';
import { MinimapPanel } from '@/components/warehouse/MinimapPanel';
import { Header } from '@/components/warehouse/Header';
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { useResourceTracking } from '@/hooks/useResourceTracking';
import { warehouseLayout } from '@/lib/warehouse/warehouseLayout';

function WarehouseDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
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
    bopts,
    selectedResource,
    showTrails,
    selectResource,
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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden relative">
      {/* Header */}
      <Header />
      
      {/* Main App Content */}
      <div className="flex-1 flex overflow-hidden">
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
          forklifts={forklifts}
          bopts={bopts}
          selectedResource={selectedResource}
          onResourceSelect={selectResource}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-80'}`}>
          {/* Main Canvas Area */}
          <div className="flex-1 relative">
            <WarehouseCanvas
              heatmapData={heatmapData}
              forklifts={forklifts}
              bopts={bopts}
              activeLayers={activeLayers}
              activeHeatmapType={activeHeatmapType}
              layerOpacity={layerOpacity}
              onResourceSelect={selectResource}
              selectedResource={selectedResource}
              showTrails={showTrails}
              searchHighlight={searchHighlight}
              timeRange={timeRange}
            />

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
          {!rightSidebarCollapsed && (
            <MinimapPanel
              forklifts={forklifts}
              activeHeatmap={activeHeatmapType}
              sidebarCollapsed={sidebarCollapsed}
              isCollapsed={false}
              onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            />
          )}
        </div>

        {/* Collapsed Right Sidebar Toggle - floating */}
        {rightSidebarCollapsed && (
          <MinimapPanel
            forklifts={forklifts}
            activeHeatmap={activeHeatmapType}
            sidebarCollapsed={sidebarCollapsed}
            isCollapsed={true}
            onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        )}
      </div>
    </div>
  );
}

export default React.memo(WarehouseDashboard);
