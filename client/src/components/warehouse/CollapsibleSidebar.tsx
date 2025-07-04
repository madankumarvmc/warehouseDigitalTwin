import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Truck, Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { LayerControls } from './LayerControls';
import { TimeRangeControls } from './TimeRangeControls';
import { ResourceTracking } from './ResourceTracking';
import { SKUSearch } from './SKUSearch';
import { ExportControls } from './ExportControls';
import { HeatmapLegendPDF } from './HeatmapLegendPDF';
import { ForkliftResource, BOPTResource } from '@/lib/warehouse/types';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeLayers: Record<string, boolean>;
  layerOpacity: Record<string, number>;
  timeRange: number;
  onLayerToggle: (layer: string) => void;
  onOpacityChange: (layer: string, opacity: number) => void;
  onTimeRangeChange: (range: number) => void;
  onSKUSearch: (sku: string) => void;
  onExport: (format: 'png' | 'svg') => void;
  forklifts: ForkliftResource[];
  bopts: BOPTResource[];
  selectedResource: string | null;
  onResourceSelect: (resourceId: string | null) => void;
}

export function CollapsibleSidebar({
  isCollapsed,
  onToggle,
  activeLayers,
  layerOpacity,
  timeRange,
  onLayerToggle,
  onOpacityChange,
  onTimeRangeChange,
  onSKUSearch,
  onExport,
  forklifts,
  bopts,
  selectedResource,
  onResourceSelect,
}: CollapsibleSidebarProps) {
  return (
    <>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute left-0 top-12 w-80 bg-card border-r border-border flex flex-col h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground z-20"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-[hsl(207,90%,54%)]">Warehouse Controls</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="text-[hsl(0,0%,70.2%)] hover:text-[hsl(207,90%,54%)] hover:bg-[hsl(0,0%,17.6%)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-[hsl(0,0%,70.2%)] mt-1">Operational & Inventory Visibility</p>
            </div>

            {/* Layer Controls */}
            <div className="p-4 border-b border-gray-700">
              <LayerControls
                activeLayers={activeLayers}
                layerOpacity={layerOpacity}
                onLayerToggle={onLayerToggle}
                onOpacityChange={onOpacityChange}
              />
            </div>

            {/* Time Range Controls */}
            <div className="p-4 border-b border-gray-700">
              <TimeRangeControls
                timeRange={timeRange}
                onTimeRangeChange={onTimeRangeChange}
              />
            </div>

            {/* Live Resources */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-medium text-[hsl(0,0%,70.2%)] mb-3">Live Resources</h3>
              
              {/* Forklifts Section */}
              <div className="mb-4 p-3 bg-[hsl(0,0%,8%)] rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-[hsl(0,0%,88.2%)]">Forklifts</span>
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      {forklifts.length} Active
                    </span>
                  </div>
                  <Eye className="w-4 h-4 text-blue-400" />
                </div>
                <select 
                  value={selectedResource && forklifts.some(f => f.id === selectedResource) ? selectedResource : ""} 
                  onChange={(e) => onResourceSelect(e.target.value || null)}
                  className="w-full bg-[hsl(0,0%,11.8%)] border border-gray-600 text-[hsl(0,0%,88.2%)] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a forklift to track</option>
                  {forklifts.map((forklift) => (
                    <option 
                      key={forklift.id} 
                      value={forklift.id}
                    >
                      {forklift.id} ({forklift.status} • {forklift.loaded ? 'Loaded' : 'Empty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* BOPTs Section */}
              <div className="mb-4 p-3 bg-[hsl(0,0%,8%)] rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-[hsl(0,0%,88.2%)]">BOPTs</span>
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                      {bopts.length} Active
                    </span>
                  </div>
                  <Eye className="w-4 h-4 text-blue-400" />
                </div>
                <select 
                  value={selectedResource && bopts.some(b => b.id === selectedResource) ? selectedResource : ""} 
                  onChange={(e) => onResourceSelect(e.target.value || null)}
                  className="w-full bg-[hsl(0,0%,11.8%)] border border-gray-600 text-[hsl(0,0%,88.2%)] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a BOPT to track</option>
                  {bopts.map((bopt) => (
                    <option 
                      key={bopt.id} 
                      value={bopt.id}
                    >
                      {bopt.id} ({bopt.status} • {bopt.loaded ? 'Loaded' : 'Empty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Selection Button */}
              {selectedResource && (
                <Button 
                  onClick={() => onResourceSelect(null)}
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-red-900/20 border-red-600 text-red-400 hover:bg-red-900/30"
                >
                  Clear Selection
                </Button>
              )}
            </div>

            {/* Resource Tracking */}
            <div className="p-4 border-b border-gray-700">
              <ResourceTracking
                showResources={activeLayers.resources}
                onToggleResources={() => onLayerToggle('resources')}
              />
            </div>

            {/* SKU Search */}
            <div className="p-4 border-b border-gray-700">
              <SKUSearch onSearch={onSKUSearch} />
            </div>

            {/* Export Controls */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-medium text-[hsl(0,0%,70.2%)] mb-3">Export & Documentation</h3>
              <div className="space-y-3">
                <ExportControls onExport={onExport} />
                <HeatmapLegendPDF onDownload={() => console.log('Heatmap legend downloaded')} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Toggle Button */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-4 top-16 z-50"
          >
            <Button
              onClick={onToggle}
              className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(212,78%,46%)] text-white p-3 rounded-full shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
