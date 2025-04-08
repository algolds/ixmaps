/**
 * IxMaps TypeScript Type Definitions
 */

import { Map as LeafletMap } from 'leaflet';

/**
 * Map bounds configuration
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Map configuration
 */
export interface MapConfig {
  masterMapPath: string;
  svgWidth: number;
  svgHeight: number;
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
  rawWidth: number;
  rawHeight: number;
  pixelsPerLongitude: number;
  pixelsPerLatitude: number;
  equatorY: number;
  primeMeridianX: number;
  milesPerPixel: number;
  kmPerPixel: number;
  labelFontSize: number;
  labelClassName: string;
  bounds: MapBounds;
  baseMapUrl: string;
  showCountryLabels: boolean;
}

/**
 * Toast notification types
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Layer configuration
 */
export interface LayerConfig {
  id: string;
  name: string;
  url: string;
  visible: boolean;
  minZoom: number;
  maxZoom: number;
}

// Layer visibility settings interface
export interface LayerVisibility {
  political: boolean;
  climate: boolean;
  lakes: boolean;
  rivers: boolean;
  'altitude-1': boolean;
  'altitude-2': boolean;
  'altitude-3': boolean;
  'altitude-4': boolean;
  'altitude-5': boolean;
  'altitude-6': boolean;
  'altitude-7': boolean;
  'altitude-8': boolean;
  coastlines: boolean;
  icecaps: boolean;
  labels: boolean;
}

// Country label interface
export interface CountryLabel {
  x: number;
  y: number;
  name: string;
  originalId: string;
  class: 'standard' | 'major' | 'minor' | 'capital';
}

// Distance calculation result interface
export interface DistanceResult {
  miles: number;
  km: number;
}

// SVG dimensions interface
export interface SVGDimensions {
  width: number;
  height: number;
}

// SVG cache interface
export interface SVGCache {
  [url: string]: SVGDimensions;
}

// SVG queue item interface
export interface SVGQueueItem {
  processFn: () => Promise<SVGDimensions>;
  resolve: (value: SVGDimensions) => void;
  reject: (reason?: any) => void;
}

// IxMaps namespace interface
export interface IxMapsNamespace {
  Main: {
    showToast: (message: string, type?: string, duration?: number) => string;
    hideToast: (toastId: string) => void;
    calculateScaleFactor: () => number;
    calculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    calculatePixelDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => number;
    updateLayerVisibility: () => void;
    getLayerVisibility: () => LayerVisibility;
    showCountryLabels: () => void;
    hideCountryLabels: () => void;
    MILES_PER_PIXEL: number;
    KM_PER_PIXEL: number;
  };
}

// Map constants
export interface MapConstants {
  RAW_MAP_WIDTH: number;
  RAW_MAP_HEIGHT: number;
  EQUATOR_Y_POSITION: number;
  PRIME_MERIDIAN_X_POSITION: number;
  PIXELS_PER_LONGITUDE_DEGREE: number;
  PIXELS_PER_LATITUDE_DEGREE: number;
  CALIBRATED_MILES_PER_PIXEL: number;
}

// Visible bounds
export interface VisibleBounds {
  northLat: number;
  southLat: number;
}

// Prime meridian reference
export interface PrimeMeridianRef {
  lat: number;
  lng: number;
}

// Grid style
export interface GridStyle {
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
export interface LabelStyle {
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

// Coordinate interfaces
export interface LatLng {
  lat: number;
  lng: number;
}

export interface SvgPoint {
  x: number;
  y: number;
}

// Global window interface extension
declare global {
  interface Window {
    IxMaps: IxMapsNamespace;
    map: LeafletMap;
    mapConfig: MapConfig;
    calculatePixelDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => number;
    calculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    MAP_CONSTANTS: MapConstants;
    VISIBLE_BOUNDS: VisibleBounds;
    PRIME_MERIDIAN_REF: PrimeMeridianRef;
    GRID_STYLE: GridStyle;
    LABEL_STYLE: LabelStyle;
    coordSystemInitialized: boolean;
    clickMarker: L.Marker;
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