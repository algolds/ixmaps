interface ToastOptions {
  message: string;
  type?: string;
  duration?: number;
}

export const initToasts = (): void => {
  // Create toast container if it doesn't exist
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    `;
    document.body.appendChild(container);
  }
};

export const showToast = (message: string, type: string = 'info', duration: number = 3000): string => {
  const container = document.getElementById('toast-container');
  if (!container) return '';

  const toast = document.createElement('div');
  const toastId = Math.random().toString(36).substr(2, 9);
  toast.id = `toast-${toastId}`;
  toast.style.cssText = `
    background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#00C851' : '#33b5e5'};
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    margin-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease-in-out;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toastId;
};

export const hideToast = (toastId: string): void => {
  const toast = document.getElementById(`toast-${toastId}`);
  if (toast) {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }
}; 