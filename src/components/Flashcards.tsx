import { useState, useEffect, useCallback } from 'react';
import {
  generateFlashcards,
  getDueCards,
  getChildSubjects,
  rateCard,
  saveSession,
  getCollection,
  Flashcard,
  SRSCard,
} from '../services/flashcardService';
import LoadingSpinner from './ui/LoadingSpinner';
import FlashcardSelect from './flashcards/FlashcardSelect';
import FlashcardSession from './flashcards/FlashcardSession';
import FlashcardResult from './flashcards/FlashcardResult';
import FlashcardCollection from './flashcards/FlashcardCollection';
import type { Phase, CardResult } from './flashcards/types';

interface FlashcardsProps {
  childId: string;
  gradeLevel: string;
  onEarnPoints: (amount: number, activityType: string, subject?: string) => void;
}

export default function Flashcards({ childId, gradeLevel, onEarnPoints }: FlashcardsProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<CardResult[]>([]);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [collectionCards, setCollectionCards] = useState<SRSCard[]>([]);

  // Load subjects and due cards on mount
  useEffect(() => {
    if (!childId) return;
    Promise.all([
      getChildSubjects(childId),
      getDueCards(childId),
    ]).then(([childSubjects, due]) => {
      setSubjects(childSubjects);
      setDueCount(due.length);
    });
  }, [childId]);

  const resetSession = () => {
    setCards([]);
    setCurrentIndex(0);
    setResults([]);
    setSessionPoints(0);
  };

  const startSession = useCallback(async (subject: string) => {
    setSelectedSubject(subject);
    setPhase('loading');
    resetSession();
    const generated = await generateFlashcards(gradeLevel, subject);
    setCards(generated);
    setPhase('session');
  }, [gradeLevel]);

  const startReviewSession = useCallback(async () => {
    setSelectedSubject('Révision SRS');
    setPhase('loading');
    const due = await getDueCards(childId);
    if (due.length === 0) { setPhase('select'); return; }
    const flashcards: Flashcard[] = due.map(d => ({
      front: d.front || `Explique la notion : ${d.notion}`,
      back: d.back || `Notion de ${d.subject} : ${d.notion}`,
      hint: d.hint || `C'est en rapport avec ${d.subject}.`,
      subject: d.subject,
    }));
    resetSession();
    setCards(flashcards);
    setPhase('session');
  }, [childId]);

  const openCollection = useCallback(async () => {
    setPhase('loading');
    const coll = await getCollection(childId);
    setCollectionCards(coll);
    setPhase('collection');
  }, [childId]);

  const handleRate = useCallback(async (success: boolean, childAnswer: string) => {
    const current = cards[currentIndex];
    const newResult: CardResult = { card: current, success, childAnswer };
    const newResults = [...results, newResult];
    setResults(newResults);

    await rateCard(childId, {
      notion: current.front,
      subject: current.subject,
      front: current.front,
      back: current.back,
      hint: current.hint,
      last_answer: childAnswer
    }, success);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      const totalPoints = newResults.filter(r => r.success).length * 5
        + newResults.filter(r => !r.success).length * 2;
      onEarnPoints(totalPoints, 'flashcard', selectedSubject);
      await saveSession(childId, cards, totalPoints);
      setSessionPoints(totalPoints);
      setPhase('result');
    }
  }, [cards, currentIndex, childId, results, onEarnPoints, selectedSubject]);

  const reviewSingleCard = useCallback((card: Flashcard) => {
    resetSession();
    setCards([card]);
    setPhase('session');
  }, []);

  // ─── Phase Router ──────────────────────────────────────

  switch (phase) {
    case 'select':
      return (
        <FlashcardSelect
          subjects={subjects}
          dueCount={dueCount}
          onStartSession={startSession}
          onStartReview={startReviewSession}
          onOpenCollection={openCollection}
        />
      );

    case 'loading':
      return (
        <LoadingSpinner
          message="L'IA prépare tes cartes..."
          submessage={`Génération de 5 flashcards sur ${selectedSubject}`}
        />
      );

    case 'session':
      return (
        <FlashcardSession
          cards={cards}
          currentIndex={currentIndex}
          selectedSubject={selectedSubject}
          gradeLevel={gradeLevel}
          results={results}
          onRate={handleRate}
          onBack={() => setPhase('select')}
        />
      );

    case 'result':
      return (
        <FlashcardResult
          results={results}
          selectedSubject={selectedSubject}
          sessionPoints={sessionPoints}
          onReplay={() => startSession(selectedSubject)}
          onBackToSelect={() => setPhase('select')}
        />
      );

    case 'collection':
      return (
        <FlashcardCollection
          collectionCards={collectionCards}
          onBackToSelect={() => setPhase('select')}
          onReviewCard={reviewSingleCard}
        />
      );

    default:
      return null;
  }
}
