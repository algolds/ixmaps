import { MapConfig, LayerSettings } from '../types';

// Constants for scale calculations
export const MILES_PER_PIXEL = 3.2; // Base scale: 1px = 3.2 mi (linear distance)
export const KM_PER_PIXEL = 5.15; // Conversion factor from miles to kilometers

// Map configuration
export const MAP_CONFIG: MapConfig = {
  masterMapPath: 'assets/map.svg',
  svgWidth: 8202, // Match your Inkscape SVG dimensions
  svgHeight: 4900, // Match your Inkscape SVG dimensions
  initialZoom: 2,
  minZoom: -2,
  maxZoom: 6,
  rawWidth: 8202,
  rawHeight: 4900,
  pixelsPerLongitude: 45.5666,
  pixelsPerLatitude: 27.2222,
  equatorY: 2450,
  primeMeridianX: 4101,
  milesPerPixel: MILES_PER_PIXEL,
  kmPerPixel: KM_PER_PIXEL,
  layers: {
    base: 'base-map-layer',
    political: 'political',
    climate: 'climate',
    lakes: 'lakes',
    rivers: 'rivers',
    altitude: 'altitude-layers',
    icecaps: 'icecaps'
  }
};

// Default layer settings
export const LAYER_SETTINGS: LayerSettings = {
  base: {
    id: 'base-map-layer',
    name: 'Base Map',
    visible: true,
    opacity: 1,
    zIndex: 0
  },
  political: {
    id: 'political',
    name: 'Political Borders',
    visible: true,
    opacity: 0.7,
    zIndex: 10
  },
  climate: {
    id: 'climate',
    name: 'Climate Zones',
    visible: false,
    opacity: 0.6,
    zIndex: 5
  },
  lakes: {
    id: 'lakes',
    name: 'Lakes',
    visible: true,
    opacity: 1,
    zIndex: 3
  },
  rivers: {
    id: 'rivers',
    name: 'Rivers',
    visible: true,
    opacity: 1,
    zIndex: 2
  },
  altitude: {
    id: 'altitude-layers',
    name: 'Altitude',
    visible: true,
    opacity: 1,
    zIndex: 1
  },
  icecaps: {
    id: 'icecaps',
    name: 'Ice Caps',
    visible: true,
    opacity: 1,
    zIndex: 4
  }
};

// Altitude sub-layers
export const ALTITUDE_LAYERS = [
  { id: 'altitude-1', name: 'Sea Level' },
  { id: 'altitude-2', name: 'Low Elevation' },
  { id: 'altitude-3', name: 'Mid Elevation' },
  { id: 'altitude-4', name: 'High Elevation' },
  { id: 'altitude-5', name: 'Very High' },
  { id: 'altitude-6', name: 'Mountain' },
  { id: 'altitude-7', name: 'High Mountain' },
  { id: 'altitude-8', name: 'Peak' },
  { id: 'coastlines', name: 'Coastlines' }
];

// Visible latitude bounds
export const VISIBLE_BOUNDS = {
  northLat: 70,  // Northern visible limit in degrees
  southLat: -70  // Southern visible limit in degrees
};

// Prime meridian reference point
export const PRIME_MERIDIAN_REF = {
  lat: -14.08, // Negative value for Southern hemisphere
  lng: 26.22   // Eastern longitude
};

// Nice scale values in miles (common map scales)
export const SCALE_VALUES = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000];

// Define matching standard scale ratios
export const SCALE_RATIOS = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000];