# Audit UX/UI premium — Mon Assistant Scolaire

## 1) Diagnostic UX global

### Vision actuelle
- L’application est déjà riche fonctionnellement, mais l’interface donne une impression de **superposition de styles** (cartes premium, chips, gradients, tailles de typo hétérogènes) selon les écrans.
- Le ton est bienveillant et gamifié, mais la lecture enfant/parent n’est pas toujours hiérarchisée : trop d’éléments sont au même niveau visuel.

### Forces
- Univers visuel positif (icônes, couleurs vives, vocabulaire motivant).
- Présence de feedbacks (loading, badges, succès) dans plusieurs modules.
- Base responsive existante (grilles `grid-cols-*`, navigation mobile dédiée).

### Frictions UX transverses (priorité haute)
1. **Hiérarchie inconsistante** : titres, sous-titres et CTA changent de style d’un écran à l’autre.
2. **Densité visuelle élevée** sur les écrans riches (Dashboard, Assistant, Missions) : beaucoup de cartes avec contrastes proches.
3. **Taille de texte parfois trop petite** (`text-[10px]`, `text-xs`) pour enfant et usage tablette.
4. **Feedbacks d’état incomplets** : peu d’états vides pédagogiques guidant l’action suivante.
5. **Parcours parent/enfant pas assez séparé visuellement** : même langage graphique, peu de “mode parent sécurisé” explicite.
6. **Manque de composants UI unifiés** (boutons, cartes, tags) → maintenance et cohérence limitées.

### Parcours utilisateur (enfant / parent)
- **Enfant** : entrée agréable via sélection profil, mais ensuite la navigation expose beaucoup de destinations sans priorisation contextuelle.
- **Parent** : zone PIN présente mais l’UX ressemble trop à la zone enfant (mêmes signaux ludiques), ce qui réduit la perception “pilotage”.

### Responsive
- Globalement bon, mais plusieurs sections ont des blocs “premium” très larges/padding élevés qui peuvent fatiguer sur mobile.
- Sidebar/historique (Assistant) devient secondaire sur petit écran, mais sans résumé adaptatif clair.

---

## 2) Problèmes UI prioritaires (ordre d’impact)

1. **Typographie trop compressée sur infos secondaires**
   - Problème: multiples labels en `text-[10px] uppercase`.
   - Impact: fatigue visuelle + accessibilité faible.
   - Correction: minimum `text-xs` (12px) enfant et `text-sm` pour parent.

2. **CTA primaires visuellement concurrents**
   - Problème: plusieurs boutons colorés dans une même vue.
   - Impact: hésitation, baisse du taux d’action principal.
   - Correction: 1 CTA primary par écran, secondaires “outline/ghost”.

3. **Cartes premium non standardisées**
   - Problème: rayons, ombres, bordures changent selon composants.
   - Impact: impression “patchwork”.
   - Correction: 2 variantes de cartes max (`surface`, `highlight`).

4. **États vides/erreur peu scénarisés**
   - Problème: messages fonctionnels mais peu guidants.
   - Impact: blocage utilisateur (enfant surtout).
   - Correction: message + action immédiate (“Commencer un quiz”, “Réessayer”).

5. **Navigation parentale pas assez “sérieuse”**
   - Problème: couleurs et ton trop proches des zones enfant.
   - Impact: confusion rôle parent vs enfant.
   - Correction: thème parent dédié (neutres + indigo), densité réduite, focus data.

---

## 3) Mini design system proposé (Tailwind 4 only)

### 3.1 Palette
- **Primary**: `indigo`
  - `bg-indigo-600`, `hover:bg-indigo-700`, `text-indigo-700`, `ring-indigo-200`
- **Secondary**: `violet`
  - `bg-violet-100 text-violet-700`
- **Success**: `emerald`
  - `bg-emerald-100 text-emerald-700`
- **Warning**: `amber`
  - `bg-amber-100 text-amber-700`
- **Danger**: `rose`
  - `bg-rose-100 text-rose-700`
- **Surfaces**:
  - App background: `bg-slate-50`
  - Card: `bg-white border border-slate-200`
  - Muted zone: `bg-slate-100/70`

### 3.2 Échelle typographique
- Titre page: `text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900`
- Titre section: `text-lg md:text-xl font-bold text-slate-900`
- Texte principal: `text-sm md:text-base text-slate-700`
- Métadonnée: `text-xs text-slate-500`
- **Règle**: éviter < 12px hors micro-label strict.

### 3.3 Espacements
- Page: `px-4 md:px-8 py-6 md:py-8`
- Stack verticale: `space-y-6` (mobile), `space-y-8` (desktop)
- Carte: `p-5 md:p-6`
- Grille dashboard: `grid gap-4 md:gap-6`

### 3.4 Cartes premium
- **Surface standard**
```tsx
className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 md:p-6"
```
- **Highlight (gamification)**
```tsx
className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100 shadow-sm p-5 md:p-6"
```

### 3.5 Boutons
- **Primary**
```tsx
className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-11"
```
- **Secondary**
```tsx
className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] min-h-11"
```
- **Ghost**
```tsx
className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 min-h-10"
```

### 3.6 États
- Hover: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- Active: `active:scale-[0.98]`
- Focus: `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- Loading: icône `animate-spin` + label clair (“Chargement…”)

---

## 4) Améliorations écran par écran

### A. Dashboard enfant
- **Nouvelle structure**
  1. Hero compact (salutation + progression du jour)
  2. 3 KPI max (étoiles, série du jour, temps d’apprentissage)
  3. Bloc “Reprendre là où tu t’es arrêté”
  4. Activités recommandées (2 cartes)
  5. Historique compact
- **Pourquoi**: réduire la charge cognitive et favoriser l’action immédiate.

### B. Assistant IA
- **Nouvelle structure**
  1. Input principal sticky
  2. Réponse en cartes segmentées (explication / exemple / mini défi)
  3. Historique repliable (drawer mobile)
- **Pourquoi**: prioriser la conversation active.
- **État vide enfant**: “Pose ta première question magique ✨” + suggestions cliquables.

### C. Quiz / Flashcards
- **Nouvelle structure**
  1. Pré-session (matière + difficulté + temps estimé)
  2. Session plein focus (1 carte, 1 action)
  3. Résultat avec progression visuelle + recommandation
- **Pourquoi**: clarifier début/milieu/fin et réduire l’errance.

### D. Missions quotidiennes
- **Nouvelle structure**
  1. Bandeau de progression quotidienne
  2. Mission mot + mission logique en cartes symétriques
  3. Récompense explicite après validation
- **Pourquoi**: renforcer la routine et la motivation.

### E. Espace parental
- **Nouvelle structure**
  1. Vue synthèse (temps, progression, points faibles)
  2. Alertes actionnables (limites, sujets bloqués)
  3. Réglages sécurité et permissions
- **Pourquoi**: mode pilotage rapide, orienté décisions.

### F. Onboarding / Sélection enfant
- **Nouvelle structure**
  1. Titre + explication parent discrète
  2. Cartes enfant plus grandes (touch-friendly)
  3. CTA parent séparé visuellement
- **Pourquoi**: accès ultra simple pour enfant, sans bruit.

---

## 5) Composants UI à créer (réutilisables)

1. `AppCard`
- Props: `variant: 'surface' | 'highlight'`, `as`, `className`
- Usage: unifier toutes les cartes.

2. `AppButton`
- Props: `variant: 'primary' | 'secondary' | 'ghost'`, `loading`, `icon`
- Usage: cohérence des CTA + états.

3. `SectionHeader`
- Props: `title`, `subtitle`, `action`
- Usage: harmoniser en-têtes d’écran.

4. `ProgressPill`
- Props: `label`, `value`, `tone`
- Usage: feedback court (ex: “2 missions restantes”).

5. `EmptyStateKid`
- Props: `title`, `description`, `ctaLabel`, `onCta`
- Usage: états vides pédagogiques.

---

## 6) Animations recommandées (Motion / Framer Motion)

### Principes
- Durées courtes: `0.18s` à `0.35s`
- Easing: `easeOut` pour entrées, `easeInOut` pour transitions
- Éviter les rebonds forts (kids-friendly non agressif)

### Exemples concrets

#### Entrée de carte
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
/>
```

#### Feedback succès (mission validée)
```tsx
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.22, ease: 'easeOut' }}
/>
```

#### Transition d’onglet
```tsx
<AnimatePresence mode="wait">
  <motion.section
    key={tab}
    initial={{ opacity: 0, x: 8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -8 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
  />
</AnimatePresence>
```

#### Skeleton agréable
```tsx
<div className="animate-pulse rounded-2xl bg-slate-100 h-24" />
```

---

## 7) Résumé des gains UX attendus

- Navigation plus lisible (enfant sait quoi faire en < 3 secondes).
- Meilleure séparation enfant/parent (confiance + contrôle).
- Cohérence visuelle globale grâce aux composants unifiés.
- Accessibilité renforcée (tailles, contrastes, cibles tactiles).
- Réduction de la fatigue visuelle mobile.
- Engagement amélioré via micro-feedbacks doux et progressifs.

---

## Plan d’exécution recommandé (sans toucher la logique métier)
1. Créer `AppButton`, `AppCard`, `SectionHeader`, `EmptyStateKid`.
2. Refactor visuel progressif écran par écran (Dashboard → Assistant → Missions → Flashcards → Parent).
3. Uniformiser tailles typo et paddings.
4. Ajouter micro-interactions standardisées.
5. Validation accessibilité (focus, contraste, tactile).
