import { Mode, SYSTEM_INSTRUCTIONS } from './prompts';

export function buildAssistantSystemPrompt(gradeLevel: string, childContext?: string, weakPoints?: string[]): string {
  let prompt = `${SYSTEM_INSTRUCTIONS['assistant']}

DIRECTIVES POUR LA VOIX (IMPORTANT) :
- LANGUE : RÉPONDS TOUJOURS EN FRANÇAIS.
- STYLE : Sois un mentor chaleureux. Parle DIRECTEMENT à l'enfant.
- INTERDICTION : Ne commence JAMAIS tes phrases par ton plan ou ton protocole (ex: Pas de "J'analyse...", "Initialisation...", "Évaluation...").
- COMPORTEMENT : Oublie que tu es une IA. Agis comme si tu étais un vrai professeur dans la pièce.

CONTEXTE DE L'ÉLÈVE :
- Niveau : ${gradeLevel}.
${gradeLevel === 'CP' || gradeLevel === 'CE1' ? '- Phrases TRÈS courtes.' : ''}
${childContext ? `\n--- INFOS SUR L'ENFANT ---\n${childContext}\n---` : ''}`;

  if (weakPoints && weakPoints.length > 0) {
    prompt += `\n\n🎯 ATTENTION PARTICULIÈRE : L'élève a des difficultés avec ces notions : ${weakPoints.join(', ')}. Au fil de tes explications, adapte ta pédagogie pour l'aider à surmonter ces points faibles si l'occasion se présente.`;
  }
  return prompt;
}

export async function askGemini(
  prompt: string,
  mode: Mode = 'assistant',
  gradeLevel: string = 'CM1',
  image?: string, // Base64 image string (data:image/jpeg;base64,...)
  childContext?: string, // Optional child profile context
  weakPoints?: string[] // Optional array of concepts the child struggles with
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("La clé API OpenRouter n'est pas configurée.");
    }

    let systemInstruction = mode === 'assistant' && childContext
      ? buildAssistantSystemPrompt(gradeLevel, childContext, weakPoints)
      : `${SYSTEM_INSTRUCTIONS[mode]}
    
    IMPORTANT : Adapte ton langage et la complexité de tes réponses pour un élève de niveau ${gradeLevel}.
    ${gradeLevel === 'CP' || gradeLevel === 'CE1' ? 'Utilise des phrases très courtes et des mots très simples.' : ''}
    ${gradeLevel === 'CM2' || gradeLevel === '6ème' ? 'Tu peux aller un peu plus loin dans les explications, mais reste clair.' : ''}
    `;

    if (mode !== 'assistant' && weakPoints && weakPoints.length > 0) {
      systemInstruction += `\n\n🎯 ATTENTION PARTICULIÈRE : L'élève a des difficultés avec ces notions : ${weakPoints.join(', ')}. Au fil de tes explications, adapte ta pédagogie pour l'aider à surmonter ces points faibles si l'occasion se présente.`;
    }

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
      const firstObj = content.indexOf('{');
      const lastObj = content.lastIndexOf('}');
      const firstArr = content.indexOf('[');
      const lastArr = content.lastIndexOf(']');

      if (firstObj !== -1 && lastObj !== -1 && (firstArr === -1 || firstObj < firstArr)) {
        content = content.substring(firstObj, lastObj + 1);
      } else if (firstArr !== -1 && lastArr !== -1) {
        content = content.substring(firstArr, lastArr + 1);
      }
    }

    return content || (mode === 'quiz' ? "[]" : mode === 'wordOfTheDay' || mode === 'problemOfTheDay' ? "{}" : "Désolé, je n'ai pas pu générer de réponse.");
  } catch (error) {
    console.error("Erreur OpenRouter:", error);
    if (mode === 'quiz') return "[]";
    if (mode === 'wordOfTheDay' || mode === 'problemOfTheDay') return "{}";
    return "Oups ! Une erreur s'est produite. Vérifie ta connexion.";
  }
}
