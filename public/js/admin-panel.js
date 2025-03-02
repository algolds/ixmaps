/**
 * IxMaps - Admin Panel
 * Interface for moderating map labels
 */

class IxMapAdmin {
    constructor(options) {
      this.apiBaseUrl = options.apiBaseUrl || '/api';
      this.sessionId = localStorage.getItem('ixmaps-session-id') || null;
      this.currentUser = null;
      this.labels = [];
      
      this.categoryLabels = options.categoryLabels || {
        'continent': 'Continent',
        'country': 'Country',
        'capital': 'Capital',
        'city': 'City',
        'landmark': 'Landmark',
        'water': 'Water Body'
      };
      
      this.init();
    }
    
    /**
     * Initialize the admin panel
     */
    async init() {
      try {
        // Check authentication
        await this.checkAuth();
        
        // Set up event listeners
        this.initEventListeners();
        
        // Load labels
        await this.loadLabels();
      } catch (error) {
        console.error('Error initializing admin panel:', error);
        this.showNotification('Error initializing admin panel', 'error');
      }
    }
    
    /**
     * Check authentication and admin privileges
     */
    async checkAuth() {
      try {
        this.showLoading(true);
        
        const response = await fetch(`${this.apiBaseUrl}/auth/status`, {
          headers: {
            'X-Session-ID': this.sessionId || ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Authentication check failed');
        }
        
        const data = await response.json();
        
        if (!data.authenticated) {
          window.location.href = '/?redirectToAdmin=true';
          throw new Error('Authentication required');
        }
        
        if (!data.isAdmin) {
          window.location.href = '/';
          throw new Error('Admin privileges required');
        }
        
        this.currentUser = {
          id: data.userId,
          username: data.username,
          isAdmin: true
        };
        
        // Update header
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
          headerTitle.textContent = `IxMaps Admin Panel - ${this.currentUser.username}`;
        }
        
        this.showLoading(false);
        return true;
      } catch (error) {
        console.error('Authentication error:', error);
        this.showLoading(false);
        return false;
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
    }
    
    /**
     * Load labels from the server
     */
    async loadLabels() {
      try {
        this.showLoading(true);
        
        const response = await fetch(`${this.apiBaseUrl}/labels`, {
          headers: {
            'X-Session-ID': this.sessionId || ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load labels');
        }
        
        this.labels = await response.json();
        
        // Organize labels by status
        const pendingLabels = this.labels.filter(label => label.status === 'pending');
        const approvedLabels = this.labels.filter(label => label.status === 'approved');
        const rejectedLabels = this.labels.filter(label => label.status === 'rejected');
        
        // Render labels
        this.renderLabels('pending-labels', pendingLabels);
        this.renderLabels('approved-labels', approvedLabels);
        this.renderLabels('rejected-labels', rejectedLabels);
        this.renderLabels('all-labels', this.labels);
        
        this.showLoading(false);
      } catch (error) {
        console.error('Error loading labels:', error);
        this.showNotification('Failed to load labels: ' + error.message, 'error');
        this.showLoading(false);
      }
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
        
        const endpoint = type === 'approve' 
          ? `${this.apiBaseUrl}/admin/approve/${labelId}`
          : `${this.apiBaseUrl}/admin/reject/${labelId}`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId || ''
          },
          body: JSON.stringify({ notes })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to ${type} label`);
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
        
        const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId || ''
          },
          body: JSON.stringify({
            status: 'pending',
            notes: 'Reset to pending by administrator'
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reset label status');
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