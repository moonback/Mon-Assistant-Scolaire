import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, X, ChevronRight, Brain, Lightbulb, BookOpen, RefreshCw, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askGemini } from '../services/gemini';

interface HomeworkHelperProps {
    onEarnPoints?: (amount: number) => void;
    gradeLevel?: string;
}

export default function HomeworkHelper({ onEarnPoints, gradeLevel = 'CM1' }: HomeworkHelperProps) {
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
            const answer = await askGemini(prompt, 'homework', gradeLevel, selectedImage);
            setResponse(answer);
            onEarnPoints?.(15); // Points for using the tool
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
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <header className="text-center space-y-4 pt-4 relative">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200 relative z-10"
                >
                    <Camera className="w-12 h-12" />
                    <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                </motion.div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight">Scanner <span className="text-indigo-600">Magique</span></h2>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">L&apos;IA au service de tes devoirs</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Side: Upload / Preview */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-12 xl:col-span-5 space-y-8"
                >
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3.5rem] p-8 lg:p-10 shadow-premium border border-white/50">
                            {!selectedImage ? (
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-video rounded-[2.5rem] bg-slate-50/50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition-all group overflow-hidden relative shadow-inner"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                        <ImageIcon className="w-10 h-10" />
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <p className="font-black text-slate-600 uppercase tracking-widest text-xs mb-1">Clique pour scanner</p>
                                        <p className="text-[10px] font-bold text-slate-400">Prends ton exercice en photo</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </motion.div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl group/img">
                                        <img src={selectedImage} alt="Exercice" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 group-hover/img:bg-black/10 transition-colors" />
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-md text-red-500 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-red-500 hover:text-white transition-all border border-white/50"
                                        >
                                            <X className="w-6 h-6" />
                                        </motion.button>
                                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                            <p className="text-white font-black flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="uppercase tracking-[0.2em] text-[10px]">Image prête pour analyse magique</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                Ta Question Particulière
                                            </label>
                                        </div>
                                        <textarea
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            placeholder="Ex: Je ne comprends pas la question 2 du problème..."
                                            className="w-full p-8 rounded-[2rem] bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white focus:ring-[12px] focus:ring-indigo-50/50 outline-none transition-all font-bold resize-none h-40 text-lg placeholder:text-slate-300 shadow-inner"
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full h-20 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center gap-4 transition-all relative overflow-hidden group/btn disabled:opacity-50"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="relative z-10 flex items-center gap-4">
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="w-7 h-7 animate-spin" />
                                                    <span className="uppercase tracking-[0.2em] text-xs">Analyse du cerveau magique...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Brain className="w-7 h-7" />
                                                    <span className="uppercase tracking-[0.2em] text-xs">Aide-moi à comprendre</span>
                                                </>
                                            )}
                                        </span>
                                    </motion.button>
                                </div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-6 bg-red-50/50 border border-red-100 rounded-[2rem] text-red-600 font-black flex items-center gap-4"
                                >
                                    <div className="p-2 bg-red-100 rounded-xl">
                                        <X className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm">{error}</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Response / Guidance */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                    <AnimatePresence mode="wait">
                        {!response ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-slate-50/30 backdrop-blur-sm rounded-[3.5rem] p-16 border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-8 min-h-[500px]"
                            >
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-white flex items-center justify-center text-slate-200 shadow-premium border border-slate-100">
                                        <Lightbulb className="w-16 h-16" />
                                    </div>
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white"
                                    >
                                        <Sparkles className="w-6 h-6 fill-current" />
                                    </motion.div>
                                </div>
                                <div className="space-y-4 max-w-sm">
                                    <h3 className="text-2xl font-black text-slate-400 tracking-tight">Prêt à t&apos;éclairer !</h3>
                                    <p className="text-slate-400 font-bold leading-relaxed">
                                        Envoie-moi une photo de ton exercice. Je t&apos;expliquerai la leçon derrière et je te guiderai vers la solution pas à pas !
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[3.5rem] blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
                                <div className="relative bg-white/95 backdrop-blur-2xl rounded-[3.5rem] p-10 lg:p-14 shadow-premium border border-white/50"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Indices Magiques</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Le scanner a parlé !</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-indigo-50/50 px-6 py-3 rounded-2xl border border-indigo-100/50 shadow-sm">
                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            <span className="text-indigo-900 font-black text-xs uppercase tracking-[0.2em]">Expédition Réussie +15</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/10 rounded-full" />
                                        <div className="pl-10">
                                            <div className="prose prose-xl prose-indigo max-w-none whitespace-pre-wrap font-bold text-slate-700 leading-relaxed tracking-tight">
                                                {response}
                                            </div>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={reset}
                                        className="w-full mt-14 h-16 border-2 border-slate-100 rounded-3xl text-slate-400 font-black hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Nouveau Scanner Magique
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 flex items-start gap-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                                <Sparkles className="w-8 h-8 text-amber-300" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-black text-xl tracking-tight">Le Secret du Scanner</h4>
                                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                                    Prends ta photo bien au-dessus de ta feuille, sans ombre, pour que mon oeil magique puisse lire chaque détail de ton exercice !
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
