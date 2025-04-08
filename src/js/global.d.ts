// Global TypeScript declarations for IxMaps

import * as L from 'leaflet';
import { 
  MapConfig, 
  LayerVisibility, 
  CountryLabel, 
  DistanceResult,
  IxMapsNamespace,
  LatLng,
  SvgPoint
} from './types';

// Extend Window interface with IxMaps specifics
declare global {
  interface Window {
    IxMaps: IxMapsNamespace;
    map: L.Map;
    mapConfig: MapConfig;
    layerVisibility: LayerVisibility;
    clickMarker: L.Marker;
    coordSystemInitialized: boolean;
    
    // Functions
    calculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    calculatePixelDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => number;
    originalCalculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    showToast: (message: string, type: string, duration: number) => string;
    hideToast: (toastId: string) => void;
    showCountryLabels: () => void;
    hideCountryLabels: () => void;
    updateLayerVisibility: () => void;
    
    // Coordinate system
    svgToLatLng: (x: number, y: number) => LatLng;
    latLngToSvg: (lat: number, lng: number) => SvgPoint;
    svgToCustomLatLng: (x: number, y: number) => LatLng;
    drawGrid: () => void;
    drawPrimeMeridian: () => void;
    initializeCoordinateSystem: () => void;
  }
}

export {};