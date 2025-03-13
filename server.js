const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Main project directory
const rootDir = '/wiki/prod/v14/data/maps/ixmaps';
const publicDir = path.join(rootDir, 'public');

// Serve static files from the public directory
app.use('/data/maps/ixmaps/public', express.static(publicDir));

// Redirect root to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`IxMaps server running on port ${PORT}`);
  console.log(`Serving files from: ${publicDir}`);
});