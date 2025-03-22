/**
 * IxMaps Scale Implementation
 * Uses consistent 1px = 10 sq mi formula with km/mi conversion for display
 */

// Constants for scale calculations
const BASE_MILES_PER_PIXEL = 10; // Base scale at zoom level 0: 1px = 10 sq mi
const MILES_TO_KM = 2.59; // Conversion factor from square miles to square kilometers

/**
 * Calculates scale factor between raw map and display
 * @param {Object} config - Map configuration object
 * @returns {Number} The calculated scale factor
 */
function calculateScaleFactor(config) {
  // Use the current display size vs raw map size
  const mapWidth = map.getContainer().clientWidth;
  const mapHeight = map.getContainer().clientHeight;
  
  // Calculate width and height scale factors
  const widthScale = config.svgWidth / config.rawWidth;
  const heightScale = config.svgHeight / config.rawHeight;
  
  // Use the smaller scale to maintain proportions
  return Math.min(widthScale, heightScale);
}

/**
 * Calculate pixel distance between two points with consistent scale
 * @param {L.LatLng} latlng1 - The first point
 * @param {L.LatLng} latlng2 - The second point
 * @param {L.Map} map - The Leaflet map object
 * @returns {Object} Object containing distance in pixels, sq miles, and sq km
 */
function calculateDistance(latlng1, latlng2, map) {
  try {
    const point1 = map.latLngToContainerPoint(latlng1);
    const point2 = map.latLngToContainerPoint(latlng2);
    
    if (!point1 || !point2) return { pixels: 0, miles: 0, km: 0 };
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    // Calculate pixel distance
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate distance in square miles using the base 10 sq mi per pixel scale
    const zoom = map.getZoom();
    const milesPerPixel = BASE_MILES_PER_PIXEL / Math.pow(2, zoom);
    const squareMiles = pixelDistance * milesPerPixel;
    
    // Convert to square kilometers for display
    const squareKm = squareMiles * MILES_TO_KM;
    
    return {
      pixels: pixelDistance,
      miles: squareMiles,
      km: squareKm
    };
  } catch (e) {
    console.error('Error calculating distance:', e);
    return { pixels: 0, miles: 0, km: 0 };
  }
}

/**
 * Legacy function for backward compatibility
 * @param {L.LatLng} latlng1 - First point
 * @param {L.LatLng} latlng2 - Second point
 * @param {L.Map} map - The Leaflet map object
 * @returns {Number} Distance in pixels
 */
function calculatePixelDistance(latlng1, latlng2, map) {
  const distance = calculateDistance(latlng1, latlng2, map);
  return distance.pixels;
}

/**
 * Enhanced custom scale control with both sq mi and sq km display
 * @param {Object} config - Map configuration object
 * @returns {L.Control} The Leaflet control
 */
function createCustomScaleControl(config) {
  const customScale = L.control({
    position: 'bottomright'
  });
  
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
    
    let updateScaleTimeout = null;
    
    function updateScale() {
      if (updateScaleTimeout) clearTimeout(updateScaleTimeout);
      
      updateScaleTimeout = setTimeout(function() {
        const zoom = map.getZoom();
        
        // Always use the base scale of 1px = 10 sq mi internally
        const zoomFactor = Math.pow(2, zoom);
        const scaleFactor = calculateScaleFactor(config);
        
        // Calculate miles per pixel adjusted for zoom level
        const milesPerPixel = BASE_MILES_PER_PIXEL / zoomFactor;
        
        // Convert to km for display
        const kmPerPixel = milesPerPixel * MILES_TO_KM;
        
        // Update scale display with both mi and km values
        scaleInfo.innerHTML = `
          1px = ${milesPerPixel.toFixed(2)} sq mi (${kmPerPixel.toFixed(2)} sq km)<br>
          Map Scale: 1:${Math.round(1 / scaleFactor * 1000)}
        `;
        
        updateScaleTimeout = null;
      }, 1); // Short delay to prevent excessive updates
    }
    
    // Update scale when map zooms
    map.on('zoomend', updateScale);
    
    // Initial update
    updateScale();
    
    return div;
  };
  
  return customScale;
}

/**
 * Creates a measurement control for the map using consistent scale
 * @param {Object} config - Map configuration object
 * @returns {L.Control} The measurement control
 */
function createMeasurementControl(config) {
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
    
    // Create instructions element (reused)
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
        
        // Calculate distance using the consistent 10 sq mi per pixel base scale
        const distance = calculateDistance(
          measurePoints[lastIndex - 1],
          measurePoints[lastIndex],
          map
        );
        
        // Show distance label with both mi and km
        const midPoint = L.latLngBounds(measurePoints[lastIndex - 1], measurePoints[lastIndex]).getCenter();
        L.marker(midPoint, {
          icon: L.divIcon({
            className: 'distance-label',
            html: `${distance.miles.toFixed(1)} sq mi<br>${distance.km.toFixed(1)} sq km`,
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
        let totalPixelDistance = 0;
        
        for (let i = 1; i < measurePoints.length; i++) {
          const distance = calculateDistance(
            measurePoints[i - 1],
            measurePoints[i],
            map
          );
          totalPixelDistance += distance.pixels;
        }
        
        // Calculate total using consistent base scale
        const zoom = map.getZoom();
        const milesPerPixel = BASE_MILES_PER_PIXEL / Math.pow(2, zoom);
        const totalSquareMiles = totalPixelDistance * milesPerPixel;
        const totalSquareKm = totalSquareMiles * MILES_TO_KM;
        
        // Show total distance as toast with actions
        const toastContent = `
          <div>
            <strong>Total:</strong> ${totalSquareMiles.toFixed(1)} sq mi (${totalSquareKm.toFixed(1)} sq km)
            <div class="toast-actions">
              <button id="clear-measurements-btn" class="toast-btn">Clear</button>
              <button id="dismiss-toast-btn" class="toast-btn toast-btn-secondary">Dismiss</button>
            </div>
          </div>
        `;
        
        const toastId = window.showToast(toastContent, 'success', 0);
        
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
              window.hideToast(toastId);
            });
          }
          
          if (dismissBtn) {
            dismissBtn.addEventListener('click', function() {
              window.hideToast(toastId);
            });
          }
        }, 100);
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
  
  return measureControl;
}

/**
 * Update the map configuration to ensure consistent scale
 * @param {Object} config - Map configuration object
 * @returns {Object} - Updated configuration object
 */
function updateMapConfig(config) {
  // Ensure the base scale is consistently set to 10 sq mi per pixel
  config.sqMilesPerPixel = BASE_MILES_PER_PIXEL;
  
  // Set the equivalent in km (10 sq mi = 25.9 sq km)
  config.sqKmPerPixel = BASE_MILES_PER_PIXEL * MILES_TO_KM;
  
  return config;
}

// Export functions for use in other modules
window.IxMaps = window.IxMaps || {};
window.IxMaps.Scale = {
  BASE_MILES_PER_PIXEL: BASE_MILES_PER_PIXEL,
  MILES_TO_KM: MILES_TO_KM,
  calculateScaleFactor: calculateScaleFactor,
  calculateDistance: calculateDistance,
  calculatePixelDistance: calculatePixelDistance,
  createCustomScaleControl: createCustomScaleControl,
  createMeasurementControl: createMeasurementControl,
  updateMapConfig: updateMapConfig
};