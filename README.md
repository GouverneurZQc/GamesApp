# GameForge Studio 🎮✨

**L'atelier IA pour concevoir ton jeu vidéo.** Tu notes tes idées, l'agent te répond, propose des pistes et t'aide à bâtir ton jeu : GDD, histoire, personnages, véhicules, lieux, direction artistique, critique franche de tes captures d'écran et génération d'images.

> 🇫🇷 Français par défaut · 🇬🇧 English available (bouton **FR / EN** en bas à gauche)

---

## 🚀 Démarrage (aucune installation)

| Système | Comment lancer |
|---|---|
| **Windows** | Double-clique sur **`GameForge.bat`** |
| **macOS / Linux** | Lance `./lancer.sh` (ou double-clique sur `index.html`) |
| **N'importe où** | Ouvre `index.html` dans Chrome, Edge ou Firefox |

L'app fonctionne **immédiatement en mode gratuit** (sans clé) : l'agent répond et les images se génèrent via Pollinations. Pour une qualité bien supérieure et la critique de captures, ajoute une clé API dans **Paramètres**.

---

## 🧰 Fonctionnalités

| Module | Ce que tu peux faire |
|---|---|
| **Tableau de bord** | Nom, pitch, genre, plateformes, moteur, couverture ; statistiques ; idée rapide ; conseils de l'agent (prochaines étapes, points faibles, scope réaliste, pitch & noms) |
| **Idées** | Journal d'idées (catégories, statuts, tags, épingles, images). **Chaque idée a sa discussion avec l'agent** : suggestions, développer, critique franche, 5 variantes, lien avec l'histoire, comment l'implémenter, questions clés. Idée → image, → GDD, → tâche, → fiche |
| **Game Design Doc** | 17 sections guidées (concept, piliers, boucle de gameplay, mécaniques, progression, UI, technique, business, marketing, production, risques…) + sections perso. L'agent rédige un premier jet, améliore, suggère, vérifie la cohérence. **Export Markdown, HTML ou PDF** du document complet (avec fiches et images) |
| **Histoire** | Trame (logline, synopsis, univers, conflit, thèmes, ton, fin), **chapitres** (personnages et lieux présents), **chronologie des apparitions** : chaque fiche indique à quel chapitre elle arrive |
| **Personnages** | Fiche complète : nom, alias, âge, genre, espèce, rôle, faction, origine, statut, **quand/comment il arrive**, arc, apparence, tenue, personnalité, forces/faiblesses, motivations, secret, répliques, passé, **relations**, compétences, stats, véhicules, voix… + galerie d'images |
| **Véhicules** | Constructeur, modèle, année, catégorie, classe, propriétaire, apparition, design, fiche technique (vitesse, 0-100, puissance, couple, poids, moteur, motricité), **notes de conduite 0-10 avec barres**, améliorations, gadgets, son moteur… |
| **Lieux, Objets & armes, Factions, Quêtes & missions** | Fiches dédiées, reliées entre elles (propriétaires, membres, lieux, chapitres) |
| **Direction artistique** | Style, mots-clés, références, **palette** (extraite du moodboard ou proposée par l'IA), règles (lumière, formes, matières, caméra, UI, typo, à faire/à éviter), **moodboard**, **prompt de style global** appliqué à toutes les images |
| **Idée → Image** | Décris ton idée, choisis type/style/format : l'agent réécrit un prompt détaillé et génère l'image. Images de référence pour modifier une image ou garder la cohérence. Galerie : associer à une fiche, moodboard, critique… |
| **Critique de captures** | Glisse ou colle (Ctrl+V) tes screenshots : l'agent répond **franchement** (encourageant / franc / brutal) avec notes /10, problèmes classés, corrections rapides, priorité n°1. Comparaison avant/après. Transforme la critique en tâches |
| **Assistant IA** | Conversations avec 10 personas (game designer, scénariste, directeur artistique, level designer, directeur technique, producteur, critique impitoyable, joueur testeur, sound designer, marketing). Connaît tout ton projet. Images jointes |
| **Tâches & roadmap** | Kanban glisser-déposer ; plan de production généré par l'IA ; « Que faire cette semaine ? » |
| **Paramètres** | Fournisseurs IA, modèles, comportement de l'agent, sauvegarde/import, multi-projets |

Raccourcis : **Alt+N** = nouvelle idée partout · **Ctrl+V** = coller une image · **Ctrl+Entrée** = envoyer.

---

## 🤖 Fournisseurs IA pris en charge

| Fournisseur | Texte | Vision | Images | Clé |
|---|:-:|:-:|:-:|---|
| **Anthropic Claude** (recommandé pour l'agent et la critique) — `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-4-5`, `claude-fable-5-1` | ✅ | ✅ | — | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenAI** — GPT-6 (Astra / Sol / Luna), GPT Image 2.5 | ✅ | ✅ | ✅ | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** — Gemini 3.x, images « Nano Banana » | ✅ | ✅ | ✅ | [aistudio.google.com](https://aistudio.google.com/apikey) (offre gratuite) |
| **OpenRouter** — des centaines de modèles avec une seule clé | ✅ | ✅ | — | [openrouter.ai](https://openrouter.ai/keys) |
| **Ollama** / **LM Studio** — IA 100 % locale et gratuite | ✅ | ✅* | — | aucune |
| **Compatible OpenAI** — Mistral, Groq, DeepSeek, xAI… | ✅ | ✅* | — | selon le service |
| **Pollinations** — gratuit, sans clé (mode par défaut) | ✅ | — | ✅ | aucune |

\* selon le modèle choisi. Les noms de modèles sont modifiables et le bouton **« Lister les modèles »** récupère la liste à jour auprès du fournisseur.

Dans **Paramètres → Quelle IA fait quoi ?** tu choisis un fournisseur pour l'agent (texte), la vision (analyse d'images) et la génération d'images. Si le fournisseur choisi n'est pas configuré, l'app bascule automatiquement sur un autre fournisseur configuré, puis sur le mode gratuit.

**Ollama** : pour autoriser l'app à s'y connecter, définis `OLLAMA_ORIGINS=*` (Windows : `setx OLLAMA_ORIGINS "*"`, puis redémarre Ollama). **LM Studio** : onglet Developer → Start Server, active « Enable CORS ».

---

## 🔒 Données & confidentialité

- **Tout reste sur ton ordinateur**, dans le stockage local du navigateur (IndexedDB) : projets, images, clés API.
- Les clés API ne sont envoyées **qu'au fournisseur correspondant**, directement depuis ton navigateur.
- ⚠️ Si tu vides les données du navigateur, tu perds tes projets : **exporte régulièrement** (Paramètres → *Exporter ce projet* ou *Sauvegarde complète*). Le fichier `.json` contient tout, images comprises, et se réimporte sur n'importe quel ordinateur.
- Utilise toujours le même navigateur pour retrouver tes projets.

---

## 📁 Structure

```
GameForge.bat        Lanceur Windows
lancer.sh            Lanceur macOS / Linux
index.html           Application
assets/css/app.css   Styles (thème sombre / clair)
assets/js/
  util.js db.js store.js     Utilitaires, stockage IndexedDB, projets, import/export
  schemas.js                 Sections du GDD, fiches (personnages, véhicules…)
  ai.js                      Connecteurs IA (Claude, OpenAI, Gemini, OpenRouter, Ollama, Pollinations…)
  agent.js                   Agent : personas, contexte du projet, streaming, images
  md.js ui.js app.js         Markdown, composants, navigation
  views/*.js                 Écrans
```

Aucune dépendance, aucun build : du HTML/CSS/JavaScript pur.

---

## 🇬🇧 English

**GameForge Studio** is an AI workshop to design your video game. Log ideas and the agent keeps going with suggestions; write a full GDD with guided sections; build your story with chapters and an appearance timeline; keep complete sheets for **characters** (name, age, when they appear, looks, personality, relationships, stats, images…), **vehicles** (make, specs, 0-10 driving ratings, owner, first appearance…), locations, items, factions and quests; define your art direction (palette, moodboard, global style prompt); turn ideas into images; drop screenshots for a **frank critique**; chat with 10 expert personas; plan production on a kanban board.

- **Run it:** double-click `GameForge.bat` (Windows), run `./lancer.sh` (macOS/Linux) or open `index.html`. No install.
- **Language:** French by default, switch to English with the **FR / EN** toggle.
- **AI:** works out of the box in free mode (Pollinations). Add a Claude (recommended), OpenAI, Gemini or OpenRouter key — or use Ollama / LM Studio locally — in **Settings**.
- **Privacy:** everything is stored locally in your browser; keys are only sent to their provider. Export your project regularly (JSON with images) to back it up.
