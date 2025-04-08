/**
 * Leaflet Module Wrapper for IxMaps
 * Provides ES Module compatibility with Leaflet loaded from CDN
 */

// This module provides type-safety with the global Leaflet instance
// that's pre-loaded in index.html

// Re-export the global Leaflet object
export default window.L;

// Re-export all Leaflet types
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