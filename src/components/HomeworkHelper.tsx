import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, X, ChevronRight, Brain, Lightbulb, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askGemini } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';

interface HomeworkHelperProps {
    onEarnPoints?: (amount: number, activityType: string, subject?: string) => void | Promise<void>;
    gradeLevel?: string;
}

export default function HomeworkHelper({ onEarnPoints, gradeLevel = 'CM1' }: HomeworkHelperProps) {
    const { selectedChild } = useAuth();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) {
            setError('Prends une photo de ton exercice d\'abord !');
            return;
        }

        setLoading(true);
        setError('');
        setResponse('');

        try {
            const prompt = question || "Peux-tu m'aider à comprendre cet exercice ? Explique-moi les étapes sans me donner la réponse tout de suite.";
            const answer = await askGemini(prompt, 'homework', gradeLevel, selectedImage, undefined, selectedChild?.weak_points);
            setResponse(answer);
            onEarnPoints?.(15, 'homework', 'Général'); // Points for using the tool
        } catch (err) {
            setError("Le scanner magique a eu un petit souci. Réessaie !");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSelectedImage(null);
        setQuestion('');
        setResponse('');
        setError('');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="text-center space-y-4 pt-4">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-100"
                >
                    <Camera className="w-10 h-10" />
                </motion.div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Scanner Devoirs</h2>
                <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto leading-relaxed">
                    Prends ton exercice en photo et je t'aiderai à le comprendre comme un vrai tuteur !
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Side: Upload / Preview */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col gap-6"
                >
                    {!selectedImage ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-video rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm transition-colors">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <p className="font-black text-slate-400 group-hover:text-indigo-600">Clique pour ajouter une photo</p>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl group">
                                <img src={selectedImage} alt="Exercice" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                    <p className="text-white text-sm font-bold flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        Image prête pour l'analyse
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-widest px-2">
                                    Précise ta question (Optionnel)
                                </label>
                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Ex: Je ne comprends pas la question 2..."
                                    className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all font-bold resize-none h-32"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full magical-gradient text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-base disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                        <span>Analyse magique...</span>
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5" />
                                        <span>Aider à résoudre !</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 font-bold flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                            {error}
                        </div>
                    )}
                </motion.div>

                {/* Right Side: Response / Guidance */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {!response ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-50/50 rounded-[3rem] p-12 border border-slate-100 text-center flex flex-col items-center justify-center space-y-6 min-h-[400px]"
                            >
                                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-slate-200 shadow-sm">
                                    <Lightbulb className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-400">Prêt à t'aider !</h3>
                                    <p className="text-slate-400 font-semibold text-xs max-w-xs leading-relaxed">
                                        Une fois la photo analysée, je t'expliquerai la leçon et te donnerai des indices pour réussir.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[3rem] p-10 shadow-2xl border border-indigo-50 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Leçon & Indices</h3>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Guide du tuteur</p>
                                    </div>
                                </div>

                                <div className="prose prose-indigo max-w-none">
                                    <div className="whitespace-pre-wrap font-semibold text-slate-700 leading-relaxed text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        {response}
                                    </div>
                                </div>

                                <button
                                    onClick={reset}
                                    className="w-full mt-8 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                    Nouveau Scanner
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick Tips */}
                    <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-indigo-900 text-sm">Conseil de Magic</h4>
                            <p className="text-xs font-bold text-indigo-700/70 leading-relaxed">
                                Essaye de prendre la photo bien à plat et avec de la lumière pour que je puisse bien lire l'énoncé !
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
