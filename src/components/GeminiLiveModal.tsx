import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Volume2, Wifi, WifiOff, AlertCircle, Sparkles, User, Bot, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useGeminiLive, LiveMessage } from '../hooks/useGeminiLive';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GeminiLiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemPrompt: string;
}

export default function GeminiLiveModal({ isOpen, onClose, systemPrompt }: GeminiLiveModalProps) {
    const { status, messages, errorMessage, connect, disconnect } = useGeminiLive();
    const [showTranscription, setShowTranscription] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            connect(systemPrompt);
        } else {
            disconnect();
            setShowTranscription(false);
        }
    }, [isOpen, systemPrompt, connect, disconnect]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current && showTranscription) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, status, showTranscription]);

    if (!isOpen) return null;

    const statusConfig: Record<string, { label: string; color: string; textColor: string; icon: any }> = {
        idle: { label: 'Déconnecté', color: 'bg-slate-400', textColor: 'text-slate-500', icon: WifiOff },
        connecting: { label: 'Connexion en cours...', color: 'bg-amber-400', textColor: 'text-amber-600', icon: Wifi },
        connected: { label: 'Activation du micro...', color: 'bg-teal-400', textColor: 'text-teal-600', icon: Wifi },
        listening: { label: 'Je t\'écoute...', color: 'bg-indigo-500', textColor: 'text-indigo-600', icon: Mic },
        speaking: { label: 'L\'IA te répond...', color: 'bg-emerald-500', textColor: 'text-emerald-600', icon: Volume2 },
        error: { label: 'Oups ! Petit souci', color: 'bg-red-400', textColor: 'text-red-600', icon: AlertCircle },
    };

    const cfg = statusConfig[status] || statusConfig.idle;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-500"
                    style={{ maxHeight: showTranscription ? '90vh' : 'auto' }}
                >
                    {/* Premium Header */}
                    <div className="relative p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden shrink-0">
                        {/* Abstract decors */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-400/20 rounded-full translate-y-12 -translate-x-8 blur-xl" />

                        <div className="relative flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl shadow-inner border border-white/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight leading-none mb-1">Conversation Magique</h2>
                                    <p className="text-sm text-indigo-100 font-medium">Propulsé par Gemini Live</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowTranscription(!showTranscription)}
                                    className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${showTranscription
                                            ? 'bg-white text-indigo-600 shadow-lg'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        } border border-white/10`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {showTranscription ? 'Masquer texte' : 'Voir texte'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 border border-white/10"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Animated Visualizer Bars */}
                        <div className="flex items-end justify-center gap-1 h-12 mt-6">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={status === 'speaking' || status === 'listening' ? {
                                        height: [12, 32, 16, 40, 20, 12][i % 6] * (status === 'speaking' ? 1.2 : 0.8),
                                        opacity: [0.4, 1, 0.6][i % 3]
                                    } : { height: 8, opacity: 0.3 }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        delay: i * 0.1,
                                        ease: "easeInOut"
                                    }}
                                    className="w-1.5 bg-white rounded-full transition-all duration-300"
                                />
                            ))}
                        </div>

                        {/* Status Chip (always visible) */}
                        <div className="flex justify-center mt-6">
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 transition-colors duration-500`}>
                                <cfg.icon className={`w-3.5 h-3.5 text-white ${status === 'listening' ? 'animate-pulse' : ''}`} />
                                <span className={`text-[10px] uppercase tracking-widest font-black text-white`}>
                                    {cfg.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area (Hidden by default) */}
                    <AnimatePresence>
                        {showTranscription && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: '400px', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden flex flex-col bg-slate-50/50"
                            >
                                <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                                    {messages.length === 0 && status !== 'error' && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50 py-12">
                                            <Mic className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium italic">Dis quelque chose pour commencer...</p>
                                        </div>
                                    )}

                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            key={idx}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
                                        >
                                            <div className={`flex items-start max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border ${msg.role === 'user'
                                                    ? 'bg-white border-indigo-100 text-indigo-500'
                                                    : 'bg-indigo-600 border-indigo-700 text-white'
                                                    }`}>
                                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                </div>
                                                <div className={`p-4 rounded-2xl shadow-sm overflow-hidden prose prose-sm max-w-none ${msg.role === 'user'
                                                    ? 'bg-indigo-50 text-indigo-900 rounded-tr-none'
                                                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                                    }`}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.text}
                                                    </ReactMarkdown>
                                                    {msg.isStreaming && (
                                                        <span className="inline-block w-1 h-3 ml-1 bg-indigo-400 animate-pulse rounded-full" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error state (Always clickable if there is an error) */}
                    {status === 'error' && (
                        <div className="p-4 bg-red-50 border-t border-red-100 flex items-start gap-3 shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-700 font-bold mb-2">{errorMessage}</p>
                                <button
                                    onClick={() => connect(systemPrompt)}
                                    className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl hover:bg-red-700 transition shadow-sm active:scale-95"
                                >
                                    Réessayer la connexion
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Controls */}
                    <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
                        <button
                            onClick={onClose}
                            className="group relative flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-sm hover:bg-slate-800 transition-all duration-300 shadow-xl active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            TERMINER LA CONVERSATION
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
