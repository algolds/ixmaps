// Import Leaflet from our module wrapper
import L from 'leaflet-module';

// Import local components
import { MapConfig, LayerVisibility } from './types';
import { loadSVGDimensions } from './components/SVGLoader';
import { initializeMap } from './components/MapInitializer';
import { initToasts, showToast, hideToast } from './components/Toast';
import { createLayerControl } from './components/LayerManager';
import { MILES_PER_PIXEL, KM_PER_PIXEL, calculateDistance } from './components/DistanceCalculator';

// Create and export IxMaps namespace for global access
window.IxMaps = {
  Main: {
    showToast: (message: string, type: string = 'info', duration: number = 3000): string => {
      return showToast(message, type, duration);
    },
    hideToast: (toastId: string): void => {
      hideToast(toastId);
    },
    calculateScaleFactor: (): number => {
      // Calculate scale factor between raw map and display
      const mapWidth = window.map.getContainer().clientWidth;
      const mapHeight = window.map.getContainer().clientHeight;
      
      // Calculate width and height scale factors
      const widthScale = window.mapConfig.svgWidth / window.mapConfig.rawWidth;
      const heightScale = window.mapConfig.svgHeight / window.mapConfig.rawHeight;
      
      // Use the smaller scale to maintain proportions
      return Math.min(widthScale, heightScale);
    },
    calculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng, unit?: 'miles' | 'km'): number => {
      const result = calculateDistance(latlng1, latlng2);
      return unit === 'km' ? result.kilometers : result.miles;
    },
    calculatePixelDistance: (latlng1: L.LatLng, latlng2: L.LatLng): number => {
      try {
        const point1 = window.map.latLngToContainerPoint(latlng1);
        const point2 = window.map.latLngToContainerPoint(latlng2);
        
        if (!point1 || !point2) return 0;
        
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        
        return Math.sqrt(dx * dx + dy * dy);
      } catch (e) {
        console.error('Error calculating pixel distance:', e);
        return 0;
      }
    },
    updateLayerVisibility: (): void => {
      if (window.updateLayerVisibility) {
        window.updateLayerVisibility();
      }
    },
    getLayerVisibility: (): LayerVisibility => {
      return window.layerVisibility || {} as LayerVisibility;
    },
    showCountryLabels: (): void => {
      if (window.showCountryLabels) {
        window.showCountryLabels();
      }
    },
    hideCountryLabels: (): void => {
      if (window.hideCountryLabels) {
        window.hideCountryLabels();
      }
    },
    MILES_PER_PIXEL,
    KM_PER_PIXEL
  }
};

// Assign global functions for compatibility
window.showToast = (message: string, type: string = 'info', duration: number = 3000): string => {
  return showToast(message, type, duration);
};

window.hideToast = (toastId: string): void => {
  hideToast(toastId);
};

window.calculateDistance = calculateDistance;

// Initialize the map configuration
const mapConfig: MapConfig = {
  masterMapPath: './master-map.svg',
  baseMapUrl: './master-map.svg',
  svgWidth: 8202,
  svgHeight: 4900,
  initialZoom: 2,
  minZoom: 0,
  maxZoom: 6,
  rawWidth: 8202,
  rawHeight: 4900,
  pixelsPerLongitude: 22.783333,
  pixelsPerLatitude: 27.222222,
  equatorY: 2450,
  primeMeridianX: 4101,
  milesPerPixel: 3.2,
  kmPerPixel: 5.15,
  labelFontSize: 12,
  labelClassName: 'country-label',
  bounds: {
    north: 0,
    south: 4900,
    east: 8202,
    west: 0
  },
  showCountryLabels: true
};

// Make mapConfig available globally
window.mapConfig = mapConfig;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Initializing IxMaps v4.0...');
    
    // Initialize toast notification system first
    initToasts();
    window.showToast('Loading IxMaps...', 'info', 0);
    
    // Try to get SVG dimensions for more accurate configuration
    try {
      const dimensions = await loadSVGDimensions(mapConfig.masterMapPath);
      if (dimensions.width && dimensions.height) {
        mapConfig.svgWidth = dimensions.width;
        mapConfig.svgHeight = dimensions.height;
        console.log(`Updated SVG dimensions: ${dimensions.width}x${dimensions.height}`);
      }
    } catch (e) {
      console.warn('Could not load SVG dimensions, using defaults:', e);
    }
    
    // Initialize the map
    initializeMap(mapConfig);
    
    // Create layer control
    createLayerControl();
    
    // Hide loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Show welcome message
    window.showToast('IxMaps v4.0 initialized successfully!', 'success', 5000);
    console.log('IxMaps initialized successfully!');
    
    // Initialize coordinate system if available
    if (typeof window.initializeCoordinateSystem === 'function') {
      setTimeout(() => {
        window.initializeCoordinateSystem();
      }, 1000);
    }
  } catch (error: unknown) {
    console.error('Error initializing IxMaps:', error);
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.innerHTML = `Error loading map: ${error instanceof Error ? error.message : String(error)}`;
      loadingIndicator.style.color = 'red';
    }
  }
});