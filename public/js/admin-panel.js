/**
 * IxMaps - Admin Panel
 * Interface for moderating map labels
 * Updated to use server API for persistent storage
 */

class IxMapAdmin {
  constructor(options) {
    // Set the API base URL
    this.apiBaseUrl = options.apiBaseUrl || '/data/maps/ixmaps/api';
    this.sessionId = localStorage.getItem('ixmaps-session-id') || 'dummy-session-id';
    
    // Use dummy user data - automatically "logged in"
    this.currentUser = {
      id: 'admin-1',
      username: 'Admin',
      isAdmin: true
    };
    
    this.categoryLabels = options.categoryLabels || {
      'continent': 'Continent',
      'country': 'Country',
      'capital': 'Capital',
      'city': 'City',
      'landmark': 'Landmark',
      'water': 'Water Body'
    };
    
    this.labels = [];
    this.init();
  }
  
  /**
   * Initialize the admin panel
   */
  async init() {
    try {
      // Set up event listeners
      this.initEventListeners();
      
      // Update header with admin info
      const headerTitle = document.querySelector('header h1');
      if (headerTitle) {
        headerTitle.textContent = `IxMaps Admin Panel - ${this.currentUser.username}`;
      }
      
      // Load labels
      await this.loadLabels();
      
      // Show welcome notification
      this.showNotification('Admin panel initialized with server API', 'info');
    } catch (error) {
      console.error('Error initializing admin panel:', error);
      this.showNotification('Error initializing admin panel', 'error');
    }
  }
  
  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Refresh button
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.loadLabels());
    }
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
      });
    });
    
    // Modal close
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.style.display = 'none';
        });
      });
    });
    
    // Add export all button
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      const exportButton = document.createElement('button');
      exportButton.id = 'export-all-button';
      exportButton.className = 'btn';
      exportButton.textContent = 'Export All Labels';
      exportButton.addEventListener('click', () => this.exportAllLabels());
      
      headerActions.appendChild(exportButton);
      
      // Add import button
      const importButton = document.createElement('button');
      importButton.id = 'import-button';
      importButton.className = 'btn';
      importButton.textContent = 'Import Labels';
      importButton.addEventListener('click', () => this.showImportModal());
      
      headerActions.appendChild(importButton);
    }
    
    // Add clear all button
    const headerElement = document.querySelector('header');
    if (headerElement) {
      const clearAllButton = document.createElement('button');
      clearAllButton.id = 'clear-all-button';
      clearAllButton.className = 'btn btn-danger';
      clearAllButton.textContent = 'Clear All Labels';
      clearAllButton.style.marginLeft = 'auto';
      
      clearAllButton.addEventListener('click', () => {
        if (confirm('WARNING: This will delete ALL labels from the server. This cannot be undone. Continue?')) {
          this.clearAllLabels();
        }
      });
      
      headerElement.appendChild(clearAllButton);
    }
    
    // Create import modal
    this.createImportModal();
  }
  
  /**
   * Create import modal
   */
  createImportModal() {
    // Check if modal already exists
    if (document.getElementById('import-modal')) return;
    
    const importModal = document.createElement('div');
    importModal.id = 'import-modal';
    importModal.className = 'modal';
    importModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Import Labels</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div id="import-modal-body">
          <div class="form-group">
            <label for="import-json">Paste JSON data or drag and drop file:</label>
            <textarea id="import-json" rows="10" placeholder='Paste JSON here or drop a file...'></textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="import-clear-existing" checked>
              Clear existing labels before import
            </label>
          </div>
          <div class="form-actions">
            <button id="confirm-import" class="btn btn-primary">Import Data</button>
            <button class="btn close-modal">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(importModal);
    
    // Set up drag and drop
    const importTextarea = document.getElementById('import-json');
    if (importTextarea) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        importTextarea.addEventListener(eventName, preventDefaults, false);
      });
      
      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      ['dragenter', 'dragover'].forEach(eventName => {
        importTextarea.addEventListener(eventName, () => {
          importTextarea.classList.add('highlight');
        }, false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        importTextarea.addEventListener(eventName, () => {
          importTextarea.classList.remove('highlight');
        }, false);
      });
      
      importTextarea.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            importTextarea.value = event.target.result;
          };
          reader.readAsText(file);
        }
      }, false);
    }
    
    // Set up confirm import button
    const confirmImportButton = document.getElementById('confirm-import');
    if (confirmImportButton) {
      confirmImportButton.addEventListener('click', () => {
        this.importLabelsFromJSON();
      });
    }
    
    // Add some style for the textarea
    const style = document.createElement('style');
    style.textContent = `
      #import-json.highlight {
        border: 2px dashed #3498db;
        background-color: #f0f8ff;
      }
      #import-modal .modal-content {
        width: 90%;
        max-width: 800px;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Show import modal
   */
  showImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
  
  /**
   * Import labels from JSON
   */
  async importLabelsFromJSON() {
    try {
      const jsonText = document.getElementById('import-json').value;
      if (!jsonText.trim()) {
        this.showNotification('Please provide JSON data to import', 'warning');
        return;
      }
      
      const importedLabels = JSON.parse(jsonText);
      if (!Array.isArray(importedLabels)) {
        this.showNotification('Invalid format. Expected an array of labels.', 'error');
        return;
      }
      
      const clearExisting = document.getElementById('import-clear-existing').checked;
      
      // Submit to API
      const response = await fetch(`${this.apiBaseUrl}/labels/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId || ''
        },
        body: JSON.stringify({
          labels: importedLabels,
          clearExisting: clearExisting
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Close import modal
      document.getElementById('import-modal').style.display = 'none';
      
      // Reload labels
      await this.loadLabels();
      
      this.showNotification(`Successfully imported ${importedLabels.length} labels`, 'success');
    } catch (error) {
      console.error('Error importing labels:', error);
      this.showNotification('Failed to import labels: ' + error.message, 'error');
    }
  }
  
  /**
   * Export all labels
   */
  exportAllLabels() {
    try {
      const allLabels = [...this.labels];
      
      if (allLabels.length === 0) {
        this.showNotification('No labels to export', 'warning');
        return;
      }
      
      // Create JSON blob
      const data = JSON.stringify(allLabels, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `ixmaps-labels-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showNotification('Labels exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting labels:', error);
      this.showNotification('Failed to export labels: ' + error.message, 'error');
    }
  }
  
  /**
   * Clear all labels
   */
  async clearAllLabels() {
    try {
      // Call the API to clear all labels
      const response = await fetch(`${this.apiBaseUrl}/labels`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': this.sessionId || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Reload labels
      await this.loadLabels();
      
      this.showNotification('All labels have been cleared from the server', 'success');
    } catch (error) {
      console.error('Error clearing labels:', error);
      this.showNotification('Failed to clear labels: ' + error.message, 'error');
    }
  }
  
  /**
   * Load labels from server
   */
  async loadLabels() {
    try {
      this.showLoading(true);
      
      // Call the API to get all labels
      const response = await fetch(`${this.apiBaseUrl}/labels`, {
        headers: {
          'X-Session-ID': this.sessionId || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      this.labels = await response.json();
      
      // Sort labels by status
      const approvedLabels = this.labels.filter(label => label.status === 'approved');
      const pendingLabels = this.labels.filter(label => label.status === 'pending');
      const rejectedLabels = this.labels.filter(label => label.status === 'rejected');
      
      // Render labels
      this.renderLabels('pending-labels', pendingLabels);
      this.renderLabels('approved-labels', approvedLabels);
      this.renderLabels('rejected-labels', rejectedLabels);
      this.renderLabels('all-labels', this.labels);
      
      this.showNotification(`${this.labels.length} labels loaded from server`, 'info');
      this.showLoading(false);
    } catch (error) {
      console.error('Error loading labels:', error);
      this.showNotification('Failed to load labels: ' + error.message, 'error');
      
      // If API fails, create sample data for testing
      if (this.labels.length === 0) {
        this.createSampleLabels();
      }
      
      this.showLoading(false);
    }
  }
  
  /**
   * Create sample labels if none exist
   */
  createSampleLabels() {
    const sampleLabels = [
      {
        id: 'sample-1',
        name: 'Example Continent',
        type: 'continent',
        minZoom: -3,
        status: 'approved',
        createdBy: 'admin-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        x: 0.25,
        y: 0.25,
        notes: 'Sample approved label'
      },
      {
        id: 'sample-2',
        name: 'Example Country',
        type: 'country',
        minZoom: -1,
        status: 'pending',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        x: 0.5,
        y: 0.5,
        notes: 'Sample pending label'
      },
      {
        id: 'sample-3',
        name: 'Example City',
        type: 'city',
        minZoom: 1,
        status: 'rejected',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        x: 0.75,
        y: 0.75,
        notes: 'Sample rejected label'
      }
    ];
    
    this.labels = sampleLabels;
    
    // Render labels
    this.renderLabels('pending-labels', sampleLabels.filter(label => label.status === 'pending'));
    this.renderLabels('approved-labels', sampleLabels.filter(label => label.status === 'approved'));
    this.renderLabels('rejected-labels', sampleLabels.filter(label => label.status === 'rejected'));
    this.renderLabels('all-labels', sampleLabels);
    
    this.showNotification('Using sample labels for testing', 'warning');
  }
  
  /**
   * Render labels in a container
   */
  renderLabels(containerId, labels) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (labels.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i>📝</i>
          <p>No labels found.</p>
        </div>
      `;
      return;
    }
    
    // Sort labels by created date (newest first)
    const sortedLabels = [...labels].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Create cards for each label
    sortedLabels.forEach(label => {
      const card = this.createLabelCard(label);
      container.appendChild(card);
    });
  }
  
  /**
   * Create a label card element
   */
  createLabelCard(label) {
    const card = document.createElement('div');
    card.className = `label-card status-${label.status || 'pending'}`;
    card.dataset.id = label.id;
    
    // Label header
    const header = document.createElement('div');
    header.className = 'label-card-header';
    
    const labelName = document.createElement('h3');
    labelName.textContent = label.name || 'Untitled';
    
    const category = document.createElement('span');
    category.className = 'label-category';
    category.textContent = this.categoryLabels[label.type] || label.type || 'Unknown';
    
    header.appendChild(labelName);
    header.appendChild(category);
    
    // Label content
    const content = document.createElement('div');
    content.className = 'label-content';
    
    // Format creation date
    const createdDate = label.createdAt ? new Date(label.createdAt).toLocaleString() : 'Unknown';
    
    // Label details
    content.innerHTML = `
      <div class="label-info">
        <div class="label-info-item">
          <div class="label-info-label">Coordinates:</div>
          <div>${label.y.toFixed(2)}, ${label.x.toFixed(2)}</div>
        </div>
        <div class="label-info-item">
          <div class="label-info-label">Min Zoom:</div>
          <div>${label.minZoom || 'Not set'}</div>
        </div>
        <div class="label-info-item">
          <div class="label-info-label">Status:</div>
          <div>${label.status || 'pending'}</div>
        </div>
        <div class="label-info-item">
          <div class="label-info-label">Created:</div>
          <div>${createdDate}</div>
        </div>
        ${label.notes ? `
          <div class="label-info-item">
            <div class="label-info-label">Notes:</div>
            <div>${label.notes}</div>
          </div>
        ` : ''}
      </div>
    `;
    
    // Label actions
    const actions = document.createElement('div');
    actions.className = 'label-actions';
    
    if (label.status === 'pending') {
      // Approve button
      const approveButton = document.createElement('button');
      approveButton.className = 'btn btn-primary';
      approveButton.textContent = 'Approve';
      approveButton.onclick = () => this.showApproveModal(label.id);
      
      // Reject button
      const rejectButton = document.createElement('button');
      rejectButton.className = 'btn btn-danger';
      rejectButton.textContent = 'Reject';
      rejectButton.onclick = () => this.showRejectModal(label.id);
      
      actions.appendChild(approveButton);
      actions.appendChild(rejectButton);
    } else {
      // Reset button
      const resetButton = document.createElement('button');
      resetButton.className = 'btn';
      resetButton.textContent = 'Reset to Pending';
      resetButton.onclick = () => this.resetLabelStatus(label.id);
      
      actions.appendChild(resetButton);
    }
    
    // View on map button
    const viewButton = document.createElement('button');
    viewButton.className = 'btn';
    viewButton.textContent = 'View on Map';
    viewButton.onclick = () => {
      // Store coordinates in sessionStorage for the map to pick up
      sessionStorage.setItem('ixmaps-view-label', JSON.stringify({
        x: label.x,
        y: label.y,
        zoom: Math.max(label.minZoom || 0, 0)
      }));
      window.location.href = '/';
    };
    
    actions.appendChild(viewButton);
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => {
      if (confirm(`Are you sure you want to delete the label "${label.name}"?`)) {
        this.deleteLabel(label.id);
      }
    };
    
    actions.appendChild(deleteButton);
    
    content.appendChild(actions);
    
    // Build card
    card.appendChild(header);
    card.appendChild(content);
    
    // Add history toggle if available
    if (label.history && label.history.length > 0) {
      const historyToggle = document.createElement('button');
      historyToggle.className = 'history-toggle';
      historyToggle.textContent = 'Show History';
      historyToggle.dataset.labelId = label.id;
      
      const historyContainer = document.createElement('div');
      historyContainer.className = 'label-history';
      historyContainer.id = `history-${label.id}`;
      
      // Add history items
      const sortedHistory = [...label.history].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });
      
      sortedHistory.forEach(historyItem => {
        const itemDate = historyItem.updatedAt ? new Date(historyItem.updatedAt).toLocaleString() : 'Unknown';
        
        const historyEntry = document.createElement('div');
        historyEntry.className = 'history-item';
        historyEntry.innerHTML = `
          <div class="history-date">${itemDate}</div>
          <div>
            <strong>Status:</strong> ${historyItem.status || 'Unknown'}<br>
            <strong>Text:</strong> ${historyItem.name || 'Unknown'}<br>
            <strong>Category:</strong> ${this.categoryLabels[historyItem.type] || historyItem.type || 'Unknown'}<br>
            ${historyItem.notes ? `<strong>Notes:</strong> ${historyItem.notes}<br>` : ''}
          </div>
        `;
        
        historyContainer.appendChild(historyEntry);
      });
      
      // Toggle history visibility
      historyToggle.addEventListener('click', function() {
        const historyDiv = document.getElementById(`history-${this.dataset.labelId}`);
        if (historyDiv.style.display === 'block') {
          historyDiv.style.display = 'none';
          this.textContent = 'Show History';
        } else {
          historyDiv.style.display = 'block';
          this.textContent = 'Hide History';
        }
      });
      
      card.appendChild(historyToggle);
      card.appendChild(historyContainer);
    }
    
    return card;
  }
  
  /**
   * Show approve modal
   */
  showApproveModal(labelId) {
    this.currentAction = {
      type: 'approve',
      labelId: labelId
    };
    
    const modal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const actionNotes = document.getElementById('action-notes');
    const confirmButton = document.getElementById('confirm-action');
    
    modalTitle.textContent = 'Approve Label';
    actionNotes.value = '';
    confirmButton.textContent = 'Confirm Approval';
    confirmButton.className = 'btn btn-primary';
    
    // Set up confirmation
    confirmButton.onclick = () => this.confirmAction();
    
    modal.style.display = 'flex';
  }
  
  /**
   * Show reject modal
   */
  showRejectModal(labelId) {
    this.currentAction = {
      type: 'reject',
      labelId: labelId
    };
    
    const modal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const actionNotes = document.getElementById('action-notes');
    const confirmButton = document.getElementById('confirm-action');
    
    modalTitle.textContent = 'Reject Label';
    actionNotes.value = '';
    confirmButton.textContent = 'Confirm Rejection';
    confirmButton.className = 'btn btn-danger';
    
    // Set up confirmation
    confirmButton.onclick = () => this.confirmAction();
    
    modal.style.display = 'flex';
  }
  
  /**
   * Confirm the current action
   */
  async confirmAction() {
    if (!this.currentAction) return;
    
    try {
      this.showLoading(true);
      
      const { type, labelId } = this.currentAction;
      const notes = document.getElementById('action-notes').value;
      
      if (type === 'reject' && !notes) {
        this.showNotification('Please provide a reason for rejection', 'warning');
        this.showLoading(false);
        return;
      }
      
      // Find the label
      const label = this.labels.find(l => l.id === labelId);
      
      if (!label) {
        throw new Error('Label not found');
      }
      
      // Update the label
      const updateData = {
        status: type === 'approve' ? 'approved' : 'rejected',
        notes: notes || label.notes
      };
      
      // Call API to update the label
      const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId || ''
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Close modal
      document.getElementById('action-modal').style.display = 'none';
      
      // Reload labels
      await this.loadLabels();
      
      // Show success notification
      this.showNotification(`Label ${type}d successfully`, 'success');
    } catch (error) {
      console.error(`Error ${this.currentAction.type}ing label:`, error);
      this.showNotification(`Failed to ${this.currentAction.type} label: ${error.message}`, 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * Reset a label status to pending
   */
  async resetLabelStatus(labelId) {
    try {
      this.showLoading(true);
      
      // Find the label
      const label = this.labels.find(l => l.id === labelId);
      
      if (!label) {
        throw new Error('Label not found');
      }
      
      // Update the label
      const updateData = {
        status: 'pending',
        notes: 'Reset to pending by administrator'
      };
      
      // Call API to update the label
      const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId || ''
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Reload labels
      await this.loadLabels();
      
      // Show success notification
      this.showNotification('Label reset to pending', 'success');
    } catch (error) {
      console.error('Error resetting label status:', error);
      this.showNotification('Failed to reset label status: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * Delete a label
   */
  async deleteLabel(labelId) {
    try {
      this.showLoading(true);
      
      // Call API to delete the label
      const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': this.sessionId || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Remove from local collection
      this.labels = this.labels.filter(l => l.id !== labelId);
      
      // Update the UI
      const labelCards = document.querySelectorAll(`.label-card[data-id="${labelId}"]`);
      labelCards.forEach(card => {
        card.remove();
      });
      
      // Show success notification
      this.showNotification('Label deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting label:', error);
      this.showNotification('Failed to delete label: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * Show loading indicator
   */
  showLoading(isLoading) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = isLoading ? 'flex' : 'none';
    }
  }
  
  /**
   * Show a notification
   */
  showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      document.body.removeChild(notification);
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after a delay
    setTimeout(() => {
      notification.classList.add('fadeout');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }
}

// Make available globally
window.IxMapAdmin = IxMapAdmin;