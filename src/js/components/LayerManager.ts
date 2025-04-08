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
      
      // Add toggle functionality for the control panel
      const toggleButton = div.querySelector('.control-toggle-button');
      if (toggleButton) {
        toggleButton.addEventListener('click', () => {
          const layerList = div.querySelector('#layer-list');
          if (layerList) {
            layerList.style.display = layerList.style.display === 'none' ? 'block' : 'none';
          }
        });
      }
      
      return div;
    }
  });
  
  // Add the layer control to the map
  const control = new layerControl();
  control.addTo(window.map);
  
  // Attach event listeners to the layer toggles
  attachLayerEventListeners();
  
  console.log('LayerManager: Layer controls created and initialized');
};

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
  
  // Add political boundaries from SVG
  addPoliticalBoundaries();
  
  // Add some example content to visible layers
  addExampleLayerContent();
};

// Add political boundaries from SVG
const addPoliticalBoundaries = (): void => {
  try {
    // Get the SVG element
    const svgElement = document.querySelector('svg');
    if (!svgElement) {
      console.warn('SVG element not found, cannot add political boundaries');
      return;
    }
    
    // Find all political boundary paths in the SVG
    const politicalPaths = svgElement.querySelectorAll('path.political-boundary, path.country-boundary, path.state-boundary');
    
    if (politicalPaths.length === 0) {
      console.warn('No political boundary paths found in SVG');
      return;
    }
    
    console.log(`Found ${politicalPaths.length} political boundary paths in SVG`);
    
    // Process each political boundary path
    politicalPaths.forEach((path, index) => {
      try {
        // Get the path data
        const pathData = path.getAttribute('d');
        if (!pathData) return;
        
        // Create a Leaflet SVG path
        const svgPath = L.svg({
          className: 'political-boundary'
        });
        
        // Add the path to the SVG layer
        svgPath.addTo(layers.political);
        
        // Create a path element
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', pathData);
        pathElement.setAttribute('fill', 'none');
        pathElement.setAttribute('stroke', '#800080');
        pathElement.setAttribute('stroke-width', '2');
        
        // Add the path element to the SVG layer
        svgPath.getElement().appendChild(pathElement);
        
        // Add hover effect
        pathElement.addEventListener('mouseover', () => {
          pathElement.setAttribute('stroke', '#FF00FF');
          pathElement.setAttribute('stroke-width', '3');
        });
        
        pathElement.addEventListener('mouseout', () => {
          pathElement.setAttribute('stroke', '#800080');
          pathElement.setAttribute('stroke-width', '2');
        });
        
        // Add click event to show country name
        pathElement.addEventListener('click', (event) => {
          const countryName = path.getAttribute('data-name') || `Country ${index + 1}`;
          L.popup()
            .setLatLng([event.clientY, event.clientX])
            .setContent(`<strong>${countryName}</strong>`)
            .openOn(window.map);
        });
      } catch (error) {
        console.error(`Error processing political boundary ${index}:`, error);
      }
    });
  } catch (error) {
    console.error('Error adding political boundaries:', error);
  }
};

// Add example content to layers for testing
const addExampleLayerContent = (): void => {
  // Add a political boundary example if no SVG paths were found
  if (layers.political.getLayers().length === 0) {
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
  }
  
  // Add country label example
  const countryLabel = L.marker([2200, 2700], {
    icon: L.divIcon({
      className: 'country-label major',
      html: 'Exampleland'
    })
  }).addTo(layers.countries);
  
  // Add scale control to scale layer
  const scaleControl = L.control.scale({
    imperial: true,
    metric: true,
    position: 'bottomleft'
  });
  
  scaleControl.addTo(window.map);
  
  // Add compass to compass layer
  const compass = L.control({
    position: 'bottomright'
  });
  
  compass.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control-compass');
    div.innerHTML = 'N';
    return div;
  };
  
  compass.addTo(window.map);
};

const attachLayerEventListeners = (): void => {
  // Political boundaries toggle
  const politicalToggle = document.getElementById('layer-political') as HTMLInputElement;
  if (politicalToggle) {
    politicalToggle.addEventListener('change', () => {
      if (politicalToggle.checked) {
        layers.political.addTo(window.map);
      } else {
        layers.political.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Climate zones toggle
  const climateToggle = document.getElementById('layer-climate') as HTMLInputElement;
  if (climateToggle) {
    climateToggle.addEventListener('change', () => {
      if (climateToggle.checked) {
        layers.climate.addTo(window.map);
      } else {
        layers.climate.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Lakes toggle
  const lakesToggle = document.getElementById('layer-lakes') as HTMLInputElement;
  if (lakesToggle) {
    lakesToggle.addEventListener('change', () => {
      if (lakesToggle.checked) {
        layers.lakes.addTo(window.map);
      } else {
        layers.lakes.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Rivers toggle
  const riversToggle = document.getElementById('layer-rivers') as HTMLInputElement;
  if (riversToggle) {
    riversToggle.addEventListener('change', () => {
      if (riversToggle.checked) {
        layers.rivers.addTo(window.map);
      } else {
        layers.rivers.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Mountains toggle
  const mountainsToggle = document.getElementById('layer-mountains') as HTMLInputElement;
  if (mountainsToggle) {
    mountainsToggle.addEventListener('change', () => {
      if (mountainsToggle.checked) {
        layers.mountains.addTo(window.map);
      } else {
        layers.mountains.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Cities toggle
  const citiesToggle = document.getElementById('layer-cities') as HTMLInputElement;
  if (citiesToggle) {
    citiesToggle.addEventListener('change', () => {
      if (citiesToggle.checked) {
        layers.cities.addTo(window.map);
      } else {
        layers.cities.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Countries toggle
  const countriesToggle = document.getElementById('layer-countries') as HTMLInputElement;
  if (countriesToggle) {
    countriesToggle.addEventListener('change', () => {
      if (countriesToggle.checked) {
        layers.countries.addTo(window.map);
      } else {
        layers.countries.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // States toggle
  const statesToggle = document.getElementById('layer-states') as HTMLInputElement;
  if (statesToggle) {
    statesToggle.addEventListener('change', () => {
      if (statesToggle.checked) {
        layers.states.addTo(window.map);
      } else {
        layers.states.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Labels toggle
  const labelsToggle = document.getElementById('layer-labels') as HTMLInputElement;
  if (labelsToggle) {
    labelsToggle.addEventListener('change', () => {
      if (labelsToggle.checked) {
        layers.labels.addTo(window.map);
      } else {
        layers.labels.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Grid toggle
  const gridToggle = document.getElementById('layer-grid') as HTMLInputElement;
  if (gridToggle) {
    gridToggle.addEventListener('change', () => {
      if (gridToggle.checked) {
        layers.grid.addTo(window.map);
      } else {
        layers.grid.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Scale toggle
  const scaleToggle = document.getElementById('layer-scale') as HTMLInputElement;
  if (scaleToggle) {
    scaleToggle.addEventListener('change', () => {
      if (scaleToggle.checked) {
        layers.scale.addTo(window.map);
      } else {
        layers.scale.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
  
  // Compass toggle
  const compassToggle = document.getElementById('layer-compass') as HTMLInputElement;
  if (compassToggle) {
    compassToggle.addEventListener('change', () => {
      if (compassToggle.checked) {
        layers.compass.addTo(window.map);
      } else {
        layers.compass.remove();
      }
      console.log('LayerManager: Updating layer visibility');
    });
  }
};