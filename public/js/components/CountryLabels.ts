/**
 * CountryLabels Component for IxMaps
 * Handles country label extraction and display
 */

import { CountryLabel } from '../types';
import { showToast } from './Toast';
import * as L from 'leaflet';

// Will hold the country label layer group
let countryLabelsLayer: L.LayerGroup | null = null;

/**
 * Extract country labels from SVG and create Leaflet labels
 * This function is compatible with Inkscape SVG structure
 */
export function extractSvgCountryLabels(): Promise<CountryLabel[]> {
  return new Promise<CountryLabel[]>((resolve, reject) => {
    try {
      // Fetch the SVG to extract country names and positions
      fetch(window.mapConfig.masterMapPath)
        .then(response => response.text())
        .then(svgText => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
          
          // Find the political layer - try different Inkscape selectors
          const politicalLayer = 
            svgDoc.querySelector('#political') || 
            svgDoc.querySelector('[inkscape\\:label="political"]') ||
            svgDoc.querySelector('[inkscape\\:groupmode="layer"][id="political"]') ||
            svgDoc.querySelector('g[id="political"]');
          
          if (!politicalLayer) {
            console.error("Could not find political layer in SVG");
            reject(new Error("Political layer not found"));
            return;
          }
          
          console.log("Found political layer:", politicalLayer);
          
          // Find all country elements in the political layer
          // In Inkscape, these would be direct children with IDs
          const countryElements = politicalLayer.querySelectorAll('*');
          console.log(`Found ${countryElements.length} elements in political layer`);
          
          const labels: CountryLabel[] = [];
          
          countryElements.forEach(element => {
            // Skip group elements and elements without IDs
            if (element.tagName.toLowerCase() === 'g' || !element.hasAttribute('id')) {
              return;
            }
            
            // Get the ID which is the country name
            const id = element.getAttribute('id');
            
            // Skip elements with generic IDs
            if (!id || id === 'political' || id.startsWith('path') || id.startsWith('rect')) {
              return;
            }
            
            // Try to get inkscape:label attribute first, then fall back to ID
            const name = element.getAttribute('inkscape:label') || id;
            
            // Calculate position (centroid of the path/shape)
            let centroid = calculatePathCentroid(element);
            
            // If we couldn't calculate a centroid, try to get bounding box center
            if (!centroid) {
              centroid = calculateBoundingBoxCenter(element);
            }
            
            // Skip if we couldn't determine a position
            if (!centroid) {
              console.warn(`Couldn't determine position for country: ${name}`);
              return;
            }
            
            // Determine if this is a major country, capital, or minor territory
            let type: 'standard' | 'major' | 'minor' | 'capital' = 'standard';
            
            // Check element attributes and size
            try {
              // Simple heuristic: use element size to determine importance
              if (element.hasAttribute('inkscape:label')) {
                const inkscapeLabel = element.getAttribute('inkscape:label')?.toLowerCase() || '';
                if (inkscapeLabel.includes('capital') || inkscapeLabel.includes('capitol')) {
                  type = 'capital';
                } else if (inkscapeLabel.includes('major')) {
                  type = 'major';
                } else if (inkscapeLabel.includes('minor')) {
                  type = 'minor';
                }
              } else {
                // Use size as a fallback
                try {
                  const bbox = (element as SVGGraphicsElement).getBBox();
                  const area = bbox.width * bbox.height;
                  
                  if (area > 100000) {
                    type = 'major';
                  } else if (area < 10000) {
                    type = 'minor';
                  }
                } catch (e) {
                  console.warn(`Error getting bounding box for ${name}:`, e);
                }
              }
            } catch (e) {
              console.warn(`Error determining type for ${name}:`, e);
            }
            
            // Format the name for display
            const displayName = name
              .replace(/_/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/^[a-z]/, match => match.toUpperCase());
            
            // Add label to array
            labels.push({
              x: centroid.x,
              y: centroid.y,
              name: displayName,
              originalId: id,
              class: type
            });
            
            console.log(`Added country label: ${displayName} (${type}) at ${centroid.x},${centroid.y}`);
          });
          
          console.log(`Extracted ${labels.length} country labels from SVG`);
          resolve(labels);
        })
        .catch(error => {
          console.error('Error extracting country labels from SVG:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error in extractSvgCountryLabels:', error);
      reject(error);
    }
  });
}

/**
 * Calculate the centroid (center point) of an SVG path element
 * @param element - The SVG element (path, polygon, etc.)
 * @returns {x, y} coordinates or null if calculation fails
 */
function calculatePathCentroid(element: Element): { x: number, y: number } | null {
  try {
    // For simple rect elements
    if (element.tagName.toLowerCase() === 'rect') {
      const x = parseFloat(element.getAttribute('x') || '0');
      const y = parseFloat(element.getAttribute('y') || '0');
      const width = parseFloat(element.getAttribute('width') || '0');
      const height = parseFloat(element.getAttribute('height') || '0');
      
      return {
        x: x + width / 2,
        y: y + height / 2
      };
    }
    
    // For circle elements
    if (element.tagName.toLowerCase() === 'circle') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      
      return { x: cx, y: cy };
    }
    
    // For path or polygon elements, try to get the bounding box center
    return calculateBoundingBoxCenter(element);
  } catch (error) {
    console.warn('Error calculating path centroid:', error);
    return null;
  }
}

/**
 * Calculate the center of an element's bounding box
 * @param element - The SVG element
 * @returns {x, y} coordinates or null if calculation fails
 */
function calculateBoundingBoxCenter(element: Element): { x: number, y: number } | null {
  try {
    // Use the SVG's getBBox() to get the bounding box
    const bbox = (element as SVGGraphicsElement).getBBox();
    
    return {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2
    };
  } catch (error) {
    console.warn('Error calculating bounding box center:', error);
    return null;
  }
}

/**
 * Create and show Leaflet labels for countries
 */
export function showCountryLabels(): void {
  // If labels are already showing, do nothing
  if (countryLabelsLayer && window.map.hasLayer(countryLabelsLayer)) {
    return;
  }
  
  // If we need to create the labels
  if (!countryLabelsLayer) {
    countryLabelsLayer = L.layerGroup();
    
    // Extract labels from SVG and create markers
    extractSvgCountryLabels()
      .then(labels => {
        // Create a marker for each label
        labels.forEach(label => {
          // Convert SVG coordinates to Leaflet coordinates
          const position = L.latLng(label.y, label.x);
          
          // Create a div icon with the country name
          const icon = L.divIcon({
            className: `${window.mapConfig.labelClassName} ${label.class}`,
            html: `<div style="font-weight:${label.class === 'minor' ? 'normal' : 'bold'};">${label.name}</div>`,
            iconSize: [120, 20],  // Set a reasonable size that will fit most country names
            iconAnchor: [60, 10]  // Center the icon on the position
          });
          
          // Create the marker and add it to the layer
          const marker = L.marker(position, {
            icon: icon,
            interactive: true,  // Makes the label clickable
            keyboard: false,    // Prevents keyboard navigation to the marker
            zIndexOffset: 1000  // Ensure labels appear above other elements
          });
          
          // Add a tooltip with more information if clicked
          marker.bindTooltip(label.name, { 
            direction: 'top',
            offset: [0, -10]
          });
          
          countryLabelsLayer?.addLayer(marker);
        });
        
        // Add the layer to the map
        countryLabelsLayer?.addTo(window.map);
        
        showToast(`Showing ${labels.length} country labels`, 'info', 2000);
      })
      .catch(error => {
        console.error('Failed to show country labels:', error);
        showToast('Failed to load country labels', 'error', 3000);
      });
  } else {
    // Just add the existing layer to the map
    countryLabelsLayer.addTo(window.map);
    showToast('Showing country labels', 'info', 2000);
  }
}

/**
 * Hide country labels
 */
export function hideCountryLabels(): void {
  if (countryLabelsLayer && window.map.hasLayer(countryLabelsLayer)) {
    window.map.removeLayer(countryLabelsLayer);
    showToast('Country labels hidden', 'info', 2000);
  }
} 