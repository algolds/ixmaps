export interface SVGDimensions {
  width: number;
  height: number;
}

export const loadSVGDimensions = async (svgPath: string): Promise<SVGDimensions> => {
  try {
    console.log(`SVGLoader: Attempting to load SVG from path: ${svgPath}`);
    
    // Use absolute URL if path doesn't start with http or /
    const url = (svgPath.startsWith('http') || svgPath.startsWith('/')) 
      ? svgPath 
      : `/${svgPath}`;
    
    console.log(`SVGLoader: Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
    }
    
    const svgText = await response.text();
    console.log(`SVGLoader: Received SVG content of length: ${svgText.length} characters`);
    
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`SVG parsing error: ${parserError.textContent}`);
    }
    
    const svgElement = svgDoc.documentElement;
    
    // Try multiple methods to extract dimensions
    let width = 0;
    let height = 0;
    
    // Method 1: Direct width/height attributes
    if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
      width = parseFloat(svgElement.getAttribute('width') || '0');
      height = parseFloat(svgElement.getAttribute('height') || '0');
    }
    
    // Method 2: ViewBox attribute
    if ((width <= 0 || height <= 0) && svgElement.hasAttribute('viewBox')) {
      const viewBox = svgElement.getAttribute('viewBox')?.split(' ');
      if (viewBox && viewBox.length >= 4) {
        width = parseFloat(viewBox[2]);
        height = parseFloat(viewBox[3]);
      }
    }
    
    // Method 3: Look for metadata or other elements with dimensions
    if (width <= 0 || height <= 0) {
      // Try to find a rect element that covers the entire SVG
      const rects = svgDoc.querySelectorAll('rect');
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        const rectWidth = parseFloat(rect.getAttribute('width') || '0');
        const rectHeight = parseFloat(rect.getAttribute('height') || '0');
        
        // If this rect is large enough, use its dimensions
        if (rectWidth > 100 && rectHeight > 100) {
          width = rectWidth;
          height = rectHeight;
          break;
        }
      }
    }
    
    // Method 4: Look for a specific element with known dimensions
    if (width <= 0 || height <= 0) {
      // Try to find an element with a specific ID or class that might indicate the map size
      const mapElement = svgDoc.querySelector('#map-container, .map-container, #world-map, .world-map');
      if (mapElement) {
        width = parseFloat(mapElement.getAttribute('width') || '0');
        height = parseFloat(mapElement.getAttribute('height') || '0');
      }
    }
    
    console.log(`SVGLoader: Successfully extracted dimensions: ${width}x${height}`);
    
    // Return default dimensions if we couldn't extract them
    if (width <= 0 || height <= 0) {
      console.warn('SVGLoader: Invalid dimensions, returning defaults');
      return { width: 8202, height: 4900 };
    }
    
    return { width, height };
  } catch (error) {
    console.error('SVGLoader: Error loading SVG dimensions:', error);
    // Return default dimensions on error
    return { width: 8202, height: 4900 };
  }
};