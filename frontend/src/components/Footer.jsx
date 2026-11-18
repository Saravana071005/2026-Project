import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Database, Lock } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Medical Advisory Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">{t('footer.disclaimerTitle')}</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed text-xs">
              {t('footer.disclaimerText')}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{t('common.appName')}</span>
            <span>•</span>
            <span>{t('footer.securedJwt')}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
              <Database className="w-3.5 h-3.5" /> {t('common.mongoDbAtlas')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              {t('footer.patientDataIsolated')}
            </span>
            <span>•</span>
            <span>{t('footer.academicDemo')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
