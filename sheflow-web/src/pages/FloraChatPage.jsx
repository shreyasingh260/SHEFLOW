import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Info, 
  CheckCheck, 
  HelpCircle, 
  Activity, 
  Utensils, 
  Calendar, 
  ShieldAlert, 
  Droplet, 
  AlertOctagon, 
  Zap, 
  Stethoscope, 
  TrendingUp, 
  Leaf, 
  Moon, 
  ChevronRight,
  User,
  Trash2,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { chatApi } from '../api/backendApi';
import { useAuth } from '../context/AuthContext';

export default function FloraChatPage({ onNavigateEmergency, onNavigateHormones, onNavigateNutrition }) {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || 'Shreya';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadChat() {
      const hist = await chatApi.getHistory();
      setMessages(hist);
    }
    loadChat();
  }, []);

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear your chat history with Flora?')) {
      await chatApi.clearHistory();
      setMessages([]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    setInputText('');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Instantly append user message
    const tempUserMsg = {
      id: 'usr-' + Date.now(),
      sender: 'USER',
      content: text,
      timestamp: timeStr
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await chatApi.sendMessage(text);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, res.floraReply]);
      }, 700);
    } catch {
      setIsTyping(false);
    }
  };

  const suggestedQuestions = [
    { text: 'Why am I having cramps?', icon: HelpCircle },
    { text: 'Can I exercise today?', icon: Activity },
    { text: 'Best foods during periods?', icon: Utensils },
    { text: 'Is my cycle normal?', icon: Calendar },
    { text: 'Pregnancy chances?', icon: ShieldAlert },
  ];

  const urgentCards = [
    { title: 'Heavy Bleeding', icon: Droplet, query: 'I have heavy bleeding, what should I do?' },
    { title: 'Missed Period', icon: Calendar, query: 'I missed my period, what could be the causes?' },
    { title: 'Severe Pain', icon: Zap, query: 'I am experiencing severe unbearable pelvic pain' },
    { title: 'When should I see a doctor?', icon: Stethoscope, query: 'When should I see a gynecologist?' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* ========================================================
          HEADER (Matches media_1793946588855_4b244a43.jpg)
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#2D1420] tracking-tight">
            Hi {firstName}! I'm Flora
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-700">Online</span>
            <span className="text-xs text-[#7C6A75]">
              — Your personalized AI health companion. Educational support only.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title="Clear chat history"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#FFE4EC] hover:border-red-300 text-xs font-semibold text-[#8E7582] hover:text-red-500 rounded-2xl transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#FFE4EC] hover:border-[#FFC2D1] rounded-2xl text-xs font-bold text-[#685361] hover:text-[#E83D6F] transition-all shadow-xs"
          >
            <Info className="w-4 h-4 text-[#E83D6F]" />
            <span>How Flora works</span>
          </button>
        </div>
      </div>

      {showHowItWorks && (
        <div className="bg-[#FFF0F3] border border-[#FFCCD8] rounded-2xl p-4 text-xs text-[#2D1420] animate-in fade-in">
          <p className="font-bold mb-1 text-[#E83D6F]">About Flora AI:</p>
          <p className="text-[#685361] leading-relaxed">
            Flora combines peer-reviewed gynecological guidelines (ACOG, NHS, WHO) with your personal cycle logs to deliver empathetic, actionable insights. Flora can help identify patterns in cramps, explain cycle phases, and flag red-flag symptoms. Note: Flora is an educational AI companion and does not diagnose conditions or replace clinical care.
          </p>
        </div>
      )}

      {/* ========================================================
          MAIN DUAL COLUMN LAYOUT
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CHAT STREAM + INPUT + QUESTIONS + URGENT */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chat Container */}
          <div className="bg-white rounded-3xl border border-[#FFE4EC] shadow-soft p-5 sm:p-6 flex flex-col h-[520px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((m) => {
                const isFlora = m.sender === 'FLORA';
                const isEmergency = m.isEmergency || (m.safetyNotice && m.safetyNotice.length > 0);

                return (
                  <div key={m.id} className={`flex items-start gap-3 ${isFlora ? 'justify-start' : 'justify-end'}`}>
                    {isFlora && (
                      <div className="w-8 h-8 rounded-full bg-[#FFE1E8] border border-[#FFCCD8] flex items-center justify-center shrink-0 text-[#E83D6F] shadow-xs">
                        🌸
                      </div>
                    )}

                    <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5">
                      <div
                        className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                          isEmergency
                            ? 'bg-red-50 text-red-950 border-2 border-red-300 rounded-tl-xs'
                            : isFlora
                              ? 'bg-[#FFF0F3] text-[#2D1420] rounded-tl-xs border border-[#FFE4EC]'
                              : 'bg-white text-[#2D1420] rounded-tr-xs border border-[#FFE1E8]'
                        }`}
                      >
                        {isEmergency && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>CLINICAL TRIAGE NOTICE</span>
                          </div>
                        )}

                        {m.content}

                        {isEmergency && onNavigateEmergency && (
                          <div className="mt-3 pt-2.5 border-t border-red-200 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-red-700">Helplines: 1091 (Women) / 112 (Emergency)</span>
                            <button
                              onClick={onNavigateEmergency}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                            >
                              Emergency Contacts
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Source Citations */}
                      {isFlora && m.sources && m.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 px-1">
                          {m.sources.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 text-[10px] text-[#7C6A75] bg-[#FFF5F7] border border-[#FFE1E8] px-2 py-0.5 rounded-md"
                            >
                              <BookOpen className="w-2.5 h-2.5 text-[#E83D6F]" />
                              <span>{src}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={`flex items-center gap-1.5 text-[10px] text-[#8E7582] px-1 ${isFlora ? '' : 'justify-end'}`}>
                        <span>{m.timestamp}</span>
                        {!isFlora && <CheckCheck className="w-3.5 h-3.5 text-[#E83D6F]" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFE1E8] flex items-center justify-center shrink-0 text-[#E83D6F]">
                    🌸
                  </div>
                  <div className="bg-[#FFF0F3] p-3 rounded-2xl rounded-tl-xs border border-[#FFE4EC] flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#E83D6F] rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-[#E83D6F] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-[#E83D6F] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="pt-4 border-t border-[#FFE8EE] mt-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask Flora anything about your health..."
                  className="flex-1 px-4 py-3 bg-[#FFF7F9] border border-[#FFE1E8] rounded-2xl text-xs sm:text-sm text-[#2D1420] placeholder-[#A8949F] focus:outline-hidden focus:border-[#E83D6F] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="w-11 h-11 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-[0.97] text-white rounded-2xl flex items-center justify-center shadow-md transition-all shrink-0 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Suggested Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C6A75]">
                Suggested Questions
              </h3>
              <span className="text-[11px] font-semibold text-[#E83D6F] cursor-pointer hover:underline">
                View all
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.text)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#FFF0F3] border border-[#FFE4EC] hover:border-[#FF5983] rounded-2xl text-xs font-semibold text-[#2D1420] transition-all shadow-xs group"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#E83D6F] group-hover:scale-110 transition-transform" />
                    <span>{q.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Need help with something urgent? */}
          <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft">
            <h3 className="text-sm font-bold text-[#2D1420] mb-4">
              Need help with something urgent?
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {urgentCards.map((u, i) => {
                const Icon = u.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(u.query)}
                    className="p-3.5 bg-[#FFF7F9] hover:bg-[#FFE8EE] border border-[#FFE1E8] rounded-2xl text-left transition-all group flex flex-col justify-between"
                  >
                    <Icon className="w-4 h-4 text-[#E83D6F] mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-[#2D1420] leading-snug">
                      {u.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#FFE8EE] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#2D1420]">Still not sure?</p>
                <p className="text-[11px] text-[#7C6A75]">Talk to a verified healthcare professional.</p>
              </div>

              <button
                onClick={onNavigateEmergency}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Find a Doctor
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HEALTH SUMMARY + RECOMMENDATIONS */}
        <div className="lg:col-span-4 space-y-6">
          {/* Health Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2D1420]">Health Summary</h3>
              <span className="text-[10px] font-semibold text-[#8E7582] bg-[#FFF5F7] px-2 py-0.5 rounded-full">
                Last 4 months
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#FFF0F3] text-[#E83D6F] shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-xs text-[#2D1420] leading-relaxed">
                  Your cycles have been regular for the last 4 months.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#EDE7F6] text-[#7E57C2] shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-xs text-[#2D1420] leading-relaxed">
                  You usually experience cramps 2 days before your period.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E1F5FE] text-[#0288D1] shrink-0 mt-0.5">
                  <Droplet className="w-4 h-4" />
                </div>
                <p className="text-xs text-[#2D1420] leading-relaxed">
                  Your water intake improves significantly during the follicular phase.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onNavigateHormones}
                className="w-full py-2.5 bg-[#FFF0F3] hover:bg-[#FFE1E8] text-[#E83D6F] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                View Daily Hormone Plan
              </button>
            </div>
          </div>

          {/* Recommendations for You */}
          <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft space-y-3">
            <h3 className="text-sm font-bold text-[#2D1420] mb-2">Recommendations for You</h3>

            <div className="space-y-2">
              {/* Rec 1 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9FA] border border-[#FFE8EE] hover:border-[#FF5983] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#43A047]">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#2D1420]">Eat iron-rich foods</h5>
                    <p className="text-[11px] text-[#7C6A75]">Helps improve energy levels</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E7582]" />
              </div>

              {/* Rec 2 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9FA] border border-[#FFE8EE] hover:border-[#FF5983] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#E1F5FE] text-[#0288D1]">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#2D1420]">Drink more water</h5>
                    <p className="text-[11px] text-[#7C6A75]">Aim for 8 glasses daily</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E7582]" />
              </div>

              {/* Rec 3 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9FA] border border-[#FFE8EE] hover:border-[#FF5983] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FFF3E0] text-[#FB8C00]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#2D1420]">Walk for 20 minutes</h5>
                    <p className="text-[11px] text-[#7C6A75]">Improves mood and reduces cramps</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E7582]" />
              </div>

              {/* Rec 4 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9FA] border border-[#FFE8EE] hover:border-[#FF5983] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#EDE7F6] text-[#7E57C2]">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#2D1420]">Sleep before 11 PM</h5>
                    <p className="text-[11px] text-[#7C6A75]">Better sleep regulates hormones</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E7582]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
