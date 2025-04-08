import { MapConfig } from '../types';
import L from '../leaflet-module';

export const initializeMap = (config: MapConfig): void => {
  console.log('MapInitializer: Starting map initialization with bounds:', config.bounds);
  
  // Create a custom simple CRS for the SVG map
  const customCRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0),
    // Don't wrap around horizontally
    wrapLng: null,
    // Don't wrap around vertically
    wrapLat: null
  });
  
  // Initialize the map with the provided configuration and custom CRS
  window.map = L.map('map', {
    crs: customCRS,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    zoomControl: false,
    attributionControl: false,
    // Don't animate panning
    inertia: false,
    // Disable bouncing when zooming past min/max zoom
    bounceAtZoomLimits: false
  });

  console.log('MapInitializer: Map object created with custom CRS');

  // Calculate bounds based on SVG dimensions
  const bounds = L.latLngBounds(
    L.latLng(config.bounds.south, config.bounds.west),
    L.latLng(config.bounds.north, config.bounds.east)
  );
  
  console.log('MapInitializer: Using bounds:', bounds.toString());

  // Add the base map layer with SVG
  try {
    console.log('MapInitializer: Adding base map layer with URL:', config.baseMapUrl);
    const baseMap = L.imageOverlay(config.baseMapUrl, bounds);
    baseMap.addTo(window.map);
    console.log('MapInitializer: Base map layer added');

    // Fit to bounds and set initial view
    window.map.fitBounds(bounds);
    window.map.setMaxBounds(bounds.pad(0.5)); // Add some padding to allow slight overflow
    console.log('MapInitializer: Map view set');
    
    // Add zoom control
    L.control.zoom({
      position: 'topleft'
    }).addTo(window.map);
    
    console.log('MapInitializer: Map initialized successfully');
  } catch (error) {
    console.error('MapInitializer: Error adding base map layer:', error);
  }
};