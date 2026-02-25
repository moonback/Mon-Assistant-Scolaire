# Mon Assistant Scolaire — Roadmap des fonctionnalités pédagogiques

## Objectif du document
Ce document définit un ensemble de fonctionnalités pédagogiques **réalistes, implémentables et à forte valeur éducative** pour enrichir Mon Assistant Scolaire (React + Vite + Supabase).

Il sert de :
- roadmap fonctionnelle
- base produit partagée (équipe produit, design, dev)
- référence pour prioriser les développements futurs

---

## ÉTAT DE L'IMPLÉMENTATION
- [x] **Mission Quotidienne Intelligente** (Implémenté)
- [x] **Atelier "Explique avec tes mots"** (Implémenté)
- [x] **Révision Espacée (SRS)** (Base implémentée)
- [x] **Tableau de Maîtrise** (Implémenté)
- [x] **Plan d'Accompagnement Hebdo** (Implémenté)
- [x] **Portefeuille de Progrès** (Implémenté via Milestones)
- [ ] **Cartographie des Difficultés** (Analyse de base faite, IA à renforcer)

---

## 1) Mission Quotidienne Intelligente (enfant) [TERMINÉ]

1. **Nom de la fonctionnalité**  
   Mission Quotidienne Intelligente

2. **Objectif pédagogique clair**  
   Installer une routine d’apprentissage courte et efficace, adaptée au niveau réel de l’enfant.

3. **Compétences travaillées**  
   Français (lecture, compréhension), Mathématiques (calcul, problèmes), méthode (concentration, régularité).

4. **Âge / niveau scolaire concerné**  
   6–11 ans (CP à CM2), avec paramétrage par niveau.

5. **Description de l’expérience enfant**  
   Chaque jour, l’enfant reçoit 3 mini-missions (5–10 min au total) :
   - 1 activité de consolidation (ce qu’il sait déjà)
   - 1 activité de progression (nouvelle difficulté)
   - 1 activité de réactivation (notion vue récemment)
   
   L’enfant peut choisir l’ordre des missions, obtenir des indices progressifs, et recevoir un feedback simple après chaque mission.

6. **Valeur ajoutée pour les parents**  
   Vue rapide “mission du jour terminée / partielle / non commencée”, temps passé, taux d’autonomie (avec ou sans aide).

7. **Mécanique de motivation (points, badges, progression)**  
   - Points d’effort (attribués même en cas d’erreur corrigée)
   - Badge “Régularité” (3, 7, 14 jours)
   - Barre de progression hebdomadaire

8. **Exemple concret d’utilisation**  
   Lundi : Zoé (CE2) réalise une mission lecture (texte court + question “pourquoi ?”), une mission calcul mental, puis une mission révision sur les multiplications vues samedi.

9. **Données à stocker (si applicable)**  
   `daily_missions`, `mission_items`, `mission_completion`, `hints_used`, `time_spent_seconds`, `autonomy_level`, `effort_points`.

10. **Difficulté de mise en œuvre (faible / moyenne / élevée)**  
    **Moyenne** (moteur de génération simple + suivi de complétion).

---

## 2) Atelier “Explique avec tes mots” (enfant) [TERMINÉ]

1. **Nom de la fonctionnalité**  
   Atelier “Explique avec tes mots”

2. **Objectif pédagogique clair**  
   Vérifier la compréhension réelle en demandant à l’enfant d’expliquer une notion, pas seulement de donner la bonne réponse.

3. **Compétences travaillées**  
   Compréhension, langage écrit/oral, raisonnement, métacognition.

4. **Âge / niveau scolaire concerné**  
   7–11 ans (CE1 à CM2), version simplifiée possible dès fin CP.

5. **Description de l’expérience enfant**  
   Après un exercice, l’enfant doit compléter une phrase guidée :
   - “J’ai trouvé … parce que …”
   - “Mon erreur était …, la correction est …”
   
   L’app propose des amorces de phrases, puis reformule en version claire.

6. **Valeur ajoutée pour les parents**  
   Accès à des extraits d’explications de l’enfant : permet de distinguer “réussi par hasard” vs “notion comprise”.

7. **Mécanique de motivation (points, badges, progression)**  
   - Points de clarté (quand l’explication est complète)
   - Badge “Je sais expliquer”
   - Déblocage de niveaux “mentor junior”

8. **Exemple concret d’utilisation**  
   Après un problème de division, l’enfant écrit : “J’ai partagé 24 en 6 paquets, donc 4 par paquet.” L’app confirme le raisonnement.

9. **Données à stocker (si applicable)**  
   `explanation_attempts`, `prompt_type`, `child_text`, `ai_feedback_summary`, `understanding_score`, `error_type`.

10. **Difficulté de mise en œuvre (faible / moyenne / élevée)**  
    **Moyenne à élevée** (analyse de texte + feedback pédagogique robuste).

---

## 3) Révision Espacée Anti-Lassitude (enfant) [BASES TERMINÉES]

1. **Nom de la fonctionnalité**  
   Révision Espacée Anti-Lassitude

2. **Objectif pédagogique clair**  
   Renforcer la mémorisation à long terme via une répétition intelligente et variée.

3. **Compétences travaillées**  
   Automatismes (tables, conjugaison, orthographe), récupération en mémoire, transfert de connaissance.

4. **Âge / niveau scolaire concerné**  
   6–11 ans, adaptatif selon notions maîtrisées/non maîtrisées.

5. **Description de l’expérience enfant**  
   Les notions reviennent selon un rythme espaced (J+1, J+3, J+7, etc.) mais avec des formats variés :
   - quiz court
   - mini-jeu
   - carte “explique et corrige”
   - question contextualisée

6. **Valeur ajoutée pour les parents**  
   Vision simple des notions “solides / à revoir / fragiles”, sans surcharge d’informations.

7. **Mécanique de motivation (points, badges, progression)**  
   - Série “mémoire active”
   - Bonus de diversité (formats différents terminés)
   - Badge “Champion de la révision durable”

8. **Exemple concret d’utilisation**  
   Les fractions reviennent 4 fois en 2 semaines via formats différents ; l’enfant voit un indicateur “de plus en plus solide”.

9. **Données à stocker (si applicable)**  
   `spaced_repetition_cards`, `next_review_at`, `success_rate`, `format_history`, `memory_strength_index`.

10. **Difficulté de mise en œuvre (faible / moyenne / élevée)**  
    **Moyenne** (algorithme de planification + templates d’activités).

---

## 4) Cartographie des Difficultés (suivi pédagogique) [EN COURS]

1. **Nom de la fonctionnalité**  
   Cartographie des Difficultés

2. **Objectif pédagogique clair**  
   Détecter automatiquement les lacunes persistantes pour agir tôt et mieux cibler les activités.

3. **Compétences travaillées**  
   Toutes compétences suivies (maths, français, logique), avec granularité par sous-compétence.

4. **Âge / niveau scolaire concerné**  
   6–11 ans (vue adaptée à chaque cycle).

5. **Description de l’expérience enfant**  
   L’enfant voit un message non stigmatisant : “On va retravailler ça ensemble” avec des exercices adaptés au point faible détecté.

6. **Valeur ajoutée pour les parents**  
   Tableau clair des difficultés récurrentes (ex. retenue en soustraction, inférences en lecture) + recommandations courtes et actionnables.

7. **Mécanique de motivation (points, badges, progression)**  
   - Points de persévérance sur compétences difficiles
   - Badge “Je progresse sur mes défis”
   - Courbe montrant l’amélioration malgré erreurs initiales

8. **Exemple concret d’utilisation**  
   Le système repère 5 erreurs similaires sur les accords sujet/verbe et propose un micro-plan ciblé de 4 jours.

9. **Données à stocker (si applicable)**  
   `skill_mastery`, `error_logs`, `error_patterns`, `difficulty_flags`, `remediation_plan`, `remediation_outcomes`.

10. **Difficulté de mise en œuvre (faible / moyenne / élevée)**  
    **Élevée** (modèle de détection de patterns + visualisation pédagogique).

---

## 5) Tableau de Maîtrise par Niveaux (suivi pédagogique) [TERMINÉ]

1. **Nom de la fonctionnalité**  
   Tableau de Maîtrise par Niveaux

2. **Objectif pédagogique clair**  
   Donner une progression lisible par compétence (Découverte → En cours → Maîtrisé → Consolidé).

3. **Compétences travaillées**  
   Compétences du programme primaire, structurées par domaines et sous-domaines.

4. **Âge / niveau scolaire concerné**  
   6–11 ans, avec objectifs spécifiques par niveau scolaire.

5. **Description de l’expérience enfant**  
   L’enfant voit des “paliers” clairs et sait ce qu’il doit faire pour passer au niveau suivant (ex. 3 réussites + 1 explication correcte).

6. **Valeur ajoutée pour les parents**  
   Suivi simple et concret : où l’enfant avance vite, où il faut renforcer, sans note globale anxiogène.

7. **Mécanique de motivation (points, badges, progression)**  
   - Badge par palier atteint
   - Animation de montée de niveau
   - Bonus “constance” quand le niveau est maintenu dans le temps

8. **Exemple concret d’utilisation**  
   En résolution de problèmes, Noam passe de “En cours” à “Maîtrisé” après plusieurs exercices réussis avec justification correcte.

9. **Données à stocker (si applicable)**  
   `competency_levels`, `level_change_events`, `mastery_evidence`, `maintenance_checks`.

10. **Difficulté de mise en œuvre (faible / moyenne / élevée)**  
    **Moyenne** (modèle de progression + UI dashboard).

---

## 6) Espace Parent-Prof : Plan d’Accompagnement Hebdo (parent / enseignant) [TERMINÉ]

1. **Nom de la fonctionnalité**  
   Espace Parent-Prof : Plan d’Accompagnement Hebdo

2. **Objectif pédagogique clair**  
   Aligner les adultes autour d’actions simples et cohérentes pour soutenir l’enfant chaque semaine.

3. **Compétences travaillées**  
   Priorités hebdomadaires ciblées (2–3 compétences maximum pour rester réaliste).

4. **Âge / niveau scolaire concerné**  
   6–11 ans, applicable à la maison et en soutien scolaire.

5. **Description de l’expérience enfant**  
   L’enfant reçoit des activités cohérentes entre app et accompagnement adulte, avec un langage positif (“objectif de la semaine”).

6. **Valeur ajoutée pour les parents**  
   Un plan hebdomadaire prêt à l’emploi :
   - objectifs prioritaires
   - activités recommandées (10–15 min)
   - messages de feedback suggérés

7. **Mécanique de motivation (points, badges, progression)**  
   - Badge “Semaine en équipe” (enfant + adulte)
   - Indicateur de suivi du plan hebdo
   - Valorisation de l’effort partagé

8. **Exemple concret d’utilisation**  
   La famille reçoit “Objectif semaine : problèmes à 2 étapes”. 4 micro-sessions sont proposées avec scripts de reformulation parentale.

9. **Données à stocker (si applicable)**  
   `weekly_support_plan`, `adult_notes`, `home_sessions`, `teacher_feedback`, `plan_completion_rate`.

10. **Difficulté de mise en œuvre (faible / moyenne / élevée)**  
    **Moyenne** (génération de plan + espace de consultation adulte).

---

## 7) Portefeuille de Progrès Long Terme (transversale) [TERMINÉ VIA MILESTONES]

1. **Nom de la fonctionnalité**  
   Portefeuille de Progrès Long Terme

2. **Objectif pédagogique clair**  
   Rendre visible l’évolution de l’enfant dans le temps pour renforcer confiance, motivation et continuité des apprentissages.

3. **Compétences travaillées**  
   Toutes compétences clés + compétences transversales (autonomie, persévérance, auto-correction).

4. **Âge / niveau scolaire concerné**  
   6–11 ans, historique conservé sur plusieurs années scolaires.

5. **Description de l’expérience enfant**  
   L’enfant consulte son “album de progrès” : réussites marquantes, difficultés dépassées, et objectifs suivants.

6. **Valeur ajoutée pour les parents**  
   Vision long terme claire pour éviter une lecture uniquement “à la séance” ; utile pour échanges parent-professeur.

7. **Mécanique de motivation (points, badges, progression)**  
   - Frise de progression
   - Badges d’étapes significatives
   - Mise en avant des progrès après périodes de difficulté

8. **Exemple concret d’utilisation**  
   Sur 6 mois, l’enfant visualise qu’il est passé de nombreuses erreurs de lecture d’énoncés à une compréhension stable.

9. **Données à stocker (si applicable)**  
   `progress_timeline`, `milestones`, `portfolio_entries`, `effort_indicators`, `periodic_snapshots`.

10. **Difficulté de mise en œuvre (faible / moyenne / élevée)**  
    **Élevée** (historisation robuste + visualisations longitudinales).

---

## Priorisation produit recommandée

### Phase 1 (impact rapide / effort maîtrisé) [TERMINÉE]
1. Mission Quotidienne Intelligente
2. Tableau de Maîtrise par Niveaux
3. Révision Espacée Anti-Lassitude

### Phase 2 (qualité pédagogique renforcée) [TERMINÉE]
4. Atelier “Explique avec tes mots”
5. Espace Parent-Prof : Plan d’Accompagnement Hebdo

### Phase 3 (intelligence pédagogique avancée) [EN COURS]
6. Cartographie des Difficultés (Diagnostic & Remédiation)
7. Portefeuille de Progrès Long Terme (Amélioration visualisation)

---

## Notes d’implémentation (React + Supabase)
- **Front React** : composants modulaires par fonctionnalité (`MissionCard`, `MasteryLevelPill`, `DifficultyHeatmap`, `PortfolioTimeline`).
- **Supabase** : tables dédiées + vues agrégées pour dashboards parent/enfant.
- **IA pédagogique** : utilisée pour reformulation d’explications, feedback positif, et recommandations ciblées.
