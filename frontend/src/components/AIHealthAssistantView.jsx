import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Trash2,
  Sparkles,
  AlertOctagon,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';

const STARTER_PROMPTS = [
  'I ate wheat dosa today. What should I know?',
  'I experienced itching after lunch. What information should I record?',
  'What is the difference between my positive IgE test and a confirmed allergy?',
  'Can I eat foods that mention cross-contact warning?',
];

export default function AIHealthAssistantView({
  user,
  chatMessages = [],
  onSendMessage,
  onClearChat,
  loading = false,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const handleSelectStarter = (prompt) => {
    if (loading) return;
    onSendMessage(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <span>AI Health & Allergy Assistant</span>
          </h3>
          <p className="text-xs text-slate-500">
            Conversational assistant grounded in your confirmed allergies, test results, and AAAAI/EAACI guidelines
          </p>
        </div>

        {chatMessages.length > 0 && (
          <button
            onClick={onClearChat}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat History</span>
          </button>
        )}
      </div>

      {/* Grounding & Safety Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-indigo-950">Patient-Context Grounded Clinical Assistant</p>
          <p className="text-indigo-900 leading-relaxed text-[11px]">
            This assistant reviews your documented medical profile, lab test results (sIgE/SPT), and daily meal logs.
            <strong> It does not replace emergency medical care or physician consultation.</strong> If experiencing signs of anaphylaxis, call 911/112 immediately.
          </p>
        </div>
      </div>

      {/* Chat Window Box */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[560px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">
                  How can I help you today, {user?.name || 'Patient'}?
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ask questions about your logged meals, understand test results, or learn how to document reactions for your allergist.
                </p>
              </div>

              {/* Starter Prompt Pills */}
              <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-lg">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectStarter(prompt)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 hover:border-indigo-300 border border-slate-200 text-slate-700 text-xs font-medium transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isEmergency = msg.emergencyAlert?.isEmergency;

              return (
                <div
                  key={msg._id || idx}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isUser
                        ? 'bg-teal-600 text-white'
                        : isEmergency
                        ? 'bg-red-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm space-y-2 leading-relaxed ${
                      isUser
                        ? 'bg-teal-700 text-white rounded-tr-none'
                        : isEmergency
                        ? 'bg-red-50 text-red-950 border border-red-300 rounded-tl-none shadow-xs'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80'
                    }`}
                  >
                    {/* Emergency Alert Header inside Assistant Bubble */}
                    {isEmergency && (
                      <div className="p-2.5 rounded-xl bg-red-600 text-white font-bold flex items-center justify-between gap-2 shadow-xs">
                        <span className="flex items-center gap-1.5 text-xs">
                          <AlertOctagon className="w-4 h-4" />
                          Emergency Advisory
                        </span>
                        <a
                          href="tel:911"
                          className="px-2.5 py-1 rounded-lg bg-white text-red-700 font-black text-xs hover:bg-red-50 transition-colors flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          Call 911
                        </a>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    <span
                      className={`text-[10px] block text-right font-medium ${
                        isUser ? 'text-teal-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Consulting clinical allergy knowledge base...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about ingredients, symptoms, test interpretations, or dining guidance..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
