import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Book,
    Calendar,
    Star,
    ChevronRight,
    Trophy,
    BookOpen,
    X,
    Clock,
    Sparkles,
    Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storyService, SavedStory } from '../services/storyService';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';

export default function ChildPortfolio() {
    const { selectedChild } = useAuth();
    const [stories, setStories] = useState<SavedStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStory, setSelectedStory] = useState<SavedStory | null>(null);

    useEffect(() => {
        if (selectedChild) {
            loadStories();
        }
    }, [selectedChild]);

    const loadStories = async () => {
        setLoading(true);
        try {
            const data = await storyService.getStoriesByChild(selectedChild!.id);
            setStories(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">Ouverture de ton grimoire...</p>
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-100"
            >
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <BookOpen className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Ton portfolio est tout neuf !</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium mb-8">
                    Tu n'as pas encore publié d'histoires. Va au Lab d'Écriture pour créer ton premier chef-d'œuvre !
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-amber-500 fill-amber-500" /> Mon Portfolio d'Auteur
                    </h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                        {stories.length} {stories.length > 1 ? 'Livres publiés' : 'Livre publié'}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story, idx) => (
                    <motion.div
                        key={story.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <button
                            onClick={() => setSelectedStory(story)}
                            className="w-full text-left group"
                        >
                            <AppCard className="group-hover:border-indigo-200 group-hover:shadow-xl group-hover:-translate-y-2 transition-all p-0 overflow-hidden h-full border-slate-100 shadow-sm flex flex-col">
                                <div className="p-6 pb-2 space-y-4 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Book className="w-6 h-6" />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span className="text-[10px] font-black text-amber-700">{story.points}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                                            {story.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-md">{story.genre}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <Clock className="w-3 h-3" />
                                            {new Date(story.created_at!).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Lire mon livre</span>
                                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </AppCard>
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Story Viewer Modal */}
            <AnimatePresence>
                {selectedStory && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStory(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl flex flex-col h-full max-h-[90vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <header className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedStory.title}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedStory.genre}</span>
                                            <span className="text-slate-200">|</span>
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{selectedStory.points} Points</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStory(null)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </header>

                            {/* Story Content */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
                                {Array.isArray(selectedStory.content) && selectedStory.content.map((scene: any, idx: number) => (
                                    <div key={idx} className="relative group">
                                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-100 rounded-full group-hover:bg-indigo-200 transition-colors" />

                                        <div className="flex justify-center -mb-8 relative z-20">
                                            <div className="w-16 h-16 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                                                {scene.illustration}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-3xl p-8 pt-10 border border-slate-100/50">
                                            <div className="mb-6 pb-6 border-b border-slate-200/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ma plume :</span>
                                                </div>
                                                <p className="text-lg font-bold text-slate-700 italic leading-relaxed">"{scene.childText}"</p>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Réponse de l'IA :</span>
                                            </div>
                                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-[1.8] whitespace-pre-wrap">
                                                {scene.aiResponse}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Modal Footer */}
                            <footer className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center shrink-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Fin de ton incroyable voyage <Sparkles className="w-3 h-3" />
                                </p>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
