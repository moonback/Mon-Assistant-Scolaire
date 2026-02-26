import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mic, Volume2, Wifi, WifiOff, AlertCircle,
    Sparkles, User, Bot, MessageSquare, RefreshCw, Loader2,
} from 'lucide-react';
import { useGeminiLive, LiveMessage } from '../hooks/useGeminiLive';
import { audioFeedback } from '../services/audioFeedback';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GeminiLiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemPrompt: string;
    onSave?: (question: string, response: string) => void;
}

// ── Barres visualiseur pré-calculées — stable, aucun Math.random dans le render ──
const VISUALIZER_BARS = Array.from({ length: 22 }, (_, i) => ({
    baseHeight: 3,
    peakHeight: 12 + Math.sin(i * 0.72) * 16 + (i % 4) * 3,
    delay: i * 0.038,
    duration: 0.30 + (i % 6) * 0.055,
}));

// ── Config des états — labels adaptés enfants ──
const STATUS_CONFIG: Record<string, {
    label: string;
    sublabel: string;
    icon: React.ElementType;
    pulseIcon: boolean;
    barColor: string;
}> = {
    idle:       { label: 'En veille',           sublabel: 'La conversation va démarrer…',    icon: WifiOff,   pulseIcon: false, barColor: 'bg-white/40'     },
    connecting: { label: 'Je me réveille…',     sublabel: 'Connexion en cours…',             icon: Wifi,      pulseIcon: true,  barColor: 'bg-white/40'     },
    listening:  { label: 'Je t\'écoute !',      sublabel: 'Parle, je suis tout ouïe 👂',     icon: Mic,       pulseIcon: true,  barColor: 'bg-white'        },
    processing: { label: 'Je réfléchis…',       sublabel: 'Hm, bonne question !',            icon: Loader2,   pulseIcon: false, barColor: 'bg-amber-300'    },
    speaking:   { label: 'Je te réponds !',     sublabel: 'Écoute bien… 🎙️',               icon: Volume2,   pulseIcon: false, barColor: 'bg-emerald-300'  },
    error:      { label: 'Oups, petit souci !', sublabel: 'On va régler ça ensemble',        icon: AlertCircle, pulseIcon: false, barColor: 'bg-red-300'   },
};

// Couleurs de bordure selon l'état
function getBorderClass(s: string) {
    if (s === 'speaking')   return 'border-emerald-300/70';
    if (s === 'processing') return 'border-amber-300/70';
    if (s === 'listening')  return 'border-indigo-300/70';
    return 'border-transparent';
}

// Glow selon l'état
function getGlowStyle(s: string): React.CSSProperties {
    if (s === 'speaking')   return { boxShadow: '0 0 50px -10px rgba(16,185,129,0.35)' };
    if (s === 'processing') return { boxShadow: '0 0 50px -10px rgba(245,158,11,0.30)' };
    return {};
}

export default function GeminiLiveModal({ isOpen, onClose, systemPrompt, onSave }: GeminiLiveModalProps) {
    const geminiLive = useGeminiLive();
    const { status, messages, errorMessage, latency, connect, disconnect, setOnConversationFinished } = geminiLive;
    const [showTranscription, setShowTranscription] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevStatusRef = useRef(status);

    // ── Connexion/déconnexion ──
    useEffect(() => {
        if (isOpen) {
            connect(systemPrompt);
        } else {
            disconnect();
            setShowTranscription(false);
        }
    }, [isOpen, systemPrompt, connect, disconnect]);

    useEffect(() => {
        if (onSave) setOnConversationFinished(onSave);
    }, [onSave, setOnConversationFinished]);

    // ── Sons d'interface sur transitions d'état ──
    useEffect(() => {
        const prev = prevStatusRef.current;
        prevStatusRef.current = status;
        if (prev === status) return;

        // Bip d'activation micro
        if (status === 'listening' && (prev === 'connecting' || prev === 'speaking')) {
            audioFeedback.listeningStart();
        }
        // Bip de fin de parole utilisateur (transition vers traitement)
        if (status === 'processing' && prev === 'listening') {
            audioFeedback.listeningEnd();
        }
        // Son d'erreur doux
        if (status === 'error') {
            audioFeedback.softError();
        }
    }, [status]);

    // ── Auto-scroll sur nouveaux messages ──
    useEffect(() => {
        if (scrollRef.current && showTranscription) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, status, showTranscription]);

    if (!isOpen) return null;

    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;
    const isActive = status === 'speaking' || status === 'listening' || status === 'processing';
    const IconComponent = cfg.icon;

    // Message d'erreur simplifié pour les enfants
    const friendlyError = errorMessage.toLowerCase().includes('micro') ||
        errorMessage.toLowerCase().includes('accès') ||
        errorMessage.toLowerCase().includes('permission')
        ? "Il faut autoriser le microphone dans ton navigateur pour me parler !"
        : "Vérifie ta connexion internet et réessaie !";

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

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 24 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                    className={`relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border-4 transition-colors duration-500 ${getBorderClass(status)}`}
                    style={{
                        maxHeight: showTranscription ? '90vh' : 'auto',
                        ...getGlowStyle(status),
                    }}
                >
                    {/* Header */}
                    <div className="relative p-6 pb-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden shrink-0">
                        {/* Décors abstraits */}
                        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-18 translate-x-16 blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-28 h-28 bg-pink-400/20 rounded-full translate-y-14 -translate-x-8 blur-xl pointer-events-none" />

                        <div className="relative flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-lg rounded-xl shadow-inner border border-white/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight leading-none mb-0.5">
                                        Conversation Magique
                                    </h2>
                                    <p className="text-xs text-indigo-100 font-semibold">Propulsé par Gemini Live ✨</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowTranscription(!showTranscription)}
                                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-300 border border-white/10 ${
                                        showTranscription
                                            ? 'bg-white text-indigo-600 shadow-md'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {showTranscription ? 'Masquer' : 'Voir texte'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Visualiseur audio — barres pré-calculées */}
                        <div className="flex items-end justify-center gap-[3px] h-14 mt-5">
                            {VISUALIZER_BARS.map((bar, i) => (
                                <motion.div
                                    key={i}
                                    animate={isActive ? {
                                        height: [bar.baseHeight, bar.peakHeight, bar.baseHeight + 2],
                                        opacity: [0.4, 1, 0.55],
                                    } : {
                                        height: 3,
                                        opacity: 0.2,
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: bar.duration,
                                        delay: bar.delay,
                                        ease: 'easeInOut',
                                    }}
                                    className={`w-1.5 rounded-full transition-colors duration-500 ${
                                        status === 'speaking'   ? 'bg-emerald-300' :
                                        status === 'processing' ? 'bg-amber-300'   :
                                        'bg-white'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Chip d'état — animé sur chaque changement */}
                        <div className="flex flex-col items-center gap-2 mt-4">
                            <motion.div
                                key={status}
                                initial={{ opacity: 0, scale: 0.88, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30"
                            >
                                <IconComponent
                                    className={`w-3.5 h-3.5 text-white ${
                                        cfg.pulseIcon ? 'animate-pulse' :
                                        status === 'processing' ? 'animate-spin' : ''
                                    }`}
                                />
                                <span className="text-[11px] uppercase tracking-widest font-black text-white">
                                    {cfg.label}
                                </span>
                            </motion.div>

                            <motion.p
                                key={`sub-${status}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[11px] text-white/65 font-medium"
                            >
                                {cfg.sublabel}
                            </motion.p>

                            {/* Latence — visible uniquement en développement */}
                            {import.meta.env.DEV && latency > 0 && status !== 'idle' && (
                                <div className="text-[9px] font-mono text-white/30">{latency}ms</div>
                            )}
                        </div>
                    </div>

                    {/* Zone de transcription */}
                    <AnimatePresence>
                        {showTranscription && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: '340px', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                                className="overflow-hidden flex flex-col bg-slate-50/70"
                            >
                                <div className="flex-1 overflow-y-auto p-5 space-y-3" ref={scrollRef}>
                                    {messages.length === 0 && status !== 'error' && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                                            <Mic className="w-7 h-7 mb-2 opacity-30" />
                                            <p className="text-sm font-semibold text-slate-400/80">
                                                Parle pour commencer !
                                            </p>
                                        </div>
                                    )}

                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex items-start max-w-[86%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center shadow-sm border ${
                                                    msg.role === 'user'
                                                        ? 'bg-white border-indigo-100 text-indigo-500'
                                                        : 'bg-indigo-600 border-indigo-700 text-white'
                                                }`}>
                                                    {msg.role === 'user'
                                                        ? <User className="w-3.5 h-3.5" />
                                                        : <Bot className="w-3.5 h-3.5" />
                                                    }
                                                </div>
                                                <div className={`px-3.5 py-2.5 rounded-xl shadow-sm text-sm leading-relaxed ${
                                                    msg.role === 'user'
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

                    {/* Panel d'erreur — bienveillant pour les enfants */}
                    {status === 'error' && (
                        <div className="p-4 bg-orange-50 border-t border-orange-100 flex items-start gap-3 shrink-0">
                            <span className="text-2xl shrink-0 mt-0.5">🔧</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-orange-800 mb-1">Petit souci technique !</p>
                                <p className="text-xs text-orange-600 mb-3">{friendlyError}</p>
                                <button
                                    onClick={() => connect(systemPrompt)}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95 shadow-sm"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-5 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
                        <button
                            onClick={onClose}
                            className="group relative flex items-center gap-2.5 px-7 py-3.5 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all duration-300 shadow-lg active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                            Terminer la conversation
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
