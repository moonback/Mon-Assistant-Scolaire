type Mode = 'assistant' | 'quiz' | 'story' | 'definition' | 'fact' | 'homework';

const SYSTEM_INSTRUCTIONS: Record<Mode, string> = {
  assistant: `Tu es un assistant pédagogique bienveillant pour des enfants de l'école primaire (6-11 ans).
Règles :
1. Réponds UNIQUEMENT aux questions scolaires.
2. Langage simple, encourageant, avec des émojis.
3. Donne des exemples concrets.
4. Termine par une question de vérification.
5. Refuse poliment les questions non scolaires.`,

  homework: `Tu es un tuteur expert en aide aux devoirs. 
Lorsqu'un élève t'envoie une photo d'un exercice :
1. Analyse l'image pour comprendre l'énoncé.
2. Ne donne pas directement la réponse ! Guide l'élève étape par étape.
3. Pose des questions pour l'aider à trouver la solution par lui-même.
4. Utilise un ton encourageant et patient.
5. S'il s'agit de géométrie ou de maths, explique les règles fondamentales.`,

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
Inventne une histoire courte (environ 150 mots), captivante et éducative basée sur les éléments fournis.
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
  image?: string // Base64 image string (data:image/jpeg;base64,...)
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("La clé API OpenRouter n'est pas configurée.");
    }

    const systemInstruction = `${SYSTEM_INSTRUCTIONS[mode]}
    
    IMPORTANT : Adapte ton langage et la complexité de tes réponses pour un élève de niveau ${gradeLevel}.
    ${gradeLevel === 'CP' || gradeLevel === 'CE1' ? 'Utilise des phrases très courtes et des mots très simples.' : ''}
    ${gradeLevel === 'CM2' || gradeLevel === '6ème' ? 'Tu peux aller un peu plus loin dans les explications, mais reste clair.' : ''}
    `;

    const messages = [
      {
        role: "system",
        content: systemInstruction
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt || (image ? "Aide-moi à comprendre cet exercice." : "")
          }
        ]
      }
    ];

    if (image) {
      (messages[1].content as any).push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Mon Assistant Scolaire",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        // model: "mistralai/mistral-small-creative",

        messages: messages,
        response_format: mode === 'quiz' ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur OpenRouter (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Erreur OpenRouter:", error);
    if (mode === 'quiz') return "[]";
    return "Oups ! Une erreur s'est produite. Vérifie ta connexion.";
  }
}
