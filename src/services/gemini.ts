import { Mode, SYSTEM_INSTRUCTIONS } from './prompts';
import { logAiEvent } from './aiLogger';

// ─── Types ───────────────────────────────────────────────

interface OpenRouterMessage {
  role: 'system' | 'user';
  content: string | OpenRouterContentPart[];
}

type OpenRouterContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const JSON_MODES: Mode[] = ['quiz', 'wordOfTheDay', 'problemOfTheDay'];

// ─── System Prompt Builder ───────────────────────────────

export function buildAssistantSystemPrompt(
  gradeLevel: string,
  childContext?: string,
  weakPoints?: string[]
): string {
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

// ─── JSON Extraction (robust) ────────────────────────────

function extractJSON(content: string): string {
  // Try to find a JSON block in markdown code fence first
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Find the outermost JSON structure
  const firstObj = content.indexOf('{');
  const lastObj = content.lastIndexOf('}');
  const firstArr = content.indexOf('[');
  const lastArr = content.lastIndexOf(']');

  // Determine if the outermost structure is an object or array
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    if (lastArr !== -1) return content.substring(firstArr, lastArr + 1);
  }
  if (firstObj !== -1 && lastObj !== -1) {
    return content.substring(firstObj, lastObj + 1);
  }

  return content;
}

// ─── Main API Call ───────────────────────────────────────

export async function askGemini(
  prompt: string,
  mode: Mode = 'assistant',
  gradeLevel: string = 'CM1',
  image?: string,
  childContext?: string,
  weakPoints?: string[]
): Promise<string> {
  const startedAt = performance.now();
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

    const userContent: OpenRouterContentPart[] = [
      { type: 'text', text: prompt || (image ? "Aide-moi à comprendre cet exercice." : "") }
    ];

    if (image) {
      userContent.push({ type: 'image_url', image_url: { url: image } });
    }

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userContent }
    ];

    logAiEvent({
      stage: 'request',
      mode,
      promptLength: prompt?.length || 0,
      gradeLevel,
      hasImage: Boolean(image),
    });

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
        messages,
        response_format: JSON_MODES.includes(mode) ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur OpenRouter (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    let content: string = data.choices?.[0]?.message?.content || "";

    // Clean JSON responses
    if (JSON_MODES.includes(mode)) {
      content = extractJSON(content);
    }

    logAiEvent({
      stage: 'response',
      mode,
      durationMs: Math.round(performance.now() - startedAt),
      responseLength: content.length,
      gradeLevel,
      hasImage: Boolean(image),
    });

    return content || (mode === 'quiz' ? "[]" : mode === 'wordOfTheDay' || mode === 'problemOfTheDay' ? "{}" : "Désolé, je n'ai pas pu générer de réponse.");
  } catch (error) {
    console.error("Erreur OpenRouter:", error);
    logAiEvent({
      stage: 'error',
      mode,
      durationMs: Math.round(performance.now() - startedAt),
      gradeLevel,
      hasImage: Boolean(image),
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
    if (mode === 'quiz') return "[]";
    if (mode === 'wordOfTheDay' || mode === 'problemOfTheDay') return "{}";
    return "Oups ! Une erreur s'est produite. Vérifie ta connexion et réessaie.";
  }
}
