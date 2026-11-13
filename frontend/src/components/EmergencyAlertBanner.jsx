import React from 'react';
import {
  AlertOctagon,
  PhoneCall,
  ArrowRight,
  HeartPulse,
} from 'lucide-react';

export default function EmergencyAlertBanner({
  emergencySymptoms = [],
  emergencyAnalyses = [],
  onNavigateToSymptoms,
}) {
  const hasEmergencySymptom = emergencySymptoms.length > 0;
  const hasEmergencyAnalysis = emergencyAnalyses.length > 0;

  if (!hasEmergencySymptom && !hasEmergencyAnalysis) {
    return null;
  }

  const triggeringReasons = [
    ...emergencySymptoms.map(
      (s) =>
        `${s.symptomName} (${s.symptomSeverity}) - Onset: ${s.onsetInterval || 'Rapid'}`
    ),
    ...emergencyAnalyses
      .filter((a) => a.emergencyWarning?.isEmergency)
      .map((a) => a.emergencyWarning?.reason || 'Severe reaction risk identified in AI analysis'),
  ];

  return (
    <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 sm:p-6 shadow-2xl border-2 border-red-400/80 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
      {/* Decorative pulsing backdrop element */}
      <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none animate-pulse" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur border border-white/40 flex items-center justify-center shrink-0 shadow-inner">
            <AlertOctagon className="w-7 h-7 text-white animate-bounce" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white text-red-700 font-black text-xs uppercase tracking-wider shadow-xs">
                Emergency Medical Alert
              </span>
              <span className="text-xs font-semibold text-red-100 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5" />
                Immediate Action Advised
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Potential Anaphylaxis / Severe Allergic Reaction Detected
            </h3>

            <p className="text-xs sm:text-sm text-red-50 leading-relaxed max-w-3xl">
              If experiencing respiratory difficulty, throat tightness, tongue swelling, or dizziness:
              <strong> Administer prescribed Epinephrine (EpiPen / Auvi-Q) immediately</strong> and call emergency medical services.
              <strong> Do NOT delay emergency care while waiting for AI analysis or symptom improvement.</strong>
            </p>

            {/* Triggering Symptoms List */}
            {triggeringReasons.length > 0 && (
              <div className="pt-1.5 flex flex-wrap gap-1.5">
                <span className="text-[11px] font-bold text-red-200">Triggering Event:</span>
                {triggeringReasons.slice(0, 3).map((reason, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-black/25 text-white text-[11px] font-mono border border-white/20"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <a
            href="tel:911"
            className="px-5 py-3 rounded-2xl bg-white text-red-700 hover:bg-red-50 text-xs sm:text-sm font-extrabold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>Call 911 / 112</span>
          </a>

          {onNavigateToSymptoms && (
            <button
              onClick={onNavigateToSymptoms}
              className="px-4 py-3 rounded-2xl bg-red-800/80 hover:bg-red-800 text-white text-xs font-bold border border-red-300/40 transition-colors flex items-center gap-1.5"
            >
              <span>View Reaction Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
