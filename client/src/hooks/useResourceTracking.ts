import { useState, useEffect, useCallback } from 'react';
import { ForkliftResource, BOPTResource } from '@/lib/warehouse/types';
import { resourceSimulator } from '@/lib/warehouse/resourceSimulator';

export function useResourceTracking() {
  const [forklifts, setForklifts] = useState<ForkliftResource[]>([]);
  const [bopts, setBOPTs] = useState<BOPTResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [showTrails, setShowTrails] = useState(false);

  useEffect(() => {
    const handleResourceUpdate = (resources: { forklifts: ForkliftResource[], bopts: BOPTResource[] }) => {
      setForklifts(resources.forklifts);
      setBOPTs(resources.bopts);
    };

    resourceSimulator.addListener(handleResourceUpdate);
    resourceSimulator.start();

    return () => {
      resourceSimulator.removeListener(handleResourceUpdate);
      resourceSimulator.stop();
    };
  }, []);

  const selectResource = useCallback((resourceId: string | null) => {
    setSelectedResource(resourceId);
    setShowTrails(resourceId !== null);
  }, []);

  const toggleTrails = useCallback(() => {
    setShowTrails(prev => !prev);
  }, []);

  const getSelectedResourceData = useCallback(() => {
    if (!selectedResource) return null;
    return resourceSimulator.getResourceById(selectedResource);
  }, [selectedResource]);

  return {
    forklifts,
    bopts,
    selectedResource,
    showTrails,
    selectResource,
    toggleTrails,
    getSelectedResourceData,
  };
}
