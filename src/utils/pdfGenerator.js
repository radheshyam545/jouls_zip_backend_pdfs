import PDFDocument from 'pdfkit';
import moment from "moment";
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Added to resolve __dirname in ESM

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const generatePDFForTransaction = (transaction) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    // PDF content start
    doc.fontSize(18).text('Transaction Details', { underline: true, align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Transaction ID: ${transaction.transactionId || transaction._id}`);
    doc.text(`Name: ${transaction.name || 'N/A'}`);
    doc.text(`Date: ${transaction.date || 'N/A'}`);
    doc.text(`Time: ${transaction.time || 'N/A'}`);
    doc.text(`Paid Via: ${transaction.paidvia || 'N/A'}`);
    doc.text(`Previous Wallet Balance: ${transaction.previouswalletbalance || 'N/A'}`);
    doc.text(`Recharge Amount: ${transaction.rechargeamount || 'N/A'}`);
    doc.text(`Closing Wallet Balance: ${transaction.closingwalletbalance || 'N/A'}`);
    doc.text(`Status: ${transaction.status || 'N/A'}`);

    // You can add more fields similarly...

    doc.end();
  });
};



export const generatePDFForDateGroup = (date, transactions) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve({ buffer: pdfBuffer, name: `transactions_${date.replace(/\//g, '_')}.pdf` });
    });

    transactions.forEach((transaction, index) => {
      if (index !== 0) doc.addPage();

      doc.fontSize(18).text(`Transaction - ${transaction.transactionId || transaction._id}`, { underline: true });
      doc.moveDown();

      doc.fontSize(12).text(`Name: ${transaction.name || 'N/A'}`);
      doc.text(`Date: ${transaction.date || 'N/A'}`);
      doc.text(`Time: ${transaction.time || 'N/A'}`);
      doc.text(`Paid Via: ${transaction.paidvia || 'N/A'}`);
      doc.text(`Previous Wallet Balance: ${transaction.previouswalletbalance || 'N/A'}`);
      doc.text(`Recharge Amount: ${transaction.rechargeamount || 'N/A'}`);
      doc.text(`Closing Wallet Balance: ${transaction.closingwalletbalance || 'N/A'}`);
      doc.text(`Status: ${transaction.status || 'N/A'}`);
    });

    doc.end();
  });
};




export const generateBillPDF = (transactions) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const finalBuffer = Buffer.concat(buffers);
      resolve(finalBuffer); // just buffer since you're using it with folder + name outside
    });

    transactions.forEach((tx, index) => {
      doc.addPage({ margin: 50 });

      doc
        .fontSize(16).font("Helvetica-Bold").text("JOULS ECOTECH PRIVATE LIMITED", { align: "center" })
        .moveDown(0.2).fontSize(10).font("Helvetica").text("Reg. Office: Floor no. 177, Second Floor, Block-C, South City II,", { align: "center" })
        .text("Sector-49, Gurugram, Haryana, IN (122018)", { align: "center" })
        .text("CIN: U10300HR2021PTC098008 | MSME Udyam Reg. No.: UDYAM-HR-05-0050574", { align: "center" })
        .text("Email: amanagwal377@gmail.com | Mob: +91-6377650430", { align: "center" })
        .text("Website: www.jouls.co.in", { align: "center" })
        .moveDown().font("Helvetica-Bold").text("BILL", { align: "center" });

      doc.moveDown();

      const billNo = `Bill No. - ${index + 1}`;
      const billDate = `Date: ${moment().format("DD-MM-YYYY")}`;

      doc.font("Helvetica").text(billNo, 50, doc.y);
      doc.text(billDate, 400, doc.y - 15);

      doc.moveDown();
      doc.text(`Issued To: ${tx.name}`);
      doc.text(`Address:`);
      doc.text(`PAN -`);
      doc.text(`GST (If Any) -`);

      doc.moveDown();
      doc.text("-----------------------------------------------------------");
      doc.text("S.No.       Particulars                         Amount");
      doc.text("-----------------------------------------------------------");
      doc.text(`1           EV Charging Session      ${tx.rechargeamount}`);
      doc.text(`             (Txn No. ${tx.transactionId})`);

      doc.moveDown();
      const amount = parseFloat(tx.rechargeamount || 0);
      const sgst = +(amount * 0.09).toFixed(2);
      const igst = +(amount * 0.09).toFixed(2);
      const total = +(amount + sgst + igst).toFixed(2);

      doc.text(`\nTotal                                Rs. ${amount}`);
      doc.text(`SGST(9%)                            ${sgst}`);
      doc.text(`IGST(9%)                            ${igst}`);
      doc.text(`--------------------------------------------`);
      doc.font("Helvetica-Bold").text(`Total                                 ${total}`);

      doc.moveDown();
      doc.text(`\n${convertToWords(total)} only`, { underline: true });
      doc.moveDown();
      doc.text("For Jouls Ecotech Pvt. Ltd.");
      doc.text("\nAuthorised Signatory");
    });

    doc.end();
  });
};



function convertToWords(num) {
  // Handle edge cases
  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + convertToWords(Math.abs(num));

  // Arrays for word conversion
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const units = ['', 'Thousand', 'Lakh', 'Crore'];

  // Split integer and decimal parts
  const [integerPart, decimalPart] = num.toFixed(2).split('.').map(Number);

  // Convert integer part to words
  const convertInteger = (n) => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) {
      return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertInteger(n % 100) : '');
    }

    // Indian numbering system (thousands, lakhs, crores)
    let result = '';
    let unitIndex = 0;
    while (n > 0) {
      let chunk;
      if (unitIndex === 0) {
        chunk = n % 1000;
        n = Math.floor(n / 1000);
      } else if (unitIndex === 1) {
        chunk = n % 100;
        n = Math.floor(n / 100);
      } else {
        chunk = n % 100;
        n = Math.floor(n / 100);
      }
      if (chunk) {
        result = convertInteger(chunk) + (units[unitIndex] ? ' ' + units[unitIndex] : '') + (result ? ' ' + result : '');
      }
      unitIndex++;
    }
    return result;
  };

  // Convert integer part
  let words = convertInteger(integerPart);

  // Convert decimal part (paisa)
  if (decimalPart > 0) {
    const paisaWords = convertInteger(decimalPart);
    words += (words ? ' and ' : '') + paisaWords + ' Paisa';
  }

  return words.trim();
}


// Function to generate HTML content by reading billTemplate.html and replacing placeholders
export const generateBillHTML = (tx, index) => {
  // Calculate bill details
  const billNo = `Bill No. - ${index + 1}`;
  const billDate = moment().format('DD-MM-YYYY');
  const amount = parseFloat(tx.rechargeamount || 0);
  const sgst = +(amount * 0.09).toFixed(2);
  const igst = +(amount * 0.09).toFixed(2);
  const total = +(amount + sgst + igst).toFixed(2);
  const amountInWords = convertToWords(total);
  // Read the HTML template from templates/billTemplate.html
  let htmlContent = fs.readFileSync(path.join(__dirname, "..", 'templates', 'billTemplate.html'), 'utf8');
  // Read the CSS file from src/templates/billStyles.css
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'templates', 'billStyles.css'), 'utf8');

  // Replace the <link> tag with inline <style> tag
  htmlContent = htmlContent.replace(
    '<link rel="stylesheet" href="billStyles.css" />',
    `<style>${cssContent}</style>`
  );
  // Convert images to base64 and replace in HTML
  const images = {
    'call.jpg': {
      data: fs.readFileSync(path.join(__dirname, '..', 'templates', 'assets', 'call.jpg')).toString('base64'),
      mime: 'image/jpeg',
    },
    'web.jpg': {
      data: fs.readFileSync(path.join(__dirname, '..', 'templates', 'assets', 'web.jpg')).toString('base64'),
      mime: 'image/jpeg',
    },
    'mail.png': {
      data: fs.readFileSync(path.join(__dirname, '..', 'templates', 'assets', 'mail.png')).toString('base64'),
      mime: 'image/png',
    },
  };

  htmlContent = htmlContent
    .replace('./assets/call.jpg', `data:${images['call.jpg'].mime};base64,${images['call.jpg'].data}`)
    .replace('./assets/web.jpg', `data:${images['web.jpg'].mime};base64,${images['web.jpg'].data}`)
    .replace('./assets/mail.png', `data:${images['mail.png'].mime};base64,${images['mail.png'].data}`);

  // Replace placeholders with actual values
  // Replace placeholders with actual values, using regex with /g for all occurrences
  htmlContent = htmlContent
    .replace(/{{billNo}}/g, billNo)
    .replace(/{{date}}/g, billDate)
    .replace(/{{name}}/g, tx.name || 'N/A')
    .replace(/{{address}}/g, tx.address || 'N/A')
    .replace(/{{pan}}/g, tx.pan || 'N/A')
    .replace(/{{gst}}/g, tx.gst || 'N/A')
    .replace(/{{particulars}}/g, 'EV Charging')
    .replace(/{{txnNo}}/g, tx.transactionId || 'N/A')
    .replace(/{{baseAmount}}/g, amount.toFixed(2)) // Replace all instances, ensure 2 decimals
    .replace(/{{sgst}}/g, sgst)
    .replace(/{{igst}}/g, igst)
    .replace(/{{totalAmount}}/g, total.toFixed(2)) // Ensure 2 decimals
    .replace(/{{amountInWords}}/g, amountInWords);

  return htmlContent;
};



// Function to generate PDF buffer for multiple transactions using Puppeteer
export const generateBillPDFWithTemplate1 = async (transactions) => {
  console.log("Generating PDF for multiple transactions...", transactions);
  const browser = await puppeteer.launch({ headless: true });
  // const page = await browser.newPage();

  const pdfBuffers = [];

  for (let i = 0; i < transactions.length; i++) {
    const page = await browser.newPage(); // 🔥 NEW PAGE PER TRANSACTION
    const htmlContent = generateBillHTML(transactions[i], i);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF for each page
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
    });
    pdfBuffers.push(pdfBuffer);
    await page.close(); // 🧹 Good practice to close page
  }

  await browser.close();

  // Combine all PDF buffers into one
  return Buffer.concat(pdfBuffers);
};



export const generateBillPDFWithTemplate = async (transactions) => {
  // console.log("Generating multi-page PDF for transactions...", transactions);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 🧠 Merge all transactions into one HTML string with page breaks
  const combinedHtml = transactions.map((tx, i) => {
    return `
      <div style="page-break-after: always;">
        ${generateBillHTML(tx, i)}
      </div>
    `;
  }).join('');

  // ⏳ Set full HTML content at once
  await page.setContent(combinedHtml, { waitUntil: 'networkidle0' });

  // 🖨️ Generate PDF buffer
  const rawBuffer  = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
  });

  await browser.close();
   // ✅ Explicitly return as Buffer (even though it's already one)
  return Buffer.from(rawBuffer);
};
