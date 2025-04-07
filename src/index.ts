import 'leaflet/dist/leaflet.css';
import { Map } from './components/Map';
import { toastManager } from './utils/toasts';

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize toast manager
    toastManager.init();
    
    // Initialize map
    const map = Map.getInstance();
    await map.initialize();
    
  } catch (error) {
    console.error('Error initializing application:', error);
    
    // Show error message
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.textContent = 'Error loading application. Please try refreshing the page.';
    }
  }
});