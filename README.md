# DevPortals 🚀

**La plateforme pour concevoir des jeux vidéo… et les partager avec les joueurs.**
Chaque créateur a **son compte et son studio** (idées, Game Design Document, histoire, personnages, véhicules, lieux, cartes, musique, direction artistique, production, bugs, playtests) avec **autant de jeux qu'il veut**. Chaque jeu a son **portail web**, publié dans un **catalogue public** après **validation par l'administrateur**. Le tout est hébergé sur ton PC.

> 🇫🇷 Français par défaut · 🇬🇧 English available (boutons **FR / EN**)
> Aucune IA, aucun service externe : tout reste sur ton ordinateur.

---

## 🚀 Démarrage

| Système | Comment lancer |
|---|---|
| **Windows** | Double-clique sur **`DevPortals.bat`** |
| **macOS / Linux** | Lance `./lancer.sh` (Python 3.9 ou plus) |

- **Pas besoin d'installer Python sur Windows** : si Python est introuvable, le lanceur télécharge **une seule fois** la version portable officielle de python.org (environ 11 Mo), **vérifie son empreinte SHA-256** et la range dans `runtime\python`. Rien n'est installé dans Windows.
- Le navigateur s'ouvre sur `http://localhost:8765/`. **Laisse la fenêtre noire ouverte** : c'est le serveur.
- Au premier lancement, Windows peut demander d'autoriser Python sur le réseau : accepte pour les **réseaux privés** (sinon les autres PC ne verront pas le catalogue).
- Le port se change dans `DevPortals.bat` (`set PORT=8765`) ou avec `DEVPORTALS_PORT` sur macOS / Linux.

---

## 👤 Comptes, rôles et publication

### Première utilisation : le compte ADMIN
La toute première page propose de créer le **compte administrateur** (possible uniquement depuis le PC qui héberge DevPortals). Tu choisis aussi le nom de la plateforme affiché sur le catalogue.

### Visiteurs (non connectés)
Ils voient **seulement le catalogue public** et les **portails des jeux validés** — rien d'autre. Le studio, les projets, les médias et l'administration demandent une connexion.

### Créateurs (joueurs / développeurs)
- **Créer un compte** depuis le catalogue (si l'administrateur a laissé les inscriptions ouvertes) ou se faire créer un compte par l'admin.
- Une fois connecté, **tout se débloque** : le studio complet, **autant de jeux que voulu** (sélecteur de projet + « Nouveau projet »), le compte (nom affiché, présentation, mot de passe), l'historique des versions.
- Chaque créateur a un **profil public** (`/#/createur/<nom>`) avec sa présentation et ses jeux publiés.

### Publier un jeu : envoi → validation → catalogue
1. Dans le studio, rends publics les éléments à montrer (fiches, articles, versions, jalons, cartes, médias : bouton **Privé → Public**).
2. Ouvre **Portail & catalogue** : classe ton jeu (**genres, style visuel, modes de jeu, plateformes, mots-clés**), règle la page d'accueil, puis clique sur **Soumettre pour validation**.
3. L'administrateur reçoit la demande dans **Administration → À valider**, ouvre l'**aperçu** du portail, puis **approuve** ou **refuse avec un message** (le créateur le voit dans son studio).
4. Une fois approuvé, le jeu apparaît dans le **catalogue public** et son portail est en ligne à `/g/<nom-du-jeu>/`.
5. Les mises à jour suivent le même chemin : **la version en ligne reste visible** tant que la nouvelle n'est pas validée. Le créateur peut annuler un envoi ou retirer son jeu du catalogue.

Les portails de l'administrateur sont publiés directement. L'admin peut aussi désactiver la validation obligatoire (déconseillé).

### Administration
| Onglet | Ce qu'on y fait |
|---|---|
| **À valider** | aperçu, approbation, refus avec message |
| **Portails** | tous les portails, état, **mise à la une ★**, retrait du catalogue (avec raison) |
| **Comptes** | créer un compte, rôle créateur / administrateur, désactiver, nouveau mot de passe, supprimer (copie gardée dans la corbeille du serveur) |
| **Plateforme** | nom et phrase d'accueil du catalogue, inscriptions ouvertes ou non, validation obligatoire, adresses réseau, dossier des données |

### Le catalogue public
Tous les portails validés au même endroit : **À la une**, recherche, filtres par **genre, style, mode de jeu, plateforme, étape de développement**, tri (mis à jour, derniers arrivés, A → Z), badges **NOUVEAU / MIS À JOUR** depuis la dernière visite, pages créateurs. S'adapte au téléphone.

---

## 🧰 Tout ce que contient DevPortals

### Projet
| Section | Contenu |
|---|---|
| **Tableau de bord** | Nom, pitch, genre, plateformes, moteur, étape (concept → sortie), dates, couverture · statistiques · idée rapide · prochain jalon avec compte à rebours · état du portail · tâches urgentes · activité récente · question de réflexion |
| **Idées** | Journal d'idées (catégories, statuts, tags, épingles, images) · **évaluation 5 étoiles** (plaisir, originalité, cohérence, faisabilité) · **notes d'évolution** datées · **cartes de questions** pour creuser l'idée · conversion en section GDD, tâche ou fiche |
| **Game Design Doc** | 17 sections guidées + sections perso · **modèles prêts à remplir** pour chaque section · aperçu Markdown · **export Markdown, HTML ou PDF** du document complet (avec fiches et images) |
| **Histoire** | Trame (logline, synopsis, univers, conflit, thèmes, ton, fin) · structure en 3 actes · **chapitres** (personnages, lieux, missions, scènes, musiques) · **chronologie des apparitions** |
| **Boîte à outils** | Générateur d'idées (avec verrous) · générateur de **noms** (fantasy, sci-fi, personnages, véhicules, lieux, factions) · **cartes de réflexion** · **checklists** (game feel, tutoriel, accessibilité, playtest, polish, performance, lancement Steam) · calculateur de **courbe d'XP** · lanceur de dés |

### Univers (fiches complètes, toutes reliées entre elles)
| Fiche | Exemples de champs |
|---|---|
| **Personnages** | nom, alias, âge, genre, espèce, rôle, faction, origine, statut, **arrive au chapitre / quand et comment il arrive**, arc, apparence, tenue, personnalité, forces, faiblesses, motivations, secret 🔒, répliques, passé, **relations**, compétences, stats, véhicules, thème musical, voix… |
| **Véhicules** | constructeur, modèle, année, catégorie, classe, propriétaire, apparition, design, fiche technique (vitesse, 0-100, puissance, couple, poids, moteur, motricité), **notes de conduite 0-10 avec barres**, améliorations, gadgets, son… |
| **Lieux** | type, région, « situé dans », chapitre, climat, taille, population, ambiance, histoire, points d'intérêt, secrets 🔒, activités, dangers, services, habitants, factions, musique |
| **Cartes du monde** | importe une carte (monde, ville, niveau, circuit) et place des **repères déplaçables** reliés aux lieux, missions, personnages ; repères privés possibles ; zoom |
| **Objets & armes, Factions, Quêtes & missions** | rareté, effets, stats · chef, membres, alliés/ennemis · donneur, lieu, difficulté, étapes, récompenses… |
| **Dialogues & scènes** | script `NOM : réplique` avec aperçu mis en forme, choix du joueur, état d'écriture/enregistrement |
| **Lore & encyclopédie** | articles d'univers par catégorie, liens vers personnages/lieux/factions, vérité cachée 🔒 |

### Création
| Section | Contenu |
|---|---|
| **Direction artistique** | style, mots-clés, références, **palette** (extraite automatiquement du moodboard), règles (lumière, formes, matières, caméra, UI, typo, à faire/à éviter), **moodboard**, test noir & blanc |
| **Musique & son** | pistes avec **fichier audio intégré** (MP3, OGG, WAV, M4A, FLAC), type, état, compositeur, BPM, tonalité, boucle, ambiance, où elle joue (chapitres, lieux, personnages, missions), licence · lecteur audio intégré |
| **Médiathèque** | toutes les images et sons du projet, légendes, tags, filtres, nettoyage des fichiers inutilisés, choix des médias publics |

### Production
| Section | Contenu |
|---|---|
| **Tâches & jalons** | **kanban** glisser-déposer (backlog, à faire, en cours, terminé), priorités, échéances, responsables, **jalons avec progression** (roadmap), export CSV |
| **Assets** | modèles 3D, textures, animations, sons… état, priorité, responsable, échéance, estimation / temps passé |
| **Bugs** | gravité, état, version, plateforme, fréquence, étapes de reproduction, attendu/obtenu · **création de tâche de correction** |
| **Playtests** | sessions, testeurs, notes moyennes (plaisir, clarté, difficulté…), retours, citations · **actions → tâches** |
| **Captures & versions** | captures d'écran par build, auto-évaluation, notes, **comparateur avant/après** (curseur), notes → tâches |
| **Équipe & crédits** | membres, rôles, départements, liens · affichés comme crédits sur le portail |

### Partage
| Section | Contenu |
|---|---|
| **Devlog & mises à jour** | articles (brouillon **pré-rempli automatiquement avec ce qui a changé**), **notes de version** (ajouté / modifié / corrigé / retiré), pré-remplissage depuis les tâches terminées |
| **Portail & catalogue** | classement (genres, styles, modes, plateformes), page d’accueil, liens, FAQ, envoi à la validation — voir plus haut 👆 |

Et partout : **recherche globale (Ctrl+K)**, **corbeille** avec restauration, **autant de jeux que tu veux** avec modèles (course, RPG, plateforme, horreur), couleur d'accent au choix, thème sombre neutre.

---

## 🌐 Le portail d'un jeu

Chaque jeu validé a son mini-site : accueil, **« Nouveautés depuis ta dernière visite »** avec badges **NOUVEAU / MIS À JOUR**, actualités, notes de version, roadmap, personnages, véhicules, lieux, musique (écoute en ligne), cartes interactives, galerie, équipe, FAQ, et un lien **← Catalogue**. Les joueurs déjà sur la page voient un bandeau quand du nouveau contenu est publié.

🔒 Les champs marqués d'un cadenas (secrets, spoilers, notes internes, étapes de mission…) **ne sont jamais publiés**.

---

## 🔐 Réseau & sécurité

- Les autres PC de ton réseau ouvrent l'adresse affichée dans la fenêtre du serveur (ex. `http://192.168.1.23:8765/`). Pour Internet : redirige le port dans ton routeur ou utilise un tunnel (Tailscale, Cloudflare Tunnel…).
- Mots de passe **hachés** (PBKDF2-SHA256, 200 000 itérations, sel aléatoire), session par cookie `HttpOnly`, protection contre les requêtes intersites, limite de tentatives de connexion.
- Chaque créateur ne voit que **ses** projets et médias. Un aperçu en attente n'est visible que par son créateur et les administrateurs.
- **Mot de passe oublié** : l'admin en attribue un nouveau dans *Administration → Comptes*. Pour le compte admin lui-même : `DevPortals.bat --reset-password NOM` (ou `./lancer.sh --reset-password NOM`) dans le dossier de DevPortals.

---

## 💾 Données & sauvegardes

- Tout est dans le dossier **`donnees/`** (comptes, projets, médias, portails). **Sauvegarder ce dossier = tout sauvegarder.**
- Chaque projet est enregistré sur le serveur à chaque modification, avec un **historique des versions** (une version toutes les 10 minutes de travail, les 30 dernières) restaurable dans *Compte & paramètres*.
- Export / import `.json` (médias inclus) pour déplacer un jeu. Les exports des anciennes versions (DevPortals v2, GameForge) s'importent aussi.
- **Mise à jour depuis l'ancienne version** : les projets restés dans le navigateur sont détectés à la première connexion et peuvent être **importés dans ton compte** en un clic.
- Les projets et comptes supprimés sont déplacés dans `donnees/corbeille/` (jamais effacés directement).

---

## 📁 Structure

```
DevPortals.bat          Lanceur Windows (Python auto-installé en version portable si absent)
lancer.sh               Lanceur macOS / Linux
serveur/server.py       Serveur de la plateforme (Python, bibliothèque standard uniquement)
hub/                    Catalogue public + connexion / inscription
studio/                 Le studio (HTML / CSS / JavaScript, sans dépendance)
portail/                Le mini-site d'un jeu (servi à /g/<nom>/)
donnees/                (généré) comptes, projets, médias, portails
runtime/                (généré) Python portable pour Windows
```

---

## 🇬🇧 English

**DevPortals** is a self-hosted platform to design video games and share them with players — no AI, no external service.

- **Accounts**: the first launch creates the **administrator** account (only from the host PC). Creators sign up from the catalog (or get an account from the admin) and unlock their **studio** with **unlimited games**. Logged-out visitors only see the public catalog and approved game portals.
- **Studio**: ideas (5-star ratings, notes), a guided GDD with templates and Markdown/HTML/PDF export, story chapters, complete sheets for **characters, vehicles, locations, items, factions, quests, dialogue, lore, music (audio files), assets, bugs, playtests and team**, interactive world maps, art direction, media library, kanban + milestones, screenshot builds with a before/after slider, devlog & patch notes, toolbox, global search (Ctrl+K), trash and version history.
- **Publishing**: in *Portal & catalog*, classify the game (genres, visual style, modes, platforms, keywords) and **submit for review**. The admin previews it, then **approves** or **rejects with a message**. Approved games appear in the **public catalog** (featured row, search, filters by genre / style / mode / platform / stage, NEW badges, creator profiles) at `/g/<game>/`. Updates stay pending while the live version remains online.
- **Admin panel**: review queue, all portals (feature, remove), accounts (create, role, disable, reset password, delete), platform settings (name, open registration, mandatory review).
- **Run** `DevPortals.bat` on Windows — it downloads the official portable Python once (SHA-256 verified) if Python is missing — or `./lancer.sh` on macOS / Linux. All data lives in `donnees/`. French by default, English via **FR / EN**.
