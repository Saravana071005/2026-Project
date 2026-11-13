import { parsePdf } from './pdfParseService.js';
import { recognizeImage } from './tesseractService.js';
import { runGoogleVisionOcr } from './visionApiService.js';
import { analyzeMedicalDocument } from './documentUnderstandingService.js';

/**
 * Universal OCR Manager
 * Orchestrates file inspection, engine selection, OCR extraction,
 * and passes the raw text to the Document Understanding Engine.
 * 
 * @param {string} filePath - Absolute path to stored report file
 * @param {string} fileType - MIME type of the uploaded file
 * @param {object} options - Optional callbacks (e.g. onProgress)
 * @returns {Promise<{
 *   rawText: string,
 *   ocrEngine: string,
 *   structuredData: object,
 *   fieldConfidence: Map<string, object>
 * }>}
 */
export async function processMedicalDocument(filePath, fileType, options = {}) {
  let rawText = '';
  let ocrEngine = 'hybrid';

  const isPdf = fileType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      console.log(`[OCR Manager] Processing digital PDF via pdf-parse: ${filePath}`);
      const pdfResult = await parsePdf(filePath);
      if (pdfResult.rawText && pdfResult.rawText.length > 20) {
        rawText = pdfResult.rawText;
        ocrEngine = 'pdf-native';
      } else {
        console.log('[OCR Manager] PDF has no digital text layer (scanned). Checking Google Vision or fallback.');
        const visionResult = await runGoogleVisionOcr(filePath);
        if (visionResult && visionResult.rawText) {
          rawText = visionResult.rawText;
          ocrEngine = 'google-vision';
        }
      }
    } catch (err) {
      console.warn('[OCR Manager] PDF native parsing encountered warning:', err.message);
    }
  } else {
    // Image formats (JPG, PNG, WEBP)
    // 1. Try Google Cloud Vision OCR if configured
    try {
      const visionResult = await runGoogleVisionOcr(filePath);
      if (visionResult && visionResult.rawText) {
        rawText = visionResult.rawText;
        ocrEngine = 'google-vision';
        console.log('[OCR Manager] Successfully extracted text using Google Cloud Vision API.');
      }
    } catch (err) {
      console.warn('[OCR Manager] Google Vision API check error:', err.message);
    }

    // 2. Built-in Tesseract.js engine (Zero native dependencies)
    if (!rawText) {
      console.log(`[OCR Manager] Running Tesseract.js OCR on image: ${filePath}`);
      const tesseractResult = await recognizeImage(filePath, options);
      rawText = tesseractResult.rawText;
      ocrEngine = 'tesseract';
    }
  }

  // Fallback: If still empty
  if (!rawText || rawText.trim().length === 0) {
    console.warn('[OCR Manager] Warning: No readable text extracted from document.');
    rawText = '';
  }

  // Run Intelligent Document Understanding
  console.log(`[OCR Manager] Analyzing medical document layout and clinical entities (${rawText.length} chars extracted)...`);
  const analysisResult = analyzeMedicalDocument(rawText, options);

  return {
    rawText,
    ocrEngine,
    selectedTestType: options.selectedTestType || null,
    detectedTestType: analysisResult.detectedTestType || 'Specific IgE Blood Test',
    testTypeMismatch: Boolean(analysisResult.testTypeMismatch),
    testMismatchDetails: analysisResult.testMismatchDetails || null,
    structuredData: {
      extractedAt: analysisResult.extractedAt,
      clinicOrLabName: analysisResult.clinicOrLabName,
      doctorName: analysisResult.doctorName,
      doctorNotes: analysisResult.doctorNotes,
      testDate: analysisResult.testDate,
      patientName: analysisResult.patientName,
      clinicalDiagnosisStatus: analysisResult.clinicalDiagnosisStatus,
      allergyTests: analysisResult.allergyTests,
      generalMeasurements: analysisResult.generalMeasurements,
      detectedTestType: analysisResult.detectedTestType,
      selectedTestType: options.selectedTestType || null,
      testTypeMismatch: Boolean(analysisResult.testTypeMismatch),
      testMismatchDetails: analysisResult.testMismatchDetails || null,
    },
    fieldConfidence: analysisResult.fieldConfidence,
  };
}
