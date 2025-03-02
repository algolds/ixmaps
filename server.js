// server.js - Enhanced with IxMaps interactive editor features
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Map path configuration
const MAP_CONFIG = {
  basePath: path.resolve(__dirname, 'data/maps/ixmaps/public'),
  filename: 'map.svg',
  getFullPath: function() {
    return path.join(this.basePath, this.filename);
  }
};

// File paths for data storage
const DATA_PATHS = {
  labels: path.join(__dirname, 'data', 'labels.json'),
  settings: path.join(__dirname, 'data', 'settings.json'),
  layers: path.join(__dirname, 'data', 'layers.json'),
  legend: path.join(__dirname, 'data', 'legend.json'),
  users: path.join(__dirname, 'data', 'users.json') // Add user data for mock authentication
};

// Default settings
const DEFAULT_SETTINGS = {
  defaultZoom: 0,
  svgWidth: 1920,
  svgHeight: 1080,
  bgColor: '#D5FFFF'
};

// Default layer configuration
const DEFAULT_LAYERS = [
  { 
    id: 'continents', 
    label: 'Continents', 
    labelTypes: ['continent'], 
    defaultVisible: true 
  },
  { 
    id: 'countries', 
    label: 'Countries', 
    labelTypes: ['country'], 
    defaultVisible: true 
  },
  { 
    id: 'capitals', 
    label: 'Capitals', 
    labelTypes: ['capital'], 
    defaultVisible: true 
  },
  { 
    id: 'waters', 
    label: 'Water Bodies', 
    labelTypes: ['water'], 
    defaultVisible: true 
  }
];

// Default legend configuration
const DEFAULT_LEGEND = {
  schemes: {
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
  defaultScheme: "topographic"
};

// Default user data for mock authentication
const DEFAULT_USERS = [
  {
    id: "admin-1",
    username: "admin",
    isAdmin: true
  },
  {
    id: "user-1",
    username: "user",
    isAdmin: false
  }
];

// Create all necessary directories
function ensureDirectoriesExist() {
  const directories = [
    path.join(__dirname, 'data'),
    path.join(__dirname, 'public'),
    path.join(__dirname, 'public', 'js'),
    path.join(__dirname, 'public', 'css'),
    MAP_CONFIG.basePath
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      } catch (error) {
        console.error(`Failed to create directory ${dir}: ${error.message}`);
      }
    }
  });
}

// Initialize empty files if they don't exist
function createInitialFiles() {
  const initialFiles = [
    {
      path: DATA_PATHS.labels,
      content: []
    },
    {
      path: DATA_PATHS.settings,
      content: DEFAULT_SETTINGS
    },
    {
      path: DATA_PATHS.layers,
      content: DEFAULT_LAYERS
    },
    {
      path: DATA_PATHS.legend,
      content: DEFAULT_LEGEND
    },
    {
      path: DATA_PATHS.users,
      content: DEFAULT_USERS
    }
  ];
  
  initialFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
      try {
        fs.writeFileSync(file.path, JSON.stringify(file.content, null, 2), 'utf8');
        console.log(`Created initial file: ${file.path}`);
      } catch (error) {
        console.error(`Failed to create file ${file.path}: ${error.message}`);
      }
    }
  });
}

// Helper functions for file operations
const fileHelpers = {
  readJsonFile: function(filePath, defaultContent = []) {
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
        console.log(`Created new file: ${filePath}`);
        return defaultContent;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading/creating file ${filePath}:`, error);
      return defaultContent;
    }
  },
  
  writeJsonFile: function(filePath, content) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing to file ${filePath}:`, error);
      return false;
    }
  }
};

// Startup verification
function performStartupChecks() {
  console.log('\n=== STARTUP CHECKS ===');
  
  // Check data directory
  console.log(`Data directory: ${fs.existsSync(path.join(__dirname, 'data')) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check map directory
  console.log(`Map directory: ${fs.existsSync(MAP_CONFIG.basePath) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check map file
  console.log(`Map file: ${fs.existsSync(MAP_CONFIG.getFullPath()) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check critical data files
  console.log(`Labels file: ${fs.existsSync(DATA_PATHS.labels) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Settings file: ${fs.existsSync(DATA_PATHS.settings) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Layers file: ${fs.existsSync(DATA_PATHS.layers) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Legend file: ${fs.existsSync(DATA_PATHS.legend) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Users file: ${fs.existsSync(DATA_PATHS.users) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check public directory
  console.log(`Public directory: ${fs.existsSync(path.join(__dirname, 'public')) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check HTML files
  console.log(`Admin HTML: ${fs.existsSync(path.join(__dirname, 'public', 'admin.html')) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Index HTML: ${fs.existsSync(path.join(__dirname, 'public', 'index.html')) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check JavaScript files
  console.log(`Map Editor JS: ${fs.existsSync(path.join(__dirname, 'public', 'js', 'map-editor.js')) ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Admin Panel JS: ${fs.existsSync(path.join(__dirname, 'public', 'js', 'admin-panel.js')) ? '✅ EXISTS' : '❌ MISSING'}`);
  
  console.log('======================\n');
}

// Initialize directories and files
ensureDirectoriesExist();
createInitialFiles();

// Configure Express
app.use(express.json({ limit: '50mb' })); // Increased limit for larger label sets

// Serve static files from the 'public' directory with proper MIME types
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Simple session management for mock authentication
const sessions = {};

// Basic authentication middleware
const authMiddleware = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId && sessions[sessionId]) {
    req.user = sessions[sessionId];
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Admin authentication middleware
const adminMiddleware = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId && sessions[sessionId] && sessions[sessionId].isAdmin) {
    req.user = sessions[sessionId];
    next();
  } else {
    res.status(403).json({ error: 'Admin privileges required' });
  }
};

// Special route for the map SVG
app.get('/map.svg', (req, res) => {
  try {
    const mapPath = MAP_CONFIG.getFullPath();
    console.log(`Request for map.svg - Checking path: ${mapPath}`);
    
    if (fs.existsSync(mapPath)) {
      console.log('Map file found, serving...');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.sendFile(mapPath);
    } else {
      console.error(`Map file not found at: ${mapPath}`);
      res.status(404).send('Map file not found');
    }
  } catch (error) {
    console.error(`Error serving map: ${error.message}`);
    res.status(500).send('Error serving map file');
  }
});

// API endpoints for map info
app.get('/api/map-info', (req, res) => {
  try {
    console.log('Received request for /api/map-info');
    let fileInfo = {};
    
    if (fs.existsSync(MAP_CONFIG.getFullPath())) {
      const stats = fs.statSync(MAP_CONFIG.getFullPath());
      fileInfo = {
        exists: true,
        path: MAP_CONFIG.getFullPath(),
        size: stats.size,
        lastModified: stats.mtime
      };
      console.log('Map info:', fileInfo);
    } else {
      fileInfo = {
        exists: false,
        path: MAP_CONFIG.getFullPath()
      };
      console.log('Map not found:', fileInfo);
    }
    
    res.json(fileInfo);
  } catch (error) {
    console.error(`Error in /api/map-info: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // In a real app, validate username/password against database
    // For this demo, we'll just look up the username and auto-authenticate
    const users = fileHelpers.readJsonFile(DATA_PATHS.users, DEFAULT_USERS);
    const user = users.find(u => u.username === username);
    
    if (user) {
      // Create a session
      const sessionId = Math.random().toString(36).substring(2, 15);
      sessions[sessionId] = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      };
      
      res.json({
        success: true,
        sessionId: sessionId,
        user: {
          username: user.username,
          isAdmin: user.isAdmin
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/status', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId && sessions[sessionId]) {
    res.json({
      authenticated: true,
      username: sessions[sessionId].username,
      userId: sessions[sessionId].id,
      isAdmin: sessions[sessionId].isAdmin
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
  }
  
  res.json({ success: true });
});

// Enhanced API endpoints for labels with approval workflow
app.get('/api/labels', (req, res) => {
  try {
    console.log('Received request for /api/labels');
    const labels = fileHelpers.readJsonFile(DATA_PATHS.labels, []);
    
    // Determine which labels to return based on authentication
    const sessionId = req.headers['x-session-id'];
    const user = sessionId ? sessions[sessionId] : null;
    
    let filteredLabels;
    if (user) {
      // Return approved labels and user's own pending labels
      filteredLabels = labels.filter(label => 
        label.status === 'approved' || 
        (label.status === 'pending' && label.createdBy === user.id)
      );
    } else {
      // Return only approved labels for unauthenticated users
      filteredLabels = labels.filter(label => label.status === 'approved');
    }
    
    res.json(filteredLabels);
  } catch (error) {
    console.error('Error reading labels file:', error);
    res.status(500).json({ error: 'Failed to load labels' });
  }
});

app.post('/api/labels', authMiddleware, (req, res) => {
  try {
    const labels = fileHelpers.readJsonFile(DATA_PATHS.labels, []);
    
    // Add the new label with enhanced properties
    const newLabel = {
      id: Date.now().toString(), // Simple unique ID
      ...req.body,
      status: 'pending', // All new labels start as pending
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };
    
    // Auto-approve if user is admin
    if (req.user.isAdmin) {
      newLabel.status = 'approved';
    }
    
    labels.push(newLabel);
    
    // Save the updated labels
    if (fileHelpers.writeJsonFile(DATA_PATHS.labels, labels)) {
      res.status(201).json(newLabel);
    } else {
      throw new Error('Failed to write labels file');
    }
  } catch (error) {
    console.error('Error adding label:', error);
    res.status(500).json({ error: 'Failed to add label' });
  }
});

app.put('/api/labels/:id', authMiddleware, (req, res) => {
  try {
    const labels = fileHelpers.readJsonFile(DATA_PATHS.labels, []);
    
    const labelIndex = labels.findIndex(label => label.id === req.params.id);
    
    if (labelIndex === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    // Check permissions
    if (labels[labelIndex].createdBy !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this label' });
    }
    
    // Save current state to history
    if (!labels[labelIndex].history) {
      labels[labelIndex].history = [];
    }
    
    labels[labelIndex].history.push({
      ...labels[labelIndex],
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    });
    
    // Update the label
    const updatedLabel = {
      ...labels[labelIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // If it was already approved and user is not admin, set back to pending
    if (labels[labelIndex].status === 'approved' && !req.user.isAdmin) {
      updatedLabel.status = 'pending';
    }
    
    labels[labelIndex] = updatedLabel;
    
    // Save the updated labels
    if (fileHelpers.writeJsonFile(DATA_PATHS.labels, labels)) {
      res.json(updatedLabel);
    } else {
      throw new Error('Failed to write labels file');
    }
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

app.delete('/api/labels/:id', authMiddleware, (req, res) => {
  try {
    const labels = fileHelpers.readJsonFile(DATA_PATHS.labels, []);
    
    const labelIndex = labels.findIndex(label => label.id === req.params.id);
    
    if (labelIndex === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    // Check permissions
    if (labels[labelIndex].createdBy !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this label' });
    }
    
    // Remove the label
    labels.splice(labelIndex, 1);
    
    // Save the updated labels
    if (fileHelpers.writeJsonFile(DATA_PATHS.labels, labels)) {
      res.json({ message: 'Label deleted successfully' });
    } else {
      throw new Error('Failed to write labels file');
    }
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// Bulk import labels endpoint
app.post('/api/labels/import', adminMiddleware, (req, res) => {
  try {
    const importedLabels = req.body;
    
    if (!Array.isArray(importedLabels)) {
      return res.status(400).json({ error: 'Invalid format. Expected an array of labels.' });
    }
    
    // Process and validate imported labels
    const processedLabels = importedLabels.map(label => {
      // Ensure each label has required fields
      const processedLabel = {
        ...label,
        id: label.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        status: label.status || 'approved', // Default to approved for bulk imports
        createdBy: label.createdBy || req.user.id,
        createdAt: label.createdAt || new Date().toISOString(),
        updatedAt: label.updatedAt || new Date().toISOString(),
        history: label.history || []
      };
      
      return processedLabel;
    });
    
    // Save the imported labels
    if (fileHelpers.writeJsonFile(DATA_PATHS.labels, processedLabels)) {
      res.json({ message: `Successfully imported ${processedLabels.length} labels` });
    } else {
      throw new Error('Failed to write labels file');
    }
  } catch (error) {
    console.error('Error importing labels:', error);
    res.status(500).json({ error: 'Failed to import labels' });
  }
});

// Admin endpoints for label moderation
app.get('/api/admin/pending', adminMiddleware, (req, res) => {
  try {
    const labels = fileHelpers.readJsonFile(DATA_PATHS.labels, []);
    const pendingLabels = labels.filter(label => label.status === 'pending');
    res.json({ labels: pendingLabels });
  } catch (error) {
    console.error('Error reading pending labels:', error);
    res.status(500).json({ error: 'Failed to load pending labels' });
  }
});

app.post('/api/admin/approve/:id', adminMiddleware, (req, res) => {
  try {
    const labels = fileHelpers.readJsonFile(DATA_PATHS.labels, []);
    const labelIndex = labels.findIndex(label => label.id === req.params.id);
    
    if (labelIndex === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    // Add to history
    if (!labels[labelIndex].history) {
      labels[labelIndex].history = [];
    }
    
    labels[labelIndex].history.push({
      ...labels[labelIndex],
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    });
    
    // Update status
    labels[labelIndex].status = 'approved';
    labels[labelIndex].updatedAt = new Date().toISOString();
    
    if (req.body.notes) {
      labels[labelIndex].notes = req.body.notes;
    }
    
    // Save the updated labels
    if (fileHelpers.writeJsonFile(DATA_PATHS.labels, labels)) {
      res.json({ message: 'Label approved', label: labels[labelIndex] });
    } else {
      throw new Error('Failed to write labels file');
    }
  } catch (error) {
    console.error('Error approving label:', error);
    res.status(500).json({ error: 'Failed to approve label' });
  }
});

app.post('/api/admin/reject/:id', adminMiddleware, (req, res) => {
  try {
    const labels = fileHelpers.readJsonFile(DATA_PATHS.labels, []);
    const labelIndex = labels.findIndex(label => label.id === req.params.id);
    
    if (labelIndex === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    // Add to history
    if (!labels[labelIndex].history) {
      labels[labelIndex].history = [];
    }
    
    labels[labelIndex].history.push({
      ...labels[labelIndex],
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    });
    
    // Update status
    labels[labelIndex].status = 'rejected';
    labels[labelIndex].updatedAt = new Date().toISOString();
    
    if (req.body.notes) {
      labels[labelIndex].notes = req.body.notes;
    }
    
    // Save the updated labels
    if (fileHelpers.writeJsonFile(DATA_PATHS.labels, labels)) {
      res.json({ message: 'Label rejected', label: labels[labelIndex] });
    } else {
      throw new Error('Failed to write labels file');
    }
  } catch (error) {
    console.error('Error rejecting label:', error);
    res.status(500).json({ error: 'Failed to reject label' });
  }
});

// API endpoints for settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = fileHelpers.readJsonFile(DATA_PATHS.settings, DEFAULT_SETTINGS);
    res.json(settings);
  } catch (error) {
    console.error('Error reading settings file:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.post('/api/settings', adminMiddleware, (req, res) => {
  try {
    const currentSettings = fileHelpers.readJsonFile(DATA_PATHS.settings, DEFAULT_SETTINGS);
    
    // Update settings
    const newSettings = {
      ...currentSettings,
      ...req.body
    };
    
    // Validate settings
    if (typeof newSettings.defaultZoom !== 'number') {
      return res.status(400).json({ error: 'defaultZoom must be a number' });
    }
    
    if (typeof newSettings.svgWidth !== 'number' || newSettings.svgWidth <= 0) {
      return res.status(400).json({ error: 'svgWidth must be a positive number' });
    }
    
    if (typeof newSettings.svgHeight !== 'number' || newSettings.svgHeight <= 0) {
      return res.status(400).json({ error: 'svgHeight must be a positive number' });
    }
    
    // Save the updated settings
    if (fileHelpers.writeJsonFile(DATA_PATHS.settings, newSettings)) {
      res.json(newSettings);
    } else {
      throw new Error('Failed to write settings file');
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// API endpoints for layer configuration
app.get('/api/layers', (req, res) => {
  try {
    const layers = fileHelpers.readJsonFile(DATA_PATHS.layers, DEFAULT_LAYERS);
    res.json(layers);
  } catch (error) {
    console.error('Error reading layer configuration file:', error);
    res.status(500).json({ error: 'Failed to load layer configuration' });
  }
});

app.post('/api/layers', adminMiddleware, (req, res) => {
  try {
    const layers = req.body;
    
    if (!Array.isArray(layers)) {
      return res.status(400).json({ error: 'Invalid format. Expected an array of layer configurations.' });
    }
    
    // Validate layer structure
    for (const layer of layers) {
      if (!layer.id || !layer.label || !Array.isArray(layer.labelTypes)) {
        return res.status(400).json({ 
          error: 'Invalid layer configuration. Each layer must have id, label, and labelTypes array.' 
        });
      }
    }
    
    // Save the layer configuration
    if (fileHelpers.writeJsonFile(DATA_PATHS.layers, layers)) {
      res.json({ message: `Successfully saved ${layers.length} layer configurations` });
    } else {
      throw new Error('Failed to write layer configuration file');
    }
  } catch (error) {
    console.error('Error updating layer configuration:', error);
    res.status(500).json({ error: 'Failed to update layer configuration' });
  }
});

// API endpoints for legend configuration
app.get('/api/legend', (req, res) => {
  try {
    const legend = fileHelpers.readJsonFile(DATA_PATHS.legend, DEFAULT_LEGEND);
    res.json(legend);
  } catch (error) {
    console.error('Error reading legend configuration:', error);
    res.status(500).json({ error: 'Failed to load legend configuration' });
  }
});

app.post('/api/legend', adminMiddleware, (req, res) => {
  try {
    const currentLegend = fileHelpers.readJsonFile(DATA_PATHS.legend, DEFAULT_LEGEND);
    
    // Update legend configuration
    const newLegend = {
      ...currentLegend,
      ...req.body
    };
    
    // Validate legend structure
    if (!newLegend.schemes || typeof newLegend.schemes !== 'object') {
      return res.status(400).json({ error: 'Invalid legend configuration. Must include schemes object.' });
    }
    
    // Save the updated legend
    if (fileHelpers.writeJsonFile(DATA_PATHS.legend, newLegend)) {
      res.json(newLegend);
    } else {
      throw new Error('Failed to write legend configuration file');
    }
  } catch (error) {
    console.error('Error updating legend configuration:', error);
    res.status(500).json({ error: 'Failed to update legend configuration' });
  }
});

app.get('/api/legend/:scheme', (req, res) => {
  try {
    const legend = fileHelpers.readJsonFile(DATA_PATHS.legend, DEFAULT_LEGEND);
    const scheme = req.params.scheme;
    
    if (!legend.schemes[scheme]) {
      return res.status(404).json({ error: `Legend scheme "${scheme}" not found` });
    }
    
    res.json(legend.schemes[scheme]);
  } catch (error) {
    console.error('Error reading legend scheme:', error);
    res.status(500).json({ error: 'Failed to load legend scheme' });
  }
});

app.put('/api/legend/:scheme', adminMiddleware, (req, res) => {
  try {
    const legend = fileHelpers.readJsonFile(DATA_PATHS.legend, DEFAULT_LEGEND);
    const scheme = req.params.scheme;
    
    // Update or create the scheme
    legend.schemes[scheme] = req.body;
    
    // Save the updated legend
    if (fileHelpers.writeJsonFile(DATA_PATHS.legend, legend)) {
      res.json(legend.schemes[scheme]);
    } else {
      throw new Error('Failed to write legend configuration file');
    }
  } catch (error) {
    console.error('Error updating legend scheme:', error);
    res.status(500).json({ error: 'Failed to update legend scheme' });
  }
});

// Route to access the editor
app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// Serve the admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Add a test route to check if the server is running
app.get('/test', (req, res) => {
  res.send('IxMaps server is running properly.');
});

// Start the server
app.listen(port, () => {
  console.log(`IxMaps server running on port ${port}`);
  console.log(`Access the map at: http://localhost:${port}/`);
  console.log(`Access the map editor at: http://localhost:${port}/editor`);
  console.log(`Access the admin panel at: http://localhost:${port}/admin`);
  
  // Run startup checks
  performStartupChecks();
});