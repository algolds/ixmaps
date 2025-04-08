import * as L from 'leaflet';
import { MapConfig } from './types';
import { initializeCoordinateSystem } from './coordinates';  // Import coordinate system
import { createCoordSystemControlPanel } from './coord-ui';  // Import UI components

// Initialize the map configuration
const mapConfig: MapConfig = {
  masterMapPath: 'master-map.svg',
  baseMapUrl: 'master-map.svg',
  svgWidth: 8202,
  svgHeight: 4900,
  initialZoom: 2,
  minZoom: 0,
  maxZoom: 4,
  rawWidth: 8202,
  rawHeight: 4900,
  pixelsPerLongitude: 22.783333,
  pixelsPerLatitude: 27.222222,
  equatorY: 2450,
  primeMeridianX: 4101,
  milesPerPixel: 17.1,
  kmPerPixel: 27.5,
  labelFontSize: 12,
  labelClassName: 'map-label',
  bounds: {
    north: 85,
    south: -85,
    east: 180,
    west: -180
  },
  showCountryLabels: true
};

// Make mapConfig available globally
(window as any).mapConfig = mapConfig;

// Initialize the map when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create the map
  const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    zoomControl: false,
    attributionControl: false
  });

  // Set the map bounds
  const bounds = L.latLngBounds(
    L.latLng(mapConfig.bounds.south, mapConfig.bounds.west),
    L.latLng(mapConfig.bounds.north, mapConfig.bounds.east)
  );
  map.fitBounds(bounds);

  // Add the base map layer
  L.imageOverlay(mapConfig.baseMapUrl, bounds).addTo(map);

  // Make map available globally
  (window as any).map = map;

  // Create coordinate system UI
  createCoordSystemControlPanel();

  // Initialize coordinate system
  try {
    initializeCoordinateSystem();
    console.log('Coordinate system initialized successfully');
  } catch (error) {
    console.error('Error initializing coordinate system:', error);
  }

  // Hide loading indicator
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}); 