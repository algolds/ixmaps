import L from 'leaflet-module';
import { LayerVisibility } from '../types';

export const createLayerControl = (): void => {
  // Create a layer control container
  const layerControl = L.Control.extend({
    options: {
      position: 'topright'
    },
    
    onAdd: function() {
      const div = L.DomUtil.create('div', 'leaflet-control-layers');
      div.innerHTML = `
        <div class="layer-control">
          <h3>Layers</h3>
          <div id="layer-list"></div>
        </div>
      `;
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
  
  window.updateLayerVisibility = () => {
    const layerList = document.getElementById('layer-list');
    if (!layerList) return;
    
    // Update layer list UI based on current visibility state
    Object.entries(window.layerVisibility).forEach(([layerId, isVisible]) => {
      const layerElement = document.getElementById(`layer-${layerId}`);
      if (layerElement) {
        layerElement.classList.toggle('active', isVisible);
      }
    });
  };
}; 