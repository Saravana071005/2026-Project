import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  Tag,
  ChefHat,
  Search,
  Activity,
  Filter,
} from 'lucide-react';
import { formatDate } from '../utils/ageCalculator';

const MEAL_TYPE_BADGES = {
  Breakfast: 'bg-amber-100 text-amber-800 border-amber-200',
  Lunch: 'bg-blue-100 text-blue-800 border-blue-200',
  'Evening Snack': 'bg-orange-100 text-orange-800 border-orange-200',
  Dinner: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Late Night / Other': 'bg-slate-100 text-slate-800 border-slate-200',
};

const TODAY_DATE_STR = new Date().toISOString().split('T')[0];

export default function DailyFoodDiaryView({
  foodEntries = [],
  onOpenAddModal,
  onOpenEditModal,
  onDeleteEntry,
  onLogSymptomForFood,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mealFilter, setMealFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Summary Metrics
  const todayMealsCount = foodEntries.filter(
    (f) => f.consumptionDate?.split('T')[0] === TODAY_DATE_STR
  ).length;

  const totalFlaggedCount = foodEntries.filter(
    (f) => f.dietaryAlerts && f.dietaryAlerts.length > 0
  ).length;

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return foodEntries.filter((item) => {
      const term = searchTerm.toLowerCase();
      const foodMatch = item.foodName?.toLowerCase().includes(term);
      const catMatch = item.foodCategory?.toLowerCase().includes(term);
      const prepMatch = item.preparationMethod?.toLowerCase().includes(term);
      const ingMatch = (item.ingredients || []).some((ing) =>
        ing.toLowerCase().includes(term)
      );
      const matchesSearch = !searchTerm || foodMatch || catMatch || prepMatch || ingMatch;

      const matchesMeal = mealFilter === 'ALL' || item.mealType === mealFilter;

      const itemDate = item.consumptionDate?.split('T')[0];
      const matchesDate = !dateFilter || itemDate === dateFilter;

      return matchesSearch && matchesMeal && matchesDate;
    });
  }, [foodEntries, searchTerm, mealFilter, dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-teal-600" />
            <span>Daily Food Intake Diary</span>
          </h3>
          <p className="text-xs text-slate-500">
            Log meals, detailed ingredients, and preparation methods to monitor allergy exposure
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold hover:from-teal-700 hover:to-cyan-700 shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Food / Meal</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Logged Meals
          </span>
          <span className="text-xl font-extrabold text-slate-900">{foodEntries.length}</span>
          <span className="text-[10px] text-teal-600 block mt-0.5">In food history</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Logged Today
          </span>
          <span className="text-xl font-extrabold text-teal-700">{todayMealsCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Meals tracked</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Dietary Alerts
          </span>
          <span className="text-xl font-extrabold text-amber-600">{totalFlaggedCount}</span>
          <span className="text-[10px] text-amber-700 block mt-0.5">Contains allergen risk</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Filter Matches
          </span>
          <span className="text-xl font-extrabold text-slate-800">{filteredEntries.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Entries visible</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search food, ingredient, recipe, or preparation method..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Meal Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={mealFilter}
              onChange={(e) => setMealFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Meals</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Evening Snack">Evening Snack</option>
              <option value="Dinner">Dinner</option>
              <option value="Late Night / Other">Late Night / Other</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-teal-700 font-bold hover:underline shrink-0"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Food Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">No Food Intake Records Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchTerm || mealFilter !== 'ALL' || dateFilter
                ? 'No meal records match your current filters. Clear filters to see all entries.'
                : 'Start tracking your daily meals and ingredients to establish accurate food-symptom correlation.'}
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Your First Meal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const hasAlerts = entry.dietaryAlerts && entry.dietaryAlerts.length > 0;
            const mealBadgeClass =
              MEAL_TYPE_BADGES[entry.mealType] || 'bg-slate-100 text-slate-800 border-slate-200';

            return (
              <div
                key={entry._id}
                className={`p-5 rounded-2xl bg-white border transition-shadow hover:shadow-md flex flex-col justify-between space-y-4 ${
                  hasAlerts ? 'border-amber-300 shadow-2xs' : 'border-slate-200 shadow-2xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Top: Name & Meal Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-slate-900">{entry.foodName}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${mealBadgeClass}`}
                        >
                          {entry.mealType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{entry.foodCategory}</p>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs shrink-0">
                      {entry.quantity} {entry.measurementUnit}
                    </span>
                  </div>

                  {/* Dietary Alerts Banner */}
                  {hasAlerts && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Dietary Allergen Warning:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                        {entry.dietaryAlerts.map((alert, idx) => (
                          <li key={idx}>{alert}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {formatDate(entry.consumptionDate)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {entry.consumptionTime || 'N/A'}
                    </span>
                  </div>

                  {/* Ingredients Tags */}
                  {entry.ingredients && entry.ingredients.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Ingredients ({entry.ingredients.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {entry.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-100 text-teal-900 text-[11px] font-medium flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-teal-600" />
                            <span>{ing}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preparation Method */}
                  {entry.preparationMethod && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <ChefHat className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Method:</span>
                      <span className="font-semibold text-slate-800">
                        {entry.preparationMethod}
                      </span>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {entry.additionalNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Notes: </span>
                      {entry.additionalNotes}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onLogSymptomForFood && onLogSymptomForFood(entry)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors flex items-center gap-1 border border-rose-200"
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    <span>Report Reaction</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenEditModal(entry)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Edit food entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete food entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
