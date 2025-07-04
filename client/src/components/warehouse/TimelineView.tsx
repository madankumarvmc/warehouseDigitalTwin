import React, { useMemo } from 'react';
import { getResourceTrail } from '@/lib/warehouse/movementTrails';

interface TimelineViewProps {
  selectedResource: string | null;
  timeRange: number; // in minutes
}

interface ActivitySegment {
  start: number; // percentage from 0-100
  width: number; // percentage width
  loaded: boolean;
  timestamp: number;
}

export function TimelineView({ selectedResource, timeRange }: TimelineViewProps) {
  const activityData = useMemo(() => {
    if (!selectedResource) return [];
    
    const trail = getResourceTrail(selectedResource, timeRange);
    if (trail.length === 0) return [];

    // Convert trail points to activity segments
    const segments: ActivitySegment[] = [];
    const now = Date.now();
    const startTime = now - (timeRange * 60 * 1000);
    
    for (let i = 0; i < trail.length - 1; i++) {
      const current = trail[i];
      const next = trail[i + 1];
      
      // Calculate position and width as percentages
      const startPercent = ((current.timestamp - startTime) / (timeRange * 60 * 1000)) * 100;
      const endPercent = ((next.timestamp - startTime) / (timeRange * 60 * 1000)) * 100;
      const width = Math.max(0.5, endPercent - startPercent); // Minimum 0.5% width for visibility
      
      segments.push({
        start: Math.max(0, startPercent),
        width: width,
        loaded: current.loaded,
        timestamp: current.timestamp
      });
    }
    
    return segments;
  }, [selectedResource, timeRange]);

  const generateTimeLabels = () => {
    const labels = [];
    const now = Date.now();
    const intervals = 6; // Show 6 time labels
    
    for (let i = 0; i <= intervals; i++) {
      const time = new Date(now - (timeRange * 60 * 1000) + (i * (timeRange * 60 * 1000) / intervals));
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      
      labels.push({
        position: (i / intervals) * 100,
        label: `${hours}:${minutes}`
      });
    }
    
    return labels;
  };

  if (!selectedResource) {
    return null;
  }

  const timeLabels = generateTimeLabels();

  return (
    <div className="w-full px-4 py-2 bg-card border-t border-border min-h-[80px] shadow-sm">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
          📊 Activity Timeline - {selectedResource}
        </h3>
        <p className="text-xs text-muted-foreground">
          Last {timeRange < 60 ? `${timeRange} minutes` : `${timeRange / 60} hours`} • {activityData.length} activity segments
        </p>
      </div>
      
      {/* Timeline container */}
      <div className="relative">
        {/* Activity bars */}
        <div className="relative h-5 bg-muted rounded border border-border overflow-hidden">
          {activityData.map((segment, index) => (
            <div
              key={index}
              className={`absolute top-0.5 bottom-0.5 rounded-sm ${
                segment.loaded 
                  ? 'bg-green-600 dark:bg-green-500' // Green for loaded movement
                  : 'bg-orange-500 dark:bg-orange-400' // Orange for empty movement
              }`}
              style={{
                left: `${segment.start}%`,
                width: `${segment.width}%`,
                minWidth: '2px' // Ensure visibility of very short segments
              }}
              title={`${segment.loaded ? 'With Load' : 'Empty'} - ${new Date(segment.timestamp).toLocaleTimeString()}`}
            />
          ))}
        </div>
        
        {/* Time scale labels */}
        <div className="relative mt-1 h-4">
          {timeLabels.map((label, index) => (
            <div
              key={index}
              className="absolute text-xs text-muted-foreground"
              style={{ left: `${label.position}%`, transform: 'translateX(-50%)' }}
            >
              {label.label}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-green-600 dark:bg-green-500 rounded-sm"></div>
            <span className="text-muted-foreground">With Load</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-orange-500 dark:bg-orange-400 rounded-sm"></div>
            <span className="text-muted-foreground">Empty Movement</span>
          </div>
        </div>
      </div>
    </div>
  );
}