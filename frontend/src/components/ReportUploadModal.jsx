import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Camera,
  AlertCircle,
  Loader2,
  Sparkles,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { SUPPORTED_TEST_TYPES_LIST } from '../config/testSchemas';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export default function ReportUploadModal({ isOpen, onClose, onUploadSuccess, initialTestType = '' }) {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [selectedTestType, setSelectedTestType] = useState(initialTestType);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTestType(initialTestType || '');
    }
  }, [isOpen, initialTestType]);

  // Clean up object URLs on unmount or when modal is closed
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.url) {
          try {
            URL.revokeObjectURL(p.url);
          } catch {
            // Ignore revoked object URL errors
          }
        }
      });
    };
  }, [previews]);

  const handleClose = () => {
    if (uploading) return;
    previews.forEach((p) => {
      if (p.url) {
        try {
          URL.revokeObjectURL(p.url);
        } catch {
          // Ignore revoked object URL errors
        }
      }
    });
    setSelectedFiles([]);
    setPreviews([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const handleFiles = (incomingFiles) => {
    setError('');
    const newFiles = Array.from(incomingFiles);
    const validFiles = [];
    const newPreviews = [];

    for (const file of newFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        setError(`File "${file.name}" is not a supported format. Please upload JPG, PNG, WEBP, or PDF.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 15MB size limit.`);
        return;
      }
      validFiles.push(file);

      // Create preview URL if image
      if (file.type.startsWith('image/')) {
        newPreviews.push({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2),
          url: URL.createObjectURL(file),
          isPdf: false,
        });
      } else {
        newPreviews.push({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2),
          url: null,
          isPdf: true,
        });
      }
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
    setPreviews((prev) => {
      // Clean up object URLs
      if (prev[index]?.url) URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleUploadAndScan = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select or capture at least one medical report.');
      return;
    }

    setUploading(true);
    setError('');
    setProgressStage('Uploading medical document securely...');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    if (selectedTestType) {
      formData.append('selectedTestType', selectedTestType);
    }

    try {
      // Simulate realistic stage indicators for user feedback
      const timer1 = setTimeout(() => {
        setProgressStage('Running Optical Character Recognition (OCR)...');
      }, 1000);
      const timer2 = setTimeout(() => {
        setProgressStage('Analyzing medical entities, decimal values & units...');
      }, 2500);

      const res = await api.post('/medical-reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const reportData = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      onUploadSuccess(reportData);
      handleClose();
    } catch (err) {
      console.error('Upload Error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to upload and scan medical report. Please check your network and try again.'
      );
    } finally {
      setUploading(false);
      setProgressStage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 border border-teal-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{t('medicalReports.uploadReport')}</h3>
              <p className="text-xs text-teal-100">
                {t('medicalReports.ocrSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            aria-label="Close"
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-teal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Test Modality Target Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>{t('medicalReports.targetTestType')}:</span>
              <span className="text-[11px] text-slate-600 font-normal lowercase">
                {selectedTestType ? 'Targeted extraction active' : 'Auto-detect active'}
              </span>
            </label>
            <select
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 bg-white text-slate-800 shadow-xs"
            >
              <option value="">✨ {t('medicalReports.autoDetect')}</option>
              {SUPPORTED_TEST_TYPES_LIST.map((schema) => (
                <option key={schema.id} value={schema.id}>
                  {schema.name} ({schema.category})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Select your specific test to optimize extraction parameters, or leave on Auto-Detect.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-teal-600 bg-teal-50 scale-[1.01]'
                : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.value ? e.target.files : [])}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
            />
            {/* Hidden Mobile Camera Input */}
            <input
              type="file"
              ref={cameraInputRef}
              onChange={(e) => handleFiles(e.target.value ? e.target.files : [])}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {t('medicalReports.dragDrop')}{' '}
              <span className="text-teal-700 underline">{t('medicalReports.browse')}</span>
            </h4>
            <p className="text-xs text-slate-500">
              {t('medicalReports.supportedFormats')}
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-700" />
                <span>{t('medicalReports.selectDocument')}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t('medicalReports.takePhoto')}</span>
              </button>
            </div>
          </div>

          {/* Selected Files Preview List */}
          {previews.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('medicalReports.selectedDocuments')} ({previews.length}):
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {previews.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.isPdf ? (
                        <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-900 flex items-center justify-center shrink-0 font-bold text-[10px]">
                          PDF
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt="preview"
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.size} MB</p>
                      </div>
                    </div>

                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove file"
                        aria-label="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-xs font-bold text-teal-900">
                <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                <span>{progressStage || 'Processing document with OCR...'}</span>
              </div>
              <div className="w-full h-1.5 bg-teal-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full animate-pulse w-3/4" />
              </div>
              <p className="text-[11px] text-teal-800">
                Extracting test names, decimal values, units, and reference ranges...
              </p>
            </div>
          )}

          {/* Privacy & Security Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              All medical documents are encrypted and accessible only by you. Raw OCR data must be verified before saving.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleUploadAndScan}
              disabled={uploading || selectedFiles.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-xs hover:bg-teal-700 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing OCR...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('medicalReports.uploadAndExtract')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
