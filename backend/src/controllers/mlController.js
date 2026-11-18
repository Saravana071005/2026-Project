import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { runMLPrediction, getMLModelMetadata } from '../services/ai/mlInferenceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

const dataDirs = {
  original: path.resolve(projectRoot, 'data/original'),
  processed: path.resolve(projectRoot, 'data/processed')
};

function getFileHash(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const buffer = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getFileSize(filepath) {
  if (!fs.existsSync(filepath)) return 0;
  return fs.statSync(filepath).size;
}

/**
 * Controller: Run ML allergy risk prediction on provided biomarkers
 */
export async function predictAllergyRisk(req, res) {
  try {
    const input = req.body || {};
    
    // Quick validation
    if (input.IgE_Levels === undefined && input.ige_levels === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: IgE_Levels (numerical biomarker level in kU/L).'
      });
    }

    const predictionResult = await runMLPrediction(input);
    return res.status(200).json(predictionResult);
  } catch (error) {
    console.error('[ML Controller Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error executing ML prediction pipeline.'
    });
  }
}

/**
 * Controller: Get trained model metadata, evaluation metrics, and algorithms
 */
export function getModelInfo(req, res) {
  try {
    const metadata = getMLModelMetadata();
    return res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Controller: Get catalog of verified datasets with download URLs and provenance
 */
export function getDatasetsCatalog(req, res) {
  try {
    const datasets = [
      {
        id: 'food_allergy_clinical',
        name: 'Food Allergy Prediction & Clinical Risk Stratification Dataset',
        category: 'Clinical Diagnostic Observations',
        records: 10000,
        columns: 11,
        sourceOrganization: 'Ruthvik Uppala / AI For Food Allergies Open Index',
        sourceUrl: 'https://github.com/RuthvikUppala30/food-allergy-dataset',
        license: 'MIT License (Open Research)',
        downloadDate: '2026-11-19',
        description: 'Multi-variate clinical observation dataset mapping patient demographics, atopic medical conditions, serum IgE biomarker levels, dietary frequency, allergic symptoms, and verified clinical allergy outcomes.',
        originalFile: {
          filename: 'food_allergy_dataset.csv',
          sizeBytes: getFileSize(path.join(dataDirs.original, 'food_allergy_dataset.csv')),
          sha256: getFileHash(path.join(dataDirs.original, 'food_allergy_dataset.csv')),
          downloadUrl: '/api/ml/download/food_allergy_dataset.csv'
        },
        processedFiles: [
          {
            name: 'Full Cleaned Dataset',
            filename: 'cleaned_food_allergy_all.csv',
            records: 10000,
            sizeBytes: getFileSize(path.join(dataDirs.processed, 'cleaned_food_allergy_all.csv')),
            sha256: getFileHash(path.join(dataDirs.processed, 'cleaned_food_allergy_all.csv')),
            downloadUrl: '/api/ml/download/cleaned_food_allergy_all.csv'
          },
          {
            name: 'Training Split (70%)',
            filename: 'food_allergy_train.csv',
            records: 7000,
            sizeBytes: getFileSize(path.join(dataDirs.processed, 'food_allergy_train.csv')),
            sha256: getFileHash(path.join(dataDirs.processed, 'food_allergy_train.csv')),
            downloadUrl: '/api/ml/download/food_allergy_train.csv'
          },
          {
            name: 'Validation Split (15%)',
            filename: 'food_allergy_val.csv',
            records: 1500,
            sizeBytes: getFileSize(path.join(dataDirs.processed, 'food_allergy_val.csv')),
            sha256: getFileHash(path.join(dataDirs.processed, 'food_allergy_val.csv')),
            downloadUrl: '/api/ml/download/food_allergy_val.csv'
          },
          {
            name: 'Test Split (15%)',
            filename: 'food_allergy_test.csv',
            records: 1500,
            sizeBytes: getFileSize(path.join(dataDirs.processed, 'food_allergy_test.csv')),
            sha256: getFileHash(path.join(dataDirs.processed, 'food_allergy_test.csv')),
            downloadUrl: '/api/ml/download/food_allergy_test.csv'
          }
        ]
      },
      {
        id: 'fda_caers_allergic_reactions',
        name: 'FDA CAERS Food & Dietary Adverse Allergic Reactions Dataset',
        category: 'Post-Market Public Health Surveillance',
        records: 2500,
        columns: 8,
        sourceOrganization: 'U.S. Food and Drug Administration (FDA CFSAN via openFDA)',
        sourceUrl: 'https://open.fda.gov/apis/food/event/',
        license: 'U.S. Public Domain (17 U.S.C. § 105)',
        downloadDate: '2026-11-19',
        description: 'Real-world adverse event reports from openFDA tracking consumer food products, demographics, documented allergic symptoms (angioedema, urticaria, dyspnea), and clinical outcome severity.',
        originalFile: {
          filename: 'fda_caers_food_allergic_reactions.csv',
          sizeBytes: getFileSize(path.join(dataDirs.original, 'fda_caers_food_allergic_reactions.csv')),
          sha256: getFileHash(path.join(dataDirs.original, 'fda_caers_food_allergic_reactions.csv')),
          downloadUrl: '/api/ml/download/fda_caers_food_allergic_reactions.csv'
        },
        processedFiles: [
          {
            name: 'Cleaned FDA Reactions',
            filename: 'cleaned_fda_reactions.csv',
            records: 2500,
            sizeBytes: getFileSize(path.join(dataDirs.processed, 'cleaned_fda_reactions.csv')),
            sha256: getFileHash(path.join(dataDirs.processed, 'cleaned_fda_reactions.csv')),
            downloadUrl: '/api/ml/download/cleaned_fda_reactions.csv'
          }
        ]
      },
      {
        id: 'swiss_eu_allergens_taxonomy',
        name: 'Swiss / EU Regulated Food Allergens Reference Taxonomy',
        category: 'Food Safety Standards & Allergen Taxonomy',
        records: 78,
        columns: 2,
        sourceOrganization: 'Food Open Data Switzerland / Swiss Federal Food Safety Legislation',
        sourceUrl: 'https://github.com/foodopendata/food-allergens-ch',
        license: 'Creative Commons CC0 1.0 Universal (Public Domain Dedication)',
        downloadDate: '2026-11-19',
        description: 'Official legal baseline reference classifying culinary ingredients and food subgroups into the 14 mandatory declared allergen categories under Swiss and EU food law.',
        originalFile: {
          filename: 'food_allergens_ch.csv',
          sizeBytes: getFileSize(path.join(dataDirs.original, 'food_allergens_ch.csv')),
          sha256: getFileHash(path.join(dataDirs.original, 'food_allergens_ch.csv')),
          downloadUrl: '/api/ml/download/food_allergens_ch.csv'
        },
        processedFiles: [
          {
            name: 'Standardized EU/EN Taxonomy',
            filename: 'cleaned_food_allergens.csv',
            records: 78,
            sizeBytes: getFileSize(path.join(dataDirs.processed, 'cleaned_food_allergens.csv')),
            sha256: getFileHash(path.join(dataDirs.processed, 'cleaned_food_allergens.csv')),
            downloadUrl: '/api/ml/download/cleaned_food_allergens.csv'
          }
        ]
      }
    ];

    const totalRecords = datasets.reduce((sum, d) => sum + d.records, 0);

    return res.status(200).json({
      success: true,
      totalDatasets: datasets.length,
      totalRecordsCollected: totalRecords,
      datasets
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Controller: Stream/download authorized CSV files
 */
export function downloadDatasetFile(req, res) {
  try {
    const filename = path.basename(req.params.filename); // sanitize against path traversal

    // Check original folder
    let targetPath = path.join(dataDirs.original, filename);
    if (!fs.existsSync(targetPath)) {
      // Check processed folder
      targetPath = path.join(dataDirs.processed, filename);
    }

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({
        success: false,
        message: `Requested CSV dataset file '${filename}' was not found on server.`
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(targetPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[Download Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to stream dataset file.'
    });
  }
}
