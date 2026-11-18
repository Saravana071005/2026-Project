import os
import sys
import json
import time
import urllib.request
import hashlib
import pandas as pd

BASE_DIR = r'C:\Users\Admin\.gemini\antigravity-ide\scratch\food-allergy-detection-system'
ORIG_DIR = os.path.join(BASE_DIR, 'data', 'original')
os.makedirs(ORIG_DIR, exist_ok=True)

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

print("="*60)
print("STAGE 1: COLLECTING REAL DATASETS")
print("="*60)

# 1. RuthvikUppala30 Food Allergy Dataset
url_ruthvik = 'https://raw.githubusercontent.com/RuthvikUppala30/food-allergy-dataset/main/food_allergy_dataset.csv'
path_ruthvik = os.path.join(ORIG_DIR, 'food_allergy_dataset.csv')
print(f"1. Downloading Food Allergy Dataset from {url_ruthvik}...")
req = urllib.request.Request(url_ruthvik, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as resp:
    data = resp.read()
with open(path_ruthvik, 'wb') as f:
    f.write(data)

df_ruthvik = pd.read_csv(path_ruthvik)
print(f"   -> Saved: {path_ruthvik}")
print(f"   -> Records: {len(df_ruthvik):,}, Columns: {len(df_ruthvik.columns)}, Size: {os.path.getsize(path_ruthvik):,} bytes")
print(f"   -> SHA-256: {sha256_file(path_ruthvik)}")

# 2. FDA CAERS Food Adverse Allergic Reaction Events via openFDA API
print("\n2. Fetching real adverse reaction events from openFDA CAERS API...")
fda_records = []
target_records = 2500
page_size = 100
max_pages = 25

for page in range(max_pages):
    skip = page * page_size
    fda_url = f"https://api.fda.gov/food/event.json?search=reactions:ALLERGIC+OR+reactions:ANAPHYLAXIS+OR+reactions:URTICARIA+OR+reactions:SWELLING+OR+reactions:RASH&limit={page_size}&skip={skip}"
    req_fda = urllib.request.Request(fda_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req_fda, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get('results', [])
            for r in results:
                consumer = r.get('consumer', {})
                age = consumer.get('age', None)
                gender = consumer.get('gender', 'Unknown')
                prods = [p.get('name_brand') for p in r.get('products', []) if p.get('name_brand')]
                prod_str = "; ".join(prods) if prods else "Unspecified Food Product"
                reactions = r.get('reactions', [])
                reaction_str = "; ".join(reactions) if reactions else "Allergic reaction"
                outcomes = r.get('outcomes', [])
                outcome_str = "; ".join(outcomes) if outcomes else "Other Outcome"
                
                # Severe anaphylaxis indicator
                is_severe = 1 if any(o in ['Life Threatening', 'Hospitalization', 'Disability', 'Death'] for o in outcomes) or 'ANAPHYLAXIS' in reaction_str.upper() else 0

                fda_records.append({
                    'report_number': r.get('report_number'),
                    'date_created': r.get('date_created'),
                    'consumer_gender': gender,
                    'consumer_age': age,
                    'products': prod_str,
                    'reactions': reaction_str,
                    'outcomes': outcome_str,
                    'is_severe_anaphylaxis': is_severe
                })
        print(f"   -> Page {page+1}/{max_pages} fetched ({len(fda_records)} total records accumulated)")
        time.sleep(0.2)  # Respect rate limits
    except Exception as e:
        print(f"   -> Error on page {page+1}: {e}")
        break

df_fda = pd.DataFrame(fda_records)
path_fda = os.path.join(ORIG_DIR, 'fda_caers_food_allergic_reactions.csv')
df_fda.to_csv(path_fda, index=False)
print(f"   -> Saved: {path_fda}")
print(f"   -> Records: {len(df_fda):,}, Columns: {len(df_fda.columns)}, Size: {os.path.getsize(path_fda):,} bytes")
print(f"   -> SHA-256: {sha256_file(path_fda)}")

# 3. Swiss / EU Regulated Food Allergens (food-allergens-ch)
url_swiss = 'https://raw.githubusercontent.com/foodopendata/food-allergens-ch/master/data/food-allergens.csv'
path_swiss = os.path.join(ORIG_DIR, 'food_allergens_ch.csv')
print(f"\n3. Downloading Swiss/EU Regulated Food Allergens from {url_swiss}...")
req_swiss = urllib.request.Request(url_swiss, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_swiss, timeout=20) as resp:
    data = resp.read()
with open(path_swiss, 'wb') as f:
    f.write(data)

df_swiss = pd.read_csv(path_swiss)
print(f"   -> Saved: {path_swiss}")
print(f"   -> Records: {len(df_swiss):,}, Columns: {len(df_swiss.columns)}, Size: {os.path.getsize(path_swiss):,} bytes")
print(f"   -> SHA-256: {sha256_file(path_swiss)}")

print("\n" + "="*60)
print(f"DATASET COLLECTION COMPLETED.")
print(f"Total Combined Records Collected Across 3 Sources: {len(df_ruthvik) + len(df_fda) + len(df_swiss):,}")
print("="*60)
