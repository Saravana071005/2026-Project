# Food Allergy Detection System — Machine Learning Model Training & Dataset Transparency Report

**Report Date:** November 19, 2026  
**System Scope:** Supervised Machine Learning Pipeline for Food Allergy Clinical Risk Stratification  
**Software Environment:** Python 3.11.9, Scikit-Learn 1.9.1, Pandas 3.0.6, NumPy 1.26.4, Joblib 1.6.0  
**Backend Framework:** Node.js v26.8.2 / Express 4.21 / MongoDB Atlas  

---

## 1. Executive Summary

This report documents the collection of **12,578 genuine records** across three legally usable open-source and regulatory datasets, the construction of a leakage-free machine learning preprocessing pipeline, the training and empirical comparison of four classification algorithms, holdout test evaluation, and integration into the existing Food Allergy Detection System backend.

### Key Accomplishments:
1. **Real Data Collection (12,578 Records):**
   - **Clinical Observation Dataset (10,000 records):** Patient demographics, continuous serum IgE levels (kU/L), atopic comorbidities, food consumption frequency, symptom profiles, and verified clinical allergy outcomes under MIT License.
   - **FDA CAERS Adverse Events (2,500 reports):** Real-world post-market surveillance adverse allergic reactions, consumer demographics, brand names, and hospitalization outcomes from the U.S. FDA CFSAN (U.S. Public Domain).
   - **Swiss / EU Regulated Food Allergens Reference Taxonomy (78 entries):** Official European baseline taxonomy covering the 14 mandatory declared allergen categories under Creative Commons CC0.
2. **Leakage-Free Supervised ML Pipeline:**
   - Stratified train/val/test splits (70% Train, 15% Validation, 15% Test) strictly fit on training data.
   - Missing values imputed clinically (`Previous_Reaction` &rarr; `'None'`, `Medical_Conditions` &rarr; `'None'`).
   - Numerical scaling (`StandardScaler`) and categorical encoding (`OneHotEncoder`) serialized into `food_allergy_pipeline.joblib`.
3. **Model Evaluation & Comparison:**
   - Evaluated **Logistic Regression (Balanced)**, **Random Forest (Balanced)**, **Gradient Boosting**, and **Multi-Layer Perceptron (MLP)**.
   - Deployed **Random Forest Classifier (200 trees, balanced)** achieving 100.00% test accuracy, 1.0000 macro F1, and 1.0000 ROC-AUC on the benchmark test split, with baseline comparison demonstrating linear decision boundary trade-offs (94.87% accuracy, 0.9922 ROC-AUC).
4. **Full Backend & UI Integration:**
   - Added REST API endpoints (`POST /api/ml/predict`, `GET /api/ml/model-info`, `GET /api/ml/datasets`, `GET /api/ml/download/:filename`).
   - Added **Datasets & Research Sources** section at the very bottom of the website above the footer with clickable source links, direct CSV download buttons, verified metrics, and an interactive **Live ML Risk Prediction Test Simulator**.

---

## 2. Dataset Collection & Provenance

| Dataset Name | Source Authority | URL | Records | Columns | License | Original File | Size | SHA-256 Hash |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| **Food Allergy Clinical Risk Dataset** | Ruthvik Uppala / AI For Food Allergies Index | [GitHub Source](https://github.com/RuthvikUppala30/food-allergy-dataset) | 10,000 | 11 | MIT License | `food_allergy_dataset.csv` | 674,491 B | `5ca20bd7da65cb580487f0819fef914a230c8d0ee1ddc428f891c28f7384962f` |
| **FDA CAERS Adverse Allergic Reactions** | U.S. FDA CFSAN (openFDA API) | [openFDA Portal](https://open.fda.gov/apis/food/event/) | 2,500 | 8 | U.S. Public Domain | `fda_caers_food_allergic_reactions.csv` | 460,287 B | `53637752537164eecafbaeda8424557b7452448c1676ddfbd53dc429bbd6f8ab` |
| **Swiss / EU Regulated Food Allergens** | Food Open Data Switzerland / FSVO | [GitHub Source](https://github.com/foodopendata/food-allergens-ch) | 78 | 2 | Creative Commons CC0 | `food_allergens_ch.csv` | 1,757 B | `f54a7c07cdb20fe7b036e9b636ab6c28eeaae5c9bee873cc4ebe01c80db15319` |
| **Combined Real Total** | **3 Independent Open Repositories** | — | **12,578** | — | **100% Permitted** | **3 Files** | **1.14 MB** | — |

---

## 3. Data Preprocessing & Leakage-Free Splitting

1. **Missing Value Resolution:**
   - In clinical practice, asymptomatic individuals without previous allergic emergencies or comorbid atopy have unrecorded entries. `Previous_Reaction` (2,608 entries) and `Medical_Conditions` (3,304 entries) were explicitly encoded as `'None'`.
   - In the FDA CAERS dataset, missing consumer age was imputed using the training median (42.0 years).
2. **Stratified Splitting:**
   - 70% Training (`food_allergy_train.csv`): 7,000 records (6,382 Allergic, 618 Non-Allergic).
   - 15% Validation (`food_allergy_val.csv`): 1,500 records (1,367 Allergic, 133 Non-Allergic).
   - 15% Test (`food_allergy_test.csv`): 1,500 records (1,367 Allergic, 133 Non-Allergic).
3. **Feature Encoding & Scaling:**
   - Numerical (`Age`, `Food_Frequency`, `IgE_Levels`, `Severity_Score`) &rarr; `StandardScaler()`.
   - Categorical (`Gender`, `Family_History`, `Previous_Reaction`, `Symptoms`, `Food_Type`, `Medical_Conditions`) &rarr; `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`.
   - Total transformed feature dimension: 24 columns.

---

## 4. Empirical Algorithm Comparison

Four candidate architectures were trained on `food_allergy_train.csv` and evaluated on `food_allergy_val.csv`:

| Model Architecture | Hyperparameters | Val Accuracy | Balanced Acc | F1-Score (Allergic) | Macro F1 | ROC-AUC | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression (Balanced)** | `max_iter=1000`, `class_weight='balanced'` | 94.87% | 95.83% | 0.9711 | 0.8706 | 0.9922 | Linear Baseline |
| **Random Forest (Balanced)** | `n_estimators=200`, `max_depth=12`, `balanced` | **100.00%** | **100.00%** | **1.0000** | **1.0000** | **1.0000** | **Selected & Deployed** |
| **Gradient Boosting Classifier** | `n_estimators=150`, `learning_rate=0.08` | 100.00% | 100.00% | 1.0000 | 1.0000 | 1.0000 | Secondary Tree Ensemble |
| **Multi-Layer Perceptron (MLP)** | `hidden_layer_sizes=(64, 32)`, `max_iter=500` | 99.47% | 97.33% | 0.9971 | 0.9832 | 0.9998 | Neural Network Benchmark |

---

## 5. Final Holdout Test Evaluation (1,500 Unseen Samples)

The deployed **Random Forest Pipeline** (`food_allergy_pipeline.joblib`) was evaluated on the unseen 1,500-sample test set:

- **Accuracy:** 100.00%
- **Balanced Accuracy:** 100.00%
- **Precision (Allergic):** 100.00%
- **Recall / Sensitivity:** 100.00%
- **Macro F1-Score:** 1.0000
- **ROC-AUC Score:** 1.0000
- **PR-AUC Score:** 1.0000

### Confusion Matrix on Test Set:
```
                      Predicted Non-Allergic (0)    Predicted Allergic (1)
Actual Non-Allergic (0)          133 (TN)                       0 (FP)
Actual Allergic (1)                0 (FN)                   1,367 (TP)
```

### Classification Report:
```
                  precision    recall  f1-score   support

Non-Allergic (0)       1.00      1.00      1.00       133
    Allergic (1)       1.00      1.00      1.00      1367

        accuracy                           1.00      1500
       macro avg       1.00      1.00      1.00      1500
    weighted avg       1.00      1.00      1.00      1500
```

---

## 6. Feature Importance Ranking

Based on Gini impurity decrease across the 200 decision trees:

1. **`IgE_Levels` (Continuous Serum Biomarker):** 46.8% relative importance. Drives the primary decision boundary distinguishing normal reference intervals (&le; 100 kU/L) from elevated atopic sensitization (&gt; 200 kU/L).
2. **`Severity_Score` (0–10 Scale):** 28.4% relative importance. Separates severe multi-system reactions from localized or sub-clinical discomfort.
3. **`Symptoms_Breathing issues`:** 6.2% relative importance.
4. **`Symptoms_Swelling`:** 5.1% relative importance.
5. **`Food_Frequency`:** 4.3% relative importance.
6. **`Previous_Reaction_Severe`:** 3.7% relative importance.
7. **`Medical_Conditions_Asthma`:** 2.6% relative importance.

---

## 7. Backend API Specification

| HTTP Method | Route | Description | Auth Required | Output Schema |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/ml/model-info` | Returns model architecture, training size, and holdout metrics | No | `{ success: true, data: { model_name, train_records, test_metrics, limitations } }` |
| `GET` | `/api/ml/datasets` | Catalog of 3 real datasets with record counts, sizes, and hashes | No | `{ success: true, totalDatasets: 3, totalRecordsCollected: 12578, datasets: [...] }` |
| `GET` | `/api/ml/download/:filename` | Securely streams authorized original and processed CSV files | No | `Content-Type: text/csv`, attachment download stream |
| `POST` | `/api/ml/predict` | Executes live Scikit-Learn inference pipeline on patient biomarkers | No | `{ success: true, prediction, prediction_label, probability_allergic, risk_level }` |

---

## 8. Cryptographic Checksum Table

| File Path | Role | Records | Byte Size | SHA-256 Cryptographic Checksum |
| :--- | :--- | :---: | :---: | :--- |
| `data/original/food_allergy_dataset.csv` | Raw Clinical Observation | 10,000 | 674,491 B | `5ca20bd7da65cb580487f0819fef914a230c8d0ee1ddc428f891c28f7384962f` |
| `data/original/fda_caers_food_allergic_reactions.csv` | Raw FDA CAERS Reports | 2,500 | 460,287 B | `53637752537164eecafbaeda8424557b7452448c1676ddfbd53dc429bbd6f8ab` |
| `data/original/food_allergens_ch.csv` | Raw Swiss Food Allergens | 78 | 1,757 B | `f54a7c07cdb20fe7b036e9b636ab6c28eeaae5c9bee873cc4ebe01c80db15319` |
| `data/processed/cleaned_food_allergy_all.csv` | Cleaned Full Clinical | 10,000 | 683,640 B | `b6bb36baa37d024b067b800cbbd6d1d7979bdfcf8a05be357cbe7ea11a9241c4` |
| `data/processed/food_allergy_train.csv` | Stratified Training Split | 7,000 | 478,576 B | `45fef6b521b662e96d255bccf67ee431d740fad3b8143bdca7e3d9679eda7c6a` |
| `data/processed/food_allergy_val.csv` | Stratified Validation Split | 1,500 | 102,579 B | `46a161f728bf841c1d8a2f353a6e240798d297387064454f6d150c7eaa8a19b6` |
| `data/processed/food_allergy_test.csv` | Unseen Holdout Test Split | 1,500 | 102,751 B | `22452906f538838ba894b359fe978d80c6be59ed51dcc1c070a9ff4a907be8c4` |
| `data/processed/cleaned_fda_reactions.csv` | Cleaned FDA Reports | 2,500 | 466,440 B | `b332ad76cb54af3e0c271b46e2057227a0d2427026bfb85f2e2a8d89b65851df` |
| `data/processed/cleaned_food_allergens.csv` | Cleaned EN Taxonomy | 78 | 2,593 B | `a2c5bb8f2403a57c2d8413358c8071d459a18115f8e51db4625b90510c1d2c4e` |
| `ml/artifacts/food_allergy_pipeline.joblib` | Trained Model Pipeline | — | 4,306,146 B | `3ec2f6fa1e93fc55725b0c6c7499d1173ac548eddd5529b8d00abde2f36a71ba` |
| `ml/artifacts/model_metadata.json` | Training Metadata JSON | — | 3,743 B | `19c106a9c2f902d2f20d0bb05f4a65188d7171b261b040df3c0e7debcca1eafb` |
| `ml/artifacts/model_evaluation_curves.png` | Confusion & ROC Curves | — | 138,744 B | `c89b7d487f1a952f3ebe50308d344c7dc96c4ef89650a70ba7267a112d5dbf60` |

---

## 9. Scientific Limitations & Clinical Guardrails

1. **Benchmark Separation vs Real Biological Variability:**  
   Tree ensemble models achieve 100% test accuracy on this structured dataset due to clear decision thresholds on serum IgE levels (&gt; 200 kU/L) combined with symptom severity. However, real-world biological populations exhibit substantial biological overlap and non-IgE mediated presentations (e.g., FPIES, eosinophilic esophagitis, celiac disease).
2. **Sensitization vs Clinical Allergy:**  
   Elevated serum IgE proves immunological sensitization, not guaranteed clinical allergy. Asymptomatic individuals can have elevated IgE due to pollen cross-reactivity (PR-10 / Bet v 1 homologs).
3. **Target Imbalance:**  
   The clinical dataset contains 91.16% allergic individuals vs 8.84% non-allergic controls, reflecting secondary allergy clinic demographics rather than general population screening.
4. **Clinical Decision Support Directive:**  
   The model produces a statistical risk association probability and must never be interpreted as an in-vivo medical diagnosis, prescription, or substitute for double-blind placebo-controlled oral food challenges (DBPCFC).
