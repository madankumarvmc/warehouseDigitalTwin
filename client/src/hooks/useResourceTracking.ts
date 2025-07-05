import { useState, useEffect, useCallback } from 'react';
import { ForkliftResource, BOPTResource, ReachTruckResource, AGVResource } from '@/lib/warehouse/types';
import { resourceSimulator } from '@/lib/warehouse/resourceSimulator';

export function useResourceTracking() {
  const [forklifts, setForklifts] = useState<ForkliftResource[]>([]);
  const [bopts, setBOPTs] = useState<BOPTResource[]>([]);
  const [reachTrucks, setReachTrucks] = useState<ReachTruckResource[]>([]);
  const [agvs, setAGVs] = useState<AGVResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [showTrails, setShowTrails] = useState(false);

  useEffect(() => {
    const handleResourceUpdate = (resources: { 
      forklifts: ForkliftResource[], 
      bopts: BOPTResource[], 
      reachTrucks: ReachTruckResource[], 
      agvs: AGVResource[] 
    }) => {
      setForklifts(resources.forklifts);
      setBOPTs(resources.bopts);
      setReachTrucks(resources.reachTrucks);
      setAGVs(resources.agvs);
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
    reachTrucks,
    agvs,
    selectedResource,
    showTrails,
    selectResource,
    toggleTrails,
    getSelectedResourceData,
  };
}
