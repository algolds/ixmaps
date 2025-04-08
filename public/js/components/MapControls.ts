/**
 * MapControls Component for IxMaps
 * Handles map controls like zoom, scale, and measurement
 */

import { MILES_PER_PIXEL, KM_PER_PIXEL, calculateDistance } from './DistanceCalculator';
import { showToast } from './Toast';
import * as L from 'leaflet';

/**
 * Add zoom control to the map
 */
export function addZoomControl(): void {
  L.control.zoom({
    position: 'bottomright'
  }).addTo(window.map);
}

/**
 * Add custom scale control with label inside the box
 */
export function addScaleControl(): void {
  const customScale = L.Control.extend({
    options: {
      position: 'bottomright'
    },
    
    onAdd: function(map: L.Map) {
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
    }
  });
  
  new customScale().addTo(window.map);
}

/**
 * Add distance measurement tool
 */
export function addMeasureControl(): void {
  const measureControl = L.Control.extend({
    options: {
      position: 'topleft'
    },
    
    onAdd: function(map: L.Map) {
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
      let measurePoints: L.LatLng[] = [];
      let measureLayer: L.LayerGroup | null = null;
      let measureClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
      
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
       * @param e - The click event
       */
      function addMeasurePoint(e: L.LeafletMouseEvent) {
        if (!measuring) return;
        
        // Add point to array
        measurePoints.push(e.latlng);
        
        // Add marker for the point
        const marker = L.circleMarker(e.latlng, {
          color: '#0078A8',
          fillColor: '#0078A8',
          fillOpacity: 1,
          radius: 4
        }).addTo(measureLayer!);
        
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
          }).addTo(measureLayer!);
          
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
          }).addTo(measureLayer!);
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
              window.IxMaps.Main.hideToast(toastId);
            });
          }
          
          if (dismissBtn) {
            dismissBtn.addEventListener('click', function() {
              window.IxMaps.Main.hideToast(toastId);
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
    }
  });
  
  new measureControl().addTo(window.map);
} 