import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    BookOpen,
    Wand2,
    Send,
    Sparkles,
    RefreshCw,
    CheckCircle2,
    Save,
    Volume2,
    StopCircle,
    Star,
    Ghost,
    Rocket,
    Sword,
    Baby,
    ArrowRight
} from 'lucide-react';
import { askGemini } from '../services/gemini';
import { storyService } from '../services/storyService';
import { useAuth } from '../contexts/AuthContext';
import { useSpeechSynthesis } from '../hooks/useSpeech';
import confetti from 'canvas-confetti';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';

interface Scene {
    childText: string;
    aiResponse: string;
    illustration: string;
    magicWordsUsed: string[];
}

const GENRES = [
    { id: 'fantasy', label: 'Fantastique', icon: Sword, color: 'bg-amber-100 text-amber-600', emoji: '🏰' },
    { id: 'sci-fi', label: 'Espace', icon: Rocket, color: 'bg-blue-100 text-blue-600', emoji: '🚀' },
    { id: 'mystery', label: 'Mystère', icon: Ghost, color: 'bg-purple-100 text-purple-600', emoji: '🔍' },
    { id: 'animals', label: 'Animaux', icon: Baby, color: 'bg-emerald-100 text-emerald-600', emoji: '🐘' },
];

export default function CreativeWriting() {
    const { selectedChild } = useAuth();
    const { speak, stop, isSpeaking } = useSpeechSynthesis();

    const [scenes, setScenes] = useState<Scene[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [title, setTitle] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<typeof GENRES[0] | null>(null);
    const [heroName, setHeroName] = useState('');
    const [creativePoints, setCreativePoints] = useState(0);
    const [lastMagicWords, setLastMagicWords] = useState<string[]>([]);
    const [isSaved, setIsSaved] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [scenes]);

    const startStory = async () => {
        if (!selectedGenre || !heroName.trim()) return;

        setLoading(true);
        const initialPrompt = `Lance une nouvelle histoire dans le genre ${selectedGenre.label}. Le héros s'appelle ${heroName}. 
        Donne une accroche captivante et propose 2 mots magiques à utiliser.`;

        try {
            const resp = await askGemini(initialPrompt, 'writing_lab', selectedChild?.grade_level || 'CM1');

            // Extract magic words from AI response (simple regex)
            const wordsMatch = resp.match(/Mots Magiques\s*:\s*\*?([^*,\n]+)\*?,\s*\*?([^*,\n]+)\*?/i);
            const words = wordsMatch ? [wordsMatch[1].trim(), wordsMatch[2].trim()] : [];
            setLastMagicWords(words);

            setScenes([{
                childText: `Voici l'aventure de ${heroName} !`,
                aiResponse: resp,
                illustration: selectedGenre.emoji,
                magicWordsUsed: []
            }]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlesubmit = async () => {
        if (!currentInput.trim() || loading) return;

        setLoading(true);
        const userInput = currentInput;
        setCurrentInput('');

        // Detect if magic words were used
        const usedThisTime = lastMagicWords.filter(word =>
            userInput.toLowerCase().includes(word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        );

        if (usedThisTime.length > 0) {
            setCreativePoints(prev => prev + (usedThisTime.length * 50));
        }
        setCreativePoints(prev => prev + 10); // Base points for writing

        // Build context from previous scenes
        const history = scenes.map(s => `Enfant: ${s.childText}\nIA: ${s.aiResponse}`).join('\n');
        const fullPrompt = `HISTORIQUE :\n${history}\n\nL'enfant continue avec : "${userInput}". 
        ${usedThisTime.length > 0 ? `Il a utilisé les mots magiques : ${usedThisTime.join(', ')}. Félicite-le !` : ''}
        Réagis, relance l'histoire et propose 2 NOUVEAUX mots magiques.`;

        try {
            const aiResp = await askGemini(fullPrompt, 'writing_lab', selectedChild?.grade_level || 'CM1');

            // Extract new magic words
            const wordsMatch = aiResp.match(/Mots Magiques\s*:\s*\*?([^*,\n]+)\*?,\s*\*?([^*,\n]+)\*?/i);
            const words = wordsMatch ? [wordsMatch[1].trim(), wordsMatch[2].trim()] : [];
            setLastMagicWords(words);

            const emojis = ['🌟', '🐉', '🏰', '🚀', '🐱', '🌳', '🌊', '🔥', '💎', '🎨'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

            setScenes(prev => [...prev, {
                childText: userInput,
                aiResponse: aiResp,
                illustration: randomEmoji,
                magicWordsUsed: usedThisTime
            }]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const finishStory = async () => {
        setLoading(true);
        const history = scenes.map(s => `Enfant: ${s.childText}\nIA: ${s.aiResponse}`).join('\n');
        const prompt = `HISTORIQUE :\n${history}\n\nL'histoire est finie ! Trouve un titre MAGNIFIQUE pour ce livre de ${selectedChild?.grade_level}. Réponds UNIQUEMENT le titre.`;

        try {
            const storyTitle = await askGemini(prompt, 'writing_lab', selectedChild?.grade_level || 'CM1');
            setTitle(storyTitle.replace(/[*_#"]+/g, ''));
            setIsFinished(true);
            setCreativePoints(prev => prev + 200); // Completion bonus
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const resetStory = () => {
        setScenes([]);
        setCurrentInput('');
        setIsFinished(false);
        setTitle('');
        setSelectedGenre(null);
        setHeroName('');
        setLastMagicWords([]);
        setIsSaved(false);
        stop();
    };

    const saveToPortfolio = async () => {
        if (isSaved || !title || !selectedChild) return;

        setLoading(true);
        try {
            await storyService.saveStory({
                child_id: selectedChild.id,
                title,
                genre: selectedGenre?.label || 'Inconnu',
                content: scenes,
                points: creativePoints
            });
            setIsSaved(true);
            confetti({
                particleCount: 100,
                spread: 50,
                origin: { y: 0.8 },
                colors: ['#10b981', '#34d399']
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER: Selection Screen ---
    if (scenes.length === 0) {
        return (
            <div className="max-w-4xl mx-auto space-y-12 py-8 px-4 animate-in fade-in duration-700">
                <header className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-indigo-50 rounded-[2rem] text-indigo-600 shadow-inner mb-2">
                        <BookOpen className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Le Laboratoire d'Écriture 🖋️</h1>
                    <p className="text-slate-500 font-medium text-lg">Prêt à devenir un grand auteur ?</p>
                </header>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Setup Card */}
                    <AppCard className="p-8 space-y-8 border-none shadow-xl shadow-indigo-100/30">
                        <section className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Sword className="w-4 h-4" /> 1. Choisis ton univers
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {GENRES.map((genre) => (
                                    <button
                                        key={genre.id}
                                        onClick={() => setSelectedGenre(genre)}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedGenre?.id === genre.id ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                                    >
                                        <div className={`p-3 rounded-xl ${genre.color}`}>
                                            <genre.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider">{genre.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Star className="w-4 h-4" /> 2. Nom de ton héros
                            </h3>
                            <input
                                type="text"
                                value={heroName}
                                onChange={(e) => setHeroName(e.target.value)}
                                placeholder="Ex: Léo le Lapin, Super-Clara..."
                                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 outline-none focus:border-indigo-300 focus:bg-white font-bold transition-all"
                            />
                        </section>

                        <AppButton
                            onClick={startStory}
                            disabled={!selectedGenre || !heroName.trim() || loading}
                            loading={loading}
                            className="w-full py-6 rounded-2xl text-lg shadow-lg shadow-indigo-100"
                        >
                            Ouvrir le grimoire <ArrowRight className="ml-2 w-5 h-5" />
                        </AppButton>
                    </AppCard>

                    {/* How to Play Card */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-black text-slate-700">Comment ça marche ?</h3>
                        <div className="space-y-4">
                            {[
                                { icon: Sparkles, text: "L'IA lance l'histoire et tu écris la suite.", color: 'text-yellow-500' },
                                { icon: Star, text: "Utilise les 'Mots Magiques' pour gagner des points.", color: 'text-amber-500' },
                                { icon: CheckCircle2, text: "Termine ton livre et reçois ton trophée d'auteur !", color: 'text-emerald-500' },
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                    <div className={`p-2 rounded-xl bg-slate-50 ${step.color}`}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 leading-tight">{step.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl text-white shadow-xl">
                            <h4 className="font-black text-sm uppercase tracking-widest mb-2 opacity-80">Astuce de Pro</h4>
                            <p className="font-medium text-sm leading-relaxed italic">
                                "Plus tes descriptions sont précises, plus l'IA créera des rebondissements incroyables !"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: Story Mode ---
    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-10rem)] p-4">
            {/* Top Bar: Progress & Status */}
            <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${selectedGenre?.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                        {selectedGenre && <selectedGenre.icon className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            {isFinished ? title : `Aventure de ${heroName}`}
                            {!isFinished && <span className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full" />}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                Chapitre {scenes.length}
                            </span>
                            <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((scenes.length / 10) * 100, 100)}%` }}
                                    className="h-full bg-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Creative Points Badge */}
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Points Créatifs</span>
                        <div className="flex items-center gap-2 text-indigo-600 font-black">
                            {creativePoints} <Star className="w-4 h-4 fill-indigo-600" />
                        </div>
                    </div>

                    {!isFinished && (
                        <button
                            onClick={finishStory}
                            disabled={scenes.length < 3 || loading}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Publier mon livre
                        </button>
                    )}
                    {isFinished && (
                        <button
                            onClick={resetStory}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                        >
                            <RefreshCw className="w-4 h-4" /> Nouvelle Histoire
                        </button>
                    )}
                </div>
            </div>

            {/* Story Content Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar mb-8 px-2"
            >
                <AnimatePresence initial={false}>
                    {scenes.map((scene, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                        >
                            {/* Visual Scene Marker */}
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-indigo-100 to-transparent rounded-full" />

                            <div className="flex justify-center -mb-8 relative z-20">
                                <div className="w-20 h-20 bg-white border-8 border-slate-50/50 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl shadow-slate-200/50 animate-bounce-slow">
                                    {scene.illustration}
                                </div>
                            </div>

                            <AppCard className="overflow-hidden p-0 border-none shadow-xl shadow-slate-200/40 bg-white/60 backdrop-blur-sm group">
                                <div className="p-6 pt-10 bg-slate-50/30 border-b border-slate-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-xs">
                                                ✍️
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plume d'auteur</span>
                                        </div>
                                        {scene.magicWordsUsed.length > 0 && (
                                            <div className="flex gap-1">
                                                {scene.magicWordsUsed.map((w, i) => (
                                                    <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase rounded-lg border border-yellow-200 animate-pulse">
                                                        Mot Magique !
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-base font-bold text-slate-700 leading-relaxed italic">"{scene.childText}"</p>
                                </div>

                                <div className="p-8 relative">
                                    <div className="absolute top-6 right-8 flex gap-2">
                                        <button
                                            onClick={() => speak(scene.aiResponse.replace(/[*_#`]/g, ''))}
                                            className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                        >
                                            {isSpeaking ? <StopCircle className="w-5 h-5 active:scale-95" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="prose-base prose-slate max-w-none text-slate-600 font-medium leading-[1.8] whitespace-pre-wrap">
                                        {scene.aiResponse.split('Mots Magiques').map((part, i) => (
                                            i === 0 ? part : <div key={i} className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 border-dashed">
                                                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-2">💎 Mots Magiques pour la suite :</span>
                                                <span className="text-indigo-700 font-black italic">{part}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </AppCard>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">L'IA parcourt tes mots...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            {!isFinished ? (
                <div className="sticky bottom-0 pb-4 pt-2 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
                    <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
                        <AnimatePresence>
                            {lastMagicWords.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-2"
                                >
                                    {lastMagicWords.map((word, i) => (
                                        <div key={i} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-200">
                                            ✨ {word}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-15 group-focus-within:opacity-40 transition-opacity duration-500" />
                        <div className="relative bg-white border-2 border-slate-100 rounded-[2rem] flex items-center p-3 shadow-xl">
                            <input
                                type="text"
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlesubmit()}
                                placeholder="Écris la suite de ton incroyable aventure..."
                                disabled={loading}
                                className="flex-1 bg-transparent px-6 py-4 outline-none text-base font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                            />
                            <button
                                disabled={!currentInput.trim() || loading}
                                onClick={handlesubmit}
                                className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
                            <Save className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-4xl font-black mb-4 tracking-tight">Chef-d'œuvre terminé ! 📖</h3>
                        <p className="text-indigo-200 font-medium mb-10 text-lg max-w-md mx-auto">
                            Tu as créé un livre magnifique dont le titre est : <br />
                            <strong className="text-white text-3xl block mt-4 drop-shadow-lg">« {title} »</strong>
                        </p>

                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-10 inline-block">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 block mb-2">Score Final</span>
                            <div className="text-4xl font-black text-yellow-400 flex items-center gap-3">
                                {creativePoints} <Star className="w-8 h-8 fill-yellow-400" />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <AppButton
                                variant="secondary"
                                onClick={saveToPortfolio}
                                disabled={isSaved || loading}
                                loading={loading && !isFinished} // Special case
                                className={`px-8 ${isSaved ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                                leftIcon={isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            >
                                {isSaved ? 'Enregistré !' : 'Ajouter à mon portfolio'}
                            </AppButton>
                            <AppButton onClick={resetStory} className="px-8 bg-indigo-500 hover:bg-indigo-600">
                                Écrire une autre histoire
                            </AppButton>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
