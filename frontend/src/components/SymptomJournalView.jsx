import React, { useState, useMemo } from 'react';
import {
  Activity,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Utensils,
  Filter,
  Search,
  AlertOctagon,
} from 'lucide-react';
import { formatDate } from '../utils/ageCalculator';

const SEVERITY_BADGES = {
  Mild: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  Severe: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
  'Life-Threatening / Emergency':
    'bg-red-600 text-white border-red-700 font-black animate-pulse shadow-sm',
};

const CATEGORY_ICONS = {
  Skin: '🎨',
  Digestive: '🥣',
  Respiratory: '🫁',
  'Systemic / Other': '⚡',
};

export default function SymptomJournalView({
  symptoms = [],
  onOpenAddModal,
  onOpenEditModal,
  onDeleteEntry,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Summary counts
  const severeCount = symptoms.filter(
    (s) =>
      s.symptomSeverity === 'Severe' ||
      s.symptomSeverity === 'Life-Threatening / Emergency' ||
      s.isEmergencyAlertTriggered
  ).length;

  const linkedFoodCount = symptoms.filter((s) => s.foodConsumed).length;

  // Filtered Symptoms
  const filteredSymptoms = useMemo(() => {
    return symptoms.filter((item) => {
      const term = searchTerm.toLowerCase();
      const nameMatch = item.symptomName?.toLowerCase().includes(term);
      const catMatch = item.symptomCategory?.toLowerCase().includes(term);
      const foodMatch = item.foodConsumed?.toLowerCase().includes(term);
      const treatMatch = item.treatmentTaken?.toLowerCase().includes(term);
      const addMatch = (item.additionalSymptoms || []).some((sym) =>
        sym.toLowerCase().includes(term)
      );
      const matchesSearch = !searchTerm || nameMatch || catMatch || foodMatch || treatMatch || addMatch;

      const matchesCat = categoryFilter === 'ALL' || item.symptomCategory === categoryFilter;
      const matchesSev = severityFilter === 'ALL' || item.symptomSeverity === severityFilter;

      return matchesSearch && matchesCat && matchesSev;
    });
  }, [symptoms, searchTerm, categoryFilter, severityFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" />
            <span>Symptom & Adverse Reaction Journal</span>
          </h3>
          <p className="text-xs text-slate-500">
            Log physical reactions, onset timing, severity, and treatments (with or without known food)
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold hover:from-rose-700 hover:to-pink-700 shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Symptom / Reaction</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Symptoms Logged
          </span>
          <span className="text-xl font-extrabold text-slate-900">{symptoms.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Physical episodes</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Severe / Red Flags
          </span>
          <span className="text-xl font-extrabold text-rose-600">{severeCount}</span>
          <span className="text-[10px] text-rose-700 block mt-0.5">High-priority care</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Linked to Foods
          </span>
          <span className="text-xl font-extrabold text-teal-700">{linkedFoodCount}</span>
          <span className="text-[10px] text-teal-600 block mt-0.5">Suspect meals known</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Filter Matches
          </span>
          <span className="text-xl font-extrabold text-slate-800">{filteredSymptoms.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Episodes displayed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symptom, suspect food, medication, or reaction notes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Skin">Skin (Urticaria, Rash, Angioedema)</option>
              <option value="Digestive">Digestive (Pain, Nausea, Vomiting)</option>
              <option value="Respiratory">Respiratory (Wheezing, Dyspnea)</option>
              <option value="Systemic / Other">Systemic (Dizziness, Hypotension)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Severities</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Life-Threatening / Emergency">Life-Threatening / Emergency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Symptom Cards Grid */}
      {filteredSymptoms.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">No Symptoms Logged</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchTerm || categoryFilter !== 'ALL' || severityFilter !== 'ALL'
                ? 'No symptom records match your search filters.'
                : 'Whenever you experience itching, wheezing, stomach cramps, or other reactions, record them here to monitor patterns.'}
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Symptom</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSymptoms.map((record) => {
            const isSevere =
              record.symptomSeverity === 'Severe' ||
              record.symptomSeverity === 'Life-Threatening / Emergency' ||
              record.isEmergencyAlertTriggered;

            const severityClass =
              SEVERITY_BADGES[record.symptomSeverity] ||
              'bg-slate-100 text-slate-800 border-slate-200';

            const catEmoji = CATEGORY_ICONS[record.symptomCategory] || '🩺';

            return (
              <div
                key={record._id}
                className={`p-5 rounded-2xl bg-white border transition-shadow hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isSevere ? 'border-rose-300 shadow-sm' : 'border-slate-200 shadow-2xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Top: Symptom Name & Severity */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base" role="img" aria-label="category">
                          {catEmoji}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          {record.symptomName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {record.symptomCategory}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Onset Interval: <strong>{record.onsetInterval || 'Not specified'}</strong>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${severityClass}`}
                    >
                      {record.symptomSeverity}
                    </span>
                  </div>

                  {/* Emergency Indicator Banner */}
                  {record.isEmergencyAlertTriggered && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2">
                      <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block text-red-950">
                          Emergency Anaphylaxis Red Flag:
                        </span>
                        <span className="text-[11px] text-red-800">
                          {record.emergencyAlertDetails ||
                            'Severe symptom or multi-system involvement detected. Seek immediate emergency medical care.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Timing & Date */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      {formatDate(record.symptomDate)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      Started at {record.symptomStartTime || 'N/A'}
                    </span>
                    {record.symptomDuration && (
                      <>
                        <span>•</span>
                        <span className="text-slate-500">
                          Duration: <strong>{record.symptomDuration}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Suspected Food Card */}
                  <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-teal-600" />
                      Suspected Food / Meal:
                    </span>
                    {record.foodConsumed ? (
                      <span className="font-bold text-teal-950 text-sm">
                        {record.foodConsumed}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">
                        No specific food identified (symptom reported independently)
                      </span>
                    )}
                  </div>

                  {/* Concurrent Symptoms */}
                  {record.additionalSymptoms && record.additionalSymptoms.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Concurrent Symptoms ({record.additionalSymptoms.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {record.additionalSymptoms.map((sym, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200"
                          >
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Treatment & Care Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {record.treatmentTaken && record.treatmentTaken !== 'None' && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Treatment Administered
                        </span>
                        <span className="font-semibold">{record.treatmentTaken}</span>
                      </div>
                    )}

                    {record.medicalAttentionRequired && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                        <span className="text-[10px] font-bold text-amber-700 uppercase block">
                          Medical Attention
                        </span>
                        <span className="font-semibold">
                          {record.medicalFacilityVisited || 'Doctor / ER Consulted'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Notes */}
                  {record.additionalNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Patient Notes: </span>
                      {record.additionalNotes}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onOpenEditModal(record)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Edit symptom record"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteEntry(record)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete symptom record"
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
  );
}
