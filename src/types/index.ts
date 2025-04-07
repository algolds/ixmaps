import { Selection } from 'd3';
import L from 'leaflet';

// Map configuration
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
  layers: {
    [key: string]: string;
  };
}

// Layer settings
export interface LayerSettings {
  [key: string]: {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    zIndex: number;
  };
}

// Country data
export interface CountryData {
  id: string;
  name: string;
  capital?: string;
  population?: number;
  area?: number;
  [key: string]: any;
}

// Geographic coordinates
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

// SVG coordinates
export interface SvgCoordinates {
  x: number;
  y: number;
}

// Distance measurement
export interface Distance {
  miles: number;
  km: number;
}

// Toast notification
export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  actions?: ToastAction[];
}

// Toast action
export interface ToastAction {
  label: string;
  action: () => void;
  secondary?: boolean;
}

// SVG Document with D3 selection
export interface SvgDocument {
  element: SVGElement;
  selection: Selection<SVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Measurement tool state
export interface MeasurementState {
  active: boolean;
  points: L.LatLng[];
  layer: L.LayerGroup | null;
}

// Tooltip state
export interface TooltipState {
  visible: boolean;
  content: string;
  position: {
    x: number;
    y: number;
  };
}

// Climate zone types
export enum ClimateZoneType {
  Tropical = 'tropical',
  Temperate = 'temperate', 
  Continental = 'continental',
  Polar = 'polar',
  Arid = 'arid',
  Mediterranean = 'mediterranean',
  Oceanic = 'oceanic',
  Montane = 'montane'
}