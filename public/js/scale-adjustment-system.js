/**
 * IxMaps Scale Adjustment System
 * This script provides utilities for converting between raw map coordinates and display coordinates
 */

class ScaleManager {
  constructor(config) {
    this.rawWidth = config.rawWidth || 8202;
    this.rawHeight = config.rawHeight || 4900;
    this.pixelsPerLongitude = config.pixelsPerLongitude || 45.5666;
    this.pixelsPerLatitude = config.pixelsPerLatitude || 27.2222;
    this.equatorY = config.equatorY || 2450;
    this.primeMeridianX = config.primeMeridianX || 4101;
    this.sqMilesPerPixel = config.sqMilesPerPixel || 10;
    this.sqKmPerPixel = config.sqKmPerPixel || 25.90;
    
    // Reference to Leaflet map - set this after initialization
    this.map = null;
    
    // Current display dimensions
    this.displayWidth = 0;
    this.displayHeight = 0;
  }
  
  // Set reference to Leaflet map
  setMap(map) {
    this.map = map;
    this.updateDisplayDimensions();
    return this;
  }
  
  // Update display dimensions based on current container
  updateDisplayDimensions() {
    if (this.map) {
      const container = this.map.getContainer();
      this.displayWidth = container.clientWidth;
      this.displayHeight = container.clientHeight;
    }
    return this;
  }
  
  // Calculate current scale factor between raw and display dimensions
  getScaleFactor() {
    if (!this.map) return 1.0;
    
    // Get current SVG dimensions from map
    const bounds = this.map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Calculate current display size in pixels
    const displayWidth = Math.abs(this.map.latLngToContainerPoint(ne).x - 
                                  this.map.latLngToContainerPoint(sw).x);
    const displayHeight = Math.abs(this.map.latLngToContainerPoint(ne).y - 
                                   this.map.latLngToContainerPoint(sw).y);
    
    // Calculate width and height scale factors
    const widthScale = displayWidth / this.rawWidth;
    const heightScale = displayHeight / this.rawHeight;
    
    // Use the smaller scale to maintain proportions
    return Math.min(widthScale, heightScale);
  }
  
  // Convert raw pixel coordinates to Leaflet latLng
  rawToLatLng(rawX, rawY) {
    // First convert to geo coordinates
    const geo = this.rawToGeo(rawX, rawY);
    
    // Then convert to Leaflet's coordinate system
    // In Leaflet, SVG is positioned with (0,0) at top-left
    const scaleFactor = this.getScaleFactor();
    return L.latLng(rawY * scaleFactor, rawX * scaleFactor);
  }
  
  // Convert Leaflet latLng to raw pixel coordinates
  latLngToRaw(latLng) {
    const scaleFactor = this.getScaleFactor();
    return {
      x: latLng.lng / scaleFactor,
      y: latLng.lat / scaleFactor
    };
  }
  
  // Convert raw pixel coordinates to geographic coordinates
  rawToGeo(rawX, rawY) {
    // Calculate latitude (north/south)
    let lat = 0;
    if (rawY < this.equatorY) {
      // North of equator
      lat = (this.equatorY - rawY) / this.pixelsPerLatitude;
    } else {
      // South of equator
      lat = -((rawY - this.equatorY) / this.pixelsPerLatitude);
    }
    
    // Calculate longitude (east/west)
    let lng = 0;
    if (rawX > this.primeMeridianX) {
      // East of prime meridian
      lng = (rawX - this.primeMeridianX) / this.pixelsPerLongitude;
    } else {
      // West of prime meridian
      lng = -((this.primeMeridianX - rawX) / this.pixelsPerLongitude);
    }
    
    return { lat, lng };
  }
  
  // Convert geographic coordinates to raw pixel coordinates
  geoToRaw(lat, lng) {
    // Calculate raw Y coordinate (latitude)
    let rawY = 0;
    if (lat >= 0) {
      // North of equator
      rawY = this.equatorY - (lat * this.pixelsPerLatitude);
    } else {
      // South of equator
      rawY = this.equatorY + (Math.abs(lat) * this.pixelsPerLatitude);
    }
    
    // Calculate raw X coordinate (longitude)
    let rawX = 0;
    if (lng >= 0) {
      // East of prime meridian
      rawX = this.primeMeridianX + (lng * this.pixelsPerLongitude);
    } else {
      // West of prime meridian
      rawX = this.primeMeridianX - (Math.abs(lng) * this.pixelsPerLongitude);
    }
    
    return { x: rawX, y: rawY };
  }
  
  // Convert Leaflet latLng to geographic coordinates
  latLngToGeo(latLng) {
    // First convert to raw pixel coordinates
    const raw = this.latLngToRaw(latLng);
    
    // Then convert raw to geographic
    return this.rawToGeo(raw.x, raw.y);
  }
  
  // Convert geographic coordinates to Leaflet latLng
  geoToLatLng(lat, lng) {
    // First convert to raw pixel coordinates
    const raw = this.geoToRaw(lat, lng);
    
    // Then convert to Leaflet latLng
    return this.rawToLatLng(raw.x, raw.y);
  }
  
  // Calculate distance in square miles between two points
  calculateDistance(latLng1, latLng2) {
    // Convert to container points
    if (!this.map) return 0;
    
    const p1 = this.map.latLngToContainerPoint(latLng1);
    const p2 = this.map.latLngToContainerPoint(latLng2);
    
    // Calculate pixel distance
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Convert to square miles based on current zoom level
    const zoom = this.map.getZoom();
    const sqMilesPerPixel = this.sqMilesPerPixel / Math.pow(2, zoom);
    
    return pixelDistance * sqMilesPerPixel;
  }
  
  // Get current scale information formatted for display
  getScaleInfo() {
    if (!this.map) return { text: "Scale not available" };
    
    const zoom = this.map.getZoom();
    const milesPerPixel = this.sqMilesPerPixel / Math.pow(2, zoom);
    const kmPerPixel = this.sqKmPerPixel / Math.pow(2, zoom);
    
    return {
      milesPerPixel: milesPerPixel,
      kmPerPixel: kmPerPixel,
      text: `1px = ${milesPerPixel.toFixed(2)} sq mi (${kmPerPixel.toFixed(2)} sq km)`,
      mapScale: `1:${Math.round(1 / this.getScaleFactor() * 1000)}`
    };
  }
  
  // Format coordinate string for display
  formatCoord(value, posLabel, negLabel) {
    const absValue = Math.abs(value);
    const direction = value >= 0 ? posLabel : negLabel;
    return `${absValue.toFixed(3)}° ${direction}`;
  }
  
  // Format geographic coordinates for display
  formatGeoCoords(geoCoords) {
    return {
      lat: this.formatCoord(geoCoords.lat, 'N', 'S'),
      lng: this.formatCoord(geoCoords.lng, 'E', 'W')
    };
  }
}

// Export the ScaleManager
window.IxScaleManager = ScaleManager;