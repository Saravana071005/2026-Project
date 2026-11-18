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
        if (words.length > 10 && i < 30) {
          await new Promise((r) => setTimeout(r, 18));
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
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1.5" />;

          // Bold parsing
          const formatBold = (str) => {
            const parts = str.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-bold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });
          };

          // Bullet point
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                <span>{formatBold(trimmed.replace(/^[•\-*]\s+/, ''))}</span>
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^\d+\./)[0];
            const text = trimmed.replace(/^\d+\.\s+/, '');
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="text-indigo-600 font-bold shrink-0">{num}</span>
                <span>{formatBold(text)}</span>
              </div>
            );
          }

          // Header
          if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
            return (
              <h4 key={lIdx} className="font-bold text-slate-900 pt-1 text-sm sm:text-base">
                {trimmed.replace(/^#+\s+/, '')}
              </h4>
            );
          }

          // Emergency or Warning banner callout
          if (trimmed.includes('EMERGENCY MEDICAL ALERT') || trimmed.includes('⚠️')) {
            return (
              <div
                key={lIdx}
                className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 font-bold flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formatBold(trimmed)}</span>
              </div>
            );
          }

          return <p key={lIdx}>{formatBold(trimmed)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 bg-white/75 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden transition-all">
      {/* Liquid Glass Background Orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
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

        {/* Status Pill & Clear Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50/80 border border-purple-200/60 text-[11px] font-semibold text-purple-900">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>
              {providerStatus?.hasGeminiKey
                ? 'Google Gemini 1.5'
                : providerStatus?.hasOpenAIKey
                ? 'OpenAI GPT-4o'
                : 'Clinical Grounded Engine'}
            </span>
          </div>

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
          <span>Suggested Questions:</span>
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
              <span>Analyzing patient records & medical knowledge base...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Form */}
      <div className="relative z-10 space-y-2">
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about ingredients, symptoms, allergy testing, or your food diary..."
            disabled={loading}
            className="w-full pl-4 pr-24 py-3.5 rounded-2xl border border-slate-300/80 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 text-xs sm:text-sm shadow-sm backdrop-blur"
          />

          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:shadow-none"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Patient data is strictly isolated and grounded against official medical guidelines.</span>
        </p>
      </div>
    </div>
  );
}
