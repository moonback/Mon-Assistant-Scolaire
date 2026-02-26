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
    resetQuizContext: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [openAnswer, setOpenAnswer] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

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
        setShowResult(false);
        setSelectedOption(null);
        setIsCorrect(null);
        setOpenAnswer('');
        setAiFeedback(null);
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

    const resetQuizContext = () => {
        generationIdRef.current++;
        setQuestions([]);
        setTopic('');
        setLoading(false);
        setShowResult(false);
        setScore(0);
        setCurrentQuestion(0);
        setSelectedOption(null);
        setIsCorrect(null);
        setOpenAnswer('');
        setAiFeedback(null);
    };

    return (
        <QuizContext.Provider
            value={{
                topic, setTopic,
                questions, setQuestions,
                loading,
                currentQuestion, setCurrentQuestion,
                score, setScore,
                showResult, setShowResult,
                selectedOption, setSelectedOption,
                isCorrect, setIsCorrect,
                openAnswer, setOpenAnswer,
                aiLoading, setAiLoading,
                aiFeedback, setAiFeedback,
                wrongTopicsRef,
                startQuizContext,
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
