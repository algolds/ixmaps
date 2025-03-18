/**
 * IxMaps Coordinate System - Direct Hemisphere Fix
 */

// Quick inversion fix for N/S hemisphere orientation
// This code should be added to the top of your coordinates.js file

// Store original functions for reference
if (window.originalSvgToLatLng === undefined && window.svgToLatLng) {
  window.originalSvgToLatLng = window.svgToLatLng;
}

if (window.originalLatLngToSvg === undefined && window.latLngToSvg) {
  window.originalLatLngToSvg = window.latLngToSvg;
}

// Direct inversion of N/S in coordinate functions
window.svgToLatLng = function(x, y) {
  if (window.originalSvgToLatLng) {
    const result = window.originalSvgToLatLng(x, y);
    // Simply invert latitude
    result.lat = -result.lat; 
    return result;
  } else {
    // Fallback if original function not available
    const lat = -1 * (visibleBounds.southLat + (y / mapConfig.svgHeight * (visibleBounds.northLat - visibleBounds.southLat)));
    const lng = (x / mapConfig.svgWidth * 360) - 180;
    return { lat, lng };
  }
};

window.latLngToSvg = function(lat, lng) {
  if (window.originalLatLngToSvg) {
    // Invert the input latitude before calling original function
    return window.originalLatLngToSvg(-lat, lng);
  } else {
    // Fallback implementation
    const invertedLat = -lat;
    const clampedLat = Math.max(visibleBounds.southLat, Math.min(visibleBounds.northLat, invertedLat));
    const y = ((clampedLat - visibleBounds.southLat) / (visibleBounds.northLat - visibleBounds.southLat)) * mapConfig.svgHeight;
    const x = (lng + 180) / 360 * mapConfig.svgWidth;
    return { x, y };
  }
};

// Also fix the custom function if it exists
if (window.originalSvgToCustomLatLng === undefined && window.svgToCustomLatLng) {
  window.originalSvgToCustomLatLng = window.svgToCustomLatLng;
}

window.svgToCustomLatLng = function(x, y) {
  if (window.originalSvgToCustomLatLng) {
    const result = window.originalSvgToCustomLatLng(x, y);
    // Simply invert latitude
    result.lat = -result.lat;
    return result;
  } else {
    // Fallback implementation
    const lat = -1 * (visibleBounds.southLat + (y / mapConfig.svgHeight * (visibleBounds.northLat - visibleBounds.southLat)));
    const lngOffset = x - primeMeridianSvg.x;
    const lngScale = 360 / mapConfig.svgWidth;
    const lng = lngOffset * lngScale;
    return { lat, lng };
  }
};

// Fix the grid drawing to properly display labels
const originalDrawGrid = window.drawGrid;
if (originalDrawGrid) {
  window.drawGrid = function() {
    originalDrawGrid();
    
    // Find and fix all grid labels
    const gridLabels = document.querySelectorAll('.grid-label');
    gridLabels.forEach(label => {
      const text = label.innerHTML;
      if (text.includes('° N') || text.includes('° S')) {
        // Switch N/S
        if (text.includes('° N')) {
          label.innerHTML = text.replace('° N', '° S');
        } else {
          label.innerHTML = text.replace('° S', '° N');
        }
      }
    });
  };
}

console.log('Direct N/S hemisphere inversion applied to coordinate system');
// Raw map dimensions from our requirements
const RAW_MAP_WIDTH = 8202;
const RAW_MAP_HEIGHT = 4900;
const EQUATOR_Y_POSITION = 2450;
const PRIME_MERIDIAN_X_POSITION = 4101;
const PIXELS_PER_LONGITUDE_DEGREE = 45.5666;
const PIXELS_PER_LATITUDE_DEGREE = 27.2222;

// Define the map's visible latitude bounds (from original code)
const visibleBounds = {
  northLat: 70, // Northern visible limit in degrees
  southLat: -70, // Southern visible limit in degrees
};

// Define the prime meridian reference point (updated based on images)
const primeMeridianRef = {
  lat: 14.08, // S (note the negative value to fix N/S flipping)
  lng: 26.22   // E in standard coordinate system
};

// Create layer groups for the coordinate system
const gridLayer = L.layerGroup();
const primeMeridianLayer = L.layerGroup();

let primeMeridianSvg = null;

// Add coordinate display control - with fixed position
const CoordDisplayControl = L.Control.extend({
  options: {
    position: 'bottomleft'
  },
  
  onAdd: function() {
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

// Add coordinate control panel - exactly as in original
const CoordControlPanel = L.Control.extend({
  options: {
    position: 'topright'
  },
  
  onAdd: function() {
    const container = L.DomUtil.create('div', 'leaflet-control coord-system-control');
    container.style.backgroundColor = 'white';
    container.style.padding = '6px 10px';
    container.style.borderRadius = '4px';
    container.style.border = '2px solid rgba(0, 0, 0, 0.2)';
    container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    container.style.cursor = 'auto';
    container.style.fontSize = '12px';
    container.style.marginBottom = '5px';
    
    // Prevent events from propagating to the map
    L.DomEvent.disableClickPropagation(container);
    
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

// Define coordinate toggle control - exactly as in original
const CoordinateToggleControl = L.Control.extend({
  options: {
    position: 'topright'
  },
  
  onAdd: function(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control coordinate-toggle-control');
    
    const link = L.DomUtil.create('a', 'coordinate-toggle-link', container);
    link.href = '#';
    link.title = 'Toggle Coordinate Panel';
    link.innerHTML = '🌐'; // Globe icon
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
          if (panel.style.display === 'none') {
            panel.style.display = 'block';
          } else {
            panel.style.display = 'none';
          }
        }
      });
      
    L.DomEvent.on(container, 'mousedown', L.DomEvent.stopPropagation);
    
    return container;
  }
});

// FIXED: Coordinate conversion functions with corrected N/S orientation
function svgToLatLng(x, y) {
  // Map the y-coordinate only to the visible latitude range
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  // FIX: Invert the latitude calculation to correct N/S orientation
  const lat = -1 * (visibleBounds.southLat + (y / mapConfig.svgHeight * latRange));
  
  const lng = (x / mapConfig.svgWidth * 360) - 180;
  return { lat, lng };
}

function latLngToSvg(lat, lng) {
  // FIX: Invert latitude before clamping to fix N/S orientation
  const invertedLat = -lat;
  
  // Clamp latitude to visible bounds
  const clampedLat = Math.max(visibleBounds.southLat, Math.min(visibleBounds.northLat, invertedLat));
  
  // Convert latitude to y coordinate based on visible range
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  const y = ((clampedLat - visibleBounds.southLat) / latRange) * mapConfig.svgHeight;
  
  const x = (lng + 180) / 360 * mapConfig.svgWidth;
  return { x, y };
}

function svgToCustomLatLng(x, y) {
  // Map to visible latitude range with fixed N/S orientation
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  const lat = -1 * (visibleBounds.southLat + (y / mapConfig.svgHeight * latRange));
  
  // Longitude relative to prime meridian
  const lngOffset = x - primeMeridianSvg.x;
  const lngScale = 360 / mapConfig.svgWidth;
  const lng = lngOffset * lngScale;
  
  return { lat, lng };
}

// Format coordinate string - exactly as in original
function formatCoord(value, posLabel, negLabel) {
  const absValue = Math.abs(value);
  const direction = value >= 0 ? posLabel : negLabel;
  return `${absValue.toFixed(2)}° ${direction}`;
}

// Draw coordinate marker when clicking on the map (new feature)
function addCoordinateMarker(e) {
  // Remove existing click marker if it exists
  if (window.clickMarker) {
    map.removeLayer(window.clickMarker);
  }
  
  // Get coordinates using the fixed conversion functions
  const standardCoord = svgToLatLng(e.latlng.lng, e.latlng.lat);
  const customCoord = svgToCustomLatLng(e.latlng.lng, e.latlng.lat);
  
  // Create marker with popup
  window.clickMarker = L.circleMarker(e.latlng, {
    radius: 5,
    color: '#FF4500',
    fillColor: '#FFA07A',
    fillOpacity: 1,
    weight: 2
  }).addTo(map);
  
  // Add popup with coordinates
  const coordText = `
    <div style="text-align:center;">
      <strong>Coordinates:</strong><br>
      Lat: ${formatCoord(standardCoord.lat, 'N', 'S')}<br>
      Lng: ${formatCoord(customCoord.lng, 'E', 'W')}<br>
      (Standard: ${formatCoord(standardCoord.lng, 'E', 'W')})
    </div>
  `;
  
  window.clickMarker.bindPopup(coordText).openPopup();
  
  // Also show the coordinates in a toast
  showToast(`Clicked at Lat: ${formatCoord(standardCoord.lat, 'N', 'S')}, Lng: ${formatCoord(customCoord.lng, 'E', 'W')}`, 'info', 3000);
}

// Draw prime meridian line and marker - updated to use the new reference point
function drawPrimeMeridian() {
  // Clear existing elements
  primeMeridianLayer.clearLayers();
  
  // Get visible bounds in SVG coordinates
  const southPoint = latLngToSvg(visibleBounds.southLat, 0);
  const northPoint = latLngToSvg(visibleBounds.northLat, 0);
  
  // Draw the vertical line for prime meridian
  const line = L.polyline([
    [southPoint.y, primeMeridianSvg.x], // Bottom of visible map
    [northPoint.y, primeMeridianSvg.x]  // Top of visible map
  ], {
    color: '#FF8000', // Orange color
    weight: 2.5,
    opacity: 0.8,
    dashArray: '8,6'
  }).addTo(primeMeridianLayer);
  
  // Create marker at the reference point
  const marker = L.circleMarker(L.latLng(primeMeridianSvg.y, primeMeridianSvg.x), {
    radius: 8,
    color: '#FF8000',
    fillColor: '#FFFF00',
    fillOpacity: 0.7,
    weight: 2
  }).addTo(primeMeridianLayer);
  
  // Add popup to the marker
  marker.bindPopup(`
    <strong>Prime Meridian Reference</strong><br>
    Geographic: ${formatCoord(Math.abs(primeMeridianRef.lat), 'N', 'S')}, ${formatCoord(primeMeridianRef.lng, 'E', 'W')}<br>
    Map Reference: 0° Longitude
  `);
  
  // Add label for the prime meridian
  const label = L.marker(L.latLng(southPoint.y - 20, primeMeridianSvg.x), {
    icon: L.divIcon({
      className: 'prime-meridian-label',
      html: 'Prime Meridian (0°)',
      iconSize: [120, 30],
      iconAnchor: [60, 15]
    })
  }).addTo(primeMeridianLayer);
}

// Draw coordinate grid - with fixed orientation
function drawGrid() {
  // Clear existing grid
  gridLayer.clearLayers();
  
  const zoom = map.getZoom();
  
  // Adjust grid spacing based on zoom
  let spacing = 30; // Default 30 degree spacing
  if (zoom > 3) spacing = 15; // At higher zoom, use 15 degrees
  if (zoom > 4) spacing = 10; // Even higher zoom, use 10 degrees
  if (zoom > 5) spacing = 5;  // At highest zoom, use 5 degrees
  
  // Show or hide labels based on checkbox
  const showLabels = document.getElementById('toggle-coords-labels').checked;
  
  // Prime meridian is our 0° longitude reference
  const primeMeridianX = primeMeridianSvg.x;
  
  // Get visible bounds in SVG coordinates
  const southPoint = latLngToSvg(visibleBounds.southLat, 0);
  const northPoint = latLngToSvg(visibleBounds.northLat, 0);
  
  // Draw longitude lines
  // First, draw the prime meridian as 0°
  const primeMeridianLine = L.polyline([
    [southPoint.y, primeMeridianX], // Bottom of visible map
    [northPoint.y, primeMeridianX]  // Top of visible map
  ], {
    color: '#FF8000', // Orange for prime meridian
    weight: 2,
    opacity: 0.8,
    dashArray: '8,6'
  }).addTo(gridLayer);
  
  // Prime meridian label
  if (showLabels) {
    const primeMeridianLabelPos = L.latLng(southPoint.y + 20, primeMeridianX);
    const primeMeridianLabel = L.marker(primeMeridianLabelPos, {
      icon: L.divIcon({
        className: 'grid-label prime-meridian-label',
        html: '0°',
        iconSize: [40, 20],
        iconAnchor: [20, 0]
      })
    }).addTo(gridLayer);
  }
  
  // Draw lines east of prime meridian
  for (let i = 1; i * spacing <= 360; i++) {
    const lng = i * spacing;
    const isMajor = lng % 30 === 0;
    
    // Calculate pixels from prime meridian
    const pixelsPerDegree = mapConfig.svgWidth / 360;
    const offsetPixels = lng * pixelsPerDegree;
    const svgX = primeMeridianX + offsetPixels;
    
    // Only draw if within map bounds
    if (svgX <= mapConfig.svgWidth) {
      // Draw the line from visible south to visible north
      const line = L.polyline([
        [southPoint.y, svgX], // Bottom of visible map
        [northPoint.y, svgX]  // Top of visible map
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).addTo(gridLayer);
      
      // Add label if it's a major line and labels are enabled
      if (isMajor && showLabels) {
        const labelPos = L.latLng(southPoint.y + 20, svgX);
        const label = L.marker(labelPos, {
          icon: L.divIcon({
            className: 'grid-label',
            html: `${lng}° E`,
            iconSize: [40, 20],
            iconAnchor: [20, 0]
          })
        }).addTo(gridLayer);
      }
    }
  }
  
  // Draw lines west of prime meridian
  for (let i = 1; i * spacing <= 360; i++) {
    const lng = i * spacing;
    const isMajor = lng % 30 === 0;
    
    // Calculate pixels from prime meridian
    const pixelsPerDegree = mapConfig.svgWidth / 360;
    const offsetPixels = lng * pixelsPerDegree;
    const svgX = primeMeridianX - offsetPixels;
    
    // Only draw if within map bounds
    if (svgX >= 0) {
      // Draw the line from visible south to visible north
      const line = L.polyline([
        [southPoint.y, svgX], // Bottom of visible map
        [northPoint.y, svgX]  // Top of visible map
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).addTo(gridLayer);
      
      // Add label if it's a major line and labels are enabled
      if (isMajor && showLabels) {
        const labelPos = L.latLng(southPoint.y + 20, svgX);
        const label = L.marker(labelPos, {
          icon: L.divIcon({
            className: 'grid-label',
            html: `${lng}° W`,
            iconSize: [40, 20],
            iconAnchor: [20, 0]
          })
        }).addTo(gridLayer);
      }
    }
  }
  
  // Draw latitude lines - only within visible bounds
  // Start from the southernmost visible latitude and increase by spacing
  for (let lat = Math.ceil(visibleBounds.southLat / spacing) * spacing; 
       lat <= visibleBounds.northLat; 
       lat += spacing) {
    
    const isMajor = lat % 30 === 0;
    
    // Get SVG coordinates for this latitude
    const svgY = latLngToSvg(lat, 0).y;
    
    // Draw the line
    const line = L.polyline([
      [svgY, 0], // Left side of map
      [svgY, mapConfig.svgWidth] // Right side of map
    ], {
      color: lat === 0 ? '#FF4500' : '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? null : '3,5'
    }).addTo(gridLayer);
    
    // Add label if it's a major line and labels are enabled
    if (isMajor && showLabels) {
      const labelPos = L.latLng(svgY, 20);
      
      // FIX: Correct the display of N/S labels
      const displayLat = -lat; // Invert for display
      
      const label = L.marker(labelPos, {
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

// Add styles for coordinate elements
const coordStyles = document.createElement('style');
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
  }
  
  .ixmap-coordinates-display {
    min-width: 200px;
  }
`;
document.head.appendChild(coordStyles);

// Initialize the coordinate system with fixes
function initCoordinateSystem() {
  console.log('Initializing coordinate system with fixes...');
  
  // Add the controls to the map
  const coordDisplay = new CoordDisplayControl();
  coordDisplay.addTo(map);
  
  const coordControlPanel = new CoordControlPanel();
  map.addControl(coordControlPanel);
  
  const coordToggleControl = new CoordinateToggleControl();
  map.addControl(coordToggleControl);
  
  // Add layers to map
  gridLayer.addTo(map);
  
  // Calculate the prime meridian position using fixed functions
  primeMeridianSvg = latLngToSvg(primeMeridianRef.lat, primeMeridianRef.lng);
  
  // Draw initial grid
  drawGrid();
  
  // Remove any duplicate coordinate displays that might be at the bottom
  const coordDisplays = document.querySelectorAll('.ixmap-coordinates-display');
  if (coordDisplays.length > 1) {
    // Keep only the first one if there are multiple
    for (let i = 1; i < coordDisplays.length; i++) {
      if (coordDisplays[i] && coordDisplays[i].parentNode) {
        coordDisplays[i].parentNode.removeChild(coordDisplays[i]);
      }
    }
  }
  
  // Set up event handlers
  
  // Update coordinate display on mouse move with fixed orientation
  map.on('mousemove', function(e) {
    const standardCoord = svgToLatLng(e.latlng.lng, e.latlng.lat);
    const customCoord = svgToCustomLatLng(e.latlng.lng, e.latlng.lat);
    
    const coordDisplay = document.querySelector('.ixmap-coordinates-display');
    if (coordDisplay) {
      coordDisplay.innerHTML = `
        <div>Lat: ${formatCoord(standardCoord.lat, 'N', 'S')}</div>
        <div>Lng: ${formatCoord(customCoord.lng, 'E', 'W')} (${formatCoord(standardCoord.lng, 'E', 'W')})</div>
      `;
    }
  });
  
  // Add click handler for coordinate markers
  map.on('click', addCoordinateMarker);
  
  // Update on zoom or pan
  map.on('zoomend moveend', function() {
    drawGrid();
    drawPrimeMeridian();
  });
  
  // Toggle coordinate display
  document.getElementById('toggle-coords-display').addEventListener('change', function() {
    const display = document.querySelector('.ixmap-coordinates-display');
    if (display) {
      display.style.display = this.checked ? 'block' : 'none';
    }
  });
  
  // Toggle grid
  document.getElementById('toggle-coords-grid').addEventListener('change', function() {
    if (this.checked) {
      map.addLayer(gridLayer);
      drawGrid();
    } else {
      map.removeLayer(gridLayer);
    }
  });
  
  // Toggle labels
  document.getElementById('toggle-coords-labels').addEventListener('change', function() {
    // Redraw grid with or without labels
    drawGrid();
  });
  
  // Toggle prime meridian
  document.getElementById('toggle-prime-meridian').addEventListener('change', function() {
    if (this.checked) {
      map.addLayer(primeMeridianLayer);
      drawPrimeMeridian();
    } else {
      map.removeLayer(primeMeridianLayer);
    }
  });
  
  console.log('Coordinate system initialized with fixes');
  showToast('Coordinate system initialized with N/S orientation fixed', 'success', 3000);
}

// Initialize when the page is loaded
setTimeout(function() {
  if (window.map && window.mapConfig) {
    initCoordinateSystem();
  } else {
    console.error('Map not available for coordinate system initialization');
    // Try again a bit later
    setTimeout(function() {
      if (window.map && window.mapConfig) {
        initCoordinateSystem();
      } else {
        console.error('Map still not available, coordinate system initialization failed');
      }
    }, 3000);
  }
}, 2000);

// Make function available globally
window.initializeCoordinateSystem = initCoordinateSystem;