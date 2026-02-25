import { askGemini } from './gemini';

export interface DailyWord {
    word: string;
    definition: string;
    example: string;
    synonyms: string[];
}

export interface DailyProblem {
    question: string;
    answer: string;
    explanation: string;
}

export interface DailyChallenges {
    date: string;
    word: DailyWord;
    problem: DailyProblem;
    wordCompleted: boolean;
    problemCompleted: boolean;
}

const STORAGE_KEY = 'daily_challenges';

export const dailyChallengeService = {
    async getChallenges(gradeLevel: string = 'CM1'): Promise<DailyChallenges | null> {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem(`${STORAGE_KEY}_${gradeLevel}`);

        if (stored) {
            const parsed = JSON.parse(stored) as DailyChallenges;
            if (parsed.date === today) {
                return parsed;
            }
        }

        try {
            const [wordRes, problemRes] = await Promise.all([
                askGemini("Génère le mot du jour.", 'wordOfTheDay', gradeLevel),
                askGemini("Génère le problème du jour.", 'problemOfTheDay', gradeLevel)
            ]);

            const word = JSON.parse(wordRes) as DailyWord;
            const problem = JSON.parse(problemRes) as DailyProblem;

            const newChallenges: DailyChallenges = {
                date: today,
                word,
                problem,
                wordCompleted: false,
                problemCompleted: false
            };

            localStorage.setItem(`${STORAGE_KEY}_${gradeLevel}`, JSON.stringify(newChallenges));
            return newChallenges;
        } catch (error) {
            console.error('Failed to generate daily challenges:', error);
            return null;
        }
    },

    completeWord(gradeLevel: string) {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${gradeLevel}`);
        if (stored) {
            const parsed = JSON.parse(stored) as DailyChallenges;
            parsed.wordCompleted = true;
            localStorage.setItem(`${STORAGE_KEY}_${gradeLevel}`, JSON.stringify(parsed));
        }
    },

    completeProblem(gradeLevel: string) {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${gradeLevel}`);
        if (stored) {
            const parsed = JSON.parse(stored) as DailyChallenges;
            parsed.problemCompleted = true;
            localStorage.setItem(`${STORAGE_KEY}_${gradeLevel}`, JSON.stringify(parsed));
        }
    }
};
