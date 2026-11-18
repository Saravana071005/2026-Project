import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Bot,
  Minimize2,
  Compass,
} from 'lucide-react';

// Define the 8 step-by-step onboarding tutorial steps
const TUTORIAL_STEPS = [
  {
    id: 'profile',
    tabKey: 'profile',
    targetSelector: '[data-tour="profile"]',
    titleKey: 'assistant.step1Title',
    descKey: 'assistant.step1Desc',
    mood: 'welcome',
  },
  {
    id: 'allergies',
    tabKey: 'allergies',
    targetSelector: '[data-tour="allergies"]',
    titleKey: 'assistant.step2Title',
    descKey: 'assistant.step2Desc',
    mood: 'pointing',
  },
  {
    id: 'upload',
    tabKey: 'reports',
    targetSelector: '[data-tour="reports"]',
    titleKey: 'assistant.step3Title',
    descKey: 'assistant.step3Desc',
    mood: 'tutorial',
  },
  {
    id: 'tests',
    tabKey: 'tests',
    targetSelector: '[data-tour="tests"]',
    titleKey: 'assistant.step4Title',
    descKey: 'assistant.step4Desc',
    mood: 'pointing',
  },
  {
    id: 'diary',
    tabKey: 'diary',
    targetSelector: '[data-tour="diary"]',
    titleKey: 'assistant.step5Title',
    descKey: 'assistant.step5Desc',
    mood: 'pointing',
  },
  {
    id: 'symptoms',
    tabKey: 'symptoms',
    targetSelector: '[data-tour="symptoms"]',
    titleKey: 'assistant.step6Title',
    descKey: 'assistant.step6Desc',
    mood: 'warning',
  },
  {
    id: 'analysis',
    tabKey: 'analysis',
    targetSelector: '[data-tour="analysis"]',
    titleKey: 'assistant.step7Title',
    descKey: 'assistant.step7Desc',
    mood: 'thinking',
  },
  {
    id: 'history',
    tabKey: 'history',
    targetSelector: '[data-tour="history"]',
    titleKey: 'assistant.step8Title',
    descKey: 'assistant.step8Desc',
    mood: 'success',
  },
];

/**
 * Visual AI Assistant - Jarvis-style Cute Healthcare Robot Companion
 * Provides visual-only animations, onboarding spotlight tutorial,
 * and context-aware guidance in English, Hindi, and Tamil.
 */
export default function VisualAIAssistant({
  activeTab,
  onNavigateTab,
  hasCompletedTutorial,
  onCompleteTutorial,
  _onRestartTutorial,
  userName = 'Patient',
}) {
  const { t } = useTranslation();

  // Assistant UI states
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [assistantMood, setAssistantMood] = useState('idle'); // idle | welcome | thinking | pointing | success | warning | tutorial
  const [hasInteracted, setHasInteracted] = useState(false);

  const bubbleRef = useRef(null);

  // Auto-prompt tutorial for first-time users once on mount
  useEffect(() => {
    if (!hasCompletedTutorial && !hasInteracted) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setAssistantMood('welcome');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTutorial, hasInteracted]);

  // Sync mood with active tutorial step
  useEffect(() => {
    if (isTutorialActive) {
      const step = TUTORIAL_STEPS[tutorialStep];
      if (step) {
        setAssistantMood(step.mood);
        if (onNavigateTab && step.tabKey) {
          onNavigateTab(step.tabKey);
        }
        // Scroll target element into view smoothly if present
        if (step.targetSelector) {
          const el = document.querySelector(step.targetSelector);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-teal-400', 'ring-offset-2', 'transition-all');
            return () => {
              el.classList.remove('ring-4', 'ring-teal-400', 'ring-offset-2');
            };
          }
        }
      }
    } else {
      // Dynamic mood based on active tab when idle
      if (activeTab === 'symptoms') setAssistantMood('warning');
      else if (activeTab === 'analysis') setAssistantMood('thinking');
      else if (activeTab === 'diary') setAssistantMood('idle');
      else if (activeTab === 'assistant') setAssistantMood('tutorial');
      else setAssistantMood('idle');
    }
  }, [isTutorialActive, tutorialStep, activeTab, onNavigateTab]);

  const handleStartTutorial = () => {
    setHasInteracted(true);
    setIsTutorialActive(true);
    setTutorialStep(0);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleNextStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep((prev) => prev + 1);
    } else {
      handleFinishTutorial();
    }
  };

  const handlePrevStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep((prev) => prev - 1);
    }
  };

  const handleFinishTutorial = () => {
    setIsTutorialActive(false);
    setAssistantMood('success');
    if (onCompleteTutorial) onCompleteTutorial();
    setTimeout(() => {
      setAssistantMood('idle');
    }, 4000);
  };

  const handleSkipTutorial = () => {
    setIsTutorialActive(false);
    setAssistantMood('idle');
    if (onCompleteTutorial) onCompleteTutorial();
  };

  // Get contextual message based on current tab
  const getContextualAdvice = () => {
    switch (activeTab) {
      case 'profile':
        return t('assistant.contextProfile');
      case 'allergies':
        return t('assistant.contextAllergies');
      case 'tests':
        return t('assistant.contextTests');
      case 'reports':
        return t('assistant.contextReports');
      case 'diary':
        return t('assistant.contextDiary');
      case 'symptoms':
        return t('assistant.contextSymptoms');
      case 'analysis':
        return t('assistant.contextAnalysis');
      case 'history':
        return t('assistant.contextHistory');
      case 'assistant':
        return t('assistant.contextChat');
      default:
        return t('assistant.contextDashboard');
    }
  };

  return (
    <aside
      aria-label={t('assistant.companionName')}
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none select-none font-sans"
    >
      {/* Speech / Instruction Bubble */}
      {isOpen && !isMinimized && (
        <div
          ref={bubbleRef}
          className="pointer-events-auto mb-3 w-[320px] sm:w-[360px] p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-teal-200/80 shadow-2xl shadow-teal-900/15 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 relative text-slate-800"
        >
          {/* Bubble Tail */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b border-r border-teal-200 rotate-45" />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">
                  {t('assistant.companionName')}
                </h4>
                <p className="text-[10px] text-teal-600 font-semibold leading-none">
                  {t('assistant.companionRole')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Minimize assistant"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsTutorialActive(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Close bubble"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bubble Content Body */}
          <div className="py-3 space-y-2.5">
            {isTutorialActive ? (
              // Step-by-Step Tutorial Card
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {t('assistant.stepCount', {
                      current: tutorialStep + 1,
                      total: TUTORIAL_STEPS.length,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={handleSkipTutorial}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                  >
                    {t('common.skip')}
                  </button>
                </div>

                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-slate-900">
                    {t(TUTORIAL_STEPS[tutorialStep].titleKey)}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t(TUTORIAL_STEPS[tutorialStep].descKey)}
                  </p>
                </div>

                {/* Progress Dots */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {TUTORIAL_STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTutorialStep(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === tutorialStep
                          ? 'w-5 bg-teal-600'
                          : idx < tutorialStep
                            ? 'w-2 bg-teal-300'
                            : 'w-1.5 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Tutorial Nav Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={tutorialStep === 0}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold disabled:opacity-30 transition-all flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{t('common.back')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                  >
                    <span>
                      {tutorialStep === TUTORIAL_STEPS.length - 1
                        ? t('common.finish')
                        : t('common.next')}
                    </span>
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Contextual Advice Card
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-950 leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <p>{getContextualAdvice()}</p>
                </div>

                {/* Quick Assistant Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleStartTutorial}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border border-teal-200/80 text-teal-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    <span>{hasCompletedTutorial ? t('common.restartTutorial') : t('common.help')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('assistant');
                      setIsOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/80 text-indigo-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('nav.assistant')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Interactive Avatar */}
      <div className="pointer-events-auto relative group">
        {/* Tooltip on Hover when bubble is closed */}
        {!isOpen && (
          <div className="absolute right-full bottom-2 mr-3 hidden sm:block whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-[11px] font-medium shadow-xl border border-slate-700/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t('assistant.tooltip')}
          </div>
        )}

        {/* Outer Glow Halo */}
        <div
          className={`absolute -inset-1 rounded-full blur-md opacity-70 transition-all duration-500 ${
            assistantMood === 'warning'
              ? 'bg-amber-400'
              : assistantMood === 'thinking'
                ? 'bg-indigo-400'
                : assistantMood === 'success'
                  ? 'bg-emerald-400'
                  : 'bg-teal-400 group-hover:opacity-100'
          }`}
        />

        {/* Robot Avatar Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsMinimized(false);
          }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 border-2 border-white shadow-xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-teal-400 transition-transform active:scale-95 group-hover:scale-105"
          aria-label={t('assistant.companionName')}
        >
          {/* Animated SVG Robot Face & Companion */}
          <svg
            viewBox="0 0 100 100"
            className="w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-300"
          >
            {/* Robot Head Body */}
            <defs>
              <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
              <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Antenna & Beacon Orb */}
            <line x1="50" y1="20" x2="50" y2="10" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <circle
              cx="50"
              cy="8"
              r="5"
              fill={
                assistantMood === 'warning'
                  ? '#f59e0b'
                  : assistantMood === 'thinking'
                    ? '#6366f1'
                    : assistantMood === 'success'
                      ? '#10b981'
                      : 'url(#orbGrad)'
              }
              className="animate-pulse"
            />

            {/* Cute Ear Cushions */}
            <rect x="18" y="42" width="6" height="18" rx="3" fill="#0d9488" />
            <rect x="76" y="42" width="6" height="18" rx="3" fill="#0d9488" />

            {/* Robot Head Capsule */}
            <rect
              x="22"
              y="22"
              width="56"
              height="54"
              rx="24"
              fill="url(#robotGrad)"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Visor Display Screen */}
            <rect
              x="28"
              y="32"
              width="44"
              height="28"
              rx="12"
              fill="url(#screenGrad)"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Expressive LED Eyes */}
            {assistantMood === 'welcome' || assistantMood === 'success' ? (
              // Joyful Curved Eyes ^_^
              <g stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round">
                <path d="M 37 46 Q 42 40 47 46" />
                <path d="M 53 46 Q 58 40 63 46" />
              </g>
            ) : assistantMood === 'thinking' ? (
              // Thinking Rotating / Analytical Eyes
              <g fill="#818cf8">
                <circle cx="42" cy="45" r="4" className="animate-ping" opacity="0.75" />
                <circle cx="42" cy="45" r="3.5" />
                <circle cx="58" cy="45" r="3.5" />
              </g>
            ) : assistantMood === 'warning' ? (
              // Alert Warning Eyes
              <g fill="#fbbf24">
                <circle cx="42" cy="45" r="4.5" />
                <circle cx="58" cy="45" r="4.5" />
              </g>
            ) : (
              // Friendly Expressive Round Eyes
              <g fill="#2dd4bf">
                <circle cx="42" cy="45" r="4" />
                <circle cx="58" cy="45" r="4" />
                <circle cx="44" cy="43" r="1.5" fill="#ffffff" />
                <circle cx="60" cy="43" r="1.5" fill="#ffffff" />
              </g>
            )}

            {/* Subtle Cheeks Glow */}
            <circle cx="34" cy="53" r="2.5" fill="#f43f5e" opacity="0.4" />
            <circle cx="66" cy="53" r="2.5" fill="#f43f5e" opacity="0.4" />

            {/* Cute Chest Emblem / Health Cross */}
            <circle cx="50" cy="85" r="6" fill="#0d9488" />
            <path
              d="M 50 82 L 50 88 M 47 85 L 53 85"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Active Status Badge Ping */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                assistantMood === 'warning'
                  ? 'bg-amber-400'
                  : assistantMood === 'thinking'
                    ? 'bg-indigo-400'
                    : 'bg-teal-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${
                assistantMood === 'warning'
                  ? 'bg-amber-500'
                  : assistantMood === 'thinking'
                    ? 'bg-indigo-500'
                    : 'bg-teal-500'
              }`}
            />
          </span>
        </button>
      </div>
    </aside>
  );
}
