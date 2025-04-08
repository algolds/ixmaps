#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'serve':
    const serverPath = path.join(__dirname, 'server.ts');
    const server = spawn('npx', ['ts-node', serverPath, ...args.slice(1)], {
      stdio: 'inherit',
      shell: true
    });
    break;
  
  default:
    console.log('Available commands:');
    console.log('  serve     Start the development server');
    process.exit(1);
} 