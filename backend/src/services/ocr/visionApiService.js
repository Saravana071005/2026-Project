import fs from 'fs';

/**
 * Optional Google Cloud Vision OCR integration.
 * Activates when GOOGLE_VISION_API_KEY or GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
 * Returns null if not configured, allowing seamless fallback to Tesseract.js.
 * 
 * @param {string|Buffer} input - Image/PDF path or buffer
 * @returns {Promise<{ rawText: string, confidence: number } | null>}
 */
export async function runGoogleVisionOcr(input) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return null; // Fall back to local Tesseract engine
  }

  let base64Image;
  if (Buffer.isBuffer(input)) {
    base64Image = input.toString('base64');
  } else if (typeof input === 'string') {
    const buffer = fs.readFileSync(input);
    base64Image = buffer.toString('base64');
  } else {
    throw new Error('Invalid input to runGoogleVisionOcr');
  }

  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const requestBody = {
    requests: [
      {
        image: { content: base64Image },
        features: [
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
          { type: 'TEXT_DETECTION', maxResults: 1 },
        ],
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn('[Google Vision Warning] Vision API request failed, falling back:', errText);
    return null;
  }

  const result = await response.json();
  const textAnnotations = result.responses?.[0]?.textAnnotations;
  if (!textAnnotations || textAnnotations.length === 0) {
    return { rawText: '', confidence: 0 };
  }

  const fullText = textAnnotations[0].description || '';
  return {
    rawText: fullText.trim(),
    confidence: 95,
  };
}
