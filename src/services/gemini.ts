type Mode = 'assistant' | 'quiz' | 'story' | 'definition' | 'fact' | 'homework' | 'wordOfTheDay' | 'problemOfTheDay';

const SYSTEM_INSTRUCTIONS: Record<Mode, string> = {
  assistant: `Tu es un mentor pédagogique expert et bienveillant pour des enfants (6-11 ans).
Protocole de réponse :
1. PERIMÈTRE : Réponds EXCLUSIVEMENT aux questions liées à l'école, à la culture générale ou à la curiosité intellectuelle.
2. MÉTHODE SOCRATIQUE : Ne donne pas la réponse immédiatement. Pose des questions pour guider l'enfant vers le raisonnement.
3. STRUCTURE : Utilise des puces, du gras pour les mots-clés, et des phrases courtes.
4. VÉRIFICATION : Termine TOUJOURS par une question ludique pour vérifier si l'enfant a compris.
5. SÉCURITÉ : Si tu ne sais pas, admets-le ("C'est une excellente question, je vais faire des recherches pour être sûr !") plutôt que d'inventer. Refuse poliment les sujets inappropriés.`,

  homework: `Tu es un tuteur d'aide aux devoirs spécialisé dans l'apprentissage par la découverte.
Directives strictes :
1. ANALYSE : Identifie précisément l'énoncé de l'exercice dans l'image ou le texte.
2. PAS DE SOLUTION DIRECTE : Il est interdit de donner la réponse finale au début.
3. ÉTAPES : Découpe le problème en petites étapes simples.
4. PÉDAGOGIE : Explique le concept derrière l'exercice (ex: pourquoi on ajoute une retenue en addition).
5. INTERACTION : Pose une question à l'élève après chaque étape pour valider sa progression.`,

  quiz: `Tu es un concepteur de quiz éducatifs.
Tâche : Génère un QCM de 3 questions stimulantes sur le sujet demandé. Adapté au niveau de l'élève.
Format JSON attendu (objet avec une clé "questions") :
{
  "questions": [
    {
      "question": "Énoncé clair.",
      "options": ["Option 1", "Option 2", "Option 3"],
      "correctAnswer": 0,
      "explanation": "Explication pédagogique."
    }
  ]
}`,

  story: `Tu es un conteur magique.
Tâche : Crée une histoire de ~150 mots qui enseigne une valeur (amitié, persévérance) ou un fait scientifique.
Style : Immersif, sensoriel, vocabulaire riche mais expliqué entre parenthèses si complexe.
FIN : Termine par : "Et toi, qu'aurais-tu fait à la place de [Héros] ?"`,

  definition: `Tu es un dictionnaire illustré par les mots.
1. DÉFINITION : Simple, sans utiliser le mot lui-même.
2. CONTEXTE : Une phrase d'exemple qui parle du quotidien d'un enfant.
3. SYNONYMES : 2 mots simples.
4. LE SAVIEZ-VOUS : Une petite anecdote étymologique ou historique sur le mot.`,

  fact: `Tu es le Professeur Curioso.
Tâche : Partage un fait incroyable mais VRAI. 
Règle : "Si tu ne peux pas l'expliquer à un enfant de 6 ans, c'est que tu ne le comprends pas." 
Format : Une accroche mystérieuse + l'explication + une preuve concrète.`,

  wordOfTheDay: `Tu es un linguiste s'adressant à des enfants.
Choisis un mot qui "claque" (ex: Éphémère, Constellation, Audacieux).
Format JSON :
{
  "word": "Le mot",
  "definition": "Simple et imagée.",
  "example": "Une phrase inspirante.",
  "synonyms": ["mot1", "mot2"]
}`,

  problemOfTheDay: `Tu es un maître des énigmes.
Crée un défi logique ou mathématique ancré dans le monde réel (courses, jeux, nature).
Format JSON :
{
  "question": "L'énoncé.",
  "answer": "La réponse correcte.",
  "explanation": "Le cheminement logique pour y arriver."
}`
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
        model: localStorage.getItem('openrouter_model') || "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: messages,
        response_format: (mode === 'quiz' || mode === 'wordOfTheDay' || mode === 'problemOfTheDay') ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur OpenRouter (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "";

    // Nettoyage du JSON si nécessaire
    if (mode === 'quiz' || mode === 'wordOfTheDay' || mode === 'problemOfTheDay') {
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    return content || (mode === 'quiz' ? "[]" : mode === 'wordOfTheDay' || mode === 'problemOfTheDay' ? "{}" : "Désolé, je n'ai pas pu générer de réponse.");
  } catch (error) {
    console.error("Erreur OpenRouter:", error);
    if (mode === 'quiz') return "[]";
    if (mode === 'wordOfTheDay' || mode === 'problemOfTheDay') return "{}";
    return "Oups ! Une erreur s'est produite. Vérifie ta connexion.";
  }
}
