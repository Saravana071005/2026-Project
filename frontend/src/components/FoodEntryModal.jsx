import React, { useState, useEffect } from 'react';
import {
  X,
  Utensils,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Tag,
} from 'lucide-react';
import api from '../services/api';

const FOOD_CATEGORIES = [
  'Mixed Dish / Traditional Recipe',
  'Grains & Cereals',
  'Dairy & Eggs',
  'Meat & Poultry',
  'Fish & Seafood',
  'Nuts & Seeds',
  'Legumes & Pulses',
  'Fruits',
  'Vegetables',
  'Beverages',
  'Bakery & Sweets',
  'Snacks & Packaged Foods',
  'Condiments & Spices',
  'Other',
];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner', 'Late Night / Other'];
const MEASUREMENT_UNITS = ['serving', 'plate', 'bowl', 'cup', 'piece', 'grams', 'ml', 'slice', 'item'];

const TODAY_DATE_STR = new Date().toISOString().split('T')[0];

export default function FoodEntryModal({ isOpen, onClose, onSaved, initialData = null }) {
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('Mixed Dish / Traditional Recipe');
  const [mealType, setMealType] = useState('Breakfast');
  const [quantity, setQuantity] = useState(1);
  const [measurementUnit, setMeasurementUnit] = useState('serving');
  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [preparationMethod, setPreparationMethod] = useState('');
  const [consumptionDate, setConsumptionDate] = useState(TODAY_DATE_STR);
  const [consumptionTime, setConsumptionTime] = useState('08:30');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [dietaryAlerts, setDietaryAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFoodName(initialData.foodName || '');
      setFoodCategory(initialData.foodCategory || 'Mixed Dish / Traditional Recipe');
      setMealType(initialData.mealType || 'Breakfast');
      setQuantity(initialData.quantity || 1);
      setMeasurementUnit(initialData.measurementUnit || 'serving');
      setIngredients(initialData.ingredients || []);
      setPreparationMethod(initialData.preparationMethod || '');
      setConsumptionDate(
        initialData.consumptionDate
          ? new Date(initialData.consumptionDate).toISOString().split('T')[0]
          : TODAY_DATE_STR
      );
      setConsumptionTime(initialData.consumptionTime || '12:00');
      setAdditionalNotes(initialData.additionalNotes || '');
      setDietaryAlerts(initialData.dietaryAlerts || []);
    } else {
      setFoodName('');
      setFoodCategory('Mixed Dish / Traditional Recipe');
      setMealType('Breakfast');
      setQuantity(1);
      setMeasurementUnit('serving');
      setIngredients([]);
      setPreparationMethod('');
      setConsumptionDate(TODAY_DATE_STR);
      setConsumptionTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setAdditionalNotes('');
      setDietaryAlerts([]);
    }
    setError('');
  }, [initialData, isOpen]);

  // Live Diet Safety Pre-check
  useEffect(() => {
    if (!isOpen || !foodName.trim()) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/ai-analysis/diet-monitoring', {
          params: {
            foodName: foodName.trim(),
            ingredients: ingredients.join(','),
          },
        });
        if (res.data?.data?.alerts) {
          setDietaryAlerts(res.data.data.alerts);
        }
      } catch {
        // Silently ignore precheck network errors
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [foodName, ingredients, isOpen]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  const handleKeyDownIngredient = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!foodName.trim()) {
      setError('Please provide a food or recipe name.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        foodName: foodName.trim(),
        foodCategory,
        mealType,
        quantity: parseFloat(quantity) || 1,
        measurementUnit,
        ingredients,
        preparationMethod: preparationMethod.trim(),
        consumptionDate,
        consumptionTime,
        additionalNotes: additionalNotes.trim(),
      };

      let response;
      if (initialData?._id) {
        response = await api.put(`/food-diary/${initialData._id}`, payload);
      } else {
        response = await api.post('/food-diary', payload);
      }

      const savedEntry = response.data.data;
      onSaved(savedEntry, !!initialData?._id);
      onClose();
    } catch (err) {
      console.error('Failed to save food entry:', err);
      setError(err.response?.data?.message || 'Failed to save food diary entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Utensils className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {initialData ? 'Edit Daily Food Entry' : 'Log Food Intake in Daily Diary'}
              </h3>
              <p className="text-xs text-teal-100">
                Track meals, ingredients, and preparation for continuous allergy safety analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Allergen Alert Warning Banner */}
        {dietaryAlerts.length > 0 && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-amber-950">Dietary Allergen Profile Notice:</p>
              {dietaryAlerts.map((alt, idx) => (
                <p key={idx} className="text-amber-800 leading-relaxed">
                  • <strong>{alt.allergenName || alt.category}:</strong> {alt.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Food Name & Meal Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Food or Dish Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Wheat Dosa, Peanut Butter Sandwich, Steamed Rice"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Meal Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category, Quantity & Measurement Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Food Category</label>
              <select
                value={foodCategory}
                onChange={(e) => setFoodCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Quantity</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Unit</label>
              <select
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {MEASUREMENT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Ingredients Tag Builder */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-600" />
                Ingredients (Essential for mixed dishes & allergy tracking)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Press Enter or click +</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={handleKeyDownIngredient}
                placeholder="e.g. wheat flour, peanut oil, cow milk, egg white, butter, salt"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium"
                  >
                    <span>{ing}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="text-teal-600 hover:text-rose-600 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Row 4: Preparation Method & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                Preparation Method
              </label>
              <input
                type="text"
                value={preparationMethod}
                onChange={(e) => setPreparationMethod(e.target.value)}
                placeholder="e.g. Roasted on tawa, Deep-fried, Boiled, Commercial packaged"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Consumption Date
              </label>
              <input
                type="date"
                required
                value={consumptionDate}
                onChange={(e) => setConsumptionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Consumption Time
              </label>
              <input
                type="time"
                required
                value={consumptionTime}
                onChange={(e) => setConsumptionTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Row 5: Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Additional Notes / Culinary Context</label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Prepared at restaurant; shared fryers may have been used. Ate with mint chutney."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving...' : initialData ? 'Update Food Entry' : 'Save to Food Diary'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
