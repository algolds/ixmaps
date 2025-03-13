document.addEventListener('DOMContentLoaded', function() {
    initMap();
  });
  
  function initMap() {
    // Map configuration
    const config = {
      mainMapPath: '/data/maps/ixmaps/public/map.svg',
      climateMapPath: '/data/maps/ixmaps/public/climate.svg',
      svgWidth: 1920,  // Default width, will be adjusted when SVG loads
      svgHeight: 1080, // Default height, will be adjusted when SVG loads
      initialZoom: 2,
      minZoom: 1,
      maxZoom: 6
    };
  
    // Create the Leaflet map
    const map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: false,
      center: [0, 0], // Will be adjusted after loading SVGs
      zoom: config.initialZoom
    });
  
    // Add attribution control
    L.control.attribution({
      prefix: 'IxMaps v1.0'
    }).addTo(map);
  
    // Add zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
  
    // Add scale control
    L.control.scale({
      position: 'bottomright'
    }).addTo(map);
  
    // Layers for map and overlays
    let mainLayer, climateLayer;
    let leftMainLayer, rightMainLayer;
    let leftClimateLayer, rightClimateLayer;
  
    // Load the SVGs
    Promise.all([
      loadSVGDimensions(config.mainMapPath),
      loadSVGDimensions(config.climateMapPath)
    ])
    .then(([mainDimensions, climateDimensions]) => {
      // Use dimensions from main map
      config.svgWidth = mainDimensions.width;
      config.svgHeight = mainDimensions.height;
      
      // Calculate bounds
      const bounds = [
        [0, 0],
        [config.svgHeight, config.svgWidth]
      ];
  
      // Create main map layer
      mainLayer = L.imageOverlay(config.mainMapPath, bounds).addTo(map);
      
      // Create climate overlay layer
      climateLayer = L.imageOverlay(config.climateMapPath, bounds, {
        className: 'map-overlay'
      }).addTo(map);
  
      // Add wrapped layers for continuity when panning
      // Left copies
      leftMainLayer = L.imageOverlay(config.mainMapPath, [
        [0, -config.svgWidth],
        [config.svgHeight, 0]
      ]).addTo(map);
      
      leftClimateLayer = L.imageOverlay(config.climateMapPath, [
        [0, -config.svgWidth],
        [config.svgHeight, 0]
      ], {
        className: 'map-overlay'
      }).addTo(map);
      
      // Right copies
      rightMainLayer = L.imageOverlay(config.mainMapPath, [
        [0, config.svgWidth],
        [config.svgHeight, config.svgWidth * 2]
      ]).addTo(map);
      
      rightClimateLayer = L.imageOverlay(config.climateMapPath, [
        [0, config.svgWidth],
        [config.svgHeight, config.svgWidth * 2]
      ], {
        className: 'map-overlay'
      }).addTo(map);
  
      // Center the map
      map.fitBounds(bounds);
      
      // Add layer control
      const baseLayers = {
        "Topology Map": mainLayer
      };
      
      const overlays = {
        "Climate Zones": climateLayer
      };
      
      L.control.layers(null, overlays, {
        position: 'topright'
      }).addTo(map);
  
      // Hide loading indicator
      document.getElementById('loading-indicator').style.display = 'none';
  
      // Implement wrapping behavior
      map.on('moveend', function() {
        const center = map.getCenter();
        
        // If panned beyond bounds, wrap around
        if (center.lng < 0) {
          map.panTo([center.lat, center.lng + config.svgWidth], {animate: false});
        } else if (center.lng > config.svgWidth) {
          map.panTo([center.lat, center.lng - config.svgWidth], {animate: false});
        }
      });
    })
    .catch(error => {
      console.error("Error loading SVG maps:", error);
      document.getElementById('loading-indicator').textContent = 
        'Error loading maps. Please try refreshing the page.';
    });
  }
  
  // Function to load SVG and get its dimensions
  function loadSVGDimensions(url) {
    return new Promise((resolve, reject) => {
      // Try to load the SVG
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(svgText => {
          // Try to extract viewBox or width/height
          const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/);
          const widthMatch = svgText.match(/width="([^"]+)"/);
          const heightMatch = svgText.match(/height="([^"]+)"/);
          
          if (viewBoxMatch) {
            const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
            resolve({
              width: viewBox[2],
              height: viewBox[3]
            });
          } else if (widthMatch && heightMatch) {
            resolve({
              width: parseFloat(widthMatch[1]),
              height: parseFloat(heightMatch[1])
            });
          } else {
            // Default dimensions if we couldn't extract from SVG
            resolve({
              width: 1920,
              height: 1080
            });
          }
        })
        .catch(error => {
          console.error("Error loading SVG:", error);
          // Return default dimensions on error
          resolve({
            width: 1920,
            height: 1080
          });
        });
    });
  }