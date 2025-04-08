/**
 * Leaflet Module Wrapper for IxMaps
 * Provides ES Module compatibility with Leaflet loaded from CDN
 */

// This module provides type-safety with the global Leaflet instance
// that's pre-loaded in index.html

// Define the window.L property for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

// Re-export the global Leaflet object
const L = window.L;
export default L;

// Re-export common Leaflet types for convenience
export type {
  Map,
  MapOptions,
  LatLng,
  LatLngBounds,
  Marker,
  MarkerOptions, 
  LayerGroup,
  ImageOverlay,
  Point,
  CircleMarker,
  DivIcon,
  PolylineOptions,
  LeafletMouseEvent,
  Control
} from 'leaflet';