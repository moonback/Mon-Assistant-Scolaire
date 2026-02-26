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
    ArrowRight,
    PenTool,
    MessageSquareQuote
} from 'lucide-react';
import { askGemini } from '../services/gemini';
import { storyService } from '../services/storyService';
import { useAuth } from '../contexts/AuthContext';
import { useSpeechSynthesis } from '../hooks/useSpeech';
import confetti from 'canvas-confetti';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';

type WritingStep = 'SETUP' | 'WRITING' | 'REVIEWING' | 'FINISHED';

interface ManuscriptEntry {
    role: 'child' | 'ai';
    text: string;
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

    const [step, setStep] = useState<WritingStep>('SETUP');
    const [loading, setLoading] = useState(false);

    // Config
    const [selectedGenre, setSelectedGenre] = useState<typeof GENRES[0] | null>(null);
    const [heroName, setHeroName] = useState('');
    const [title, setTitle] = useState('');

    // Manuscript Data
    const [manuscript, setManuscript] = useState<ManuscriptEntry[]>([]);

    // Tutor State
    const [draftInput, setDraftInput] = useState('');
    const [editorFeedback, setEditorFeedback] = useState('');
    const [nextChoice, setNextChoice] = useState('');
    const [magicWords, setMagicWords] = useState<string[]>([]);
    const [pendingEngineContent, setPendingEngineContent] = useState<string>('');
    const [fullHistory, setFullHistory] = useState<string>(''); // For Gemini context

    // Gamification
    const [creativePoints, setCreativePoints] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    const manuscriptBottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (manuscriptBottomRef.current) {
            manuscriptBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [manuscript, step]);

    const parseAiResponse = (text: string) => {
        const editorMatch = text.match(/\*\*L'[ŒO]il de l'[ÉE]diteur\*\*\s*:\s*(.+)/i);
        const wordsMatch = text.match(/\*\*Mots Magiques\*\*\s*:\s*(.+)/i);
        const engineMatch = text.match(/\*\*Le Moteur de l'Histoire\*\*\s*:\s*(.+)/i);
        const choiceMatch = text.match(/\*\*Le Choix du H[éèe]ros\*\*\s*:\s*(.+)/i);

        let words: string[] = [];
        if (wordsMatch && wordsMatch[1]) {
            words = wordsMatch[1].replace(/[*_]/g, '').split(',').map(w => w.trim());
        }

        return {
            editor: editorMatch ? editorMatch[1].trim() : "Super idée !",
            words: words.length ? words : ["Aventure", "Courage"],
            engine: engineMatch ? engineMatch[1].trim() : text.replace(/\*\*.*\*\*\s*:/g, '').trim(),
            choice: choiceMatch ? choiceMatch[1].trim() : "Que fais-tu ensuite ?"
        };
    };

    const startStory = async () => {
        if (!selectedGenre || !heroName.trim()) return;

        setLoading(true);
        const initialPrompt = `Lance une nouvelle histoire dans le genre ${selectedGenre.label}. Le héros s'appelle ${heroName}. 
        Utilise OBLIGATOIREMENT le format avec L'Œil de l'Éditeur, Mots Magiques, Le Moteur de l'Histoire, et Le Choix du Héros. 
        Pour l'Œil de l'Éditeur, souhaite-lui juste la bienvenue dans l'aventure.`;

        try {
            const resp = await askGemini(initialPrompt, 'writing_lab', selectedChild?.grade_level || 'CM1');
            const parsed = parseAiResponse(resp);

            setManuscript([{ role: 'ai', text: parsed.engine }]);
            setEditorFeedback(parsed.editor);
            setMagicWords(parsed.words);
            setNextChoice(parsed.choice);
            setFullHistory(`IA: ${parsed.engine}\n`);

            setStep('WRITING');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const submitDraftToTutor = async () => {
        if (!draftInput.trim() || loading) return;

        setLoading(true);
        const userInput = draftInput;

        // Points
        const wordsUsed = magicWords.filter(w => userInput.toLowerCase().includes(w.toLowerCase()));
        if (wordsUsed.length > 0) {
            setCreativePoints(prev => prev + (wordsUsed.length * 50));
        }
        setCreativePoints(prev => prev + 10);

        const prompt = `HISTORIQUE :\n${fullHistory}\n\nL'enfant propose la suite : "${userInput}". 
        ${wordsUsed.length > 0 ? `Il a utilisé les mots : ${wordsUsed.join(', ')}. Félicite-le !` : ''}
        Réponds OBLIGATOIREMENT avec le format : L'Œil de l'Éditeur (conseil doux sur l'orthographe si besoin), Mots Magiques (2 mots), Le Moteur de l'Histoire (qui intègre son idée), Le Choix du Héros (1 question).`;

        try {
            const aiResp = await askGemini(prompt, 'writing_lab', selectedChild?.grade_level || 'CM1');
            const parsed = parseAiResponse(aiResp);

            setEditorFeedback(parsed.editor);
            setMagicWords(parsed.words);
            setPendingEngineContent(parsed.engine);
            setNextChoice(parsed.choice);

            // We do NOT add to manuscript yet, we wait for child to validate
            setStep('REVIEWING');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const validateDraftForBook = () => {
        // Child has reviewed (and possibly corrected) their draft
        setManuscript(prev => [
            ...prev,
            { role: 'child', text: draftInput },
            { role: 'ai', text: pendingEngineContent }
        ]);

        setFullHistory(prev => prev + `Enfant: ${draftInput}\nIA: ${pendingEngineContent}\n`);

        // Reset for next turn
        setDraftInput('');
        setPendingEngineContent('');
        setEditorFeedback('');
        setStep('WRITING');
    };

    const loadEnding = async () => {
        setLoading(true);
        const prompt = `HISTORIQUE :\n${fullHistory}\n\nL'histoire est finie ! Trouve un titre MAGNIFIQUE pour ce livre de ${selectedChild?.grade_level}. Réponds UNIQUEMENT le titre.`;

        try {
            const storyTitle = await askGemini(prompt, 'writing_lab', selectedChild?.grade_level || 'CM1');
            setTitle(storyTitle.replace(/[*_#"]+/g, ''));
            setCreativePoints(prev => prev + 200); // Completion bonus
            setStep('FINISHED');
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
        setManuscript([]);
        setDraftInput('');
        setStep('SETUP');
        setTitle('');
        setSelectedGenre(null);
        setHeroName('');
        setMagicWords([]);
        setIsSaved(false);
        setCreativePoints(0);
        setFullHistory('');
        stop();
    };

    const saveToPortfolio = async () => {
        if (isSaved || !title || !selectedChild) return;
        setLoading(true);
        try {
            // Reconstruct scenes array for compatibility with older format
            const scenes = [];
            for (let i = 0; i < manuscript.length; i += 2) {
                if (manuscript[i].role === 'ai') { // First item is always AI engine
                    const childTxt = i > 0 ? manuscript[i - 1].text : `Voici l'aventure de ${heroName} !`;
                    scenes.push({
                        childText: childTxt,
                        aiResponse: manuscript[i].text,
                        illustration: selectedGenre?.emoji || '✨',
                        magicWordsUsed: []
                    });
                }
            }

            await storyService.saveStory({
                child_id: selectedChild.id,
                title,
                genre: selectedGenre?.label || 'Inconnu',
                content: scenes,
                points: creativePoints
            });
            setIsSaved(true);
            confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 }, colors: ['#10b981', '#34d399'] });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER: SETUP SCREEN ---
    if (step === 'SETUP') {
        return (
            <div className="max-w-4xl mx-auto space-y-12 py-8 px-4 animate-in fade-in duration-700">
                <header className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-indigo-50 rounded-[2rem] text-indigo-600 shadow-inner mb-2">
                        <PenTool className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Le Studio d'Autheur 🖋️</h1>
                    <p className="text-slate-500 font-medium text-lg">Prépare-toi à écrire ton best-seller avec ton éditeur IA.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-12 items-start">
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
                            Ouvrir le Manuscrit <ArrowRight className="ml-2 w-5 h-5" />
                        </AppButton>
                    </AppCard>

                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-black text-slate-700">Comment ça marche ?</h3>
                        <div className="space-y-4">
                            {[
                                { icon: Sparkles, text: "Tu es l'auteur, l'IA est ton éditeur. Elle te donne des défis !", color: 'text-amber-500' },
                                { icon: PenTool, text: "Fais des brouillons, corrige tes fautes, puis valide pour le livre.", color: 'text-indigo-500' },
                                { icon: BookOpen, text: "À la fin, admire ton manuscrit finalisé dans ton portfolio.", color: 'text-emerald-500' },
                            ].map((s, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                    <div className={`p-2 rounded-xl bg-slate-50 ${s.color}`}><s.icon className="w-5 h-5" /></div>
                                    <p className="text-sm font-bold text-slate-600 leading-tight">{s.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'FINISHED') {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-indigo-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden w-full"
                >
                    <div className="absolute top-0 left-0 w-full h-full opacity-10" />
                    <div className="relative z-10 space-y-8">
                        <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto backdrop-blur-xl border border-white/20">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h3 className="text-4xl font-black mb-2 tracking-tight">Manuscrit achevé ! 📖</h3>
                            <p className="text-indigo-200 font-medium text-lg">Tu as écrit le best-seller :</p>
                            <h2 className="text-white text-4xl block mt-4 font-black drop-shadow-md">« {title} »</h2>
                        </div>

                        <div className="inline-block p-4 bg-white/10 rounded-3xl border border-white/20">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 block mb-1">Score Créatif</span>
                            <div className="text-3xl font-black text-yellow-400 flex items-center justify-center gap-2">
                                {creativePoints} <Star className="w-6 h-6 fill-yellow-400" />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <AppButton
                                onClick={saveToPortfolio}
                                disabled={isSaved || loading}
                                loading={loading}
                                className={`px-8 ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-white text-indigo-900 hover:bg-slate-50'}`}
                                leftIcon={isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                            >
                                {isSaved ? 'Sauvegardé !' : 'Ajouter au Portfolio'}
                            </AppButton>
                            <AppButton variant="secondary" onClick={resetStory} className="px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                                Ré-écrire un livre
                            </AppButton>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- RENDER: SPLIT VIEW (WRITING / REVIEWING) ---
    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto w-full">

            {/* LEFT COLUMN: THE MANUSCRIPT */}
            <div className="flex-1 lg:max-w-[50%] flex flex-col bg-[#fdfaf6] rounded-[2rem] shadow-inner border border-slate-200 overflow-hidden relative">
                {/* Book Header */}
                <div className="p-4 border-b border-[#ebdacc] bg-[#f9f1e8] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedGenre?.emoji}</span>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
                                L'aventure de {heroName}
                            </h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                Chapitre {Math.max(1, Math.floor(manuscript.length / 2))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Book Pages */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />

                    <div className="space-y-6 relative z-10 text-slate-800 text-lg leading-[2] text-justify" style={{ fontFamily: 'Georgia, serif' }}>
                        {manuscript.map((entry, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={entry.role === 'child' ? 'text-indigo-900 font-bold ml-4 border-l-4 border-indigo-200 pl-4 py-1' : ''}
                            >
                                {entry.text}
                            </motion.div>
                        ))}
                        <div ref={manuscriptBottomRef} />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: THE CREATIVE STUDIO (AI TUTOR) */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Points & Finish Bar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Créativité</span>
                        <div className="flex items-center gap-1 text-indigo-600 font-black">
                            {creativePoints} <Star className="w-4 h-4 fill-indigo-600" />
                        </div>
                    </div>
                    <AppButton
                        variant="secondary"
                        onClick={loadEnding}
                        disabled={manuscript.length < 5 || loading}
                        className="text-xs py-2 px-4 bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Publier le livre
                    </AppButton>
                </div>

                {/* Tutor Interaction Area */}
                <AppCard className="flex-1 flex flex-col p-0 overflow-hidden shadow-sm border-slate-100">
                    <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                            <Wand2 className="w-4 h-4" />
                        </div>
                        <span className="font-black text-indigo-900 uppercase tracking-widest text-xs">Ton Éditeur Magique</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        {step === 'WRITING' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-amber-400 relative">
                                    <MessageSquareQuote className="absolute top-4 right-4 text-slate-100 w-8 h-8" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Le Choix du Héros</h4>
                                    <p className="font-bold text-slate-700">{nextChoice}</p>
                                </div>

                                {magicWords.length > 0 && (
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">💎 Mots Magiques du chapitre</h4>
                                        <div className="flex gap-2">
                                            {magicWords.map((w, i) => (
                                                <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-lg">
                                                    {w}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 'REVIEWING' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <div className="bg-emerald-50 p-5 rounded-2xl shadow-sm border border-emerald-100 relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">L'Œil de l'Éditeur</h4>
                                        <button onClick={() => speak(editorFeedback)} className="text-emerald-500 hover:text-emerald-700">
                                            {isSpeaking ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="font-bold text-emerald-900 leading-relaxed">{editorFeedback}</p>
                                </div>
                                <div className="text-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        ↓ Corrige ton brouillon en bas et valide ↓
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {loading && (
                            <div className="flex items-center gap-3 text-indigo-400 p-4">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest">L'éditeur lit tes pages...</span>
                            </div>
                        )}
                    </div>

                    {/* Editor Input */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative group">
                            <textarea
                                value={draftInput}
                                onChange={(e) => setDraftInput(e.target.value)}
                                placeholder={step === 'WRITING' ? "C'est à toi d'écrire la suite..." : "Corrige ton texte ici..."}
                                disabled={loading}
                                className={`w-full h-32 resize-none rounded-2xl p-4 outline-none font-medium text-slate-700 transition-all border-2 
                                ${step === 'REVIEWING' ? 'bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:bg-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white'}`}
                            />

                            <div className="absolute bottom-4 right-4 h-10">
                                {step === 'WRITING' ? (
                                    <AppButton
                                        disabled={!draftInput.trim() || loading}
                                        onClick={submitDraftToTutor}
                                        className="h-full px-6 shadow-lg shadow-indigo-200"
                                    >
                                        Vérifier le brouillon <ArrowRight className="w-4 h-4 ml-2" />
                                    </AppButton>
                                ) : (
                                    <AppButton
                                        disabled={!draftInput.trim() || loading}
                                        onClick={validateDraftForBook}
                                        className="h-full px-6 shadow-lg shadow-emerald-200 bg-emerald-500 hover:bg-emerald-600"
                                    >
                                        <BookOpen className="w-4 h-4 mr-2" /> Encre magique ! (Valider)
                                    </AppButton>
                                )}
                            </div>
                        </div>
                    </div>
                </AppCard>
            </div>
        </div>
    );
}
