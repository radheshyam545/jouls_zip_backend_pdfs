import { getDB } from '../config/db.js';
import { piscina } from '../pool/piscina.js';
import { generateBillPDF, generateBillPDFWithTemplate, generatePDFForDateGroup, generatePDFForTransaction } from '../utils/pdfGenerator.js';
import { phonePeAttemptReferenceIds } from '../utils/ref_ids.js';
import { generateZipWithDateFolders, generateZipWithMultiplePDFs } from '../utils/zipGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


export const getAllTransactions = async (req, res) => {
  try {
    const db = getDB();
    const transactions = await db.collection('apptransactiondetails').find({}).toArray();

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};



export const downloadTransactionsZipMultiplePDFs = async (req, res) => {
  try {
    const db = getDB();
    const transactions = await db.collection('apptransactiondetails').find({}).toArray();

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: 'No transactions found' });
    }

    // Generate PDF buffer for each transaction
    const pdfBuffersWithNames = await Promise.all(
      transactions.map(async (tx, idx) => {
        const pdfBuffer = await generatePDFForTransaction(tx);
        // Naming each PDF as transaction_<index>_<transactionId>.pdf
        const name = `transaction_${idx + 1}_${tx.transactionId || tx._id}.pdf`;
        return { buffer: pdfBuffer, name };
      })
    );

    // Generate ZIP stream containing all PDFs
    const zipStream = generateZipWithMultiplePDFs(pdfBuffersWithNames);

    // Set response headers
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=transactions_multiple_pdfs.zip',
    });

    // Pipe ZIP stream to response
    zipStream.pipe(res);

    zipStream.on('end', () => res.end());
  } catch (err) {
    console.error('Error generating multiple PDFs ZIP:', err);
    res.status(500).json({ success: false, message: 'Failed to generate ZIP file' });
  }
};





export const downloadDateGroupedTransactionsZip = async (req, res) => {
  try {
    const db = getDB();
    const transactions = await db.collection('apptransactiondetails').find({}).toArray();

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: 'No transactions found' });
    }

    // ✅ Group transactions by date
    const groupedByDate = {};
    transactions.forEach((tx) => {
      const date = tx.date || 'unknown';
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(tx);
    });

    // ✅ Create one PDF per date group
    const pdfBuffersWithNames = await Promise.all(
      Object.entries(groupedByDate).map(([date, txList]) => {
        return generatePDFForDateGroup(date, txList);
      })
    );

    // ✅ Create ZIP
    const zipStream = generateZipWithMultiplePDFs(pdfBuffersWithNames);

    // ✅ Send to client
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=date_wise_transactions.zip',
    });

    zipStream.pipe(res);
    zipStream.on('end', () => res.end());
  } catch (error) {
    console.error('Error generating date-grouped ZIP:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};




export const downloadDateGroupedTransactionsZipWithFolders = async (req, res) => {
  try {
    const db = getDB();
    const transactions = await db.collection('apptransactiondetails').find({}).toArray();

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: 'No transactions found' });
    }

    // ✅ Group by date
    const groupedByDate = {};
    transactions.forEach((tx) => {
      const date = tx.date || 'unknown';
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(tx);
    });

    // ✅ Generate PDFs
    const pdfsWithFolders = await Promise.all(
      Object.entries(groupedByDate).map(async ([date, txList]) => {
        const { buffer, name } = await generatePDFForDateGroup(date, txList);
        return {
          buffer,
          name,
          folder: date.replace(/\//g, '_'), // e.g., 29_05_25
        };
      })
    );

    // ✅ Create zip with folders
    const zipStream = generateZipWithDateFolders(pdfsWithFolders);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=datewise_transaction_folders.zip',
    });

    zipStream.pipe(res);
    zipStream.on('end', () => res.end());
  } catch (error) {
    console.error('Error generating date-wise folder zip:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};


export const downloadDateGroupedTransactionsZipWithFoldersBill = async (req, res) => {
  try {
    const db = getDB();
    // const transactions = await db.collection('apptransactiondetails').find({}).limit(100).toArray();
    // const transactions = await db.collection('apptransactiondetails').find({}).toArray();

    const limit = 100; // jitne documents chahiyein utni limit yahan set karein

    const transactions = await db
      .collection('apptransactiondetails')
      .find({ transactionId: { $in: phonePeAttemptReferenceIds } })
      // .limit(limit)
      .toArray();

      console.log(transactions.length,"transactions.length",phonePeAttemptReferenceIds.length)
      // return


    if (!transactions.length) {
      return res.status(404).json({ success: false, message: 'No transactions found' });
    }

    // ✅ Group by date
    const groupedByDate = {};
    transactions.forEach((tx) => {
      const date = tx.date || 'unknown';
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(tx);
    });


    // ✅ Replace old logic with generateBillPDF
    // const pdfsWithFolders = await Promise.all(
    //   Object.entries(groupedByDate).map(async ([date, txList]) => {
    //     // const buffer = await generateBillPDF(txList); // <-- this returns a single PDF buffer with multiple pages
    //     const buffer = await generateBillPDFWithTemplate(txList); // <-- this returns a single PDF buffer with multiple pages

    //     // console.log(`Generated PDF for date ${date}:`, buffer.length, 'bytes',buffer);
    //     return {
    //       buffer,
    //       name: `bills_${date.replace(/\//g, '_')}.pdf`, // e.g., bills_29_05_25.pdf
    //       folder: date.replace(/\//g, '_'),              // folder name: 29_05_25
    //     };
    //   })
    // );


    // const pdfsWithFolders = await Promise.all(
    //   Object.entries(groupedByDate).map(async ([date, txList]) => {
    //     try {
    //       const pdfBuffers = await generateBillPDFWithTemplate(txList);
    //       // pdfBuffers.forEach((buffer, index) => {
    //       //   pdfsWithFolders.push({
    //       //     buffer,
    //       //     name: `bill_${date}_${index + 1}.pdf`,
    //       //     folder: date,
    //       //   });
    //       // });

    //       return {
    //         pdfBuffers,
    //         name: `bills_${date.replace(/\//g, '_')}.pdf`, // e.g., bills_29_05_25.pdf
    //         folder: date.replace(/\//g, '_'),              // folder name: 29_05_25
    //       };

    //     } catch (error) {
    //       console.error(`Error processing transactions for date ${date}:`, error);
    //     }
    //   })
    // );


    // const workerTasks = Object.entries(groupedByDate).map(([date, txList]) => {
    //   return new Promise((resolve, reject) => {
    //     const worker = new Worker(path.join(__dirname, '../workers/pdfWorker.js'), {
    //       workerData: { date, txList }
    //     });

    //     worker.on('message', resolve);
    //     worker.on('error', reject);
    //     worker.on('exit', code => {
    //       if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    //     });
    //   });
    // });

    // const pdfsWithFolders = await Promise.all(workerTasks);

    const pdfPromises = Object.entries(groupedByDate).map(([date, txList]) =>
      piscina.run({ date, txList })
    );
    //  const pdfsWithFolders = await Promise.all(pdfPromises);
    const allResults = await Promise.allSettled(pdfPromises);

    const pdfsWithFolders = allResults
      .filter(result => result.status === 'fulfilled' && result.value.success)
      .map(result => result.value);

    if (!pdfsWithFolders.length) {
      console.error('No valid PDFs generated');
      return res.status(500).json({ success: false, message: 'No valid PDFs generated' });
    }


    // ✅ Create zip stream with PDFs inside date folders
    const zipStream = generateZipWithDateFolders(pdfsWithFolders);

    // ✅ Stream zip file to client
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=datewise_transaction_folders.zip',
    });

    zipStream.pipe(res);
    zipStream.on('end', () => res.end());

    // Handle archiver errors
    zipStream.on('error', (error) => {
      console.error('ZIP stream error:', error);
      res.status(500).json({ success: false, message: 'Error creating ZIP file' });
    });

  } catch (error) {
    console.error('Error generating date-wise folder zip:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
