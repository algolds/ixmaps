/**
 * IxMaps - Admin Panel
 * Interface for moderating map labels
 * Modified to work with local storage instead of API
 */

class IxMapAdmin {
  constructor(options) {
    this.apiBaseUrl = options.apiBaseUrl || '/data/maps/ixmaps/public/api';
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
    
    // Storage keys
    this.STORAGE_KEYS = {
      APPROVED_LABELS: 'ixmaps-approved-labels',
      PENDING_LABELS: 'ixmaps-pending-labels',
      REJECTED_LABELS: 'ixmaps-rejected-labels'
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
      this.showNotification('Admin panel initialized with local storage', 'info');
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
        if (confirm('WARNING: This will delete ALL labels from local storage. This cannot be undone. Continue?')) {
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
  importLabelsFromJSON() {
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
      
      // Process and organize labels
      const approvedLabels = [];
      const pendingLabels = [];
      const rejectedLabels = [];
      
      importedLabels.forEach(label => {
        // Ensure each label has required fields
        const processedLabel = {
          ...label,
          id: label.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
          status: label.status || 'pending',
          createdBy: label.createdBy || this.currentUser.id,
          createdAt: label.createdAt || new Date().toISOString(),
          updatedAt: label.updatedAt || new Date().toISOString(),
          history: label.history || []
        };
        
        // Organize by status
        if (processedLabel.status === 'approved') {
          approvedLabels.push(processedLabel);
        } else if (processedLabel.status === 'rejected') {
          rejectedLabels.push(processedLabel);
        } else {
          pendingLabels.push(processedLabel);
        }
      });
      
      // Save to localStorage
      if (clearExisting) {
        localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify(approvedLabels));
        localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify(pendingLabels));
        localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify(rejectedLabels));
      } else {
        // Merge with existing labels
        const existingApproved = this.getLabelsFromStorage(this.STORAGE_KEYS.APPROVED_LABELS) || [];
        const existingPending = this.getLabelsFromStorage(this.STORAGE_KEYS.PENDING_LABELS) || [];
        const existingRejected = this.getLabelsFromStorage(this.STORAGE_KEYS.REJECTED_LABELS) || [];
        
        localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify([...existingApproved, ...approvedLabels]));
        localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify([...existingPending, ...pendingLabels]));
        localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify([...existingRejected, ...rejectedLabels]));
      }
      
      // Close import modal
      document.getElementById('import-modal').style.display = 'none';
      
      // Reload labels
      this.loadLabels();
      
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
  clearAllLabels() {
    // Clear localStorage
    localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify([]));
    
    // Reload labels
    this.loadLabels();
    
    this.showNotification('All labels have been cleared', 'success');
  }
  
  /**
   * Get labels from localStorage
   */
  getLabelsFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error loading from ${key}:`, error);
      return [];
    }
  }
  
  /**
   * Load labels from localStorage
   */
  async loadLabels() {
    try {
      this.showLoading(true);
      
      // Load from localStorage
      const approvedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.APPROVED_LABELS) || [];
      const pendingLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.PENDING_LABELS) || [];
      const rejectedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.REJECTED_LABELS) || [];
      
      // Combine all labels
      this.labels = [...approvedLabels, ...pendingLabels, ...rejectedLabels];
      
      // Try API as fallback
      if (this.labels.length === 0) {
        try {
          const response = await fetch(`${this.apiBaseUrl}/labels`, {
            headers: {
              'X-Session-ID': this.sessionId || ''
            }
          });
          
          if (response.ok) {
            this.labels = await response.json();
            
            // Organize by status
            const apiApproved = this.labels.filter(label => label.status === 'approved');
            const apiPending = this.labels.filter(label => label.status === 'pending');
            const apiRejected = this.labels.filter(label => label.status === 'rejected');
            
            // Save to localStorage
            localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify(apiApproved));
            localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify(apiPending));
            localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify(apiRejected));
            
            this.showNotification('Labels loaded from API and saved to localStorage', 'info');
          } else {
            this.showNotification('Creating sample labels for testing', 'info');
            // Create sample data if needed
            this.createSampleLabels();
          }
        } catch (error) {
          console.warn('API error, using sample data:', error);
          this.createSampleLabels();
        }
      }
      
      // Re-fetch from localStorage to ensure consistent data
      const storedApprovedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.APPROVED_LABELS) || [];
      const storedPendingLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.PENDING_LABELS) || [];
      const storedRejectedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.REJECTED_LABELS) || [];
      
      // Render labels
      this.renderLabels('pending-labels', storedPendingLabels);
      this.renderLabels('approved-labels', storedApprovedLabels);
      this.renderLabels('rejected-labels', storedRejectedLabels);
      this.renderLabels('all-labels', [...storedApprovedLabels, ...storedPendingLabels, ...storedRejectedLabels]);
      
      this.showLoading(false);
    } catch (error) {
      console.error('Error loading labels:', error);
      this.showNotification('Failed to load labels: ' + error.message, 'error');
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
    
    // Save to localStorage
    const approved = sampleLabels.filter(label => label.status === 'approved');
    const pending = sampleLabels.filter(label => label.status === 'pending');
    const rejected = sampleLabels.filter(label => label.status === 'rejected');
    
    localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify(approved));
    localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify(pending));
    localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify(rejected));
    
    this.labels = sampleLabels;
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
      
      // Find the label in the various collections
      let label = null;
      let found = false;
      
      // Search in pending labels
      const pendingLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.PENDING_LABELS);
      const labelIndex = pendingLabels.findIndex(l => l.id === labelId);
      
      if (labelIndex !== -1) {
        label = pendingLabels[labelIndex];
        
        // Add history
        if (!label.history) {
          label.history = [];
        }
        
        label.history.push({
          ...label,
          updatedBy: this.currentUser.id,
          updatedAt: new Date().toISOString()
        });
        
        // Update status and notes
        label.status = type === 'approve' ? 'approved' : 'rejected';
        label.updatedAt = new Date().toISOString();
        
        if (notes) {
          label.notes = notes;
        }
        
        // Remove from pending
        pendingLabels.splice(labelIndex, 1);
        
        // Add to appropriate collection
        if (type === 'approve') {
          const approvedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.APPROVED_LABELS);
          approvedLabels.push(label);
          localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify(approvedLabels));
        } else {
          const rejectedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.REJECTED_LABELS);
          rejectedLabels.push(label);
          localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify(rejectedLabels));
        }
        
        // Update pending labels
        localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify(pendingLabels));
        
        found = true;
      }
      
      if (!found) {
        throw new Error('Label not found');
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
      
      // Find the label in the various collections
      let label = null;
      let sourceCollection = null;
      let sourceIndex = -1;
      
      // Check approved labels
      const approvedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.APPROVED_LABELS);
      sourceIndex = approvedLabels.findIndex(l => l.id === labelId);
      
      if (sourceIndex !== -1) {
        label = approvedLabels[sourceIndex];
        sourceCollection = approvedLabels;
        localStorage.removeItem(this.STORAGE_KEYS.APPROVED_LABELS);
      } else {
        // Check rejected labels
        const rejectedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.REJECTED_LABELS);
        sourceIndex = rejectedLabels.findIndex(l => l.id === labelId);
        
        if (sourceIndex !== -1) {
          label = rejectedLabels[sourceIndex];
          sourceCollection = rejectedLabels;
          localStorage.removeItem(this.STORAGE_KEYS.REJECTED_LABELS);
        }
      }
      
      if (label) {
        // Add to history
        if (!label.history) {
          label.history = [];
        }
        
        label.history.push({
          ...label,
          updatedBy: this.currentUser.id,
          updatedAt: new Date().toISOString()
        });
        
        // Update status
        label.status = 'pending';
        label.updatedAt = new Date().toISOString();
        label.notes = 'Reset to pending by administrator';
        
        // Remove from source collection
        sourceCollection.splice(sourceIndex, 1);
        
        // Save updated source collection
        if (sourceIndex !== -1) {
          if (sourceCollection === approvedLabels) {
            localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify(sourceCollection));
          } else {
            localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify(sourceCollection));
          }
        }
        
        // Add to pending labels
        const pendingLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.PENDING_LABELS);
        pendingLabels.push(label);
        localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify(pendingLabels));
        
        // Reload labels
        await this.loadLabels();
        
        // Show success notification
        this.showNotification('Label reset to pending', 'success');
      } else {
        throw new Error('Label not found');
      }
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
      
      // Find and remove from all collections
      let found = false;
      
      // Check approved labels
      const approvedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.APPROVED_LABELS);
      const approvedIndex = approvedLabels.findIndex(l => l.id === labelId);
      
      if (approvedIndex !== -1) {
        approvedLabels.splice(approvedIndex, 1);
        localStorage.setItem(this.STORAGE_KEYS.APPROVED_LABELS, JSON.stringify(approvedLabels));
        found = true;
      }
      
      // Check pending labels
      const pendingLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.PENDING_LABELS);
      const pendingIndex = pendingLabels.findIndex(l => l.id === labelId);
      
      if (pendingIndex !== -1) {
        pendingLabels.splice(pendingIndex, 1);
        localStorage.setItem(this.STORAGE_KEYS.PENDING_LABELS, JSON.stringify(pendingLabels));
        found = true;
      }
      
      // Check rejected labels
      const rejectedLabels = this.getLabelsFromStorage(this.STORAGE_KEYS.REJECTED_LABELS);
      const rejectedIndex = rejectedLabels.findIndex(l => l.id === labelId);
      
      if (rejectedIndex !== -1) {
        rejectedLabels.splice(rejectedIndex, 1);
        localStorage.setItem(this.STORAGE_KEYS.REJECTED_LABELS, JSON.stringify(rejectedLabels));
        found = true;
      }
      
      if (!found) {
        throw new Error('Label not found');
      }
      
      // Reload labels
      await this.loadLabels();
      
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