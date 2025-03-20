/**
 * IxMaps - Full Implementation with Prime Meridian and Fixed Scaling
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
  // Map configuration with raw map dimensions
  const config = {
    mainMapPath: 'map.svg',
    climateMapPath: 'climate.svg',
    svgWidth: 1920,  // Default width, will be adjusted when SVG loads
    svgHeight: 1080, // Default height, will be adjusted when SVG loads
    initialZoom: 2,  
    minZoom: -2,
    maxZoom: 6,
    // Raw map dimensions and coordinate system parameters
    rawWidth: 8202,
    rawHeight: 4900,
    pixelsPerLongitude: 45.5666,
    pixelsPerLatitude: 27.2222,
    equatorY: 2450,
    primeMeridianX: 4101,
    sqMilesPerPixel: 10,
    sqKmPerPixel: 25.90
  };

  // Create the Leaflet map
  window.map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -0.4,
    maxZoom: config.maxZoom,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    attributionControl: false,
    center: [0, 0], // Will be adjusted after loading SVGs
    zoom: config.initialZoom
  });

  // Make map accessible globally
  window.mapConfig = config;
  
  // Add attribution control
  L.control.attribution({
    prefix: 'IxMaps v3.0'
  }).addTo(map);
  
  // Implement key coordinate functions
  window.calculatePixelDistance = calculatePixelDistance;
  
  // Calculate scale factor between raw map and display
  function calculateScaleFactor() {
    // Use the current display size vs raw map size
    const mapWidth = map.getContainer().clientWidth;
    const mapHeight = map.getContainer().clientHeight;
    
    // Calculate width and height scale factors
    const widthScale = config.svgWidth / config.rawWidth;
    const heightScale = config.svgHeight / config.rawHeight;
    
    // Use the smaller scale to maintain proportions
    return Math.min(widthScale, heightScale);
  }
  
  // Calculate pixel distance
  function calculatePixelDistance(latlng1, latlng2) {
    try {
      const point1 = map.latLngToContainerPoint(latlng1);
      const point2 = map.latLngToContainerPoint(latlng2);
      
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      
      return Math.sqrt(dx * dx + dy * dy);
    } catch (e) {
      console.error('Error calculating pixel distance:', e);
      return 0;
    }
  }
  
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
        
        // Calculate distance using fixed formula
        const pixelDist = calculatePixelDistance(
          measurePoints[lastIndex - 1],
          measurePoints[lastIndex]
        );
        
        // Convert to square miles based on fixed scale
        const zoom = map.getZoom();
        const sqMilesPerPixel = config.sqMilesPerPixel / Math.pow(2, zoom);
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
      
      // Remove instructions if present
      const instructions = document.getElementById('measure-instructions');
      if (instructions && instructions.parentNode) {
        instructions.parentNode.removeChild(instructions);
      }
      
      // Calculate total distance if we have multiple points
      if (measurePoints.length > 1) {
        let totalPixelDistance = 0;
        
        for (let i = 1; i < measurePoints.length; i++) {
          totalPixelDistance += calculatePixelDistance(
            measurePoints[i - 1],
            measurePoints[i]
          );
        }
        
        const zoom = map.getZoom();
        const sqMilesPerPixel = config.sqMilesPerPixel / Math.pow(2, zoom);
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
  
  // Improved custom scale control
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
      
      // Calculate scales based on raw map dimensions
      const zoomFactor = Math.pow(2, zoom);
      const scaleFactor = calculateScaleFactor();
      const milesPerPixel = config.sqMilesPerPixel / zoomFactor;
      const kmPerPixel = config.sqKmPerPixel / zoomFactor;
      
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
      scaleInfo.innerHTML = `
        1px = ${milesPerPixel.toFixed(2)} sq mi (${kmPerPixel.toFixed(2)} sq km)<br>
        Map Scale: 1:${Math.round(1 / scaleFactor * 1000)}
      `;
      
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
    
    // Show success message
    showToast('Map loaded successfully', 'success', 3000);
  })
  .catch(error => {
    console.error("Error loading SVG maps:", error);
    document.getElementById('loading-indicator').textContent = 
      'Error loading maps. Please try refreshing the page.';
  });
}