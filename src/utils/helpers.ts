import { GeoCoordinates, SvgCoordinates } from '../types';
import { VISIBLE_BOUNDS, MAP_CONFIG } from './constants';

/**
 * Format coordinate for display
 * @param value - Coordinate value
 * @param posLabel - Label for positive values (e.g. "N", "E")
 * @param negLabel - Label for negative values (e.g. "S", "W")
 * @returns Formatted coordinate string
 */
export function formatCoord(value: number, posLabel: string, negLabel: string): string {
  const absValue = Math.abs(value);
  const direction = value >= 0 ? posLabel : negLabel;
  return `${absValue.toFixed(2)}° ${direction}`;
}

/**
 * Calculates scale factor between raw map and display
 * @returns The calculated scale factor
 */
export function calculateScaleFactor(): number {
  if (!window.map) return 1;
  
  // Use the current display size vs raw map size
  const mapWidth = window.map.getContainer().clientWidth;
  const mapHeight = window.map.getContainer().clientHeight;
  
  // Calculate width and height scale factors
  const widthScale = MAP_CONFIG.svgWidth / MAP_CONFIG.rawWidth;
  const heightScale = MAP_CONFIG.svgHeight / MAP_CONFIG.rawHeight;
  
  // Use the smaller scale to maintain proportions
  return Math.min(widthScale, heightScale);
}

/**
 * Convert SVG coordinates to geographic coordinates
 * Uses the master map's coordinate system
 * @param x - SVG x coordinate
 * @param y - SVG y coordinate
 * @returns Geographic coordinates {lat, lng}
 */
export function svgToLatLng(x: number, y: number): GeoCoordinates {
  // Map y-coordinate to latitude range with proper N/S orientation
  const latRange = VISIBLE_BOUNDS.northLat - VISIBLE_BOUNDS.southLat;
  
  // Invert latitude calculation to correct hemisphere
  const lat = -1 * (VISIBLE_BOUNDS.southLat + (y / MAP_CONFIG.svgHeight * latRange));
  
  // Calculate longitude in standard way
  const lng = (x / MAP_CONFIG.svgWidth * 360) - 180;
  
  return { lat, lng };
}

/**
 * Convert geographic coordinates to SVG coordinates
 * Uses the master map's coordinate system
 * @param lat - Latitude in geographic coordinates
 * @param lng - Longitude in geographic coordinates
 * @returns SVG coordinates {x, y}
 */
export function latLngToSvg(lat: number, lng: number): SvgCoordinates {
  // Invert latitude for correct hemisphere mapping
  const invertedLat = -lat;
  
  // Clamp to visible bounds
  const clampedLat = Math.max(VISIBLE_BOUNDS.southLat, Math.min(VISIBLE_BOUNDS.northLat, invertedLat));
  
  // Convert latitude to y coordinate
  const latRange = VISIBLE_BOUNDS.northLat - VISIBLE_BOUNDS.southLat;
  const y = ((clampedLat - VISIBLE_BOUNDS.southLat) / latRange) * MAP_CONFIG.svgHeight;
  
  // Convert longitude to x coordinate with wraparound
  const normalizedLng = ((lng + 180) % 360) / 360;
  const x = normalizedLng * MAP_CONFIG.svgWidth;
  
  return { x, y };
}

/**
 * Extract country data from SVG element
 * @param element - SVG element for a country
 * @returns Country data object
 */
export function extractCountryData(element: SVGElement): any {
  if (!element) return {};
  
  const data: { [key: string]: any } = {
    id: element.id || 'unknown',
    name: element.getAttribute('data-name') || element.id || 'Unknown Country'
  };
  
  // Extract additional data from attributes
  const attributes = element.attributes;
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    if (attr.name.startsWith('data-')) {
      const key = attr.name.replace('data-', '');
      data[key] = attr.value;
    }
  }
  
  // Extract any metadata elements
  const metadataEl = element.querySelector('metadata');
  if (metadataEl) {
    const dataElements = metadataEl.querySelectorAll('data');
    dataElements.forEach(el => {
      const key = el.getAttribute('key');
      if (key) {
        data[key] = el.textContent;
      }
    });
  }
  
  return data;
}

/**
 * Generates a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Safely access nested properties of an object
 * @param obj - Object to access
 * @param path - Path to property as string (e.g. "user.profile.name")
 * @param defaultValue - Default value if property doesn't exist
 * @returns Property value or default
 */
export function getNestedProperty(obj: any, path: string, defaultValue: any = undefined): any {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
      
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}

/**
 * Debounce function to limit how often a function is called
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait = 100): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit how often a function is called
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit = 100): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Clamp a number between min and max values
 * @param num - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}