import React from 'react';
import { Camera, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportControlsProps {
  onExport: (format: 'png' | 'svg') => void;
}

export function ExportControls({ onExport }: ExportControlsProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-[hsl(0,0%,88.2%)]">Export</h3>
      <div className="space-y-2">
        <Button
          onClick={() => onExport('png')}
          className="w-full bg-[hsl(207,90%,54%)] hover:bg-[hsl(212,78%,46%)] text-white"
        >
          <Camera className="h-4 w-4 mr-2" />
          Export PNG
        </Button>
        <Button
          onClick={() => onExport('svg')}
          variant="outline"
          className="w-full bg-[hsl(0,0%,17.6%)] hover:bg-gray-600 text-[hsl(0,0%,88.2%)] border-gray-600"
        >
          <FileImage className="h-4 w-4 mr-2" />
          Export SVG
        </Button>
      </div>
    </div>
  );
}
