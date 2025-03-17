/**
 * IxMaps - Scale Manager Initialization
 * Initialize the scale manager after the map is loaded
 */

document.addEventListener('DOMContentLoaded', function() {
    // Store the original initMap function
    const originalInitMap = window.initMap;
    
    // Override the initMap function to add our scale manager
    window.initMap = function() {
      // Call the original function
      const result = originalInitMap.apply(this, arguments);
      
      // Initialize scale manager after map is loaded
      setTimeout(initScaleManager, 1000);
      
      return result;
    };
    
    /**
     * Initialize the scale manager
     */
    function initScaleManager() {
      // Find the Leaflet map instance
      const mapElement = document.getElementById('map');
      if (!mapElement || !mapElement._leaflet_id) {
        console.error('Map not found or not initialized. Retrying in 1 second...');
        setTimeout(initScaleManager, 1000);
        return;
      }
      
      // Get the map instance
      const map = L.DomUtil.get(mapElement)._leaflet;
      
      if (!map) {
        console.error('Could not find Leaflet map instance. Retrying in 1 second...');
        setTimeout(initScaleManager, 1000);
        return;
      }
      
      // Get dimensions from map config
      let svgWidth = 1920;
      let svgHeight = 1080;
      
      // Try to get dimensions from window or map options
      if (map.options && map.options.svgWidth && map.options.svgHeight) {
        svgWidth = map.options.svgWidth;
        svgHeight = map.options.svgHeight;
      } else if (window.mapConfig) {
        svgWidth = window.mapConfig.svgWidth || svgWidth;
        svgHeight = window.mapConfig.svgHeight || svgHeight;
      }
      
      // Create the scale manager
      const scaleManager = new IxMapScaleManager({
        svgWidth: svgWidth,
        svgHeight: svgHeight
      });
      
      // Add to map
      scaleManager.addToMap(map);
      
      // Make available globally
      window.ixMapScaleManager = scaleManager;
      
      // Show notification
      if (window.showToast) {
        window.showToast('Scale manager initialized. Use the ⚖️ button to adjust map scale.', 'info', 5000);
      }
    }
  });