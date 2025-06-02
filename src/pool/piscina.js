// pool/piscina.js
import { Piscina } from 'piscina';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const piscina = new Piscina({
  filename: join(__dirname, '../workers/pdfWorker.js'),
  maxThreads: 8, // adjust as needed
});
