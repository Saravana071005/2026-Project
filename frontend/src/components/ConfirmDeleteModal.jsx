import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {title || 'Confirm Deletion'}
          </h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {message || 'Are you sure you want to delete this record? This action will permanently remove it from MongoDB Atlas.'}
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Deleting...' : 'Yes, Delete Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
