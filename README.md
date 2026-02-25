# 🎓 Mon Assistant Scolaire (Family AI)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Pro-4285F4?logo=google-cloud&logoColor=white)](https://deepmind.google/technologies/gemini/)

**Mon Assistant Scolaire** est une plateforme éducative premium conçue pour accompagner les enfants du CP à la 6ème dans leur parcours scolaire grâce à l'intelligence artificielle générative (Google Gemini). L'application offre une expérience immersive, ludique et sécurisée, tout en fournissant aux parents des outils de suivi et de contrôle avancés.

---

## 🚀 Fonctionnalités Principales

- **🤖 Mentor IA & Aide aux Devoirs** : Un tuteur intelligent qui utilise la méthode socratique pour guider l'enfant sans donner les réponses directement.
- **🎙️ Gemini Live** : Interaction vocale en temps réel pour une expérience d'apprentissage naturelle.
- **📊 Tableau de Bord Multi-Enfants** : Gestion de plusieurs profils avec personnalisation des niveaux (CP → 6ème).
- **📝 Quizz & Flashcards** : Génération automatique de supports de révision par l'IA sur n'importe quel sujet.
- **🎨 Tableau de Dessin & Whiteboard** : Espace créatif et pédagogique pour expliquer visuellement des concepts.
- **🏆 Système de Récompenses** : Gamification avec des étoiles, des badges et des défis quotidiens.
- **🔐 Espace Parental** : Protection par PIN, limites de temps quotidien, et verrouillage automatique à l'heure du coucher.

---

## 🛠️ Stack Technique

- **Frontend** : [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling** : [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) (Animations)
- **Backend & Auth** : [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Desktop** : [Electron](https://www.electronjs.org/)
- **Intelligence Artificielle** : 
  - [Google Gemini 1.5 Pro/Flash](https://ai.google.dev/) via SDK natif (Real-time Audio)
  - [OpenRouter](https://openrouter.ai/) (Fallback & Text-based tasks)
- **Charts** : [Recharts](https://recharts.org/)

---

## 📦 Installation & Configuration

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- Un compte [Supabase](https://supabase.com/)
- Une clé API [Google AI Studio](https://aistudio.google.com/)

### Étapes d'installation

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/votre-user/Mon-Assistant-Scolaire.git
   cd Mon-Assistant-Scolaire
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** :
   Créez un fichier `.env` à la racine (ou dupliquez `.env.example`) :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
   VITE_GEMINI_API_KEY=votre_cle_google_gemini
   VITE_OPENROUTER_API_KEY=votre_cle_openrouter
   ```

4. **Initialiser la base de données** :
   Exécutez le script contenu dans `supabase_schema.sql` dans l'éditeur SQL de votre console Supabase.

---

## 🏃 Execution

### Mode Développement (Web)
```bash
npm run dev
```
L'application sera disponible sur `http://localhost:3000`.

### Mode Desktop (Electron)
```bash
npm run electron:dev
```

### Build pour la Production
```bash
npm run build
```

---

## 📂 Structure du Projet

```text
├── electron/              # Scripts du processus principal Electron
├── src/
│   ├── components/        # Composants UI (Dashboard, Quiz, Assistant, etc.)
│   ├── hooks/             # Hooks custom (Auth, Gemini Live, Speech)
│   ├── lib/               # Configuration des clients (Supabase)
│   ├── services/          # Logique métier et appels API (Gemini, Challenges)
│   ├── types/             # Definitions TypeScript
│   ├── App.tsx            # Routeur et layout principal
│   └── main.tsx           # Point d'entrée React
├── supabase/              # Migrations et schémas SQL
└── vite.config.ts         # Configuration Vite
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez consulter le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails sur le workflow de développement.

## 📄 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---

*Développé avec ❤️ pour l'avenir de nos enfants.*
