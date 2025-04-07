import { Distance } from '../types';
import { MAP_CONFIG } from '../utils/constants';
import * as L from 'leaflet';

/**
 * Service for calculating distances on the map
 */
export class DistanceCalculator {
  private static instance: DistanceCalculator;
  private map: L.Map | null = null;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DistanceCalculator {
    if (!DistanceCalculator.instance) {
      DistanceCalculator.instance = new DistanceCalculator();
    }
    return DistanceCalculator.instance;
  }
  
  /**
   * Private constructor (use getInstance instead)
   */
  private constructor() {}
  
  /**
   * Initialize the distance calculator
   * @param map - Leaflet map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
  }
  
  /**
   * Calculate distance between two points with calibrated scale
   * @param latlng1 - First point
   * @param latlng2 - Second point
   * @returns Object with distances in miles and kilometers
   */
  public calculateDistance(latlng1: L.LatLng, latlng2: L.LatLng): Distance {
    try {
      if (!this.map) {
        return { miles: 0, km: 0 };
      }
      
      const point1 = this.map.latLngToContainerPoint(latlng1);
      const point2 = this.map.latLngToContainerPoint(latlng2);
      
      if (!point1 || !point2) {
        return { miles: 0, km: 0 };
      }
      
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      
      // Calculate pixel distance
      const pixelDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Use calibrated value for this map with coord system
      const CALIBRATED_MILES_PER_PIXEL = MAP_CONFIG.milesPerPixel;
      
      // Apply zoom level scaling but skip latitude factor
      const zoom = this.map.getZoom();
      const milesPerPixel = CALIBRATED_MILES_PER_PIXEL / Math.pow(2, zoom);
      const miles = pixelDistance * milesPerPixel;
      
      // Convert to kilometers
      const km = miles * 1.60934;
      
      return {
        miles: miles,
        km: km
      };
    } catch (error) {
      console.error('Error calculating distance:', error);
      return { miles: 0, km: 0 };
    }
  }
  
  /**
   * Calculate distance with latitude correction
   * @param latlng1 - First point
   * @param latlng2 - Second point
   * @returns Object with distances in miles and kilometers
   */
  public calculateDistanceWithLatitudeCorrection(latlng1: L.LatLng, latlng2: L.LatLng): Distance {
    try {
      if (!this.map) {
        return { miles: 0, km: 0 };
      }
      
      const point1 = this.map.latLngToContainerPoint(latlng1);
      const point2 = this.map.latLngToContainerPoint(latlng2);
      
      if (!point1 || !point2) {
        return { miles: 0, km: 0 };
      }
      
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      
      // Calculate pixel distance
      const pixelDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Get current center latitude to adjust for projection distortion
      const centerLat = this.map.getCenter().lat;
      const latFactor = Math.cos(Math.abs(centerLat) * Math.PI / 180);
      
      // Convert to linear miles using the distance formula with latitude correction
      // Adjusted for zoom level
      const zoom = this.map.getZoom();
      const milesPerPixel = MAP_CONFIG.milesPerPixel / Math.pow(2, zoom) / Math.max(0.5, latFactor);
      const miles = pixelDistance * milesPerPixel;
      
      // Convert miles to kilometers
      const km = miles * (MAP_CONFIG.kmPerPixel / MAP_CONFIG.milesPerPixel);
      
      return {
        miles: miles,
        km: km
      };
    } catch (error) {
      console.error('Error calculating distance with latitude correction:', error);
      return { miles: 0, km: 0 };
    }
  }
  
  /**
   * Calculate the total distance of a path
   * @param points - Array of points forming the path
   * @returns Object with total distances in miles and kilometers
   */
  public calculatePathDistance(points: L.LatLng[]): Distance {
    if (!points.length || points.length < 2) {
      return { miles: 0, km: 0 };
    }
    
    let totalMiles = 0;
    let totalKm = 0;
    
    for (let i = 1; i < points.length; i++) {
      const segment = this.calculateDistance(points[i - 1], points[i]);
      totalMiles += segment.miles;
      totalKm += segment.km;
    }
    
    return {
      miles: totalMiles,
      km: totalKm
    };
  }
  
  /**
   * Calculate pixel distance (legacy support)
   * @param latlng1 - First point
   * @param latlng2 - Second point
   * @returns Distance in pixels
   */
  public calculatePixelDistance(latlng1: L.LatLng, latlng2: L.LatLng): number {
    try {
      if (!this.map) {
        return 0;
      }
      
      const point1 = this.map.latLngToContainerPoint(latlng1);
      const point2 = this.map.latLngToContainerPoint(latlng2);
      
      if (!point1 || !point2) {
        return 0;
      }
      
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      
      return Math.sqrt(dx * dx + dy * dy);
    } catch (error) {
      console.error('Error calculating pixel distance:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const distanceCalculator = DistanceCalculator.getInstance();