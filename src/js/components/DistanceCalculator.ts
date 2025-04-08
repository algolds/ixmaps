import L from 'leaflet-module';
import { DistanceResult } from '../types';

export const MILES_PER_PIXEL = 3.2;
export const KM_PER_PIXEL = 5.15;

export const calculateDistance = (latlng1: L.LatLng, latlng2: L.LatLng): DistanceResult => {
  try {
    const point1 = window.map.latLngToContainerPoint(latlng1);
    const point2 = window.map.latLngToContainerPoint(latlng2);
    
    if (!point1 || !point2) return { miles: 0, kilometers: 0, km: 0 };
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    const miles = pixelDistance * MILES_PER_PIXEL;
    const km = pixelDistance * KM_PER_PIXEL;
    
    return { miles, kilometers: km, km };
  } catch (e) {
    console.error('Error calculating distance:', e);
    return { miles: 0, kilometers: 0, km: 0 };
  }
}; 