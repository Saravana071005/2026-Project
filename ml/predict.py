import sys
import os
import json
import joblib
import pandas as pd

BASE_DIR = r'C:\Users\Admin\.gemini\antigravity-ide\scratch\food-allergy-detection-system'
MODEL_PATH = os.path.join(BASE_DIR, 'ml', 'artifacts', 'food_allergy_pipeline.joblib')

def main():
    raw_input = None
    if len(sys.argv) > 1 and sys.argv[1].strip():
        raw_input = sys.argv[1]
    else:
        raw_input = sys.stdin.read().strip()

    if not raw_input:
        print(json.dumps({'error': 'No input JSON provided via argv or stdin'}))
        sys.exit(1)

    try:
        input_data = json.loads(raw_input)
    except Exception as e:
        # Try unescaping quotes if passed from shell
        try:
            cleaned = raw_input.replace('\\"', '"').replace("'", '"')
            input_data = json.loads(cleaned)
        except Exception:
            print(json.dumps({'error': f'Invalid JSON input: {str(e)}'}))
            sys.exit(1)

    try:
        pipeline = joblib.load(MODEL_PATH)
    except Exception as e:
        print(json.dumps({'error': f'Failed to load trained model artifact: {str(e)}'}))
        sys.exit(1)

    # Format into DataFrame with expected columns
    # Expected: Age, Food_Frequency, IgE_Levels, Severity_Score, Gender, Family_History, Previous_Reaction, Symptoms, Food_Type, Medical_Conditions
    row = {
        'Age': float(input_data.get('age', input_data.get('Age', 35))),
        'Food_Frequency': float(input_data.get('food_frequency', input_data.get('Food_Frequency', 10))),
        'IgE_Levels': float(input_data.get('ige_levels', input_data.get('IgE_Levels', 150.0))),
        'Severity_Score': float(input_data.get('severity_score', input_data.get('Severity_Score', 3))),
        'Gender': str(input_data.get('gender', input_data.get('Gender', 'Female'))),
        'Family_History': str(input_data.get('family_history', input_data.get('Family_History', 'No'))),
        'Previous_Reaction': str(input_data.get('previous_reaction', input_data.get('Previous_Reaction', 'None'))),
        'Symptoms': str(input_data.get('symptoms', input_data.get('Symptoms', 'Skin rash'))),
        'Food_Type': str(input_data.get('food_type', input_data.get('Food_Type', 'Peanuts'))),
        'Medical_Conditions': str(input_data.get('medical_conditions', input_data.get('Medical_Conditions', 'None')))
    }

    df_in = pd.DataFrame([row])
    
    # Run prediction
    pred = pipeline.predict(df_in)[0]
    prob = pipeline.predict_proba(df_in)[0]

    allergic_prob = float(prob[1]) if len(prob) > 1 else float(pred)
    non_allergic_prob = float(prob[0]) if len(prob) > 1 else (1.0 - allergic_prob)

    risk_level = 'High Risk' if allergic_prob >= 0.70 else ('Moderate Risk' if allergic_prob >= 0.35 else 'Low Risk')

    output = {
        'success': True,
        'prediction': int(pred),
        'prediction_label': 'Allergic (Clinical Sensitization & Reaction Likelihood)' if pred == 1 else 'Non-Allergic (Tolerance / Minimal Risk)',
        'probability_allergic': round(allergic_prob, 4),
        'probability_non_allergic': round(non_allergic_prob, 4),
        'risk_level': risk_level,
        'model_used': 'RandomForestClassifier (200 estimators, balanced)',
        'input_features': row,
        'clinical_note': 'Statistical risk indicator based on dataset-trained model. Not a definitive medical diagnosis.'
    }

    print(json.dumps(output))

if __name__ == '__main__':
    main()
