import Tesseract from 'tesseract.js';
import fs from 'fs';

/**
 * Perform optical character recognition on an image file or buffer using Tesseract.js.
 * @param {string|Buffer} input - Path to image file or Buffer
 * @param {object} options - Optional progress callback
 * @returns {Promise<{ rawText: string, confidence: number, lines: string[], words: any[] }>}
 */
export async function recognizeImage(input, options = {}) {
  let imageSource = input;
  if (Buffer.isBuffer(input)) {
    imageSource = input;
  } else if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`Image file not found: ${input}`);
    }
    imageSource = input;
  } else {
    throw new Error('Invalid input to recognizeImage: Expected file path or Buffer.');
  }

  const { data } = await Tesseract.recognize(imageSource, 'eng', {
    logger: (m) => {
      if (options.onProgress && m.status === 'recognizing text') {
        options.onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const rawText = data?.text || '';
  const lines = data?.lines?.map((l) => l.text.trim()).filter(Boolean) || [];
  const words = data?.words?.map((w) => ({
    text: w.text,
    confidence: w.confidence,
    bbox: w.bbox,
  })) || [];

  return {
    rawText: rawText.trim(),
    confidence: data?.confidence || 0,
    lines,
    words,
  };
}
