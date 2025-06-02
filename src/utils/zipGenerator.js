import archiver from 'archiver';
import stream from 'stream';
import { Readable } from 'stream';

export const generateZipWithMultiplePDFs = (pdfBuffersWithNames) => {
  // pdfBuffersWithNames = [{ buffer: Buffer, name: 'filename.pdf' }, ...]

  const archiveStream = new stream.PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(archiveStream);

  pdfBuffersWithNames.forEach(({ buffer, name }) => {
    archive.append(buffer, { name });
  });

  // finalize archive
  archive.finalize();

  return archiveStream;
};



/**
 * Creates a zip stream from multiple PDFs and puts them into date-wise folders.
 * @param {Array<{ name: string, buffer: Buffer, folder: string }>} pdfsWithFolders
 * @returns {stream.PassThrough} - ZIP file stream
 */
export const generateZipWithDateFolders1 = (pdfsWithFolders) => {
  const zipStream = new stream.PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(zipStream);

  pdfsWithFolders.forEach(({ name, buffer, folder }) => {
    const filePath = `${folder}/${name}`; // Example: 29_05_25/transactions_29_05_25.pdf
    archive.append(buffer, { name: filePath });
  });

  archive.finalize();
  return zipStream;
};





export const generateZipWithDateFolders = (pdfs) => {
  const archive = archiver('zip', { zlib: { level: 9 } });

  for (const { buffer, name, folder } of pdfs) {
    const safeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    archive.append(Readable.from(safeBuffer), { name: `${folder}/${name}` });
  }

  archive.finalize();
  return archive;
};

