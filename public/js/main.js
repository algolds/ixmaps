/**
 * IxMaps DEVELOPMENT - v3.5
 * Master SVG Layer Implementation
 * @namespace IxMaps
 */

// Constants for scale calculations 
const MILES_PER_PIXEL = 3.2; // Base scale: 1px = 3.2 mi (linear distance)
const KM_PER_PIXEL = 5.15; // Conversion factor from miles to kilometers

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the IxMaps namespace
  window.IxMaps = window.IxMaps || {};
  window.IxMaps.Main = {};
  
  // Create loading indicator and start initialization immediately
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.innerHTML = 'Loading map...';
  }
  
  // Initialize toasts and map immediately without delays
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

/**
 * Shows a toast notification
 * @param {String} message - The message to display
 * @param {String} type - The type of toast (info, success, warning, error)
 * @param {Number} duration - Duration in milliseconds, 0 for permanent
 * @returns {String} The ID of the created toast
 */
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
    progress.style.width = '0%';
  }
  
  // Show toast immediately
  toast.classList.add('show');
  
  // Hide toast after duration (if not permanent)
  if (duration > 0) {
    setTimeout(() => {
      hideToast(toastId);
    }, duration);
  }
  
  return toastId;
}

/**
 * Hides a toast notification
 * @param {String} toastId - The ID of the toast to hide
 */
function hideToast(toastId) {
  const toast = document.getElementById(toastId);
  if (!toast) return;
  
  toast.classList.add('hide');
  toast.classList.remove('show');
  
  // Remove toast from DOM after animation completes
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// SVG cache for performance optimization
const svgCache = {};

// SVG cache & lazy loading for better performance
const svgQueue = [];
let isLoadingSvg = false;

/**
 * Loads an SVG and returns its dimensions with prioritized loading
 * @param {String} url - The URL of the SVG to load
 * @returns {Promise} Promise resolving to an object with width and height
 */
function loadSVGDimensions(url) {
  // Return from cache immediately if available
  if (svgCache[url]) {
    return Promise.resolve(svgCache[url]);
  }
  
  // Create new promise for loading
  return new Promise((resolve, reject) => {
    // Function to process SVG fetch
    const processSvg = () => {
      isLoadingSvg = true;
      
      // Try to load the SVG
      fetch(url, { 
        cache: 'force-cache',
        priority: 'high' // High priority for main resources
      })
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
        
        let dimensions;
        
        if (viewBoxMatch) {
          const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
          dimensions = {
            width: viewBox[2],
            height: viewBox[3]
          };
        } else if (widthMatch && heightMatch) {
          dimensions = {
            width: parseFloat(widthMatch[1]),
            height: parseFloat(heightMatch[1])
          };
        } else {
          // Default dimensions if we couldn't extract from SVG
          dimensions = {
            width: 8200, // Match SVG dimensions
            height: 4900
          };
        }
        
        // Cache the result
        svgCache[url] = dimensions;
        resolve(dimensions);
        
        // Process next in queue
        isLoadingSvg = false;
        if (svgQueue.length > 0) {
          const next = svgQueue.shift();
          next.processFn().then(next.resolve).catch(next.reject);
        }
      })
      .catch(error => {
        console.error("Error loading SVG:", error);
        // Return default dimensions on error
        const dimensions = {
          width: 8200,
          height: 4900
        };
        svgCache[url] = dimensions;
        resolve(dimensions);
        
        // Process next in queue
        isLoadingSvg = false;
        if (svgQueue.length > 0) {
          const next = svgQueue.shift();
          next.processFn().then(next.resolve).catch(next.reject);
        }
      });
    };
    
    // If already loading an SVG, queue this one
    if (isLoadingSvg) {
      svgQueue.push({
        processFn: () => processSvg(),
        resolve: resolve,
        reject: reject
      });
    } else {
      processSvg();
    }
  });
}

/**
 * Calculates scale factor between raw map and display
 * @returns {Number} The calculated scale factor
 */
function calculateScaleFactor() {
  // Use the current display size vs raw map size
  const mapWidth = map.getContainer().clientWidth;
  const mapHeight = map.getContainer().clientHeight;
  
  // Calculate width and height scale factors
  const widthScale = mapConfig.svgWidth / mapConfig.rawWidth;
  const heightScale = mapConfig.svgHeight / mapConfig.rawHeight;
  
  // Use the smaller scale to maintain proportions
  return Math.min(widthScale, heightScale);
}

/**
 * Calculates distance measurements based on pixel distance (LINEAR distance)
 * @param {L.LatLng} latlng1 - First point
 * @param {L.LatLng} latlng2 - Second point
 * @returns {Object} Object with distances in miles and kilometers
 */
function calculateDistance(latlng1, latlng2) {
  try {
    const point1 = map.latLngToContainerPoint(latlng1);
    const point2 = map.latLngToContainerPoint(latlng2);
    
    if (!point1 || !point2) return { miles: 0, km: 0 };
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    // Calculate pixel distance
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Get current center latitude to adjust for projection distortion
    const centerLat = map.getCenter().lat;
    const latFactor = Math.cos(Math.abs(centerLat) * Math.PI / 180);
    
    // Convert to linear miles using the distance formula with latitude correction
    // Adjusted for zoom level
    const zoom = map.getZoom();
    const milesPerPixel = MILES_PER_PIXEL / Math.pow(2, zoom) / Math.max(0.5, latFactor);
    const miles = pixelDistance * milesPerPixel;
    
    // Convert miles to kilometers (linear conversion)
    const km = miles * (KM_PER_PIXEL / MILES_PER_PIXEL);
    
    return {
      miles: miles,
      km: km
    };
  } catch (e) {
    console.error('Error calculating distance:', e);
    return { miles: 0, km: 0 };
  }
}

/**
 * Legacy function for backward compatibility
 * @param {L.LatLng} latlng1 - First point
 * @param {L.LatLng} latlng2 - Second point
 * @returns {Number} Distance in pixels
 */
function calculatePixelDistance(latlng1, latlng2) {
  try {
    const point1 = map.latLngToContainerPoint(latlng1);
    const point2 = map.latLngToContainerPoint(latlng2);
    
    if (!point1 || !point2) return 0;
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  } catch (e) {
    console.error('Error calculating pixel distance:', e);
    return 0;
  }
}

function initMap() {
  // Map configuration with raw map dimensions
  const config = {
    masterMapPath: 'master-map.svg', // Single master SVG map with all layers
    svgWidth: 8200,  // Updated to match SVG dimensions
    svgHeight: 4900, // Updated to match SVG dimensions
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
    milesPerPixel: MILES_PER_PIXEL, // Using linear distance scale
    kmPerPixel: KM_PER_PIXEL, // Converted value
    labelFontSize: 12, // Default font size for country labels
    labelClassName: 'country-label' // CSS class for country labels
  };

  // Create the Leaflet map with optimized options - removed throttling
  window.map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    attributionControl: false,
    // Center at prime meridian immediately instead of [0,0]
    center: [config.svgHeight / 2, config.primeMeridianX],
    zoom: config.initialZoom,
    wheelPxPerZoomLevel: 120, // Make zoom less sensitive
    fadeAnimation: true, 
    zoomAnimation: true, 
    markerZoomAnimation: true,
    preferCanvas: true 
  });

  // Make map accessible globally
  window.mapConfig = config;
  
  // Add attribution control
  L.control.attribution({
    prefix: 'IxMaps™ v3.5 Beta'
  }).addTo(map);
  
  // Implement key coordinate functions
  window.calculatePixelDistance = calculatePixelDistance;
  window.calculateDistance = calculateDistance;
  
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
    let measureClickHandler = null;
    
    // Create a single instructions element and reuse it
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
    instructions.style.display = 'none';
    document.body.appendChild(instructions);
    
    /**
     * Adds a measurement point to the map
     * @param {L.MouseEvent} e - The click event
     */
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
        
        // Calculate distance using the linear distance formula
        const distance = calculateDistance(
          measurePoints[lastIndex - 1],
          measurePoints[lastIndex]
        );
        
        // Show distance label with miles and km
        const midPoint = L.latLngBounds(measurePoints[lastIndex - 1], measurePoints[lastIndex]).getCenter();
        L.marker(midPoint, {
          icon: L.divIcon({
            className: 'distance-label',
            html: `${distance.miles.toFixed(1)} mi<br>${distance.km.toFixed(1)} km`,
            iconSize: [100, 40],
            iconAnchor: [50, 20]
          })
        }).addTo(measureLayer);
      }
    }
    
    /**
     * Finishes the measurement process
     */
    function finishMeasuring() {
      if (!measuring) return;
      
      measuring = false;
      
      // Reset styles
      button.style.backgroundColor = '';
      button.style.color = '';
      
      map.getContainer().style.cursor = '';
      
      // Remove click handlers
      if (measureClickHandler) {
        map.off('click', measureClickHandler);
        map.off('dblclick', finishMeasuring);
      }
      
      // Hide instructions
      instructions.style.display = 'none';
      
      // Calculate total distance if we have multiple points
      if (measurePoints.length > 1) {
        let totalDistance = { miles: 0, km: 0 };
        
        for (let i = 1; i < measurePoints.length; i++) {
          const segmentDistance = calculateDistance(
            measurePoints[i - 1],
            measurePoints[i]
          );
          
          totalDistance.miles += segmentDistance.miles;
          totalDistance.km += segmentDistance.km;
        }
        
        // Show total distance as toast with actions
        const toastContent = `
          <div>
            <strong>Total:</strong> ${totalDistance.miles.toFixed(1)} mi (${totalDistance.km.toFixed(1)} km)
            <div class="toast-actions">
              <button id="clear-measurements-btn" class="toast-btn">Clear</button>
              <button id="dismiss-toast-btn" class="toast-btn toast-btn-secondary">Dismiss</button>
            </div>
          </div>
        `;
        
        const toastId = showToast(toastContent, 'success', 0);
        
        // Add event listeners to buttons
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
      }
    }
    
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
        measureClickHandler = addMeasurePoint;
        map.on('click', measureClickHandler);
        
        // Show instructions
        instructions.style.display = 'block';
        
        // Add double click handler to finish measuring
        map.on('dblclick', finishMeasuring);
        
      } else {
        // Stop measuring
        finishMeasuring();
      }
    });
    
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
    
    // Create elements once and reuse them
    const scaleBarContainer = document.createElement('div');
    scaleBarContainer.className = 'scale-bar-container';
    scaleBarContainer.style.marginTop = '5px';
    
    const scaleBar = document.createElement('div');
    scaleBar.style.backgroundColor = '#333';
    scaleBar.style.height = '8px';
    scaleBar.style.width = '100px';
    scaleBar.style.position = 'relative';
    
    const ticksContainer = document.createElement('div');
    ticksContainer.style.position = 'relative';
    ticksContainer.style.height = '4px';
    
    // Create ticks
    const startTick = document.createElement('div');
    startTick.style.position = 'absolute';
    startTick.style.left = '0';
    startTick.style.height = '4px';
    startTick.style.width = '1px';
    startTick.style.backgroundColor = '#333';
    
    const middleTick = document.createElement('div');
    middleTick.style.position = 'absolute';
    middleTick.style.left = '50px';
    middleTick.style.height = '4px';
    middleTick.style.width = '1px';
    middleTick.style.backgroundColor = '#333';
    
    const endTick = document.createElement('div');
    endTick.style.position = 'absolute';
    endTick.style.left = '100px';
    endTick.style.height = '4px';
    endTick.style.width = '1px';
    endTick.style.backgroundColor = '#333';
    
    const scaleInfo = document.createElement('div');
    scaleInfo.style.marginTop = '5px';
    scaleInfo.style.fontSize = '10px';
    scaleInfo.style.fontWeight = 'bold';
    
    // Add ticks to container
    ticksContainer.appendChild(startTick);
    ticksContainer.appendChild(middleTick);
    ticksContainer.appendChild(endTick);
    
    // Assemble the scale
    scaleBarContainer.appendChild(ticksContainer);
    scaleBarContainer.appendChild(scaleBar);
    scaleBarContainer.appendChild(scaleInfo);
    div.appendChild(scaleBarContainer);
    
    // Define nice scale values in miles (common map scales)
    const scaleValues = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000];
    // Define matching standard scale ratios
    const scaleRatios = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000];
  
    // Function to update the scale display
    function updateScale() {
      // Get current zoom level
      const zoom = map.getZoom();
      
      // Get map width in pixels
      const mapWidthPixels = map.getSize().x;
      
      // Calculate miles per pixel at current zoom
      const zoomFactor = Math.pow(2, zoom);
      const milesPerPixel = MILES_PER_PIXEL / zoomFactor;
      
      // Find appropriate scale value
      let selectedValue = scaleValues[0];
      let selectedRatio = scaleRatios[0];
      let selectedPixelWidth = selectedValue / milesPerPixel;
      
      // Find a scale value that gives a nice bar width (between 50-300 pixels)
      for (let i = 0; i < scaleValues.length; i++) {
        const pixelWidth = scaleValues[i] / milesPerPixel;
        
        if (pixelWidth < 50 && i < scaleValues.length - 1) {
          continue; // Too small, try next larger value
        }
        
        if (pixelWidth > 300 && i > 0) {
          // Use previous value as this one is too large
          selectedValue = scaleValues[i-1];
          selectedRatio = scaleRatios[i-1];
          selectedPixelWidth = selectedValue / milesPerPixel;
          break;
        }
        
        // This value is good
        selectedValue = scaleValues[i];
        selectedRatio = scaleRatios[i];
        selectedPixelWidth = pixelWidth;
        
        if (pixelWidth >= 80 && pixelWidth <= 200) {
          break; // This is an ideal size, stop here
        }
      }
      
      // Calculate km equivalent
      const selectedKm = selectedValue * (KM_PER_PIXEL / MILES_PER_PIXEL);
      
      // Update scale bar width
      scaleBar.style.width = `${Math.round(selectedPixelWidth)}px`;
      
      // Update tick positions
      middleTick.style.left = `${Math.round(selectedPixelWidth / 2)}px`;
      endTick.style.left = `${Math.round(selectedPixelWidth)}px`;
      
      // Format the display value
      // Format numbers: show decimals only for small values
      let milesDisplay, kmDisplay;
      
      if (selectedValue < 10) {
        milesDisplay = selectedValue.toFixed(2);
        kmDisplay = selectedKm.toFixed(2);
      } else {
        milesDisplay = selectedValue.toFixed(0);
        kmDisplay = selectedKm.toFixed(0);
      }
      
      // Update scale display with the selected values and map scale ratio
      scaleInfo.innerHTML = `
        ${milesDisplay} mi (${kmDisplay} km)<br>
        Map Scale: 1:${selectedRatio}
      `;
    }
    
    // Update scale on zoom changes
    map.on('zoomend', updateScale);
    map.on('resize', updateScale);
    
    // Initial update
    updateScale();
    
    return div;
  };
  
  customScale.addTo(map);

  // Layers for map and SVG overlays
  let masterLayer, leftMasterLayer, rightMasterLayer;
  
  // Map layer visibility settings
  const layerVisibility = {
    political: true,
    climate: false,
    lakes: true,
    rivers: true,
    'altitude-1': false,
    'altitude-2': false,
    'altitude-3': false,
    'altitude-4': false,
    'altitude-5': false,
    'altitude-6': false,
    'altitude-7': false,
    'altitude-8': false,
    coastlines: true,
    icecaps: true,
    labels: true
  };
  
  // Will hold the country label layer group
  let countryLabelsLayer = null;

  // Load the master SVG
  loadSVGDimensions(config.masterMapPath)
    .then((dimensions) => {
      // Use dimensions from master map
      config.svgWidth = dimensions.width;
      config.svgHeight = dimensions.height;
      
      console.log(`Loaded SVG with dimensions: ${config.svgWidth} x ${config.svgHeight}`);
      
      // Calculate bounds - but don't fitBounds to keep our initial center
      const bounds = [
        [0, 0],
        [config.svgHeight, config.svgWidth]
      ];

      // Create master map layer
      masterLayer = L.imageOverlay(config.masterMapPath, bounds, {
        // Add caching options for better performance
        keepBuffer: 4, // Larger tile buffer to prevent flashing
        opacity: 1,
        interactive: false // Not interactive for better performance
      }).addTo(map);
      
      // Debug info about the SVG layers
      fetch(config.masterMapPath)
        .then(response => response.text())
        .then(svgText => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
          
          // Get all Inkscape layers
          const layers = svgDoc.querySelectorAll('[inkscape\\:groupmode="layer"]');
          console.log(`Found ${layers.length} Inkscape layers:`);
          
          layers.forEach(layer => {
            const id = layer.getAttribute('id');
            const label = layer.getAttribute('inkscape:label');
            console.log(`- Layer: id="${id}", inkscape:label="${label}"`);
          });
        })
        .catch(error => {
          console.error('Error analyzing SVG layers:', error);
        });
      
      // Add wrapped layers for continuity when panning
      // Left copies
      leftMasterLayer = L.imageOverlay(config.masterMapPath, [
        [0, -config.svgWidth],
        [config.svgHeight, 0]
      ], {
        interactive: false
      }).addTo(map);
      
      // Right copies
      rightMasterLayer = L.imageOverlay(config.masterMapPath, [
        [0, config.svgWidth],
        [config.svgHeight, config.svgWidth * 2]
      ], {
        interactive: false
      }).addTo(map);

      // Center the map
      map.fitBounds(bounds);
      
      // Create layer control with SVG layer management
      createLayerControl();
      
      // Load country labels if enabled by default
      if (layerVisibility.labels) {
        setTimeout(() => {
          showCountryLabels();
        }, 1000); // Slight delay to ensure map is fully loaded
      }

      // Hide loading indicator
      document.getElementById('loading-indicator').style.display = 'none';

      // Implement wrapping behavior without throttling
      map.on('moveend', function() {
        const center = map.getCenter();
        
        // If panned beyond bounds, wrap around immediately
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
      console.error("Error loading SVG map:", error);
      document.getElementById('loading-indicator').textContent = 
        'Error loading maps. Please try refreshing the page.';
      
      // Show error toast
      showToast('Failed to load map resources. Please try refreshing the page.', 'error', 0);
    });

  /**
   * Creates and adds layer control panel for the master SVG layers
   */
  function createLayerControl() {
    // Create the control panel container
    const controlPanel = L.control({
      position: 'topright'
    });
    
    controlPanel.onAdd = function(map) {
      const container = L.DomUtil.create('div', 'control-panel');
      container.id = 'layer-control-panel';
      
      // Create main control panel content
      const panelContent = document.createElement('div');
      panelContent.className = 'control-panel-content';
      
      // Create layer toggles
      panelContent.innerHTML = `
        <h3>Map Layers <span id="close-panel" style="cursor:pointer;">×</span></h3>
        
        <div class="layer-group">
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-political" ${layerVisibility.political ? 'checked' : ''}>
              Political Borders
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-climate" ${layerVisibility.climate ? 'checked' : ''}>
              Climate Zones
            </label>
          </div>
        </div>
        
        <div class="layer-group">
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-lakes" ${layerVisibility.lakes ? 'checked' : ''}>
              Lakes
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-rivers" ${layerVisibility.rivers ? 'checked' : ''}>
              Rivers
            </label>
          </div>
        </div>
        
        <div class="layer-group">
          <h4>Altitude Layers</h4>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-1" ${layerVisibility['altitude-1'] ? 'checked' : ''}>
              Altitude 1 (Lowest)
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-2" ${layerVisibility['altitude-2'] ? 'checked' : ''}>
              Altitude 2
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-3" ${layerVisibility['altitude-3'] ? 'checked' : ''}>
              Altitude 3
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-4" ${layerVisibility['altitude-4'] ? 'checked' : ''}>
              Altitude 4
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-5" ${layerVisibility['altitude-5'] ? 'checked' : ''}>
              Altitude 5
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-6" ${layerVisibility['altitude-6'] ? 'checked' : ''}>
              Altitude 6
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-7" ${layerVisibility['altitude-7'] ? 'checked' : ''}>
              Altitude 7
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-altitude-8" ${layerVisibility['altitude-8'] ? 'checked' : ''}>
              Altitude 8 (Highest)
            </label>
          </div>
          
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-coastlines" ${layerVisibility.coastlines ? 'checked' : ''}>
              Coastlines
            </label>
          </div>
        </div>
        
        <div class="layer-group">
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-icecaps" ${layerVisibility.icecaps ? 'checked' : ''}>
              Ice Caps
            </label>
          </div>
        </div>
        
        <div class="layer-group">
          <div class="layer-toggle">
            <label>
              <input type="checkbox" id="layer-labels" ${layerVisibility.labels ? 'checked' : ''}>
              Country Labels
            </label>
          </div>
        </div>
      `;
      
      // Add panel content to container
      container.appendChild(panelContent);
      
      // Create toggle button for control panel
      const toggleBtn = L.DomUtil.create('a', 'leaflet-control leaflet-bar control-toggle-button');
      toggleBtn.id = 'control-toggle';
      toggleBtn.innerHTML = '⚙️';
      toggleBtn.href = '#';
      toggleBtn.title = 'Toggle Map Layers';
      toggleBtn.setAttribute('role', 'button');
      toggleBtn.setAttribute('aria-label', 'Toggle layer controls');
      
      // Make it into a proper Leaflet control
      const toggleControl = L.control({position: 'topright'});
      toggleControl.onAdd = function() {
        return toggleBtn;
      };
      toggleControl.addTo(map);
      
      // Prevent events from propagating to map (prevents click from zooming)
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      
      // Add event listeners after DOM is ready
      setTimeout(() => {
        // Toggle button event
        document.getElementById('control-toggle').addEventListener('click', function(e) {
          e.preventDefault();
          const panel = document.getElementById('layer-control-panel');
          if (panel) {
            panel.classList.toggle('hidden');
          }
        });
        
        // Close button event
        document.getElementById('close-panel').addEventListener('click', function() {
          const panel = document.getElementById('layer-control-panel');
          if (panel) {
            panel.classList.add('hidden');
          }
        });
        
        // Add change listeners for all layer checkboxes
        const layerInputs = document.querySelectorAll('[id^="layer-"]');
        layerInputs.forEach(input => {
          input.addEventListener('change', function() {
            const layerId = this.id.replace('layer-', '');
            layerVisibility[layerId] = this.checked;
            updateLayerVisibility();
            
            // Special handling for country labels
            if (layerId === 'labels') {
              if (this.checked) {
                showCountryLabels();
              } else {
                hideCountryLabels();
              }
            }
          });
        });
      }, 100);
      
      return container;
    };
    
    controlPanel.addTo(map);
    
    // Initially hide the panel
    setTimeout(() => {
      const panel = document.getElementById('layer-control-panel');
      if (panel) {
        panel.classList.add('hidden');
      }
    }, 200);
  }

  /**
   * Updates layer visibility within SVG via CSS manipulation
   * Works by adding/removing a style element with CSS visibility rules
   * Compatible with Inkscape's layer structure
   */
  function updateLayerVisibility() {
    // Ensure style element exists
    let styleEl = document.getElementById('ixmap-layer-styles');
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ixmap-layer-styles';
      document.head.appendChild(styleEl);
    }
    
    // Build CSS for SVG layer visibility
    let css = '';
    
    // Define CSS rules for each layer
    // This targets both Inkscape layer IDs and labels
    Object.keys(layerVisibility).forEach(layer => {
      if (!layerVisibility[layer]) {
        // Hide the layer if visibility is false
        // Target elements with matching ID or inkscape:label
        css += `
          svg #${layer}, 
          svg [id="${layer}"], 
          svg [inkscape\\:label="${layer}"],
          svg .${layer} { 
            visibility: hidden !important; 
            display: none !important;
          }
        `;
      } else {
        // Ensure the layer is visible if visibility is true
        css += `
          svg #${layer}, 
          svg [id="${layer}"], 
          svg [inkscape\\:label="${layer}"],
          svg .${layer} { 
            visibility: visible !important; 
            display: inline !important;
          }
        `;
      }
    });
    
    // Apply CSS rules
    styleEl.textContent = css;
    
    // Show notification of layer change
    showToast('Map layers updated', 'info', 1500);
  }

  /**
   * Extract country labels from SVG and create Leaflet labels
   * This function is compatible with Inkscape SVG structure
   */
  function extractSvgCountryLabels() {
    return new Promise((resolve, reject) => {
      try {
        // Fetch the SVG to extract country names and positions
        fetch(config.masterMapPath)
          .then(response => response.text())
          .then(svgText => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
            
            // Find the political layer - try different Inkscape selectors
            const politicalLayer = 
              svgDoc.querySelector('#political') || 
              svgDoc.querySelector('[inkscape\\:label="political"]') ||
              svgDoc.querySelector('[inkscape\\:groupmode="layer"][id="political"]') ||
              svgDoc.querySelector('g[id="political"]');
            
            if (!politicalLayer) {
              console.error("Could not find political layer in SVG");
              reject(new Error("Political layer not found"));
              return;
            }
            
            console.log("Found political layer:", politicalLayer);
            
            // Find all country elements in the political layer
            // In Inkscape, these would be direct children with IDs
            const countryElements = politicalLayer.querySelectorAll('*');
            console.log(`Found ${countryElements.length} elements in political layer`);
            
            const labels = [];
            
            countryElements.forEach(element => {
              // Skip group elements and elements without IDs
              if (element.tagName.toLowerCase() === 'g' || !element.hasAttribute('id')) {
                return;
              }
              
              // Get the ID which is the country name
              const id = element.getAttribute('id');
              
              // Skip elements with generic IDs
              if (!id || id === 'political' || id.startsWith('path') || id.startsWith('rect')) {
                return;
              }
              
              // Try to get inkscape:label attribute first, then fall back to ID
              const name = element.getAttribute('inkscape:label') || id;
              
              // Calculate position (centroid of the path/shape)
              let centroid = calculatePathCentroid(element);
              
              // If we couldn't calculate a centroid, try to get bounding box center
              if (!centroid) {
                centroid = calculateBoundingBoxCenter(element);
              }
              
              // Skip if we couldn't determine a position
              if (!centroid) {
                console.warn(`Couldn't determine position for country: ${name}`);
                return;
              }
              
              // Determine if this is a major country, capital, or minor territory
              let type = 'standard';
              
              // Check element attributes and size
              try {
                // Simple heuristic: use element size to determine importance
                if (element.hasAttribute('inkscape:label')) {
                  const inkscapeLabel = element.getAttribute('inkscape:label').toLowerCase();
                  if (inkscapeLabel.includes('capital') || inkscapeLabel.includes('capitol')) {
                    type = 'capital';
                  } else if (inkscapeLabel.includes('major')) {
                    type = 'major';
                  } else if (inkscapeLabel.includes('minor')) {
                    type = 'minor';
                  }
                } else {
                  // Use size as a fallback
                  try {
                    const bbox = element.getBBox();
                    const area = bbox.width * bbox.height;
                    
                    if (area > 100000) {
                      type = 'major';
                    } else if (area < 10000) {
                      type = 'minor';
                    }
                  } catch (e) {
                    console.warn(`Error getting bounding box for ${name}:`, e);
                  }
                }
              } catch (e) {
                console.warn(`Error determining type for ${name}:`, e);
              }
              
              // Format the name for display
              const displayName = name
                .replace(/_/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/^[a-z]/, match => match.toUpperCase());
              
              // Add label to array
              labels.push({
                x: centroid.x,
                y: centroid.y,
                name: displayName,
                originalId: id,
                class: type
              });
              
              console.log(`Added country label: ${displayName} (${type}) at ${centroid.x},${centroid.y}`);
            });
            
            console.log(`Extracted ${labels.length} country labels from SVG`);
            resolve(labels);
          })
          .catch(error => {
            console.error('Error extracting country labels from SVG:', error);
            reject(error);
          });
      } catch (error) {
        console.error('Error in extractSvgCountryLabels:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Calculate the centroid (center point) of an SVG path element
   * @param {SVGElement} element - The SVG element (path, polygon, etc.)
   * @returns {Object|null} - {x, y} coordinates or null if calculation fails
   */
  function calculatePathCentroid(element) {
    try {
      // For simple rect elements
      if (element.tagName.toLowerCase() === 'rect') {
        const x = parseFloat(element.getAttribute('x') || 0);
        const y = parseFloat(element.getAttribute('y') || 0);
        const width = parseFloat(element.getAttribute('width') || 0);
        const height = parseFloat(element.getAttribute('height') || 0);
        
        return {
          x: x + width / 2,
          y: y + height / 2
        };
      }
      
      // For circle elements
      if (element.tagName.toLowerCase() === 'circle') {
        const cx = parseFloat(element.getAttribute('cx') || 0);
        const cy = parseFloat(element.getAttribute('cy') || 0);
        
        return { x: cx, y: cy };
      }
      
      // For path or polygon elements, try to get the bounding box center
      return calculateBoundingBoxCenter(element);
    } catch (error) {
      console.warn('Error calculating path centroid:', error);
      return null;
    }
  }
  
  /**
   * Calculate the center of an element's bounding box
   * @param {SVGElement} element - The SVG element
   * @returns {Object|null} - {x, y} coordinates or null if calculation fails
   */
  function calculateBoundingBoxCenter(element) {
    try {
      // Use the SVG's getBBox() to get the bounding box
      const bbox = element.getBBox();
      
      return {
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2
      };
    } catch (error) {
      console.warn('Error calculating bounding box center:', error);
      return null;
    }
  }
  
  /**
   * Create and show Leaflet labels for countries
   */
  function showCountryLabels() {
    // If labels are already showing, do nothing
    if (countryLabelsLayer && map.hasLayer(countryLabelsLayer)) {
      return;
    }
    
    // If we need to create the labels
    if (!countryLabelsLayer) {
      countryLabelsLayer = L.layerGroup();
      
      // Extract labels from SVG and create markers
      extractSvgCountryLabels()
        .then(labels => {
          // Create a marker for each label
          labels.forEach(label => {
            // Convert SVG coordinates to Leaflet coordinates
            const position = L.latLng(label.y, label.x);
            
            // Create a div icon with the country name
            const icon = L.divIcon({
              className: `${config.labelClassName} ${label.class}`,
              html: `<div style="font-weight:${label.class === 'minor' ? 'normal' : 'bold'};">${label.name}</div>`,
              iconSize: [120, 20],  // Set a reasonable size that will fit most country names
              iconAnchor: [60, 10]  // Center the icon on the position
            });
            
            // Create the marker and add it to the layer
            const marker = L.marker(position, {
              icon: icon,
              interactive: true,  // Makes the label clickable
              keyboard: false,    // Prevents keyboard navigation to the marker
              zIndexOffset: 1000  // Ensure labels appear above other elements
            });
            
            // Add a tooltip with more information if clicked
            marker.bindTooltip(label.name, { 
              direction: 'top',
              offset: [0, -10]
            });
            
            countryLabelsLayer.addLayer(marker);
          });
          
          // Add the layer to the map
          countryLabelsLayer.addTo(map);
          
          showToast(`Showing ${labels.length} country labels`, 'info', 2000);
        })
        .catch(error => {
          console.error('Failed to show country labels:', error);
          showToast('Failed to load country labels', 'error', 3000);
        });
    } else {
      // Just add the existing layer to the map
      countryLabelsLayer.addTo(map);
      showToast('Showing country labels', 'info', 2000);
    }
  }
  
  /**
   * Hide country labels
   */
  function hideCountryLabels() {
    if (countryLabelsLayer && map.hasLayer(countryLabelsLayer)) {
      map.removeLayer(countryLabelsLayer);
      showToast('Country labels hidden', 'info', 2000);
    }
  }

  // Make functions available globally through the IxMaps namespace
  window.IxMaps.Main = {
    showToast: showToast,
    hideToast: hideToast,
    calculateScaleFactor: calculateScaleFactor,
    calculateDistance: calculateDistance,
    calculatePixelDistance: calculatePixelDistance,
    updateLayerVisibility: updateLayerVisibility,
    getLayerVisibility: () => Object.assign({}, layerVisibility),
    showCountryLabels: showCountryLabels,
    hideCountryLabels: hideCountryLabels,
    MILES_PER_PIXEL: MILES_PER_PIXEL,
    KM_PER_PIXEL: KM_PER_PIXEL
  };
}