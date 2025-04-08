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
    
    // Extract dimensions from SVG
    const width = svgElement.hasAttribute('width') 
      ? parseFloat(svgElement.getAttribute('width') || '0') 
      : parseFloat(svgElement.getAttribute('viewBox')?.split(' ')[2] || '0');
      
    const height = svgElement.hasAttribute('height') 
      ? parseFloat(svgElement.getAttribute('height') || '0') 
      : parseFloat(svgElement.getAttribute('viewBox')?.split(' ')[3] || '0');
    
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