import React, { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Utensils,
  HeartPulse,
  TrendingUp,
  Info,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export default function HealthInsightsView({
  user,
  allergies = [],
  medicalTests = [],
  foodEntries = [],
  symptoms = [],
  _dietMonitoring = null,
  patterns = null,
  onRefresh,
  onNavigateTab,
}) {
  // 1. Separate Confirmed vs Suspected Allergies
  const confirmedAllergies = useMemo(
    () => allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis'),
    [allergies]
  );
  const _suspectedAllergies = useMemo(
    () => allergies.filter((a) => a.diagnosisType !== 'Doctor-Confirmed Diagnosis'),
    [allergies]
  );

  // 2. Check for Immediate Emergency Symptoms (Predefined Safety Rules)
  const emergencySymptoms = useMemo(() => {
    const emergencyRegex =
      /\b(?:difficulty\s*breathing|trouble\s*breathing|throat\s*closing|tight\s*throat|throat\s*tightness|wheezing|anaphylaxis|swollen\s*tongue|cyanosis)\b/i;
    return symptoms.filter(
      (s) =>
        s.symptomSeverity === 'Life-Threatening / Emergency' ||
        s.symptomSeverity === 'Severe' ||
        emergencyRegex.test(s.symptomName || '') ||
        emergencyRegex.test(s.additionalNotes || '')
    );
  }, [symptoms]);

  // 3. Compute Potential Ingredient Matches against Confirmed Allergies
  const confirmedMatches = useMemo(() => {
    const matches = [];
    for (const food of foodEntries) {
      const foodName = (food.foodName || '').toLowerCase();
      const ingredients = (food.ingredients || []).map((i) => String(i).toLowerCase());

      for (const allergy of confirmedAllergies) {
        const allergen = (allergy.allergenName || '').toLowerCase();
        const isMatch =
          foodName.includes(allergen) ||
          ingredients.some((ing) => ing.includes(allergen));

        if (isMatch) {
          matches.push({
            foodName: food.foodName,
            mealType: food.mealType,
            date: food.consumptionDate,
            allergen: allergy.allergenName,
            severity: allergy.severity,
            emergencyMedication: allergy.emergencyMedication,
          });
        }
      }
    }
    return matches;
  }, [foodEntries, confirmedAllergies]);

  // 4. Extract Missing Information & Diagnostic Gaps
  const missingInformationGaps = useMemo(() => {
    const gaps = [];

    // Demographic checks
    if (!user?.dob || !user?.age) {
      gaps.push({
        id: 'missing-dob',
        title: 'Patient Date of Birth / Age Unconfirmed',
        description:
          'Your profile does not contain verified age or birth date. Age is critical for clinical threshold evaluation.',
        actionLabel: 'Update Profile',
        actionTab: 'profile',
      });
    }

    // Emergency medication check for severe allergies
    const severeWithoutMeds = confirmedAllergies.filter(
      (a) =>
        (a.severity === 'Severe' || a.severity === 'Severe / Anaphylactic Risk') &&
        !a.emergencyMedication
    );
    if (severeWithoutMeds.length > 0) {
      gaps.push({
        id: 'severe-no-meds',
        title: 'Emergency Auto-Injector Not Recorded for Severe Allergy',
        description: `Severe allergy documented for ${severeWithoutMeds.map((a) => a.allergenName).join(', ')} without documented emergency medication (e.g. EpiPen). Consult your allergist to formulate an emergency action plan.`,
        actionLabel: 'Update Allergy Plan',
        actionTab: 'allergies',
      });
    }

    // Symptom latency check
    const symptomsWithoutTime = symptoms.filter((s) => !s.symptomStartTime && !s.onsetInterval);
    if (symptomsWithoutTime.length > 0) {
      gaps.push({
        id: 'symptom-latency-gap',
        title: 'Symptom Onset Latency Missing in Recent Logs',
        description: `${symptomsWithoutTime.length} symptom record(s) lack latency interval (e.g. within 30 mins). Onset timing distinguishes immediate IgE reactions from non-IgE sensitivities.`,
        actionLabel: 'Review Symptoms',
        actionTab: 'symptoms',
      });
    }

    // Foods without ingredients
    const foodsWithoutIngredients = foodEntries.filter(
      (f) => !f.ingredients || f.ingredients.length === 0
    );
    if (foodsWithoutIngredients.length > 0) {
      gaps.push({
        id: 'food-ingredients-missing',
        title: 'Meals Logged Without Ingredient Breakdown',
        description: `${foodsWithoutIngredients.length} meal(s) logged without ingredients. Itemizing ingredients enables cross-reactivity mapping.`,
        actionLabel: 'Review Food Diary',
        actionTab: 'diary',
      });
    }

    return gaps;
  }, [user, confirmedAllergies, symptoms, foodEntries]);

  // 5. Extract Statistical Repeated Associations
  const statisticalAssociations = useMemo(() => {
    if (patterns?.detectedPatterns && Array.isArray(patterns.detectedPatterns)) {
      return patterns.detectedPatterns;
    }
    if (patterns?.repeatedAssociations && Array.isArray(patterns.repeatedAssociations)) {
      return patterns.repeatedAssociations;
    }
    return [];
  }, [patterns]);

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header Banner & Clinical Assurance Badges */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-xl p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
                Verified Clinical Rules & Statistical Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                Deterministic / Zero Hallucination
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Health Insights
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Synthesizes your recorded daily food intake, clinical allergy diagnoses, and medical lab reports
              using deterministic rules and statistical recurrence models aligned with <strong>AAAAI, EAACI, and NIAID</strong> medical guidelines.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
                <span>Refresh Insights</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Emergency Warning Banner (Predefined Rules) */}
      {/* ----------------------------------------------------------------- */}
      {emergencySymptoms.length > 0 && (
        <div className="p-5 sm:p-6 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-950 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-base text-slate-900">
                CRITICAL MEDICAL SAFETY ADVISORY: Potential Acute Reaction Detected
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Recent symptom records include potential signs of acute allergic reaction or airway compromise:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-900 font-semibold space-y-0.5 pt-1">
                {emergencySymptoms.slice(0, 3).map((es, idx) => (
                  <li key={idx}>
                    {es.symptomName} ({es.symptomSeverity}) - {new Date(es.symptomDate).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 space-y-1.5">
            <p className="font-bold">Immediate Predefined Emergency Protocol:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-800 text-[11px] leading-relaxed">
              <li>Dial emergency services (911 / 112 / local emergency dispatch) immediately.</li>
              <li>Administer your prescribed epinephrine auto-injector (EpiPen / Auvi-Q) without delay if you experience breathing difficulty, throat tightness, or dizziness.</li>
              <li>Lie down with legs elevated; if breathing is compromised, remain seated. Await emergency responders.</li>
            </ol>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 3. Key Registry Metrics Overview */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{confirmedAllergies.length}</p>
            <p className="text-xs text-slate-600 font-medium">Doctor-Confirmed Allergies</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{medicalTests.length}</p>
            <p className="text-xs text-slate-600 font-medium">Diagnostic Lab Tests</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{foodEntries.length}</p>
            <p className="text-xs text-slate-600 font-medium">Meals Logged in Diary</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{symptoms.length}</p>
            <p className="text-xs text-slate-600 font-medium">Reported Symptoms</p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Potential Ingredient & Allergen Matches (Database Matches) */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Doctor-Confirmed Allergies & Ingredient Cross-Matches
              </h3>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                Database Match
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cross-references ingredients in your food diary against confirmed allergens requiring strict clinical avoidance
            </p>
          </div>
        </div>

        {confirmedAllergies.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No Doctor-Confirmed Allergies Documented</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              If your physician has diagnosed you with a specific food allergy, record it in the Food Allergies section to activate real-time ingredient warnings.
            </p>
          </div>
        ) : confirmedMatches.length > 0 ? (
          <div className="space-y-3">
            {confirmedMatches.map((match, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{match.foodName}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 text-[10px] font-bold">
                      Matched Allergen: {match.allergen}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Consumed: {match.date ? new Date(match.date).toLocaleDateString() : 'Recent log'} ({match.mealType || 'Meal'}) • Severity: {match.severity || 'High Risk'}
                  </p>
                  {match.emergencyMedication && (
                    <p className="text-[11px] text-slate-700 font-semibold">
                      Prescribed Action: Strict avoidance. Emergency Auto-Injector: {match.emergencyMedication}
                    </p>
                  )}
                </div>

                <div className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 shrink-0 self-start sm:self-center">
                  Strict Avoidance Rule
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-slate-800 shrink-0" />
            <p className="text-xs text-slate-800">
              <strong>All Clear:</strong> None of your recently recorded food entries match your doctor-confirmed allergens ({confirmedAllergies.map((a) => a.allergenName).join(', ')}). Continue reading food packaging labels for hidden ingredients.
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Immunological Sensitization Findings vs Clinical Allergy (Lab Data) */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Medical Diagnostic Test Findings (Sensitization vs Clinical Allergy)
              </h3>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                Lab Diagnostic Data
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Laboratory Specific IgE (sIgE) titers, Skin Prick Test (SPT) wheals, and Component-Resolved Diagnostics
            </p>
          </div>
        </div>

        {/* Clinical Principle Notice Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Info className="w-4 h-4 text-slate-700 shrink-0" />
            <span>Core Clinical Principle (AAAAI & EAACI): Sensitization ≠ Clinical Allergy</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Immunological sensitization means allergen-specific antibodies are present. However, true clinical allergy requires reproducible adverse symptoms upon ingestion. Positive test findings alone must <strong>never</strong> trigger needless dietary elimination without formal physician consultation.
          </p>
        </div>

        {medicalTests.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No Laboratory Test Records Documented</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload your laboratory PDF or photo reports in the Documents section. Intelligent OCR will extract test modalities, units, and interpretations automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {medicalTests.slice(0, 6).map((test, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 space-y-1 shadow-2xs"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-xs text-slate-900">{test.allergenName}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      test.isDoctorConfirmedDiagnosis
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {test.isDoctorConfirmedDiagnosis ? 'Doctor Confirmed' : 'Sensitization Only'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900">
                  {test.testType}: {test.testResult} {test.units || ''}
                </p>
                {test.interpretation && (
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Interpretation: {test.interpretation}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 pt-1">
                  Test Date: {test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Historical Food-Symptom Statistical Associations (Pattern Analysis) */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                3. Historical Food-Symptom Statistical Associations
              </h3>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                Statistical Recurrence Model
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluates repeated temporal correlations between specific food consumption and adverse symptom episodes
            </p>
          </div>
        </div>

        {statisticalAssociations.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 text-center space-y-2">
            <TrendingUp className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No Repeated Food-Symptom Patterns Identified</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Continue logging your daily meals and adverse symptoms. Statistical pattern detection highlights foods that consistently co-occur with symptoms on 2 or more occasions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {statisticalAssociations.map((pattern, idx) => {
              const isRepeated = (pattern.occurrences || pattern.count || 1) >= 2;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {pattern.foodName} → {pattern.symptomName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-900">
                        {isRepeated ? `Repeated (${pattern.occurrences || pattern.count}x)` : 'Single Co-occurrence'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isRepeated
                        ? 'Flagged for Physician Review: This food-symptom pair has occurred on multiple recorded occasions. Temporal correlation warrants formal diagnostic evaluation by an allergist.'
                        : 'Single temporal association documented. May represent coincidence, culinary additives, or non-allergic factors.'}
                    </p>
                  </div>

                  <div className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 shrink-0">
                    {isRepeated ? 'Needs Doctor Review' : 'Monitoring'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-slate-500 italic pt-1">
          *Statistical Note: Co-occurrence indicates chronological association, not confirmed medical causation. Do not attempt unguided elimination diets or home food challenges.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Clinical Missing Information Checklist */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                4. Medical Profile Completeness & Clinical Missing Information
              </h3>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                Quality Audit
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Identifies data gaps in your medical profile to ensure maximum clinical safety and accurate physician reviews
            </p>
          </div>
        </div>

        {missingInformationGaps.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />
            <p className="text-xs text-slate-800">
              <strong>High Quality Data:</strong> Your food logs contain ingredient details, symptoms include onset timings, and severe allergy records include emergency injector instructions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {missingInformationGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                    <span className="font-bold text-xs text-slate-900">{gap.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{gap.description}</p>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(gap.actionTab)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
                  >
                    <span>{gap.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 8. Physician Consultation Guidelines & Safety Principles */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-6 rounded-xl bg-slate-900 text-white shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">
              Physician Consultation & Medical Safety Standards
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Protocols established by the American Academy of Allergy, Asthma & Immunology (AAAAI) and the European Academy of Allergy and Clinical Immunology (EAACI)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-200 pt-2">
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-bold text-white block">No Automated Diagnoses:</span>
            <p className="text-slate-300">
              This platform provides deterministic record management and statistical pattern detection. It does not provide automated medical diagnoses or prescribe medications. Definitive allergy diagnosis requires comprehensive in-person evaluation by a board-certified allergist.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-bold text-white block">Avoid Home Challenge Trials:</span>
            <p className="text-slate-300">
              Never deliberately ingest a suspected food at home to "test" for allergic reactivity. Oral Food Challenges (OFC) must only be conducted under the direct supervision of an allergist in an emergency-equipped clinical setting.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-bold text-white block">Wheat Allergy vs Celiac Disease:</span>
            <p className="text-slate-300">
              IgE-mediated wheat allergy involves rapid histamine and mast cell release (hives, breathing difficulty). Celiac disease is an autoimmune enteropathy causing intestinal villous atrophy upon gluten ingestion. They require distinct medical management.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-bold text-white block">Preparation for Your Allergist Visit:</span>
            <p className="text-slate-300">
              Bring your complete Daily Food Diary logs, photographed skin reactions, and extracted medical lab reports. Document exact latency between ingestion and symptoms to assist your physician.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
