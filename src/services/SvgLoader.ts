import * as d3 from 'd3';
import { SvgDocument } from '../types';
import { showErrorToast } from '../utils/toasts';

/**
 * Service for loading and manipulating SVG files
 */
export class SvgLoader {
  private static instance: SvgLoader;
  private svgCache: Map<string, SvgDocument> = new Map();
  private loadPromises: Map<string, Promise<SvgDocument>> = new Map();
  
  /**
   * Get singleton instance
   */
  public static getInstance(): SvgLoader {
    if (!SvgLoader.instance) {
      SvgLoader.instance = new SvgLoader();
    }
    return SvgLoader.instance;
  }
  
  /**
   * Private constructor (use getInstance instead)
   */
  private constructor() {}
  
  /**
   * Load an SVG file and parse it
   * @param url - URL of the SVG file
   * @returns Promise resolving to the parsed SVG document
   */
  public async loadSvg(url: string): Promise<SvgDocument> {
    // Check cache first
    if (this.svgCache.has(url)) {
      return this.svgCache.get(url)!;
    }
    
    // Check if already loading
    if (this.loadPromises.has(url)) {
      return this.loadPromises.get(url)!;
    }
    
    // Create new loading promise
    const promise = this.fetchAndParseSvg(url);
    this.loadPromises.set(url, promise);
    
    try {
      const svgDoc = await promise;
      this.svgCache.set(url, svgDoc);
      this.loadPromises.delete(url);
      return svgDoc;
    } catch (error) {
      this.loadPromises.delete(url);
      throw error;
    }
  }
  
  /**
   * Clear the SVG cache
   */
  public clearCache(): void {
    this.svgCache.clear();
  }
  
  /**
   * Fetch and parse an SVG file
   * @param url - URL of the SVG file
   * @returns Promise resolving to the parsed SVG document
   */
  private async fetchAndParseSvg(url: string): Promise<SvgDocument> {
    try {
      // Fetch the SVG file
      const response = await fetch(url, {
        cache: 'force-cache', // Use browser cache if available
        priority: 'high' // High priority for map resources
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
      }
      
      // Get SVG text
      const svgText = await response.text();
      
      // Parse the SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('SVG parsing error: ' + parserError.textContent);
      }
      
      // Get the SVG element
      const svgElement = svgDoc.documentElement as SVGElement;
      if (!svgElement || svgElement.tagName !== 'svg') {
        throw new Error('Invalid SVG: Root element is not <svg>');
      }
      
      // Create D3 selection
      const selection = d3.select(svgElement);
      
      // Extract viewBox
      const viewBoxAttr = svgElement.getAttribute('viewBox');
      let viewBox = { x: 0, y: 0, width: 0, height: 0 };
      
      if (viewBoxAttr) {
        const [x, y, width, height] = viewBoxAttr.split(/\s+/).map(Number);
        viewBox = { x, y, width, height };
      }
      
      // Extract width and height
      let width = parseInt(svgElement.getAttribute('width') || '0', 10);
      let height = parseInt(svgElement.getAttribute('height') || '0', 10);
      
      // If width/height not set, use viewBox dimensions
      if (!width && viewBox.width) {
        width = viewBox.width;
      }
      
      if (!height && viewBox.height) {
        height = viewBox.height;
      }
      
      // If still no dimensions, use defaults
      if (!width || !height) {
        width = 8202; // Default width
        height = 4900; // Default height
      }
      
      // Create SVG document object
      const svgDocument: SvgDocument = {
        element: svgElement,
        selection,
        width,
        height,
        viewBox
      };
      
      return svgDocument;
    } catch (error) {
      // Show error toast
      showErrorToast(`Failed to load SVG map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Re-throw for upstream handling
      throw error;
    }
  }
  
  /**
   * Get a D3 selection for an SVG element by ID
   * @param svgDoc - SVG document
   * @param id - Element ID
   * @returns D3 selection
   */
  public getElementById(svgDoc: SvgDocument, id: string): d3.Selection<SVGElement, unknown, null, undefined> {
    return d3.select(svgDoc.element.querySelector(`#${id}`) as SVGElement);
  }
  
  /**
   * Get D3 selections for SVG elements by selector
   * @param svgDoc - SVG document
   * @param selector - CSS selector
   * @returns D3 selection
   */
  public getElementsBySelector(svgDoc: SvgDocument, selector: string): d3.Selection<SVGElement, unknown, null, undefined> {
    return d3.selectAll(svgDoc.element.querySelectorAll(selector) as NodeListOf<SVGElement>);
  }
  
  /**
   * Clone an SVG document
   * @param svgDoc - Original SVG document
   * @returns Cloned SVG document
   */
  public cloneSvgDocument(svgDoc: SvgDocument): SvgDocument {
    const clonedElement = svgDoc.element.cloneNode(true) as SVGElement;
    
    return {
      element: clonedElement,
      selection: d3.select(clonedElement),
      width: svgDoc.width,
      height: svgDoc.height,
      viewBox: { ...svgDoc.viewBox }
    };
  }
}

// Export singleton instance
export const svgLoader = SvgLoader.getInstance();