import express from 'express';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3008;

// Main project directory and public folder for static assets
const publicDir = path.join(__dirname, '../../public');

// CORS middleware for development
app.use((req: Request, res: Response, next: NextFunction) => {
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