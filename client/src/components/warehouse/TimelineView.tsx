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

    // Convert trail points to continuous activity segments with no gaps
    const segments: ActivitySegment[] = [];
    const now = Date.now();
    const startTime = now - (timeRange * 60 * 1000);
    const totalTimeSpan = timeRange * 60 * 1000;
    
    // Create continuous segments that fill the entire timeline
    for (let i = 0; i < trail.length - 1; i++) {
      const current = trail[i];
      const next = trail[i + 1];
      
      // Calculate position and width as percentages - fill gaps
      const startPercent = ((current.timestamp - startTime) / totalTimeSpan) * 100;
      const endPercent = ((next.timestamp - startTime) / totalTimeSpan) * 100;
      const width = Math.max(2, endPercent - startPercent); // Minimum 2% width for solid blocks
      
      segments.push({
        start: Math.max(0, startPercent),
        width: width,
        loaded: current.loaded,
        timestamp: current.timestamp
      });
    }
    
    // Add final segment to fill to end if needed
    if (trail.length > 0) {
      const lastPoint = trail[trail.length - 1];
      const lastStartPercent = ((lastPoint.timestamp - startTime) / totalTimeSpan) * 100;
      
      if (lastStartPercent < 100) {
        segments.push({
          start: lastStartPercent,
          width: Math.max(2, 100 - lastStartPercent),
          loaded: lastPoint.loaded,
          timestamp: lastPoint.timestamp
        });
      }
    }
    
    // Sort and fill gaps to create truly continuous timeline
    const filledSegments: ActivitySegment[] = [];
    segments.sort((a, b) => a.start - b.start);
    
    let currentPosition = 0;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Fill gap if there's space before this segment
      if (currentPosition < segment.start) {
        const prevSegment = filledSegments[filledSegments.length - 1];
        const gapWidth = segment.start - currentPosition;
        filledSegments.push({
          start: currentPosition,
          width: gapWidth,
          loaded: prevSegment ? prevSegment.loaded : false, // Continue previous state
          timestamp: segment.timestamp
        });
      }
      
      // Add the actual segment
      filledSegments.push(segment);
      currentPosition = segment.start + segment.width;
    }
    
    // Fill remaining space to 100%
    if (currentPosition < 100 && filledSegments.length > 0) {
      const lastSegment = filledSegments[filledSegments.length - 1];
      filledSegments.push({
        start: currentPosition,
        width: 100 - currentPosition,
        loaded: lastSegment.loaded,
        timestamp: lastSegment.timestamp
      });
    }
    
    return filledSegments;
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
          Activity Timeline - {selectedResource}
        </h3>
        <p className="text-xs text-muted-foreground">
          Last {timeRange < 60 ? `${timeRange} minutes` : `${timeRange / 60} hours`} • {activityData.length} activity segments
        </p>
      </div>
      
      {/* Timeline container */}
      <div className="relative">
        {/* Solid block activity visualization */}
        <div className="relative h-8 bg-muted/30 rounded border border-border overflow-hidden">
          {activityData.map((segment, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0"
              style={{
                left: `${segment.start}%`,
                width: `${segment.width}%`,
                backgroundColor: segment.loaded 
                  ? '#16a34a' // Green for loaded movement
                  : '#ea580c' // Orange for empty movement
              }}
              title={`${segment.loaded ? 'With Load' : 'Empty Movement'} - ${new Date(segment.timestamp).toLocaleTimeString()}`}
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