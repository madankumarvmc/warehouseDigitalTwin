import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LayerControls } from './LayerControls';
import { TimeRangeControls } from './TimeRangeControls';
import { ResourceTracking } from './ResourceTracking';
import { SKUSearch } from './SKUSearch';
import { ExportControls } from './ExportControls';
import { HeatmapLegendPDF } from './HeatmapLegendPDF';

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
            className="w-80 bg-[hsl(0,0%,11.8%)] border-r border-gray-700 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
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
            className="fixed left-4 top-4 z-50"
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
