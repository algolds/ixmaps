/**
 * SVGLoader Component for IxMaps
 * Handles SVG loading and caching
 */

import { SVGDimensions, SVGCache, SVGQueueItem } from '../types';

// SVG cache for performance optimization
const svgCache: SVGCache = {};

// SVG cache & lazy loading for better performance
const svgQueue: SVGQueueItem[] = [];
let isLoadingSvg = false;

/**
 * Loads an SVG and returns its dimensions with prioritized loading
 * @param url - The URL of the SVG to load
 * @returns Promise resolving to an object with width and height
 */
export function loadSVGDimensions(url: string): Promise<SVGDimensions> {
  // Return from cache immediately if available
  if (svgCache[url]) {
    return Promise.resolve(svgCache[url]);
  }
  
  // Create new promise for loading
  return new Promise<SVGDimensions>((resolve, reject) => {
    // Function to process SVG fetch
    const processSvg = () => {
      isLoadingSvg = true;
      
      // Try to load the SVG
      fetch(url, { 
        cache: 'force-cache',
        priority: 'high' // High priority for main resources
      })
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
        
        let dimensions: SVGDimensions;
        
        if (viewBoxMatch) {
          const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
          dimensions = {
            width: viewBox[2],
            height: viewBox[3]
          };
        } else if (widthMatch && heightMatch) {
          dimensions = {
            width: parseFloat(widthMatch[1]),
            height: parseFloat(heightMatch[1])
          };
        } else {
          // Default dimensions if we couldn't extract from SVG
          dimensions = {
            width: 8200, // Match SVG dimensions
            height: 4900
          };
        }
        
        // Cache the result
        svgCache[url] = dimensions;
        resolve(dimensions);
        
        // Process next in queue
        isLoadingSvg = false;
        if (svgQueue.length > 0) {
          const next = svgQueue.shift();
          if (next) {
            next.processFn().then(next.resolve).catch(next.reject);
          }
        }
      })
      .catch(error => {
        console.error("Error loading SVG:", error);
        // Return default dimensions on error
        const dimensions: SVGDimensions = {
          width: 8200,
          height: 4900
        };
        svgCache[url] = dimensions;
        resolve(dimensions);
        
        // Process next in queue
        isLoadingSvg = false;
        if (svgQueue.length > 0) {
          const next = svgQueue.shift();
          if (next) {
            next.processFn().then(next.resolve).catch(next.reject);
          }
        }
      });
    };
    
    // If already loading an SVG, queue this one
    if (isLoadingSvg) {
      svgQueue.push({
        processFn: () => new Promise<SVGDimensions>((resolveQueue, rejectQueue) => {
          processSvg();
          // We need to handle the promise resolution separately
          // since processSvg doesn't return a promise
          const checkInterval = setInterval(() => {
            if (svgCache[url]) {
              clearInterval(checkInterval);
              resolveQueue(svgCache[url]);
            }
          }, 50);
        }),
        resolve: resolve,
        reject: reject
      });
    } else {
      processSvg();
    }
  });
} 