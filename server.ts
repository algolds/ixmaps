import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3008;

// Main project directory
const rootDir: string = path.join(__dirname, '..');
const publicDir: string = path.join(rootDir, 'public');

// Serve static files from the public directory at both paths
app.use('/data/maps/ixmaps/public', express.static(publicDir));
app.use('/', express.static(publicDir)); // Added new route for direct public access

// Redirect root to index.html
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`IxMaps server running on port ${PORT}`);
  console.log(`Serving files from: ${publicDir}`);
}); 