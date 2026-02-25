import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Volume2, Wifi, WifiOff, AlertCircle, Radio } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';

interface GeminiLiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemPrompt: string;
}

export default function GeminiLiveModal({ isOpen, onClose, systemPrompt }: GeminiLiveModalProps) {
    const { status, aiTranscript, userTranscript, errorMessage, connect, disconnect } = useGeminiLive();
    const aiScrollRef = useRef<HTMLDivElement>(null);

    // Connect when modal opens, disconnect when it closes
    useEffect(() => {
        if (isOpen) {
            connect(systemPrompt);
        } else {
            disconnect();
        }
    }, [isOpen]); // intentionally only on isOpen change

    // Auto-scroll transcript
    useEffect(() => {
        if (aiScrollRef.current) {
            aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
        }
    }, [aiTranscript]);

    const handleClose = () => {
        disconnect();
        onClose();
    };

    const statusConfig: Record<string, { label: string; color: string; textColor: string; icon: any }> = {
        idle: { label: 'Déconnecté', color: 'bg-slate-400', textColor: 'text-slate-500', icon: WifiOff },
        connecting: { label: 'Connexion en cours...', color: 'bg-amber-400', textColor: 'text-amber-600', icon: Wifi },
        connected: { label: 'Activation du micro...', color: 'bg-teal-400', textColor: 'text-teal-600', icon: Wifi },
        listening: { label: 'Je t\'écoute...', color: 'bg-indigo-500', textColor: 'text-indigo-600', icon: Mic },
        speaking: { label: 'L\'IA répond...', color: 'bg-emerald-500', textColor: 'text-emerald-600', icon: Volume2 },
        error: { label: 'Erreur', color: 'bg-red-400', textColor: 'text-red-600', icon: AlertCircle },
    };

    const cfg = statusConfig[status];
    const StatusIcon = cfg.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && handleClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white">
                            <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                                <X className="h-4 w-4" />
                            </button>
                            <h2 className="text-lg font-black tracking-tight mb-1">Conversation IA Vocale</h2>
                            <p className="text-xs text-white/70 font-medium">Powered by Gemini Live</p>

                            {/* Animated visualizer */}
                            <div className="flex items-center justify-center gap-1 mt-5 h-12">
                                {status === 'speaking' ? (
                                    Array.from({ length: 7 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 bg-white rounded-full"
                                            animate={{ height: ['8px', `${20 + Math.random() * 24}px`, '8px'] }}
                                            transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.07 }}
                                        />
                                    ))
                                ) : status === 'listening' ? (
                                    Array.from({ length: 7 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 bg-white/50 rounded-full"
                                            animate={{ height: ['6px', `${10 + Math.random() * 14}px`, '6px'] }}
                                            transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.1 }}
                                        />
                                    ))
                                ) : status === 'connecting' ? (
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center"
                                    >
                                        <Radio className="h-4 w-4 text-white" />
                                    </motion.div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <MicOff className="h-4 w-4 text-white/50" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className="px-6 pt-4 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cfg.color} ${status === 'listening' || status === 'speaking' ? 'animate-pulse' : ''}`} />
                            <span className={`text-xs font-black uppercase tracking-widest ${cfg.textColor}`}>
                                <StatusIcon className="h-3 w-3 inline mr-1" />{cfg.label}
                            </span>
                        </div>

                        {/* Error */}
                        {status === 'error' && (
                            <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start justify-between gap-3">
                                <p className="text-xs text-red-700 font-bold flex-1">{errorMessage}</p>
                                <button
                                    onClick={() => connect(systemPrompt)}
                                    className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700 transition"
                                >
                                    Réessayer
                                </button>
                            </div>
                        )}

                        {/* Transcripts */}
                        <div className="p-6 space-y-3 max-h-72 overflow-y-auto" ref={aiScrollRef}>
                            {!aiTranscript && !userTranscript && status !== 'error' && (
                                <p className="text-center text-sm text-slate-400 font-medium py-6 italic">
                                    {status === 'connecting' ? 'Connexion en cours...' : 'Parle maintenant, je t\'écoute ! 🎙️'}
                                </p>
                            )}

                            {/* User speech */}
                            <AnimatePresence>
                                {userTranscript && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex justify-end"
                                    >
                                        <div className="max-w-[80%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                                            <p className="text-[10px] font-black uppercase text-white/60 mb-1">Toi</p>
                                            <p className="text-sm font-medium leading-relaxed">{userTranscript}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* AI response */}
                            <AnimatePresence>
                                {aiTranscript && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex justify-start"
                                    >
                                        <div className="max-w-[80%] bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Assistant IA</p>
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{aiTranscript}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6">
                            <button
                                onClick={handleClose}
                                className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition"
                            >
                                Terminer la conversation
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
