/**
 * Coordinate System UI Components
 * Creates and manages the UI elements for the coordinate system
 */

import * as L from 'leaflet';

/**
 * Creates the coordinate system control panel
 */
export function createCoordSystemControlPanel(): void {
  // Create the main container
  const coordSystemControl = document.createElement('div');
  coordSystemControl.className = 'coord-system-control';
  
  // Create the control panel
  const controlPanel = document.createElement('div');
  controlPanel.className = 'control-panel';
  
  // Create the title
  const title = document.createElement('h3');
  title.textContent = 'Coordinate System';
  controlPanel.appendChild(title);
  
  // Create the layer group
  const layerGroup = document.createElement('div');
  layerGroup.className = 'layer-group';
  
  // Create the grid toggle
  const gridToggle = createToggle('toggle-grid', 'Show Grid', true);
  layerGroup.appendChild(gridToggle);
  
  // Create the labels toggle
  const labelsToggle = createToggle('toggle-coords-labels', 'Show Labels', true);
  layerGroup.appendChild(labelsToggle);
  
  // Create the prime meridian toggle
  const primeMeridianToggle = createToggle('toggle-prime-meridian', 'Show Prime Meridian', true);
  layerGroup.appendChild(primeMeridianToggle);
  
  // Assemble the control panel
  controlPanel.appendChild(layerGroup);
  coordSystemControl.appendChild(controlPanel);
  
  // Add event listeners for the toggles
  setupToggleEventListeners();
  
  // Add the control panel to the document
  document.body.insertBefore(coordSystemControl, document.getElementById('map'));

  // Add cleanup handler
  window.addEventListener('unload', () => {
    // Remove event listeners
    const toggles = document.querySelectorAll('.layer-toggle input');
    toggles.forEach(toggle => {
      toggle.removeEventListener('change', handleToggleChange);
    });
    
    // Remove control panel
    coordSystemControl.remove();
    
    console.log('Coordinate system UI cleaned up');
  });
}

/**
 * Creates a toggle checkbox with label
 */
function createToggle(id: string, labelText: string, checked: boolean): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'layer-toggle';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = id;
  checkbox.checked = checked;
  
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(` ${labelText}`));
  
  return label;
}

/**
 * Handles toggle changes
 */
function handleToggleChange(event: Event): void {
  const toggle = event.target as HTMLInputElement;
  const id = toggle.id;
  
  switch(id) {
    case 'toggle-grid':
      if (window.drawGrid) {
        if (toggle.checked) {
          window.drawGrid();
        } else {
          // Clear the grid layer using Leaflet's layer management
          if (window.map) {
            const gridLayer = window.map.getPane('overlayPane');
            if (gridLayer) {
              const gridElements = gridLayer.querySelectorAll('.grid-line, .grid-label');
              gridElements.forEach(el => {
                el.remove();
              });
            }
          }
        }
      }
      break;
      
    case 'toggle-coords-labels':
      if (window.drawGrid) {
        window.drawGrid();
      }
      break;
      
    case 'toggle-prime-meridian':
      if (window.drawPrimeMeridian) {
        if (toggle.checked) {
          window.drawPrimeMeridian();
        } else {
          // Clear the prime meridian layer using Leaflet's layer management
          if (window.map) {
            const primeMeridianLayer = window.map.getPane('overlayPane');
            if (primeMeridianLayer) {
              const meridianElements = primeMeridianLayer.querySelectorAll('.prime-meridian-line, .prime-meridian-label');
              meridianElements.forEach(el => {
                el.remove();
              });
            }
          }
        }
      }
      break;
  }
}

/**
 * Sets up event listeners for the toggle controls
 */
function setupToggleEventListeners(): void {
  const toggles = document.querySelectorAll('.layer-toggle input');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', handleToggleChange);
  });
} 