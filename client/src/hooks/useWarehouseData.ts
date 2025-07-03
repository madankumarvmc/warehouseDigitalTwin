import { useState, useEffect, useCallback } from 'react';
import { HeatmapData, HeatmapType, LayerState } from '@/lib/warehouse/types';
import { generateHeatmapData } from '@/lib/warehouse/heatmapGenerator';

export function useWarehouseData() {
  const [activeLayers, setActiveLayers] = useState<LayerState>({
    volume: true,
    frequency: false,
    occupancy: false,
    misplacement: false,
    expiry: false,
    exceptions: false,
    resources: true,
  });

  const [activeHeatmapType, setActiveHeatmapType] = useState<HeatmapType>('volume');
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [timeRange, setTimeRange] = useState(120); // 2 hours in minutes
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    volume: 0.8,
    frequency: 0.65,
    occupancy: 0.9,
    misplacement: 0.4,
    expiry: 0.25,
    exceptions: 0.15,
  });

  const [isLoading, setIsLoading] = useState(true);

  const toggleLayer = useCallback((layerName: string) => {
    setActiveLayers(prev => {
      const newState = { ...prev };
      
      // If toggling a heatmap layer on, turn off other heatmaps
      const heatmapLayers = ['volume', 'frequency', 'occupancy', 'misplacement', 'expiry', 'exceptions'];
      if (heatmapLayers.includes(layerName) && !prev[layerName]) {
        heatmapLayers.forEach(layer => {
          if (layer !== layerName) {
            newState[layer] = false;
          }
        });
        setActiveHeatmapType(layerName as HeatmapType);
      }
      
      newState[layerName] = !prev[layerName];
      return newState;
    });
  }, []);

  const updateLayerOpacity = useCallback((layerName: string, opacity: number) => {
    setLayerOpacity(prev => ({
      ...prev,
      [layerName]: opacity,
    }));
  }, []);

  const updateTimeRange = useCallback((newTimeRange: number) => {
    setTimeRange(newTimeRange);
  }, []);

  // Generate heatmap data when active type or time range changes
  useEffect(() => {
    const generateData = async () => {
      setIsLoading(true);
      
      // Simulate async data loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = generateHeatmapData(activeHeatmapType, timeRange);
      setHeatmapData(data);
      setIsLoading(false);
    };

    generateData();
  }, [activeHeatmapType, timeRange]);

  // Initialize with default data
  useEffect(() => {
    const initializeData = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading
      const initialData = generateHeatmapData('volume', 120);
      setHeatmapData(initialData);
      setIsLoading(false);
    };

    initializeData();
  }, []);

  return {
    activeLayers,
    activeHeatmapType,
    heatmapData,
    timeRange,
    layerOpacity,
    isLoading,
    toggleLayer,
    updateLayerOpacity,
    updateTimeRange,
  };
}
