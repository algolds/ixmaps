/**
 * LayerManager Component for IxMaps
 * Handles map layer visibility
 */

import { LayerVisibility } from '../types';
import { showToast } from './Toast';
import L from 'leaflet';

// Map layer visibility settings
export const layerVisibility: LayerVisibility = {
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

/**
 * Updates layer visibility within SVG via CSS manipulation
 * Works by adding/removing a style element with CSS visibility rules
 * Compatible with Inkscape's layer structure
 */
export function updateLayerVisibility(): void {
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
    const layerKey = layer as keyof LayerVisibility;
    if (!layerVisibility[layerKey]) {
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
 * Creates and adds layer control panel for the master SVG layers
 */
export function createLayerControl(): void {
  // Create the control panel container
  const LayerControl = L.Control.extend({
    options: {
      position: 'topright'
    },
    
    onAdd: function(map: L.Map) {
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
      
      // Add toggle button to container
      container.appendChild(toggleBtn);
      
      // Prevent events from propagating to map (prevents click from zooming)
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      
      // Add event listeners after DOM is ready
      setTimeout(() => {
        // Toggle button event
        document.getElementById('control-toggle')?.addEventListener('click', function(e) {
          e.preventDefault();
          const panel = document.getElementById('layer-control-panel');
          if (panel) {
            panel.classList.toggle('hidden');
          }
        });
        
        // Close button event
        document.getElementById('close-panel')?.addEventListener('click', function() {
          const panel = document.getElementById('layer-control-panel');
          if (panel) {
            panel.classList.add('hidden');
          }
        });
        
        // Add change listeners for all layer checkboxes
        const layerInputs = document.querySelectorAll('[id^="layer-"]');
        layerInputs.forEach(input => {
          input.addEventListener('change', function(this: HTMLInputElement) {
            const layerId = this.id.replace('layer-', '') as keyof LayerVisibility;
            layerVisibility[layerId] = this.checked;
            updateLayerVisibility();
            
            // Special handling for country labels
            if (layerId === 'labels') {
              if (this.checked) {
                window.IxMaps.Main.showCountryLabels();
              } else {
                window.IxMaps.Main.hideCountryLabels();
              }
            }
          });
        });
      }, 100);
      
      return container;
    }
  });
  
  // Create and add the control to the map
  const layerControl = new LayerControl();
  layerControl.addTo(window.map);
  
  // Initially hide the panel
  setTimeout(() => {
    const panel = document.getElementById('layer-control-panel');
    if (panel) {
      panel.classList.add('hidden');
    }
  }, 200);
} 