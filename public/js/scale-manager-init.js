/**
 * IxMaps Scale Manager Initialization
 * This script initializes the scale management system and integrates it with the map
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the map to be initialized
  const waitForMap = setInterval(function() {
    if (window.map) {
      clearInterval(waitForMap);
      initScaleManager();
    }
  }, 100);
});

function initScaleManager() {
  // Create the scale manager with our map's specifications
  const scaleManager = new IxScaleManager({
    rawWidth: 8202,
    rawHeight: 4900,
    pixelsPerLongitude: 45.5666,
    pixelsPerLatitude: 27.2222,
    equatorY: 2450,
    primeMeridianX: 4101,
    sqMilesPerPixel: 10,
    sqKmPerPixel: 25.90
  });
  
  // Set reference to the map
  scaleManager.setMap(window.map);
  
  // Store the scale manager globally for other scripts to access
  window.scaleManager = scaleManager;
  
  // Override existing coordinate conversion functions
  window.svgToLatLng = function(x, y) {
    return scaleManager.rawToGeo(
      scaleManager.latLngToRaw(L.latLng(y, x)).x,
      scaleManager.latLngToRaw(L.latLng(y, x)).y
    );
  };
  
  window.latLngToSvg = function(lat, lng) {
    const raw = scaleManager.geoToRaw(lat, lng);
    const leafletLatLng = scaleManager.rawToLatLng(raw.x, raw.y);
    return { x: leafletLatLng.lng, y: leafletLatLng.lat };
  };
  
  // Replace the coordinate display function
  window.map.off('mousemove'); // Remove existing handler
  window.map.on('mousemove', function(e) {
    const geoCoords = scaleManager.latLngToGeo(e.latlng);
    const rawCoords = scaleManager.latLngToRaw(e.latlng);
    
    const coordDisplay = document.querySelector('.ixmap-coordinates-display');
    if (coordDisplay) {
      const formatted = scaleManager.formatGeoCoords(geoCoords);
      
      coordDisplay.innerHTML = `
        <div>Lat: ${formatted.lat}</div>
        <div>Lng: ${formatted.lng}</div>
        <div class="coord-raw">Raw: (${Math.round(rawCoords.x)}, ${Math.round(rawCoords.y)})</div>
      `;
    }
  });
  
  // Update the custom scale control
  const updateScaleControl = function() {
    const scaleInfo = scaleManager.getScaleInfo();
    
    const scaleControl = document.querySelector('.custom-scale-control');
    if (scaleControl) {
      // Add or update scale info
      let scaleInfoElement = scaleControl.querySelector('.scale-detailed-info');
      if (!scaleInfoElement) {
        scaleInfoElement = document.createElement('div');
        scaleInfoElement.className = 'scale-detailed-info';
        scaleInfoElement.style.marginTop = '8px';
        scaleInfoElement.style.fontSize = '10px';
        scaleInfoElement.style.color = '#555';
        scaleControl.appendChild(scaleInfoElement);
      }
      
      scaleInfoElement.innerHTML = `
        <div>${scaleInfo.text}</div>
        <div>Map Scale: ${scaleInfo.mapScale}</div>
      `;
    }
  };
  
  // Update scale info on zoom and initialize
  window.map.on('zoomend', updateScaleControl);
  updateScaleControl();
  
  // Update the measurement calculation
  window.calculatePixelDistance = function(latlng1, latlng2) {
    return scaleManager.calculateDistance(latlng1, latlng2);
  };
  
  // Show success message
  showToast('Scale adjustment system initialized', 'success', 3000);
  
  // Add additional styles
  const styles = document.createElement('style');
  styles.textContent = `
    .coord-raw {
      font-size: 10px;
      color: #666;
      font-family: monospace;
    }
    
    .scale-detailed-info {
      border-top: 1px solid #ddd;
      padding-top: 5px;
      margin-top: 5px;
    }
  `;
  document.head.appendChild(styles);
}