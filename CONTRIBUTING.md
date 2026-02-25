# 🤝 Guide de Contribution

Merci de l'intérêt que vous portez à **Mon Assistant Scolaire** ! Nous sommes ravis d'accueillir vos contributions pour améliorer l'éducation assistée par l'IA.

---

## 🚩 Comment Contribuer ?

### 1. Signaler un Bug
Si vous trouvez un bug, veuillez créer une *Issue* sur GitHub en précisant :
- Votre système d'exploitation.
- La version de l'application (si applicable).
- Les étapes pour reproduire le problème.

### 2. Proposer une Fonctionnalité
Pour toute suggestion, ouvrez une *Issue* étiquetée `enhancement` pour lancer la discussion.

### 3. Soumettre du Code (Pull Request)
1. **Forkez** le projet.
2. **Créez une branche** pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`).
3. **Committez** vos changements en suivant les conventions (voir ci-dessous).
4. **Poussez** vers votre fork et soumettez une **Pull Request**.

---

## 💎 Règles de Codage & Style

### Standards Technologiques
- **Langage** : TypeScript (obligatoire, pas de `.js`).
- **Composants** : Composants fonctionnels React avec Hooks.
- **Styling** : Tailwind CSS 4 (classes utilitaires recommandées).

### Conventions de Nommage
- **Fichiers** : `PascalCase.tsx` pour les composants, `camelCase.ts` pour les services/hooks.
- **Variables/Fonctions** : `camelCase`.
- **Interfaces/Types** : `PascalCase` (ex: `interface UserProfile`).

### Commits
Nous suivons la convention [Conventional Commits](https://www.conventionalcommits.org/) :
- `feat:` : Ajout d'une nouvelle fonctionnalité.
- `fix:` : Correction d'un bug.
- `docs:` : Modification de la documentation.
- `style:` : Changements esthétiques (pas de logique).
- `refactor:` : Modification du code sans changement de fonctionnalité.

---

## 🧪 Tests & Vérification
Avant de soumettre votre PR :
1. Assurez-vous que `npm run lint` ne retourne aucune erreur.
2. Vérifiez que l'application se build correctement (`npm run build`).
3. Testez l'accessibilité de vos nouveaux composants (contraste, lecteur d'écran).

## 🆘 Besoin d'aide ?
Si vous avez des questions, n'hésitez pas à contacter les mainteneurs via les discussions GitHub.

---
*En contribuant, vous acceptez que vos contributions soient placées sous la licence MIT du projet.*
