// svg-layer-handler.js - Add to your public directory

/**
 * SVG Layer Handler for topographic map with altitude layers
 * Specifically designed for an SVG with Altitude-1 through Altitude-8 layers
 */
class SVGLayerHandler {
    constructor(mapSvgElement) {
      this.mapSvg = mapSvgElement;
      this.svgDoc = null;
      this.layerInfo = {
        altitude: [],
        water: null,
        lakes: null,
        rivers: null,
        coastline: null,
        background: null
      };
      
      // Color schemes
      this.colorSchemes = {
        topographic: {
          background: '#e6f7ff', // Light blue for ocean
          altitude: [
            '#d8f2ba', // Altitude-1: Lowlands (light green)
            '#c3e59a', // Altitude-2
            '#a9d178', // Altitude-3
            '#8ebe56', // Altitude-4
            '#73aa35', // Altitude-5
            '#598834', // Altitude-6
            '#486c2a', // Altitude-7
            '#39521f'  // Altitude-8: Mountains (dark green)
          ],
          lakes: '#b8def0',
          rivers: '#b8def0',
          coastline: '#7a7a7a'
        },
        political: {
          background: '#c9e9f7', // Light blue for ocean
          altitude: [
            '#ffffff', // All land is white in political map
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff'
          ],
          lakes: '#c9e9f7',
          rivers: '#c9e9f7',
          coastline: '#7a7a7a'
        },
        satellite: {
          background: '#1a3654', // Deep blue for ocean
          altitude: [
            '#2e5d33', // Altitude-1: Lowlands (green)
            '#3c6e3c', // Altitude-2
            '#556f44', // Altitude-3
            '#6e704d', // Altitude-4
            '#867155', // Altitude-5
            '#9e725e', // Altitude-6
            '#b67367', // Altitude-7
            '#ce7470'  // Altitude-8: Mountains (reddish)
          ],
          lakes: '#1a3654',
          rivers: '#3876ac',
          coastline: '#0a0a0a'
        },
        fantasy: {
          background: '#a3cddb', // Lighter blue for ocean
          altitude: [
            '#cfd8a8', // Altitude-1: Lowlands (light tan)
            '#c1c695', // Altitude-2
            '#b3b383', // Altitude-3
            '#a6a070', // Altitude-4
            '#988e5d', // Altitude-5
            '#8a7b4b', // Altitude-6
            '#7c6938', // Altitude-7
            '#6f5726'  // Altitude-8: Mountains (brown)
          ],
          lakes: '#a3cddb',
          rivers: '#a3cddb',
          coastline: '#5a4c39'
        }
      };
      
      // Default color scheme
      this.currentScheme = 'topographic';
    }
    
    /**
     * Initialize the handler when SVG is loaded
     */
    async init() {
      // Wait for SVG to load
      if (this.mapSvg.tagName.toLowerCase() === 'object') {
        try {
          await new Promise(resolve => {
            if (this.mapSvg.contentDocument && this.mapSvg.contentDocument.documentElement) {
              this.svgDoc = this.mapSvg.contentDocument;
              resolve();
            } else {
              this.mapSvg.addEventListener('load', () => {
                this.svgDoc = this.mapSvg.contentDocument;
                resolve();
              });
            }
          });
        } catch (error) {
          console.error('Error loading SVG:', error);
          return false;
        }
      } else if (this.mapSvg.tagName.toLowerCase() === 'svg') {
        this.svgDoc = this.mapSvg.ownerDocument;
      } else {
        console.error('Unsupported SVG element type');
        return false;
      }
      
      if (!this.svgDoc) {
        console.error('Failed to get SVG document');
        return false;
      }
      
      // Identify layers by their IDs or classes
      this.identifyLayers();
      
      // Apply initial styling
      this.applyColorScheme(this.currentScheme);
      
      return true;
    }
    
    /**
     * Identify all layers in the SVG
     */
    identifyLayers() {
      // Find altitude layers
      for (let i = 1; i <= 8; i++) {
        const altLayer = this.svgDoc.querySelector(`#Altitude-${i}, .Altitude-${i}, [id*="altitude-${i}"], [class*="altitude-${i}"]`);
        if (altLayer) {
          this.layerInfo.altitude[i-1] = altLayer;
        }
      }
      
      // Find other layers
      this.layerInfo.water = this.svgDoc.querySelector('#water, .water, [id*="water"], [class*="water"]');
      this.layerInfo.lakes = this.svgDoc.querySelector('#lakes, .lakes, [id*="lakes"], [class*="lakes"]');
      this.layerInfo.rivers = this.svgDoc.querySelector('#rivers, .rivers, [id*="rivers"], [class*="rivers"]');
      this.layerInfo.coastline = this.svgDoc.querySelector('#coastline, .coastline, [id*="coastline"], [class*="coastline"]');
      this.layerInfo.background = this.svgDoc.querySelector('#background, .background, [id*="background"], [class*="background"]');
      
      // Log what we found
      console.log('Identified layers:', 
        {
          'altitude': this.layerInfo.altitude.filter(l => l).length,
          'water': !!this.layerInfo.water,
          'lakes': !!this.layerInfo.lakes,
          'rivers': !!this.layerInfo.rivers,
          'coastline': !!this.layerInfo.coastline,
          'background': !!this.layerInfo.background
        }
      );
    }
    
    /**
     * Apply a color scheme to all layers
     */
    applyColorScheme(schemeName) {
      if (!this.colorSchemes[schemeName]) {
        console.error(`Color scheme "${schemeName}" not found`);
        return;
      }
      
      this.currentScheme = schemeName;
      const scheme = this.colorSchemes[schemeName];
      
      // Style background/ocean
      if (this.layerInfo.background) {
        this.layerInfo.background.style.fill = scheme.background;
      } else {
        // If no background layer, set SVG background
        const svgElement = this.svgDoc.querySelector('svg');
        if (svgElement) {
          svgElement.style.backgroundColor = scheme.background;
        }
      }
      
      // Style altitude layers
      this.layerInfo.altitude.forEach((layer, index) => {
        if (layer) {
          layer.style.fill = scheme.altitude[index] || scheme.altitude[0];
        }
      });
      
      // Style water features
      if (this.layerInfo.lakes) this.layerInfo.lakes.style.fill = scheme.lakes;
      if (this.layerInfo.rivers) this.layerInfo.rivers.style.fill = scheme.rivers;
      if (this.layerInfo.water) this.layerInfo.water.style.fill = scheme.lakes;
      
      // Style coastline
      if (this.layerInfo.coastline) {
        this.layerInfo.coastline.style.stroke = scheme.coastline;
        this.layerInfo.coastline.style.strokeWidth = '0.5';
        this.layerInfo.coastline.style.fill = 'none';
      }
      
      console.log(`Applied "${schemeName}" color scheme`);
    }
    
    /**
     * Toggle visibility of a specific layer
     */
    toggleLayer(layerName, visible) {
      if (layerName === 'altitude') {
        this.layerInfo.altitude.forEach(layer => {
          if (layer) layer.style.display = visible ? 'block' : 'none';
        });
      } else if (this.layerInfo[layerName]) {
        this.layerInfo[layerName].style.display = visible ? 'block' : 'none';
      }
    }
    
    /**
     * Get available color schemes
     */
    getColorSchemes() {
      return Object.keys(this.colorSchemes);
    }
    
    /**
     * Get current color scheme
     */
    getCurrentScheme() {
      return this.currentScheme;
    }
  }
  
  // Export for use in modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGLayerHandler;
  }