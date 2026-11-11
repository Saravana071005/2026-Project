import fs from 'fs';
import { PDFParse } from 'pdf-parse';

/**
 * Extract text and structural table data from a digital PDF file using pdf-parse.
 * @param {string|Buffer} input - Path to the PDF file or Buffer
 * @returns {Promise<{ rawText: string, pageCount: number, tables: any[] }>}
 */
export async function parsePdf(input) {
  let dataBuffer;
  if (typeof input === 'string') {
    dataBuffer = fs.readFileSync(input);
  } else if (Buffer.isBuffer(input)) {
    dataBuffer = input;
  } else {
    throw new Error('Invalid input to parsePdf: Expected file path or Buffer.');
  }

  const parser = new PDFParse({ data: dataBuffer });
  try {
    await parser.load();
    const info = await parser.getInfo().catch(() => null);
    const textResult = await parser.getText();
    const rawText = textResult?.text || '';

    // Attempt table extraction if available
    let tables = [];
    try {
      if (typeof parser.getPageTables === 'function') {
        tables = await parser.getPageTables();
      }
    } catch {
      // Table parsing is best-effort
      tables = [];
    }

    return {
      rawText: rawText.trim(),
      pageCount: info?.total || 1,
      tables,
    };
  } finally {
    try {
      await parser.destroy();
    } catch {
      // Ignore destroy errors
    }
  }
}
