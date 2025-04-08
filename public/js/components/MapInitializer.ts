/**
 * MapInitializer Component for IxMaps
 * Handles map initialization and configuration
 */

import L from 'leaflet';
import { MapConfig } from '../types';
import { addZoomControl, addScaleControl, addMeasureControl } from './MapControls';
import { updateLayerVisibility } from './LayerManager';
import { showCountryLabels, hideCountryLabels } from './CountryLabels';
import { showToast } from './Toast';

/**
 * Initialize the map with the provided configuration
 * @param config - The map configuration
 */
export function initializeMap(config: MapConfig): void {
  // Create the map
  window.map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    zoomControl: false, // We'll add our own zoom control
    attributionControl: false
  });

  // Set the map bounds
  const bounds = L.latLngBounds(
    L.latLng(config.bounds.south, config.bounds.west),
    L.latLng(config.bounds.north, config.bounds.east)
  );
  window.map.fitBounds(bounds);

  // Add the base map layer
  const baseMap = L.imageOverlay(config.baseMapUrl, bounds).addTo(window.map);

  // Add controls
  addZoomControl();
  addScaleControl();
  addMeasureControl();

  // Initialize layer visibility
  updateLayerVisibility();

  // Add country labels if enabled
  if (config.showCountryLabels) {
    showCountryLabels();
  }

  // Add event listeners
  window.map.on('zoomend', () => {
    updateLayerVisibility();
  });

  window.map.on('moveend', () => {
    updateLayerVisibility();
  });

  // Show welcome message
  showToast('Welcome to IxMaps! Use the controls to navigate and measure distances.', 'info', 5000);
}

/**
 * Reset the map to its initial state
 */
export function resetMap(): void {
  if (!window.map) return;

  // Reset zoom and position
  window.map.setView([0, 0], 0);

  // Reset layer visibility
  updateLayerVisibility();

  // Hide country labels
  hideCountryLabels();

  // Show reset message
  showToast('Map has been reset to its initial state.', 'info', 3000);
}

/**
 * Update the map configuration
 * @param config - The new map configuration
 */
export function updateMapConfig(config: Partial<MapConfig>): void {
  if (!window.map) return;

  // Update zoom limits if provided
  if (config.minZoom !== undefined) {
    window.map.setMinZoom(config.minZoom);
  }

  if (config.maxZoom !== undefined) {
    window.map.setMaxZoom(config.maxZoom);
  }

  // Update bounds if provided
  if (config.bounds) {
    const bounds = L.latLngBounds(
      L.latLng(config.bounds.south, config.bounds.west),
      L.latLng(config.bounds.north, config.bounds.east)
    );
    window.map.fitBounds(bounds);
  }

  // Update base map if provided
  if (config.baseMapUrl) {
    // Remove existing base map
    window.map.eachLayer((layer) => {
      if (layer instanceof L.ImageOverlay) {
        window.map.removeLayer(layer);
      }
    });

    // Add new base map
    if (config.bounds) {
      const bounds = L.latLngBounds(
        L.latLng(config.bounds.south, config.bounds.west),
        L.latLng(config.bounds.north, config.bounds.east)
      );
      L.imageOverlay(config.baseMapUrl, bounds).addTo(window.map);
    }
  }

  // Update country labels if provided
  if (config.showCountryLabels !== undefined) {
    if (config.showCountryLabels) {
      showCountryLabels();
    } else {
      hideCountryLabels();
    }
  }

  // Show update message
  showToast('Map configuration has been updated.', 'info', 3000);
} 