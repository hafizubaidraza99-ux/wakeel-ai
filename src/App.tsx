/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Scale, User, Bot, Info, AlertTriangle, ShieldCheck, FileText, X, Copy, CheckCircle2, RefreshCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { streamMessage } from './services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const MarkdownComponent = ({ content, isUser }: { content: string, isUser: boolean }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/md">
      <div className={`markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:mb-2 ${isUser ? 'prose-invert prose-strong:text-white' : 'prose-strong:text-[#10b981]'}`}>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              
              if (!inline) {
                return (
                  <div className="relative my-6 group/code">
                    <div className="absolute right-4 top-4 z-20 opacity-0 group-hover/code:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(codeString)}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all shadow-xl"
                        title="Copy to clipboard"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-8 font-serif text-[14px] text-gray-900 whitespace-pre-wrap shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-x-auto leading-relaxed border-t-8 border-t-[#01411C] relative">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Scale className="w-16 h-16" />
                      </div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 opacity-20"></div>
                      {children}
                    </div>
                  </div>
                );
              }
              return <code className={`${isUser ? 'bg-white/20 text-white' : 'bg-white/10 text-emerald-400'} px-1.5 py-0.5 rounded text-[13px] font-mono`} {...props}>{children}</code>;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'Assalam-o-Alaikum! Main hoon **Wakeel AI**.\n\nMain aap ko Pakistan ke qanoon aur rules ke baray mein maloomat de sakta hoon. Chahe woh property ka mamla ho, landlord se jhagra ho, ya police ki karwai.\n\nMujhe batayein aap ko kya masla pesh aa raha hai?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDocMenuOpen, setIsDocMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const triggerSearch = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      role: 'model',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);

    try {
      let fullContent = '';
      const stream = streamMessage(history, text);
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === botMessageId ? { ...msg, content: fullContent } : msg
          )
        );
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    triggerSearch(input);
  };

  const startNewCase = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        content: 'Naya case start karte hain. Mushkil ki koi baat nahi, batayein ab kya masla hai?',
        timestamp: new Date(),
      },
    ]);
    setIsDocMenuOpen(false);
  };

  const handleDocTypeSelect = (type: string) => {
    setIsDocMenuOpen(false);
    triggerSearch(`Mujhe ek ${type} draft karke dein jo main submit kar sakun.`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-gray-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      
      {/* RGB Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rgb-glow bg-emerald-500/20" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rgb-glow bg-blue-500/20" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rgb-glow bg-purple-500/10" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-white/10 py-4 px-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="bg-emerald-600 p-2 rounded-2xl shadow-lg shadow-emerald-500/20 ring-1 ring-white/20"
          >
            <Scale className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              WAKEEL AI
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <p className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] uppercase">System Online</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startNewCase}
            className="p-2.5 rounded-xl transition-all border border-white/10 text-white/60 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 text-xs font-bold"
            title="Naya Case"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">New Case</span>
          </motion.button>

          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDocMenuOpen(!isDocMenuOpen)}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold border shadow-lg ${
                isDocMenuOpen 
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40' 
                  : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
              }`}
            >
              {isDocMenuOpen ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span className="hidden sm:inline">Legal Drafts</span>
            </motion.button>

            <AnimatePresence>
              {isDocMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-72 glass-panel rounded-2xl shadow-2xl z-[100] overflow-hidden p-1"
                >
                  <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">Select Draft Type</span>
                  </div>
                  <div className="grid grid-cols-1">
                    {[
                      { id: 'police', label: 'Police Application (Arzi)', icon: ShieldCheck, color: 'text-blue-400' },
                      { id: 'notice', label: 'Legal Notice (Notice)', icon: AlertTriangle, color: 'text-amber-400' },
                      { id: 'complaint', label: 'Formal Complaint', icon: FileText, color: 'text-purple-400' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleDocTypeSelect(item.label)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition-all text-sm group rounded-xl"
                      >
                        <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-emerald-950/40 border-b border-white/5 py-2.5 px-6 flex items-center gap-3 text-emerald-400/90 text-[11px] sm:text-xs relative z-40 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
        <p>
          <span className="font-bold text-emerald-500 uppercase tracking-wider">Aagahi:</span> Main licensed wakeel nahi hoon. Mashwaray par qanooni action se pehle wakeel se baat karein.
        </p>
      </div>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
          <AnimatePresence initial={false}>
            {messages.map((message, idx) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[90%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-500 border-blue-400 text-white shadow-blue-500/20' 
                      : 'bg-[#01411C] border-emerald-500/30 text-emerald-400 shadow-emerald-500/20'
                  }`}>
                    {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  
                  <div className={`relative p-5 rounded-[2rem] shadow-xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'glass-panel text-gray-100 rounded-tl-none border-white/10'
                  } ${message.role === 'model' && message.content === '' ? 'min-w-[150px]' : ''}`}>
                    
                    {/* Shadow/Glow for AI */}
                    {message.role === 'model' && (
                      <div className="absolute inset-0 bg-emerald-500/5 rounded-[2rem] blur-xl -z-10 pointer-events-none opacity-50" />
                    )}

                    <MarkdownComponent content={message.content} isUser={message.role === 'user'} />
                    
                    {/* Typing Animation for empty model messages */}
                    {message.role === 'model' && message.content === '' && (
                      <div className="flex gap-1.5 py-2">
                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      </div>
                    )}

                    <div className={`text-[10px] mt-3 block font-mono font-medium opacity-40 uppercase tracking-widest ${message.role === 'user' ? 'text-blue-100' : 'text-emerald-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && messages[messages.length - 1]?.content !== '' && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex justify-start ml-14"
             >
               <div className="flex items-center gap-3 text-emerald-400/60 text-xs font-bold tracking-widest uppercase italic">
                 <div className="w-8 h-px bg-gradient-to-r from-transparent to-emerald-500/50" />
                 Likh raha hai
                 <span className="cursor-blink"></span>
               </div>
             </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick Start Chips */}
      <AnimatePresence>
        {messages.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-8 max-w-4xl mx-auto w-full z-20"
          >
            <div className="flex flex-wrap gap-2.5 justify-center">
              {[
                'Landlord security wapis nahi de raha',
                'Property registry ka procedure',
                'FIR kaisay katwani hai?',
                'Cheque bounce ho gaya hai',
              ].map((text) => (
                <motion.button
                  key={text}
                  whileHover={{ scale: 1.05, borderColor: '#10b981', background: 'rgba(16,185,129,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => triggerSearch(text)}
                  className="text-[11px] sm:text-[13px] font-medium bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl transition-all text-gray-300 shadow-xl backdrop-blur-md"
                >
                  {text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-6 relative z-50">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar line when loading */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[2px] bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 mb-4 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            )}
          </AnimatePresence>

          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <div className="relative flex-1 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Yahan apna sawal likhein (e.g. Police ke khilaf complaint kaisay karein?)"
                className="relative w-full glass-panel bg-white/10 border-white/10 rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm sm:text-base text-white placeholder-white/30"
                disabled={isLoading}
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(16,185,129,0.4)" }}
              whileTap={{ scale: 0.95 }}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-500/20 ring-1 ring-white/10"
            >
              <Send className="w-6 h-6" />
            </motion.button>
          </form>
          <p className="text-[10px] sm:text-[11px] text-center text-white/30 mt-4 uppercase tracking-[0.2em] font-black">
            Powered by Gemini 3.0 • Secure Legal Awareness System
          </p>
        </div>
      </div>
    </div>
  );
}
