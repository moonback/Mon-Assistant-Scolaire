import { askGemini } from './gemini';
import { supabase } from '../lib/supabase';

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
    id?: string;
    date: string;
    word: DailyWord;
    problem: DailyProblem;
    wordCompleted: boolean;
    problemCompleted: boolean;
}

const STORAGE_KEY = 'daily_challenges';

export const dailyChallengeService = {
    async getChallenges(childId: string, gradeLevel: string = 'CM1', theme?: string): Promise<DailyChallenges | null> {
        const today = new Date().toISOString().split('T')[0];

        try {
            // 1. Check if challenge exists for today/grade/theme in Supabase
            let query = supabase
                .from('daily_challenges')
                .select('*')
                .eq('date', today)
                .eq('grade_level', gradeLevel);

            if (theme) {
                query = query.eq('theme', theme);
            }

            let { data: challenge, error: challengeError } = await query.maybeSingle();

            // 2. If not, generate with AI and save to Supabase
            if (!challenge) {
                const themePrompt = theme ? ` sur le thème : "${theme}"` : '';
                const [wordRes, problemRes] = await Promise.all([
                    askGemini(`Génère le mot du jour${themePrompt}.`, 'wordOfTheDay', gradeLevel),
                    askGemini(`Génère le problème du jour${themePrompt}.`, 'problemOfTheDay', gradeLevel)
                ]);

                let word: DailyWord;
                let problem: DailyProblem;

                try {
                    word = JSON.parse(wordRes) as DailyWord;
                } catch (e) {
                    console.error("Failed to parse word JSON:", wordRes);
                    word = { word: "Curiosité", definition: "Désir d'apprendre.", example: "La curiosité est une qualité.", synonyms: ["Intérêt", "Envie"] };
                }

                try {
                    problem = JSON.parse(problemRes) as DailyProblem;
                } catch (e) {
                    console.error("Failed to parse problem JSON:", problemRes);
                    problem = { question: "Combien font 2 + 2 ?", answer: "4", explanation: "C'est la base !" };
                }

                const { data: newChallenge, error: insertError } = await supabase
                    .from('daily_challenges')
                    .upsert({
                        date: today,
                        grade_level: gradeLevel,
                        theme: theme || 'Général',
                        word_data: word,
                        problem_data: problem
                    }, { onConflict: 'date,grade_level,theme', ignoreDuplicates: true })
                    .select()
                    .maybeSingle();

                if (insertError) {
                    throw insertError;
                }

                if (!newChallenge) {
                    // Another request inserted it at the same time, triggering ignoreDuplicates 
                    // which returns null. So we just fetch it again.
                    return this.getChallenges(childId, gradeLevel, theme);
                }

                challenge = newChallenge;
            }

            // 3. Check completion status for this child
            const { data: status } = await supabase
                .from('daily_challenge_status')
                .select('*')
                .eq('child_id', childId)
                .eq('challenge_id', challenge.id)
                .maybeSingle();

            const result = {
                id: challenge.id,
                date: today,
                word: challenge.word_data,
                problem: challenge.problem_data,
                wordCompleted: status?.word_completed || false,
                problemCompleted: status?.problem_completed || false
            };

            // Update local fallback
            localStorage.setItem(`${STORAGE_KEY}_${gradeLevel}`, JSON.stringify(result));

            return result;
        } catch (error) {
            console.error('Failed to sync daily challenges:', error);

            // Fallback to localStorage if offline or error
            const stored = localStorage.getItem(`${STORAGE_KEY}_${gradeLevel}`);
            if (stored) {
                const parsed = JSON.parse(stored) as DailyChallenges;
                if (parsed.date === today) return parsed;
            }
            return null;
        }
    },

    async completeWord(childId: string, challengeId: string) {
        try {
            await supabase
                .from('daily_challenge_status')
                .upsert({
                    child_id: childId,
                    challenge_id: challengeId,
                    word_completed: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'child_id,challenge_id' });
        } catch (e) {
            console.error('Failed to complete word:', e);
        }
    },

    async completeProblem(childId: string, challengeId: string) {
        try {
            await supabase
                .from('daily_challenge_status')
                .upsert({
                    child_id: childId,
                    challenge_id: challengeId,
                    problem_completed: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'child_id,challenge_id' });
        } catch (e) {
            console.error('Failed to complete problem:', e);
        }
    }
};
