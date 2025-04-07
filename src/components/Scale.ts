import * as L from 'leaflet';
import { SCALE_VALUES, SCALE_RATIOS, MAP_CONFIG } from '../utils/constants';

/**
 * Scale control component for displaying map scale
 */
export class Scale {
  private map: L.Map;
  private scaleBar: HTMLElement | null = null;
  private scaleInfo: HTMLElement | null = null;
  
  /**
   * Create a new scale control
   * @param map - Leaflet map instance
   */
  constructor(map: L.Map) {
    this.map = map;
    this.initialize();
  }
  
  /**
   * Initialize the scale control
   */
  private initialize(): void {
    // Create scale control
    const CustomScaleControl = L.Control.extend({
      options: {
        position: 'bottomright'
      },
      
      onAdd: () => {
        const div = L.DomUtil.create('div', 'custom-scale-control');
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        div.style.padding = '5px 10px';
        div.style.border = '2px solid rgba(0, 0, 0, 0.2)';
        div.style.borderRadius = '4px';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.fontSize = '12px';
        div.style.lineHeight = '1.5';
        div.style.color = '#333';
        
        // Create scale header
        const header = document.createElement('div');
        header.style.fontWeight = 'bold';
        header.textContent = 'Map Scale';
        div.appendChild(header);
        
        // Create scale bar container
        const scaleBarContainer = document.createElement('div');
        scaleBarContainer.className = 'scale-bar-container';
        scaleBarContainer.style.marginTop = '5px';
        
        // Create scale ticks container
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
        
        // Add ticks to container
        ticksContainer.appendChild(startTick);
        ticksContainer.appendChild(middleTick);
        ticksContainer.appendChild(endTick);
        
        // Create scale bar
        const scaleBar = document.createElement('div');
        scaleBar.style.backgroundColor = '#333';
        scaleBar.style.height = '8px';
        scaleBar.style.width = '100px';
        scaleBar.style.position = 'relative';
        
        // Create scale info
        const scaleInfo = document.createElement('div');
        scaleInfo.style.marginTop = '5px';
        scaleInfo.style.fontSize = '10px';
        scaleInfo.style.fontWeight = 'bold';
        
        // Store references
        this.scaleBar = scaleBar;
        this.scaleInfo = scaleInfo;
        
        // Assemble the scale
        scaleBarContainer.appendChild(ticksContainer);
        scaleBarContainer.appendChild(scaleBar);
        scaleBarContainer.appendChild(scaleInfo);
        div.appendChild(scaleBarContainer);
        
        // Update scale on zoom changes
        this.map.on('zoomend', this.updateScale.bind(this));
        this.map.on('resize', this.updateScale.bind(this));
        
        // Initial update
        setTimeout(() => {
          this.updateScale();
        }, 0);
        
        return div;
      }
    });
    
    // Add control to map
    new CustomScaleControl().addTo(this.map);
  }
  
  /**
   * Update the scale display
   */
  private updateScale(): void {
    if (!this.scaleBar || !this.scaleInfo) return;
    
    // Get current zoom level
    const zoom = this.map.getZoom();
    
    // Get map width in pixels
    const mapWidthPixels = this.map.getSize().x;
    
    // Calculate miles per pixel at current zoom
    const zoomFactor = Math.pow(2, zoom);
    const milesPerPixel = MAP_CONFIG.milesPerPixel / zoomFactor;
    
    // Find appropriate scale value
    let selectedValue = SCALE_VALUES[0];
    let selectedRatio = SCALE_RATIOS[0];
    let selectedPixelWidth = selectedValue / milesPerPixel;
    
    // Find a scale value that gives a nice bar width (between 50-300 pixels)
    for (let i = 0; i < SCALE_VALUES.length; i++) {
      const pixelWidth = SCALE_VALUES[i] / milesPerPixel;
      
      if (pixelWidth < 50 && i < SCALE_VALUES.length - 1) {
        continue; // Too small, try next larger value
      }
      
      if (pixelWidth > 300 && i > 0) {
        // Use previous value as this one is too large
        selectedValue = SCALE_VALUES[i-1];
        selectedRatio = SCALE_RATIOS[i-1];
        selectedPixelWidth = selectedValue / milesPerPixel;
        break;
      }
      
      // This value is good
      selectedValue = SCALE_VALUES[i];
      selectedRatio = SCALE_RATIOS[i];
      selectedPixelWidth = pixelWidth;
      
      if (pixelWidth >= 80 && pixelWidth <= 200) {
        break; // This is an ideal size, stop here
      }
    }
    
    // Calculate km equivalent
    const selectedKm = selectedValue * (MAP_CONFIG.kmPerPixel / MAP_CONFIG.milesPerPixel);
    
    // Update scale bar width
    this.scaleBar.style.width = `${Math.round(selectedPixelWidth)}px`;
    
    // Update tick positions
    const ticksContainer = this.scaleBar.parentElement?.querySelector('div') as HTMLElement;
    if (ticksContainer) {
      const ticks = ticksContainer.querySelectorAll('div');
      if (ticks.length >= 3) {
        ticks[1].style.left = `${Math.round(selectedPixelWidth / 2)}px`;
        ticks[2].style.left = `${Math.round(selectedPixelWidth)}px`;
      }
    }
    
    // Format the display value
    let milesDisplay, kmDisplay;
    
    if (selectedValue < 10) {
      milesDisplay = selectedValue.toFixed(2);
      kmDisplay = selectedKm.toFixed(2);
    } else {
      milesDisplay = selectedValue.toFixed(0);
      kmDisplay = selectedKm.toFixed(0);
    }
    
    // Update scale info
    this.scaleInfo.innerHTML = `
      ${milesDisplay} mi (${kmDisplay} km)<br>
      Map Scale: 1:${selectedRatio}
    `;
  }
}