// TypeScript declarations for IxMaps

// Map constants
interface MapConstants {
  RAW_MAP_WIDTH: number;
  RAW_MAP_HEIGHT: number;
  EQUATOR_Y_POSITION: number;
  PRIME_MERIDIAN_X_POSITION: number;
  PIXELS_PER_LONGITUDE_DEGREE: number;
  PIXELS_PER_LATITUDE_DEGREE: number;
  CALIBRATED_MILES_PER_PIXEL: number;
}

// Visible bounds
interface VisibleBounds {
  northLat: number;
  southLat: number;
}

// Prime meridian reference
interface PrimeMeridianRef {
  lat: number;
  lng: number;
}

// Grid style
interface GridStyle {
  MAJOR_LINE_WEIGHT: number;
  MINOR_LINE_WEIGHT: number;
  LINE_OPACITY: number;
  DASH_ARRAY: string;
  MAJOR_DASH_ARRAY: string | null;
  PRIME_MERIDIAN_COLOR: string;
  PRIME_MERIDIAN_WEIGHT: number;
  PRIME_MERIDIAN_OPACITY: number;
  PRIME_MERIDIAN_DASH_ARRAY: string;
  EQUATOR_COLOR: string;
  GRID_COLOR: string;
}

// Label style
interface LabelStyle {
  MIN_DISTANCE: number;
  BACKGROUND_COLOR: string;
  BORDER_COLOR: string;
  BORDER_RADIUS: string;
  FONT_SIZE: string;
  FONT_WEIGHT: string;
  COLOR: string;
  PRIME_MERIDIAN_BACKGROUND: string;
  PRIME_MERIDIAN_COLOR: string;
  PRIME_MERIDIAN_PADDING: string;
  PRIME_MERIDIAN_BORDER_RADIUS: string;
  PRIME_MERIDIAN_FONT_SIZE: string;
  PRIME_MERIDIAN_TEXT_SHADOW: string;
}

// Map configuration
interface MapConfig {
  svgWidth: number;
  svgHeight: number;
}

// Coordinate interfaces
interface LatLng {
  lat: number;
  lng: number;
}

interface SvgPoint {
  x: number;
  y: number;
}

interface DistanceResult {
  miles: number;
  km: number;
}

// Extend the Window interface
declare global {
  interface Window {
    MAP_CONSTANTS: MapConstants;
    VISIBLE_BOUNDS: VisibleBounds;
    PRIME_MERIDIAN_REF: PrimeMeridianRef;
    GRID_STYLE: GridStyle;
    LABEL_STYLE: LabelStyle;
    coordSystemInitialized: boolean;
    map: L.Map;
    mapConfig: MapConfig;
    clickMarker: L.Marker;
    calculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    originalCalculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    svgToLatLng: (x: number, y: number) => LatLng;
    latLngToSvg: (lat: number, lng: number) => SvgPoint;
    svgToCustomLatLng: (x: number, y: number) => LatLng;
    drawGrid: () => void;
    drawPrimeMeridian: () => void;
    showToast: (message: string, type: string, duration: number) => void;
    initializeCoordinateSystem: () => void;
  }
}

// Export interfaces
export { MapConstants, VisibleBounds, PrimeMeridianRef, GridStyle, LabelStyle, MapConfig, LatLng, SvgPoint, DistanceResult }; 