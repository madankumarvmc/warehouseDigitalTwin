import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface LayerControlsProps {
  activeLayers: Record<string, boolean>;
  layerOpacity: Record<string, number>;
  onLayerToggle: (layer: string) => void;
  onOpacityChange: (layer: string, opacity: number) => void;
}

const heatmapLayers = [
  { key: 'volume', name: 'Volume', gradient: 'heatmap-volume' },
  { key: 'frequency', name: 'Frequency', gradient: 'heatmap-frequency' },
  { key: 'occupancy', name: 'Occupancy', gradient: 'heatmap-occupancy' },
  { key: 'misplacement', name: 'Misplacement', gradient: 'heatmap-misplacement' },
  { key: 'expiry', name: 'Expiry', gradient: 'heatmap-expiry' },
  { key: 'exceptions', name: 'Exceptions', gradient: 'heatmap-exceptions' },
];

export function LayerControls({
  activeLayers,
  layerOpacity,
  onLayerToggle,
  onOpacityChange,
}: LayerControlsProps) {
  return (
    <div>
      <div className="space-y-2">
        {heatmapLayers.map(layer => (
          <div
            key={layer.key}
            className="flex items-center justify-between p-2 bg-[hsl(0,0%,17.6%)] rounded"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 ${layer.gradient} rounded`} />
              <span className="text-sm text-[hsl(0,0%,88.2%)]">{layer.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12">
                <Slider
                  value={[Math.round((layerOpacity[layer.key] || 0) * 100)]}
                  onValueChange={([value]) => onOpacityChange(layer.key, value / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLayerToggle(layer.key)}
                className={`p-1 ${
                  activeLayers[layer.key]
                    ? 'text-[hsl(207,90%,54%)]'
                    : 'text-[hsl(0,0%,70.2%)]'
                }`}
              >
                {activeLayers[layer.key] ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
