import express from 'express';
import {
  predictAllergyRisk,
  getModelInfo,
  getDatasetsCatalog,
  downloadDatasetFile
} from '../controllers/mlController.js';

const router = express.Router();

// Public routes for dataset transparency, model inspection & live prediction
router.get('/model-info', getModelInfo);
router.get('/datasets', getDatasetsCatalog);
router.get('/download/:filename', downloadDatasetFile);
router.post('/predict', predictAllergyRisk);

export default router;
