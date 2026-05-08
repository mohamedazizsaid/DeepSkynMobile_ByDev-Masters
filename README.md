# DeepSkyn Mobile

Application mobile **React Native + Expo** dédiée au suivi de la peau, à l’analyse assistée par IA et à la personnalisation de routines skincare.

## Aperçu

DeepSkyn Mobile propose un parcours complet :
- Authentification (email/mot de passe, Google, Face ID, 2FA selon backend)
- Onboarding dermatologique (type de peau, phototype, préoccupations, sensibilités)
- Analyse visage (single scan / multi-angle), historique et suivi d’évolution
- Recommandations de routine et de produits
- Espace communauté (posts, stories, interactions)
- Chat et notifications
- Accessibilité avancée (taille du texte, contrastes, lecture vocale, RTL, multilingue)

## Stack technique

- **Framework** : React Native 0.81 + Expo 54
- **Langage** : TypeScript
- **Navigation** : React Navigation (stack + bottom tabs)
- **État global** : Zustand
- **Réseau/API** : Axios + interceptors (gestion token + refresh)
- **UI & UX** : Expo modules (camera, image-picker, location, blur, speech, etc.)
- **Internationalisation** : FR / EN / AR / ES

## Structure du projet

```text
.
├── App.tsx
├── src
│   ├── components/        # UI, accessibilité, animations, notifications, auth
│   ├── navigation/        # RootNavigator, DashboardTabNavigator
│   ├── screens/           # auth, onboarding, dashboard
│   ├── services/          # appels API (auth, analyses, routine, chat, posts, etc.)
│   ├── stores/            # Zustand stores (auth, accessibilité, notifications)
│   ├── lib/               # types, constantes, i18n, utils, config
│   └── theme/             # couleurs, spacing, styles d’accessibilité
└── assets
```

## Prérequis

- Node.js 18+ recommandé
- npm 9+ recommandé
- Expo CLI (via `npx expo ...`)
- Expo Go (mobile) ou émulateur Android/iOS

## Installation

```bash
npm install
```

## Lancement

```bash
npm run start    # menu Expo
npm run android  # ouvre Android
npm run ios      # ouvre iOS
npm run web      # ouvre Web
```

## Configuration backend (important)

Le backend est actuellement configuré en URL locale dans :
- `src/services/api-client.ts`
- `src/lib/config/api.config.ts`

Valeur actuelle : `http://192.168.1.3:3000`

Avant exécution sur votre réseau :
1. Remplacer cette IP par l’adresse de votre backend.
2. Éviter `localhost` sur appareil physique (utiliser l’IP machine).

## Flux applicatif principal

1. **Authentification**
2. **Onboarding** (si profil incomplet)
3. **Dashboard** (Home, Analysis, Routine, Chat, Profile)
4. **Fonctionnalités avancées** : historique, évolution, communauté, recommandations, abonnements

## Scripts disponibles

Dans `package.json` :
- `start`
- `android`
- `ios`
- `web`

## Statut

Projet en développement actif (structure prête pour extension backend et industrialisation CI/CD).

---

Si vous voulez, je peux aussi préparer une version README orientée **open-source** (installation backend, conventions Git, roadmap, contribution, license).
