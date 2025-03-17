/**
 * IxMaps - Scale Adjustment System
 * Allows dynamic adjustment of the map scale and all subsystems by a percentage
 */

class IxMapScaleManager {
    constructor(options = {}) {
      // Store map instance
      this.map = null;
      
      // Reference to main SVG layers
      this.mainLayer = null;
      this.leftMainLayer = null;
      this.rightMainLayer = null;
      
      // Store original SVG dimensions
      this.originalWidth = options.svgWidth || 1920;
      this.originalHeight = options.svgHeight || 1080;
      
      // Current dimensions (start with originals)
      this.currentWidth = this.originalWidth;
      this.currentHeight = this.originalHeight;
      
      // Current scale factor (1.0 = 100%, 1.5 = 150%, etc.)
      this.scaleFactor = 1.0;
      
      // Keep track of other layers (climate, etc.)
      this.additionalLayers = [];
      
      // Map boundary calculation constants
      this.mapBounds = null;
      
      // Coordinate system adjustment constants
      this.coordSystemFactor = 1.0;
      
      // Bind methods to maintain scope
      this.adjustScale = this.adjustScale.bind(this);
      this.resetScale = this.resetScale.bind(this);
      
      // Create scale adjustment UI
      this.createScaleUI();
    }
    
    /**
     * Attach to the map
     * @param {L.Map} map - Leaflet map instance
     */
    attachToMap(map) {
      this.map = map;
      
      // Try to find main layer after map is loaded
      this.detectLayers();
      
      // Set up detection on layer add events
      map.on('layeradd', this.detectLayers.bind(this));
      
      return this;
    }
    
    /**
     * Detect layers to manage
     */
    detectLayers() {
      if (!this.map) return;
      
      // Find image overlays in the map
      this.map.eachLayer(layer => {
        if (layer instanceof L.ImageOverlay) {
          // Main layer should be the first with a bound width matching our original width
          if (!this.mainLayer && 
              layer._bounds && 
              Math.round(layer._bounds.getEast() - layer._bounds.getWest()) === this.currentWidth) {
            this.mainLayer = layer;
          }
          
          // Track all image overlays for scaling
          if (!this.additionalLayers.includes(layer)) {
            this.additionalLayers.push(layer);
          }
        }
      });
      
      // Store the current map bounds
      if (this.mainLayer && this.mainLayer._bounds) {
        this.mapBounds = this.mainLayer._bounds;
      }
    }
    
    /**
     * Create scale adjustment UI
     */
    createScaleUI() {
      // Create UI container
      const container = document.createElement('div');
      container.className = 'scale-adjustment-container';
      container.style.position = 'absolute';
      container.style.left = '10px';
      container.style.top = '10px';
      container.style.padding = '10px';
      container.style.backgroundColor = 'white';
      container.style.border = '1px solid #ccc';
      container.style.borderRadius = '4px';
      container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      container.style.zIndex = '1000';
      container.style.minWidth = '200px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      
      // Create header with drag handle
      const header = document.createElement('div');
      header.className = 'scale-header';
      header.style.marginBottom = '8px';
      header.style.cursor = 'move';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      
      const title = document.createElement('div');
      title.textContent = 'Map Scale Control';
      title.style.fontWeight = 'bold';
      title.style.fontSize = '14px';
      
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.border = 'none';
      closeButton.style.background = 'none';
      closeButton.style.fontSize = '18px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.padding = '0 5px';
      closeButton.style.marginLeft = '10px';
      
      header.appendChild(title);
      header.appendChild(closeButton);
      
      // Add scale control slider
      const sliderContainer = document.createElement('div');
      sliderContainer.style.display = 'flex';
      sliderContainer.style.flexDirection = 'column';
      sliderContainer.style.gap = '5px';
      
      const sliderLabel = document.createElement('label');
      sliderLabel.textContent = 'Scale Adjustment';
      sliderLabel.style.fontSize = '12px';
      
      const sliderRow = document.createElement('div');
      sliderRow.style.display = 'flex';
      sliderRow.style.alignItems = 'center';
      sliderRow.style.gap = '10px';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '50';  // 50% of original scale
      slider.max = '200'; // 200% of original scale
      slider.value = '100'; // Default 100%
      slider.style.flex = '1';
      slider.style.height = '20px';
      
      const valueDisplay = document.createElement('div');
      valueDisplay.textContent = '100%';
      valueDisplay.style.minWidth = '45px';
      valueDisplay.style.textAlign = 'right';
      valueDisplay.style.fontSize = '12px';
      
      sliderRow.appendChild(slider);
      sliderRow.appendChild(valueDisplay);
      
      sliderContainer.appendChild(sliderLabel);
      sliderContainer.appendChild(sliderRow);
      
      // Add buttons
      const buttonRow = document.createElement('div');
      buttonRow.style.display = 'flex';
      buttonRow.style.justifyContent = 'space-between';
      buttonRow.style.marginTop = '5px';
      
      const resetButton = document.createElement('button');
      resetButton.textContent = 'Reset Scale';
      resetButton.style.padding = '5px 10px';
      resetButton.style.backgroundColor = '#f1f1f1';
      resetButton.style.border = '1px solid #ccc';
      resetButton.style.borderRadius = '3px';
      resetButton.style.cursor = 'pointer';
      resetButton.style.fontSize = '12px';
      
      const applyButton = document.createElement('button');
      applyButton.textContent = 'Apply';
      applyButton.style.padding = '5px 10px';
      applyButton.style.backgroundColor = '#3498db';
      applyButton.style.color = 'white';
      applyButton.style.border = '1px solid #2980b9';
      applyButton.style.borderRadius = '3px';
      applyButton.style.cursor = 'pointer';
      applyButton.style.fontSize = '12px';
      
      buttonRow.appendChild(resetButton);
      buttonRow.appendChild(applyButton);
      
      // Add percentage input
      const percentContainer = document.createElement('div');
      percentContainer.style.display = 'flex';
      percentContainer.style.alignItems = 'center';
      percentContainer.style.gap = '5px';
      
      const percentLabel = document.createElement('label');
      percentLabel.textContent = 'Exact %:';
      percentLabel.style.fontSize = '12px';
      
      const percentInput = document.createElement('input');
      percentInput.type = 'number';
      percentInput.min = '50';
      percentInput.max = '200';
      percentInput.value = '100';
      percentInput.style.width = '60px';
      percentInput.style.padding = '3px 5px';
      percentInput.style.border = '1px solid #ccc';
      percentInput.style.borderRadius = '3px';
      percentInput.style.fontSize = '12px';
      
      percentContainer.appendChild(percentLabel);
      percentContainer.appendChild(percentInput);
      
      // Assemble UI
      container.appendChild(header);
      container.appendChild(sliderContainer);
      container.appendChild(percentContainer);
      container.appendChild(buttonRow);
      
      // Hide by default
      container.style.display = 'none';
      
      // Add event listeners
      
      // Slide event
      slider.addEventListener('input', function() {
        const value = parseFloat(slider.value);
        valueDisplay.textContent = `${value}%`;
        percentInput.value = value;
      });
      
      // Percent input event
      percentInput.addEventListener('input', function() {
        const value = parseInt(percentInput.value, 10);
        if (value >= 50 && value <= 200) {
          slider.value = value;
          valueDisplay.textContent = `${value}%`;
        }
      });
      
      // Apply button
      applyButton.addEventListener('click', () => {
        const percent = parseInt(slider.value, 10);
        this.adjustScale(percent / 100);
      });
      
      // Reset button
      resetButton.addEventListener('click', () => {
        this.resetScale();
        slider.value = 100;
        percentInput.value = 100;
        valueDisplay.textContent = '100%';
      });
      
      // Close button
      closeButton.addEventListener('click', () => {
        container.style.display = 'none';
      });
      
      // Make the container draggable
      this.makeDraggable(container, header);
      
      // Add to document
      document.body.appendChild(container);
      
      // Create toggle button in the leaflet controls
      const ScaleControlToggle = L.Control.extend({
        options: {
          position: 'topleft'
        },
        
        onAdd: function() {
          const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control scale-toggle');
          button.innerHTML = '<a href="#" title="Scale Control" style="font-weight: bold; line-height: 26px; font-size: 18px; text-align: center; height: 30px; width: 30px;">⚖️</a>';
          
          L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            // Toggle scale control
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
          });
          
          return button;
        }
      });
      
      // Store references
      this.scaleControl = container;
      this.scaleSlider = slider;
      this.percentInput = percentInput;
      this.valueDisplay = valueDisplay;
      this.scaleControlToggle = new ScaleControlToggle();
    }
    
    /**
     * Make an element draggable
     */
    makeDraggable(element, handle) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      
      if (handle) {
        // If handle is specified, use it for dragging
        handle.onmousedown = dragMouseDown;
      } else {
        // Otherwise, use the whole element for dragging
        element.onmousedown = dragMouseDown;
      }
      
      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the initial mouse cursor position
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call function whenever the cursor moves
        document.onmousemove = elementDrag;
      }
      
      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
      }
      
      function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
    
    /**
     * Adjust the map scale by a factor
     * @param {number} factor - Scale factor (1.0 = 100%, 1.5 = 150%, etc.)
     */
    adjustScale(factor) {
      if (!this.map || !this.mapBounds) {
        console.warn('Map or bounds not initialized yet');
        return;
      }
      
      // Store the scale factor
      this.scaleFactor = factor;
      
      // Calculate new dimensions
      const newWidth = this.originalWidth * factor;
      const newHeight = this.originalHeight * factor;
      this.currentWidth = newWidth;
      this.currentHeight = newHeight;
      
      console.log(`Adjusting scale to ${factor * 100}%. New dimensions: ${newWidth}x${newHeight}`);
      
      // Store current center and zoom for maintaining view
      const currentCenter = this.map.getCenter();
      const currentZoom = this.map.getZoom();
      
      // Update all layers
      this.updateAllLayers(newWidth, newHeight);
      
      // Restore view after scale change
      this.map.setView(currentCenter, currentZoom, { animate: false });
      
      // Show notification
      this.showNotification(`Map scale adjusted to ${Math.round(factor * 100)}%`, 'success');
      
      // Update coordinate system if it exists
      this.updateCoordinateSystem();
      
      // Update distance scale
      this.updateDistanceScale();
    }
    
    /**
     * Reset the scale to original
     */
    resetScale() {
      this.adjustScale(1.0);
    }
    
    /**
     * Update all SVG layers with new dimensions
     */
    updateAllLayers(newWidth, newHeight) {
      // Calculate new bounds
      const newBounds = [
        [0, 0],
        [newHeight, newWidth]
      ];
      
      // Update main layer
      if (this.mainLayer) {
        this.mainLayer.setBounds(newBounds);
      }
      
      // Update all image overlays
      this.additionalLayers.forEach(layer => {
        if (layer._url && layer._bounds) {
          // Determine which type of layer this is (main, left, right)
          const isMainLayer = Math.round(layer._bounds.getEast()) === Math.round(this.mapBounds.getEast()) &&
                            Math.round(layer._bounds.getWest()) === Math.round(this.mapBounds.getWest());
                             
          const isLeftLayer = Math.round(layer._bounds.getEast()) === 0;
          const isRightLayer = Math.round(layer._bounds.getWest()) === Math.round(this.mapBounds.getEast());
          
          if (isMainLayer) {
            // Main layer
            layer.setBounds(newBounds);
          } else if (isLeftLayer) {
            // Left layer
            layer.setBounds([
              [0, -newWidth],
              [newHeight, 0]
            ]);
          } else if (isRightLayer) {
            // Right layer
            layer.setBounds([
              [0, newWidth],
              [newHeight, newWidth * 2]
            ]);
          }
        }
      });
      
      // Store new bounds
      this.mapBounds = L.latLngBounds(newBounds);
    }
    
    /**
     * Update coordinate system if it exists
     */
    updateCoordinateSystem() {
      // Check if the coordinate system exists
      if (window.ixMapCoordSystem) {
        // Update the SVG dimensions
        window.ixMapCoordSystem.svgWidth = this.currentWidth;
        window.ixMapCoordSystem.svgHeight = this.currentHeight;
        
        // Redraw the grid
        if (window.ixMapCoordSystem.clearGrid && window.ixMapCoordSystem.drawGrid) {
          window.ixMapCoordSystem.clearGrid();
          window.ixMapCoordSystem.drawGrid();
        }
      }
      
      // If using the direct implementation, redraw the grid
      const gridLayer = this.findGridLayer();
      if (gridLayer) {
        // Clear existing grid
        gridLayer.clearLayers();
        
        // Get the drawGrid function from window if it exists
        if (typeof window.drawGrid === 'function') {
          window.drawGrid();
        }
      }
    }
    
    /**
     * Find grid layer in the map
     */
    findGridLayer() {
      let gridLayer = null;
      
      if (this.map) {
        // Look for a layer group that might be the grid
        this.map.eachLayer(layer => {
          // Grid layer is usually a layer group with "grid" in its variable name
          // or we can check for characteristic properties
          if (layer instanceof L.LayerGroup) {
            // If the layer has many polylines, it's likely the grid
            let polylineCount = 0;
            layer.eachLayer(sublayer => {
              if (sublayer instanceof L.Polyline) {
                polylineCount++;
              }
            });
            
            // If the layer has many polylines (typical for a grid), assume it's the grid layer
            if (polylineCount > 10) {
              gridLayer = layer;
            }
          }
        });
      }
      
      return gridLayer;
    }
    
    /**
     * Update distance scale
     */
    updateDistanceScale() {
      // Find the scale control
      const scaleControl = document.querySelector('.custom-scale-control');
      if (scaleControl) {
        // Trigger the updateScale function if it exists on the window
        if (typeof window.updateScale === 'function') {
          window.updateScale();
        } else {
          // Try to trigger a zoom event to update the scale
          this.map.fire('zoomend');
        }
      }
    }
    
    /**
     * Show a notification
     */
    showNotification(message, type = 'info') {
      // Try to use the existing toast system if available
      if (typeof window.showToast === 'function') {
        window.showToast(message, type, 3000);
        return;
      }
      
      // Fallback to creating our own notification
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '10px 15px';
      notification.style.backgroundColor = type === 'error' ? '#e74c3c' : 
                                          type === 'success' ? '#2ecc71' : 
                                          type === 'warning' ? '#f39c12' : '#3498db';
      notification.style.color = 'white';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
      notification.style.zIndex = 10000;
      notification.style.transition = 'opacity 0.3s ease-in-out';
      
      document.body.appendChild(notification);
      
      // Fade out after delay
      setTimeout(() => {
        notification.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
    
    /**
     * Add control to map
     */
    addToMap(map) {
      this.attachToMap(map);
      
      // Add the toggle control to the map
      this.scaleControlToggle.addTo(map);
      
      return this;
    }
  }
  
  // Add to window to make globally available
  window.IxMapScaleManager = IxMapScaleManager;