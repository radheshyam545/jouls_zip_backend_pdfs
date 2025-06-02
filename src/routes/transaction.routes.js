import express from 'express';
import { downloadDateGroupedTransactionsZip, downloadDateGroupedTransactionsZipWithFolders, downloadDateGroupedTransactionsZipWithFoldersBill, downloadTransactionsZipMultiplePDFs, getAllTransactions } from '../controllers/transaction.controller.js';

const router = express.Router();

// GET /api/transactions
router.get('/', getAllTransactions);

router.get('/download-zip-multiple-pdfs', downloadTransactionsZipMultiplePDFs);  // new route

router.get('/download-date-wise-zip', downloadDateGroupedTransactionsZip);


router.get('/download-date-wise-zip-with-folders', downloadDateGroupedTransactionsZipWithFolders);

router.get('/download-date-wise-zip-with-folders-bill-formate', downloadDateGroupedTransactionsZipWithFoldersBill);


export default router;
