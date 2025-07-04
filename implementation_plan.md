### **Plan d'Implémentation (React + Electron + TypeScript + Tailwind CSS)**

**Phase 1 : Initialisation du Projet et Environnement**
1.  **Créer le projet React avec Vite et TypeScript :**
    *   Utiliser `npm create vite@latest . -- --template react-ts`.
2.  **Installer et configurer Tailwind CSS :**
    *   Installer les dépendances : `npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer`.
    *   Configurer `vite.config.ts` pour inclure le plugin `@tailwindcss/vite`.
    *   Créer `tailwind.config.js` avec la configuration de base.
    *   Créer `postcss.config.js` avec les plugins `tailwindcss` et `autoprefixer`.
    *   Ajouter les directives `@tailwind` dans `src/index.css`.
3.  **Installer les dépendances Electron :**
    *   Installer `electron` et `electron-builder` : `npm install --save-dev electron electron-builder`.
    *   Installer `concurrently` et `wait-on` : `npm install --save-dev concurrently wait-on`.
4.  **Mettre en place la structure de base d'Electron :**
    *   Créer le dossier `electron`.
    *   Créer `electron/main.cjs` (processus principal) et `electron/preload.cjs` (script de pré-chargement).
    *   Adapter `package.json` pour définir `main` sur `electron/main.cjs` et ajouter les scripts `dev` et `electron`.

**Phase 2 : Création de l'Interface Utilisateur avec React**
1.  **Développer les composants React (`src/components`) :**
    *   Créer un composant principal `App.tsx`.
    *   Créer des sous-composants si nécessaire.
2.  **Gérer l'état de l'application :**
    *   Utiliser les hooks de React (`useState`, `useEffect`) pour gérer l'état de l'interface.
3.  **Styliser les composants :**
    *   Utiliser les classes utilitaires de Tailwind CSS.

**Phase 3 : Communication entre React et Electron**
1.  **Mettre en place le script de pré-chargement (`electron/preload.cjs`) :**
    *   Exposer de manière sélective les fonctions d'Electron (`ipcRenderer`) à l'application React via l'objet `window`.
2.  **Appeler Electron depuis React :**
    *   Dans les composants React, appeler les fonctions exposées pour communiquer avec le processus principal.
3.  **Gérer les événements dans le processus principal (`electron/main.cjs`) :**
    *   Utiliser `ipcMain` pour écouter les événements envoyés par l'interface React et déclencher les actions natives.

**Phase 4 : Développement des Fonctionnalités Clés (Logique Electron)**
1.  **Capture d'écran et audio (`electron/main.cjs`) :**
    *   Utiliser l'API `desktopCapturer` pour accéder aux flux de l'écran et de l'audio.
2.  **Gestion de la caméra (`src/components/CameraView.tsx`) :**
    *   Dans le composant React, utiliser `navigator.mediaDevices.getUserMedia` pour afficher le flux de la caméra.
3.  **Enregistrement et Sauvegarde (`electron/main.cjs`) :**
    *   Recevoir les flux (écran, audio) de l'interface via IPC.
    *   Utiliser `MediaRecorder` pour l'enregistrement.
    *   À l'arrêt, sauvegarder le fichier en utilisant le module `fs`.
4.  **Sélection du dossier de sauvegarde (`electron/main.cjs`) :**
    *   Sur demande de l'UI, utiliser `dialog.showOpenDialog` et renvoyer le chemin sélectionné à l'interface React.

**Phase 5 : Finalisation et Packaging**
1.  **Configurer Electron Builder (`package.json`) :**
    *   Adapter la configuration pour qu'elle pointe vers le dossier de build de React.
2.  **Tests et Débogage :**
    *   Tester l'application complète en mode développement et après le build.
3.  **Compiler l'application :**
    *   Lancer la commande `npm run build` pour générer les installateurs.