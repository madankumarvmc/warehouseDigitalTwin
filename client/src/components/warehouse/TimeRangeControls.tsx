import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';

interface TimeRangeControlsProps {
  timeRange: number;
  onTimeRangeChange: (range: number) => void;
}

const timeRangeOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '24 hours' },
];

export function TimeRangeControls({ timeRange, onTimeRangeChange }: TimeRangeControlsProps) {
  const [localValue, setLocalValue] = useState(timeRange);

  // Debounce the time range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeRangeChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onTimeRangeChange]);

  const formatTimeLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${minutes / 60} hours`;
    return `${minutes / 1440} days`;
  };

  const getCurrentLabel = () => {
    const option = timeRangeOptions.find(opt => opt.value === timeRange);
    return option ? `Last ${option.label}` : `Last ${formatTimeLabel(timeRange)}`;
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-foreground">Time Range</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>15 min</span>
          <span>24 hours</span>
        </div>
        <Slider
          value={[localValue]}
          onValueChange={([value]) => setLocalValue(value)}
          min={15}
          max={1440}
          step={15}
          className="w-full"
        />
        <div className="text-center">
          <span className="text-sm text-primary font-medium">
            {getCurrentLabel()}
          </span>
        </div>
      </div>
    </div>
  );
}
