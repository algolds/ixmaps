import { GeoCoordinates, SvgCoordinates } from '../types';
import { VISIBLE_BOUNDS, PRIME_MERIDIAN_REF, MAP_CONFIG } from '../utils/constants';
import { formatCoord } from '../utils/helpers';
import * as L from 'leaflet';

/**
 * Service for coordinate system calculations and conversions
 */
export class CoordinateSystem {
  private static instance: CoordinateSystem;
  private map: L.Map | null = null;
  private gridLayer: L.LayerGroup | null = null;
  private primeMeridianLayer: L.LayerGroup | null = null;
  private primeMeridianSvg: SvgCoordinates | null = null;
  private coordDisplay: HTMLElement | null = null;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CoordinateSystem {
    if (!CoordinateSystem.instance) {
      CoordinateSystem.instance = new CoordinateSystem();
    }
    return CoordinateSystem.instance;
  }
  
  /**
   * Private constructor (use getInstance instead)
   */
  private constructor() {}
  
  /**
   * Initialize the coordinate system
   * @param map - Leaflet map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
    
    // Create layers
    this.gridLayer = L.layerGroup().addTo(map);
    this.primeMeridianLayer = L.layerGroup();
    
    // Calculate prime meridian position
    this.primeMeridianSvg = this.latLngToSvg(PRIME_MERIDIAN_REF.lat, PRIME_MERIDIAN_REF.lng);
    
    // Add coordinate display
    this.addCoordinateDisplay();
    
    // Draw initial grid
    this.drawGrid();
    
    // Add event handlers
    map.on('mousemove', this.updateCoordinateDisplay.bind(this));
    map.on('click', this.addCoordinateMarker.bind(this));
    map.on('zoomend', this.updateGrid.bind(this));
    map.on('moveend', this.updateGrid.bind(this));
    
    // Add coordinate control panel
    this.addCoordinateControlPanel();
  }
  
  /**
   * Convert SVG coordinates to geographic coordinates
   * @param x - SVG x coordinate
   * @param y - SVG y coordinate
   * @returns Geographic coordinates {lat, lng}
   */
  public svgToLatLng(x: number, y: number): GeoCoordinates {
    // Map y-coordinate to latitude range with proper N/S orientation
    const latRange = VISIBLE_BOUNDS.northLat - VISIBLE_BOUNDS.southLat;
    
    // Invert latitude calculation to correct hemisphere
    const lat = -1 * (VISIBLE_BOUNDS.southLat + (y / MAP_CONFIG.svgHeight * latRange));
    
    // Calculate longitude in standard way
    const lng = (x / MAP_CONFIG.svgWidth * 360) - 180;
    
    return { lat, lng };
  }
  
  /**
   * Convert geographic coordinates to SVG coordinates
   * @param lat - Latitude in geographic coordinates
   * @param lng - Longitude in geographic coordinates
   * @returns SVG coordinates {x, y}
   */
  public latLngToSvg(lat: number, lng: number): SvgCoordinates {
    // Invert latitude for correct hemisphere mapping
    const invertedLat = -lat;
    
    // Clamp to visible bounds
    const clampedLat = Math.max(VISIBLE_BOUNDS.southLat, Math.min(VISIBLE_BOUNDS.northLat, invertedLat));
    
    // Convert latitude to y coordinate
    const latRange = VISIBLE_BOUNDS.northLat - VISIBLE_BOUNDS.southLat;
    const y = ((clampedLat - VISIBLE_BOUNDS.southLat) / latRange) * MAP_CONFIG.svgHeight;
    
    // Convert longitude to x coordinate with wraparound
    const normalizedLng = ((lng + 180) % 360) / 360;
    const x = normalizedLng * MAP_CONFIG.svgWidth;
    
    return { x, y };
  }
  
  /**
   * Convert SVG coordinates to custom lat/lng using prime meridian as reference
   * @param x - SVG x coordinate
   * @param y - SVG y coordinate
   * @returns Geographic coordinates with lng relative to prime meridian
   */
  public svgToCustomLatLng(x: number, y: number): GeoCoordinates {
    if (!this.primeMeridianSvg) {
      console.error("Prime meridian reference not initialized");
      return { lat: 0, lng: 0 };
    }
    
    // Calculate latitude with proper hemisphere orientation
    const latRange = VISIBLE_BOUNDS.northLat - VISIBLE_BOUNDS.southLat;
    const lat = 1 * (VISIBLE_BOUNDS.southLat + (y / MAP_CONFIG.svgHeight * latRange));
    
    // Calculate longitude relative to prime meridian with wraparound
    const normalizedX = ((x % MAP_CONFIG.svgWidth) + MAP_CONFIG.svgWidth) % MAP_CONFIG.svgWidth;
    const normalizedPrimeMeridianX = ((this.primeMeridianSvg.x % MAP_CONFIG.svgWidth) + MAP_CONFIG.svgWidth) % MAP_CONFIG.svgWidth;
    
    let lngOffset = normalizedX - normalizedPrimeMeridianX;
    
    // Minimize the offset to handle wraparound edge cases
    if (Math.abs(lngOffset) > MAP_CONFIG.svgWidth / 2) {
      if (lngOffset > 0) {
        lngOffset -= MAP_CONFIG.svgWidth;
      } else {
        lngOffset += MAP_CONFIG.svgWidth;
      }
    }
    
    const lngScale = 360 / MAP_CONFIG.svgWidth;
    const lng = lngOffset * lngScale;
    
    return { lat, lng };
  }
  
  /**
   * Draw coordinate grid based on zoom level
   */
  public drawGrid(): void {
    if (!this.map || !this.gridLayer) return;
    
    // Clear existing grid
    this.gridLayer.clearLayers();
    
    const zoom = this.map.getZoom();
    
    // Adjust grid spacing based on zoom
    let spacing = 30; // Default 30 degree spacing
    if (zoom > 3) spacing = 15; // At higher zoom, use 15 degrees
    if (zoom > 4) spacing = 10; // Even higher zoom, use 10 degrees
    if (zoom > 5) spacing = 5;  // At highest zoom, use 5 degrees
    
    // Show or hide labels based on checkbox
    const labelsCheckbox = document.getElementById('toggle-coords-labels') as HTMLInputElement;
    const showLabels = labelsCheckbox ? labelsCheckbox.checked : true;
    
    // Get prime meridian x position
    const primeMeridianX = this.primeMeridianSvg ? this.primeMeridianSvg.x : MAP_CONFIG.primeMeridianX;
    
    // Get visible bounds in SVG coordinates
    const southPoint = this.latLngToSvg(VISIBLE_BOUNDS.southLat, 0);
    const northPoint = this.latLngToSvg(VISIBLE_BOUNDS.northLat, 0);
    
    // Get current view bounds for clipping
    const bounds = this.map.getBounds();
    const visibleWest = bounds.getWest();
    const visibleEast = bounds.getEast();
    
    // Add buffer to ensure grid lines appear smoothly when scrolling
    const bufferWidth = MAP_CONFIG.svgWidth * 0.1; // 10% buffer
    
    // Calculate pixels per degree for longitude
    const pixelsPerDegree = MAP_CONFIG.svgWidth / 360;
    
    // Track labeled positions to prevent overlap
    const labeledPositions: number[] = [];
    const LABEL_MIN_DISTANCE = 50; // Minimum distance between labels in pixels
    
    /**
     * Check if a new label position would overlap with existing ones
     * @param position - X position for the label
     * @returns true if position is safe (no overlap), false otherwise
     */
    const isLabelPositionSafe = (position: number): boolean => {
      for (let i = 0; i < labeledPositions.length; i++) {
        if (Math.abs(position - labeledPositions[i]) < LABEL_MIN_DISTANCE) {
          return false;
        }
      }
      return true;
    };
    
    // Draw the prime meridian (0°) and its wrapped instances
    const drawMeridian = (xPosition: number): void => {
      if (xPosition >= visibleWest - bufferWidth && xPosition <= visibleEast + bufferWidth) {
        L.polyline([
          [southPoint.y, xPosition], // Bottom of visible map
          [northPoint.y, xPosition]  // Top of visible map
        ], {
          color: '#FF8000', // Orange for prime meridian
          weight: 2,
          opacity: 0.8,
          dashArray: '8,6'
        }).addTo(this.gridLayer!);
      
      // Draw wrapped copies
      L.polyline([
        [southPoint.y, svgX - MAP_CONFIG.svgWidth], 
        [northPoint.y, svgX - MAP_CONFIG.svgWidth]
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).addTo(this.gridLayer!);
      
      L.polyline([
        [southPoint.y, svgX + MAP_CONFIG.svgWidth], 
        [northPoint.y, svgX + MAP_CONFIG.svgWidth]
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).addTo(this.gridLayer!);
      
      // Add label if it's a major line and labels are enabled
      if (isMajor && showLabels) {
        // Try all positions and add the first one that's safe
        if (svgX >= visibleWest && svgX <= visibleEast && isLabelPositionSafe(svgX)) {
          this.addLongitudeLabel(svgX, `${lng}° W`);
        } else if (svgX - MAP_CONFIG.svgWidth >= visibleWest && 
                   svgX - MAP_CONFIG.svgWidth <= visibleEast && 
                   isLabelPositionSafe(svgX - MAP_CONFIG.svgWidth)) {
          this.addLongitudeLabel(svgX - MAP_CONFIG.svgWidth, `${lng}° W`);
        } else if (svgX + MAP_CONFIG.svgWidth >= visibleWest && 
                  svgX + MAP_CONFIG.svgWidth <= visibleEast && 
                  isLabelPositionSafe(svgX + MAP_CONFIG.svgWidth)) {
          this.addLongitudeLabel(svgX + MAP_CONFIG.svgWidth, `${lng}° W`);
        }
      }
    }
    
    // Draw latitude lines - only within visible bounds
    for (let lat = Math.ceil(VISIBLE_BOUNDS.southLat / spacing) * spacing; 
         lat <= VISIBLE_BOUNDS.northLat; 
         lat += spacing) {
      
      const isMajor = lat % 30 === 0;
      const isEquator = Math.abs(lat) < 0.001;
      
      // Get SVG coordinates for this latitude
      const svgY = this.latLngToSvg(lat, 0).y;
      
      // Draw the line across the full visible width
      const visibleWidth = visibleEast - visibleWest + (2 * bufferWidth);
      const lineStart = visibleWest - bufferWidth;
      
      L.polyline([
        [svgY, lineStart], // Left side of visible area with buffer
        [svgY, lineStart + visibleWidth] // Right side of visible area with buffer
      ], {
        color: isEquator ? '#FF4500' : '#666',
        weight: (isMajor || isEquator) ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: (isMajor || isEquator) ? null : '3,5'
      }).addTo(this.gridLayer!);
      
      // Add label if needed
      if ((isMajor || isEquator) && showLabels) {
        const labelPos = L.latLng(svgY, visibleWest + 20);
        
        // Correct the display of N/S labels
        const displayLat = -lat; // Invert for display
        
        L.marker(labelPos, {
          icon: L.divIcon({
            className: 'grid-label',
            html: `${Math.abs(displayLat)}° ${displayLat >= 0 ? 'N' : 'S'}`,
            iconSize: [40, 20],
            iconAnchor: [0, 10]
          })
        }).addTo(this.gridLayer!);
      }
    }
  }
  
  /**
   * Add a longitude label to the grid
   * @param xPosition - X position for the label
   * @param labelText - Text for the label
   */
  private addLongitudeLabel(xPosition: number, labelText: string): void {
    if (!this.gridLayer) return;
    
    const southPoint = this.latLngToSvg(VISIBLE_BOUNDS.southLat, 0);
    const labelPos = L.latLng(southPoint.y + 20, xPosition);
    
    L.marker(labelPos, {
      icon: L.divIcon({
        className: 'grid-label',
        html: labelText,
        iconSize: [40, 20],
        iconAnchor: [20, 0]
      })
    }).addTo(this.gridLayer);
    
    // The calling function will track label positions
  }
  
  /**
   * Draw prime meridian with proper wraparound
   */
  public drawPrimeMeridian(): void {
    if (!this.map || !this.primeMeridianLayer || !this.primeMeridianSvg) return;
    
    // Clear existing layers
    this.primeMeridianLayer.clearLayers();
    
    // Get SVG coordinates for visible bounds
    const southPoint = this.latLngToSvg(VISIBLE_BOUNDS.southLat, 0);
    const northPoint = this.latLngToSvg(VISIBLE_BOUNDS.northLat, 0);
    
    // Get current map view bounds
    const bounds = this.map.getBounds();
    const westBound = bounds.getWest();
    const eastBound = bounds.getEast();
    
    // Add buffer for smooth appearance/disappearance
    const bufferWidth = MAP_CONFIG.svgWidth * 0.1;
    
    // Function to draw a meridian instance
    const drawMeridianLine = (xPosition: number): void => {
      // Only draw if in visible area (with buffer)
      if (xPosition >= westBound - bufferWidth && xPosition <= eastBound + bufferWidth) {
        // Draw the meridian line
        L.polyline([
          [southPoint.y, xPosition], 
          [northPoint.y, xPosition]
        ], {
          color: '#FF8000',
          weight: 2.5,
          opacity: 0.8,
          dashArray: '8,6'
        }).addTo(this.primeMeridianLayer!);
        
        // Add meridian label
        L.marker(L.latLng(southPoint.y - 20, xPosition), {
          icon: L.divIcon({
            className: 'prime-meridian-label',
            html: 'Prime Meridian (0°)',
            iconSize: [120, 30],
            iconAnchor: [60, 15]
          })
        }).addTo(this.primeMeridianLayer!);
        
        // Add reference point marker
        const markerY = this.primeMeridianSvg!.y;
        if (markerY >= southPoint.y && markerY <= northPoint.y) {
          L.circleMarker(L.latLng(markerY, xPosition), {
            radius: 8,
            color: '#FF8000',
            fillColor: '#FFFF00',
            fillOpacity: 0.7,
            weight: 2
          }).bindPopup(`
            <strong>Prime Meridian Reference</strong><br>
            Geographic: ${formatCoord(Math.abs(PRIME_MERIDIAN_REF.lat), 'S', 'N')}, ${formatCoord(PRIME_MERIDIAN_REF.lng, 'E', 'W')}<br>
            Map Reference: 0° Longitude
          `).addTo(this.primeMeridianLayer!);
        }
      }
    };
    
    // Draw all instances of the meridian
    drawMeridianLine(this.primeMeridianSvg.x);  // Original
    drawMeridianLine(this.primeMeridianSvg.x + MAP_CONFIG.svgWidth);  // Right wraparound
    drawMeridianLine(this.primeMeridianSvg.x - MAP_CONFIG.svgWidth);  // Left wraparound
  }
  
  /**
   * Update grid when map view changes
   */
  private updateGrid(): void {
    this.drawGrid();
    
    // Update prime meridian if visible
    const primeMeridianToggle = document.getElementById('toggle-prime-meridian') as HTMLInputElement;
    if (primeMeridianToggle && primeMeridianToggle.checked) {
      this.drawPrimeMeridian();
    }
  }
  
  /**
   * Add coordinate display to the map
   */
  private addCoordinateDisplay(): void {
    if (!this.map) return;
    
    // Create coordinate display control
    const CoordDisplayControl = L.Control.extend({
      options: {
        position: 'bottomleft'
      },
      
      onAdd: () => {
        const container = L.DomUtil.create('div', 'ixmap-coordinates-display');
        container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        container.style.padding = '5px 10px';
        container.style.border = '2px solid rgba(0, 0, 0, 0.2)';
        container.style.borderRadius = '4px';
        container.style.fontFamily = 'monospace';
        container.style.fontSize = '12px';
        container.innerHTML = 'Lat: 0.00° N, Lng: 0.00° E';
        
        this.coordDisplay = container;
        return container;
      }
    });
    
    // Add control to map
    new CoordDisplayControl().addTo(this.map);
  }
  
  /**
   * Add coordinate control panel to the map
   */
  private addCoordinateControlPanel(): void {
    if (!this.map) return;
    
    // Create coordinate control panel
    const CoordControlPanel = L.Control.extend({
      options: {
        position: 'topright'
      },
      
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-control coord-system-control');
        container.style.backgroundColor = 'white';
        container.style.padding = '6px 10px';
        container.style.borderRadius = '4px';
        container.style.border = '2px solid rgba(0, 0, 0, 0.2)';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        container.style.cursor = 'auto';
        container.style.fontSize = '12px';
        container.style.marginBottom = '5px';
        
        // Prevent events from propagating to map
        L.DomEvent.disableClickPropagation(container);
        
        // Add control options
        container.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">Coordinates</div>
          <div style="margin-bottom: 4px;">
            <label style="display: flex; align-items: center; font-size: 12px;">
              <input type="checkbox" id="toggle-coords-display" checked>
              <span style="margin-left: 5px;">Show Position</span>
            </label>
          </div>
          <div style="margin-bottom: 4px;">
            <label style="display: flex; align-items: center; font-size: 12px;">
              <input type="checkbox" id="toggle-coords-grid" checked>
              <span style="margin-left: 5px;">Show Grid</span>
            </label>
          </div>
          <div>
            <label style="display: flex; align-items: center; font-size: 12px;">
              <input type="checkbox" id="toggle-coords-labels" checked>
              <span style="margin-left: 5px;">Show Labels</span>
            </label>
          </div>
          <div style="margin-top: 8px; border-top: 1px solid #ddd; padding-top: 8px;">
            <div style="margin-bottom: 4px; font-weight: bold;">Prime Meridian</div>
            <div>
              <label style="display: flex; align-items: center; font-size: 12px;">
                <input type="checkbox" id="toggle-prime-meridian">
                <span style="margin-left: 5px;">Show Prime Meridian</span>
              </label>
            </div>
          </div>
        `;
        
        return container;
      }
    });
    
    // Add control to map
    new CoordControlPanel().addTo(this.map);
    
    // Add toggle button for coordinate panel
    const CoordToggleControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control coordinate-toggle-control');
        
        const link = L.DomUtil.create('a', 'coordinate-toggle-link', container);
        link.href = '#';
        link.title = 'Toggle Coordinate Panel';
        link.innerHTML = '🌐';
        link.style.fontSize = '16px';
        link.style.lineHeight = '26px';
        link.style.textAlign = 'center';
        link.style.fontWeight = 'bold';
        
        L.DomEvent
          .on(link, 'click', L.DomEvent.stopPropagation)
          .on(link, 'click', L.DomEvent.preventDefault)
          .on(link, 'click', () => {
            const panel = document.querySelector('.coord-system-control');
            if (panel) {
              panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
          });
        
        L.DomEvent.on(container, 'mousedown', L.DomEvent.stopPropagation);
        
        return container;
      }
    });
    
    // Add toggle control to map
    new CoordToggleControl().addTo(this.map);
    
    // Set up event handlers for control panel checkboxes
    this.setupControlPanelHandlers();
  }
  
  /**
   * Set up event handlers for coordinate control panel
   */
  private setupControlPanelHandlers(): void {
    setTimeout(() => {
      // Toggle coordinate display
      const displayToggle = document.getElementById('toggle-coords-display') as HTMLInputElement;
      if (displayToggle) {
        displayToggle.addEventListener('change', () => {
          if (this.coordDisplay) {
            this.coordDisplay.style.display = displayToggle.checked ? 'block' : 'none';
          }
        });
      }
      
      // Toggle grid
      const gridToggle = document.getElementById('toggle-coords-grid') as HTMLInputElement;
      if (gridToggle && this.map && this.gridLayer) {
        gridToggle.addEventListener('change', () => {
          if (gridToggle.checked) {
            this.map?.addLayer(this.gridLayer!);
            this.drawGrid();
          } else {
            this.map?.removeLayer(this.gridLayer!);
          }
        });
      }
      
      // Toggle labels
      const labelsToggle = document.getElementById('toggle-coords-labels') as HTMLInputElement;
      if (labelsToggle) {
        labelsToggle.addEventListener('change', () => {
          this.drawGrid();
        });
      }
      
      // Toggle prime meridian
      const meridianToggle = document.getElementById('toggle-prime-meridian') as HTMLInputElement;
      if (meridianToggle && this.map && this.primeMeridianLayer) {
        meridianToggle.addEventListener('change', () => {
          if (meridianToggle.checked) {
            this.map?.addLayer(this.primeMeridianLayer!);
            this.drawPrimeMeridian();
          } else {
            this.map?.removeLayer(this.primeMeridianLayer!);
          }
        });
      }
    }, 500);
  }
  
  /**
   * Update coordinate display on mouse move
   * @param e - Mouse event
   */
  private updateCoordinateDisplay(e: L.LeafletMouseEvent): void {
    if (!this.coordDisplay) return;
    
    const customCoord = this.svgToCustomLatLng(e.latlng.lng, e.latlng.lat);
    
    this.coordDisplay.innerHTML = `
      <div>Lat: ${formatCoord(customCoord.lat, 'N', 'S')}</div>
      <div>Lng: ${formatCoord(customCoord.lng, 'E', 'W')}</div>
    `;
  }
  
  /**
   * Add coordinate marker when clicking on map
   * @param e - Click event
   */
  private addCoordinateMarker(e: L.LeafletMouseEvent): void {
    if (!this.map) return;
    
    // Remove existing marker
    if ((window as any).clickMarker) {
      this.map.removeLayer((window as any).clickMarker);
    }
    
    // Get coordinates using custom system
    const customCoord = this.svgToCustomLatLng(e.latlng.lng, e.latlng.lat);
    
    // Create marker
    (window as any).clickMarker = L.circleMarker(e.latlng, {
      radius: 5,
      color: '#FF4500',
      fillColor: '#FFA07A',
      fillOpacity: 1,
      weight: 2
    }).addTo(this.map);
    
    // Create popup with coordinates
    const coordText = `
      <div style="text-align:center;">
        <strong>Coordinates:</strong><br>
        Lat: ${formatCoord(customCoord.lat, 'N', 'S')}<br>
        Lng: ${formatCoord(customCoord.lng, 'E', 'W')}
      </div>
    `;
    
    (window as any).clickMarker.bindPopup(coordText).openPopup();
    
    // Show toast notification
    if (typeof (window as any).showToast === 'function') {
      (window as any).showToast(`Clicked at Lat: ${formatCoord(customCoord.lat, 'N', 'S')}, Lng: ${formatCoord(customCoord.lng, 'E', 'W')}`, 'info', 3000);
    }
  }
}

// Export singleton instance
export const coordinateSystem = CoordinateSystem.getInstance();dTo(this.gridLayer!);
        
        // Prime meridian label
        if (showLabels) {
          const meridianLabelPos = L.latLng(southPoint.y + 20, xPosition);
          // Add label only if it won't overlap with existing ones
          if (isLabelPositionSafe(xPosition)) {
            L.marker(meridianLabelPos, {
              icon: L.divIcon({
                className: 'grid-label prime-meridian-label',
                html: '0°',
                iconSize: [40, 20],
                iconAnchor: [20, 0]
              })
            }).addTo(this.gridLayer!);
            
            // Record this position
            labeledPositions.push(xPosition);
          }
        }
      }
    };
    
    // Draw all instances of prime meridian
    drawMeridian(primeMeridianX);
    drawMeridian(primeMeridianX + MAP_CONFIG.svgWidth);  // Right wraparound
    drawMeridian(primeMeridianX - MAP_CONFIG.svgWidth);  // Left wraparound
    
    // Calculate how many grid lines we need
    const maxLines = Math.ceil(360 / spacing);
    
    // Draw lines east of prime meridian
    for (let i = 1; i <= maxLines; i++) {
      const lng = i * spacing;
      const isMajor = lng % 30 === 0;
      
      // Calculate pixels from prime meridian
      const offsetPixels = lng * pixelsPerDegree;
      
      // Draw original line and wraparounds
      const svgX = primeMeridianX + offsetPixels;
      
      // Draw the line
      L.polyline([
        [southPoint.y, svgX], // Bottom of visible map
        [northPoint.y, svgX]  // Top of visible map
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).addTo(this.gridLayer!);
      
      // Draw wrapped copies
      L.polyline([
        [southPoint.y, svgX - MAP_CONFIG.svgWidth], 
        [northPoint.y, svgX - MAP_CONFIG.svgWidth]
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).addTo(this.gridLayer!);
      
      L.polyline([
        [southPoint.y, svgX + MAP_CONFIG.svgWidth], 
        [northPoint.y, svgX + MAP_CONFIG.svgWidth]
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).addTo(this.gridLayer!);
      
      // Add label if it's a major line and labels are enabled
      if (isMajor && showLabels) {
        // Try all positions and add the first one that's safe
        if (svgX >= visibleWest && svgX <= visibleEast && isLabelPositionSafe(svgX)) {
          this.addLongitudeLabel(svgX, `${lng}° E`);
        } else if (svgX - MAP_CONFIG.svgWidth >= visibleWest && 
                   svgX - MAP_CONFIG.svgWidth <= visibleEast && 
                   isLabelPositionSafe(svgX - MAP_CONFIG.svgWidth)) {
          this.addLongitudeLabel(svgX - MAP_CONFIG.svgWidth, `${lng}° E`);
        } else if (svgX + MAP_CONFIG.svgWidth >= visibleWest && 
                  svgX + MAP_CONFIG.svgWidth <= visibleEast && 
                  isLabelPositionSafe(svgX + MAP_CONFIG.svgWidth)) {
          this.addLongitudeLabel(svgX + MAP_CONFIG.svgWidth, `${lng}° E`);
        }
      }
    }
    
    // Draw lines west of prime meridian
    for (let i = 1; i <= maxLines; i++) {
      const lng = i * spacing;
      const isMajor = lng % 30 === 0;
      
      // Calculate pixels from prime meridian
      const offsetPixels = lng * pixelsPerDegree;
      
      // Draw original line and wraparounds
      const svgX = primeMeridianX - offsetPixels;
      
      // Draw the line
      L.polyline([
        [southPoint.y, svgX], // Bottom of visible map
        [northPoint.y, svgX]  // Top of visible map
      ], {
        color: '#666',
        weight: isMajor ? 1.5 : 0.8,
        opacity: 0.6,
        dashArray: isMajor ? null : '3,5'
      }).ad