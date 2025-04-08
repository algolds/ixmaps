import L from 'leaflet-module';

export interface MapConfig {
  masterMapPath: string;
  baseMapUrl: string;
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
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  showCountryLabels: boolean;
}

export interface LayerVisibility {
  political: boolean;
  climate: boolean;
  lakes: boolean;
  rivers: boolean;
  mountains: boolean;
  cities: boolean;
  countries: boolean;
  states: boolean;
  territories: boolean;
  disputed: boolean;
  labels: boolean;
  grid: boolean;
  scale: boolean;
  compass: boolean;
}

declare global {
  interface Window {
    map: L.Map;
    mapConfig: MapConfig;
    layerVisibility: LayerVisibility;
    updateLayerVisibility: () => void;
    showCountryLabels: () => void;
    hideCountryLabels: () => void;
    IxMaps: {
      Main: {
        showToast: (message: string, type?: string, duration?: number) => string;
        hideToast: (toastId: string) => void;
        calculateScaleFactor: () => number;
        calculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng, unit?: 'miles' | 'km') => number;
        calculatePixelDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => number;
        updateLayerVisibility: () => void;
        getLayerVisibility: () => LayerVisibility;
        showCountryLabels: () => void;
        hideCountryLabels: () => void;
        MILES_PER_PIXEL: number;
        KM_PER_PIXEL: number;
      };
      Toast?: {
        showToast: (message: string, type?: string, duration?: number) => string;
        hideToast: (toastId: string) => void;
      };
    };
  }
} 