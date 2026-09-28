# DevPortals 🚀

**Le studio pour concevoir ton jeu vidéo… et le partager avec tes joueurs.**
Idées, Game Design Document, histoire, personnages, véhicules, lieux, cartes, musique, direction artistique, production, bugs, playtests — et un **portail web hébergé sur ton PC** où les joueurs voient tout ce qui a été ajouté.

> 🇫🇷 Français par défaut · 🇬🇧 English available (bouton **FR / EN** en bas à gauche)
> Aucune installation, aucune IA, aucun compte : tout reste sur ton ordinateur.

---

## 🚀 Démarrage

| Système | Comment lancer |
|---|---|
| **Windows** | Double-clique sur **`DevPortals.bat`** |
| **macOS / Linux** | Lance `./lancer.sh` (nécessite Python 3) |

Le lanceur démarre un **petit serveur local** et ouvre le studio dans ton navigateur (`http://localhost:8765/studio/`).
**Laisse la fenêtre noire ouverte** pendant que tu travailles : elle sert le studio, le portail joueurs et les sauvegardes.

- Windows utilise PowerShell (déjà inclus dans Windows 10/11). Au premier lancement, Windows peut demander d'autoriser l'accès réseau : accepte pour les **réseaux privés** (sinon les joueurs ne pourront pas voir le portail).
- Le port se change dans `DevPortals.bat` (`set PORT=8765`). Garde toujours le même : tes projets sont liés à l'adresse du studio.

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
| **Portail joueurs** | voir ci-dessous 👇 |

Et partout : **recherche globale (Ctrl+K)**, **corbeille** avec restauration, **multi-projets** avec modèles (course, RPG, plateforme, horreur), couleur d'accent au choix, thème sombre neutre.

---

## 🌐 Le portail joueurs

Un vrai petit site web, **hébergé sur le PC où DevPortals est ouvert**, pour que tes joueurs suivent le développement :

1. Dans une fiche, un article, une version, un jalon, une carte ou un média, clique sur **« Privé » → « Public »**.
2. Va dans **Portail joueurs** → règle le titre, l'accroche, la bannière, les liens (Steam, Discord…), la FAQ → **Publier maintenant**.
3. Donne aux joueurs l'adresse affichée (ex. `http://192.168.1.23:8765/`). Ils voient : accueil, **« Nouveautés depuis ta dernière visite »** avec badges **NOUVEAU / MIS À JOUR**, actualités, notes de version, roadmap, personnages, véhicules, lieux, musique (écoute en ligne), cartes interactives, galerie, équipe, FAQ.
4. Le portail se met à jour quand tu republies (option **publication automatique**). Les joueurs déjà sur la page voient un bandeau « Du nouveau contenu a été publié ».

🔒 Les champs marqués d'un cadenas (secrets, spoilers, notes internes, étapes de mission…) **ne sont jamais publiés**. Le **studio et l'API ne sont accessibles que depuis ton PC** : les joueurs ne peuvent rien modifier.

Réseau : les joueurs doivent être sur le même réseau (maison, LAN, Wi-Fi). Pour Internet, redirige le port dans ton routeur ou utilise un tunnel (Tailscale, ngrok…).

---

## 💾 Données & sauvegardes

- Les projets sont stockés dans le navigateur (IndexedDB) **et sauvegardés automatiquement sur le disque** dans le dossier `sauvegardes/` (toutes les 10 min par défaut, les 30 dernières sont gardées). Restauration en un clic dans *Paramètres & données*.
- Export / import manuel en `.json` (médias inclus) pour changer d'ordinateur. Les exports de l'ancienne version (GameForge) s'importent aussi.
- Le portail publié se trouve dans `portail-data/`.

---

## 📁 Structure

```
DevPortals.bat          Lanceur Windows (serveur PowerShell)
lancer.sh               Lanceur macOS / Linux (serveur Python)
serveur/server.ps1      Serveur local Windows (aucune installation)
serveur/server.py       Serveur local Python 3
studio/                 L'application (HTML / CSS / JavaScript, sans dépendance)
portail/                Le site public des joueurs
portail-data/           (généré) contenu publié du portail
sauvegardes/            (généré) sauvegardes automatiques
```

---

## 🇬🇧 English

**DevPortals** is a studio to design your video game and share it with players — no AI, no install, no account.
Ideas (5-star ratings, notes, reflection cards), a guided GDD with templates and Markdown/HTML/PDF export, story chapters and an appearance timeline, complete sheets for **characters, vehicles, locations, items, factions, quests, dialogue, lore, music (with audio files), assets, bugs, playtests and team**, interactive **world maps**, art direction (palette, moodboard), media library, kanban + milestones, screenshot builds with a before/after slider, devlog & patch notes, a toolbox (idea/name generators, checklists, XP curve, dice), global search (Ctrl+K), trash, templates and automatic disk backups.

The **player portal** is a website served from your PC: mark items as *Public*, click *Publish*, and players on your network open the displayed address to see news, updates, roadmap, sheets, music, maps and gallery, with **NEW** badges since their last visit. Private fields (🔒) are never published; the studio and API only answer on your own PC.

Run **`DevPortals.bat`** (Windows) or **`./lancer.sh`** (macOS / Linux, Python 3). French by default, English via the **FR / EN** toggle.
