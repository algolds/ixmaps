import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory (ES modules approach)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3008;

// Main project directory and public folder for static assets
const publicDir: string = path.join(__dirname, 'public');

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the public directory
app.use(express.static(publicDir));

// Redirect root to index.html
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   IxMaps Server v4.0 Running                  ║
  ║                                               ║
  ║   URL: http://localhost:${PORT}                  ║
  ║   Serving files from: ${publicDir}   ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});