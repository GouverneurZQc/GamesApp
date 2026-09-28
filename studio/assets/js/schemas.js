/* DevPortals — schémas : sections du GDD, types de fiches, catégories */
(function () {
  const S = (DP.schemas = {});

  /* ---------- Sections du Game Design Document (+ modèles) ---------- */
  const tpl = (fr, en) => [fr.trim(), en.trim()];
  S.GDD = [
    { key: 'concept', title: ['Concept & pitch', 'Concept & pitch'],
      guide: ['Quel est le jeu en une phrase ? Quel fantasme vit le joueur ? Genre, références (« X rencontre Y »), ce qui le rend unique.',
        'What is the game in one sentence? What fantasy does the player live? Genre, references ("X meets Y"), what makes it unique.'],
      template: tpl(`
### Pitch en une phrase
…
### Le fantasme du joueur
Le joueur incarne … et ressent …
### Références
- « … rencontre … »
### Ce qui rend le jeu unique
1. …
2. …
3. …`, `
### One-sentence pitch
…
### Player fantasy
The player is … and feels …
### References
- "… meets …"
### What makes it unique
1. …
2. …
3. …`) },
    { key: 'pillars', title: ['Vision & piliers de design', 'Vision & design pillars'],
      guide: ['3 à 5 piliers qui guident chaque décision. Émotions visées. Ce que le jeu N\'EST PAS.',
        '3 to 5 pillars guiding every decision. Target emotions. What the game is NOT.'],
      template: tpl(`
### Piliers
1. **…** — pourquoi : …
2. **…** — pourquoi : …
3. **…** — pourquoi : …
### Émotions visées
- …
### Ce que le jeu n'est pas
- …`, `
### Pillars
1. **…** — why: …
2. **…** — why: …
3. **…** — why: …
### Target emotions
- …
### What the game is not
- …`) },
    { key: 'audience', title: ['Public cible & plateformes', 'Audience & platforms'],
      guide: ['Pour qui ? Âge, type de joueurs, jeux similaires qu\'ils aiment. Plateformes, classement (PEGI/ESRB), langues.',
        'Who is it for? Age, player types, similar games they enjoy. Platforms, rating (PEGI/ESRB), languages.'],
      template: tpl(`
### Joueur type
- Âge : …
- Joue à : …
- Cherche : …
### Plateformes
- …
### Classement visé
PEGI … / ESRB …
### Langues
- Français, Anglais…`, `
### Target player
- Age: …
- Plays: …
- Looks for: …
### Platforms
- …
### Target rating
PEGI … / ESRB …
### Languages
- English, French…`) },
    { key: 'loop', title: ['Boucle de gameplay', 'Gameplay loop'],
      guide: ['Boucle de 30 secondes, de 5 minutes, d\'une session. Que fait le joueur minute par minute ? Pourquoi revient-il ?',
        '30-second loop, 5-minute loop, session loop. What does the player do minute by minute? Why do they come back?'],
      template: tpl(`
### Boucle courte (30 s)
Action → retour → récompense : …
### Boucle moyenne (5-10 min)
…
### Boucle longue (session / progression)
…
### Pourquoi le joueur revient
- …`, `
### Short loop (30 s)
Action → feedback → reward: …
### Mid loop (5-10 min)
…
### Long loop (session / progression)
…
### Why players come back
- …`) },
    { key: 'mechanics', title: ['Mécaniques & systèmes', 'Mechanics & systems'],
      guide: ['Mécaniques principales et secondaires, règles, ressources, combat/conduite/craft, IA des ennemis, physique.',
        'Core and secondary mechanics, rules, resources, combat/driving/crafting, enemy AI, physics.'],
      template: tpl(`
### Mécanique principale
- Règle : …
- Contrôle : …
- Profondeur (maîtrise) : …
### Mécaniques secondaires
| Mécanique | Rôle | Priorité |
|---|---|---|
| … | … | Indispensable |
### Ressources & économie
- …`, `
### Core mechanic
- Rule: …
- Control: …
- Depth (mastery): …
### Secondary mechanics
| Mechanic | Role | Priority |
|---|---|---|
| … | … | Must have |
### Resources & economy
- …`) },
    { key: 'controls', title: ['Contrôles & game feel', 'Controls & game feel'],
      guide: ['Schéma de contrôle (clavier/souris, manette, tactile). Sensations recherchées, caméra, feedback (FX, son, vibrations).',
        'Control scheme (keyboard/mouse, gamepad, touch). Target feel, camera, feedback (VFX, audio, rumble).'],
      template: tpl(`
| Action | Clavier/souris | Manette |
|---|---|---|
| … | … | … |
### Sensations visées
- …
### Caméra
- …
### Feedback (juice)
- Visuel : …
- Sonore : …
- Vibrations : …`, `
| Action | Keyboard/mouse | Gamepad |
|---|---|---|
| … | … | … |
### Target feel
- …
### Camera
- …
### Feedback (juice)
- Visual: …
- Audio: …
- Rumble: …`) },
    { key: 'progression', title: ['Progression & récompenses', 'Progression & rewards'],
      guide: ['Courbe de difficulté, déblocages, niveaux d\'expérience, économie du jeu, récompenses et rythme.',
        'Difficulty curve, unlocks, XP levels, in-game economy, rewards and pacing.'],
      template: tpl(`
### Courbe de difficulté
…
### Déblocages
| Palier | Débloque |
|---|---|
| … | … |
### Récompenses
- …
### Astuce
Utilise le calculateur de courbe d'XP de la Boîte à outils.`, `
### Difficulty curve
…
### Unlocks
| Tier | Unlocks |
|---|---|
| … | … |
### Rewards
- …
### Tip
Use the XP curve calculator in the Toolbox.`) },
    { key: 'world', title: ['Univers & niveaux', 'World & levels'],
      guide: ['Structure du monde (linéaire, hub, monde ouvert), liste des niveaux/zones, objectifs, durée, secrets.',
        'World structure (linear, hub, open world), list of levels/zones, objectives, length, secrets.'],
      template: tpl(`
### Structure
Linéaire / hub / monde ouvert : …
### Niveaux / zones
| # | Nom | Objectif | Durée | Nouveauté |
|---|---|---|---|---|
| 1 | … | … | … | … |`, `
### Structure
Linear / hub / open world: …
### Levels / zones
| # | Name | Goal | Length | New element |
|---|---|---|---|---|
| 1 | … | … | … | … |`) },
    { key: 'narrative', title: ['Narration', 'Narrative'],
      guide: ['Comment l\'histoire est racontée (cinématiques, dialogues, environnement). Détails dans le module Histoire.',
        'How the story is told (cutscenes, dialogue, environment). Details live in the Story module.'],
      template: tpl(`
### Moyens narratifs
- Cinématiques : …
- Dialogues : …
- Narration environnementale : …
### Choix du joueur
…`, `
### Storytelling tools
- Cutscenes: …
- Dialogue: …
- Environmental storytelling: …
### Player choices
…`) },
    { key: 'art', title: ['Direction artistique', 'Art direction'],
      guide: ['Résumé du style visuel. Détails complets dans le module Direction artistique.',
        'Visual style summary. Full details in the Art direction module.'],
      template: tpl(`
### Style en une phrase
…
### Références
- …
### Contraintes techniques
- …`, `
### Style in one sentence
…
### References
- …
### Technical constraints
- …`) },
    { key: 'audio', title: ['Son & musique', 'Audio & music'],
      guide: ['Style musical, musique adaptative, bruitages clés, doublage, ambiance sonore. Liste détaillée dans Musique & son.',
        'Music style, adaptive music, key sound effects, voice acting, soundscape. Detailed list in Music & sound.'],
      template: tpl(`
### Style musical
…
### Musique adaptative
…
### Sons clés
- …
### Voix
…`, `
### Music style
…
### Adaptive music
…
### Key sounds
- …
### Voice
…`) },
    { key: 'ui', title: ['Interface & UX', 'UI & UX'],
      guide: ['HUD, menus, onboarding/tutoriel, accessibilité (daltonisme, sous-titres, remapping), flux d\'écrans.',
        'HUD, menus, onboarding/tutorial, accessibility (colorblind, subtitles, remapping), screen flow.'],
      template: tpl(`
### HUD
- …
### Flux des écrans
Titre → Menu → …
### Tutoriel
…
### Accessibilité
- [ ] Sous-titres
- [ ] Remappage des touches
- [ ] Mode daltonien`, `
### HUD
- …
### Screen flow
Title → Menu → …
### Tutorial
…
### Accessibility
- [ ] Subtitles
- [ ] Key remapping
- [ ] Colorblind mode`) },
    { key: 'tech', title: ['Technique & moteur', 'Tech & engine'],
      guide: ['Moteur (Unity, Unreal, Godot…), langages, outils, performances cibles, sauvegarde, réseau/multijoueur.',
        'Engine (Unity, Unreal, Godot…), languages, tools, target performance, save system, networking/multiplayer.'],
      template: tpl(`
- Moteur : …
- Langage : …
- Performances cibles : … FPS en …
- Sauvegarde : …
- Réseau : …
- Outils : …`, `
- Engine: …
- Language: …
- Target performance: … FPS at …
- Save system: …
- Networking: …
- Tools: …`) },
    { key: 'business', title: ['Modèle économique', 'Business model'],
      guide: ['Prix, premium/F2P, DLC, monétisation éthique, budget, sources de financement.',
        'Price, premium/F2P, DLC, ethical monetization, budget, funding sources.'],
      template: tpl(`
- Modèle : premium / F2P / …
- Prix visé : …
- DLC / extensions : …
- Budget : …
- Financement : …`, `
- Model: premium / F2P / …
- Target price: …
- DLC / expansions: …
- Budget: …
- Funding: …`) },
    { key: 'marketing', title: ['Marketing & communauté', 'Marketing & community'],
      guide: ['Positionnement, page Steam, trailer, réseaux sociaux, festivals, influenceurs, communauté Discord, portail joueurs.',
        'Positioning, Steam page, trailer, social media, festivals, creators, Discord community, player portal.'],
      template: tpl(`
### Positionnement
…
### Canaux
- Page Steam / magasin : …
- Réseaux : …
- Discord : …
- Portail DevPortals : …
### Calendrier
| Date | Action |
|---|---|
| … | … |`, `
### Positioning
…
### Channels
- Steam / store page: …
- Social: …
- Discord: …
- DevPortals portal: …
### Calendar
| Date | Action |
|---|---|
| … | … |`) },
    { key: 'production', title: ['Production & planning', 'Production & schedule'],
      guide: ['Équipe, jalons (prototype, vertical slice, alpha, bêta, sortie), scope réaliste, priorités (MoSCoW).',
        'Team, milestones (prototype, vertical slice, alpha, beta, launch), realistic scope, priorities (MoSCoW).'],
      template: tpl(`
### MoSCoW
- **Indispensable** : …
- **Important** : …
- **Bonus** : …
- **Pas cette fois** : …
### Jalons
Voir Tâches & jalons.`, `
### MoSCoW
- **Must**: …
- **Should**: …
- **Could**: …
- **Won't (this time)**: …
### Milestones
See Tasks & milestones.`) },
    { key: 'risks', title: ['Risques & questions ouvertes', 'Risks & open questions'],
      guide: ['Ce qui peut faire échouer le projet, hypothèses à valider par prototype, questions non résolues.',
        'What could sink the project, assumptions to validate by prototyping, unresolved questions.'],
      template: tpl(`
| Risque | Probabilité | Impact | Plan |
|---|---|---|---|
| … | Moyenne | Élevé | … |
### Questions ouvertes
- [ ] …`, `
| Risk | Likelihood | Impact | Plan |
|---|---|---|---|
| … | Medium | High | … |
### Open questions
- [ ] …`) },
  ];
  S.gddDef = (key) => S.GDD.find((d) => d.key === key);

  /* ---------- Idées ---------- */
  S.IDEA_CATS = [
    ['gameplay', ['Gameplay', 'Gameplay']], ['story', ['Histoire', 'Story']], ['character', ['Personnage', 'Character']],
    ['vehicle', ['Véhicule', 'Vehicle']], ['level', ['Niveau / lieu', 'Level / location']], ['art', ['Art / visuel', 'Art / visuals']],
    ['audio', ['Musique / son', 'Music / sound']], ['ui', ['UI / UX', 'UI / UX']], ['tech', ['Technique', 'Tech']],
    ['business', ['Business / marketing', 'Business / marketing']], ['other', ['Autre', 'Other']],
  ];
  S.IDEA_STATUS = [
    ['new', ['Nouvelle', 'New'], '#a78bfa'], ['explore', ['À explorer', 'To explore'], '#f59e0b'],
    ['keep', ['Retenue', 'Kept'], '#22c55e'], ['done', ['Intégrée', 'Integrated'], '#71717a'], ['rejected', ['Rejetée', 'Rejected'], '#ef4444'],
  ];
  S.IDEA_SCORES = [
    ['fun', ['Plaisir', 'Fun']], ['orig', ['Originalité', 'Originality']], ['fit', ['Cohérence', 'Fit']], ['feas', ['Faisabilité', 'Feasibility']],
  ];

  /* ---------- Fiches (entités) ---------- */
  const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
  const opts = (list) => list.map(([v, l]) => ({ v, l }));
  const TAGS = f('tags', ['Tags', 'Tags'], 'tags');
  const NOTES = f('notes', ['Notes internes', 'Internal notes'], 'textarea', { wide: true, priv: true });

  S.ENTITIES = {
    characters: {
      icon: 'users', portal: true, label: ['Personnages', 'Characters'], singular: ['Personnage', 'Character'],
      subtitle: (x) => [optLabel('characters', 'role', x.role), x.age ? T(`${x.age} ans`, `age ${x.age}`) : '', x.occupation].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name'], 'text', { placeholder: ['Nom complet', 'Full name'] }),
          f('alias', ['Surnom / alias', 'Nickname / alias']),
          f('age', ['Âge', 'Age'], 'text', { placeholder: ['ex. 27, ~40, immortel', 'e.g. 27, ~40, immortal'] }),
          f('gender', ['Genre', 'Gender']),
          f('species', ['Espèce / race', 'Species / race']),
          f('role', ['Rôle', 'Role'], 'select', { options: opts([
            ['protagonist', ['Protagoniste', 'Protagonist']], ['antagonist', ['Antagoniste', 'Antagonist']], ['ally', ['Allié', 'Ally']],
            ['companion', ['Compagnon', 'Companion']], ['mentor', ['Mentor', 'Mentor']], ['rival', ['Rival', 'Rival']], ['boss', ['Boss', 'Boss']],
            ['npc', ['PNJ', 'NPC']], ['merchant', ['Marchand', 'Merchant']], ['other', ['Autre', 'Other']]]) }),
          f('importance', ['Importance', 'Importance'], 'select', { options: opts([['main', ['Principal', 'Main']], ['secondary', ['Secondaire', 'Secondary']], ['minor', ['Mineur', 'Minor']]]) }),
          f('occupation', ['Métier / classe', 'Occupation / class']),
          f('faction', ['Faction', 'Faction'], 'ref', { ref: 'factions' }),
          f('origin', ['Origine', 'Origin'], 'ref', { ref: 'locations' }),
          f('status', ['Statut', 'Status'], 'select', { options: opts([['alive', ['Vivant', 'Alive']], ['dead', ['Mort', 'Dead']], ['missing', ['Disparu', 'Missing']], ['unknown', ['Inconnu', 'Unknown']]]) }),
        ] },
        { label: ['Apparition dans le jeu', 'Appearance in the game'], fields: [
          f('firstChapter', ['Arrive au chapitre', 'First appears in chapter'], 'chapter'),
          f('firstAppearance', ['Quand / comment il arrive', 'When / how they appear'], 'textarea', { placeholder: ['ex. Niveau 3, sauve le héros pendant la poursuite…', 'e.g. Level 3, saves the hero during the chase…'] }),
          f('arc', ['Arc narratif / évolution', 'Story arc / evolution'], 'textarea', { priv: true }),
          f('fate', ['Destin / sortie (spoiler)', 'Fate / exit (spoiler)'], 'textarea', { priv: true }),
        ] },
        { label: ['Apparence', 'Looks'], fields: [
          f('height', ['Taille', 'Height']), f('build', ['Carrure / poids', 'Build / weight']),
          f('appearance', ['Description physique', 'Physical description'], 'textarea', { wide: true }),
          f('outfit', ['Tenue / équipement visible', 'Outfit / visible gear'], 'textarea'),
          f('distinctive', ['Signes distinctifs', 'Distinctive features'], 'textarea'),
          f('colors', ['Couleurs dominantes', 'Signature colors']),
        ] },
        { label: ['Personnalité', 'Personality'], fields: [
          f('personality', ['Personnalité', 'Personality'], 'textarea', { wide: true }),
          f('traits', ['Traits (mots-clés)', 'Traits (keywords)'], 'tags'),
          f('strengths', ['Forces', 'Strengths'], 'textarea'), f('weaknesses', ['Faiblesses / peurs', 'Weaknesses / fears'], 'textarea'),
          f('motivation', ['Motivations / objectifs', 'Motivations / goals'], 'textarea'),
          f('secret', ['Secret', 'Secret'], 'textarea', { priv: true }),
          f('quotes', ['Répliques / citations', 'Lines / quotes'], 'textarea'),
        ] },
        { label: ['Histoire & relations', 'Backstory & relationships'], fields: [
          f('backstory', ['Passé / biographie', 'Backstory / biography'], 'textarea', { wide: true, rows: 6 }),
          f('relations', ['Relations', 'Relationships'], 'relations', { wide: true }),
        ] },
        { label: ['Gameplay', 'Gameplay'], fields: [
          f('playable', ['Jouable ?', 'Playable?'], 'select', { options: opts([['yes', ['Oui', 'Yes']], ['no', ['Non', 'No']], ['partial', ['Partiellement', 'Partially']]]) }),
          f('abilities', ['Compétences / pouvoirs', 'Skills / powers'], 'textarea'),
          f('weapons', ['Armes / équipement de jeu', 'Weapons / gameplay gear'], 'textarea'),
          f('behavior', ['Comportement (IA, combat)', 'Behavior (AI, combat)'], 'textarea', { priv: true }),
          f('stats', ['Statistiques', 'Stats'], 'kv', { wide: true, placeholderK: ['PV', 'HP'], placeholderV: ['100', '100'] }),
          f('vehicles', ['Véhicules', 'Vehicles'], 'refs', { ref: 'vehicles' }),
          f('theme', ['Thème musical', 'Music theme'], 'ref', { ref: 'tracks' }),
        ] },
        { label: ['Production', 'Production'], fields: [
          f('voice', ['Voix / doubleur', 'Voice / actor']),
          f('references', ['Inspirations / références', 'Inspirations / references'], 'textarea', { priv: true }),
          TAGS, NOTES,
        ] },
      ],
    },

    vehicles: {
      icon: 'car', portal: true, label: ['Véhicules', 'Vehicles'], singular: ['Véhicule', 'Vehicle'],
      subtitle: (x) => [x.manufacturer, x.model, x.year, x.vclass ? T(`Classe ${x.vclass}`, `Class ${x.vclass}`) : ''].filter(Boolean).join(' · '),
      ratings: ['rSpeed', 'rAccel', 'rHandling', 'rBraking', 'rDurability', 'rOffroad'],
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name']), f('manufacturer', ['Constructeur / marque', 'Manufacturer / brand']),
          f('model', ['Modèle', 'Model']), f('year', ['Année', 'Year']),
          f('category', ['Catégorie', 'Category'], 'select', { options: opts([
            ['sports', ['Sportive', 'Sports car']], ['super', ['Supercar / hypercar', 'Supercar / hypercar']], ['muscle', ['Muscle car', 'Muscle car']],
            ['tuner', ['Tuner / JDM', 'Tuner / JDM']], ['sedan', ['Berline', 'Sedan']], ['classic', ['Classique / rétro', 'Classic / retro']],
            ['suv', ['SUV', 'SUV']], ['offroad', ['Tout-terrain', 'Off-road']], ['rally', ['Rallye', 'Rally']], ['formula', ['Monoplace', 'Open-wheel']],
            ['truck', ['Camion / pick-up', 'Truck / pickup']], ['van', ['Fourgon', 'Van']], ['police', ['Police / urgence', 'Police / emergency']],
            ['military', ['Militaire', 'Military']], ['moto', ['Moto', 'Motorcycle']], ['scifi', ['Futuriste / sci-fi', 'Futuristic / sci-fi']],
            ['hover', ['Aéroglisseur', 'Hover vehicle']], ['aircraft', ['Avion', 'Aircraft']], ['heli', ['Hélicoptère', 'Helicopter']],
            ['boat', ['Bateau', 'Boat']], ['other', ['Autre', 'Other']]]) }),
          f('vclass', ['Classe / tier', 'Class / tier'], 'select', { options: opts(['D', 'C', 'B', 'A', 'S', 'S+'].map((c) => [c, [c, c]])) }),
          f('owner', ['Propriétaire', 'Owner'], 'ref', { ref: 'characters' }),
          f('price', ['Prix en jeu', 'In-game price']),
        ] },
        { label: ['Apparition dans le jeu', 'Appearance in the game'], fields: [
          f('firstChapter', ['Apparaît au chapitre', 'First appears in chapter'], 'chapter'),
          f('firstAppearance', ['Quand / comment il apparaît', 'When / how it appears'], 'textarea'),
          f('unlock', ['Comment l\'obtenir / le débloquer', 'How to get / unlock it'], 'textarea'),
        ] },
        { label: ['Design', 'Design'], fields: [
          f('description', ['Description générale', 'General description'], 'textarea', { wide: true }),
          f('exterior', ['Design extérieur', 'Exterior design'], 'textarea'), f('interior', ['Intérieur / cockpit', 'Interior / cockpit'], 'textarea'),
          f('colors', ['Couleurs / livrées', 'Colors / liveries']), f('inspiration', ['Inspiration réelle', 'Real-world inspiration'], 'text', { priv: true }),
        ] },
        { label: ['Fiche technique', 'Spec sheet'], fields: [
          f('topSpeed', ['Vitesse max (km/h)', 'Top speed (km/h)'], 'number'), f('accel', ['0-100 km/h (s)', '0-100 km/h (s)'], 'number'),
          f('power', ['Puissance (ch)', 'Power (hp)'], 'number'), f('torque', ['Couple (Nm)', 'Torque (Nm)'], 'number'),
          f('weight', ['Poids (kg)', 'Weight (kg)'], 'number'), f('engine', ['Moteur', 'Engine']), f('transmission', ['Transmission', 'Transmission']),
          f('drivetrain', ['Motricité', 'Drivetrain'], 'select', { options: opts([
            ['FWD', ['Traction (FWD)', 'Front-wheel (FWD)']], ['RWD', ['Propulsion (RWD)', 'Rear-wheel (RWD)']],
            ['AWD', ['Intégrale (AWD)', 'All-wheel (AWD)']], ['4x4', ['4x4', '4x4']], ['other', ['Autre', 'Other']]]) }),
        ] },
        { label: ['Notes de conduite (0-10)', 'Driving ratings (0-10)'], fields: [
          f('rSpeed', ['Vitesse', 'Speed'], 'rating'), f('rAccel', ['Accélération', 'Acceleration'], 'rating'),
          f('rHandling', ['Maniabilité', 'Handling'], 'rating'), f('rBraking', ['Freinage', 'Braking'], 'rating'),
          f('rDurability', ['Résistance', 'Durability'], 'rating'), f('rOffroad', ['Tout-terrain', 'Off-road'], 'rating'),
        ] },
        { label: ['Gameplay', 'Gameplay'], fields: [
          f('handlingNotes', ['Comportement de conduite', 'Driving behavior'], 'textarea'),
          f('upgrades', ['Améliorations / personnalisation', 'Upgrades / customization'], 'textarea'),
          f('gadgets', ['Armes / gadgets', 'Weapons / gadgets'], 'textarea'),
          f('sound', ['Son du moteur', 'Engine sound']), f('soundTrack', ['Son associé', 'Linked sound'], 'ref', { ref: 'tracks' }),
          TAGS, NOTES,
        ] },
      ],
    },

    locations: {
      icon: 'pin', portal: true, label: ['Lieux', 'Locations'], singular: ['Lieu', 'Location'],
      subtitle: (x) => [optLabel('locations', 'ltype', x.ltype), x.region].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name']),
          f('ltype', ['Type', 'Type'], 'select', { options: opts([
            ['city', ['Ville', 'City']], ['village', ['Village', 'Village']], ['district', ['Quartier', 'District']], ['building', ['Bâtiment', 'Building']],
            ['interior', ['Intérieur', 'Interior']], ['dungeon', ['Donjon', 'Dungeon']], ['forest', ['Forêt', 'Forest']], ['desert', ['Désert', 'Desert']],
            ['mountain', ['Montagne', 'Mountain']], ['coast', ['Côte / mer', 'Coast / sea']], ['track', ['Circuit / route', 'Track / road']],
            ['space', ['Espace', 'Space']], ['hub', ['Hub', 'Hub']], ['other', ['Autre', 'Other']]]) }),
          f('region', ['Région / monde', 'Region / world']), f('parent', ['Situé dans', 'Located in'], 'ref', { ref: 'locations' }),
          f('firstChapter', ['Découvert au chapitre', 'Discovered in chapter'], 'chapter'),
          f('levelRange', ['Niveau / difficulté', 'Level / difficulty']), f('climate', ['Climat / météo / heure', 'Climate / weather / time']),
          f('size', ['Taille / superficie', 'Size / area']), f('population', ['Population', 'Population']),
        ] },
        { label: ['Description', 'Description'], fields: [
          f('description', ['Description', 'Description'], 'textarea', { wide: true, rows: 5 }),
          f('atmosphere', ['Ambiance / atmosphère', 'Mood / atmosphere'], 'textarea'), f('history', ['Histoire du lieu', 'Location history'], 'textarea'),
          f('pois', ['Points d\'intérêt', 'Points of interest'], 'textarea'), f('secrets', ['Secrets / collectibles', 'Secrets / collectibles'], 'textarea', { priv: true }),
        ] },
        { label: ['Gameplay & habitants', 'Gameplay & inhabitants'], fields: [
          f('activities', ['Activités / missions', 'Activities / missions'], 'textarea'), f('dangers', ['Dangers / ennemis', 'Dangers / enemies'], 'textarea'),
          f('services', ['Services / boutiques', 'Services / shops'], 'textarea'),
          f('inhabitants', ['Personnages présents', 'Characters present'], 'refs', { ref: 'characters' }),
          f('factions', ['Factions présentes', 'Factions present'], 'refs', { ref: 'factions' }),
          f('music', ['Musique du lieu', 'Location music'], 'refs', { ref: 'tracks' }),
          TAGS, NOTES,
        ] },
      ],
    },

    items: {
      icon: 'box', portal: true, label: ['Objets & armes', 'Items & weapons'], singular: ['Objet', 'Item'],
      subtitle: (x) => [optLabel('items', 'itype', x.itype), optLabel('items', 'rarity', x.rarity)].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name']),
          f('itype', ['Type', 'Type'], 'select', { options: opts([
            ['weapon', ['Arme', 'Weapon']], ['armor', ['Armure / tenue', 'Armor / outfit']], ['consumable', ['Consommable', 'Consumable']],
            ['key', ['Objet clé', 'Key item']], ['quest', ['Objet de quête', 'Quest item']], ['collectible', ['Collectible', 'Collectible']],
            ['material', ['Matériau / ressource', 'Material / resource']], ['gadget', ['Gadget / outil', 'Gadget / tool']],
            ['currency', ['Monnaie', 'Currency']], ['part', ['Pièce de véhicule', 'Vehicle part']], ['cosmetic', ['Cosmétique', 'Cosmetic']], ['other', ['Autre', 'Other']]]) }),
          f('rarity', ['Rareté', 'Rarity'], 'select', { options: opts([
            ['common', ['Commun', 'Common']], ['uncommon', ['Peu commun', 'Uncommon']], ['rare', ['Rare', 'Rare']],
            ['epic', ['Épique', 'Epic']], ['legendary', ['Légendaire', 'Legendary']], ['unique', ['Unique', 'Unique']]]) }),
          f('value', ['Valeur / prix', 'Value / price']), f('owner', ['Propriétaire', 'Owner'], 'ref', { ref: 'characters' }),
          f('location', ['Où le trouver', 'Where to find it'], 'ref', { ref: 'locations' }),
        ] },
        { label: ['Détails', 'Details'], fields: [
          f('description', ['Description', 'Description'], 'textarea', { wide: true }),
          f('effect', ['Effet / fonction', 'Effect / function'], 'textarea'), f('obtain', ['Comment l\'obtenir', 'How to obtain'], 'textarea'),
          f('stats', ['Statistiques', 'Stats'], 'kv', { wide: true, placeholderK: ['Dégâts', 'Damage'], placeholderV: ['25', '25'] }),
          f('lore', ['Histoire / lore', 'Lore'], 'textarea'), TAGS, NOTES,
        ] },
      ],
    },

    factions: {
      icon: 'shield', portal: true, label: ['Factions', 'Factions'], singular: ['Faction', 'Faction'],
      subtitle: (x) => [x.ftype].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name']), f('ftype', ['Type (gang, guilde, royaume…)', 'Type (gang, guild, kingdom…)']),
          f('leader', ['Chef', 'Leader'], 'ref', { ref: 'characters' }), f('members', ['Membres', 'Members'], 'refs', { ref: 'characters' }),
          f('base', ['Quartier général', 'Headquarters'], 'ref', { ref: 'locations' }), f('symbol', ['Symbole / couleurs', 'Symbol / colors']),
        ] },
        { label: ['Profil', 'Profile'], fields: [
          f('ideology', ['Idéologie / valeurs', 'Ideology / values'], 'textarea'), f('goals', ['Objectifs', 'Goals'], 'textarea'),
          f('strength', ['Puissance / ressources', 'Power / resources'], 'textarea'),
          f('allies', ['Alliés', 'Allies'], 'refs', { ref: 'factions' }), f('enemies', ['Ennemis', 'Enemies'], 'refs', { ref: 'factions' }),
          f('history', ['Histoire', 'History'], 'textarea', { wide: true }), TAGS, NOTES,
        ] },
      ],
    },

    quests: {
      icon: 'flag', portal: true, label: ['Quêtes & missions', 'Quests & missions'], singular: ['Mission', 'Mission'],
      subtitle: (x) => [optLabel('quests', 'qtype', x.qtype), x.duration].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name']),
          f('qtype', ['Type', 'Type'], 'select', { options: opts([
            ['main', ['Principale', 'Main']], ['side', ['Secondaire', 'Side']], ['race', ['Course', 'Race']], ['contract', ['Contrat', 'Contract']],
            ['challenge', ['Défi', 'Challenge']], ['boss', ['Combat de boss', 'Boss fight']], ['event', ['Événement', 'Event']], ['other', ['Autre', 'Other']]]) }),
          f('chapter', ['Chapitre', 'Chapter'], 'chapter'), f('giver', ['Donneur de quête', 'Quest giver'], 'ref', { ref: 'characters' }),
          f('location', ['Lieu', 'Location'], 'ref', { ref: 'locations' }), f('difficulty', ['Difficulté', 'Difficulty'], 'rating'),
          f('duration', ['Durée estimée', 'Estimated length']),
          f('qstatus', ['État de production', 'Production status'], 'select', { priv: true, options: opts([['idea', ['Idée', 'Idea']], ['design', ['Design', 'Design']], ['blockout', ['Blockout', 'Blockout']], ['playable', ['Jouable', 'Playable']], ['polish', ['Polish', 'Polish']], ['done', ['Terminée', 'Done']]]) }),
        ] },
        { label: ['Déroulement', 'Walkthrough'], fields: [
          f('summary', ['Résumé', 'Summary'], 'textarea', { wide: true }),
          f('objectives', ['Objectifs / étapes', 'Objectives / steps'], 'textarea', { wide: true, rows: 5, priv: true }),
          f('fail', ['Conditions d\'échec', 'Fail conditions'], 'textarea', { priv: true }), f('rewards', ['Récompenses', 'Rewards'], 'textarea'),
          f('dialogue', ['Moments clés', 'Key moments'], 'textarea', { wide: true, priv: true }),
          f('characters', ['Personnages impliqués', 'Characters involved'], 'refs', { ref: 'characters' }),
          f('vehicles', ['Véhicules impliqués', 'Vehicles involved'], 'refs', { ref: 'vehicles' }),
          f('music', ['Musique', 'Music'], 'refs', { ref: 'tracks' }), TAGS, NOTES,
        ] },
      ],
    },

    dialogues: {
      icon: 'chat', portal: false, label: ['Dialogues & scènes', 'Dialogue & scenes'], singular: ['Scène', 'Scene'],
      subtitle: (x) => [S_chapter(x.chapter), optLabel('dialogues', 'dstatus', x.dstatus)].filter(Boolean).join(' · '),
      groups: [
        { label: ['Scène', 'Scene'], fields: [
          f('name', ['Titre de la scène', 'Scene title']), f('chapter', ['Chapitre', 'Chapter'], 'chapter'),
          f('location', ['Lieu', 'Location'], 'ref', { ref: 'locations' }), f('characters', ['Personnages', 'Characters'], 'refs', { ref: 'characters' }),
          f('dtype', ['Type', 'Type'], 'select', { options: opts([['cutscene', ['Cinématique', 'Cutscene']], ['ingame', ['Dialogue en jeu', 'In-game dialogue']], ['bark', ['Répliques d\'ambiance (barks)', 'Barks']], ['radio', ['Radio / téléphone', 'Radio / phone']], ['branching', ['À embranchements', 'Branching']]]) }),
          f('dstatus', ['État', 'Status'], 'select', { options: opts([['draft', ['Brouillon', 'Draft']], ['written', ['Écrit', 'Written']], ['reviewed', ['Relu', 'Reviewed']], ['recorded', ['Enregistré', 'Recorded']], ['implemented', ['Intégré', 'Implemented']]]) }),
          f('context', ['Contexte', 'Context'], 'textarea', { wide: true }),
        ] },
        { label: ['Script', 'Script'], fields: [
          f('script', ['Script (une réplique par ligne : NOM : texte)', 'Script (one line each: NAME: text)'], 'script', { wide: true, rows: 12 }),
          f('choices', ['Choix du joueur / embranchements', 'Player choices / branches'], 'textarea', { wide: true }),
          f('audio', ['Enregistrement', 'Recording'], 'ref', { ref: 'tracks' }), TAGS, NOTES,
        ] },
      ],
    },

    lore: {
      icon: 'bookmark', portal: true, label: ['Lore & encyclopédie', 'Lore & encyclopedia'], singular: ['Article', 'Entry'],
      subtitle: (x) => [optLabel('lore', 'lcategory', x.lcategory), x.era].filter(Boolean).join(' · '),
      groups: [
        { label: ['Article', 'Entry'], fields: [
          f('name', ['Titre', 'Title']),
          f('lcategory', ['Catégorie', 'Category'], 'select', { options: opts([
            ['history', ['Histoire / événement', 'History / event']], ['culture', ['Culture / société', 'Culture / society']], ['religion', ['Religion / croyances', 'Religion / beliefs']],
            ['tech', ['Technologie', 'Technology']], ['magic', ['Magie / pouvoirs', 'Magic / powers']], ['geo', ['Géographie', 'Geography']],
            ['species', ['Espèces / créatures', 'Species / creatures']], ['org', ['Organisation', 'Organization']], ['term', ['Terme / glossaire', 'Term / glossary']], ['other', ['Autre', 'Other']]]) }),
          f('era', ['Époque / date', 'Era / date']), f('summary', ['Résumé', 'Summary'], 'textarea', { wide: true }),
          f('content', ['Article complet', 'Full entry'], 'textarea', { wide: true, rows: 8 }),
        ] },
        { label: ['Liens', 'Links'], fields: [
          f('characters', ['Personnages liés', 'Related characters'], 'refs', { ref: 'characters' }),
          f('locations', ['Lieux liés', 'Related locations'], 'refs', { ref: 'locations' }),
          f('factions', ['Factions liées', 'Related factions'], 'refs', { ref: 'factions' }),
          f('secret', ['Vérité cachée (spoiler)', 'Hidden truth (spoiler)'], 'textarea', { priv: true }), TAGS, NOTES,
        ] },
      ],
    },

    tracks: {
      icon: 'music', portal: true, label: ['Musique & son', 'Music & sound'], singular: ['Piste', 'Track'],
      subtitle: (x) => [optLabel('tracks', 'ttype', x.ttype), x.composer, optLabel('tracks', 'tstatus', x.tstatus)].filter(Boolean).join(' · '),
      groups: [
        { label: ['Piste', 'Track'], fields: [
          f('name', ['Titre', 'Title']),
          f('ttype', ['Type', 'Type'], 'select', { options: opts([
            ['music', ['Musique', 'Music']], ['theme', ['Thème de personnage', 'Character theme']], ['ambient', ['Ambiance', 'Ambience']],
            ['sfx', ['Effet sonore', 'Sound effect']], ['ui', ['Son d\'interface', 'UI sound']], ['voice', ['Voix / doublage', 'Voice / VO']],
            ['stinger', ['Jingle / stinger', 'Jingle / stinger']], ['engine', ['Moteur / véhicule', 'Engine / vehicle']], ['other', ['Autre', 'Other']]]) }),
          f('audio', ['Fichier audio', 'Audio file'], 'audio', { wide: true }),
          f('tstatus', ['État', 'Status'], 'select', { options: opts([['idea', ['Idée', 'Idea']], ['sketch', ['Maquette', 'Sketch']], ['wip', ['En cours', 'In progress']], ['mix', ['Mixage', 'Mixing']], ['final', ['Final', 'Final']]]) }),
          f('composer', ['Compositeur / auteur', 'Composer / author']), f('duration', ['Durée', 'Duration'], 'text', { placeholder: ['ex. 2:45', 'e.g. 2:45'] }),
          f('bpm', ['Tempo (BPM)', 'Tempo (BPM)'], 'number'), f('key', ['Tonalité', 'Key'], 'text', { placeholder: ['ex. Ré mineur', 'e.g. D minor'] }),
          f('loop', ['En boucle ?', 'Loops?'], 'select', { options: opts([['yes', ['Oui', 'Yes']], ['no', ['Non', 'No']]]) }),
          f('mood', ['Ambiance / émotion', 'Mood / emotion']), f('instruments', ['Instruments / sons', 'Instruments / sounds'], 'textarea'),
        ] },
        { label: ['Utilisation dans le jeu', 'Use in the game'], fields: [
          f('usage', ['Où / quand elle joue', 'Where / when it plays'], 'textarea', { wide: true }),
          f('chapter', ['Chapitre', 'Chapter'], 'chapter'), f('locations', ['Lieux', 'Locations'], 'refs', { ref: 'locations' }),
          f('characters', ['Personnages', 'Characters'], 'refs', { ref: 'characters' }), f('quests', ['Missions', 'Missions'], 'refs', { ref: 'quests' }),
          f('adaptive', ['Musique adaptative (couches, transitions)', 'Adaptive music (layers, transitions)'], 'textarea', { priv: true }),
        ] },
        { label: ['Production', 'Production'], fields: [
          f('license', ['Licence', 'License'], 'select', { options: opts([['original', ['Création originale', 'Original']], ['licensed', ['Sous licence', 'Licensed']], ['free', ['Libre de droits', 'Royalty-free']], ['cc', ['Creative Commons', 'Creative Commons']]]) }),
          f('references', ['Références musicales', 'Music references'], 'textarea', { priv: true }), TAGS, NOTES,
        ] },
      ],
    },

    assets: {
      icon: 'layers', portal: false, label: ['Assets de production', 'Production assets'], singular: ['Asset', 'Asset'],
      subtitle: (x) => [optLabel('assets', 'atype', x.atype), optLabel('assets', 'astatus', x.astatus), x.assignee ? DP.store.entityName('team', x.assignee) : ''].filter(Boolean).join(' · '),
      groups: [
        { label: ['Asset', 'Asset'], fields: [
          f('name', ['Nom', 'Name']),
          f('atype', ['Type', 'Type'], 'select', { options: opts([
            ['model', ['Modèle 3D', '3D model']], ['texture', ['Texture / matériau', 'Texture / material']], ['sprite', ['Sprite / 2D', 'Sprite / 2D']],
            ['anim', ['Animation', 'Animation']], ['vfx', ['Effet visuel (VFX)', 'Visual effect (VFX)']], ['ui', ['Interface', 'UI']],
            ['audio', ['Audio', 'Audio']], ['level', ['Niveau / map', 'Level / map']], ['code', ['Code / système', 'Code / system']], ['other', ['Autre', 'Other']]]) }),
          f('astatus', ['État', 'Status'], 'select', { options: opts([['todo', ['À faire', 'To do']], ['wip', ['En cours', 'In progress']], ['review', ['À valider', 'In review']], ['done', ['Terminé', 'Done']], ['cut', ['Coupé', 'Cut']]]) }),
          f('priority', ['Priorité', 'Priority'], 'select', { options: opts([['high', ['Haute', 'High']], ['med', ['Moyenne', 'Medium']], ['low', ['Basse', 'Low']]]) }),
          f('assignee', ['Responsable', 'Assignee'], 'ref', { ref: 'team' }), f('due', ['Échéance', 'Due date'], 'date'),
          f('estimate', ['Estimation (heures)', 'Estimate (hours)'], 'number'), f('spent', ['Temps passé (heures)', 'Time spent (hours)'], 'number'),
        ] },
        { label: ['Détails', 'Details'], fields: [
          f('forWhat', ['Pour (fiche / niveau)', 'For (sheet / level)']), f('path', ['Chemin / fichier', 'Path / file']),
          f('specs', ['Spécifications (polycount, résolution, format…)', 'Specs (polycount, resolution, format…)'], 'textarea', { wide: true }),
          TAGS, NOTES,
        ] },
      ],
    },

    bugs: {
      icon: 'bug', portal: false, label: ['Bugs', 'Bugs'], singular: ['Bug', 'Bug'],
      subtitle: (x) => [optLabel('bugs', 'severity', x.severity), optLabel('bugs', 'bstatus', x.bstatus), x.version].filter(Boolean).join(' · '),
      groups: [
        { label: ['Bug', 'Bug'], fields: [
          f('name', ['Titre', 'Title']),
          f('severity', ['Gravité', 'Severity'], 'select', { options: opts([['blocker', ['Bloquant', 'Blocker']], ['critical', ['Critique', 'Critical']], ['major', ['Majeur', 'Major']], ['minor', ['Mineur', 'Minor']], ['trivial', ['Cosmétique', 'Trivial']]]) }),
          f('bstatus', ['État', 'Status'], 'select', { options: opts([['new', ['Nouveau', 'New']], ['confirmed', ['Confirmé', 'Confirmed']], ['progress', ['En correction', 'In progress']], ['fixed', ['Corrigé', 'Fixed']], ['wontfix', ['Ne sera pas corrigé', "Won't fix"]], ['duplicate', ['Doublon', 'Duplicate']]]) }),
          f('version', ['Version / build', 'Version / build']), f('platform', ['Plateforme', 'Platform']), f('area', ['Zone / système', 'Area / system']),
          f('found', ['Trouvé le', 'Found on'], 'date'), f('reporter', ['Signalé par', 'Reported by']), f('assignee', ['Responsable', 'Assignee'], 'ref', { ref: 'team' }),
          f('frequency', ['Fréquence', 'Frequency'], 'select', { options: opts([['always', ['Toujours', 'Always']], ['often', ['Souvent', 'Often']], ['sometimes', ['Parfois', 'Sometimes']], ['rare', ['Rarement', 'Rarely']]]) }),
        ] },
        { label: ['Reproduction', 'Reproduction'], fields: [
          f('steps', ['Étapes pour reproduire', 'Steps to reproduce'], 'textarea', { wide: true, rows: 5 }),
          f('expected', ['Résultat attendu', 'Expected result'], 'textarea'), f('actual', ['Résultat obtenu', 'Actual result'], 'textarea'),
          f('fix', ['Correctif appliqué', 'Applied fix'], 'textarea'), TAGS, NOTES,
        ] },
      ],
    },

    playtests: {
      icon: 'gamepad', portal: false, label: ['Playtests', 'Playtests'], singular: ['Session', 'Session'],
      subtitle: (x) => [DP.util.fmtDay(x.date), x.version, x.testers ? T(`${x.testers} testeurs`, `${x.testers} testers`) : ''].filter(Boolean).join(' · '),
      ratings: ['rFun', 'rClarity', 'rDifficulty', 'rControls', 'rVisuals', 'rAudio'],
      groups: [
        { label: ['Session', 'Session'], fields: [
          f('name', ['Nom de la session', 'Session name']), f('date', ['Date', 'Date'], 'date'), f('version', ['Version / build', 'Version / build']),
          f('testers', ['Nombre de testeurs', 'Number of testers'], 'number'),
          f('format', ['Format', 'Format'], 'select', { options: opts([['inperson', ['En personne', 'In person']], ['remote', ['À distance', 'Remote']], ['stream', ['Stream / vidéo', 'Stream / video']], ['closed', ['Bêta fermée', 'Closed beta']], ['open', ['Bêta ouverte', 'Open beta']]]) }),
          f('duration', ['Durée de jeu', 'Play time']), f('goals', ['Objectifs du test', 'Test goals'], 'textarea', { wide: true }),
        ] },
        { label: ['Notes moyennes (0-10)', 'Average scores (0-10)'], fields: [
          f('rFun', ['Plaisir', 'Fun'], 'rating'), f('rClarity', ['Clarté', 'Clarity'], 'rating'), f('rDifficulty', ['Difficulté ressentie', 'Perceived difficulty'], 'rating'),
          f('rControls', ['Contrôles', 'Controls'], 'rating'), f('rVisuals', ['Visuels', 'Visuals'], 'rating'), f('rAudio', ['Audio', 'Audio'], 'rating'),
        ] },
        { label: ['Retours', 'Feedback'], fields: [
          f('positives', ['Points positifs', 'Positives'], 'textarea', { wide: true }), f('negatives', ['Points négatifs / frustrations', 'Negatives / frustrations'], 'textarea', { wide: true }),
          f('quotes', ['Citations des joueurs', 'Player quotes'], 'textarea'), f('bugsFound', ['Bugs trouvés', 'Bugs found'], 'textarea'),
          f('actions', ['Actions à faire (une par ligne)', 'Action items (one per line)'], 'textarea', { wide: true }), TAGS, NOTES,
        ] },
      ],
    },

    team: {
      icon: 'user', portal: true, label: ['Équipe & crédits', 'Team & credits'], singular: ['Membre', 'Member'],
      subtitle: (x) => [x.role, optLabel('team', 'dept', x.dept)].filter(Boolean).join(' · '),
      groups: [
        { label: ['Membre', 'Member'], fields: [
          f('name', ['Nom / pseudo', 'Name / handle']), f('role', ['Rôle', 'Role'], 'text', { placeholder: ['ex. Programmeur gameplay', 'e.g. Gameplay programmer'] }),
          f('dept', ['Département', 'Department'], 'select', { options: opts([
            ['direction', ['Direction', 'Direction']], ['design', ['Game design', 'Game design']], ['prog', ['Programmation', 'Programming']],
            ['art', ['Art', 'Art']], ['audio', ['Audio', 'Audio']], ['writing', ['Écriture', 'Writing']], ['prod', ['Production', 'Production']],
            ['qa', ['Tests / QA', 'QA']], ['marketing', ['Marketing / communauté', 'Marketing / community']], ['thanks', ['Remerciements', 'Special thanks']], ['other', ['Autre', 'Other']]]) }),
          f('joined', ['Arrivée', 'Joined'], 'date'), f('contact', ['Contact (courriel, Discord…)', 'Contact (email, Discord…)'], 'text', { priv: true }),
          f('link', ['Lien public (portfolio, réseau)', 'Public link (portfolio, social)']),
        ] },
        { label: ['Profil', 'Profile'], fields: [
          f('bio', ['Présentation', 'Bio'], 'textarea', { wide: true }), f('skills', ['Compétences', 'Skills'], 'tags'),
          f('availability', ['Disponibilité', 'Availability'], 'text', { priv: true }), NOTES,
        ] },
      ],
    },
  };

  S.ENTITY_ORDER = ['characters', 'vehicles', 'locations', 'items', 'factions', 'quests', 'dialogues', 'lore', 'tracks', 'assets', 'bugs', 'playtests', 'team'];
  S.PORTAL_TYPES = S.ENTITY_ORDER.filter((t) => S.ENTITIES[t].portal);
  S.fields = (type) => S.ENTITIES[type].groups.flatMap((g) => g.fields);
  S.field = (type, key) => S.fields(type).find((x) => x.key === key);

  function optLabel(type, key, v) {
    if (!v) return '';
    const fd = S.field(type, key);
    const o = fd && fd.options && fd.options.find((x) => x.v === v);
    return o ? L(o.l) : v;
  }
  function S_chapter(id) { return id && DP.store ? DP.store.chapterLabel(id) : ''; }
  S.optLabel = optLabel;

  /* ---------- Couleurs d'accent ---------- */
  S.ACCENTS = {
    violet: ['#8b5cf6', ['Violet', 'Violet']], red: ['#ef4444', ['Rouge', 'Red']], orange: ['#f97316', ['Orange', 'Orange']],
    amber: ['#f59e0b', ['Ambre', 'Amber']], green: ['#22c55e', ['Vert', 'Green']], pink: ['#ec4899', ['Rose', 'Pink']], white: ['#d4d4d8', ['Argent', 'Silver']],
  };
})();
