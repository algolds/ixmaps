/**
 * IxMaps - Interactive Map Editor
 * Adds label editing and management capabilities to the IxMaps viewer
 */

class IxMapEditor {
  constructor(options) {
    this.mapContainerId = options.containerId || 'map';
    this.apiBaseUrl = options.apiBaseUrl || '/api';
    this.sessionId = localStorage.getItem('ixmaps-session-id') || null;
    
    // State variables
    this.map = null;
    this.editMode = false;
    this.currentUser = null;
    this.labels = [];
    this.pendingLabels = [];
    this.selectedLabel = null;
    this.labelLayerGroup = null;
    
    // Label categories
    this.labelCategories = options.labelCategories || [
      { id: 'continent', name: 'Continent', minZoom: -3 },
      { id: 'country', name: 'Country', minZoom: -1 },
      { id: 'capital', name: 'Capital', minZoom: 0 },
      { id: 'city', name: 'City', minZoom: 1 },
      { id: 'landmark', name: 'Landmark', minZoom: 2 },
      { id: 'water', name: 'Water Body', minZoom: -2 }
    ];
    
    // Initialize editor components
    this.initializeEditor();
  }
  
  /**
   * Initialize the editor components
   */
  async initializeEditor() {
    // Add editor UI
    this.createEditorUI();
    
    // Check authentication status
    await this.checkAuthStatus();
    
    // Initialize event listeners
    this.initializeEventListeners();
    
    console.log('Editor initialized');
  }
  
  /**
   * Set the Leaflet map instance
   */
  setMap(map) {
    this.map = map;
    this.labelLayerGroup = L.layerGroup().addTo(map);
    
    // Add map click handler for adding labels
    this.map.on('click', (e) => {
      if (this.editMode && this.currentUser) {
        this.showLabelCreationForm(e.latlng);
      }
    });
    
    // Add zoom handler for label visibility
    this.map.on('zoomend', () => {
      this.updateVisibleLabels();
    });
  }
  
  /**
   * Create the editor UI elements
   */
  createEditorUI() {
    // Create editor toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.id = 'editor-toolbar';
    toolbar.style.display = 'none';
    
    // Auth status
    const authStatus = document.createElement('div');
    authStatus.className = 'auth-status not-authenticated';
    authStatus.id = 'auth-status';
    authStatus.textContent = 'Not logged in';
    
    // Editor toggle button
    const editorToggle = document.createElement('button');
    editorToggle.id = 'editor-toggle';
    editorToggle.className = 'editor-button';
    editorToggle.textContent = 'Enter Editor Mode';
    
    // Admin panel link
    const adminLink = document.createElement('a');
    adminLink.href = '/admin';
    adminLink.id = 'admin-link';
    adminLink.className = 'editor-button';
    adminLink.textContent = 'Admin Panel';
    adminLink.style.display = 'none';
    
    // Assemble toolbar
    toolbar.appendChild(authStatus);
    toolbar.appendChild(editorToggle);
    toolbar.appendChild(adminLink);
    
    // Label creation form
    const labelForm = document.createElement('div');
    labelForm.id = 'ixmap-label-form-container';
    labelForm.className = 'ixmap-form-container';
    labelForm.style.display = 'none';
    labelForm.innerHTML = `
      <form id="ixmap-label-form" class="ixmap-form">
        <h3>Add New Label</h3>
        
        <div class="form-group">
          <label for="ixmap-label-text">Label Text:</label>
          <input type="text" id="ixmap-label-text" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="ixmap-label-category">Category:</label>
          <select id="ixmap-label-category" name="type" required>
            <!-- Will be populated by JavaScript -->
          </select>
        </div>
        
        <div class="form-group">
          <label for="ixmap-label-min-zoom">Minimum Zoom Level:</label>
          <input type="number" id="ixmap-label-min-zoom" name="minZoom" min="-3" max="3" step="0.1" required>
        </div>
        
        <div class="form-group">
          <label for="ixmap-label-notes">Notes (optional):</label>
          <textarea id="ixmap-label-notes" name="notes" rows="2"></textarea>
        </div>
        
        <input type="hidden" id="ixmap-label-lat" name="y">
        <input type="hidden" id="ixmap-label-lng" name="x">
        
        <div class="form-buttons">
          <button type="submit" class="ixmap-button primary">Submit for Approval</button>
          <button type="button" id="ixmap-label-cancel" class="ixmap-button">Cancel</button>
        </div>
      </form>
    `;
    
    // Label edit form
    const editForm = document.createElement('div');
    editForm.id = 'ixmap-label-edit-form-container';
    editForm.className = 'ixmap-form-container';
    editForm.style.display = 'none';
    editForm.innerHTML = `
      <form id="ixmap-label-edit-form" class="ixmap-form">
        <h3>Edit Label</h3>
        
        <div class="form-group">
          <label for="ixmap-edit-label-text">Label Text:</label>
          <input type="text" id="ixmap-edit-label-text" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="ixmap-edit-label-category">Category:</label>
          <select id="ixmap-edit-label-category" name="type" required>
            <!-- Will be populated by JavaScript -->
          </select>
        </div>
        
        <div class="form-group">
          <label for="ixmap-edit-label-min-zoom">Minimum Zoom Level:</label>
          <input type="number" id="ixmap-edit-label-min-zoom" name="minZoom" min="-3" max="3" step="0.1" required>
        </div>
        
        <div class="form-group">
          <label for="ixmap-edit-label-notes">Notes (optional):</label>
          <textarea id="ixmap-edit-label-notes" name="notes" rows="2"></textarea>
        </div>
        
        <input type="hidden" id="ixmap-edit-label-id" name="id">
        
        <div class="form-buttons">
          <button type="submit" class="ixmap-button primary">Update</button>
          <button type="button" id="ixmap-edit-label-delete" class="ixmap-button danger">Delete</button>
          <button type="button" id="ixmap-edit-label-cancel" class="ixmap-button">Cancel</button>
        </div>
      </form>
    `;
    
    // Login dialog
    const loginDialog = document.createElement('div');
    loginDialog.id = 'ixmap-login-dialog';
    loginDialog.className = 'ixmap-modal';
    loginDialog.style.display = 'none';
    loginDialog.innerHTML = `
      <div class="ixmap-modal-content">
        <h2>Login</h2>
        <form id="ixmap-login-form">
          <div class="form-group">
            <label for="ixmap-login-username">Username:</label>
            <input type="text" id="ixmap-login-username" name="username" required>
          </div>
          <div class="form-group">
            <label for="ixmap-login-password">Password:</label>
            <input type="password" id="ixmap-login-password" name="password">
            <small>(Any password works for demo)</small>
          </div>
          <div class="form-buttons">
            <button type="submit" class="ixmap-button primary">Login</button>
            <button type="button" id="ixmap-login-cancel" class="ixmap-button">Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    // Add elements to the document
    document.body.appendChild(toolbar);
    document.body.appendChild(labelForm);
    document.body.appendChild(editForm);
    document.body.appendChild(loginDialog);
    
    // Add CSS for editor elements
    this.addEditorStyles();
  }
  
  /**
   * Add CSS styles for editor UI
   */
  addEditorStyles() {
    if (document.getElementById('ixmap-editor-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ixmap-editor-styles';
    style.textContent = `
      .editor-toolbar {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 1000;
        background: white;
        padding: 5px 10px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .editor-button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        background-color: #3498db;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;
        font-size: 14px;
        text-decoration: none;
      }
      
      .editor-button:hover {
        background-color: #2980b9;
      }
      
      .editor-button.active {
        background-color: #2ecc71;
      }
      
      .editor-button:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
      }
      
      .auth-status {
        font-size: 14px;
        margin-right: 5px;
      }
      
      .auth-status.authenticated {
        color: #2ecc71;
      }
      
      .auth-status.not-authenticated {
        color: #e74c3c;
      }
      
      .ixmap-form-container {
        position: absolute;
        z-index: 1000;
        background-color: white;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        width: 300px;
        padding: 15px;
      }
      
      .ixmap-form h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #2c3e50;
        border-bottom: 1px solid #f5f5f5;
        padding-bottom: 10px;
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        font-size: 14px;
      }
      
      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
        font-family: inherit;
      }
      
      .form-buttons {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 20px;
      }
      
      .ixmap-button {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        background-color: #3498db;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;
        font-size: 14px;
      }
      
      .ixmap-button:hover {
        background-color: #2980b9;
      }
      
      .ixmap-button.primary {
        background-color: #2ecc71;
      }
      
      .ixmap-button.primary:hover {
        background-color: #27ae60;
      }
      
      .ixmap-button.danger {
        background-color: #e74c3c;
      }
      
      .ixmap-button.danger:hover {
        background-color: #c0392b;
      }
      
      .ixmap-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      
      .ixmap-modal-content {
        background-color: white;
        border-radius: 5px;
        padding: 20px;
        width: 90%;
        max-width: 400px;
      }
      
      .ixmap-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        color: white;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        opacity: 1;
        transition: opacity 0.5s;
        max-width: 300px;
      }
      
      .ixmap-notification.info {
        background-color: #3498db;
      }
      
      .ixmap-notification.success {
        background-color: #2ecc71;
      }
      
      .ixmap-notification.warning {
        background-color: #f39c12;
      }
      
      .ixmap-notification.error {
        background-color: #e74c3c;
      }
      
      .ixmap-notification.fadeout {
        opacity: 0;
      }
      
      .pending-label {
        opacity: 0.7;
        border: 2px dashed #ff6600;
        padding: 2px 5px;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.7);
      }
      
      #map.edit-mode {
        cursor: crosshair;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Editor toggle
    const editorToggle = document.getElementById('editor-toggle');
    if (editorToggle) {
      editorToggle.addEventListener('click', () => {
        this.toggleEditorMode();
      });
    }
    
    // Label form submission
    const labelForm = document.getElementById('ixmap-label-form');
    if (labelForm) {
      labelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createLabel();
      });
    }
    
    // Label form cancel
    const labelCancel = document.getElementById('ixmap-label-cancel');
    if (labelCancel) {
      labelCancel.addEventListener('click', () => {
        document.getElementById('ixmap-label-form-container').style.display = 'none';
      });
    }
    
    // Edit form submission
    const editForm = document.getElementById('ixmap-label-edit-form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateLabel();
      });
    }
    
    // Edit form cancel
    const editCancel = document.getElementById('ixmap-edit-label-cancel');
    if (editCancel) {
      editCancel.addEventListener('click', () => {
        document.getElementById('ixmap-label-edit-form-container').style.display = 'none';
      });
    }
    
    // Delete button
    const deleteButton = document.getElementById('ixmap-edit-label-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        const labelId = document.getElementById('ixmap-edit-label-id').value;
        if (confirm('Are you sure you want to delete this label?')) {
          this.deleteLabel(labelId);
          document.getElementById('ixmap-label-edit-form-container').style.display = 'none';
        }
      });
    }
    
    // Login form
    const loginForm = document.getElementById('ixmap-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.login();
      });
    }
    
    // Login cancel
    const loginCancel = document.getElementById('ixmap-login-cancel');
    if (loginCancel) {
      loginCancel.addEventListener('click', () => {
        document.getElementById('ixmap-login-dialog').style.display = 'none';
      });
    }
    
    // Initialize category dropdowns
    this.populateCategoryDropdowns();
  }
  
  /**
   * Populate category dropdowns in forms
   */
  populateCategoryDropdowns() {
    const categorySelects = [
      document.getElementById('ixmap-label-category'),
      document.getElementById('ixmap-edit-label-category')
    ];
    
    categorySelects.forEach(select => {
      if (select) {
        // Clear existing options
        select.innerHTML = '';
        
        // Add options for each category
        this.labelCategories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          select.appendChild(option);
        });
      }
    });
  }
  
  /**
   * Check authentication status
   */
  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/status`, {
        headers: {
          'X-Session-ID': this.sessionId || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.authenticated) {
          this.currentUser = {
            id: data.userId,
            username: data.username,
            isAdmin: data.isAdmin || false
          };
          
          this.updateAuthUI(true);
        } else {
          this.currentUser = null;
          this.updateAuthUI(false);
        }
      } else {
        this.currentUser = null;
        this.updateAuthUI(false);
      }
      
      // Show the editor toolbar
      document.getElementById('editor-toolbar').style.display = 'flex';
      
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.showNotification('Authentication check failed', 'error');
      this.updateAuthUI(false);
    }
  }
  
  /**
   * Update authentication UI
   */
  updateAuthUI(isAuthenticated) {
    const authStatus = document.getElementById('auth-status');
    const editorToggle = document.getElementById('editor-toggle');
    const adminLink = document.getElementById('admin-link');
    
    if (authStatus) {
      if (isAuthenticated && this.currentUser) {
        authStatus.textContent = `Logged in as: ${this.currentUser.username}`;
        authStatus.className = 'auth-status authenticated';
      } else {
        authStatus.textContent = 'Not logged in';
        authStatus.className = 'auth-status not-authenticated';
      }
    }
    
    if (editorToggle) {
      editorToggle.disabled = !isAuthenticated;
    }
    
    if (adminLink && this.currentUser) {
      adminLink.style.display = this.currentUser.isAdmin ? 'inline-block' : 'none';
    }
  }
  
  /**
   * Show login dialog
   */
  showLoginDialog() {
    document.getElementById('ixmap-login-dialog').style.display = 'flex';
    document.getElementById('ixmap-login-username').focus();
  }
  
  /**
   * Login
   */
  async login() {
    try {
      const username = document.getElementById('ixmap-login-username').value;
      const password = document.getElementById('ixmap-login-password').value;
      
      if (!username) {
        this.showNotification('Username is required', 'error');
        return;
      }
      
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Store session ID
          this.sessionId = data.sessionId;
          localStorage.setItem('ixmaps-session-id', this.sessionId);
          
          // Update user info
          this.currentUser = {
            id: data.user.id,
            username: data.user.username,
            isAdmin: data.user.isAdmin || false
          };
          
          // Update UI
          this.updateAuthUI(true);
          
          // Hide dialog
          document.getElementById('ixmap-login-dialog').style.display = 'none';
          
          // Show success notification
          this.showNotification(`Welcome, ${data.user.username}!`, 'success');
          
          // Reload labels to show pending ones
          await this.loadLabels();
        } else {
          this.showNotification(data.message || 'Login failed', 'error');
        }
      } else {
        const error = await response.json();
        this.showNotification(error.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Login failed: ' + error.message, 'error');
    }
  }
  
  /**
   * Logout
   */
  async logout() {
    try {
      await fetch(`${this.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'X-Session-ID': this.sessionId || ''
        }
      });
      
      // Clear session
      this.sessionId = null;
      localStorage.removeItem('ixmaps-session-id');
      this.currentUser = null;
      
      // Update UI
      this.updateAuthUI(false);
      
      // Exit editor mode if active
      if (this.editMode) {
        this.toggleEditorMode();
      }
      
      // Show notification
      this.showNotification('Logged out successfully', 'info');
      
      // Reload labels to hide pending ones
      await this.loadLabels();
      
    } catch (error) {
      console.error('Logout error:', error);
      this.showNotification('Logout failed: ' + error.message, 'error');
    }
  }
  
  /**
   * Toggle editor mode
   */
  toggleEditorMode() {
    if (!this.currentUser) {
      this.showLoginDialog();
      return;
    }
    
    this.editMode = !this.editMode;
    
    const editorToggle = document.getElementById('editor-toggle');
    const mapElement = document.getElementById('map');
    
    if (editorToggle) {
      editorToggle.textContent = this.editMode ? 'Exit Editor Mode' : 'Enter Editor Mode';
      editorToggle.classList.toggle('active', this.editMode);
    }
    
    if (mapElement) {
      mapElement.classList.toggle('edit-mode', this.editMode);
    }
  }
  
  /**
   * Load labels from server
   */
  async loadLabels() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/labels`, {
        headers: {
          'X-Session-ID': this.sessionId || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load labels');
      }
      
      const labels = await response.json();
      
      // Separate approved and pending labels
      this.labels = labels.filter(label => label.status === 'approved');
      this.pendingLabels = labels.filter(label => label.status === 'pending');
      
      // Update the map
      this.updateVisibleLabels();
      
      return labels;
    } catch (error) {
      console.error('Error loading labels:', error);
      this.showNotification('Failed to load labels: ' + error.message, 'error');
      return [];
    }
  }
  
  /**
   * Update visible labels on the map
   */
  updateVisibleLabels() {
    if (!this.map || !this.labelLayerGroup) return;
    
    // Clear existing labels
    this.labelLayerGroup.clearLayers();
    
    const currentZoom = this.map.getZoom();
    
    // Add approved labels
    this.labels.forEach(label => {
      if (currentZoom >= (label.minZoom || -3)) {
        this.addLabelToMap(label, false);
      }
    });
    
    // Add pending labels (only visible to creator)
    if (this.currentUser) {
      this.pendingLabels.forEach(label => {
        if (label.createdBy === this.currentUser.id && currentZoom >= (label.minZoom || -3)) {
          this.addLabelToMap(label, true);
        }
      });
    }
  }
  
  /**
   * Add a label to the map
   */
  addLabelToMap(label, isPending) {
    if (!this.map || !this.labelLayerGroup) return;
    
    // Create the marker HTML
    const labelHtml = `
      <div class="${isPending ? 'pending-label' : ''} label-${label.type}">
        ${label.name || ''}${isPending ? ' (pending)' : ''}
      </div>
    `;
    
    // Create the marker
    const marker = L.marker([label.y, label.x], {
      icon: L.divIcon({
        className: 'map-label',
        html: labelHtml,
        iconSize: [100, 20],
        iconAnchor: [50, 10]
      })
    });
    
    // Add click event for editing
    marker.on('click', (e) => {
      // Prevent propagation to map
      L.DomEvent.stopPropagation(e);
      
      if (this.editMode && this.currentUser) {
        const canEdit = isPending || 
                       this.currentUser.isAdmin || 
                       label.createdBy === this.currentUser.id;
        
        if (canEdit) {
          this.showLabelEditForm(label);
        }
      }
    });
    
    // Add to layer group
    marker.addTo(this.labelLayerGroup);
    
    return marker;
  }
  
  /**
   * Show label creation form
   */
  showLabelCreationForm(latlng) {
    const formContainer = document.getElementById('ixmap-label-form-container');
    const form = document.getElementById('ixmap-label-form');
    
    if (!formContainer || !form) {
      console.error('Label form elements not found');
      return;
    }
    
    // Reset form
    form.reset();
    
    // Set coordinates
    document.getElementById('ixmap-label-lat').value = latlng.lat;
    document.getElementById('ixmap-label-lng').value = latlng.lng;
    
    // Set current zoom level
    const currentZoom = this.map.getZoom();
    document.getElementById('ixmap-label-min-zoom').value = currentZoom;
    
    // Show form
    formContainer.style.display = 'block';
    
    // Position form near click location
    const point = this.map.latLngToContainerPoint(latlng);
    formContainer.style.left = `${point.x + 20}px`;
    formContainer.style.top = `${point.y - 30}px`;
    
    // Focus on text input
    document.getElementById('ixmap-label-text').focus();
  }
  
  /**
   * Create a new label
   */
  async createLabel() {
    if (!this.currentUser) {
      this.showNotification('Please log in to create labels', 'error');
      return;
    }
    
    try {
      const form = document.getElementById('ixmap-label-form');
      const formData = new FormData(form);
      
      const labelData = {
        name: formData.get('name'),
        type: formData.get('type'),
        y: parseFloat(formData.get('y')),
        x: parseFloat(formData.get('x')),
        minZoom: parseFloat(formData.get('minZoom')),
        notes: formData.get('notes') || ''
      };
      
      // Validate data
      if (!labelData.name) {
        this.showNotification('Label text is required', 'error');
        return;
      }
      
      // Submit to API
      const response = await fetch(`${this.apiBaseUrl}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId || ''
        },
        body: JSON.stringify(labelData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create label');
      }
      
      const newLabel = await response.json();
      
      // Add to appropriate collection
      if (newLabel.status === 'approved') {
        this.labels.push(newLabel);
      } else {
        this.pendingLabels.push(newLabel);
      }
      
      // Update the map
      this.updateVisibleLabels();
      
      // Hide the form
      document.getElementById('ixmap-label-form-container').style.display = 'none';
      
      // Show success notification
      if (newLabel.status === 'approved') {
        this.showNotification('Label created successfully', 'success');
      } else {
        this.showNotification('Label submitted for approval', 'success');
      }
      
    } catch (error) {
      console.error('Error creating label:', error);
      this.showNotification('Failed to create label: ' + error.message, 'error');
    }
  }
  
  /**
   * Show label edit form
   */
  showLabelEditForm(label) {
    const formContainer = document.getElementById('ixmap-label-edit-form-container');
    const form = document.getElementById('ixmap-label-edit-form');
    
    if (!formContainer || !form) {
      console.error('Label edit form elements not found');
      return;
    }
    
    // Store selected label
    this.selectedLabel = label;
    
    // Set form values
    document.getElementById('ixmap-edit-label-id').value = label.id;
    document.getElementById('ixmap-edit-label-text').value = label.name || '';
    document.getElementById('ixmap-edit-label-category').value = label.type || '';
    document.getElementById('ixmap-edit-label-min-zoom').value = label.minZoom || 0;
    document.getElementById('ixmap-edit-label-notes').value = label.notes || '';
    
    // Show form
    formContainer.style.display = 'block';
    
    // Position form near label
    const point = this.map.latLngToContainerPoint([label.y, label.x]);
    formContainer.style.left = `${point.x + 20}px`;
    formContainer.style.top = `${point.y - 30}px`;
    
    // Focus on text input
    document.getElementById('ixmap-edit-label-text').focus();
  }
  
  /**
   * Update an existing label
   */
  async updateLabel() {
    if (!this.currentUser || !this.selectedLabel) {
      return;
    }
    
    try {
      const form = document.getElementById('ixmap-label-edit-form');
      const formData = new FormData(form);
      
      const labelId = formData.get('id');
      const labelData = {
        name: formData.get('name'),
        type: formData.get('type'),
        minZoom: parseFloat(formData.get('minZoom')),
        notes: formData.get('notes') || ''
      };
      
      // Validate data
      if (!labelData.name) {
        this.showNotification('Label text is required', 'error');
        return;
      }
      
      // Submit to API
      const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId || ''
        },
        body: JSON.stringify(labelData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update label');
      }
      
      const updatedLabel = await response.json();
      
      // Update local data
      const wasApproved = this.selectedLabel.status === 'approved';
      const isNowApproved = updatedLabel.status === 'approved';
      
      if (wasApproved && isNowApproved) {
        // Update in approved list
        const index = this.labels.findIndex(l => l.id === labelId);
        if (index !== -1) {
          this.labels[index] = updatedLabel;
        }
      } else if (wasApproved && !isNowApproved) {
        // Move from approved to pending
        this.labels = this.labels.filter(l => l.id !== labelId);
        this.pendingLabels.push(updatedLabel);
      } else if (!wasApproved && isNowApproved) {
        // Move from pending to approved
        this.pendingLabels = this.pendingLabels.filter(l => l.id !== labelId);
        this.labels.push(updatedLabel);
      } else {
        // Update in pending list
        const index = this.pendingLabels.findIndex(l => l.id === labelId);
        if (index !== -1) {
          this.pendingLabels[index] = updatedLabel;
        }
      }
      
      // Update the map
      this.updateVisibleLabels();
      
      // Hide the form
      document.getElementById('ixmap-label-edit-form-container').style.display = 'none';
      
      // Show success notification
      if (isNowApproved) {
        this.showNotification('Label updated successfully', 'success');
      } else {
        this.showNotification('Label updated and submitted for approval', 'success');
      }
      
    } catch (error) {
      console.error('Error updating label:', error);
      this.showNotification('Failed to update label: ' + error.message, 'error');
    }
  }
  
  /**
   * Delete a label
   */
  async deleteLabel(labelId) {
    if (!this.currentUser) {
      return;
    }
    
    try {
      // Submit to API
      const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': this.sessionId || ''
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete label');
      }
      
      // Update local data
      this.labels = this.labels.filter(l => l.id !== labelId);
      this.pendingLabels = this.pendingLabels.filter(l => l.id !== labelId);
      
      // Update the map
      this.updateVisibleLabels();
      
      // Show success notification
      this.showNotification('Label deleted successfully', 'success');
      
    } catch (error) {
      console.error('Error deleting label:', error);
      this.showNotification('Failed to delete label: ' + error.message, 'error');
    }
  }
  
  /**
   * Show a notification
   */
  showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let container = document.getElementById('ixmap-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ixmap-notifications';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '2000';
      document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `ixmap-notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    container.appendChild(notification);
    
    // Remove after a delay
    setTimeout(() => {
      notification.classList.add('fadeout');
      setTimeout(() => {
        container.removeChild(notification);
        
        // Remove container if empty
        if (container.children.length === 0) {
          document.body.removeChild(container);
        }
      }, 500);
    }, 3000);
  }
}

// Make it available globally
window.IxMapEditor = IxMapEditor;