/**
 * Clinical Medical Knowledge Retrieval Layer for Food Allergy & Diet Monitoring
 * Sourced from international guidelines: AAAAI, EAACI, NIAID (National Institute of Allergy and Infectious Diseases).
 * Kept strictly separate from individual patient records.
 */

export const CLINICAL_KNOWLEDGE_BASE = {
  version: '2026.1',
  guidelineSources: [
    'AAAAI/ACAAI Practice Parameter: Food Allergy: A practice parameter update',
    'EAACI Guidelines: Food allergy and anaphylaxis management',
    'NIAID Guidelines for the Diagnosis and Management of Food Allergy in the United States',
  ],

  // 1. Fundamental Immunology Distinction
  sensitizationVsAllergy: {
    title: 'Sensitization vs. Clinical Allergy',
    summary:
      'Sensitization indicates the biological presence of allergen-specific IgE antibodies (detected via blood sIgE or skin prick testing). It does NOT equate to clinical food allergy. A clinical food allergy is diagnosed only when ingestion of the food reproducibly elicits objective clinical symptoms.',
    rule: 'Never treat an unconfirmed laboratory finding or positive sensitization test as a confirmed food allergy without clinical correlation or a physician diagnosis.',
  },

  // 2. Specific IgE and Skin Prick Test Guidance
  diagnosticTesting: {
    specificIgE: {
      modality: 'Specific IgE (sIgE) Blood Test',
      units: 'kUA/L',
      cutoffs: {
        analyticalDetection: 0.1,
        conventionalPositive: 0.35,
      },
      interpretation:
        'Higher sIgE titers correlate with an increased statistical probability of clinical reaction upon ingestion, but do NOT reliably predict the severity of a future reaction.',
    },
    skinPrickTest: {
      modality: 'Skin Prick Test (SPT)',
      units: 'mm wheal diameter',
      standardCriteria:
        'A wheal >= 3 mm greater than the negative saline control at 15 minutes indicates cutaneous sensitization, provided the negative control is 0 mm and histamine positive control is >= 3 mm.',
      interpretation:
        'Positive SPT indicates mast cell sensitization; clinical relevance must be evaluated in conjunction with medical history.',
    },
    totalSerumIgE: {
      modality: 'Total Serum IgE',
      units: 'kU/L or IU/mL',
      caveat:
        'Total IgE measures overall circulating IgE antibodies and does NOT identify which specific foods cause symptoms. Normal Total IgE does not exclude food allergy.',
    },
    crd: {
      modality: 'Component-Resolved Diagnostics (CRD)',
      significance:
        'Differentiates genuine primary food allergies from cross-reactive pollen-food allergy syndromes. Storage proteins (e.g., Ara h 2 in peanut, Cor a 14 in hazelnut, Bos d 8 casein in milk) carry higher systemic reaction risks than heat-labile PR-10 proteins (e.g., Bet v 1, Ara h 8).',
    },
    oralFoodChallenge: {
      modality: 'Oral Food Challenge (OFC)',
      significance:
        'The gold standard for diagnosing or ruling out food allergy. Involves incremental supervised ingestion in a resuscitation-ready clinical facility.',
    },
  },

  // 3. Wheat Allergy vs Celiac Disease vs Gluten Sensitivity
  wheatConditions: {
    wheatAllergy: {
      mechanism: 'IgE-mediated immediate hypersensitivity to wheat proteins (gliadins, glutenins, albumins, globulins).',
      onset: 'Rapid: typically 15 minutes to 2 hours after ingestion.',
      symptoms: 'Urticaria (hives), angioedema, respiratory distress, gastrointestinal distress, anaphylaxis.',
      diagnosis: 'Doctor-confirmed clinical reaction history + positive wheat sIgE or SPT; supervised challenge if indicated.',
    },
    celiacDisease: {
      mechanism: 'Autoimmune enteropathy triggered by dietary gluten in genetically predisposed individuals (HLA-DQ2/DQ8).',
      onset: 'Delayed: hours, days, or chronic ongoing intestinal mucosal damage.',
      symptoms: 'Chronic diarrhea, abdominal pain, malabsorption, nutrient deficiency, fatigue. Not anaphylactic.',
      diagnosis: 'Tissue transglutaminase IgA (tTG-IgA) antibodies and small bowel endoscopic biopsy.',
    },
    nonCeliacGlutenSensitivity: {
      mechanism: 'Non-allergic, non-autoimmune symptom manifestation following wheat/gluten consumption after celiac and wheat allergy are excluded.',
      onset: 'Variable (hours to days).',
      symptoms: 'Bloating, abdominal pain, altered bowel habits, brain fog.',
      diagnosis: 'Diagnosis of exclusion.',
    },
    differentialRule:
      'Do NOT automatically classify gluten intolerance, celiac disease, and wheat allergy as the same condition. They involve entirely different pathophysiological mechanisms.',
  },

  // 4. Common Food Allergens & Ingredient Mappings
  commonAllergens: {
    peanuts: {
      name: 'Peanuts',
      aliases: ['peanut', 'peanuts', 'groundnut', 'arachis', 'peanut butter', 'peanut oil', 'mandelonas'],
      storageProteins: ['Ara h 1', 'Ara h 2', 'Ara h 3', 'Ara h 6'],
    },
    treeNuts: {
      name: 'Tree Nuts',
      aliases: ['cashew', 'almond', 'walnut', 'hazelnut', 'pistachio', 'pecan', 'brazil nut', 'macadamia', 'pine nut'],
      storageProteins: ['Cor a 9', 'Cor a 14', 'Ana o 3', 'Jug r 1'],
    },
    milk: {
      name: 'Cow Milk & Dairy',
      aliases: ['milk', 'dairy', 'cheese', 'butter', 'paneer', 'curd', 'yogurt', 'whey', 'casein', 'cream', 'ghee'],
      keyProteins: ['Bos d 8 (Casein - heat stable)', 'Bos d 4 (Alpha-lactalbumin)', 'Bos d 5 (Beta-lactoglobulin)'],
    },
    eggs: {
      name: 'Eggs',
      aliases: ['egg', 'eggs', 'egg white', 'egg yolk', 'albumin', 'ovalbumin', 'ovomucoid', 'mayonnaise'],
      keyProteins: ['Gal d 1 (Ovomucoid - heat stable)', 'Gal d 2 (Ovalbumin)'],
    },
    wheat: {
      name: 'Wheat',
      aliases: ['wheat', 'wheat flour', 'maida', 'atta', 'dosa', 'semolina', 'suji', 'rawa', 'couscous', 'bread', 'pasta', 'gluten'],
      keyProteins: ['Tri a 19 (Omega-5 gliadin)', 'Tri a aA_TI'],
    },
    soybeans: {
      name: 'Soybeans',
      aliases: ['soy', 'soya', 'soybean', 'tofu', 'soy milk', 'edamame', 'soy sauce', 'lecithin', 'miso', 'tempeh'],
      keyProteins: ['Gly m 4', 'Gly m 5', 'Gly m 6'],
    },
    fish: {
      name: 'Fin Fish',
      aliases: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'snapper', 'anchovy', 'parvalbumin'],
      keyProteins: ['Parvalbumin (Gad m 1 - major cross-reactive fish allergen)'],
    },
    shellfish: {
      name: 'Crustacean & Molluscan Shellfish',
      aliases: ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'squid', 'octopus', 'oyster', 'clam', 'mussel', 'tropomyosin'],
      keyProteins: ['Tropomyosin (Cra a 1, Pen a 1 - heat and digestive stable)'],
    },
    sesame: {
      name: 'Sesame',
      aliases: ['sesame', 'tahini', 'sesame oil', 'sesame seed', 'til', 'gingelly'],
      keyProteins: ['Ses i 1 (2S albumin)'],
    },
  },

  // 5. Cross-Contact and Confounding Co-Factors
  confoundingFactors: [
    'Cross-contact: food prepared on shared cookware, fryers, or cutting boards may carry allergen residues without listing them.',
    'Mixed dish complexity: prepared dishes often contain undisclosed garnishes, spices, stocks, or binding flours.',
    'Exercise-induced co-factors: strenuous physical exercise within 2-4 hours of consuming a food can precipitate reactions (Food-Dependent Exercise-Induced Anaphylaxis - FDEIA, especially with wheat omega-5 gliadin).',
    'Concomitant medications: NSAIDs (ibuprofen, aspirin) or alcohol can enhance intestinal permeability and lower reaction thresholds.',
    'Infections or acute illness: can lower mast cell degranulation thresholds.',
  ],
};

/**
 * Normalizes and matches ingredient strings against known allergen categories.
 */
export function matchIngredientsToAllergens(foodName = '', ingredients = []) {
  const normalizedTargets = [
    foodName.toLowerCase(),
    ...(Array.isArray(ingredients) ? ingredients.map((i) => String(i).toLowerCase()) : []),
  ];

  const matchedAllergenCategories = [];

  for (const [categoryKey, allergenData] of Object.entries(CLINICAL_KNOWLEDGE_BASE.commonAllergens)) {
    const isMatched = allergenData.aliases.some((alias) =>
      normalizedTargets.some((target) => target.includes(alias))
    );

    if (isMatched) {
      matchedAllergenCategories.push({
        categoryKey,
        allergenName: allergenData.name,
        aliases: allergenData.aliases,
      });
    }
  }

  return matchedAllergenCategories;
}
