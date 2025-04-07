import { Toast, ToastAction } from '../types';
import { generateId } from './helpers';

/**
 * Toast notification system
 */
class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Map<string, Toast> = new Map();
  
  /**
   * Initialize the toast container
   */
  public init(): void {
    // If container already exists, return
    if (this.container) return;
    
    // Get existing container or create new one
    this.container = document.getElementById('toast-container');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  }
  
  /**
   * Show a toast notification
   * @param message - Message to display
   * @param type - Type of toast
   * @param duration - Duration in milliseconds (0 for permanent)
   * @param actions - Actions to show in the toast
   * @returns ID of the created toast
   */
  public show(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration = 3000,
    actions: ToastAction[] = []
  ): string {
    this.init();
    
    // Generate toast ID
    const id = generateId();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast ${type}`;
    
    // Create content
    let content = message;
    
    // Add actions if provided
    if (actions.length > 0) {
      content += `
        <div class="toast-actions">
          ${actions.map(action => `
            <button class="toast-btn${action.secondary ? ' toast-btn-secondary' : ''}" data-action="${actions.indexOf(action)}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      `;
    }
    
    toast.innerHTML = content;
    toast.style.position = 'relative';
    
    // Add progress bar if duration > 0
    if (duration > 0) {
      const progress = document.createElement('div');
      progress.className = 'toast-progress';
      progress.style.width = '100%';
      toast.appendChild(progress);
      
      // Animate progress bar
      setTimeout(() => {
        progress.style.transition = `width ${duration}ms linear`;
        progress.style.width = '0%';
      }, 10);
    }
    
    // Add to container
    if (this.container) {
      this.container.appendChild(toast);
    }
    
    // Store toast data
    this.toasts.set(id, {
      id,
      message,
      type,
      duration,
      actions
    });
    
    // Add action event listeners
    if (actions.length > 0) {
      actions.forEach((action, index) => {
        const button = toast.querySelector(`[data-action="${index}"]`) as HTMLButtonElement;
        if (button) {
          button.addEventListener('click', () => {
            action.action();
          });
        }
      });
    }
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Hide toast after duration (if not permanent)
    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }
    
    return id;
  }
  
  /**
   * Hide a toast notification
   * @param id - ID of the toast to hide
   */
  public hide(id: string): void {
    const toast = document.getElementById(id);
    if (!toast) return;
    
    // Add hide class
    toast.classList.add('hide');
    toast.classList.remove('show');
    
    // Remove toast from DOM after animation completes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // Remove from map
      this.toasts.delete(id);
    }, 300);
  }
  
  /**
   * Hide all toasts
   */
  public hideAll(): void {
    this.toasts.forEach((_, id) => {
      this.hide(id);
    });
  }
}

// Create singleton instance
export const toastManager = new ToastManager();

// Helper functions for common toast types
export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000, actions: ToastAction[] = []): string {
  return toastManager.show(message, type, duration, actions);
}

export function hideToast(id: string): void {
  toastManager.hide(id);
}

export function showSuccessToast(message: string, duration = 3000, actions: ToastAction[] = []): string {
  return toastManager.show(message, 'success', duration, actions);
}

export function showErrorToast(message: string, duration = 5000, actions: ToastAction[] = []): string {
  return toastManager.show(message, 'error', duration, actions);
}

export function showWarningToast(message: string, duration = 4000, actions: ToastAction[] = []): string {
  return toastManager.show(message, 'warning', duration, actions);
}

export function showInfoToast(message: string, duration = 3000, actions: ToastAction[] = []): string {
  return toastManager.show(message, 'info', duration, actions);
}

export function hideAllToasts(): void {
  toastManager.hideAll();
}