import * as L from 'leaflet';
import { distanceCalculator } from '../services/DistanceCalculator';
import { MeasurementState } from '../types';
import { showToast } from '../utils/toasts';

/**
 * Measurement tool component for measuring distances on the map
 */
export class Measurement {
  private map: L.Map;
  private state: MeasurementState = {
    active: false,
    points: [],
    layer: null
  };
  private measureClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
  private instructionsElement: HTMLElement | null = null;
  
  /**
   * Create a new measurement tool
   * @param map - Leaflet map instance
   */
  constructor(map: L.Map) {
    this.map = map;
    this.initialize();
  }
  
  /**
   * Initialize the measurement tool
   */
  private initialize(): void {
    // Create measurement control
    const MeasureControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control measure-control');
        const button = L.DomUtil.create('a', 'measure-button', container);
        button.href = '#';
        button.title = 'Measure distances';
        button.innerHTML = '📏';
        button.style.fontSize = '18px';
        button.style.lineHeight = '26px';
        button.style.textAlign = 'center';
        button.style.fontWeight = 'bold';
        
        // Add click handler
        L.DomEvent
          .on(button, 'click', L.DomEvent.stopPropagation)
          .on(button, 'click', L.DomEvent.preventDefault)
          .on(button, 'click', () => {
            this.toggleMeasurement(button);
          });
        
        return container;
      }
    });
    
    // Add control to map
    new MeasureControl().addTo(this.map);
    
    // Create instructions element
    this.createInstructionsElement();
  }
  
  /**
   * Create the measurement instructions element
   */
  private createInstructionsElement(): void {
    this.instructionsElement = document.createElement('div');
    this.instructionsElement.id = 'measure-instructions';
    this.instructionsElement.className = 'measure-instructions';
    this.instructionsElement.innerHTML = 'Click to add measurement points. Double-click to finish.';
    this.instructionsElement.style.position = 'absolute';
    this.instructionsElement.style.bottom = '20px';
    this.instructionsElement.style.left = '50%';
    this.instructionsElement.style.transform = 'translateX(-50%)';
    this.instructionsElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    this.instructionsElement.style.padding = '8px 12px';
    this.instructionsElement.style.borderRadius = '4px';
    this.instructionsElement.style.fontSize = '14px';
    this.instructionsElement.style.zIndex = '1000';
    this.instructionsElement.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
    this.instructionsElement.style.display = 'none';
    
    // Add to document
    document.body.appendChild(this.instructionsElement);
  }
  
  /**
   * Toggle measurement mode
   * @param button - Button element that was clicked
   */
  private toggleMeasurement(button: HTMLElement): void {
    if (!this.state.active) {
      // Start measuring
      this.startMeasurement(button);
    } else {
      // Stop measuring
      this.finishMeasurement();
    }
  }
  
  /**
   * Start measurement mode
   * @param button - Button element that was clicked
   */
  private startMeasurement(button: HTMLElement): void {
    // Set state
    this.state.active = true;
    this.state.points = [];
    
    // Create a new layer for measurements
    if (this.state.layer) {
      this.map.removeLayer(this.state.layer);
    }
    this.state.layer = L.layerGroup().addTo(this.map);
    
    // Update button style
    button.style.backgroundColor = '#f4f4f4';
    button.style.color = '#0078A8';
    
    // Change cursor
    this.map.getContainer().style.cursor = 'crosshair';
    
    // Add click handler for measuring
    this.measureClickHandler = this.addMeasurePoint.bind(this);
    this.map.on('click', this.measureClickHandler);
    
    // Add double click handler to finish measuring
    this.map.on('dblclick', this.finishMeasurement.bind(this));
    
    // Show instructions
    if (this.instructionsElement) {
      this.instructionsElement.style.display = 'block';
    }
  }
  
  /**
   * Add a measurement point
   * @param e - Click event
   */
  private addMeasurePoint(e: L.LeafletMouseEvent): void {
    if (!this.state.active || !this.state.layer) return;
    
    // Add point to array
    this.state.points.push(e.latlng);
    
    // Add marker for the point
    const marker = L.circleMarker(e.latlng, {
      color: '#0078A8',
      fillColor: '#0078A8',
      fillOpacity: 1,
      radius: 4
    }).addTo(this.state.layer);
    
    // If we have at least 2 points, draw a line
    if (this.state.points.length > 1) {
      const lastIndex = this.state.points.length - 1;
      const line = L.polyline([
        this.state.points[lastIndex - 1],
        this.state.points[lastIndex]
      ], {
        color: '#0078A8',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 7'
      }).addTo(this.state.layer);
      
      // Calculate distance
      const distance = distanceCalculator.calculateDistance(
        this.state.points[lastIndex - 1],
        this.state.points[lastIndex]
      );
      
      // Show distance label
      const midPoint = L.latLngBounds(
        this.state.points[lastIndex - 1],
        this.state.points[lastIndex]
      ).getCenter();
      
      L.marker(midPoint, {
        icon: L.divIcon({
          className: 'distance-label',
          html: `${distance.miles.toFixed(1)} mi<br>${distance.km.toFixed(1)} km`,
          iconSize: [100, 40],
          iconAnchor: [50, 20]
        })
      }).addTo(this.state.layer);
    }
  }
  
  /**
   * Finish measurement mode
   */
  private finishMeasurement(): void {
    if (!this.state.active) return;
    
    // Update state
    this.state.active = false;
    
    // Reset map
    this.map.getContainer().style.cursor = '';
    
    // Remove event handlers
    if (this.measureClickHandler) {
      this.map.off('click', this.measureClickHandler);
      this.map.off('dblclick', this.finishMeasurement.bind(this));
      this.measureClickHandler = null;
    }
    
    // Hide instructions
    if (this.instructionsElement) {
      this.instructionsElement.style.display = 'none';
    }
    
    // Reset button styles
    const button = document.querySelector('.measure-button') as HTMLElement;
    if (button) {
      button.style.backgroundColor = '';
      button.style.color = '';
    }
    
    // Calculate total distance if we have multiple points
    if (this.state.points.length > 1) {
      const totalDistance = distanceCalculator.calculatePathDistance(this.state.points);
      
      // Show total distance toast
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
      
      // Add button event listeners
      setTimeout(() => {
        const clearBtn = document.getElementById('clear-measurements-btn');
        const dismissBtn = document.getElementById('dismiss-toast-btn');
        
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            if (this.state.layer) {
              this.map.removeLayer(this.state.layer);
              this.state.layer = null;
            }
          });
        }
      }, 0);
    }
  }
}