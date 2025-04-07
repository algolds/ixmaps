import * as L from 'leaflet';
import * as d3 from 'd3';
import { MAP_CONFIG, LAYER_SETTINGS } from '../utils/constants';
import { svgLoader } from '../services/SvgLoader';
import { coordinateSystem } from '../services/CoordinateSystem';
import { distanceCalculator } from '../services/DistanceCalculator';
import { showToast, showErrorToast, showSuccessToast } from '../utils/toasts';
import { LayerControl } from './LayerControl';
import { Measurement } from './Measurement';
import { Scale } from './Scale';
import { SvgDocument } from '../types';

/**
 * Main map component
 */
export class Map {
  private static instance: Map;
  private map: L.Map | null = null;
  private svgDocument: SvgDocument | null = null;
  private svgOverlays: L.SVGOverlay[] = [];
  private layerControl: LayerControl | null = null;
  private measurement: Measurement | null = null;
  private scale: Scale | null = null;
  private loadingIndicator: HTMLElement | null = null;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): Map {
    if (!Map.instance) {
      Map.instance = new Map();
    }
    return Map.instance;
  }
  
  /**
   * Private constructor (use getInstance instead)
   */
  private constructor() {}
  
  /**
   * Initialize the map
   * @returns Promise resolving when map is initialized
   */
  public async initialize(): Promise<void> {
    // Show loading indicator
    this.loadingIndicator = document.getElementById('loading-indicator');
    
    try {
      // Create Leaflet map
      this.map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        attributionControl: false,
        center: [MAP_CONFIG.svgHeight / 2, MAP_CONFIG.primeMeridianX],
        zoom: MAP_CONFIG.initialZoom,
        wheelPxPerZoomLevel: 120,
        fadeAnimation: true, 
        zoomAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: true
      });
      
      // Make map globally accessible
      (window as any).map = this.map;
      (window as any).mapConfig = MAP_CONFIG;
      
      // Add attribution control
      L.control.attribution({
        prefix: 'IxMaps™ v4.0'
      }).addTo(this.map);
      
      // Initialize services
      coordinateSystem.initialize(this.map);
      distanceCalculator.initialize(this.map);
      
      // Load SVG map
      await this.loadSvgMap();
      
      // Initialize components
      this.layerControl = new LayerControl(this.map, this.svgDocument!);
      this.measurement = new Measurement(this.map);
      this.scale = new Scale(this.map);
      
      // Implement map wrapping for infinite horizontal scrolling
      this.implementMapWrapping();
      
      // Add interaction handlers
      this.addInteractionHandlers();
      
      // Hide loading indicator
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
      
      // Show success message
      showSuccessToast('Map loaded successfully', 3000);
      
      // Make distance calculator globally accessible (for backward compatibility)
      (window as any).calculateDistance = distanceCalculator.calculateDistance.bind(distanceCalculator);
      (window as any).calculatePixelDistance = distanceCalculator.calculatePixelDistance.bind(distanceCalculator);
      
      // Make toast functions globally accessible
      (window as any).showToast = showToast;
      
    } catch (error) {
      // Show error message
      console.error('Error initializing map:', error);
      
      if (this.loadingIndicator) {
        this.loadingIndicator.textContent = 'Error loading map. Please try refreshing the page.';
      }
      
      showErrorToast('Failed to load map. Please try refreshing the page.', 0, [
        {
          label: 'Retry',
          action: () => {
            window.location.reload();
          }
        }
      ]);
    }
  }
  
  /**
   * Load the SVG map
   */
  private async loadSvgMap(): Promise<void> {
    try {
      // Load the master SVG file
      this.svgDocument = await svgLoader.loadSvg(MAP_CONFIG.masterMapPath);
      
      if (!this.map) {
        throw new Error('Map not initialized');
      }
      
      // Calculate bounds for the SVG
      const bounds = [
        [0, 0],
        [MAP_CONFIG.svgHeight, MAP_CONFIG.svgWidth]
      ] as L.LatLngBoundsExpression;
      
      // Create main SVG overlay
      const mainOverlay = this.createSvgOverlay(this.svgDocument, bounds);
      this.svgOverlays.push(mainOverlay);
      
      // Create wrapped overlays for horizontal continuity
      this.createWrappedOverlays(this.svgDocument);
      
      // Set initial layer visibility
      this.setInitialLayerVisibility(this.svgDocument);
      
      // Center the map (without using fitBounds to preserve initial center)
      this.map.setView([MAP_CONFIG.svgHeight / 2, MAP_CONFIG.primeMeridianX], MAP_CONFIG.initialZoom);
    } catch (error) {
      console.error('Error loading SVG map:', error);
      throw error;
    }
  }
  
  /**
   * Create an SVG overlay for the map
   * @param svgDoc - SVG document
   * @param bounds - Bounds for the overlay
   * @returns SVG overlay
   */
  private createSvgOverlay(svgDoc: SvgDocument, bounds: L.LatLngBoundsExpression): L.SVGOverlay {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    
    // Clone the SVG element to avoid modifying the original
    const svgElement = svgDoc.element.cloneNode(true) as SVGElement;
    
    // Ensure the SVG has proper attributes for display
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    
    // Create the overlay
    const overlay = L.svgOverlay(svgElement, bounds, {
      interactive: true
    }).addTo(this.map);
    
    return overlay;
  }
  
  /**
   * Create wrapped SVG overlays for horizontal map continuity
   * @param svgDoc - SVG document
   */
  private createWrappedOverlays(svgDoc: SvgDocument): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    
    // Left wrapped overlay
    const leftBounds = [
      [0, -MAP_CONFIG.svgWidth],
      [MAP_CONFIG.svgHeight, 0]
    ] as L.LatLngBoundsExpression;
    
    const leftOverlay = this.createSvgOverlay(svgDoc, leftBounds);
    this.svgOverlays.push(leftOverlay);
    
    // Right wrapped overlay
    const rightBounds = [
      [0, MAP_CONFIG.svgWidth],
      [MAP_CONFIG.svgHeight, MAP_CONFIG.svgWidth * 2]
    ] as L.LatLngBoundsExpression;
    
    const rightOverlay = this.createSvgOverlay(svgDoc, rightBounds);
    this.svgOverlays.push(rightOverlay);
  }
  
  /**
   * Set initial layer visibility based on default settings
   * @param svgDoc - SVG document
   */
  private setInitialLayerVisibility(svgDoc: SvgDocument): void {
    // Loop through all SVG overlays
    this.svgOverlays.forEach(overlay => {
      const svgElement = overlay.getElement() as SVGElement;
      
      // Apply visibility settings to each layer
      Object.entries(LAYER_SETTINGS).forEach(([key, settings]) => {
        const layerId = settings.id;
        const layer = svgElement.querySelector(`#${layerId}`) as SVGElement;
        
        if (layer) {
          // Set visibility
          layer.style.visibility = settings.visible ? 'visible' : 'hidden';
          
          // Set opacity
          layer.style.opacity = settings.opacity.toString();
        }
      });
    });
  }
  
  /**
   * Implement map wrapping for infinite horizontal scrolling
   */
  private implementMapWrapping(): void {
    if (!this.map) return;
    
    this.map.on('moveend', () => {
      const center = this.map!.getCenter();
      
      // If panned beyond bounds, wrap around immediately
      if (center.lng < 0) {
        this.map!.panTo([center.lat, center.lng + MAP_CONFIG.svgWidth], {
          animate: false,
          duration: 0,
          easeLinearity: 1,
          noMoveStart: true
        });
      } else if (center.lng > MAP_CONFIG.svgWidth) {
        this.map!.panTo([center.lat, center.lng - MAP_CONFIG.svgWidth], {
          animate: false,
          duration: 0,
          easeLinearity: 1,
          noMoveStart: true
        });
      }
    });
  }
  
  /**
   * Add interaction handlers for the map
   */
  private addInteractionHandlers(): void {
    if (!this.map || !this.svgDocument) return;
    
    // Find all country elements
    this.svgOverlays.forEach(overlay => {
      const svgElement = overlay.getElement() as SVGElement;
      const countries = svgElement.querySelectorAll('.country');
      
      // Add interactions to each country
      countries.forEach(country => {
        this.addCountryInteractions(country as SVGElement);
      });
    });
  }
  
  /**
   * Add interactions to a country element
   * @param countryElement - SVG element for the country
   */
  private addCountryInteractions(countryElement: SVGElement): void {
    // Store original styles
    const originalStrokeWidth = countryElement.style.strokeWidth || '';
    const originalFilter = countryElement.style.filter || '';
    
    // Create tooltip element if it doesn't exist
    let tooltip = document.getElementById('country-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'country-tooltip';
      tooltip.className = 'country-tooltip';
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);
    }
    
    // Add mouse events
    countryElement.addEventListener('mouseover', (event) => {
      // Highlight the country
      countryElement.style.strokeWidth = '1.5px';
      countryElement.style.filter = 'brightness(1.2) saturate(1.5)';
      
      // Show tooltip
      const countryId = countryElement.id;
      const countryName = countryElement.getAttribute('data-name') || countryId;
      
      if (tooltip) {
        tooltip.textContent = countryName;
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY + 10) + 'px';
        tooltip.style.display = 'block';
      }
    });
    
    countryElement.addEventListener('mousemove', (event) => {
      // Update tooltip position
      if (tooltip) {
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY + 10) + 'px';
      }
    });
    
    countryElement.addEventListener('mouseout', () => {
      // Restore original styles
      countryElement.style.strokeWidth = originalStrokeWidth;
      countryElement.style.filter = originalFilter;
      
      // Hide tooltip
      if (tooltip) {
        tooltip.style.display = 'none';
      }
    });
    
    countryElement.addEventListener('click', () => {
      // Show country info
      this.showCountryInfo(countryElement);
    });
  }
  
  /**
   * Show information about a country
   * @param countryElement - SVG element for the country
   */
  private showCountryInfo(countryElement: SVGElement): void {
    const countryId = countryElement.id;
    const countryName = countryElement.getAttribute('data-name') || countryId;
    
    // Extract additional data attributes
    const capital = countryElement.getAttribute('data-capital') || 'Unknown';
    const population = countryElement.getAttribute('data-population') || 'Unknown';
    const area = countryElement.getAttribute('data-area') || 'Unknown';
    
    // Create info panel content
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.innerHTML = `
        <div class="country-info">
          <h4>${countryName}</h4>
          <div class="info-grid">
            <div>Capital:</div>
            <div>${capital}</div>
            <div>Population:</div>
            <div>${population}</div>
            <div>Area:</div>
            <div>${area}</div>
          </div>
        </div>
      `;
    }
    
    // Show toast notification
    showToast(`Selected: ${countryName}`, 'info', 2000);
  }
}