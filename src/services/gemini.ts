import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Mode = 'assistant' | 'quiz' | 'story' | 'definition' | 'fact';

const SYSTEM_INSTRUCTIONS: Record<Mode, string> = {
  assistant: `Tu es un assistant pédagogique bienveillant pour des enfants de l'école primaire (6-11 ans).
Règles :
1. Réponds UNIQUEMENT aux questions scolaires.
2. Langage simple, encourageant, avec des émojis.
3. Donne des exemples concrets.
4. Termine par une question de vérification.
5. Refuse poliment les questions non scolaires.`,

  quiz: `Tu es un générateur de quiz pour enfants.
Génère un QCM de 3 questions sur le sujet demandé.
Format JSON attendu :
[
  {
    "question": "La question ?",
    "options": ["Réponse A", "Réponse B", "Réponse C"],
    "correctAnswer": 0, // Index de la bonne réponse
    "explanation": "Une courte explication simple."
  }
]
Si le sujet n'est pas clair, choisis un sujet scolaire au hasard (animaux, espace, histoire, etc.).`,

  story: `Tu es un conteur d'histoires magiques pour enfants.
Invente une histoire courte (environ 150 mots), captivante et éducative basée sur les éléments fournis.
Utilise un vocabulaire riche mais accessible.
Ajoute une petite morale ou une leçon à la fin.`,

  definition: `Tu es un dictionnaire pour enfants.
Donne une définition très simple du mot demandé.
Donne un exemple d'utilisation dans une phrase.
Donne 1 ou 2 synonymes simples.`,

  fact: `Tu es un professeur curieux.
Donne une anecdote ou un fait surprenant ("Le saviez-vous ?") adapté aux enfants sur le thème demandé ou au hasard si aucun thème n'est donné.
Sois bref et amusant.`
};

export async function askGemini(
  prompt: string,
  mode: Mode = 'assistant',
  gradeLevel: string = 'CM1',
  image?: string // Base64 image string
): Promise<string> {
  try {
    const systemInstruction = `${SYSTEM_INSTRUCTIONS[mode]}
    
    IMPORTANT : Adapte ton langage et la complexité de tes réponses pour un élève de niveau ${gradeLevel}.
    ${gradeLevel === 'CP' || gradeLevel === 'CE1' ? 'Utilise des phrases très courtes et des mots très simples.' : ''}
    ${gradeLevel === 'CM2' || gradeLevel === '6ème' ? 'Tu peux aller un peu plus loin dans les explications, mais reste clair.' : ''}
    `;

    let contents: any = prompt;

    if (image) {
      contents = {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image.split(',')[1] // Remove data:image/jpeg;base64, prefix
            }
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: image ? "gemini-2.5-flash-image" : "gemini-3-flash-preview", // Use vision model if image provided
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: mode === 'quiz' ? 'application/json' : 'text/plain',
      },
    });

    return response.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Oups ! Une erreur s'est produite. Vérifie ta connexion.";
  }
}
