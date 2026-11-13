import React from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  PhoneCall,
  Printer,
} from 'lucide-react';
import { formatDate } from '../utils/ageCalculator';

export default function AIAnalysisDetailModal({ isOpen, onClose, analysis }) {
  if (!isOpen || !analysis) return null;

  const isEmergency = analysis.emergencyWarning?.isEmergency;
  const riskLevel = analysis.riskAssessment?.level || 'Moderate';

  const riskBadgeStyles = {
    Low: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Moderate: 'bg-amber-50 text-amber-800 border-amber-300',
    High: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
    'Emergency / Severe': 'bg-red-600 text-white border-red-700 font-black animate-pulse',
  };

  const associationBadgeStyles = {
    'Doctor-Confirmed Allergy Trigger': 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
    'Repeated Association (Needs Review)': 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    'Possible Association (Single Occurrence)': 'bg-blue-50 text-blue-800 border-blue-200',
    'Sensitization Match (Unconfirmed Clinical Allergy)': 'bg-purple-50 text-purple-900 border-purple-200',
    'Unlikely Association / General Reaction': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div
          className={`p-5 sm:p-6 text-white flex items-center justify-between ${
            isEmergency
              ? 'bg-gradient-to-r from-red-700 via-rose-800 to-red-900'
              : 'bg-gradient-to-r from-indigo-800 via-teal-800 to-cyan-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold">Personalized AI Food & Allergy Analysis</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/20 text-white">
                  {analysis.modelUsed || 'Clinical Analysis Engine'}
                </span>
              </div>
              <p className="text-xs text-white/80">
                Generated {formatDate(analysis.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Clinical Summary"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PROMINENT EMERGENCY WARNING BANNER */}
        {isEmergency && (
          <div className="p-4 sm:p-5 bg-red-600 text-white flex items-start gap-3.5 shadow-inner">
            <PhoneCall className="w-6 h-6 text-white shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs space-y-1.5 flex-1">
              <p className="font-black text-sm uppercase tracking-wider">
                CRITICAL EMERGENCY WARNING
              </p>
              <p className="leading-relaxed font-semibold">
                {analysis.emergencyWarning.message}
              </p>
              <div className="p-3 bg-red-800/80 rounded-xl text-xs leading-relaxed whitespace-pre-line font-medium border border-red-500">
                {analysis.emergencyWarning.actionPlan}
              </div>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-800">
          {/* Section 1: Food Consumption Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Food Consumption Summary
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {analysis.foodConsumptionSummary}
            </p>
          </div>

          {/* Section 2: Relevant Medical Profile Information */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
              2. Relevant Medical Profile Context
            </span>
            <p className="text-xs text-teal-950 leading-relaxed font-medium">
              {analysis.relevantMedicalProfile}
            </p>
          </div>

          {/* Section 3: Detected Food and Symptom Associations */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              3. Detected Food & Symptom Associations
            </span>
            {analysis.detectedAssociations && analysis.detectedAssociations.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {analysis.detectedAssociations.map((assoc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {assoc.foodName} ↔ {assoc.symptomName}
                      </h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] border ${
                          associationBadgeStyles[assoc.associationStrength] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {assoc.associationStrength}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{assoc.rationale}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No acute food-symptom associations identified for this event.
              </p>
            )}
          </div>

          {/* Section 4: Possible Explanations */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              4. Possible Medical & Nutritional Explanations
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              {analysis.possibleExplanations && analysis.possibleExplanations.length > 0 ? (
                analysis.possibleExplanations.map((exp, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                    <p className="text-xs text-slate-700 leading-relaxed">{exp}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No specific explanations generated.</p>
              )}
            </div>
          </div>

          {/* Section 5: Risk Assessment with Supporting Reasons */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                5. Risk Assessment & Clinical Reasons
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  riskBadgeStyles[riskLevel] || 'bg-slate-100 text-slate-800'
                }`}
              >
                Risk Level: {riskLevel}
              </span>
            </div>
            <ul className="space-y-1.5 pt-1">
              {(analysis.riskAssessment?.supportingReasons || []).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 6: Missing Information or Uncertainties */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              6. Missing Information & Confounding Factors
            </span>
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1 text-amber-950">
              {(analysis.missingInformation || []).map((item, idx) => (
                <p key={idx} className="text-xs leading-relaxed">
                  • {item}
                </p>
              ))}
            </div>
          </div>

          {/* Section 7: Safe Next Steps */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              7. Safe Precautionary Next Steps
            </span>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5 text-emerald-950">
              {(analysis.safeNextSteps || []).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Medical Consultation Recommendation */}
          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-cyan-950">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">8. Medical Consultation Recommended:</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-200 text-cyan-900 font-bold text-[10px]">
                  {analysis.medicalConsultationRecommended?.urgency || 'Routine Follow-up'}
                </span>
              </div>
              <p className="leading-relaxed">
                {analysis.medicalConsultationRecommended?.rationale ||
                  'Consult your primary care physician or a board-certified allergist for formal diagnosis.'}
              </p>
            </div>
          </div>

          {/* Footer Clinical Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-500 leading-relaxed border border-slate-200">
            <strong>Clinical Safety Disclaimer:</strong> This automated analysis provides decision support and dietary correlation observations based on AAAAI and EAACI guidelines. It does not provide medical diagnoses or replace direct consultation with a licensed physician.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
