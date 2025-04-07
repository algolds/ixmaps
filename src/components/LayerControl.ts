import * as L from 'leaflet';
import * as d3 from 'd3';
import { LAYER_SETTINGS, ALTITUDE_LAYERS } from '../utils/constants';
import { SvgDocument } from '../types';

/**
 * Layer control component for toggling map layers
 */
export class LayerControl {
  private map: L.Map;
  private svgDocument: SvgDocument;
  private controlContainer: HTMLElement | null = null;
  
  /**
   * Create a new layer control
   * @param map - Leaflet map instance
   * @param svgDocument - SVG document
   */
  constructor(map: L.Map, svgDocument: SvgDocument) {
    this.map = map;
    this.svgDocument = svgDocument;
    this.initialize();
  }
  
  /**
   * Initialize the layer control
   */
  private initialize(): void {
    // Create control container
    this.createControlContainer();
    
    // Add layer toggles
    this.addLayerToggles();
  }
  
  /**
   * Create the control container
   */
  private createControlContainer(): void {
    // Create layer control
    const LayerControlPanel = L.Control.extend({
      options: {
        position: 'topright'
      },
      
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-control layer-control-panel');
        container.style.backgroundColor = 'white';
        container.style.padding = '10px';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        container.style.maxHeight = '80vh';
        container.style.overflowY = 'auto';
        container.style.minWidth = '200px';
        
        // Prevent events from propagating to map
        L.DomEvent.disableClickPropagation(container);
        
        // Create control content
        const header = document.createElement('h3');
        header.textContent = 'Map Layers';
        header.style.marginBottom = '10px';
        header.style.fontWeight = 'bold';
        container.appendChild(header);
        
        // Create content container
        const content = document.createElement('div');
        content.id = 'layer-toggles';
        container.appendChild(content);
        
        this.controlContainer = content;
        return container;
      }
    });
    
    // Add control to map
    new LayerControlPanel().addTo(this.map);
  }
  
  /**
   * Add layer toggle checkboxes
   */
  private addLayerToggles(): void {
    if (!this.controlContainer) return;
    
    // Clear existing content
    this.controlContainer.innerHTML = '';
    
    // Add main layers
    Object.entries(LAYER_SETTINGS).forEach(([key, settings]) => {
      // Skip base layer, as it should always be visible
      if (key === 'base') return;
      
      const layerGroup = document.createElement('div');
      layerGroup.className = 'layer-group';
      layerGroup.style.marginBottom = '10px';
      
      // Create checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `toggle-${key}`;
      checkbox.checked = settings.visible;
      checkbox.addEventListener('change', (event) => {
        this.toggleLayer(settings.id, (event.target as HTMLInputElement).checked);
      });
      
      // Create label
      const label = document.createElement('label');
      label.htmlFor = `toggle-${key}`;
      label.textContent = settings.name;
      label.style.marginLeft = '5px';
      label.style.cursor = 'pointer';
      
      // Add to group
      layerGroup.appendChild(checkbox);
      layerGroup.appendChild(label);
      
      // Add sub-layers if this is the altitude layer
      if (key === 'altitude') {
        const subLayers = document.createElement('div');
        subLayers.className = 'sub-layers';
        subLayers.style.marginLeft = '20px';
        subLayers.style.marginTop = '5px';
        
        // Add each altitude sub-layer
        ALTITUDE_LAYERS.forEach(subLayer => {
          const subGroup = document.createElement('div');
          subGroup.className = 'layer-group';
          subGroup.style.marginBottom = '5px';
          
          // Create sub-layer checkbox
          const subCheckbox = document.createElement('input');
          subCheckbox.type = 'checkbox';
          subCheckbox.id = `toggle-${subLayer.id}`;
          subCheckbox.checked = true;
          subCheckbox.addEventListener('change', (event) => {
            this.toggleLayer(subLayer.id, (event.target as HTMLInputElement).checked);
          });
          
          // Create sub-layer label
          const subLabel = document.createElement('label');
          subLabel.htmlFor = `toggle-${subLayer.id}`;
          subLabel.textContent = subLayer.name;
          subLabel.style.marginLeft = '5px';
          subLabel.style.cursor = 'pointer';
          subLabel.style.fontSize = '0.9em';
          
          // Add to sub-group
          subGroup.appendChild(subCheckbox);
          subGroup.appendChild(subLabel);
          subLayers.appendChild(subGroup);
        });
        
        layerGroup.appendChild(subLayers);
      }
      
      // Add to control container
      this.controlContainer.appendChild(layerGroup);
    });
  }
  
  /**
   * Toggle a layer's visibility
   * @param layerId - ID of the layer to toggle
   * @param visible - Whether the layer should be visible
   */
  public toggleLayer(layerId: string, visible: boolean): void {
    // Update all SVG overlays on the map
    const svgOverlays = document.querySelectorAll('svg.leaflet-overlay');
    
    svgOverlays.forEach(svg => {
      const layer = svg.querySelector(`#${layerId}`) as SVGElement;
      
      if (layer) {
        layer.style.visibility = visible ? 'visible' : 'hidden';
      }
    });
  }
  
  /**
   * Set a layer's opacity
   * @param layerId - ID of the layer to update
   * @param opacity - Opacity value (0-1)
   */
  public setLayerOpacity(layerId: string, opacity: number): void {
    // Update all SVG overlays on the map
    const svgOverlays = document.querySelectorAll('svg.leaflet-overlay');
    
    svgOverlays.forEach(svg => {
      const layer = svg.querySelector(`#${layerId}`) as SVGElement;
      
      if (layer) {
        layer.style.opacity = opacity.toString();
      }
    });
  }
}