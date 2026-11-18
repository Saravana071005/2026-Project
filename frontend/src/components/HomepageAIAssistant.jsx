import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  AlertTriangle,
  Check,
  Copy,
  BookOpen,
  Cpu,
  ShieldCheck,
  Info,
  ExternalLink,
  X,
} from 'lucide-react';
import api from '../services/api';

const DEFAULT_SUGGESTIONS = [
  'I ate wheat dosa today and felt itching. What should I do?',
  'What are common cross-reactive foods for tree nuts?',
  'Explain the difference between a positive sIgE test and clinical allergy.',
  'Does my recent food diary contain any ingredients matching my confirmed allergies?',
];

export default function HomepageAIAssistant({ user }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [showAugustInfoModal, setShowAugustInfoModal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/ai-chat/history', {
        params: { limit: 30 },
      });
      if (res.data?.data && res.data.data.length > 0) {
        setMessages(
          res.data.data.map((m) => ({
            role: m.role,
            content: m.content,
            isEmergency: !!m.emergencyAlert,
            providerUsed: m.providerUsed,
            timestamp: m.createdAt,
          }))
        );
      } else {
        // Welcome initial assistant greeting
        setMessages([
          {
            role: 'assistant',
            content:
              `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am your **Clinical AI Allergy Assistant**.\n\n` +
              `I analyze your medical records, allergy history, and daily food logs to provide personalized observations according to **AAAAI & EAACI** clinical protocols.\n\n` +
              `*Select a suggested topic below or type your question.*`,
            sources: ['AAAAI Clinical Guidelines', 'EAACI Food Allergy Protocol'],
            providerUsed: 'clinical_grounded_engine',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // Fallback welcome message if network fails
      setMessages([
        {
          role: 'assistant',
          content: `Welcome back! How can I assist with your allergy safety and diet records today?`,
          providerUsed: 'clinical_grounded_engine',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [user]);

  const fetchAIStatus = useCallback(async () => {
    try {
      const res = await api.get('/ai-chat/status');
      if (res.data?.data) {
        setProviderStatus(res.data.data);
      }
    } catch {
      // Ignore status lookup errors
    }
  }, []);

  // Fetch initial history & provider status
  useEffect(() => {
    fetchHistory();
    fetchAIStatus();
  }, [fetchHistory, fetchAIStatus]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Send Message
  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    setError('');
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await api.post('/ai-chat/message', {
        message: text,
        provider: selectedProvider,
        sessionId: 'homepage_session',
      });

      const replyData = res.data?.data;
      const fullReply = replyData?.reply || 'I received your query but was unable to produce a response.';

      // Simulated progressive typing stream effect
      const assistantMessage = {
        role: 'assistant',
        content: '',
        isEmergency: !!replyData?.isEmergency,
        providerUsed: replyData?.providerUsed,
        sources: replyData?.sources || ['AAAAI Clinical Protocols'],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Stream words progressively
      const words = fullReply.split(' ');
      let accumulated = '';
      for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        const currentText = accumulated;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: currentText,
          };
          return next;
        });
        // Small delay for natural progressive reading pace
        if (words.length > 10 && i < 25) {
          await new Promise((r) => setTimeout(r, 16));
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.message || 'Failed to receive response. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an error communicating with the clinical assistant service. Please check your network connection and try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear Chat History
  const handleClearHistory = async () => {
    try {
      await api.delete('/ai-chat/history', {
        params: { sessionId: 'homepage_session' },
      });
      setMessages([
        {
          role: 'assistant',
          content: 'Conversation history cleared. How can I help you today?',
          providerUsed: 'clinical_grounded_engine',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // Copy reply to clipboard
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render markdown bold and lists nicely
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, lIdx) => {
          if (!line.trim()) {
            return <div key={lIdx} className="h-1.5" />;
          }

          // GitHub Alert Style Blockquote
          if (line.startsWith('> [!NOTE]') || line.startsWith('> [!IMPORTANT]') || line.startsWith('> [!WARNING]')) {
            return (
              <div
                key={lIdx}
                className="my-2 p-3 rounded-xl bg-purple-500/10 border border-purple-400/30 text-purple-950 dark:text-purple-200 text-xs flex items-start gap-2 backdrop-blur-sm"
              >
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">Notice</span>
              </div>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <div
                key={lIdx}
                className="pl-3 py-1 my-1 border-l-2 border-purple-500 text-slate-700 italic text-xs leading-relaxed"
              >
                {line.replace(/^>\s*/, '')}
              </div>
            );
          }

          // Bullet items
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const rawText = line.replace(/^[•\-*]\s*/, '');
            const parsed = rawText.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-bold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });

            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span className="flex-1">{parsed}</span>
              </div>
            );
          }

          // Numbered lists
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)[1];
            const rawText = line.replace(/^\d+\.\s*/, '');
            const parsed = rawText.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-bold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });

            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {num}
                </span>
                <span className="flex-1">{parsed}</span>
              </div>
            );
          }

          // Regular paragraph with bolding
          const parsed = line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          return <p key={lIdx}>{parsed}</p>;
        })}
      </div>
    );
  };

  const getProviderBadge = (providerId) => {
    switch (providerId) {
      case 'openai':
        return { label: 'OpenAI GPT-4o', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'gemini':
        return { label: 'Google Gemini 1.5', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'august':
        return { label: 'August AI', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'emergency_engine':
        return { label: '0-Latency Emergency Triage', bg: 'bg-rose-50 text-rose-800 border-rose-300' };
      default:
        return { label: 'Clinical Grounded Engine', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
  };

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 bg-white/75 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden transition-all">
      {/* Liquid Glass Background Ambient Glows */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                AI Health & Diet Assistant
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Context Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded in your medical records, laboratory tests, and food logs
            </p>
          </div>
        </div>

        {/* Multi-AI Provider Selector & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {/* Provider Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/80 border border-purple-200/70 text-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[11px] font-bold text-slate-600 hidden lg:inline">Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="auto">Auto Cascade (Recommended)</option>
              <option value="openai">OpenAI (GPT-4o Mini)</option>
              <option value="gemini">Google Gemini (1.5 Flash)</option>
              <option value="august">August AI (meetaugust.ai)</option>
              <option value="clinical_grounded_engine">Clinical Grounded Engine</option>
            </select>
          </div>

          {/* August AI Status Pill & Info Button */}
          <button
            type="button"
            onClick={() => setShowAugustInfoModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200/80 bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-900 text-xs font-semibold transition-all shadow-xs"
            title="View August AI (meetaugust.ai) integration status"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>August AI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
              {providerStatus?.hasAugustKey ? 'Connected' : 'Not Connected'}
            </span>
            <Info className="w-3 h-3 text-indigo-600 ml-0.5" />
          </button>

          {/* Clear History Action */}
          <button
            type="button"
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="relative z-10 pt-4 pb-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-purple-600" />
          <span>Suggested Clinical Questions:</span>
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pr-2">
          {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(suggestion)}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200/70 text-purple-950 text-xs font-medium whitespace-nowrap transition-all shadow-xs shrink-0 hover:scale-[1.01]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread Window */}
      <div className="relative z-10 my-4 p-4 sm:p-5 rounded-2xl bg-slate-900/5 border border-slate-200/60 h-[380px] sm:h-[420px] overflow-y-auto space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const badge = !isUser && msg.providerUsed ? getProviderBadge(msg.providerUsed) : null;

          return (
            <div key={idx} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-tr from-cyan-600 to-teal-600'
                    : msg.isEmergency
                    ? 'bg-rose-600'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-xs transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                    : msg.isEmergency
                    ? 'bg-rose-50 border border-rose-300 text-slate-900 rounded-tl-none'
                    : 'bg-white/90 border border-slate-200/80 text-slate-800 rounded-tl-none backdrop-blur'
                }`}
              >
                {isUser ? (
                  <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    {/* Active Provider Tag */}
                    {badge && (
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} flex items-center gap-1`}
                        >
                          <Cpu className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}

                    {renderFormattedContent(msg.content)}

                    {/* Medical Source Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <BookOpen className="w-3 h-3 text-purple-600" />
                        <span className="font-semibold">Sources:</span>
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-medium"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Copy action */}
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, idx)}
                        className="text-[11px] text-slate-400 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              <span>Analyzing patient records via Multi-AI Medical Engine...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Form */}
      <div className="relative z-10 space-y-2">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={textareaRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about food allergens, symptom timeline, or lab findings..."
              disabled={loading}
              className="w-full px-5 py-3.5 rounded-2xl bg-white/90 border border-slate-200/90 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="btn-liquid-purple px-5 py-3.5 rounded-2xl text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            HIPAA-grade PII minimization: Direct personal identifiers are redacted before external AI query serialization.
          </span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>

      {/* August AI Information & Verification Modal */}
      {showAugustInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl p-6 bg-white/95 border border-white/60 shadow-2xl backdrop-blur-xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">August AI (meetaugust.ai) Status</h4>
                  <p className="text-[11px] text-slate-500">Official Health Companion Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAugustInfoModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Connection Status: NOT CONNECTED</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-normal">
                  August AI does not offer public self-service developer endpoints or API keys. Integration requires an
                  authorized enterprise partnership agreement and designated clinical gateway endpoint directly from{' '}
                  <strong>August Labs Inc.</strong>
                </p>
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-semibold">Official Companion:</span>
                  <a
                    href="https://www.meetaugust.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>meetaugust.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-semibold">Developer Organization:</span>
                  <span className="font-medium text-slate-700">August Labs Inc. (San Francisco, CA)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-semibold">Active Fallback Engine:</span>
                  <span className="font-medium text-emerald-700">OpenAI / Gemini / Clinical Grounded Engine</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/60 text-purple-900 space-y-1 text-[11px]">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Medical Privacy Guarantee:
                </span>
                <p className="text-slate-600 leading-normal">
                  In compliance with clinical privacy laws and August Labs Inc. terms, our system strictly redacts direct
                  patient identifiers (names, addresses, phone numbers) before external AI serialization. We do not use
                  unofficial private app endpoints or scrape private mobile interfaces.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAugustInfoModal(false)}
                className="btn-liquid-purple px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
              >
                Close Status Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
