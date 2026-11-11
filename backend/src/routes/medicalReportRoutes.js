import express from 'express';
import {
  uploadMiddleware,
  uploadReports,
  getReports,
  getReportById,
  getReportFile,
  reprocessReport,
  confirmReportData,
  deleteReport,
} from '../controllers/medicalReportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All medical report endpoints require user authentication
router.use(protect);

// Upload endpoint supports single file or multiple files (field name 'files' or 'file')
router.post(
  '/upload',
  uploadMiddleware.array('files', 5),
  uploadReports
);

router.get('/', getReports);
router.get('/:id', getReportById);
router.get('/:id/file', getReportFile);
router.post('/:id/process', reprocessReport);
router.post('/:id/confirm', confirmReportData);
router.delete('/:id', deleteReport);

export default router;
