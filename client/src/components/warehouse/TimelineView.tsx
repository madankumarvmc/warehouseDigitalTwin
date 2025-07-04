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

    const now = Date.now();
    const totalTimeSpan = timeRange * 60 * 1000;
    const startTime = now - totalTimeSpan;
    
    // Calculate 6-hour work period positioned in center of timeline
    const workDayDuration = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const workStartOffset = Math.max(0, (totalTimeSpan - workDayDuration) / 2);
    const workStartTime = startTime + workStartOffset;
    const workEndTime = Math.min(now, workStartTime + workDayDuration);
    
    // Calculate work period percentages
    const workStartPercent = ((workStartTime - startTime) / totalTimeSpan) * 100;
    const workEndPercent = ((workEndTime - startTime) / totalTimeSpan) * 100;
    
    const segments: (ActivitySegment & { isWorkTime?: boolean })[] = [];
    
    // Add pre-work white space
    if (workStartPercent > 0) {
      segments.push({
        start: 0,
        width: workStartPercent,
        loaded: false,
        timestamp: startTime,
        isWorkTime: false
      });
    }
    
    // Process trail data only within work hours
    const workTrail = trail.filter(point => 
      point.timestamp >= workStartTime && point.timestamp <= workEndTime
    );
    
    if (workTrail.length > 0) {
      // Create activity segments within work hours
      for (let i = 0; i < workTrail.length - 1; i++) {
        const current = workTrail[i];
        const next = workTrail[i + 1];
        
        const segmentStartPercent = ((current.timestamp - startTime) / totalTimeSpan) * 100;
        const segmentEndPercent = ((next.timestamp - startTime) / totalTimeSpan) * 100;
        const segmentWidth = Math.max(1, segmentEndPercent - segmentStartPercent);
        
        segments.push({
          start: segmentStartPercent,
          width: segmentWidth,
          loaded: current.loaded,
          timestamp: current.timestamp,
          isWorkTime: true
        });
      }
      
      // Add final work segment if needed
      const lastPoint = workTrail[workTrail.length - 1];
      const lastSegmentStart = ((lastPoint.timestamp - startTime) / totalTimeSpan) * 100;
      
      if (lastSegmentStart < workEndPercent) {
        segments.push({
          start: lastSegmentStart,
          width: workEndPercent - lastSegmentStart,
          loaded: lastPoint.loaded,
          timestamp: lastPoint.timestamp,
          isWorkTime: true
        });
      }
    }
    
    // Add post-work white space
    if (workEndPercent < 100) {
      segments.push({
        start: workEndPercent,
        width: 100 - workEndPercent,
        loaded: false,
        timestamp: workEndTime,
        isWorkTime: false
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
    <div className="w-full px-4 py-2 bg-card border-t border-border min-h-[80px] shadow-sm relative z-20">
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
                backgroundColor: (segment as any).isWorkTime === false
                  ? '#ffffff' // White for non-work hours
                  : segment.loaded 
                    ? '#86efac' // Light green for loaded movement
                    : '#fed7aa' // Light orange for empty movement
              }}
              title={
                (segment as any).isWorkTime === false 
                  ? 'Non-Work Hours' 
                  : `${segment.loaded ? 'With Load' : 'Empty Movement'} - ${new Date(segment.timestamp).toLocaleTimeString()}`
              }
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
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#86efac' }}></div>
            <span className="text-muted-foreground">With Load</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#fed7aa' }}></div>
            <span className="text-muted-foreground">Empty Movement</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-white border border-border rounded-sm"></div>
            <span className="text-muted-foreground">Non-Work Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}