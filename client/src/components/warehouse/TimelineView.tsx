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
  console.log('TimelineView rendering for:', selectedResource, 'timeRange:', timeRange);
  
  const activityData = useMemo(() => {
    if (!selectedResource) return [];
    
    const trail = getResourceTrail(selectedResource, timeRange);
    console.log('Timeline trail data:', trail.length, 'points');
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

  console.log('Timeline component about to render with segments:', activityData.length);
  
  return (
    <div className="w-full p-6 bg-red-500 border-4 border-yellow-400 min-h-[200px] shadow-xl z-50 relative">
      <div className="mb-4 bg-white p-2 rounded">
        <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
          📊 TIMELINE IS HERE - {selectedResource}
        </h3>
        <p className="text-black font-semibold">
          Last {timeRange < 60 ? `${timeRange} minutes` : `${timeRange / 60} hours`} • {activityData.length} activity segments
        </p>
      </div>
      
      {/* Timeline container */}
      <div className="relative">
        {/* Activity bars */}
        <div className="relative h-12 bg-muted rounded border border-border overflow-hidden">
          {activityData.map((segment, index) => (
            <div
              key={index}
              className={`absolute top-1 bottom-1 ${
                segment.loaded 
                  ? 'bg-green-700' // Dark green for loaded movement
                  : 'bg-orange-500' // Orange for empty movement
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
        <div className="relative mt-2 h-6">
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
        <div className="flex items-center justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-700 rounded"></div>
            <span className="text-muted-foreground">With Load</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-muted-foreground">Empty Movement</span>
          </div>
        </div>
      </div>
    </div>
  );
}