import L from '../leaflet-module';
import { LayerVisibility } from '../types';

// Define the actual layer objects
const layers: { [key: string]: L.LayerGroup } = {};

export const createLayerControl = (): void => {
  console.log('LayerManager: Creating layer controls');
  
  // Create and initialize layers
  initializeLayers();
  
  // Create a layer control container
  const layerControl = L.Control.extend({
    options: {
      position: 'topright'
    },
    
    onAdd: function() {
      const div = L.DomUtil.create('div', 'leaflet-control-layers control-panel');
      div.innerHTML = `
        <div class="layer-control">
          <h3>Map Layers <span class="control-toggle-button">×</span></h3>
          <div id="layer-list">
            <div class="layer-group">
              <h4>Base Layers</h4>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-political" checked> Political Boundaries
                </label>
              </div>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-climate"> Climate Zones
                </label>
              </div>
            </div>
            <div class="layer-group">
              <h4>Water Features</h4>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-lakes"> Lakes
                </label>
              </div>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-rivers"> Rivers
                </label>
              </div>
            </div>
            <div class="layer-group">
              <h4>Land Features</h4>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-mountains"> Mountains
                </label>
              </div>
            </div>
            <div class="layer-group">
              <h4>Places</h4>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-cities"> Cities
                </label>
              </div>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-countries" checked> Countries
                </label>
              </div>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-states"> States/Provinces
                </label>
              </div>
            </div>
            <div class="layer-group">
              <h4>Display Options</h4>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-labels" checked> Labels
                </label>
              </div>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-grid"> Grid
                </label>
              </div>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-scale" checked> Scale
                </label>
              </div>
              <div class="layer-toggle">
                <label>
                  <input type="checkbox" id="layer-compass" checked> Compass
                </label>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add toggle behavior
      const toggle = div.querySelector('.control-toggle-button');
      const layerList = div.querySelector('#layer-list');
      if (toggle && layerList) {
        toggle.addEventListener('click', function() {
          if (layerList.style.display === 'none') {
            layerList.style.display = 'block';
            (toggle as HTMLElement).innerHTML = '×';
          } else {
            layerList.style.display = 'none';
            (toggle as HTMLElement).innerHTML = '≡';
          }
        });
      }
      
      return div;
    }
  });
  
  // Add the control to the map
  new layerControl().addTo(window.map);
  
  // Initialize layer visibility state with all required properties
  window.layerVisibility = {
    political: true,
    climate: false,
    lakes: false,
    rivers: false,
    mountains: false,
    cities: false,
    countries: true,
    states: false,
    territories: false,
    disputed: false,
    labels: true,
    grid: false,
    scale: true,
    compass: true
  };
  
  // Attach event listeners to checkboxes
  attachLayerEventListeners();
  
  // Update layer visibility based on initial state
  window.updateLayerVisibility();
  
  console.log('LayerManager: Layer controls created and initialized');
};

// Initialize actual map layers
const initializeLayers = (): void => {
  // Create empty layer groups for each layer type
  layers.political = L.layerGroup().addTo(window.map);
  layers.climate = L.layerGroup();
  layers.lakes = L.layerGroup();
  layers.rivers = L.layerGroup();
  layers.mountains = L.layerGroup();
  layers.cities = L.layerGroup();
  layers.countries = L.layerGroup().addTo(window.map);
  layers.states = L.layerGroup();
  layers.territories = L.layerGroup();
  layers.disputed = L.layerGroup();
  layers.labels = L.layerGroup().addTo(window.map);
  layers.grid = L.layerGroup();
  layers.scale = L.layerGroup().addTo(window.map);
  layers.compass = L.layerGroup().addTo(window.map);
  
  // Add some example content to visible layers
  addExampleLayerContent();
};

// Add example content to layers for testing
const addExampleLayerContent = (): void => {
  // Add a political boundary example
  const politicalBoundary = L.polygon([
    [1500, 2000],
    [2500, 2200],
    [2800, 3000],
    [2000, 3500],
    [1500, 3000]
  ], {
    color: '#800080',
    weight: 2,
    fillColor: '#8000FF',
    fillOpacity: 0.1
  }).addTo(layers.political);
  
  // Add country label example
  const countryLabel = L.marker([2200, 2700], {
    icon: L.divIcon({
      className: 'country-label major',
      html: 'Exampleland'
    })
  }).addTo(layers.countries);
  
  // Add scale control to scale layer
  const scaleControl = L.control.scale({
    position: 'bottomleft',
    imperial: true,
    metric: true
  }).addTo(window.map);
  
  // Add compass to compass layer
  const compassControl = L.control({
    position: 'topright'
  } as L.ControlOptions);
  
  compassControl.onAdd = function(map: L.Map) {
    const div = L.DomUtil.create('div', 'leaflet-control');
    div.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        border: 2px solid #666;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 20px;
      ">N</div>
    `;
    return div;
  };
  
  compassControl.addTo(window.map);
};

// Attach event listeners to layer checkboxes
const attachLayerEventListeners = (): void => {
  // For each layer type, attach an event listener to its checkbox
  Object.keys(window.layerVisibility).forEach(layerId => {
    const checkbox = document.getElementById(`layer-${layerId}`) as HTMLInputElement;
    if (checkbox) {
      checkbox.addEventListener('change', function() {
        window.layerVisibility[layerId as keyof LayerVisibility] = this.checked;
        window.updateLayerVisibility();
        
        // Special handling for grid layer
        if (layerId === 'grid' && this.checked && typeof window.drawGrid === 'function') {
          window.drawGrid();
        }
      });
    }
  });
};

// Update layers based on visibility state
window.updateLayerVisibility = (): void => {
  console.log('LayerManager: Updating layer visibility');
  
  // Update actual map layers based on visibility state
  Object.entries(window.layerVisibility).forEach(([layerId, isVisible]) => {
    // Update checkbox state
    const layerElement = document.getElementById(`layer-${layerId}`) as HTMLInputElement;
    if (layerElement) {
      layerElement.checked = isVisible;
    }
    
    // Update map layer visibility
    const layer = layers[layerId];
    if (layer) {
      if (isVisible) {
        if (!window.map.hasLayer(layer)) {
          window.map.addLayer(layer);
        }
      } else {
        if (window.map.hasLayer(layer)) {
          window.map.removeLayer(layer);
        }
      }
    }
  });
  
  // Special handling for coordinate grid
  if (window.layerVisibility.grid && typeof window.drawGrid === 'function') {
    window.drawGrid();
  }
};