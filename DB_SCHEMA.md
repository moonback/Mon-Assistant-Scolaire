# 🗄️ Schéma de la Base de Données

L'application repose sur Supabase (PostgreSQL). Voici la description détaillée des tables et de leurs relations.

---

## 📊 Schéma des Tables

### 1. `profiles`
Stocke les informations du compte parent.
- `id` (uuid, PK) : Identifiant unique (lié à `auth.users`).
- `username` (text) : Nom d'affichage du parent ou de la famille.
- `avatar_url` (text) : URL de l'avatar du parent.
- `parent_pin` (text) : Code PIN à 4 chiffres pour sécuriser l'espace parental.
- `ai_model` (text) : Préférence du modèle IA (ex: `gemini-pro`).
- `created_at` (timestamp) : Date de création du compte.

### 2. `children`
Profils individuels des enfants rattachés à un compte parent.
- `id` (uuid, PK) : Identifiant unique de l'enfant.
- `parent_id` (uuid, FK) : Référence à `profiles.id`.
- `name` (text) : Prénom de l'enfant.
- `avatar_url` (text) : Avatar choisi par l'enfant.
- `grade_level` (text) : Niveau scolaire (`CP`, `CE1`, `CE2`, `CM1`, `CM2`, `6ème`).
- `stars` (int) : Nombre total d'étoiles gagnées.
- `daily_time_limit` (int) : Temps quotidien autorisé en minutes.
- `bedtime` (text) : Heure de coucher (ex: `"20:30"`).
- `reward_goals` (jsonb) : Liste des objectifs et récompenses définis par le parent.
- `blocked_topics` (text[]) : Liste des sujets interdits à l'IA pour cet enfant.
- `allowed_subjects` (text[]) : Liste des matières scolaires autorisées pour cet enfant.

### 3. `progress`
Historique des activités pour le suivi pédagogique.
- `id` (uuid, PK) : Identifiant du log.
- `child_id` (uuid, FK) : Référence à `children.id`.
- `user_id` (uuid, FK) : Référence à `profiles.id` (Parent).
- `subject` (text) : Matière concernée (Maths, Français, Science, etc.).
- `activity_type` (text) : Nature de l'activité (Quiz, Flashcard, Chat).
- `score` (int) : Score obtenu ou progression enregistrée.
- `date` (timestamp) : Date de l'activité.

### 4. `flashcard_decks`
Decks de révision créés par l'IA ou manuellement.
- `id` (uuid, PK) : Identifiant du deck.
- `child_id` (uuid, FK) : Référence à `children.id`.
- `title` (text) : Titre du deck.
- `subject` (text) : Matière.
- `cards` (jsonb) : Tableau d'objets contenant `front`, `back`, `hint`.

---

## 🔐 Sécurité & RLS (Row Level Security)

Toutes les tables sont protégées par RLS. Les politiques garantissent que :
- Un utilisateur (parent) ne peut voir que les profils de ses propres enfants (`auth.uid() = parent_id`).
- L'accès aux statistiques `progress` est filtré par l'`id` du parent connecté.
- Les fonctions de modification (INSERT/UPDATE) vérifient que le `parent_id` correspond à l'utilisateur authentifié.

---

## 🔄 Triggers & Helpers

- **`handle_new_user()`** : Se déclenche à l'inscription pour créer automatiquement une entrée dans `profiles` et un premier profil enfant par défaut.
- **`increment_child_stars()`** : Fonction RPC permettant d'ajouter des points de manière sécurisée sans exposer tout l'objet `children` en écriture.
