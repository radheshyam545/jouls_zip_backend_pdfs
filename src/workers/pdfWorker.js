import { parentPort, workerData } from 'worker_threads';
import puppeteer from 'puppeteer';
import { generateBillHTML } from '../utils/pdfGenerator.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// const { date, txList } = workerData;

const __dirname = dirname(fileURLToPath(import.meta.url));

// (async () => {

//   const { date, txList } = workerData; // with piscing

//   const browser = await puppeteer.launch({ headless: 'new' });
//   const page = await browser.newPage();

//   const content = txList.map((tx, i) => `
//     <div style="page-break-after: always;">
//       ${generateBillHTML(tx, i)}
//     </div>
//   `).join('');

//   await page.setContent(content, { waitUntil: 'networkidle0' });

//   const buffer = await page.pdf({
//     format: 'A4',
//     printBackground: true,
//     margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' }
//   });

//   await browser.close();

//   parentPort.postMessage({
//     success: true,
//     buffer: buffer instanceof Buffer ? buffer : Buffer.from(buffer),
//     name: `bills_${date.replace(/\//g, '_')}.pdf`,
//     folder: date.replace(/\//g, '_')
//   });
// })();




export default async function ({ date, txList }){

  // const { date, txList } = workerData; // with piscing

  const browser = await puppeteer.launch({ headless: 'new',args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const content = txList.map((tx, i) => `
    <div style="page-break-after: always;">
      ${generateBillHTML(tx, i)}
    </div>
  `).join('');

  // await page.setContent(content, { waitUntil: 'networkidle0' , timeout:0 });
  await page.setContent(content, { waitUntil: 'domcontentloaded' , timeout:0 });

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' }
  });

  await browser.close();

  // parentPort.postMessage({
  //   success: true,
  //   buffer: buffer instanceof Buffer ? buffer : Buffer.from(buffer),
  //   name: `bills_${date.replace(/\//g, '_')}.pdf`,
  //   folder: date.replace(/\//g, '_')
  // });

   return {
     success: true,
    buffer: buffer instanceof Buffer ? buffer : Buffer.from(buffer),
    name: `bills_${date.replace(/\//g, '_')}.pdf`,
    folder: date.replace(/\//g, '_')
    };
}