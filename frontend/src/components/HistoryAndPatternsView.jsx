import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Utensils,
  Calendar,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { formatDate } from '../utils/ageCalculator';

export default function HistoryAndPatternsView({
  patterns = null,
  foodEntries = [],
  symptoms = [],
  _allergies = [],
  _medicalTests = [],
}) {
  const [timelineFilter, setTimelineFilter] = useState('ALL'); // 'ALL' | 'FOOD' | 'SYMPTOM'

  const repeatedList = patterns?.repeatedAssociations || [];

  // Build unified chronological timeline
  const timelineEvents = useMemo(() => {
    const list = [];

    foodEntries.forEach((food) => {
      list.push({
        type: 'food',
        id: food._id,
        date: food.consumptionDate,
        time: food.consumptionTime || '00:00',
        title: food.foodName,
        subtitle: `${food.mealType} • ${food.quantity} ${food.measurementUnit}`,
        category: food.foodCategory,
        ingredients: food.ingredients,
        alerts: food.dietaryAlerts,
        raw: food,
      });
    });

    symptoms.forEach((sym) => {
      list.push({
        type: 'symptom',
        id: sym._id,
        date: sym.symptomDate,
        time: sym.symptomStartTime || '00:00',
        title: sym.symptomName,
        subtitle: `Severity: ${sym.symptomSeverity} • Category: ${sym.symptomCategory}`,
        category: sym.symptomCategory,
        suspectFood: sym.foodConsumed,
        onsetInterval: sym.onsetInterval,
        isEmergency: sym.isEmergencyAlertTriggered,
        raw: sym,
      });
    });

    // Sort descending by date + time
    list.sort((a, b) => {
      const dtA = new Date(`${a.date?.split('T')[0]}T${a.time || '00:00'}`);
      const dtB = new Date(`${b.date?.split('T')[0]}T${b.time || '00:00'}`);
      return dtB - dtA;
    });

    return list;
  }, [foodEntries, symptoms]);

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'ALL') return timelineEvents;
    return timelineEvents.filter((item) => item.type === timelineFilter.toLowerCase());
  }, [timelineEvents, timelineFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <span>Food & Symptom History & Statistical Pattern Analysis</span>
        </h3>
        <p className="text-xs text-slate-500">
          Discovers repeated temporal co-occurrences between ingested foods and adverse reactions without automated self-diagnosis
        </p>
      </div>

      {/* Repeated Associations Flagged for Physician Review (Occurrences >= 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Repeated Temporal Associations (Flagged for Doctor Review)</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            Threshold: Occurred &ge; 2 times
          </span>
        </div>

        {repeatedList.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-3 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">No Repeated Food-Symptom Patterns Detected</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                No single food has been repeatedly followed by the same adverse symptom on 2 or more occasions.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {repeatedList.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                      Pattern Alert • Repeated {item.occurrenceCount} Times
                    </span>
                    <h5 className="text-base font-extrabold text-amber-950">
                      {item.foodName} &rarr; {item.symptomName}
                    </h5>
                    <p className="text-xs text-amber-800">
                      Typical onset interval: <strong>{item.typicalOnset}</strong>
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 shrink-0">
                    {item.occurrenceCount} Occurrences
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/80 border border-amber-200 text-xs space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Clinical Guidance:</span>
                  </p>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    {item.clinicalNote ||
                      'Repeated correlation indicates a reproducible temporal relationship. Share this timeline with your allergist/immunologist for formal diagnostic evaluation (e.g. Skin Prick or Oral Food Challenge). Avoid self-diagnosing or unnecessarily eliminating entire food groups without medical guidance.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Context Reference Matrix */}
      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          <span>Diagnostic Interpretation Guidelines</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-teal-800 block">Doctor-Confirmed Allergy</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Diagnosed by a licensed allergist (often via oral food challenge or clinical history + sIgE). Strict avoidance & emergency action plan required.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-purple-800 block">Sensitization &ne; Allergy</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              A positive IgE or SPT result shows biological sensitization (presence of antibodies), NOT necessarily clinical allergy or reaction risk upon ingestion.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
            <span className="font-bold text-amber-800 block">Co-occurrence &ne; Causation</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Eating a food before a symptom does not prove causation. Co-ingredients, hidden spices, cross-contact, and non-allergic factors must be evaluated by a physician.
            </p>
          </div>
        </div>
      </div>

      {/* Unified Chronological Timeline */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Unified Chronological Timeline (Meals & Symptoms)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Correlates meal timestamps with symptom onset timing
            </p>
          </div>

          {/* Timeline Filter */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setTimelineFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timelineFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Events ({timelineEvents.length})
            </button>
            <button
              onClick={() => setTimelineFilter('FOOD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timelineFilter === 'FOOD'
                  ? 'bg-teal-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Meals ({foodEntries.length})
            </button>
            <button
              onClick={() => setTimelineFilter('SYMPTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timelineFilter === 'SYMPTOM'
                  ? 'bg-rose-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Symptoms ({symptoms.length})
            </button>
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-xs text-slate-500">
            No events recorded in the timeline yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredTimeline.map((item, idx) => {
              const isFood = item.type === 'food';
              return (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                      isFood ? 'bg-teal-600' : item.isEmergency ? 'bg-red-600 animate-ping' : 'bg-rose-600'
                    }`}
                  />

                  {/* Timeline Card */}
                  <div
                    className={`p-4 rounded-2xl bg-white border shadow-2xs space-y-2 transition-shadow hover:shadow-md ${
                      isFood
                        ? 'border-slate-200'
                        : item.isEmergency
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isFood
                                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isFood ? 'Meal Logged' : 'Symptom Reported'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(item.date)} at {item.time}
                          </span>
                        </div>

                        <h5 className="text-base font-extrabold text-slate-900 mt-1">
                          {item.title}
                        </h5>
                        <p className="text-xs text-slate-600">{item.subtitle}</p>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500">
                        {item.category}
                      </span>
                    </div>

                    {/* Suspect Food or Ingredients preview */}
                    {isFood && item.ingredients && item.ingredients.length > 0 && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        Ingredients: {item.ingredients.slice(0, 4).join(', ')}
                        {item.ingredients.length > 4 ? '...' : ''}
                      </div>
                    )}

                    {!isFood && item.suspectFood && (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          Suspected meal: <strong>{item.suspectFood}</strong>
                        </span>
                      </div>
                    )}
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
