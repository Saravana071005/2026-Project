import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import mongoose from 'mongoose';
import app from './src/server.js';
import { runMLPrediction, getMLModelMetadata } from './src/services/ai/mlInferenceService.js';

const TEST_PORT = 5066;
let server;
const BASE_URL = `http://localhost:${TEST_PORT}/api/ml`;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  setTimeout(() => process.exit(0), 100);
});

test('ML Service - getMLModelMetadata loads valid training metadata', () => {
  const meta = getMLModelMetadata();
  assert.ok(meta.model_name);
  assert.strictEqual(meta.train_records, 7000);
  assert.strictEqual(meta.validation_records, 1500);
  assert.strictEqual(meta.test_records, 1500);
  assert.ok(meta.test_metrics.roc_auc >= 0.90);
});

test('ML Service - runMLPrediction returns accurate high-risk prediction', async () => {
  const sample = {
    Age: 25,
    Gender: 'Male',
    Family_History: 'Yes',
    Previous_Reaction: 'Moderate',
    Symptoms: 'Swelling',
    Food_Type: 'Nuts',
    Food_Frequency: 14,
    Medical_Conditions: 'Asthma',
    IgE_Levels: 520.0,
    Severity_Score: 8
  };

  const res = await runMLPrediction(sample);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.prediction, 1);
  assert.strictEqual(res.risk_level, 'High Risk');
  assert.ok(res.probability_allergic > 0.80);
});

test('ML API - GET /api/ml/model-info HTTP endpoint', async () => {
  const res = await fetch(`${BASE_URL}/model-info`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.train_records, 7000);
});

test('ML API - GET /api/ml/datasets HTTP endpoint', async () => {
  const res = await fetch(`${BASE_URL}/datasets`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.totalDatasets, 3);
  assert.strictEqual(data.totalRecordsCollected, 12578);
});

test('ML API - POST /api/ml/predict HTTP endpoint with low risk case', async () => {
  const sample = {
    Age: 40,
    Gender: 'Female',
    Family_History: 'No',
    Previous_Reaction: 'None',
    Symptoms: 'No symptoms',
    Food_Type: 'Dairy',
    Food_Frequency: 10,
    Medical_Conditions: 'None',
    IgE_Levels: 35.0,
    Severity_Score: 1
  };

  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample)
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.prediction, 0);
  assert.strictEqual(data.risk_level, 'Low Risk');
});

test('ML API - GET /api/ml/download/food_allergy_dataset.csv streams CSV file', async () => {
  const res = await fetch(`${BASE_URL}/download/food_allergy_dataset.csv`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers.get('content-type').includes('text/csv'));
  assert.ok(res.headers.get('content-disposition').includes('attachment; filename="food_allergy_dataset.csv"'));
  const text = await res.text();
  assert.ok(text.startsWith('Age,Gender,Family_History'));
});
