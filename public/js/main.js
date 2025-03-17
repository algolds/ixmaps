/**
 * IxMaps - Full Implementation with Prime Meridian
 */

document.addEventListener('DOMContentLoaded', function() {
  initToasts();
  initMap();
});

// Initialize toast notification system
function initToasts() {
  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.position = 'fixed';
  toastContainer.style.bottom = '20px';
  toastContainer.style.right = '20px';
  toastContainer.style.zIndex = '10000';
  toastContainer.style.display = 'flex';
  toastContainer.style.flexDirection = 'column';
  toastContainer.style.gap = '10px';
  toastContainer.style.maxWidth = '300px';
  document.body.appendChild(toastContainer);
  
  // Add toast styles
  const toastStyles = document.createElement('style');
  toastStyles.textContent = `
    .toast {
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      margin-top: 10px;
      opacity: 0;
      transform: translateX(50px);
      transition: opacity 0.3s, transform 0.3s;
      overflow: hidden;
    }
    
    .toast.show {
      opacity: 1;
      transform: translateX(0);
    }
    
    .toast.hide {
      opacity: 0;
      transform: translateX(50px);
    }
    
    .toast.info {
      background-color: #3498db;
    }
    
    .toast.success {
      background-color: #2ecc71;
    }
    
    .toast.warning {
      background-color: #f39c12;
    }
    
    .toast.error {
      background-color: #e74c3c;
    }
    
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background-color: rgba(255,255,255,0.4);
    }
    
    .toast-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
      gap: 8px;
    }
    
    .toast-btn {
      background-color: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }
    
    .toast-btn:hover {
      background-color: rgba(255,255,255,0.3);
    }
    
    .toast-btn-secondary {
      background-color: rgba(255,255,255,0.1);
    }
    
    .toast-btn-secondary:hover {
      background-color: rgba(255,255,255,0.2);
    }
  `;
  document.head.appendChild(toastStyles);
}

// Show a toast notification
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const toastId = 'toast-' + Date.now();
  
  toast.id = toastId;
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  toast.style.position = 'relative';
  
  container.appendChild(toast);
  
  // Add progress bar if duration > 0
  if (duration > 0) {
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.style.width = '100%';
    toast.appendChild(progress);
    
    // Animate progress bar
    progress.style.transition = `width ${duration}ms linear`;
    setTimeout(() => {
      progress.style.width = '0%';
    }, 10);
  }
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hide toast after duration (if not permanent)
  if (duration > 0) {
    setTimeout(() => {
      hideToast(toastId);
    }, duration);
  }
  
  return toastId;
}

// Hide a toast notification
function hideToast(toastId) {
  const toast = document.getElementById(toastId);
  if (!toast) return;
  
  toast.classList.add('hide');
  toast.classList.remove('show');
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Function to load SVG and get its dimensions
function loadSVGDimensions(url) {
  return new Promise((resolve, reject) => {
    // Try to load the SVG
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(svgText => {
        // Try to extract viewBox or width/height
        const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/);
        const widthMatch = svgText.match(/width="([^"]+)"/);
        const heightMatch = svgText.match(/height="([^"]+)"/);
        
        if (viewBoxMatch) {
          const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
          resolve({
            width: viewBox[2],
            height: viewBox[3]
          });
        } else if (widthMatch && heightMatch) {
          resolve({
            width: parseFloat(widthMatch[1]),
            height: parseFloat(heightMatch[1])
          });
        } else {
          // Default dimensions if we couldn't extract from SVG
          resolve({
            width: 1920,
            height: 1080
          });
        }
      })
      .catch(error => {
        console.error("Error loading SVG:", error);
        // Return default dimensions on error
        resolve({
          width: 1920,
          height: 1080
        });
      });
  });
}

function initMap() {
  // Map configuration
  const config = {
    mainMapPath: '/data/maps/ixmaps/public/map.svg',
    climateMapPath: '/data/maps/ixmaps/public/climate.svg',
    svgWidth: 1920,  // Default width, will be adjusted when SVG loads
    svgHeight: 1080, // Default height, will be adjusted when SVG loads
    initialZoom: 2,  
    minZoom: -2,
    maxZoom: 6
  };

  // Create the Leaflet map
  const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -0.4,
    maxZoom: config.maxZoom,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    attributionControl: false,
    center: [0, 0], // Will be adjusted after loading SVGs
    zoom: config.initialZoom
  });

  // Add attribution control
  L.control.attribution({
    prefix: 'IxMaps v1.0'
  }).addTo(map);
  
  // Add distance measurement tool
  const measureControl = L.control({
    position: 'topleft'
  });
  
  measureControl.onAdd = function(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control measure-control');
    const button = L.DomUtil.create('a', 'measure-button', container);
    button.href = '#';
    button.title = 'Measure distances';
    button.innerHTML = '📏';
    button.style.fontSize = '18px';
    button.style.lineHeight = '26px';
    button.style.textAlign = 'center';
    button.style.fontWeight = 'bold';
    
    let measuring = false;
    let measurePoints = [];
    let measureLayer = null;
    
    L.DomEvent.on(button, 'click', function(e) {
      L.DomEvent.stopPropagation(e);
      L.DomEvent.preventDefault(e);
      
      if (!measuring) {
        // Start measuring
        measuring = true;
        measurePoints = [];
        
        // Create a new layer for measurements
        if (measureLayer) {
          map.removeLayer(measureLayer);
        }
        measureLayer = L.layerGroup().addTo(map);
        
        button.style.backgroundColor = '#f4f4f4';
        button.style.color = '#0078A8';
        
        map.getContainer().style.cursor = 'crosshair';
        
        // Add click handler for measuring
        map.on('click', addMeasurePoint);
        
        // Show instructions
        const instructions = L.DomUtil.create('div', 'measure-instructions');
        instructions.id = 'measure-instructions';
        instructions.innerHTML = 'Click to add measurement points. Double-click to finish.';
        instructions.style.position = 'absolute';
        instructions.style.bottom = '20px';
        instructions.style.left = '50%';
        instructions.style.transform = 'translateX(-50%)';
        instructions.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        instructions.style.padding = '8px 12px';
        instructions.style.borderRadius = '4px';
        instructions.style.fontSize = '14px';
        instructions.style.zIndex = '1000';
        instructions.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
        
        document.body.appendChild(instructions);
        
        // Add double click handler to finish measuring
        map.on('dblclick', finishMeasuring);
        
      } else {
        // Stop measuring
        finishMeasuring();
      }
    });
    
    function addMeasurePoint(e) {
      if (!measuring) return;
      
      // Add point to array
      measurePoints.push(e.latlng);
      
      // Add marker for the point
      const marker = L.circleMarker(e.latlng, {
        color: '#0078A8',
        fillColor: '#0078A8',
        fillOpacity: 1,
        radius: 4
      }).addTo(measureLayer);
      
      // If we have at least 2 points, draw a line
      if (measurePoints.length > 1) {
        const lastIndex = measurePoints.length - 1;
        const line = L.polyline([
          measurePoints[lastIndex - 1],
          measurePoints[lastIndex]
        ], {
          color: '#0078A8',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 7'
        }).addTo(measureLayer);
        
        // Calculate distance
        const pixelDist = calculatePixelDistance(
          measurePoints[lastIndex - 1],
          measurePoints[lastIndex],
          map
        );
        
        // Convert to square miles
        const sqMilesPerPixel = 9 / Math.pow(2, map.getZoom());
        const squareMiles = pixelDist * sqMilesPerPixel;
        
        // Show distance label
        const midPoint = L.latLngBounds(measurePoints[lastIndex - 1], measurePoints[lastIndex]).getCenter();
        L.marker(midPoint, {
          icon: L.divIcon({
            className: 'distance-label',
            html: `${squareMiles.toFixed(1)} mi`,
            iconSize: [80, 40],
            iconAnchor: [40, 20]
          })
        }).addTo(measureLayer);
      }
    }
    
    function finishMeasuring() {
      measuring = false;
      
      // Reset styles
      button.style.backgroundColor = '';
      button.style.color = '';
      
      map.getContainer().style.cursor = '';
      
      // Remove click handlers
      map.off('click', addMeasurePoint);
      map.off('dblclick', finishMeasuring);
      
      // Calculate total distance if we have multiple points
      if (measurePoints.length > 1) {
        let totalPixelDistance = 0;
        
        for (let i = 1; i < measurePoints.length; i++) {
          totalPixelDistance += calculatePixelDistance(
            measurePoints[i - 1],
            measurePoints[i],
            map
          );
        }
        
        const sqMilesPerPixel = 9 / Math.pow(2, map.getZoom());
        const totalSquareMiles = totalPixelDistance * sqMilesPerPixel;
        
        // Show total distance as toast with actions
        const toastContent = `
          <div>
            <strong>Total:</strong> ${totalSquareMiles.toFixed(1)} mi (${totalPixelDistance.toFixed(1)} px)
            <div class="toast-actions">
              <button id="clear-measurements-btn" class="toast-btn">Clear</button>
              <button id="dismiss-toast-btn" class="toast-btn toast-btn-secondary">Dismiss</button>
            </div>
          </div>
        `;
        
        const toastId = showToast(toastContent, 'success', 0);
        
        // Add event listeners to buttons
        setTimeout(() => {
          const clearBtn = document.getElementById('clear-measurements-btn');
          const dismissBtn = document.getElementById('dismiss-toast-btn');
          
          if (clearBtn) {
            clearBtn.addEventListener('click', function() {
              if (measureLayer) {
                map.removeLayer(measureLayer);
                measureLayer = null;
              }
              hideToast(toastId);
            });
          }
          
          if (dismissBtn) {
            dismissBtn.addEventListener('click', function() {
              hideToast(toastId);
            });
          }
        }, 100);
      }
    }
    
    function calculatePixelDistance(latlng1, latlng2, map) {
      const point1 = map.latLngToContainerPoint(latlng1);
      const point2 = map.latLngToContainerPoint(latlng2);
      
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    return container;
  };
  
  measureControl.addTo(map);

  // Add zoom control
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  // Add custom scale control with label inside the box
  const customScale = L.control({
    position: 'bottomright'
  });
  
  // Replace the existing custom scale control with this improved version
customScale.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'custom-scale-control');
  div.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  div.style.padding = '5px 10px';
  div.style.border = '2px solid rgba(0, 0, 0, 0.2)';
  div.style.borderRadius = '4px';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.fontSize = '12px';
  div.style.lineHeight = '1.5';
  div.style.color = '#333';
  
  // Initial creation of scale element
  div.innerHTML = '<strong>Map Scale</strong>';
  updateScale();
  
  // Update scale when map zooms
  map.on('zoomend', updateScale);
  
  function updateScale() {
    // Remove previous scale bar if it exists
    const oldScaleBar = div.querySelector('.scale-bar-container');
    if (oldScaleBar) {
      div.removeChild(oldScaleBar);
    }
    
    const zoom = map.getZoom();
    
    // Calculate scales
    // These values should be calibrated based on your map's actual scale
    const milesPerDegree = 69.0; // Approximate miles per degree at equator
    const kmPerDegree = 111.12;  // Approximate km per degree at equator
    
    // Adjust for zoom level
    const zoomFactor = Math.pow(2, zoom - 4); // Using zoom 4 as reference
    const milesWidth = (config.svgWidth / 360) * milesPerDegree / zoomFactor;
    const kmWidth = (config.svgWidth / 360) * kmPerDegree / zoomFactor;
    
    // Create container for scale bar
    const scaleBarContainer = document.createElement('div');
    scaleBarContainer.className = 'scale-bar-container';
    scaleBarContainer.style.marginTop = '5px';
    
    // Create scale bar
    const scaleBar = document.createElement('div');
    scaleBar.style.backgroundColor = '#333';
    scaleBar.style.height = '8px';
    scaleBar.style.width = '100px';
    scaleBar.style.position = 'relative';
    
    // Add scale information
    const scaleInfo = document.createElement('div');
    scaleInfo.style.marginTop = '5px';
    scaleInfo.style.fontSize = '10px';
    scaleInfo.style.fontWeight = 'bold';
    scaleInfo.innerHTML = `${kmWidth.toFixed(0)} km (${milesWidth.toFixed(0)} mi)`;
    
    // Add tick marks
    const ticksContainer = document.createElement('div');
    ticksContainer.style.position = 'relative';
    ticksContainer.style.height = '4px';
    
    // Start tick
    const startTick = document.createElement('div');
    startTick.style.position = 'absolute';
    startTick.style.left = '0';
    startTick.style.height = '4px';
    startTick.style.width = '1px';
    startTick.style.backgroundColor = '#333';
    ticksContainer.appendChild(startTick);
    
    // Middle tick
    const middleTick = document.createElement('div');
    middleTick.style.position = 'absolute';
    middleTick.style.left = '50px';
    middleTick.style.height = '4px';
    middleTick.style.width = '1px';
    middleTick.style.backgroundColor = '#333';
    ticksContainer.appendChild(middleTick);
    
    // End tick
    const endTick = document.createElement('div');
    endTick.style.position = 'absolute';
    endTick.style.left = '100px';
    endTick.style.height = '4px';
    endTick.style.width = '1px';
    endTick.style.backgroundColor = '#333';
    ticksContainer.appendChild(endTick);
    
    // Assemble the scale
    scaleBarContainer.appendChild(ticksContainer);
    scaleBarContainer.appendChild(scaleBar);
    scaleBarContainer.appendChild(scaleInfo);
    div.appendChild(scaleBarContainer);
  }
  
  return div;
};
  
  customScale.addTo(map);

  // Layers for map and overlays
  let mainLayer, climateLayer;
  let leftMainLayer, rightMainLayer;
  let leftClimateLayer, rightClimateLayer;

  // Load the SVGs
  Promise.all([
    loadSVGDimensions(config.mainMapPath),
    loadSVGDimensions(config.climateMapPath)
  ])
  .then(([mainDimensions, climateDimensions]) => {
    // Use dimensions from main map
    config.svgWidth = mainDimensions.width;
    config.svgHeight = mainDimensions.height;
    
    // Calculate bounds
    const bounds = [
      [0, 0],
      [config.svgHeight, config.svgWidth]
    ];

    // Create main map layer
    mainLayer = L.imageOverlay(config.mainMapPath, bounds).addTo(map);
    
    // Create climate overlay layer (not added to map by default)
    climateLayer = L.imageOverlay(config.climateMapPath, bounds, {
      className: 'map-overlay'
    });

    // Add wrapped layers for continuity when panning
    // Left copies
    leftMainLayer = L.imageOverlay(config.mainMapPath, [
      [0, -config.svgWidth],
      [config.svgHeight, 0]
    ]).addTo(map);
    
    leftClimateLayer = L.imageOverlay(config.climateMapPath, [
      [0, -config.svgWidth],
      [config.svgHeight, 0]
    ], {
      className: 'map-overlay'
    });
    
    // Right copies
    rightMainLayer = L.imageOverlay(config.mainMapPath, [
      [0, config.svgWidth],
      [config.svgHeight, config.svgWidth * 2]
    ]).addTo(map);
    
    rightClimateLayer = L.imageOverlay(config.climateMapPath, [
      [0, config.svgWidth],
      [config.svgHeight, config.svgWidth * 2]
    ], {
      className: 'map-overlay'
    });

    // Center the map
    map.fitBounds(bounds);
    
    // Add layer control
    const baseLayers = {
      "Topology Map": mainLayer
    };
    
    const overlays = {
      "Climate Zones": climateLayer
    };
    
    L.control.layers(null, overlays, {
      position: 'topright'
    }).addTo(map);

    // Hide loading indicator
    document.getElementById('loading-indicator').style.display = 'none';

    // Implement wrapping behavior
    map.on('moveend', function() {
      const center = map.getCenter();
      
      // If panned beyond bounds, wrap around
      if (center.lng < 0) {
        map.panTo([center.lat, center.lng + config.svgWidth], {animate: false});
      } else if (center.lng > config.svgWidth) {
        map.panTo([center.lat, center.lng - config.svgWidth], {animate: false});
      }
    });
    // =================== ADD COORDINATE SYSTEM AFTER MAP IS READY ===================

// Define the map's visible latitude bounds
// These should be adjusted based on your actual map 
// Based on your screenshot, these look about right
const visibleBounds = {
  northLat: 70, // Northern visible limit in degrees
  southLat: -70, // Southern visible limit in degrees
};

// Define the coordinate panel controls before using them
// Add coordinate control panel - define it first
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

// Define coordinate toggle control
const CoordinateToggleControl = L.Control.extend({
  options: {
    position: 'topright'
  },
  
  onAdd: function(map) {
    // Create the control container with a particular class name
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control coordinate-toggle-control');
    
    // Create a link with an icon
    const link = L.DomUtil.create('a', 'coordinate-toggle-link', container);
    link.href = '#';
    link.title = 'Toggle Coordinate Panel';
    link.innerHTML = '🌐'; // Globe icon
    link.style.fontSize = '16px';
    link.style.lineHeight = '26px';
    link.style.textAlign = 'center';
    link.style.fontWeight = 'bold';
    
    // Store reference to self for context in callback
    const self = this;
    
    // Add click handler
    L.DomEvent
      .on(link, 'click', L.DomEvent.stopPropagation)
      .on(link, 'click', L.DomEvent.preventDefault)
      .on(link, 'click', function() {
        // Find the panel by class name when needed
        const panel = document.querySelector('.coord-system-control');
        if (panel) {
          if (panel.style.display === 'none') {
            panel.style.display = 'block';
          } else {
            panel.style.display = 'none';
          }
        }
      });
      
    // Stop propagation on mousedown to prevent dragging
    L.DomEvent.on(container, 'mousedown', L.DomEvent.stopPropagation);
    
    return container;
  }
});

// Add coordinate display control
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

// Add the controls to the map
const coordDisplay = new CoordDisplayControl();
coordDisplay.addTo(map);

const coordControlPanel = new CoordControlPanel();
map.addControl(coordControlPanel);

const coordToggleControl = new CoordinateToggleControl();
map.addControl(coordToggleControl);

// Create layer groups
const gridLayer = L.layerGroup().addTo(map);
const primeMeridianLayer = L.layerGroup();

// Define the prime meridian reference point (6.94°S, 26.09°E)
const primeMeridianRef = {
  lat: 12.94, 
  lng: 26.09
};

// Update the coordinate conversion functions to account for visible bounds
function svgToLatLng(x, y) {
  // Map the y-coordinate only to the visible latitude range
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  const lat = visibleBounds.southLat + (y / config.svgHeight * latRange);
  
  const lng = (x / config.svgWidth * 360) - 180;
  return { lat, lng };
}

// Update latitude to SVG conversion
function latLngToSvg(lat, lng) {
  // Clamp latitude to visible bounds
  const clampedLat = Math.max(visibleBounds.southLat, Math.min(visibleBounds.northLat, lat));
  
  // Convert latitude to y coordinate based on visible range
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  const y = ((clampedLat - visibleBounds.southLat) / latRange) * config.svgHeight;
  
  const x = (lng + 180) / 360 * config.svgWidth;
  return { x, y };
}

// Update the custom lat/lng conversion too
function svgToCustomLatLng(x, y) {
  // Map to visible latitude range
  const latRange = visibleBounds.northLat - visibleBounds.southLat;
  const lat = visibleBounds.southLat + (y / config.svgHeight * latRange);
  
  // Longitude relative to prime meridian
  const lngOffset = x - primeMeridianSvg.x;
  const lngScale = 360 / config.svgWidth;
  const lng = lngOffset * lngScale;
  
  return { lat, lng };
}

// Convert the prime meridian reference to SVG coordinates
const primeMeridianSvg = latLngToSvg(primeMeridianRef.lat, primeMeridianRef.lng);

// Format coordinate string
function formatCoord(value, posLabel, negLabel) {
  const absValue = Math.abs(value);
  const direction = value >= 0 ? posLabel : negLabel;
  return `${absValue.toFixed(2)}° ${direction}`;
}

// Draw prime meridian line and marker
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
    Geographic: 6.94°S, 26.09°E<br>
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

// Modify the drawGrid function to only draw within the visible bounds
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
    const pixelsPerDegree = config.svgWidth / 360;
    const offsetPixels = lng * pixelsPerDegree;
    const svgX = primeMeridianX + offsetPixels;
    
    // Only draw if within map bounds
    if (svgX <= config.svgWidth) {
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
    const pixelsPerDegree = config.svgWidth / 360;
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
      [svgY, config.svgWidth] // Right side of map
    ], {
      color: lat === 0 ? '#FF4500' : '#666',
      weight: isMajor ? 1.5 : 0.8,
      opacity: 0.6,
      dashArray: isMajor ? null : '3,5'
    }).addTo(gridLayer);
    
    // Add label if it's a major line and labels are enabled
    if (isMajor && showLabels) {
      const labelPos = L.latLng(svgY, 20);
      const label = L.marker(labelPos, {
        icon: L.divIcon({
          className: 'grid-label',
          html: `${Math.abs(lat)}° ${lat >= 0 ? 'N' : 'S'}`,
          iconSize: [40, 20],
          iconAnchor: [0, 10]
        })
      }).addTo(gridLayer);
    }
  }
}

// Add styles
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
`;
document.head.appendChild(coordStyles);

// Initial drawing
drawGrid();

// Update coordinate display on mouse move
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
    // =================== END COORDINATE SYSTEM ===================
  })
  .catch(error => {
    console.error("Error loading SVG maps:", error);
    document.getElementById('loading-indicator').textContent = 
      'Error loading maps. Please try refreshing the page.';
  });
}