import React from 'react';
import { Truck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResourceTrackingProps {
  showResources: boolean;
  onToggleResources: () => void;
}

export function ResourceTracking({ showResources, onToggleResources }: ResourceTrackingProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-[hsl(0,0%,88.2%)]">Live Resources</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-[hsl(0,0%,17.6%)] rounded">
          <div className="flex items-center space-x-3">
            <Truck className="h-4 w-4 text-[hsl(39,100%,50%)]" />
            <span className="text-sm text-[hsl(0,0%,88.2%)]">Forklifts</span>
            <Badge className="bg-[hsl(207,90%,54%)] text-white text-xs px-2 py-1">
              3 Active
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleResources}
            className={`p-1 ${
              showResources
                ? 'text-[hsl(207,90%,54%)]'
                : 'text-[hsl(0,0%,70.2%)]'
            }`}
          >
            {showResources ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
