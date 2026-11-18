import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is 4 levels up: src/services/ai -> src/services -> src -> backend -> root
const projectRoot = path.resolve(__dirname, '../../../../');
const predictScriptPath = path.resolve(projectRoot, 'ml/predict.py');
const modelMetadataPath = path.resolve(projectRoot, 'ml/artifacts/model_metadata.json');

/**
 * Executes the Scikit-Learn prediction pipeline via python child_process
 * @param {Object} inputFeatures Patient and dietary biomarkers
 * @returns {Promise<Object>} Model prediction, probability, risk level
 */
export async function runMLPrediction(inputFeatures) {
  return new Promise((resolve, reject) => {
    // Validate script existence
    if (!fs.existsSync(predictScriptPath)) {
      return reject(new Error(`ML prediction script not found at ${predictScriptPath}`));
    }

    const pyProcess = spawn('python', [predictScriptPath]);
    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[ML Inference Error]:', stderrData);
        return reject(new Error(`ML predictor process exited with code ${code}: ${stderrData || 'Unknown error'}`));
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (err) {
        console.error('[ML JSON Parse Error]:', stdoutData);
        reject(new Error(`Failed to parse ML output JSON: ${err.message}`));
      }
    });

    pyProcess.on('error', (err) => {
      console.error('[ML Spawn Error]:', err.message);
      reject(new Error(`Failed to spawn Python runtime for ML inference: ${err.message}`));
    });

    // Pass input data via stdin to avoid shell escaping issues on Windows
    pyProcess.stdin.write(JSON.stringify(inputFeatures));
    pyProcess.stdin.end();
  });
}

/**
 * Reads verified model training metadata from disk
 * @returns {Object} Metadata JSON
 */
export function getMLModelMetadata() {
  if (!fs.existsSync(modelMetadataPath)) {
    return {
      status: 'not_trained',
      message: 'Model artifact metadata not found on disk.'
    };
  }
  const raw = fs.readFileSync(modelMetadataPath, 'utf-8');
  return JSON.parse(raw);
}
