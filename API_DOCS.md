# 📖 Documentation de l'API & Services

Cette application utilise principalement des APIs de services tiers (Supabase, Gemini). Cette section documente la structure des appels et les modes d'intelligence artificielle utilisés.

---

## 🤖 Services d'Intelligence Artificielle (Gemini/OpenRouter)

L'application communique avec l'IA via le service `gemini.ts`. Voici les modes disponibles :

| Mode | Description | Type de Retour |
| :--- | :--- | :--- |
| `assistant` | Chat pédagogique général (méthode socratique). | Texte (Markdown) |
| `homework` | Aide spécifique aux devoirs sur texte ou image. | Texte (Markdown) |
| `quiz` | Génération de QCM par l'IA. | JSON (Questions/Options) |
| `story` | Création d'histoires éducatives personnalisées. | Texte (Markdown) |
| `definition` | Définition simple adaptée à l'âge. | Texte (Markdown) |
| `flashcard` | Création de cartes de révision. | JSON (Tableau) |
| `wordOfTheDay` | Sélection d'un mot complexe expliqué simplement. | JSON |
| `problemOfTheDay`| Défi logique quotidien. | JSON |

### Format des requêtes IA
Les requêtes sont envoyées via `askGemini(prompt, mode, gradeLevel, image, childContext)`.
- **System Prompt** : Injecté automatiquement en fonction du `mode` et du `gradeLevel`.
- **Image Support** : Le mode `homework` accepte l'envoi d'images base64 pour l'OCR et l'analyse pédagogique.

---

## 🎙️ Gemini Live (Native Audio)

Utilise le protocole WebSocket de Google Generative AI.
- **Modèle** : `gemini-2.0-flash-native-audio-latest`
- **Configuration** :
  - Modalité : Audio uniquement (entrée/sortie).
  - Voix : `Aoede` (chaleureuse, mentor).
  - Sample Rate : 16000Hz (Input) / 24000Hz (Output).

---

## 💾 Services Supabase (Database)

### RPC (Remote Procedure Calls)
Des fonctions SQL personnalisées sont exposées via l'API Supabase :

#### `increment_child_stars`
Incrémente de manière atomique le compteur d'étoiles d'un enfant.
- **Arguments** : `child_id (uuid)`, `count (int)`
- **Exemple** : `supabase.rpc('increment_child_stars', { child_id, count: 5 })`

---

## 🔧 Intégrations Frontend

### `dailyChallengeService.ts`
Gère la génération et la validation des défis quotidiens.
- Récupère l'état actuel depuis Supabase.
- Utilise l'IA pour renouveler les défis si nécessaire.

### `flashcardService.ts`
- Sauvegarde et récupère les decks de flashcards par profil enfant.
- Gère le "Space Repetition" (algorithme simplifié).
