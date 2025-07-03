import { useState, useEffect, useCallback } from 'react';
import { ForkliftResource } from '@/lib/warehouse/types';
import { resourceSimulator } from '@/lib/warehouse/resourceSimulator';

export function useResourceTracking() {
  const [forklifts, setForklifts] = useState<ForkliftResource[]>([]);
  const [selectedForklift, setSelectedForklift] = useState<string | null>(null);
  const [showTrails, setShowTrails] = useState(false);

  useEffect(() => {
    const handleForkliftUpdate = (updatedForklifts: ForkliftResource[]) => {
      setForklifts(updatedForklifts);
    };

    resourceSimulator.addListener(handleForkliftUpdate);
    resourceSimulator.start();

    return () => {
      resourceSimulator.removeListener(handleForkliftUpdate);
      resourceSimulator.stop();
    };
  }, []);

  const selectForklift = useCallback((forkliftId: string | null) => {
    setSelectedForklift(forkliftId);
    setShowTrails(forkliftId !== null);
  }, []);

  const toggleTrails = useCallback(() => {
    setShowTrails(prev => !prev);
  }, []);

  const getSelectedForkliftData = useCallback(() => {
    if (!selectedForklift) return null;
    return resourceSimulator.getForkliftById(selectedForklift);
  }, [selectedForklift]);

  return {
    forklifts,
    selectedForklift,
    showTrails,
    selectForklift,
    toggleTrails,
    getSelectedForkliftData,
  };
}
