export interface SVGDimensions {
  width: number;
  height: number;
}

export const loadSVGDimensions = async (svgPath: string): Promise<SVGDimensions> => {
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    return {
      width: parseFloat(svgElement.getAttribute('width') || '0'),
      height: parseFloat(svgElement.getAttribute('height') || '0')
    };
  } catch (error) {
    console.error('Error loading SVG dimensions:', error);
    return { width: 0, height: 0 };
  }
}; 