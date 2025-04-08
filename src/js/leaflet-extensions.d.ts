// Leaflet extensions for IxMaps

import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Util {
    function wrapLatLng(latlng: L.LatLng): L.LatLng;
  }
  
  interface Map {
    _getPanOffset(center: L.LatLng): L.Point;
    _originalGetPanOffset(center: L.LatLng): L.Point;
  }
} 