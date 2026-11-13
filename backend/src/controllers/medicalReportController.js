import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import multer from 'multer';
import MedicalReport from '../models/MedicalReport.js';
import MedicalTestRecord from '../models/MedicalTestRecord.js';
import { processMedicalDocument } from '../services/ocr/ocrManager.js';

// Ensure secure uploads storage directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'reports');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate secure randomized unique filename: user_timestamp_random.ext
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    cb(null, `report_${req.user._id}_${uniqueSuffix}${ext}`);
  },
});

// File filter: strict validation of allowed MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type (${file.mimetype}). Supported formats: JPG, JPEG, PNG, WEBP, PDF.`
      ),
      false
    );
  }
};

// Export multer instance (15 MB max per file, up to 5 files per upload)
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

/**
 * Upload single or multiple medical report files and trigger OCR extraction
 * POST /api/medical-reports/upload
 */
export const uploadReports = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No medical report file was uploaded. Please select a valid document (PDF, JPG, PNG, WEBP).',
      });
    }

    const createdReports = [];

    for (const file of files) {
      const newReport = new MedicalReport({
        userId: req.user._id,
        originalFileName: file.originalname,
        storedFileName: file.filename,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        processingStatus: 'processing',
        userVerificationStatus: 'unverified',
      });

      await newReport.save();

      // Trigger OCR & Intelligent Document Understanding
      try {
        const ocrResult = await processMedicalDocument(file.path, file.mimetype);
        newReport.ocrExtractedText = ocrResult.rawText;
        newReport.ocrEngine = ocrResult.ocrEngine;
        newReport.structuredExtractedData = ocrResult.structuredData;
        newReport.fieldConfidence = ocrResult.fieldConfidence;
        newReport.processingStatus = 'processed';
      } catch (ocrErr) {
        console.error(`[OCR Extraction Error on ${file.originalname}]:`, ocrErr);
        newReport.processingStatus = 'failed';
        newReport.errorMessage = `OCR processing failed: ${ocrErr.message}`;
      }

      await newReport.save();
      createdReports.push(newReport);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully uploaded and processed ${createdReports.length} medical report(s).`,
      count: createdReports.length,
      data: createdReports.length === 1 ? createdReports[0] : createdReports,
    });
  } catch (error) {
    console.error('[Upload Reports Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during report upload and OCR processing.',
    });
  }
};

/**
 * Retrieve all medical report documents for the authenticated user
 * GET /api/medical-reports
 */
export const getReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('[Get Reports Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve uploaded medical reports.',
    });
  }
};

/**
 * Retrieve details of a specific medical report
 * GET /api/medical-reports/:id
 */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format.',
      });
    }

    // Strict ownership verification
    const report = await MedicalReport.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found or unauthorized to view.',
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[Get Report By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve medical report details.',
    });
  }
};

/**
 * Securely stream the raw medical document file to the authenticated owner
 * GET /api/medical-reports/:id/file
 */
export const getReportFile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format.',
      });
    }

    // Strict ownership check
    const report = await MedicalReport.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Medical report file not found or unauthorized access.',
      });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'The physical report file is no longer present on the server storage.',
      });
    }

    res.setHeader('Content-Type', report.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${report.originalFileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(report.filePath);
    return fileStream.pipe(res);
  } catch (error) {
    console.error('[Get Report File Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to stream medical report file.',
    });
  }
};

/**
 * Reprocess OCR on an existing uploaded document
 * POST /api/medical-reports/:id/process
 */
export const reprocessReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format.',
      });
    }

    const report = await MedicalReport.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found or unauthorized to reprocess.',
      });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Original document file is missing from storage.',
      });
    }

    report.processingStatus = 'processing';
    await report.save();

    const ocrResult = await processMedicalDocument(report.filePath, report.fileType);
    report.ocrExtractedText = ocrResult.rawText;
    report.ocrEngine = ocrResult.ocrEngine;
    report.structuredExtractedData = ocrResult.structuredData;
    report.fieldConfidence = ocrResult.fieldConfidence;
    report.processingStatus = 'processed';
    report.errorMessage = '';

    await report.save();

    return res.status(200).json({
      success: true,
      message: 'Medical report reprocessed successfully.',
      data: report,
    });
  } catch (error) {
    console.error('[Reprocess Report Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reprocess document OCR.',
    });
  }
};

/**
 * Save user-verified OCR extraction data into official MedicalTestRecord documents
 * POST /api/medical-reports/:id/confirm
 */
export const confirmReportData = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format.',
      });
    }

    const {
      tests,
      clinicOrLabName,
      doctorName,
      doctorNotes,
      testDate,
      clinicalDiagnosisStatus,
    } = req.body;

    const report = await MedicalReport.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found or unauthorized to confirm.',
      });
    }

    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No verified medical test items provided to save.',
      });
    }

    const savedTestRecords = [];
    const parsedDate = testDate ? new Date(testDate) : new Date();

    for (const item of tests) {
      // Validate mandatory fields
      if (!item.allergenName || !item.allergenName.trim()) continue;
      if (!item.testResult || !item.testResult.trim()) continue;

      const newTest = new MedicalTestRecord({
        userId: req.user._id,
        allergenName: item.allergenName.trim(),
        testType: item.testType || 'Specific IgE Blood Test',
        testDate: parsedDate,
        testResult: item.testResult.trim(),
        units: item.units ? item.units.trim() : '',
        referenceRange: item.referenceRange ? item.referenceRange.trim() : '',
        isDoctorConfirmedDiagnosis:
          clinicalDiagnosisStatus === 'Doctor-Confirmed Diagnosis' ||
          Boolean(item.isDoctorConfirmedDiagnosis),
        clinicalDiagnosisStatus:
          clinicalDiagnosisStatus ||
          item.clinicalDiagnosisStatus ||
          'Recorded Test Result (Not yet confirmed)',
        doctorNotes: doctorNotes ? doctorNotes.trim() : item.notes || '',
        recordedReactionDetails: item.recordedReactionDetails || '',
        clinicOrLabName: clinicOrLabName ? clinicOrLabName.trim() : '',
        reportId: report._id,
        ocrExtracted: true,
      });

      await newTest.save();
      savedTestRecords.push(newTest);
    }

    // Update report verification state & persist verified clinic/doctor values
    report.userVerificationStatus = 'verified_and_saved';
    report.processingStatus = 'confirmed';
    report.relatedMedicalTestRecordIds = savedTestRecords.map((t) => t._id);
    if (!report.structuredExtractedData) {
      report.structuredExtractedData = {};
    }
    if (clinicOrLabName !== undefined) {
      report.structuredExtractedData.clinicOrLabName = clinicOrLabName.trim();
    }
    if (doctorName !== undefined) {
      report.structuredExtractedData.doctorName = doctorName.trim();
    }
    await report.save();

    return res.status(200).json({
      success: true,
      message: `Successfully saved ${savedTestRecords.length} verified medical test record(s) to your health portal.`,
      savedCount: savedTestRecords.length,
      data: savedTestRecords,
      report,
    });
  } catch (error) {
    console.error('[Confirm Report Data Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save confirmed medical test records.',
    });
  }
};

/**
 * Delete a medical report document and remove physical file from disk
 * DELETE /api/medical-reports/:id
 */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format.',
      });
    }

    const report = await MedicalReport.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found or unauthorized to delete.',
      });
    }

    // Remove physical file from disk if present
    if (report.filePath && fs.existsSync(report.filePath)) {
      try {
        fs.unlinkSync(report.filePath);
      } catch (fileErr) {
        console.warn(`[File Cleanup Warning]: Could not delete file ${report.filePath}:`, fileErr.message);
      }
    }

    await MedicalReport.deleteOne({ _id: report._id });

    return res.status(200).json({
      success: true,
      message: 'Medical report and document file deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Report Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete medical report document.',
    });
  }
};
