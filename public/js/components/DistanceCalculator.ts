/**
 * DistanceCalculator Component for IxMaps
 * Handles distance calculations
 */

import { DistanceResult } from '../types';

// Constants for scale calculations 
export const MILES_PER_PIXEL = 3.2; // Base scale: 1px = 3.2 mi (linear distance)
export const KM_PER_PIXEL = 5.15; // Conversion factor from miles to kilometers

/**
 * Calculates distance measurements based on pixel distance (LINEAR distance)
 * @param latlng1 - First point
 * @param latlng2 - Second point
 * @returns Object with distances in miles and kilometers
 */
export function calculateDistance(latlng1: L.LatLng, latlng2: L.LatLng): DistanceResult {
  try {
    const point1 = window.map.latLngToContainerPoint(latlng1);
    const point2 = window.map.latLngToContainerPoint(latlng2);
    
    if (!point1 || !point2) return { miles: 0, kilometers: 0, km: 0 };
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    // Calculate pixel distance
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Get current center latitude to adjust for projection distortion
    const centerLat = window.map.getCenter().lat;
    const latFactor = Math.cos(Math.abs(centerLat) * Math.PI / 180);
    
    // Convert to linear miles using the distance formula with latitude correction
    // Adjusted for zoom level
    const zoom = window.map.getZoom();
    const milesPerPixel = MILES_PER_PIXEL / Math.pow(2, zoom) / Math.max(0.5, latFactor);
    const miles = pixelDistance * milesPerPixel;
    
    // Convert miles to kilometers (linear conversion)
    const km = miles * (KM_PER_PIXEL / MILES_PER_PIXEL);
    
    return {
      miles: miles,
      kilometers: km,
      km: km
    };
  } catch (e) {
    console.error('Error calculating distance:', e);
    return { miles: 0, kilometers: 0, km: 0 };
  }
}

/**
 * Legacy function for backward compatibility
 * @param latlng1 - First point
 * @param latlng2 - Second point
 * @returns Distance in pixels
 */
export function calculatePixelDistance(latlng1: L.LatLng, latlng2: L.LatLng): number {
  try {
    const point1 = window.map.latLngToContainerPoint(latlng1);
    const point2 = window.map.latLngToContainerPoint(latlng2);
    
    if (!point1 || !point2) return 0;
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  } catch (e) {
    console.error('Error calculating pixel distance:', e);
    return 0;
  }
}

/**
 * Calculates scale factor between raw map and display
 * @returns The calculated scale factor
 */
export function calculateScaleFactor(): number {
  // Use the current display size vs raw map size
  const mapWidth = window.map.getContainer().clientWidth;
  const mapHeight = window.map.getContainer().clientHeight;
  
  // Calculate width and height scale factors
  const widthScale = window.mapConfig.svgWidth / window.mapConfig.rawWidth;
  const heightScale = window.mapConfig.svgHeight / window.mapConfig.rawHeight;
  
  // Use the smaller scale to maintain proportions
  return Math.min(widthScale, heightScale);
} 