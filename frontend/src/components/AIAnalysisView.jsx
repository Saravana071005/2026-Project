import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  Trash2,
  RefreshCw,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { formatDate } from '../utils/ageCalculator';

const RISK_BADGES = {
  Low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  High: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
  'Emergency / Severe':
    'bg-red-600 text-white border-red-700 font-black animate-pulse shadow-sm',
};

export default function AIAnalysisView({
  analyses = [],
  dietMonitoring = null,
  onRunAnalysis,
  onOpenDetailModal,
  onDeleteAnalysis,
  loading = false,
}) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRunAnalysis(customPrompt);
      setCustomPrompt('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const flaggedDietEvals = dietMonitoring?.evaluations?.filter((e) => e.alerts?.length > 0) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>AI-Powered Food Allergy & Diet Monitoring</span>
          </h3>
          <p className="text-xs text-slate-500">
            Synthesizes medical history, laboratory tests, diet logs, and reported symptoms with clinical safety guardrails
          </p>
        </div>
      </div>

      {/* Action Card: Generate New AI Analysis */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-teal-900 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur">
              Personalized Clinical AI Engine
            </span>
            <h4 className="text-xl font-black text-white">
              Request Comprehensive Allergy & Diet Assessment
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Analyzes logged meals, symptom timestamps, and laboratory sensitization to produce a standardized 9-part clinical assessment.
              <strong> Zero-latency emergency triage is automatically enforced.</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: Ask a specific question (e.g., 'Analyze my reaction after eating wheat dosa today' or 'Compare my symptoms against my lab test results'). Leave blank for general analysis."
              className="w-full p-3.5 pr-10 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 backdrop-blur"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-teal-200">
              <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
              <span>Multi-provider fallback active (Gemini / OpenAI / Clinical Rule Engine)</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting || loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Run Personalized Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Diet Monitoring Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Active Diet Safety & Allergen Monitoring</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            {dietMonitoring?.summary?.totalEvaluations || 0} Meals Monitored
          </span>
        </div>

        {flaggedDietEvals.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">No High-Risk Allergen Conflicts Detected in Recent Meals</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                All logged foods comply with your confirmed allergies and medical restrictions.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flaggedDietEvals.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-amber-950">{item.foodName}</span>
                  <span className="text-[10px] text-slate-500">
                    {formatDate(item.consumptionDate)}
                  </span>
                </div>
                <div className="space-y-1">
                  {item.alerts.map((alt, aIdx) => (
                    <div
                      key={aIdx}
                      className="p-2 rounded-xl bg-white/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{alt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past AI Reports List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Previous Clinical Analysis Reports ({analyses.length})</span>
          </h4>
        </div>

        {analyses.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-sm">No Previous AI Analyses</h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Click &quot;Run Personalized Analysis&quot; above to synthesize your medical profile, logged foods, and symptoms.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((report) => {
              const riskLevel = report.riskAssessment?.level || 'Moderate';
              const riskClass =
                RISK_BADGES[riskLevel] || 'bg-slate-100 text-slate-800 border-slate-200';
              const isEmergency = report.emergencyWarning?.isEmergency;

              return (
                <div
                  key={report._id}
                  className={`p-5 rounded-2xl bg-white border transition-shadow hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isEmergency
                      ? 'border-red-400 shadow-sm'
                      : 'border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskClass}`}
                      >
                        Risk Level: {riskLevel}
                      </span>
                      {isEmergency && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white flex items-center gap-1 animate-pulse">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Emergency Red Flag
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <h5 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {report.executiveSummary?.assessmentTitle || 'Food Allergy & Diet Clinical Analysis'}
                    </h5>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {report.executiveSummary?.briefSummary ||
                        'Comprehensive evaluation of user meals, allergens, sensitization tests, and adverse symptoms.'}
                    </p>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        Foods: <strong>{report.foodEntriesAnalyzed?.length || 0}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Symptoms: <strong>{report.symptomsAnalyzed?.length || 0}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Model:{' '}
                        <strong className="text-slate-700 capitalize">
                          {report.modelUsed || report.aiProvider || 'Clinical Rule Engine'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => onOpenDetailModal(report)}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors flex items-center gap-1.5 border border-indigo-200 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>View Full 9-Part Report</span>
                    </button>

                    <button
                      onClick={() => onDeleteAnalysis(report)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete analysis record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
