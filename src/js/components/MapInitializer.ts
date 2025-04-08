import { MapConfig } from '../types';
import L from 'leaflet-module';

export const initializeMap = (config: MapConfig): void => {
  // Initialize the map with the provided configuration
  window.map = L.map('map', {
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    zoomControl: false,
    attributionControl: false
  });

  // Set the initial view
  window.map.setView([0, 0], config.initialZoom);

  // Add the base map layer
  const baseMap = L.imageOverlay(config.baseMapUrl, [
    [config.bounds.north, config.bounds.west],
    [config.bounds.south, config.bounds.east]
  ]);
  baseMap.addTo(window.map);
}; 