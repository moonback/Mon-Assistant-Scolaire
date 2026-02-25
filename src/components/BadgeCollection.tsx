import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Lock, Sparkles, X, ChevronRight } from 'lucide-react';
import { BADGE_DEFINITIONS, Badge } from '../config/badges';

interface BadgeCollectionProps {
    earnedBadgeIds: string[];
}

export default function BadgeCollection({ earnedBadgeIds }: BadgeCollectionProps) {
    const [selectedBadge, setSelectedBadge] = React.useState<Badge | null>(null);

    const categories = Array.from(new Set(BADGE_DEFINITIONS.map(b => b.category)));

    return (
        <section className="space-y-8">
            <header className="mb-8">
                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 tracking-tight">
                    <Award className="h-7 w-7 text-indigo-600" /> Collection de Badges
                </h2>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                    {earnedBadgeIds.length} / {BADGE_DEFINITIONS.length} Badges débloqués sur ton parcours.
                </p>
            </header>

            <div className="space-y-10">
                {categories.map(category => (
                    <div key={category} className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50/50 w-fit px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                            {category === 'progression' ? '📊 Progression' :
                                category === 'consistency' ? '📅 Assiduité' :
                                    category === 'excellence' ? '✨ Excellence' :
                                        category === 'curiosity' ? '🔍 Curiosité' :
                                            category === 'social' ? '🤝 Social' : category}
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {BADGE_DEFINITIONS.filter(b => b.category === category).map((badge, idx) => {
                                const isEarned = earnedBadgeIds.includes(badge.id);
                                return (
                                    <motion.button
                                        key={badge.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        onClick={() => setSelectedBadge(badge)}
                                        whileHover={{ y: -5, scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`relative group p-4 rounded-3xl border-2 transition-all aspect-square flex flex-col items-center justify-center text-center ${isEarned
                                            ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-100/30'
                                            : 'bg-slate-50 border-slate-100 grayscale opacity-60'
                                            }`}
                                    >
                                        <div className={`text-4xl mb-2 transition-transform duration-500 ${isEarned ? 'group-hover:rotate-12 group-hover:scale-125' : ''}`}>
                                            {isEarned ? badge.icon : '🔒'}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter leading-tight ${isEarned ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {badge.name}
                                        </span>

                                        {isEarned && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                                <Sparkles className="h-2.5 w-2.5 text-white" />
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de détail du badge */}
            <AnimatePresence>
                {selectedBadge && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBadge(null)}
                            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed left-1/2 top-1/2 z-[70] w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[3rem] bg-white p-8 shadow-2xl"
                        >
                            <button
                                onClick={() => setSelectedBadge(null)}
                                className="absolute right-6 top-6 rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center">
                                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-indigo-50 text-6xl shadow-inner border-4 border-white">
                                    {selectedBadge.icon}
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                                    {selectedBadge.name}
                                </h3>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                                    Catégorie: {selectedBadge.category}
                                </div>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed mb-8">
                                    {selectedBadge.description}
                                </p>

                                {earnedBadgeIds.includes(selectedBadge.id) ? (
                                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest">
                                        <Sparkles className="h-4 w-4" /> BÉBLOQUÉ !
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 text-slate-400 p-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest">
                                        <Lock className="h-4 w-4" /> RESTE À DÉCOUVRIR
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </section>
    );
}
