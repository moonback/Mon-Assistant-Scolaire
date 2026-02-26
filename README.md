# Mon Assistant Scolaire

Plateforme éducative intelligente et gamifiée conçue pour accompagner l'apprentissage des enfants du CP à la 6ème. Alliant l'Intelligence Artificielle générative au contrôle parental, l'application transforme le travail scolaire en une expérience interactive et structurée.

## Vision et Objectif

L'objectif de ce projet est de faciliter le travail personnel de l'enfant en offrant un mentor IA bienveillant. Contrairement aux outils de résolution automatique, cette plateforme utilise des méthodes d'accompagnement pédagogique pour guider l'élève vers la compréhension, tout en permettant aux parents de superviser les progrès et de fixer un cadre d'utilisation sain.

## Stack Technique

### Frontend
- **React 19** : Utilisation des API récentes pour une performance accrue.
- **Vite 6** : Environnement de build et de développement rapide.
- **Tailwind CSS 4** : Design système moderne via une approche utilitaire native.
- **Framer Motion** : Gestion des animations pour une interface dynamique.
- **Recharts** : Visualisation des données d'apprentissage.

### Backend et Infrastructure (BaaS)
- **Supabase** :
    - **PostgreSQL** : Gestion de la base de données relationnelle.
    - **Authentication** : Gestion sécurisée des sessions utilisateurs.
    - **Row Level Security (RLS)** : Isolation stricte des données entre les comptes.
    - **Realtime** : Synchronisation instantanée des activités et défis.

### Intelligence Artificielle
- **Google Gemini 2.0 via OpenRouter** : Modèle multimodal gérant texte et analyse d'images (vision).
- **Prompt Engineering Contextuels** : Adaptation automatique de la complexité des réponses selon le niveau scolaire de l'enfant.

## Architecture du Projet

L'organisation des fichiers suit une logique modulaire par domaine :

- `src/components/` : Composants de l'interface utilisateur segmentés par fonctionnalité (Auth, Parental, Flashcards, Layout).
- `src/services/` : Services dédiés à la logique métier (Gemini, Supabase, gestion des succès).
- `src/contexts/` : Gestion des états globaux de l'application (Authentification, Points).
- `src/hooks/` : Hooks personnalisés pour les interactions système et le temps réel.
- `src/lib/` : Initialisation des bibliothèques externes.
- `supabase/` : Scripts SQL pour le schéma de données et les politiques de sécurité.

## Schéma Logique de Données

La base de données repose sur une hiérarchie structurée :
1. **Profiles (Parents)** : Entité principale liée au compte utilisateur.
2. **Children** : Profils rattachés à un parent. Chaque profil enfant dispose de ses propres réglages (niveau, étoiles, limites de temps).
3. **Progress** : Journalisation des activités pédagogiques pour le suivi statistique.
4. **Competitions** : Système de gestion des défis entre profils d'un même foyer.
5. **Flashcards et Badges** : Tables supports pour la mémorisation et la validation des acquis.

## Installation Locale

### Prérequis
- Node.js version 20 ou supérieure
- Un projet Supabase configuré
- Une clé API OpenRouter

### Procédure
1. **Clonage du dépôt** :
   ```bash
   git clone [url-du-repository]
   cd mon-assistant-scolaire
   ```

2. **Installation des dépendances** :
   ```bash
   npm install
   ```

3. **Variables d'environnement** :
   Renommer le fichier `.env.example` en `.env` et renseigner les paramètres suivants :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
   VITE_OPENROUTER_API_KEY=votre_cle_openrouter
   ```

4. **Configuration de la Base de Données** :
   Appliquer les scripts SQL présents dans le dossier `supabase/` (priorité à `supabase_schema.sql`) via le dashboard Supabase.

## Lancement du Projet

### Environnement de Développement
```bash
npm run dev
```
L'interface est accessible par défaut sur `http://localhost:3000`.

### Construction pour la Production
```bash
npm run build
```

## Sécurité et Bonnes Pratiques

- **Isolation par RLS** : Les politiques Row Level Security garantissent que chaque utilisateur ne peut accéder qu'aux données de ses propres profils enfants.
- **Protection de l'Espace Parental** : L'accès aux paramètres sensibles est protégé par un code PIN.
- **Éthique de l'IA** : L'assistant est programmé pour ne jamais donner de réponses directes, favorisant l'apprentissage actif.

## Scalabilité et Évolutions Possibles

- **Mode Hors Ligne** : Possibilité d'intégration PWA pour une utilisation sans connexion permanente.
- **Support Multi-Plateforme** : Structure compatible avec Electron pour une version desktop (fichiers de configuration inclus).
- **Analyses Pédagogiques** : Exploitation des données de progrès pour proposer des parcours de révision personnalisés.

## Licence
Ce projet est distribué sous licence MIT. Consulter le fichier LICENSE pour plus d'informations.
