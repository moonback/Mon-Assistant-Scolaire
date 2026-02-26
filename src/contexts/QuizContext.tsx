import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { askGemini } from '../services/gemini';
import { supabase } from '../lib/supabase';

export interface Question {
    question: string;
    type?: 'qcm' | 'open';
    options: string[];
    correctAnswer: number;
    correctAnswerText?: string;
    explanation: string;
    funFact?: string;
}

interface QuizContextType {
    topic: string;
    setTopic: (t: string) => void;
    questions: Question[];
    setQuestions: (q: Question[]) => void;
    loading: boolean;
    currentQuestion: number;
    setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>;
    score: number;
    setScore: React.Dispatch<React.SetStateAction<number>>;
    earnedStars: number;
    setEarnedStars: React.Dispatch<React.SetStateAction<number>>;
    showResult: boolean;
    setShowResult: React.Dispatch<React.SetStateAction<boolean>>;
    selectedOption: number | null;
    setSelectedOption: React.Dispatch<React.SetStateAction<number | null>>;
    isCorrect: boolean | null;
    setIsCorrect: React.Dispatch<React.SetStateAction<boolean | null>>;
    openAnswer: string;
    setOpenAnswer: React.Dispatch<React.SetStateAction<string>>;
    aiLoading: boolean;
    setAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
    aiFeedback: string | null;
    setAiFeedback: React.Dispatch<React.SetStateAction<string | null>>;
    wrongTopicsRef: React.MutableRefObject<string[]>;
    startQuizContext: (
        finalTopic: string,
        gradeLevel: string,
        weakPoints?: string[],
        learningProfile?: any
    ) => Promise<void>;
    resumeQuizContext: (quiz: any) => void;
    activeQuizId: string | null;
    setActiveQuizId: React.Dispatch<React.SetStateAction<string | null>>;
    hasUsedHint: boolean;
    setHasUsedHint: React.Dispatch<React.SetStateAction<boolean>>;
    hintText: string | null;
    setHintText: React.Dispatch<React.SetStateAction<string | null>>;
    hintLoading: boolean;
    setHintLoading: React.Dispatch<React.SetStateAction<boolean>>;
    resetQuizContext: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [earnedStars, setEarnedStars] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [openAnswer, setOpenAnswer] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
    const [hasUsedHint, setHasUsedHint] = useState(false);
    const [hintText, setHintText] = useState<string | null>(null);
    const [hintLoading, setHintLoading] = useState(false);

    const wrongTopicsRef = useRef<string[]>([]);
    const generationIdRef = useRef(0);

    const startQuizContext = async (
        finalTopic: string,
        gradeLevel: string,
        weakPoints?: string[],
        learningProfile?: any
    ) => {
        const currentGenId = ++generationIdRef.current;
        setLoading(true);
        setQuestions([]);
        setCurrentQuestion(0);
        setScore(0);
        setEarnedStars(0);
        setShowResult(false);
        setSelectedOption(null);
        setIsCorrect(null);
        setOpenAnswer('');
        setAiFeedback(null);
        setActiveQuizId(null);
        setHasUsedHint(false);
        setHintText(null);
        setHintLoading(false);
        wrongTopicsRef.current = [];

        try {
            const json = await askGemini(
                finalTopic,
                'quiz',
                gradeLevel,
                undefined,
                undefined,
                weakPoints,
                learningProfile
            );
            const data = JSON.parse(json);
            const quizQuestions = data.questions || data;

            if (currentGenId !== generationIdRef.current) return;

            if (Array.isArray(quizQuestions) && quizQuestions.length > 0) {
                setQuestions(quizQuestions);
            } else {
                throw new Error('Format de quiz invalide');
            }
        } catch (e) {
            if (currentGenId !== generationIdRef.current) return;
            console.error('Erreur lors de la génération du quiz:', e);
        } finally {
            if (currentGenId === generationIdRef.current) {
                setLoading(false);
            }
        }
    };

    const resumeQuizContext = (quiz: any) => {
        generationIdRef.current++; // cancel any ongoing generation
        setTopic(quiz.topic);
        setQuestions(quiz.questions);
        setCurrentQuestion(quiz.current_question || 0);
        setScore(quiz.score || 0);
        setEarnedStars(quiz.stars_earned || (quiz.score || 0) * 10);
        wrongTopicsRef.current = quiz.wrong_topics || [];
        setActiveQuizId(quiz.id);

        setLoading(false);
        setShowResult(false);
        setSelectedOption(null);
        setIsCorrect(null);
        setOpenAnswer('');
        setAiFeedback(null);
        setHasUsedHint(false);
        setHintText(null);
        setHintLoading(false);
    };

    const resetQuizContext = () => {
        generationIdRef.current++;
        setQuestions([]);
        setTopic('');
        setLoading(false);
        setShowResult(false);
        setScore(0);
        setEarnedStars(0);
        setCurrentQuestion(0);
        setSelectedOption(null);
        setIsCorrect(null);
        setOpenAnswer('');
        setAiFeedback(null);
        setActiveQuizId(null);
        setHasUsedHint(false);
        setHintText(null);
        setHintLoading(false);
    };

    return (
        <QuizContext.Provider
            value={{
                topic, setTopic,
                questions, setQuestions,
                loading,
                currentQuestion, setCurrentQuestion,
                score, setScore,
                earnedStars, setEarnedStars,
                showResult, setShowResult,
                selectedOption, setSelectedOption,
                isCorrect, setIsCorrect,
                openAnswer, setOpenAnswer,
                aiLoading, setAiLoading,
                aiFeedback, setAiFeedback,
                wrongTopicsRef,
                startQuizContext,
                resumeQuizContext,
                activeQuizId, setActiveQuizId,
                hasUsedHint, setHasUsedHint,
                hintText, setHintText,
                hintLoading, setHintLoading,
                resetQuizContext
            }}
        >
            {children}
        </QuizContext.Provider>
    );
}

export function useQuizContext() {
    const context = useContext(QuizContext);
    if (context === undefined) {
        throw new Error('useQuizContext must be used within a QuizProvider');
    }
    return context;
}
