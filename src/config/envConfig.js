import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES Module style
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate required env variables
const requiredVars = ['PORT', 'MONGODB_URI'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
});

export const envConfig = {
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI,
  // Add other env vars here as needed
};
