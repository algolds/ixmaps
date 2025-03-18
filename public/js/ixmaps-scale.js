/**
 * IxMaps Direct Scaling Fix
 * This script directly modifies the map initialization to fix scaling issues.
 */

// Define map constants
const IxMapConstants = {
    RAW_WIDTH: 8202,
    RAW_HEIGHT: 4900,
    EQUATOR_Y: 2450,
    PRIME_MERIDIAN_X: 4101,
    PIXELS_PER_LONGITUDE: 45.5666,
    PIXELS_PER_LATITUDE: 27.2222,
    SQ_MILES_PER_PIXEL: 10,
    SQ_KM_PER_PIXEL: 25.90
  };
  
  // Find the existing initMap function and modify it
  (function() {
    console.log('IxMaps: Preparing scaling fix...');
    
    // Store the original function if it exists
    const originalInitMap = window.initMap;
    
    // Replace with our enhanced version
    window.initMap = function() {
      console.log('IxMaps: Enhanced map initialization starting...');
      
      // Call the original function first
      if (typeof originalInitMap === 'function') {
        originalInitMap.apply(this, arguments);
      }
      
      // Apply our coordinate system fixes after a short delay
      // to ensure the map has finished loading
      setTimeout(applyCoordinateSystemFixes, 1000);
    };
    
    // If the document is already loaded, apply fixes directly
    if (document.readyState === 'complete') {
      console.log('IxMaps: Document already loaded, applying fixes directly...');
      setTimeout(applyCoordinateSystemFixes, 1000);
    }
  })();
  
  // Main function to apply all coordinate system fixes
  function applyCoordinateSystemFixes() {
    console.log('IxMaps: Applying coordinate system fixes...');
    
    // Check if map exists in global scope
    if (typeof window.map === 'undefined') {
      console.log('IxMaps: Map not found in global scope, checking document...');
      
      // Try to find the map as a global variable or embedded in the document
      try {
        // Find the Leaflet map instance by looking for a common Leaflet container class
        const mapContainer = document.querySelector('.leaflet-container');
        if (mapContainer) {
          // Look through all JS objects for the map
          for (let key in window) {
            if (window[key] && 
                typeof window[key] === 'object' && 
                window[key]._container === mapContainer) {
              console.log(`IxMaps: Found map object as window.${key}`);
              window.map = window[key];
              break;
            }
          }
        }
      } catch (e) {
        console.error('IxMaps: Error finding map object:', e);
      }
    }
    
    // If we still don't have the map, wait and try again
    if (typeof window.map === 'undefined') {
      console.log('IxMaps: Map still not found, will retry in 1 second');
      setTimeout(applyCoordinateSystemFixes, 1000);
      return;
    }
    
    // Apply our fixes
    try {
      fixCoordinateConversion();
      enhanceCoordinateDisplay();
      enhanceScaleDisplay();
      console.log('IxMaps: Coordinate system fixes applied successfully');
      showSuccessMessage();
    } catch (e) {
      console.error('IxMaps: Error applying coordinate fixes:', e);
    }
  }
  
  // Fix coordinate conversion functions
  function fixCoordinateConversion() {
    // Store original functions
    const constants = IxMapConstants;
    const origSvgToLatLng = window.svgToLatLng;
    const origLatLngToSvg = window.latLngToSvg;
    
    // Override svgToLatLng (SVG display coordinates to geographic coordinates)
    window.svgToLatLng = function(x, y) {
      try {
        // Get current display dimensions
        const mapWidth = window.map.getContainer().clientWidth;
        const mapHeight = window.map.getContainer().clientHeight;
        
        // Calculate scale factors
        const displayToRawX = constants.RAW_WIDTH / mapWidth;
        const displayToRawY = constants.RAW_HEIGHT / mapHeight;
        
        // Convert display coordinates to raw coordinates
        const rawX = x * displayToRawX;
        const rawY = y * displayToRawY;
        
        // Calculate latitude (north/south)
        let lat = 0;
        if (rawY < constants.EQUATOR_Y) {
          // North of equator
          lat = (constants.EQUATOR_Y - rawY) / constants.PIXELS_PER_LATITUDE;
        } else {
          // South of equator
          lat = -((rawY - constants.EQUATOR_Y) / constants.PIXELS_PER_LATITUDE);
        }
        
        // Calculate longitude (east/west)
        let lng = 0;
        if (rawX > constants.PRIME_MERIDIAN_X) {
          // East of prime meridian
          lng = (rawX - constants.PRIME_MERIDIAN_X) / constants.PIXELS_PER_LONGITUDE;
        } else {
          // West of prime meridian
          lng = -((constants.PRIME_MERIDIAN_X - rawX) / constants.PIXELS_PER_LONGITUDE);
        }
        
        return { lat, lng };
      } catch (e) {
        console.error('Error in svgToLatLng:', e);
        // Fall back to original if available, or default values
        return origSvgToLatLng ? origSvgToLatLng(x, y) : { lat: 0, lng: 0 };
      }
    };
    
    // Override latLngToSvg (geographic coordinates to SVG display coordinates)
    window.latLngToSvg = function(lat, lng) {
      try {
        // Calculate raw coordinates from geographic coordinates
        let rawY = 0;
        if (lat >= 0) {
          // North of equator
          rawY = constants.EQUATOR_Y - (lat * constants.PIXELS_PER_LATITUDE);
        } else {
          // South of equator
          rawY = constants.EQUATOR_Y + (Math.abs(lat) * constants.PIXELS_PER_LATITUDE);
        }
        
        let rawX = 0;
        if (lng >= 0) {
          // East of prime meridian
          rawX = constants.PRIME_MERIDIAN_X + (lng * constants.PIXELS_PER_LONGITUDE);
        } else {
          // West of prime meridian
          rawX = constants.PRIME_MERIDIAN_X - (Math.abs(lng) * constants.PIXELS_PER_LONGITUDE);
        }
        
        // Convert raw coordinates to display coordinates
        const mapWidth = window.map.getContainer().clientWidth;
        const mapHeight = window.map.getContainer().clientHeight;
        
        // Calculate scale factors
        const rawToDisplayX = mapWidth / constants.RAW_WIDTH;
        const rawToDisplayY = mapHeight / constants.RAW_HEIGHT;
        
        // Convert raw coordinates to display coordinates
        const x = rawX * rawToDisplayX;
        const y = rawY * rawToDisplayY;
        
        return { x, y };
      } catch (e) {
        console.error('Error in latLngToSvg:', e);
        // Fall back to original if available, or default values
        return origLatLngToSvg ? origLatLngToSvg(lat, lng) : { x: 0, y: 0 };
      }
    };
    
    // Also override pixel distance calculation if it exists
    if (window.calculatePixelDistance) {
      const origCalculatePixelDistance = window.calculatePixelDistance;
      
      window.calculatePixelDistance = function(latlng1, latlng2, map) {
        try {
          // Use map parameter if provided, otherwise fallback to global map
          const m = map || window.map;
          
          // Get points in container space
          const point1 = m.latLngToContainerPoint(latlng1);
          const point2 = m.latLngToContainerPoint(latlng2);
          
          // Calculate pixel distance
          const dx = point2.x - point1.x;
          const dy = point2.y - point1.y;
          const pixelDistance = Math.sqrt(dx * dx + dy * dy);
          
          // Convert to square miles based on current zoom
          const zoom = m.getZoom();
          const sqMilesPerPixel = IxMapConstants.SQ_MILES_PER_PIXEL / Math.pow(2, zoom);
          
          return pixelDistance * sqMilesPerPixel;
        } catch (e) {
          console.error('Error in calculatePixelDistance:', e);
          // Fall back to original if available
          return origCalculatePixelDistance ? 
            origCalculatePixelDistance(latlng1, latlng2, map) : 0;
        }
      };
    }
    
    console.log('IxMaps: Coordinate conversion functions fixed');
  }
  
  // Enhance coordinate display
  function enhanceCoordinateDisplay() {
    try {
      // Add styles for raw coordinate display
      const styleId = 'ixmaps-coordinate-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .raw-coordinates {
            font-size: 10px;
            color: #666;
            font-family: monospace;
            margin-top: 4px;
            border-top: 1px dotted #ccc;
            padding-top: 4px;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Create a formatter function
      const formatCoord = function(value, posLabel, negLabel) {
        const absValue = Math.abs(value);
        const direction = value >= 0 ? posLabel : negLabel;
        return `${absValue.toFixed(3)}° ${direction}`;
      };
      
      // Remove any existing mousemove handler from the map
      window.map.off('mousemove.coordinates');
      
      // Add our enhanced handler
      window.map.on('mousemove.coordinates', function(e) {
        // Get the coordinate display element
        const coordDisplay = document.querySelector('.ixmap-coordinates-display');
        if (!coordDisplay) return;
        
        try {
          // Calculate geographic coordinates
          const geoCoords = window.svgToLatLng(e.latlng.lng, e.latlng.lat);
          
          // Calculate raw pixel coordinates
          const mapWidth = window.map.getContainer().clientWidth;
          const mapHeight = window.map.getContainer().clientHeight;
          const displayToRawX = IxMapConstants.RAW_WIDTH / mapWidth;
          const displayToRawY = IxMapConstants.RAW_HEIGHT / mapHeight;
          const rawX = Math.round(e.latlng.lng * displayToRawX);
          const rawY = Math.round(e.latlng.lat * displayToRawY);
          
          // Update display
          coordDisplay.innerHTML = `
            <div>Lat: ${formatCoord(geoCoords.lat, 'N', 'S')}</div>
            <div>Lng: ${formatCoord(geoCoords.lng, 'E', 'W')}</div>
            <div class="raw-coordinates">Raw: (${rawX}, ${rawY})</div>
          `;
        } catch (err) {
          console.error('Error updating coordinate display:', err);
        }
      });
      
      console.log('IxMaps: Coordinate display enhanced');
    } catch (e) {
      console.error('Error enhancing coordinate display:', e);
    }
  }
  
  // Enhance scale display
  function enhanceScaleDisplay() {
    try {
      // Update the custom scale control with accurate scale information
      const updateScaleInfo = function() {
        try {
          // Find the scale control
          const scaleControl = document.querySelector('.custom-scale-control');
          if (!scaleControl) return;
          
          // Calculate current scale
          const zoom = window.map.getZoom();
          const milesPerPixel = IxMapConstants.SQ_MILES_PER_PIXEL / Math.pow(2, zoom);
          const kmPerPixel = IxMapConstants.SQ_KM_PER_PIXEL / Math.pow(2, zoom);
          
          // Determine map scale ratio
          const mapWidth = window.map.getContainer().clientWidth;
          const scaleFactor = IxMapConstants.RAW_WIDTH / mapWidth;
          const mapScale = Math.round(scaleFactor * 1000);
          
          // Find or create the scale info element
          let scaleInfo = scaleControl.querySelector('.scale-detailed-info');
          if (!scaleInfo) {
            scaleInfo = document.createElement('div');
            scaleInfo.className = 'scale-detailed-info';
            scaleInfo.style.marginTop = '8px';
            scaleInfo.style.fontSize = '10px';
            scaleInfo.style.color = '#555';
            scaleInfo.style.borderTop = '1px solid #ddd';
            scaleInfo.style.paddingTop = '5px';
            scaleControl.appendChild(scaleInfo);
          }
          
          // Update content
          scaleInfo.innerHTML = `
            <div>1px = ${milesPerPixel.toFixed(2)} sq mi (${kmPerPixel.toFixed(2)} sq km)</div>
            <div>Map Scale: 1:${mapScale}</div>
          `;
        } catch (err) {
          console.error('Error updating scale display:', err);
        }
      };
      
      // Remove any existing handler
      window.map.off('zoomend.scaledisplay');
      
      // Add our handler
      window.map.on('zoomend.scaledisplay', updateScaleInfo);
      
      // Initial update
      updateScaleInfo();
      
      console.log('IxMaps: Scale display enhanced');
    } catch (e) {
      console.error('Error enhancing scale display:', e);
    }
  }
  
  // Show success message using the map's toast system
  function showSuccessMessage() {
    try {
      if (typeof window.showToast === 'function') {
        window.showToast('Map coordinate system initialized', 'success', 3000);
      } else {
        // Create a simple notification if toast isn't available
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.zIndex = '10000';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        notification.style.fontFamily = 'Arial, sans-serif';
        notification.textContent = 'Map coordinate system initialized';
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(function() {
          notification.style.opacity = '0';
          setTimeout(function() {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 3000);
      }
    } catch (e) {
      console.error('Error showing success message:', e);
    }
  }