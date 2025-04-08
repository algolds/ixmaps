/**
 * IxMaps Coordinate System - Clean Implementation
 * Compatible with linear distance calculations
 * With proper hemisphere orientation and prime meridian
 */

// Import Leaflet
import * as L from 'leaflet';

// Import types and constants
import { LatLng, SvgPoint, VisibleBounds, DistanceResult, MapConfig, GridStyle } from './types';

// Declare Leaflet extensions
declare module 'leaflet' {
  namespace Util {
    function wrapLatLng(latlng: L.LatLng): L.LatLng;
  }
  
  interface Map {
    _getPanOffset(center: L.LatLng): L.Point;
    _originalGetPanOffset(center: L.LatLng): L.Point;
  }
}

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    coordSystemInitialized: boolean;
    map: L.Map;
    mapConfig: MapConfig;
    clickMarker: L.Marker;
    calculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    originalCalculateDistance: (latlng1: L.LatLng, latlng2: L.LatLng) => DistanceResult;
    svgToLatLng: (x: number, y: number) => LatLng;
    latLngToSvg: (lat: number, lng: number) => SvgPoint;
    svgToCustomLatLng: (x: number, y: number) => LatLng;
    drawGrid: () => void;
    drawPrimeMeridian: () => void;
    showToast: (message: string, type: string, duration: number) => void;
    initializeCoordinateSystem: () => void;
  }
}

// Only initialize once
if (window.coordSystemInitialized) {
  console.log("Coordinate system already initialized, skipping...");
} else {
  document.addEventListener('DOMContentLoaded', function() {
    // Try to initialize after the map is loaded
    setTimeout(function checkAndInitialize() {
      if (window.map && window.mapConfig) {
        initCoordinateSystem();
      } else {
        console.log('Map not available yet, waiting...');
        setTimeout(checkAndInitialize, 1000);
      }
    }, 1000);
  });
}

// Map constants and reference points
const RAW_MAP_WIDTH = 8202;
const RAW_MAP_HEIGHT = 4900;
const EQUATOR_Y_POSITION = 2450;
const PRIME_MERIDIAN_X_POSITION = 4101;
const PIXELS_PER_LONGITUDE_DEGREE = 45.5666;
const PIXELS_PER_LATITUDE_DEGREE = 27.2222;

// Layer groups for coordinate system elements
const gridLayer = L.layerGroup();
const primeMeridianLayer = L.layerGroup();

// Visible latitude bounds
const visibleBounds: VisibleBounds = {
  northLat: 70,  // Northern visible limit in degrees
  southLat: -70, // Southern visible limit in degrees
};

// Prime meridian reference point
const primeMeridianRef: LatLng = {
  lat: -14.08, // Negative value for Southern hemisphere
  lng: 26.22   // Eastern longitude
};

// Will store SVG coordinates of prime meridian
let primeMeridianSvg: SvgPoint | null = null;

/**
 * Convert SVG coordinates to geographic coordinates
 * @param x - SVG x coordinate
 * @param y - SVG y coordinate
 * @returns {lat, lng} in geographic coordinates
 */
function svgToLatLng(x: number, y: number): LatLng {
  // Map y-coordinate to latitude range with proper N/S orientation
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  // Invert latitude calculation to correct hemisphere
  const lat = -1 * (visibleBounds.southLat + (y / window.mapConfig.svgHeight * latRange));
  
  // Calculate longitude in standard way
  const lng = (x / window.mapConfig.svgWidth * 360) - 180;
  
  return { lat, lng };
}

/**
 * Convert geographic coordinates to SVG coordinates
 * @param lat - Latitude in geographic coordinates
 * @param lng - Longitude in geographic coordinates
 * @returns {x, y} in SVG coordinates
 */
function latLngToSvg(lat: number, lng: number): SvgPoint {
  // Invert latitude for correct hemisphere mapping
  const invertedLat = -lat;
  
  // Clamp to visible bounds
  const clampedLat = Math.max(visibleBounds.southLat, Math.min(visibleBounds.northLat, invertedLat));
  
  // Convert latitude to y coordinate
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  const y = ((clampedLat - visibleBounds.southLat) / latRange) * window.mapConfig.svgHeight;
  
  // Convert longitude to x coordinate with wraparound
  const normalizedLng = ((lng + 180) % 360) / 360;
  const x = normalizedLng * window.mapConfig.svgWidth;
  
  return { x, y };
}

/**
 * Convert SVG coordinates to custom lat/lng using prime meridian as reference
 * @param x - SVG x coordinate
 * @param y - SVG y coordinate
 * @returns {lat, lng} with lng relative to prime meridian
 */
function svgToCustomLatLng(x: number, y: number): LatLng {
  // Calculate latitude with proper hemisphere orientation
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  const lat = 1 * (visibleBounds.southLat + (y / window.mapConfig.svgHeight * latRange));
  
  // Ensure prime meridian reference exists
  if (!primeMeridianSvg || !primeMeridianSvg.x) {
    console.error("Prime meridian reference not initialized");
    return { lat, lng: 0 };
  }
  
  // Calculate longitude relative to prime meridian with wraparound
  const normalizedX = ((x % window.mapConfig.svgWidth) + window.mapConfig.svgWidth) % window.mapConfig.svgWidth;
  const normalizedPrimeMeridianX = ((primeMeridianSvg.x % window.mapConfig.svgWidth) + window.mapConfig.svgWidth) % window.mapConfig.svgWidth;
  
  let lngOffset = normalizedX - normalizedPrimeMeridianX;
  
  // Minimize the offset to handle wraparound edge cases
  if (Math.abs(lngOffset) > window.mapConfig.svgWidth / 2) {
    if (lngOffset > 0) {
      lngOffset -= window.mapConfig.svgWidth;
    } else {
      lngOffset += window.mapConfig.svgWidth;
    }
  }
  
  const lngScale = 360 / window.mapConfig.svgWidth;
  const lng = lngOffset * lngScale;
  
  return { lat, lng };
}

/**
 * Format coordinate for display
 * @param value - Coordinate value
 * @param posLabel - Label for positive values (e.g. "N", "E")
 * @param negLabel - Label for negative values (e.g. "S", "W")
 * @returns Formatted coordinate string
 */
function formatCoord(value: number, posLabel: string, negLabel: string): string {
  const absValue = Math.abs(value);
  const direction = value >= 0 ? posLabel : negLabel;
  return `${absValue.toFixed(2)}° ${direction}`;
}

/**
 * Add coordinate marker when clicking on map
 * @param e - Click event
 */
function addCoordinateMarker(e: L.LeafletMouseEvent): void {
  // Remove existing marker
  if (window.clickMarker) {
    window.map.removeLayer(window.clickMarker);
  }
  
  // Get coordinates using custom system
  const customCoord = svgToCustomLatLng(e.latlng.lng, e.latlng.lat);
  
  // Create marker
  const marker = L.circleMarker(e.latlng, {
    radius: 5,
    color: '#FF4500',
    fillColor: '#FFA07A',
    fillOpacity: 1,
    weight: 2
  }).addTo(window.map);
  
  // Store marker in window object
  window.clickMarker = marker as unknown as L.Marker;
  
  // Create popup with coordinates
  const coordText = `
    <div style="text-align:center;">
      <strong>Coordinates:</strong><br>
      Lat: ${formatCoord(customCoord.lat, 'N', 'S')}<br>
      Lng: ${formatCoord(customCoord.lng, 'E', 'W')}
    </div>
  `;
  
  window.clickMarker.bindPopup(coordText).openPopup();
  
  // Show toast notification
  if (typeof window.showToast === 'function') {
    window.showToast(`Clicked at Lat: ${formatCoord(customCoord.lat, 'N', 'S')}, Lng: ${formatCoord(customCoord.lng, 'E', 'W')}`, 'info', 3000);
  }
}

/**
 * Draw coordinate grid based on zoom level
 */
function drawGrid(): void {
  // Clear existing grid
  gridLayer.clearLayers();
  
  const zoom = window.map.getZoom();
  
  // Adjust grid spacing based on zoom
  let spacing = 30; // Default 30 degree spacing
  if (zoom > 3) spacing = 15; // At higher zoom, use 15 degrees
  if (zoom > 4) spacing = 10; // Even higher zoom, use 10 degrees
  if (zoom > 5) spacing = 5;  // At highest zoom, use 5 degrees
  
  // Show or hide labels based on checkbox
  const labelsCheckbox = document.getElementById('toggle-coords-labels') as HTMLInputElement;
  const showLabels = labelsCheckbox ? labelsCheckbox.checked : true;
  
  // Prime meridian is our 0° longitude reference
  const primeMeridianX = primeMeridianSvg!.x;
  
  // Get visible bounds in SVG coordinates
  const southPoint = latLngToSvg(visibleBounds.southLat, 0);
  const northPoint = latLngToSvg(visibleBounds.northLat, 0);
  
  // Get current view bounds for clipping
  const bounds = window.map.getBounds();
  const visibleWest = bounds.getWest();
  const visibleEast = bounds.getEast();
  
  // Add buffer to ensure grid lines appear smoothly when scrolling
  const bufferWidth = window.mapConfig.svgWidth * 0.1; // 10% buffer
  
  // Calculate pixels per degree for longitude
  const pixelsPerDegree = window.mapConfig.svgWidth / 360;
  
  // Track labeled positions to prevent overlap
  const labeledPositions: number[] = [];
  const LABEL_MIN_DISTANCE = 50; // Minimum distance between labels in pixels
  
  /**
   * Check if a new label position would overlap with existing ones
   * @param position - X position for the label
   * @returns true if position is safe (no overlap), false otherwise
   */
  function isLabelPositionSafe(position: number): boolean {
    for (let i = 0; i < labeledPositions.length; i++) {
      if (Math.abs(position - labeledPositions[i]) < LABEL_MIN_DISTANCE) {
        return false;
      }
    }
    return true;
  }
  
  // Draw the prime meridian (0°) and its wrapped instances
  const drawMeridian = function(xPosition: number): void {
    if (xPosition >= visibleWest - bufferWidth && xPosition <= visibleEast + bufferWidth) {
      L.polyline([
        [southPoint.y, xPosition], // Bottom of visible map
        [northPoint.y, xPosition]  // Top of visible map
      ], {
        color: '#FF8000', // Orange for prime meridian
        weight: 2,
        opacity: 0.8,
        dashArray: '8,6'
      }).addTo(gridLayer);
      
      // Prime meridian label
      if (showLabels) {
        const meridianLabelPos = L.latLng(southPoint.y + 20, xPosition);
        // Add label only if it won't overlap with existing ones
        if (isLabelPositionSafe(xPosition)) {
          L.marker(meridianLabelPos, {
            icon: L.divIcon({
              className: 'grid-label prime-meridian-label',
              html: '0°',
              iconSize: [40, 20],
              iconAnchor: [20, 0]
            })
          }).addTo(gridLayer);
          
          // Record this position
          labeledPositions.push(xPosition);
        }
      }
    }
  };
  
  // Draw all instances of prime meridian
  drawMeridian(primeMeridianX);
  drawMeridian(primeMeridianX + window.mapConfig.svgWidth);  // Right wraparound
  drawMeridian(primeMeridianX - window.mapConfig.svgWidth);  // Left wraparound
  
  // Function to draw a longitude line
  const drawLongitudeLine = function(svgX: number, labelText: string, isMajor: boolean): void {
    // Only draw if within visible area (including buffer)
    if (svgX >= visibleWest - bufferWidth && svgX <= visibleEast + bufferWidth) {
      // Draw the line
      L.polyline([
        [southPoint.y, svgX], // Bottom of visible map
        [northPoint.y, svgX]  // Top of visible map
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? undefined : window.GRID_STYLE.DASH_ARRAY
      }).addTo(gridLayer);
      
      // Add label if it's a major line and labels are enabled
      if (isMajor && showLabels) {
        const labelPos = L.latLng(southPoint.y + 20, svgX);
        
        // Only add label if position is safe (not overlapping)
        if (isLabelPositionSafe(svgX)) {
          L.marker(labelPos, {
            icon: L.divIcon({
              className: 'grid-label',
              html: labelText,
              iconSize: [40, 20],
              iconAnchor: [20, 0]
            })
          }).addTo(gridLayer);
          
          // Record this position to prevent future overlaps
          labeledPositions.push(svgX);
        }
      }
    }
  };
  
  // Calculate how many grid lines we need
  const maxLines = Math.ceil(360 / spacing);
  
  // First pass: Draw all grid lines
  // Draw lines east of prime meridian
  for (let i = 1; i <= maxLines; i++) {
    const lng = i * spacing;
    const isMajor = lng % 30 === 0;
    
    // Calculate pixels from prime meridian
    const offsetPixels = lng * pixelsPerDegree;
    
    // Draw original line and wraparounds
    const svgX = primeMeridianX + offsetPixels;
    
    // Draw lines without labels first
    L.polyline([
      [southPoint.y, svgX], // Bottom of visible map
      [northPoint.y, svgX]  // Top of visible map
    ], {
      color: '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? undefined : window.GRID_STYLE.DASH_ARRAY
    }).addTo(gridLayer);
    
    L.polyline([
      [southPoint.y, svgX - window.mapConfig.svgWidth], // Bottom of visible map
      [northPoint.y, svgX - window.mapConfig.svgWidth]  // Top of visible map
    ], {
      color: '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? undefined : window.GRID_STYLE.DASH_ARRAY
    }).addTo(gridLayer);
    
    L.polyline([
      [southPoint.y, svgX + window.mapConfig.svgWidth], // Bottom of visible map
      [northPoint.y, svgX + window.mapConfig.svgWidth]  // Top of visible map
    ], {
      color: '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? undefined : window.GRID_STYLE.DASH_ARRAY
    }).addTo(gridLayer);
  }
  
  // Draw lines west of prime meridian
  for (let i = 1; i <= maxLines; i++) {
    const lng = i * spacing;
    const isMajor = lng % 30 === 0;
    
    // Calculate pixels from prime meridian
    const offsetPixels = lng * pixelsPerDegree;
    
    // Draw original line and wraparounds
    const svgX = primeMeridianX - offsetPixels;
    
    // Draw lines without labels first
    L.polyline([
      [southPoint.y, svgX], // Bottom of visible map
      [northPoint.y, svgX]  // Top of visible map
    ], {
      color: '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? undefined : window.GRID_STYLE.DASH_ARRAY
    }).addTo(gridLayer);
    
    L.polyline([
      [southPoint.y, svgX - window.mapConfig.svgWidth], // Bottom of visible map
      [northPoint.y, svgX - window.mapConfig.svgWidth]  // Top of visible map
    ], {
      color: '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? undefined : window.GRID_STYLE.DASH_ARRAY
    }).addTo(gridLayer);
    
    L.polyline([
      [southPoint.y, svgX + window.mapConfig.svgWidth], // Bottom of visible map
      [northPoint.y, svgX + window.mapConfig.svgWidth]  // Top of visible map
    ], {
      color: '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? undefined : window.GRID_STYLE.DASH_ARRAY
    }).addTo(gridLayer);
  }
  
  // Second pass: Add labels with overlap prevention
  // Draw labels for east lines
  for (let i = 1; i <= maxLines; i++) {
    const lng = i * spacing;
    const isMajor = lng % 30 === 0;
    if (!isMajor || !showLabels) continue;
    
    const offsetPixels = lng * pixelsPerDegree;
    const svgX = primeMeridianX + offsetPixels;
    
    // Try all three possible positions (original, left wrap, right wrap)
    // in order of visibility priority
    if (svgX >= visibleWest && svgX <= visibleEast && isLabelPositionSafe(svgX)) {
      addLongitudeLabel(svgX, `${lng}° E`);
    } else if (svgX - window.mapConfig.svgWidth >= visibleWest && svgX - window.mapConfig.svgWidth <= visibleEast && 
               isLabelPositionSafe(svgX - window.mapConfig.svgWidth)) {
      addLongitudeLabel(svgX - window.mapConfig.svgWidth, `${lng}° E`);
    } else if (svgX + window.mapConfig.svgWidth >= visibleWest && svgX + window.mapConfig.svgWidth <= visibleEast && 
               isLabelPositionSafe(svgX + window.mapConfig.svgWidth)) {
      addLongitudeLabel(svgX + window.mapConfig.svgWidth, `${lng}° E`);
    }
  }
  
  // Draw labels for west lines
  for (let i = 1; i <= maxLines; i++) {
    const lng = i * spacing;
    const isMajor = lng % 30 === 0;
    if (!isMajor || !showLabels) continue;
    
    const offsetPixels = lng * pixelsPerDegree;
    const svgX = primeMeridianX - offsetPixels;
    
    // Try all three possible positions (original, left wrap, right wrap)
    // in order of visibility priority
    if (svgX >= visibleWest && svgX <= visibleEast && isLabelPositionSafe(svgX)) {
      addLongitudeLabel(svgX, `${lng}° W`);
    } else if (svgX - window.mapConfig.svgWidth >= visibleWest && svgX - window.mapConfig.svgWidth <= visibleEast && 
               isLabelPositionSafe(svgX - window.mapConfig.svgWidth)) {
      addLongitudeLabel(svgX - window.mapConfig.svgWidth, `${lng}° W`);
    } else if (svgX + window.mapConfig.svgWidth >= visibleWest && svgX + window.mapConfig.svgWidth <= visibleEast && 
               isLabelPositionSafe(svgX + window.mapConfig.svgWidth)) {
      addLongitudeLabel(svgX + window.mapConfig.svgWidth, `${lng}° W`);
    }
  }
  
  // Helper function to add a longitude label and track its position
  function addLongitudeLabel(xPosition: number, labelText: string): void {
    const labelPos = L.latLng(southPoint.y + 20, xPosition);
    L.marker(labelPos, {
      icon: L.divIcon({
        className: 'grid-label',
        html: labelText,
        iconSize: [40, 20],
        iconAnchor: [20, 0]
      })
    }).addTo(gridLayer);
    
    labeledPositions.push(xPosition);
  }
  
  // Draw latitude lines - only within visible bounds
  for (let lat = Math.ceil(visibleBounds.southLat / spacing) * spacing; 
       lat <= visibleBounds.northLat; 
       lat += spacing) {
    
    const isMajor = lat % 30 === 0;
    const isEquator = Math.abs(lat) < 0.001;
    
    // Get SVG coordinates for this latitude
    const svgY = latLngToSvg(lat, 0).y;
    
    // Draw the line across the full visible width
    const visibleWidth = visibleEast - visibleWest + (2 * bufferWidth);
    const lineStart = visibleWest - bufferWidth;
    
    L.polyline([
      [svgY, lineStart], // Left side of visible area with buffer
      [svgY, lineStart + visibleWidth] // Right side of visible area with buffer
    ], {
      color: isEquator ? '#FF4500' : '#666',
      weight: (isMajor || isEquator) ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: (isMajor || isEquator) ? undefined : window.GRID_STYLE.DASH_ARRAY
    }).addTo(gridLayer);
    
    // Add label if needed
    if ((isMajor || isEquator) && showLabels) {
      const labelPos = L.latLng(svgY, visibleWest + 20);
      
      // Correct the display of N/S labels
      const displayLat = -lat; // Invert for display
      
      L.marker(labelPos, {
        icon: L.divIcon({
          className: 'grid-label',
          html: `${Math.abs(displayLat)}° ${displayLat >= 0 ? 'N' : 'S'}`,
          iconSize: [40, 20],
          iconAnchor: [0, 10]
        })
      }).addTo(gridLayer);
    }
  }
}

/**
 * Draw prime meridian with proper wraparound
 */
function drawPrimeMeridian(): void {
  // Clear existing layers
  primeMeridianLayer.clearLayers();
  
  // Ensure reference point is initialized
  if (!primeMeridianSvg || !primeMeridianSvg.x) {
    console.error("Prime meridian reference not initialized");
    return;
  }
  
  // Get SVG coordinates for visible bounds
  const southPoint = latLngToSvg(visibleBounds.southLat, 0);
  const northPoint = latLngToSvg(visibleBounds.northLat, 0);
  
  // Get current map view bounds
  const bounds = window.map.getBounds();
  const westBound = bounds.getWest();
  const eastBound = bounds.getEast();
  
  // Add buffer for smooth appearance/disappearance
  const bufferWidth = window.mapConfig.svgWidth * 0.1;
  
  // Function to draw a meridian instance
  const drawMeridianLine = function(xPosition: number): void {
    // Only draw if in visible area (with buffer)
    if (xPosition >= westBound - bufferWidth && xPosition <= eastBound + bufferWidth) {
      // Draw the meridian line
      L.polyline([
        [southPoint.y, xPosition], 
        [northPoint.y, xPosition]
      ], {
        color: '#FF8000',
        weight: 2.5,
        opacity: 0.8,
        dashArray: '8,6'
      }).addTo(primeMeridianLayer);
      
      // Add meridian label
      L.marker(L.latLng(southPoint.y - 20, xPosition), {
        icon: L.divIcon({
          className: 'prime-meridian-label',
          html: 'Prime Meridian (0°)',
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        })
      }).addTo(primeMeridianLayer);
      
      // Add reference point marker
      const markerY = primeMeridianSvg!.y;
      if (markerY >= southPoint.y && markerY <= northPoint.y) {
        L.circleMarker(L.latLng(markerY, xPosition), {
          radius: 8,
          color: '#FF8000',
          fillColor: '#FFFF00',
          fillOpacity: 0.7,
          weight: 2
        }).bindPopup(`
          <strong>Prime Meridian Reference</strong><br>
          Geographic: ${formatCoord(Math.abs(primeMeridianRef.lat), 'S', 'N')}, ${formatCoord(primeMeridianRef.lng, 'E', 'W')}<br>
          Map Reference: 0° Longitude
        `).addTo(primeMeridianLayer);
      }
    }
  };
  
  // Draw all instances of the meridian
  drawMeridianLine(primeMeridianSvg.x);  // Original
  drawMeridianLine(primeMeridianSvg.x + window.mapConfig.svgWidth);  // Right wraparound
  drawMeridianLine(primeMeridianSvg.x - window.mapConfig.svgWidth);  // Left wraparound
}

/**
 * Smooth wraparound during map movement
 */
function updateMapWraparound(): void {
  const center = window.map.getCenter();
  const svgWidth = window.mapConfig.svgWidth;
  
  // If panned beyond bounds, wrap around immediately without animation
  if (center.lng < 0) {
    window.map.panTo([center.lat, center.lng + svgWidth], {
      animate: false,
      duration: 0,
      easeLinearity: 1,
      noMoveStart: true
    });
  } else if (center.lng > svgWidth) {
    window.map.panTo([center.lat, center.lng - svgWidth], {
      animate: false,
      duration: 0,
      easeLinearity: 1,
      noMoveStart: true
    });
  }
}

/**
 * Modify map wraparound behavior for seamless transitions
 */
function modifyMapWraparound(): void {
  // Store original function
  const originalWrapLatLng = L.Util.wrapLatLng;
  
  // Override to apply custom wrapping
  L.Util.wrapLatLng = function(latlng: L.LatLng): L.LatLng {
    const wrapped = originalWrapLatLng.call(this, latlng);
    
    // Apply vertical bounds
    if (wrapped.lat < 0) {
      wrapped.lat = Math.max(wrapped.lat, -window.mapConfig.svgHeight);
    } else {
      wrapped.lat = Math.min(wrapped.lat, 0);
    }
    
    return wrapped;
  };
  
  // Update the map panning logic
  L.Map.include({
    _originalGetPanOffset: L.Map.prototype._getPanOffset,
    
    _getPanOffset: function(center: L.LatLng): L.Point {
      const offset = this._originalGetPanOffset.call(this, center);
      
      // Only apply horizontal wrapping
      const bounds = this.getPixelBounds();
      const mapWidth = bounds.max.x - bounds.min.x;
      
      // If the offset is more than half the map width, wrap around
      if (Math.abs(offset.x) > mapWidth / 2) {
        if (offset.x > 0) {
          offset.x -= mapWidth;
        } else {
          offset.x += mapWidth;
        }
      }
      
      return offset;
    }
  });
}

// Coordinate display control (position indicator)
const CoordDisplayControl = L.Control.extend({
  options: {
    position: 'bottomleft'
  },
  
  onAdd: function(): HTMLElement {
    const container = L.DomUtil.create('div', 'ixmap-coordinates-display');
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    container.style.padding = '5px 10px';
    container.style.border = '2px solid rgba(0, 0, 0, 0.2)';
    container.style.borderRadius = '4px';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.innerHTML = 'Lat: 0.00° N, Lng: 0.00° E';
    return container;
  }
});

// Coordinate control panel (settings)
const CoordControlPanel = L.Control.extend({
  options: {
    position: 'topright'
  },
  
  onAdd: function(): HTMLElement {
    const container = L.DomUtil.create('div', 'leaflet-control coord-system-control');
    container.style.backgroundColor = 'white';
    container.style.padding = '6px 10px';
    container.style.borderRadius = '4px';
    container.style.border = '2px solid rgba(0, 0, 0, 0.2)';
    container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    container.style.cursor = 'auto';
    container.style.fontSize = '12px';
    container.style.marginBottom = '5px';
    
    // Prevent events from propagating to map
    L.DomEvent.disableClickPropagation(container);
    
    // Add control options
    container.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">Coordinates</div>
      <div style="margin-bottom: 4px;">
        <label style="display: flex; align-items: center; font-size: 12px;">
          <input type="checkbox" id="toggle-coords-display" checked>
          <span style="margin-left: 5px;">Show Position</span>
        </label>
      </div>
      <div style="margin-bottom: 4px;">
        <label style="display: flex; align-items: center; font-size: 12px;">
          <input type="checkbox" id="toggle-coords-grid" checked>
          <span style="margin-left: 5px;">Show Grid</span>
        </label>
      </div>
      <div>
        <label style="display: flex; align-items: center; font-size: 12px;">
          <input type="checkbox" id="toggle-coords-labels" checked>
          <span style="margin-left: 5px;">Show Labels</span>
        </label>
      </div>
      <div style="margin-top: 8px; border-top: 1px solid #ddd; padding-top: 8px;">
        <div style="margin-bottom: 4px; font-weight: bold;">Prime Meridian</div>
        <div>
          <label style="display: flex; align-items: center; font-size: 12px;">
            <input type="checkbox" id="toggle-prime-meridian">
            <span style="margin-left: 5px;">Show Prime Meridian</span>
          </label>
        </div>
      </div>
    `;
    
    return container;
  }
});

// Toggle button for coordinate panel
const CoordToggleControl = L.Control.extend({
  options: {
    position: 'topright'
  },
  
  onAdd: function(map: L.Map): HTMLElement {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control coordinate-toggle-control');
    
    const link = L.DomUtil.create('a', 'coordinate-toggle-link', container);
    link.href = '#';
    link.title = 'Toggle Coordinate Panel';
    link.innerHTML = '🌐';
    link.style.fontSize = '16px';
    link.style.lineHeight = '26px';
    link.style.textAlign = 'center';
    link.style.fontWeight = 'bold';
    
    L.DomEvent
      .on(link, 'click', L.DomEvent.stopPropagation)
      .on(link, 'click', L.DomEvent.preventDefault)
      .on(link, 'click', function() {
        const panel = document.querySelector('.coord-system-control');
        if (panel) {
          (panel as HTMLElement).style.display = (panel as HTMLElement).style.display === 'none' ? 'block' : 'none';
        }
      });
    
    L.DomEvent.on(container, 'mousedown', L.DomEvent.stopPropagation);
    
    return container;
  }
});

// Add CSS styles
function addCoordinateStyles(): void {
  // Check if styles already exist
  if (document.getElementById('coordinate-system-styles')) return;
  
  const coordStyles = document.createElement('style');
  coordStyles.id = 'coordinate-system-styles';
  coordStyles.textContent = `
    .grid-label {
      background-color: rgba(255, 255, 255, 0.7);
      border: 1px solid #666;
      border-radius: 3px;
      padding: 2px 4px;
      font-size: 10px;
      font-weight: bold;
      color: #333;
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
    }
    
    .prime-meridian-label {
      background-color: rgba(255, 128, 0, 0.8);
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
      text-align: center;
      white-space: nowrap;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
      pointer-events: none;
    }
    
    .ixmap-coordinates-display {
      min-width: 200px;
    }
  `;
  
  document.head.appendChild(coordStyles);
}

/**
 * Calibrated distance calculation compatible with coordinate system
 * Should be used to overwrite the main file's calculation
 * @param latlng1 - First point
 * @param latlng2 - Second point
 * @returns Object with distances in miles and kilometers
 */
function coordSystemCalculateDistance(latlng1: L.LatLng, latlng2: L.LatLng): DistanceResult {
  try {
    const point1 = window.map.latLngToContainerPoint(latlng1);
    const point2 = window.map.latLngToContainerPoint(latlng2);
    
    if (!point1 || !point2) return { miles: 0, kilometers: 0, km: 0 };
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    // Calculate pixel distance
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Use calibrated value for this map with coord system
    const CALIBRATED_MILES_PER_PIXEL = 2.7;
    
    // Apply zoom level scaling but skip latitude factor
    const zoom = window.map.getZoom();
    const milesPerPixel = CALIBRATED_MILES_PER_PIXEL / Math.pow(2, zoom);
    const miles = pixelDistance * milesPerPixel;
    
    // Convert to kilometers
    const km = miles * 1.60934;
    
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
 * Initialize the coordinate system
 */
function initCoordinateSystem(): void {
  console.log('Initializing coordinate system...');
  
  // Prevent duplicate initialization
  if (window.coordSystemInitialized) {
    console.log('Coordinate system already initialized, skipping...');
    return;
  }
  
  // Mark as initialized
  window.coordSystemInitialized = true;
  
  // Add CSS styles
  addCoordinateStyles();
  
  // Override the distance calculation function with our calibrated version
  window.originalCalculateDistance = window.calculateDistance;
  window.calculateDistance = coordSystemCalculateDistance;
  
  // Replace global functions with our versions
  window.svgToLatLng = svgToLatLng;
  window.latLngToSvg = latLngToSvg;
  window.svgToCustomLatLng = svgToCustomLatLng;
  window.drawGrid = drawGrid;
  window.drawPrimeMeridian = drawPrimeMeridian;
  
  // Add coordinate controls to the map
  const coordDisplay = new CoordDisplayControl();
  coordDisplay.addTo(window.map);
  
  const coordControlPanel = new CoordControlPanel();
  window.map.addControl(coordControlPanel);
  
  const coordToggleControl = new CoordToggleControl();
  window.map.addControl(coordToggleControl);
  
  // Add grid layer to map
  gridLayer.addTo(window.map);
  
  // Calculate prime meridian position
  primeMeridianSvg = latLngToSvg(primeMeridianRef.lat, primeMeridianRef.lng);
  console.log('Prime meridian positioned at:', primeMeridianSvg);
  
  // Restrict vertical panning but allow horizontal wrapping
  const southWest = L.latLng(window.mapConfig.svgHeight, -Infinity);
  const northEast = L.latLng(0, Infinity);
  window.map.setMaxBounds(L.latLngBounds(southWest, northEast));
  
  // Center map at prime meridian
  const centerY = window.mapConfig.svgHeight / 2;
  window.map.panTo([centerY, primeMeridianSvg.x], {animate: true, duration: 1});
  
  // Make horizontal wraparound seamless
  modifyMapWraparound();
  
  // Draw initial grid
  drawGrid();
  
  // Set up event handlers
  
  // Update coordinate display on mouse move - only show custom coordinates
  window.map.on('mousemove', function(e: L.LeafletMouseEvent) {
    const customCoord = svgToCustomLatLng(e.latlng.lng, e.latlng.lat);
    
    const display = document.querySelector('.ixmap-coordinates-display');
    if (display) {
      display.innerHTML = `
        <div>Lat: ${formatCoord(customCoord.lat, 'N', 'S')}</div>
        <div>Lng: ${formatCoord(customCoord.lng, 'E', 'W')}</div>
      `;
    }
  });
  
  // Add click handler for coordinate markers
  window.map.on('click', addCoordinateMarker);
  
  // Update grid on zoom or pan
  window.map.on('zoomend', updateCoordinateDisplays);
  window.map.on('moveend', updateCoordinateDisplays);
  window.map.on('move', updateMapWraparound);
  
  // Update all coordinate displays (grid, meridian)
  function updateCoordinateDisplays(): void {
    drawGrid();
    if (document.getElementById('toggle-prime-meridian') && 
        (document.getElementById('toggle-prime-meridian') as HTMLInputElement).checked) {
      drawPrimeMeridian();
    }
  }
  
  // Event handlers for control panel checkboxes
  setTimeout(function() {
    // Toggle coordinate display
    const displayToggle = document.getElementById('toggle-coords-display') as HTMLInputElement;
    if (displayToggle) {
      displayToggle.addEventListener('change', function() {
        const display = document.querySelector('.ixmap-coordinates-display');
        if (display) {
          (display as HTMLElement).style.display = this.checked ? 'block' : 'none';
        }
      });
    }
    
    // Toggle grid
    const gridToggle = document.getElementById('toggle-coords-grid') as HTMLInputElement;
    if (gridToggle) {
      gridToggle.addEventListener('change', function() {
        if (this.checked) {
          window.map.addLayer(gridLayer);
          drawGrid();
        } else {
          window.map.removeLayer(gridLayer);
        }
      });
    }
    
    // Toggle labels
    const labelsToggle = document.getElementById('toggle-coords-labels') as HTMLInputElement;
    if (labelsToggle) {
      labelsToggle.addEventListener('change', function() {
        drawGrid();
      });
    }
    
    // Toggle prime meridian
    const meridianToggle = document.getElementById('toggle-prime-meridian') as HTMLInputElement;
    if (meridianToggle) {
      meridianToggle.addEventListener('change', function() {
        if (this.checked) {
          window.map.addLayer(primeMeridianLayer);
          drawPrimeMeridian();
        } else {
          window.map.removeLayer(primeMeridianLayer);
        }
      });
    }
  }, 500);
  
  console.log('Coordinate system initialized successfully');
  
  // Show success notification
  if (typeof window.showToast === 'function') {
    window.showToast('Coordinate system initialized with calibrated distance measurements', 'success', 3000);
  }
}

// Make initialization function available globally
window.initializeCoordinateSystem = initCoordinateSystem; 