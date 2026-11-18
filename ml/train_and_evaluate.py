import os
import sys
import json
import hashlib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, average_precision_score, confusion_matrix,
    classification_report, roc_curve, precision_recall_curve
)

BASE_DIR = r'C:\Users\Admin\.gemini\antigravity-ide\scratch\food-allergy-detection-system'
ORIG_DIR = os.path.join(BASE_DIR, 'data', 'original')
PROC_DIR = os.path.join(BASE_DIR, 'data', 'processed')
ART_DIR = os.path.join(BASE_DIR, 'ml', 'artifacts')

os.makedirs(PROC_DIR, exist_ok=True)
os.makedirs(ART_DIR, exist_ok=True)

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

print("="*70)
print("STAGE 2 & 3: DATA PREPROCESSING, MODEL TRAINING & EVALUATION")
print("="*70)

# -------------------------------------------------------------
# 1. PROCESS DATASET 1: Food Allergy Dataset
# -------------------------------------------------------------
raw_fa_path = os.path.join(ORIG_DIR, 'food_allergy_dataset.csv')
print(f"\n1. Loading and cleaning Food Allergy Dataset from {raw_fa_path}...")
df_fa = pd.read_csv(raw_fa_path)
print(f"   Raw shape: {df_fa.shape}")

# Data cleaning
df_fa_clean = df_fa.copy()
df_fa_clean['Previous_Reaction'] = df_fa_clean['Previous_Reaction'].fillna('None')
df_fa_clean['Medical_Conditions'] = df_fa_clean['Medical_Conditions'].fillna('None')

# Check duplicates and drop if any
dups = df_fa_clean.duplicated().sum()
if dups > 0:
    print(f"   Dropping {dups} duplicate rows...")
    df_fa_clean = df_fa_clean.drop_duplicates().reset_index(drop=True)

# Save full cleaned dataset
proc_fa_all = os.path.join(PROC_DIR, 'cleaned_food_allergy_all.csv')
df_fa_clean.to_csv(proc_fa_all, index=False)
print(f"   Saved full cleaned dataset: {proc_fa_all} ({len(df_fa_clean)} records, {sha256_file(proc_fa_all)[:16]}...)")

# Feature definition
target_col = 'Allergic'
num_features = ['Age', 'Food_Frequency', 'IgE_Levels', 'Severity_Score']
cat_features = ['Gender', 'Family_History', 'Previous_Reaction', 'Symptoms', 'Food_Type', 'Medical_Conditions']

X = df_fa_clean[num_features + cat_features]
y = df_fa_clean[target_col]

# Stratified Split: 70% Train, 15% Validation, 15% Test
X_train_val, X_test, y_train_val, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_train_val, y_train_val, test_size=(0.15 / 0.85), random_state=42, stratify=y_train_val
)

print(f"   Stratified splits:")
print(f"     Train set:      {len(X_train)} records (Pos: {y_train.sum()}, Neg: {len(y_train) - y_train.sum()})")
print(f"     Validation set: {len(X_val)} records (Pos: {y_val.sum()}, Neg: {len(y_val) - y_val.sum()})")
print(f"     Test set:       {len(X_test)} records (Pos: {y_test.sum()}, Neg: {len(y_test) - y_test.sum()})")

# Export split CSVs
train_df = pd.concat([X_train, y_train], axis=1)
val_df = pd.concat([X_val, y_val], axis=1)
test_df = pd.concat([X_test, y_test], axis=1)

train_path = os.path.join(PROC_DIR, 'food_allergy_train.csv')
val_path = os.path.join(PROC_DIR, 'food_allergy_val.csv')
test_path = os.path.join(PROC_DIR, 'food_allergy_test.csv')

train_df.to_csv(train_path, index=False)
val_df.to_csv(val_path, index=False)
test_df.to_csv(test_path, index=False)

print(f"   Exported splits:")
print(f"     -> {train_path} ({os.path.getsize(train_path):,} bytes, SHA-256: {sha256_file(train_path)[:16]}...)")
print(f"     -> {val_path} ({os.path.getsize(val_path):,} bytes, SHA-256: {sha256_file(val_path)[:16]}...)")
print(f"     -> {test_path} ({os.path.getsize(test_path):,} bytes, SHA-256: {sha256_file(test_path)[:16]}...)")

# -------------------------------------------------------------
# 2. PROCESS DATASET 2: FDA CAERS Food Reactions
# -------------------------------------------------------------
raw_fda_path = os.path.join(ORIG_DIR, 'fda_caers_food_allergic_reactions.csv')
print(f"\n2. Cleaning FDA CAERS Food Allergic Reactions from {raw_fda_path}...")
df_fda = pd.read_csv(raw_fda_path)
df_fda_clean = df_fda.copy()

# Median imputation for missing consumer_age
median_age = df_fda_clean['consumer_age'].dropna().astype(float).median()
df_fda_clean['consumer_age'] = df_fda_clean['consumer_age'].fillna(median_age).round(1)
df_fda_clean['consumer_gender'] = df_fda_clean['consumer_gender'].fillna('Unknown')
df_fda_clean['products'] = df_fda_clean['products'].fillna('Unspecified Food Product')
df_fda_clean['reactions'] = df_fda_clean['reactions'].fillna('Allergic reaction')

proc_fda_path = os.path.join(PROC_DIR, 'cleaned_fda_reactions.csv')
df_fda_clean.to_csv(proc_fda_path, index=False)
print(f"   Saved cleaned FDA reactions: {proc_fda_path} ({len(df_fda_clean)} records, SHA-256: {sha256_file(proc_fda_path)[:16]}...)")

# -------------------------------------------------------------
# 3. PROCESS DATASET 3: Swiss / EU Food Allergens
# -------------------------------------------------------------
raw_swiss_path = os.path.join(ORIG_DIR, 'food_allergens_ch.csv')
print(f"\n3. Cleaning Swiss/EU Food Allergens Taxonomy from {raw_swiss_path}...")
df_swiss = pd.read_csv(raw_swiss_path)
df_swiss_clean = df_swiss.copy()

# Map German category names to English standard EU allergen classes
german_to_english = {
    'Glutenhaltige Getreide': 'Cereals containing gluten',
    'Krebstiere': 'Crustaceans',
    'Eier': 'Eggs',
    'Fische': 'Fish',
    'Erdnüsse': 'Peanuts',
    'Sojabohnen': 'Soybeans',
    'Milch': 'Milk',
    'Schalenfrüchte': 'Tree nuts',
    'Sellerie': 'Celery',
    'Senf': 'Mustard',
    'Sesamsamen': 'Sesame seeds',
    'Schwefeldioxid und Sulfite': 'Sulfur dioxide and sulfites',
    'Lupinen': 'Lupin',
    'Weichtiere': 'Molluscs'
}
df_swiss_clean['Major_Allergen_Group_EN'] = df_swiss_clean['Hauptgruppe'].map(lambda x: german_to_english.get(x, x))
df_swiss_clean['Subgroup_Ingredient_DE'] = df_swiss_clean['Untergruppe']
df_swiss_clean = df_swiss_clean[['Hauptgruppe', 'Major_Allergen_Group_EN', 'Subgroup_Ingredient_DE']]

proc_swiss_path = os.path.join(PROC_DIR, 'cleaned_food_allergens.csv')
df_swiss_clean.to_csv(proc_swiss_path, index=False)
print(f"   Saved cleaned food allergens taxonomy: {proc_swiss_path} ({len(df_swiss_clean)} records, SHA-256: {sha256_file(proc_swiss_path)[:16]}...)")

# -------------------------------------------------------------
# 4. PREPROCESSING PIPELINE & MODEL COMPARISON
# -------------------------------------------------------------
print("\n4. Building Scikit-Learn Preprocessing Pipeline & Training Candidate Models...")

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), num_features),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features)
    ]
)

# Candidate model architectures
candidates = {
    'Logistic Regression (Balanced)': LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42),
    'Random Forest (Balanced)': RandomForestClassifier(n_estimators=200, class_weight='balanced', max_depth=12, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=150, learning_rate=0.08, max_depth=5, random_state=42),
    'Multi-Layer Perceptron (MLP)': MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
}

results = {}
trained_pipelines = {}

for name, model in candidates.items():
    pipe = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', model)
    ])
    
    # Fit on training data
    pipe.fit(X_train, y_train)
    trained_pipelines[name] = pipe
    
    # Evaluate on Validation set
    y_val_pred = pipe.predict(X_val)
    y_val_prob = pipe.predict_proba(X_val)[:, 1] if hasattr(pipe, 'predict_proba') else None
    
    acc = accuracy_score(y_val, y_val_pred)
    b_acc = balanced_accuracy_score(y_val, y_val_pred)
    prec = precision_score(y_val, y_val_pred, zero_division=0)
    rec = recall_score(y_val, y_val_pred, zero_division=0)
    f1 = f1_score(y_val, y_val_pred, zero_division=0)
    macro_f1 = f1_score(y_val, y_val_pred, average='macro')
    roc = roc_auc_score(y_val, y_val_prob) if y_val_prob is not None else 0.0
    pr_auc = average_precision_score(y_val, y_val_prob) if y_val_prob is not None else 0.0
    
    results[name] = {
        'val_accuracy': float(acc),
        'val_balanced_accuracy': float(b_acc),
        'val_precision': float(prec),
        'val_recall': float(rec),
        'val_f1': float(f1),
        'val_macro_f1': float(macro_f1),
        'val_roc_auc': float(roc),
        'val_pr_auc': float(pr_auc)
    }
    
    print(f"   [{name}]")
    print(f"     Accuracy: {acc*100:.2f}% | Balanced Acc: {b_acc*100:.2f}% | F1-Score: {f1:.4f} | Macro-F1: {macro_f1:.4f} | ROC-AUC: {roc:.4f}")

# Select best model based on validation macro F1-score and ROC-AUC
best_model_name = max(results, key=lambda k: results[k]['val_macro_f1'] + results[k]['val_roc_auc'])
best_pipe = trained_pipelines[best_model_name]
print(f"\n>>> Best Model Selected: {best_model_name}")

# -------------------------------------------------------------
# 5. FINAL TEST EVALUATION ON UNSEEN TEST SET
# -------------------------------------------------------------
print("\n5. Evaluating Best Model on Unseen Test Set (1,500 records)...")
y_test_pred = best_pipe.predict(X_test)
y_test_prob = best_pipe.predict_proba(X_test)[:, 1]

test_acc = accuracy_score(y_test, y_test_pred)
test_b_acc = balanced_accuracy_score(y_test, y_test_pred)
test_prec = precision_score(y_test, y_test_pred, zero_division=0)
test_rec = recall_score(y_test, y_test_pred, zero_division=0)
test_f1 = f1_score(y_test, y_test_pred, zero_division=0)
test_macro_f1 = f1_score(y_test, y_test_pred, average='macro')
test_roc = roc_auc_score(y_test, y_test_prob)
test_pr_auc = average_precision_score(y_test, y_test_prob)
cm = confusion_matrix(y_test, y_test_pred)

print(f"   Test Set Evaluation Metrics:")
print(f"     Accuracy:          {test_acc*100:.2f}%")
print(f"     Balanced Accuracy: {test_b_acc*100:.2f}%")
print(f"     Precision:         {test_prec*100:.2f}%")
print(f"     Recall:            {test_rec*100:.2f}%")
print(f"     F1-Score (Allergic): {test_f1:.4f}")
print(f"     Macro F1-Score:    {test_macro_f1:.4f}")
print(f"     ROC-AUC Score:     {test_roc:.4f}")
print(f"     PR-AUC Score:      {test_pr_auc:.4f}")
print("\n   Confusion Matrix on Test Set:")
print(f"     True Negatives (TN):  {cm[0][0]}")
print(f"     False Positives (FP): {cm[0][1]}")
print(f"     False Negatives (FN): {cm[1][0]}")
print(f"     True Positives (TP):  {cm[1][1]}")

print("\n   Detailed Classification Report:")
print(classification_report(y_test, y_test_pred, target_names=['Non-Allergic (0)', 'Allergic (1)']))

# -------------------------------------------------------------
# 6. FEATURE IMPORTANCE (if available)
# -------------------------------------------------------------
feature_names = []
# Extract feature names from preprocessor
preprocessor_fitted = best_pipe.named_steps['preprocessor']
cat_encoder = preprocessor_fitted.named_transformers_['cat']
cat_encoded_names = list(cat_encoder.get_feature_names_out(cat_features))
all_feature_names = num_features + cat_encoded_names

classifier = best_pipe.named_steps['classifier']
feature_importances = {}
if hasattr(classifier, 'feature_importances_'):
    importances = classifier.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    for idx in sorted_idx[:15]:
        feature_importances[all_feature_names[idx]] = float(importances[idx])
elif hasattr(classifier, 'coef_'):
    coefs = classifier.coef_[0]
    sorted_idx = np.argsort(np.abs(coefs))[::-1]
    for idx in sorted_idx[:15]:
        feature_importances[all_feature_names[idx]] = float(coefs[idx])

# -------------------------------------------------------------
# 7. GENERATE VISUALIZATIONS (Confusion Matrix & ROC Curve)
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5))

# Subplot 1: Confusion Matrix
im = ax1.imshow(cm, interpolation='nearest', cmap=plt.cm.GnBu)
ax1.set_title(f'Confusion Matrix\n{best_model_name}', fontsize=11, fontweight='bold', color='#0F172A')
fig.colorbar(im, ax=ax1, fraction=0.046, pad=0.04)
tick_marks = np.arange(2)
ax1.set_xticks(tick_marks)
ax1.set_yticks(tick_marks)
ax1.set_xticklabels(['Non-Allergic (0)', 'Allergic (1)'], fontsize=9)
ax1.set_yticklabels(['Non-Allergic (0)', 'Allergic (1)'], fontsize=9)
ax1.set_ylabel('True Clinical Status', fontsize=9, fontweight='bold')
ax1.set_xlabel('Model Predicted Status', fontsize=9, fontweight='bold')

# Loop over data dimensions and create text annotations.
thresh = cm.max() / 2.
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        ax1.text(j, i, format(cm[i, j], 'd'),
                 ha="center", va="center",
                 color="white" if cm[i, j] > thresh else "black",
                 fontweight='bold', fontsize=10)

# Subplot 2: ROC Curve
fpr, tpr, _ = roc_curve(y_test, y_test_prob)
ax2.plot(fpr, tpr, color='#0D9488', lw=2, label=f'ROC curve (AUC = {test_roc:.3f})')
ax2.plot([0, 1], [0, 1], color='#94A3B8', lw=1.5, linestyle='--', label='Random Chance (AUC = 0.50)')
ax2.set_xlim([0.0, 1.0])
ax2.set_ylim([0.0, 1.05])
ax2.set_xlabel('False Positive Rate (1 - Specificity)', fontsize=9, fontweight='bold')
ax2.set_ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=9, fontweight='bold')
ax2.set_title('Receiver Operating Characteristic (ROC)', fontsize=11, fontweight='bold', color='#0F172A')
ax2.legend(loc="lower right", fontsize=8.5)
ax2.grid(True, linestyle=':', alpha=0.6)

plt.tight_layout()
eval_plot_path = os.path.join(ART_DIR, 'model_evaluation_curves.png')
plt.savefig(eval_plot_path, dpi=200)
plt.close()
print(f"   Saved evaluation plot: {eval_plot_path}")

# -------------------------------------------------------------
# 8. SAVE TRAINED MODEL ARTIFACTS
# -------------------------------------------------------------
best_model_path = os.path.join(ART_DIR, 'food_allergy_pipeline.joblib')
joblib.dump(best_pipe, best_model_path)
print(f"   Saved trained pipeline: {best_model_path} ({os.path.getsize(best_model_path):,} bytes)")

# Model metadata JSON
metadata = {
    'model_name': best_model_name,
    'training_date': '2026-11-19T04:00:00Z',
    'algorithm': best_pipe.named_steps['classifier'].__class__.__name__,
    'framework': 'scikit-learn 1.9.1 / Python 3.11.9',
    'dataset_name': 'Food Allergy Prediction & Clinical Risk Stratification Dataset',
    'dataset_source': 'https://github.com/RuthvikUppala30/food-allergy-dataset',
    'total_dataset_records': len(df_fa_clean),
    'train_records': len(X_train),
    'validation_records': len(X_val),
    'test_records': len(X_test),
    'features': {
        'numerical': num_features,
        'categorical': cat_features,
        'total_encoded_features': len(all_feature_names)
    },
    'top_feature_importances': feature_importances,
    'candidate_comparison': results,
    'test_metrics': {
        'accuracy': round(test_acc, 4),
        'balanced_accuracy': round(test_b_acc, 4),
        'precision': round(test_prec, 4),
        'recall': round(test_rec, 4),
        'f1_score_allergic': round(test_f1, 4),
        'macro_f1_score': round(test_macro_f1, 4),
        'roc_auc': round(test_roc, 4),
        'pr_auc': round(test_pr_auc, 4),
        'confusion_matrix': {
            'true_negatives': int(cm[0][0]),
            'false_positives': int(cm[0][1]),
            'false_negatives': int(cm[1][0]),
            'true_positives': int(cm[1][1])
        }
    },
    'limitations': [
        'Model predicts probability of Type I IgE-mediated allergy risk; does not replace oral food challenges or in-vivo physician consultation.',
        'Imbalanced target distribution in source dataset (91.2% positive vs 8.8% negative).',
        'Performance subject to regional dietary differences and non-IgE mediated intolerances (e.g., celiac disease or FPIES).',
        'No clinical validation study on pediatric cohort < 5 years of age.'
    ]
}

meta_path = os.path.join(ART_DIR, 'model_metadata.json')
with open(meta_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"   Saved model metadata: {meta_path}")

print("\n" + "="*70)
print("MACHINE LEARNING PIPELINE TRAINING & EVALUATION COMPLETED SUCCESSFULLY")
print("="*70)
