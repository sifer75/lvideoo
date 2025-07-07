### **Plan d'Implémentation (React + Electron + TypeScript + Tailwind CSS)**

**Phase 1 : Initialisation du Projet et Environnement**

1.  **Créer le projet React avec Vite et TypeScript :**
    - Utiliser `npm create vite@latest . -- --template react-ts`.
2.  **Installer et configurer Tailwind CSS :**
    - Installer les dépendances : `npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer`.
    - Configurer `vite.config.ts` pour inclure le plugin `@tailwindcss/vite`.
    - Créer `tailwind.config.js` avec la configuration de base.
    - Créer `postcss.config.js` avec les plugins `tailwindcss` et `autoprefixer`.
    - Ajouter les directives `@tailwind` dans `src/index.css`.
3.  **Installer les dépendances Electron :**
    - Installer `electron` et `electron-builder` : `npm install --save-dev electron electron-builder`.
    - Installer `concurrently` et `wait-on` : `npm install --save-dev concurrently wait-on`.
4.  **Mettre en place la structure de base d'Electron :**
    - Créer le dossier `electron`.
    - Créer `electron/main.cjs` (processus principal) et `electron/preload.cjs` (script de pré-chargement).
    - Adapter `package.json` pour définir `main` sur `electron/main.cjs` et ajouter les scripts `dev` et `electron`.

**Phase 2 : Création de l'Interface Utilisateur avec React**

1.  **Développer les composants React (`src/components`) :**
    - Créer un composant principal `App.tsx`.
    - Créer des sous-composants si nécessaire.
2.  **Gérer l'état de l'application :**
    - Utiliser les hooks de React (`useState`, `useEffect`) pour gérer l'état de l'interface.
3.  **Styliser les composants :**
    - Utiliser les classes utilitaires de Tailwind CSS.

**Phase 3 : Communication entre React et Electron**

1.  **Mettre en place le script de pré-chargement (`electron/preload.cjs`) :**
    - Exposer de manière sélective les fonctions d'Electron (`ipcRenderer`) à l'application React via l'objet `window`.
2.  **Appeler Electron depuis React :**
    - Dans les composants React, appeler les fonctions exposées pour communiquer avec le processus principal.
3.  **Gérer les événements dans le processus principal (`electron/main.cjs`) :**
    - Utiliser `ipcMain` pour écouter les événements envoyés par l'interface React et déclencher les actions natives.

**Phase 4 : Développement des Fonctionnalités Clés (Logique Electron)**

1.  **Capture d'écran et audio (`electron/main.cjs`) :**
    - Utiliser l'API `desktopCapturer` pour accéder aux flux de l'écran et de l'audio.
2.  **Gestion de la caméra (`src/components/CameraView.tsx`) :**
    - Dans le composant React, utiliser `navigator.mediaDevices.getUserMedia` pour afficher le flux de la caméra.
3.  **Enregistrement et Sauvegarde (`electron/main.cjs`) :**
    - Recevoir les flux (écran, audio) de l'interface via IPC.
    - Utiliser `MediaRecorder` pour l'enregistrement.
    - À l'arrêt, sauvegarder le fichier en utilisant le module `fs`.
4.  **Sélection du dossier de sauvegarde (`electron/main.cjs`) :**
    - Sur demande de l'UI, utiliser `dialog.showOpenDialog` et renvoyer le chemin sélectionné à l'interface React.

**Phase 5 : Finalisation et Packaging**

1.  **Configurer Electron Builder (`package.json`) :**
    - Adapter la configuration pour qu'elle pointe vers le dossier de build de React.
2.  **Tests et Débogage :**
    - Tester l'application complète en mode développement et après le build.
3.  **Compiler l'application :**
    - Lancer la commande `npm run build` pour générer les installateurs.

### **Phase 6 : Ajout du menu vidéo et gestion des vidéos**

1. **Concevoir le menu latéral gauche :**

   - Créer un conteneur fixe sur la partie gauche de l’écran pour le menu.
   - Ajouter un bouton "Ajouter une vidéo" en haut du menu.
   - Prévoir une zone scrollable sous ce bouton pour afficher la liste des vidéos.

2. **Gestion de la liste des vidéos :**

   - Définir un état React pour stocker la liste des vidéos (titre, chemin, lien de partage).
   - Implémenter la récupération initiale des vidéos via IPC avec le processus Electron principal.
   - Afficher chaque vidéo dans un encadrement avec son titre visible et un bouton de partage.

3. **Fonctionnalité du bouton "Ajouter une vidéo" :**

   - Connecter ce bouton à une fonction qui ouvre une boîte de dialogue pour sélectionner un fichier vidéo.
   - Après sélection, ajouter la vidéo à la liste et mettre à jour l’affichage.

4. **Création d’un lien partageable par vidéo :**

   - Générer un lien unique ou chemin accessible pour chaque vidéo.
   - Ajouter un bouton "Copier le lien" pour permettre le partage.
   - Implémenter la copie dans le presse-papier et un retour visuel.

5. **Sélection et affichage de la vidéo :**
   - Permettre la sélection d’une vidéo depuis la liste.
   - Afficher la vidéo sélectionnée dans la partie principale de l’écran avec ses métadonnées.

---

### **Phase 7 : Communication approfondie entre React et Electron**

1. **Gestion des événements d’ajout de vidéo dans `electron/main.cjs` :**

   - Utiliser `dialog.showOpenDialog` pour ouvrir la sélection de fichiers.
   - Copier ou déplacer les vidéos dans un dossier dédié à l’application.
   - Mettre à jour la liste des vidéos côté backend et notifier React via IPC.

2. **Implémenter un canal IPC sécurisé :**

   - Envoyer les listes mises à jour des vidéos à React.
   - Recevoir des commandes pour suppression, renommage ou partage.

3. **Gestion des erreurs et retours :**
   - Gérer les erreurs de sélection ou accès aux fichiers.
   - Informer React pour afficher des messages utilisateur.

---

### **Phase 8 : Expérience utilisateur et design**

1. **Améliorer l’ergonomie du menu vidéo :**

   - Rendre le menu responsive et bien dimensionné.
   - Ajouter des animations/transitions pour l’ajout et suppression des vidéos.

2. **Gestion avancée des vidéos :**

   - Permettre la sélection multiple et les actions groupées (suppression, partage).
   - Ajouter une pagination ou barre de recherche si la liste est longue.

3. **Optimiser la performance :**
   - Charger paresseusement les vignettes ou métadonnées.

---

### **Phase 9 : Partage et collaboration**

1. **Définir le protocole du lien de partage :**

   - Prendre en compte l’accessibilité locale ou future hébergement en réseau/cloud.

2. **Sécurité :**

   - Ajouter des options pour contrôler l’accès aux vidéos partagées.

3. **Interface de partage :**
   - Intégrer un bouton simple pour copier ou envoyer le lien.

---

### **Phase 10 : Tests, validation et déploiement**

1. **Tests unitaires et fonctionnels sur la gestion des vidéos.**
2. **Tests de communication IPC entre React et Electron.**
3. **Tests des dialogues de fichiers et sauvegarde.**
4. **Tests d’ergonomie sur le menu vidéo et système de partage.**
5. **Validation finale et packaging.**

---

### **Phase 11 : Partage de Vidéos via un Tunnel Public (ngrok)**

1.  **Installer et Configurer ngrok :**
    -   Ajouter le paquet `ngrok` aux dépendances de développement du projet : `npm install --save-dev ngrok`.

2.  **Intégrer ngrok dans le Processus Principal (`src/main.ts`) :**
    -   Importer `ngrok`.
    -   Au démarrage du serveur Express, lancer `ngrok` pour créer un tunnel public pointant vers le port du serveur vidéo local.
    -   Stocker l'URL publique générée par `ngrok` dans une variable globale (ex: `publicUrl`).
    -   Gérer la déconnexion de `ngrok` à la fermeture de l'application pour libérer les ressources.

3.  **Créer un Canal de Communication IPC pour l'URL Publique :**
    -   Dans `src/main.ts`, mettre en place un gestionnaire d'événements `ipcMain.handle` (ex: `get-public-url`) qui renverra l'URL publique stockée.
    -   Dans `src/preload.ts`, exposer une fonction (ex: `getPublicUrl`) qui appellera ce gestionnaire via `ipcRenderer.invoke`.

4.  **Mettre à Jour la Logique de Partage dans l'Interface React (`src/App.tsx`) :**
    -   Modifier la fonction `handleShareVideo`.
    -   Avant de copier le lien, appeler la nouvelle fonction `window.electronAPI.getPublicUrl()` pour récupérer l'URL de base du tunnel.
    -   Construire le lien de partage complet en combinant l'URL publique de `ngrok` avec le nom du fichier vidéo (ex: `publicUrl + '/' + video.title`).
    -   Copier ce nouveau lien public dans le presse-papiers.

5.  **Améliorer l'Expérience Utilisateur :**
    -   Modifier le message de confirmation pour afficher le lien public qui a été copié.
    -   S'assurer que la gestion des erreurs est en place si `ngrok` ne parvient pas à démarrer.
