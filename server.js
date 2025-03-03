/**
 * IxMaps - Server Implementation
 * Express server that provides API endpoints for map data
 * Uses JSON files for persistent storage
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration for JSON file paths
// These are one directory up from the server script
const CONFIG = {
  LABELS_FILE: path.join(__dirname, '..', 'labels.json'),
  LAYERS_FILE: path.join(__dirname, '..', 'layers.json'),
  LEGEND_FILE: path.join(__dirname, '..', 'legend.json'),
  SETTINGS_FILE: path.join(__dirname, '..', 'settings.json'),
  USERS_FILE: path.join(__dirname, '..', 'users.json')
};

// Middleware
app.use(bodyParser.json());

// Serve static files from the public directory
// You can adjust this path if needed
app.use('/data/maps/ixmaps/public', express.static(path.join(__dirname, 'public')));

// Redirect root to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirect /admin to admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '/public/admin.html'));
});

// --- JSON File Utilities ---

/**
 * Initialize a JSON file with default content if it doesn't exist
 */
function initializeJsonFile(filePath, defaultContent) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
      console.log(`Initialized ${path.basename(filePath)} with default content`);
    }
  } catch (error) {
    console.error(`Error initializing ${path.basename(filePath)}:`, error);
  }
}

/**
 * Read data from a JSON file
 */
function readJsonFile(filePath, defaultContent = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      initializeJsonFile(filePath, defaultContent);
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${path.basename(filePath)}:`, error);
    return defaultContent;
  }
}

/**
 * Write data to a JSON file
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${path.basename(filePath)}:`, error);
    return false;
  }
}

// --- Initialize files with default content ---

// Initialize labels.json
initializeJsonFile(CONFIG.LABELS_FILE, {
  approved: [],
  pending: [],
  rejected: []
});

// Initialize layers.json
initializeJsonFile(CONFIG.LAYERS_FILE, {
  layers: [
    { id: 'continents', label: 'Continents', labelTypes: ['continent'], defaultVisible: true },
    { id: 'countries', label: 'Countries', labelTypes: ['country'], defaultVisible: true },
    { id: 'capitals', label: 'Capitals', labelTypes: ['capital'], defaultVisible: true },
    { id: 'cities', label: 'Cities', labelTypes: ['city'], defaultVisible: true },
    { id: 'landmarks', label: 'Landmarks', labelTypes: ['landmark'], defaultVisible: true },
    { id: 'waters', label: 'Water Bodies', labelTypes: ['water'], defaultVisible: true }
  ]
});

// Initialize legend.json
initializeJsonFile(CONFIG.LEGEND_FILE, {
  colorSchemes: {
    topographic: {
      name: "Topographic",
      sections: [
        {
          title: "Elevation",
          items: [
            { color: "#d8f2ba", label: "Lowlands" },
            { color: "#b9df7e", label: "Hills" },
            { color: "#8ebe56", label: "Highlands" },
            { color: "#598834", label: "Mountains" },
            { color: "#39521f", label: "Peaks" }
          ]
        },
        {
          title: "Water",
          items: [
            { color: "#a3cddb", label: "Ocean" },
            { color: "#b8def0", label: "Lakes" }
          ]
        }
      ]
    }
  },
  currentScheme: "topographic"
});

// Initialize settings.json
initializeJsonFile(CONFIG.SETTINGS_FILE, {
  mapSettings: {
    title: "IxMaps",
    version: "2.3.0",
    svgPath: "/data/maps/ixmaps/public/map.svg",
    defaultZoom: 0,
    enableWrapping: true
  }
});

// Initialize users.json
initializeJsonFile(CONFIG.USERS_FILE, {
  users: [
    {
      id: "admin-1",
      username: "Admin",
      passwordHash: "dummy-hash", // In a real app, use proper hashing
      isAdmin: true
    },
    {
      id: "user-1",
      username: "Guest Editor",
      passwordHash: "dummy-hash", // In a real app, use proper hashing
      isAdmin: false
    }
  ],
  sessions: {}
});

// --- API Endpoints ---

// --- Labels API ---

// Get all labels
app.get('/data/maps/ixmaps/api/labels', (req, res) => {
  try {
    const labels = readJsonFile(CONFIG.LABELS_FILE, { approved: [], pending: [], rejected: [] });
    
    // Combine all labels and add status property
    const allLabels = [
      ...labels.approved.map(label => ({ ...label, status: 'approved' })),
      ...labels.pending.map(label => ({ ...label, status: 'pending' })),
      ...labels.rejected.map(label => ({ ...label, status: 'rejected' }))
    ];
    
    res.json(allLabels);
  } catch (error) {
    console.error('Error retrieving labels:', error);
    res.status(500).json({ error: 'Failed to retrieve labels' });
  }
});

// Get labels by status
app.get('/data/maps/ixmaps/api/labels/:status', (req, res) => {
  try {
    const { status } = req.params;
    const labels = readJsonFile(CONFIG.LABELS_FILE, { approved: [], pending: [], rejected: [] });
    
    if (!labels[status]) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    res.json(labels[status]);
  } catch (error) {
    console.error(`Error retrieving ${req.params.status} labels:`, error);
    res.status(500).json({ error: `Failed to retrieve ${req.params.status} labels` });
  }
});

// Create a new label
app.post('/api/labels', (req, res) => {
  try {
    const labelData = req.body;
    
    // Validate required fields
    if (!labelData.name || !labelData.type || 
        typeof labelData.x !== 'number' || typeof labelData.y !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create new label with default properties
    const newLabel = {
      id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: labelData.name,
      type: labelData.type,
      x: labelData.x,
      y: labelData.y,
      minZoom: labelData.minZoom || 0,
      notes: labelData.notes || '',
      createdBy: labelData.createdBy || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };
    
    // Read current labels
    const labels = readJsonFile(CONFIG.LABELS_FILE, { approved: [], pending: [], rejected: [] });
    
    // Add to appropriate collection based on status (default to pending unless admin)
    const status = labelData.isAdmin ? 'approved' : 'pending';
    
    labels[status].push(newLabel);
    
    // Save to file
    if (writeJsonFile(CONFIG.LABELS_FILE, labels)) {
      // Return the created label with status
      res.status(201).json({ ...newLabel, status });
    } else {
      res.status(500).json({ error: 'Failed to save label' });
    }
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// Update a label
app.put('/data/maps/ixmaps/api/labels/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Read current labels
    const labels = readJsonFile(CONFIG.LABELS_FILE, { approved: [], pending: [], rejected: [] });
    
    // Find the label in all collections
    let found = false;
    let foundInStatus;
    let labelIndex;
    
    // Check each collection
    for (const status of ['approved', 'pending', 'rejected']) {
      labelIndex = labels[status].findIndex(label => label.id === id);
      if (labelIndex !== -1) {
        foundInStatus = status;
        found = true;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    // Get the label
    const label = labels[foundInStatus][labelIndex];
    
    // Add current state to history before updating
    if (!label.history) {
      label.history = [];
    }
    
    label.history.push({
      ...label,
      updatedAt: new Date().toISOString()
    });
    
    // Update fields
    const updatedLabel = {
      ...label,
      name: updateData.name || label.name,
      type: updateData.type || label.type,
      minZoom: updateData.minZoom ?? label.minZoom,
      notes: updateData.notes ?? label.notes,
      updatedAt: new Date().toISOString()
    };
    
    // Handle status change if requested
    let newStatus = updateData.status || foundInStatus;
    
    // If status changed, move to new collection
    if (newStatus !== foundInStatus) {
      // Remove from old collection
      labels[foundInStatus].splice(labelIndex, 1);
      
      // Add to new collection
      labels[newStatus].push(updatedLabel);
    } else {
      // Update in current collection
      labels[foundInStatus][labelIndex] = updatedLabel;
    }
    
    // Save to file
    if (writeJsonFile(CONFIG.LABELS_FILE, labels)) {
      // Return the updated label with status
      res.json({ ...updatedLabel, status: newStatus });
    } else {
      res.status(500).json({ error: 'Failed to update label' });
    }
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

// Delete a label
app.delete('/data/maps/ixmaps/api/labels/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Read current labels
    const labels = readJsonFile(CONFIG.LABELS_FILE, { approved: [], pending: [], rejected: [] });
    
    // Find the label in all collections
    let found = false;
    
    // Check each collection
    for (const status of ['approved', 'pending', 'rejected']) {
      const labelIndex = labels[status].findIndex(label => label.id === id);
      if (labelIndex !== -1) {
        // Remove from collection
        labels[status].splice(labelIndex, 1);
        found = true;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    // Save to file
    if (writeJsonFile(CONFIG.LABELS_FILE, labels)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete label' });
    }
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// Bulk operations

// Import labels (admin only)
app.post('/data/maps/ixmaps/api/labels/import', (req, res) => {
  try {
    const { labels: importedLabels, clearExisting } = req.body;
    
    if (!Array.isArray(importedLabels)) {
      return res.status(400).json({ error: 'Invalid format. Expected an array of labels.' });
    }
    
    // Read current labels
    let labels = readJsonFile(CONFIG.LABELS_FILE, { approved: [], pending: [], rejected: [] });
    
    // Clear existing if requested
    if (clearExisting) {
      labels = { approved: [], pending: [], rejected: [] };
    }
    
    // Process and categorize imported labels
    importedLabels.forEach(label => {
      const status = label.status || 'pending';
      
      // Remove status property as it's implied by the collection
      const labelCopy = { ...label };
      delete labelCopy.status;
      
      // Ensure label has required fields
      const processedLabel = {
        id: labelCopy.id || `label-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: labelCopy.name || 'Untitled',
        type: labelCopy.type || 'unknown',
        x: labelCopy.x || 0,
        y: labelCopy.y || 0,
        minZoom: labelCopy.minZoom || 0,
        createdBy: labelCopy.createdBy || 'unknown',
        createdAt: labelCopy.createdAt || new Date().toISOString(),
        updatedAt: labelCopy.updatedAt || new Date().toISOString(),
        history: labelCopy.history || [],
        notes: labelCopy.notes || ''
      };
      
      // Add to appropriate collection
      if (status === 'approved' || status === 'rejected') {
        labels[status].push(processedLabel);
      } else {
        labels.pending.push(processedLabel);
      }
    });
    
    // Save to file
    if (writeJsonFile(CONFIG.LABELS_FILE, labels)) {
      res.json({ success: true, count: importedLabels.length });
    } else {
      res.status(500).json({ error: 'Failed to import labels' });
    }
  } catch (error) {
    console.error('Error importing labels:', error);
    res.status(500).json({ error: 'Failed to import labels' });
  }
});

// Clear all labels (admin only)
app.delete('/data/maps/ixmaps/api/labels', (req, res) => {
  try {
    // Reset to empty collections
    const emptyLabels = { approved: [], pending: [], rejected: [] };
    
    // Save to file
    if (writeJsonFile(CONFIG.LABELS_FILE, emptyLabels)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to clear labels' });
    }
  } catch (error) {
    console.error('Error clearing labels:', error);
    res.status(500).json({ error: 'Failed to clear labels' });
  }
});

// --- Layers API ---

// Get all layers
app.get('/data/maps/ixmaps/api/layers', (req, res) => {
  try {
    const layersData = readJsonFile(CONFIG.LAYERS_FILE, { layers: [] });
    res.json(layersData.layers);
  } catch (error) {
    console.error('Error retrieving layers:', error);
    res.status(500).json({ error: 'Failed to retrieve layers' });
  }
});

// Update layers
app.put('/data/maps/ixmaps/api/layers', (req, res) => {
  try {
    const { layers } = req.body;
    
    if (!Array.isArray(layers)) {
      return res.status(400).json({ error: 'Invalid format. Expected an array of layers.' });
    }
    
    // Save to file
    if (writeJsonFile(CONFIG.LAYERS_FILE, { layers })) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to update layers' });
    }
  } catch (error) {
    console.error('Error updating layers:', error);
    res.status(500).json({ error: 'Failed to update layers' });
  }
});

// --- Legend API ---

// Get legend data
app.get('/data/maps/ixmaps/api/legend', (req, res) => {
  try {
    const legendData = readJsonFile(CONFIG.LEGEND_FILE);
    res.json(legendData);
  } catch (error) {
    console.error('Error retrieving legend:', error);
    res.status(500).json({ error: 'Failed to retrieve legend' });
  }
});

// Update legend
app.put('/data/maps/ixmaps/api/legend', (req, res) => {
  try {
    const legendData = req.body;
    
    // Save to file
    if (writeJsonFile(CONFIG.LEGEND_FILE, legendData)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to update legend' });
    }
  } catch (error) {
    console.error('Error updating legend:', error);
    res.status(500).json({ error: 'Failed to update legend' });
  }
});

// --- Settings API ---

// Get settings
app.get('/data/maps/ixmaps/api/settings', (req, res) => {
  try {
    const settings = readJsonFile(CONFIG.SETTINGS_FILE);
    res.json(settings);
  } catch (error) {
    console.error('Error retrieving settings:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// Update settings
app.put('/data/maps/ixmaps/api/settings', (req, res) => {
  try {
    const settings = req.body;
    
    // Save to file
    if (writeJsonFile(CONFIG.SETTINGS_FILE, settings)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- Auth API ---
// Note: This is a simplified auth system. In production, use proper auth middleware.

// Get current user
app.get('/data/maps/ixmaps/api/auth/user', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userData = readJsonFile(CONFIG.USERS_FILE);
  const session = userData.sessions[sessionId];
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  const user = userData.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  // Don't return sensitive data
  const { passwordHash, ...userInfo } = user;
  res.json(userInfo);
});

// Login
app.post('/data/maps/ixmaps/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const userData = readJsonFile(CONFIG.USERS_FILE);
  
  // Simplified login (no real password checking)
  const user = userData.users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // In a real app, verify the password hash here
  
  // Create a new session
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  userData.sessions[sessionId] = {
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  
  // Save session
  if (writeJsonFile(CONFIG.USERS_FILE, userData)) {
    // Don't return sensitive data
    const { passwordHash, ...userInfo } = user;
    res.json({
      user: userInfo,
      sessionId,
      expiresAt: userData.sessions[sessionId].expiresAt
    });
  } else {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Logout
app.post('/data/maps/ixmaps/api/auth/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }
  
  const userData = readJsonFile(CONFIG.USERS_FILE);
  
  // Remove session
  delete userData.sessions[sessionId];
  
  if (writeJsonFile(CONFIG.USERS_FILE, userData)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get map info
app.get('/data/maps/ixmaps/api/map-info', (req, res) => {
  const settings = readJsonFile(CONFIG.SETTINGS_FILE);
  
  res.json({
    exists: true,
    path: settings.mapSettings.svgPath || '/data/maps/ixmaps/public/map.svg',
    width: settings.mapSettings.svgWidth || 1920,
    height: settings.mapSettings.svgHeight || 1080,
    enableWrapping: settings.mapSettings.enableWrapping
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`IxMaps server running on port ${PORT}`);
  console.log(`JSON files stored in: ${path.dirname(CONFIG.LABELS_FILE)}`);
});