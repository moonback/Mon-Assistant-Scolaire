import { supabase } from '../lib/supabase';
import { askGemini } from './gemini';

export interface Flashcard {
    id?: string;
    front: string;
    back: string;
    hint: string;
    subject: string;
}

export interface SRSCard {
    id: string;
    notion: string;
    subject: string;
    mastery_level: number;
    next_review_at: string;
    last_reviewed_at: string;
    success_count: number;
    failure_count: number;
    front?: string;
    back?: string;
    hint?: string;
    last_answer?: string;
}

// Generate flashcards using AI for a given subject/notion
export async function generateFlashcards(
    gradeLevel: string,
    subject: string,
    notion?: string
): Promise<Flashcard[]> {
    const topicPrompt = notion
        ? `Génère 5 flashcards sur "${notion}" en ${subject} pour le niveau ${gradeLevel}.`
        : `Génère 5 flashcards sur les notions essentielles de ${subject} pour le niveau ${gradeLevel}.`;

    try {
        const raw = await askGemini(topicPrompt, 'flashcard', gradeLevel);

        // Extract JSON array robustly
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        if (start === -1 || end === -1) throw new Error('No JSON array found');

        const parsed = JSON.parse(raw.substring(start, end + 1));
        if (Array.isArray(parsed)) return parsed as Flashcard[];
    } catch (e) {
        console.error('[flashcardService] parse error:', e);
    }

    // Fallback cards if AI fails
    return [
        { front: `Qu'est-ce que ${subject} ?`, back: 'Réponds à cette question avec tes propres mots.', hint: 'Pense à ce que tu as appris en classe.', subject },
        { front: `Donne un exemple de ${subject}.`, back: 'Un exemple concret de la vie quotidienne.', hint: 'Cherche dans ton quotidien.', subject },
    ];
}

// Load SRS cards due for review
export async function getDueCards(childId: string): Promise<SRSCard[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('pedagogical_srs_cards')
        .select('*')
        .eq('child_id', childId)
        .lte('next_review_at', now)
        .order('next_review_at', { ascending: true })
        .limit(10);

    if (error || !data) return [];
    return data;
}

// Get all unique subjects from progress data (for subject picker)
export async function getChildSubjects(childId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('progress')
        .select('subject, activity_type')
        .eq('child_id', childId)
        .limit(100);

    if (error || !data) return ['Maths', 'Français', 'Sciences', 'Histoire'];

    const subjects = new Set<string>();
    data.forEach(row => {
        if (row.subject && row.subject.toLowerCase() !== 'general') {
            subjects.add(row.subject);
        } else {
            const map: Record<string, string> = {
                quiz: 'Français', math: 'Mathématiques', assistant: 'Sciences',
                homework: 'Résolution de problèmes', story: 'Lecture'
            };
            if (map[row.activity_type]) subjects.add(map[row.activity_type]);
        }
    });

    const result = Array.from(subjects);
    return result.length > 0 ? result : ['Maths', 'Français', 'Sciences', 'Histoire'];
}

// Rate a card after review (updates SRS scheduling)
export async function rateCard(
    childId: string,
    cardData: { notion: string; subject: string; front?: string; back?: string; hint?: string; last_answer?: string },
    success: boolean
): Promise<void> {
    // Get or create SRS card
    const { data: existing } = await supabase
        .from('pedagogical_srs_cards')
        .select('*')
        .eq('child_id', childId)
        .eq('notion', cardData.notion)
        .maybeSingle();

    const now = new Date();

    if (existing) {
        const newLevel = success
            ? Math.min(5, existing.mastery_level + 1)
            : Math.max(1, existing.mastery_level - 1);

        // SRS intervals: level 1=1d, 2=3d, 3=7d, 4=14d, 5=30d
        const intervals = [1, 3, 7, 14, 30];
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + intervals[newLevel - 1]);

        await supabase
            .from('pedagogical_srs_cards')
            .update({
                mastery_level: newLevel,
                next_review_at: nextReview.toISOString(),
                last_reviewed_at: now.toISOString(),
                success_count: success ? existing.success_count + 1 : existing.success_count,
                failure_count: !success ? existing.failure_count + 1 : existing.failure_count,
                front: cardData.front, // Store full content for coming back
                back: cardData.back,
                hint: cardData.hint,
                last_answer: cardData.last_answer
            })
            .eq('id', existing.id);
    } else {
        // First time — create card
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + (success ? 3 : 1));

        await supabase.from('pedagogical_srs_cards').insert({
            child_id: childId,
            subject: cardData.subject,
            notion: cardData.notion,
            mastery_level: success ? 2 : 1,
            next_review_at: nextReview.toISOString(),
            last_reviewed_at: now.toISOString(),
            success_count: success ? 1 : 0,
            failure_count: !success ? 1 : 0,
            front: cardData.front,
            back: cardData.back,
            hint: cardData.hint,
            last_answer: cardData.last_answer
        });
    }
}

// Get all mastered/learned cards for collection view
export async function getCollection(childId: string): Promise<SRSCard[]> {
    const { data, error } = await supabase
        .from('pedagogical_srs_cards')
        .select('*')
        .eq('child_id', childId)
        .order('last_reviewed_at', { ascending: false });

    if (error || !data) return [];
    return data;
}

// Save a completed flashcard session
export async function saveSession(
    childId: string,
    cards: Flashcard[],
    score: number
): Promise<void> {
    await supabase.from('flashcard_sessions').insert({
        child_id: childId,
        cards,
        score,
        completed_at: new Date().toISOString(),
    });
}

// AI Validation of a child's answer
export async function validateFlashcardAnswer(
    gradeLevel: string,
    question: string,
    correctAnswer: string,
    childAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> {
    const prompt = `
    Tu es un tuteur bienveillant. Un élève de niveau ${gradeLevel} répond à une flashcard.
    Question : "${question}"
    Réponse attendue : "${correctAnswer}"
    Réponse de l'élève : "${childAnswer}"

    Tâche : Analyse si la réponse de l'élève est correcte (même si formulée différemment).
    Réponds TOUJOURS au format JSON suivant :
    {
      "isCorrect": boolean,
      "feedback": "une courte phrase d'explication ou d'encouragement en français"
    }
    `;

    try {
        const raw = await askGemini(prompt, 'assistant', gradeLevel);
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('No JSON output');

        return JSON.parse(raw.substring(start, end + 1));
    } catch (e) {
        console.error('[flashcardService] validation error:', e);
        return { isCorrect: false, feedback: "Je n'ai pas pu analyser ta réponse, compare-la avec le corrigé !" };
    }
}

// AI Follow-up validation (conversation)
export async function followUpValidation(
    gradeLevel: string,
    question: string,
    correctAnswer: string,
    history: { child: string; ai: string }[],
    newChildAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> {
    const historyText = history.map(h => `Élève: ${h.child}\nMagic: ${h.ai}`).join('\n');

    const prompt = `
    Tu es Magic ✨, un tuteur bienveillant pour un élève de ${gradeLevel}.
    On travaille sur cette flashcard :
    Question : "${question}"
    Réponse attendue : "${correctAnswer}"

    Voici l'historique de notre discussion :
    ${historyText}

    L'élève vient de préciser : "${newChildAnswer}"

    Tâche : Analyse si avec cette précision, l'élève a maintenant bien compris ou répondu correctement.
    Réponds TOUJOURS au format JSON :
    {
      "isCorrect": boolean,
      "feedback": "ton nouveau feedback encourageant"
    }
    `;

    try {
        const raw = await askGemini(prompt, 'assistant', gradeLevel);
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('No JSON output');

        return JSON.parse(raw.substring(start, end + 1));
    } catch (e) {
        console.error('[flashcardService] follow-up error:', e);
        return { isCorrect: false, feedback: "Je continue de t'écouter, dis-m'en plus !" };
    }
}
