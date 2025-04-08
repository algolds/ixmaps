// Global types and constants for IxMaps

// Map dimensions and reference points
const MAP_CONSTANTS = {
  RAW_MAP_WIDTH: 8202,
  RAW_MAP_HEIGHT: 4900,
  EQUATOR_Y_POSITION: 2450,
  PRIME_MERIDIAN_X_POSITION: 4101,
  PIXELS_PER_LONGITUDE_DEGREE: 45.5666,
  PIXELS_PER_LATITUDE_DEGREE: 27.2222,
  CALIBRATED_MILES_PER_PIXEL: 2.7
};

// Visible latitude bounds
const VISIBLE_BOUNDS = {
  northLat: 70,  // Northern visible limit in degrees
  southLat: -70  // Southern visible limit in degrees
};

// Prime meridian reference point
const PRIME_MERIDIAN_REF = {
  lat: -14.08, // Negative value for Southern hemisphere
  lng: 26.22   // Eastern longitude
};

// Grid styling constants
const GRID_STYLE = {
  MAJOR_LINE_WEIGHT: 1.5,
  MINOR_LINE_WEIGHT: 0.8,
  LINE_OPACITY: 0.6,
  DASH_ARRAY: '3,5',
  MAJOR_DASH_ARRAY: null,
  PRIME_MERIDIAN_COLOR: '#FF8000',
  PRIME_MERIDIAN_WEIGHT: 2.5,
  PRIME_MERIDIAN_OPACITY: 0.8,
  PRIME_MERIDIAN_DASH_ARRAY: '8,6',
  EQUATOR_COLOR: '#FF4500',
  GRID_COLOR: '#666'
};

// Label styling constants
const LABEL_STYLE = {
  MIN_DISTANCE: 50, // Minimum distance between labels in pixels
  BACKGROUND_COLOR: 'rgba(255, 255, 255, 0.7)',
  BORDER_COLOR: '#666',
  BORDER_RADIUS: '3px',
  FONT_SIZE: '10px',
  FONT_WEIGHT: 'bold',
  COLOR: '#333',
  PRIME_MERIDIAN_BACKGROUND: 'rgba(255, 128, 0, 0.8)',
  PRIME_MERIDIAN_COLOR: 'white',
  PRIME_MERIDIAN_PADDING: '3px 8px',
  PRIME_MERIDIAN_BORDER_RADIUS: '4px',
  PRIME_MERIDIAN_FONT_SIZE: '12px',
  PRIME_MERIDIAN_TEXT_SHADOW: '1px 1px 1px rgba(0,0,0,0.5)'
};

// Export all constants
export {
  MAP_CONSTANTS,
  VISIBLE_BOUNDS,
  PRIME_MERIDIAN_REF,
  GRID_STYLE,
  LABEL_STYLE
};

// Also make them available globally
window.MAP_CONSTANTS = MAP_CONSTANTS;
window.VISIBLE_BOUNDS = VISIBLE_BOUNDS;
window.PRIME_MERIDIAN_REF = PRIME_MERIDIAN_REF;
window.GRID_STYLE = GRID_STYLE;
window.LABEL_STYLE = LABEL_STYLE; 