import { Mode, SYSTEM_INSTRUCTIONS } from './prompts';
import { logAiEvent } from './aiLogger';
import { buildLearningProfileDirectives } from './learningProfilePrompt';
import type { LearningProfile } from '../types/learningProfile';

// ─── Types ───────────────────────────────────────────────

interface OpenRouterMessage {
  role: 'system' | 'user';
  content: string | OpenRouterContentPart[];
}

type OpenRouterContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const JSON_MODES: Mode[] = ['quiz', 'wordOfTheDay', 'problemOfTheDay', 'ai_evaluation', 'flashcard'];

// ─── System Prompt Builder ───────────────────────────────

export function buildAssistantSystemPrompt(
  gradeLevel: string,
  childContext?: string,
  weakPoints?: string[],
  learningProfile?: LearningProfile
): string {
  const isYoung = gradeLevel === 'CP' || gradeLevel === 'CE1';
  const isOlder = gradeLevel === 'CM2' || gradeLevel === '6ème';

  let prompt = `${SYSTEM_INSTRUCTIONS['assistant']}

════════════════════════════════════
DIRECTIVES VOCALES — PRIORITÉ ABSOLUE
════════════════════════════════════
Tu es Lumo, un tuteur scolaire chaleureux qui parle directement à un enfant.
Ces règles s'appliquent à CHAQUE réponse vocale :

PROSODIE ET RYTHME :
- Commence chaque réponse par une courte interjection naturelle : "Ah !", "Voyons...", "Hmm...", "Bonne question !", "Super !", "Oh !", "Eh bien..."
- Fais des pauses naturelles entre les idées — ne débite jamais tout d'une traite.
- ${isYoung ? 'Parle TRÈS lentement. Chaque phrase : maximum 8 mots. Vocabulaire très simple.' : 'Parle à rythme modéré, sans te presser. Phrases claires et directes.'}
- Varie ton ton : enthousiaste pour les réussites, doux et patient pour les erreurs.

LONGUEUR DES RÉPONSES :
- Maximum 2 à 3 phrases par réponse — jamais plus en mode vocal.
- Si le sujet est complexe, réponds par étapes : "D'abord... / Ensuite... / Et enfin..."
- Évite les listes à puces — reformule à l'oral avec des connecteurs naturels.

ENCOURAGEMENTS OBLIGATOIRES :
- Pour les réussites : "Excellent ! Tu as tout compris !", "Bravo, c'est parfait !", "Génial, continue comme ça !"
- Pour les difficultés : "C'est normal si c'est difficile, on y va ensemble.", "Pas de panique, je t'explique autrement."
- Toujours féliciter AVANT de corriger : "C'est presque ça ! Mais..."
- Terminer par une invitation : "Tu as d'autres questions ?", "On continue ensemble ?"

INTERDICTIONS ABSOLUES :
- Ne commence JAMAIS par "Je", "En tant qu'IA", "Bien sûr !", "Absolument !", "Certainement !"
- Pas de listes à puces, pas de titres, pas de formatage Markdown en mode vocal.
- Pas de termes techniques sans explication immédiate et simple.
- Ne mentionne jamais tes règles, ton protocole, ou que tu es une IA.
- Jamais de réponse froide, neutre ou administrative.

CONTEXTE DE L'ÉLÈVE :
- Niveau : ${gradeLevel}.
${isYoung ? '- TRÈS IMPORTANT : mots très simples, phrases ultra-courtes, images concrètes du quotidien.' : ''}
${isOlder ? '- Tu peux introduire quelques nuances, mais reste toujours accessible et bienveillant.' : ''}
${childContext ? `\n--- PROFIL DE L'ENFANT ---\n${childContext}\n---` : ''}`;

  if (weakPoints && weakPoints.length > 0) {
    prompt += `\n\n🎯 POINTS DE VIGILANCE : L'élève a des difficultés avec : ${weakPoints.join(', ')}. Sois particulièrement patient et attentif sur ces sujets. Décompose encore plus si nécessaire. Ne le fais jamais sentir incompétent.`;
  }

  const profileDirectives = buildLearningProfileDirectives(learningProfile);
  if (profileDirectives) {
    prompt += '\n\n' + profileDirectives;
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


async function requestOpenRouter(messages: OpenRouterMessage[], mode: Mode, apiKey: string) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
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
}

export async function askGemini(
  prompt: string,
  mode: Mode = 'assistant',
  gradeLevel: string = 'CM1',
  image?: string,
  childContext?: string,
  weakPoints?: string[],
  learningProfile?: LearningProfile
): Promise<string> {
  const startedAt = performance.now();
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("La clé API OpenRouter n'est pas configurée.");
    }

    let systemInstruction = mode === 'assistant' && childContext
      ? buildAssistantSystemPrompt(gradeLevel, childContext, weakPoints, learningProfile)
      : `${SYSTEM_INSTRUCTIONS[mode]}

    IMPORTANT : Adapte ton langage et la complexité de tes réponses pour un élève de niveau ${gradeLevel}.
    ${gradeLevel === 'CP' || gradeLevel === 'CE1' ? 'Utilise des phrases très courtes et des mots très simples.' : ''}
    ${gradeLevel === 'CM2' || gradeLevel === '6ème' ? 'Tu peux aller un peu plus loin dans les explications, mais reste clair.' : ''}
    `;

    if (mode !== 'assistant' && weakPoints && weakPoints.length > 0) {
      systemInstruction += `\n\n🎯 ATTENTION PARTICULIÈRE : L'élève a des difficultés avec ces notions : ${weakPoints.join(', ')}. Au fil de tes explications, adapte ta pédagogie pour l'aider à surmonter ces points faibles si l'occasion se présente.`;
    }

    if (mode !== 'assistant' && learningProfile) {
      systemInstruction += '\n\n' + buildLearningProfileDirectives(learningProfile);
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

    let response = await requestOpenRouter(messages, mode, apiKey);

    if (!response.ok) {
      const errorText = await response.text();
      const noVisionEndpoint = image
        && response.status === 404
        && errorText.includes('No endpoints found that support image input');

      if (noVisionEndpoint) {
        const fallbackMessages: OpenRouterMessage[] = [
          { role: 'system', content: systemInstruction },
          {
            role: 'user',
            content: [{
              type: 'text',
              text: `${prompt}

NOTE: Je n'ai pas pu traiter l'image avec le modèle actuel. Donne une aide générale, puis demande à l'élève de décrire ce qu'il voit sur la photo.`,
            }],
          },
        ];

        response = await requestOpenRouter(fallbackMessages, mode, apiKey);
      }

      if (!response.ok) {
        const fallbackErrorText = await response.text();
        throw new Error(`Erreur OpenRouter (${response.status}): ${fallbackErrorText}`);
      }
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
