/**
 * Toast Component for IxMaps
 * Handles toast notifications
 */

/**
 * Shows a toast notification
 * @param message - The message to display
 * @param type - The type of toast (info, success, warning, error)
 * @param duration - Duration in milliseconds, 0 for permanent
 * @returns The ID of the created toast
 */
export function showToast(message: string, type: string = 'info', duration: number = 3000): string {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('Toast container not found');
    return '';
  }
  
  const toast = document.createElement('div');
  const toastId = 'toast-' + Date.now();
  
  toast.id = toastId;
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  toast.style.position = 'relative';
  
  container.appendChild(toast);
  
  // Add progress bar if duration > 0
  if (duration > 0) {
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.style.width = '100%';
    toast.appendChild(progress);
    
    // Animate progress bar
    progress.style.transition = `width ${duration}ms linear`;
    progress.style.width = '0%';
  }
  
  // Show toast immediately
  toast.classList.add('show');
  
  // Hide toast after duration (if not permanent)
  if (duration > 0) {
    setTimeout(() => {
      hideToast(toastId);
    }, duration);
  }
  
  return toastId;
}

/**
 * Hides a toast notification
 * @param toastId - The ID of the toast to hide
 */
export function hideToast(toastId: string): void {
  const toast = document.getElementById(toastId);
  if (!toast) return;
  
  toast.classList.add('hide');
  toast.classList.remove('show');
  
  // Remove toast from DOM after animation completes
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Initialize toast notification system
 */
export function initToasts(): void {
  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.position = 'fixed';
  toastContainer.style.bottom = '20px';
  toastContainer.style.right = '20px';
  toastContainer.style.zIndex = '10000';
  toastContainer.style.display = 'flex';
  toastContainer.style.flexDirection = 'column';
  toastContainer.style.gap = '10px';
  toastContainer.style.maxWidth = '300px';
  document.body.appendChild(toastContainer);
  
  // Add toast styles
  const toastStyles = document.createElement('style');
  toastStyles.textContent = `
    .toast {
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      margin-top: 10px;
      opacity: 0;
      transform: translateX(50px);
      transition: opacity 0.3s, transform 0.3s;
      overflow: hidden;
    }
    
    .toast.show {
      opacity: 1;
      transform: translateX(0);
    }
    
    .toast.hide {
      opacity: 0;
      transform: translateX(50px);
    }
    
    .toast.info {
      background-color: #3498db;
    }
    
    .toast.success {
      background-color: #2ecc71;
    }
    
    .toast.warning {
      background-color: #f39c12;
    }
    
    .toast.error {
      background-color: #e74c3c;
    }
    
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background-color: rgba(255,255,255,0.4);
    }
    
    .toast-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
      gap: 8px;
    }
    
    .toast-btn {
      background-color: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }
    
    .toast-btn:hover {
      background-color: rgba(255,255,255,0.3);
    }
    
    .toast-btn-secondary {
      background-color: rgba(255,255,255,0.1);
    }
    
    .toast-btn-secondary:hover {
      background-color: rgba(255,255,255,0.2);
    }
  `;
  document.head.appendChild(toastStyles);
} 