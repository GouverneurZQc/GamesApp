/* GameForge Studio — schémas : sections du GDD, fiches (personnages, véhicules, etc.), catégories */
(function () {
  const S = (GF.schemas = {});

  /* ---------- Sections du Game Design Document ---------- */
  S.GDD = [
    { key: 'concept', title: ['Concept & pitch', 'Concept & pitch'],
      guide: ['Quel est le jeu en une phrase ? Quel fantasme vit le joueur ? Genre, références (« X rencontre Y »), ce qui le rend unique.',
        'What is the game in one sentence? What fantasy does the player live? Genre, references ("X meets Y"), what makes it unique.'] },
    { key: 'pillars', title: ['Vision & piliers de design', 'Vision & design pillars'],
      guide: ['3 à 5 piliers qui guident chaque décision. Émotions visées. Ce que le jeu N\'EST PAS.',
        '3 to 5 pillars guiding every decision. Target emotions. What the game is NOT.'] },
    { key: 'audience', title: ['Public cible & plateformes', 'Audience & platforms'],
      guide: ['Pour qui ? Âge, type de joueurs, jeux similaires qu\'ils aiment. Plateformes, classement (PEGI/ESRB), langue.',
        'Who is it for? Age, player types, similar games they enjoy. Platforms, rating (PEGI/ESRB), languages.'] },
    { key: 'loop', title: ['Boucle de gameplay', 'Gameplay loop'],
      guide: ['Boucle de 30 secondes, de 5 minutes, d\'une session. Que fait le joueur minute par minute ? Pourquoi revient-il ?',
        '30-second loop, 5-minute loop, session loop. What does the player do minute by minute? Why do they come back?'] },
    { key: 'mechanics', title: ['Mécaniques & systèmes', 'Mechanics & systems'],
      guide: ['Mécaniques principales et secondaires, règles, ressources, combat/conduite/craft, IA des ennemis, physique.',
        'Core and secondary mechanics, rules, resources, combat/driving/crafting, enemy AI, physics.'] },
    { key: 'controls', title: ['Contrôles & game feel', 'Controls & game feel'],
      guide: ['Schéma de contrôle (clavier/souris, manette, tactile). Sensations recherchées, caméra, feedback (FX, son, vibrations).',
        'Control scheme (keyboard/mouse, gamepad, touch). Target feel, camera, feedback (VFX, audio, rumble).'] },
    { key: 'progression', title: ['Progression & récompenses', 'Progression & rewards'],
      guide: ['Courbe de difficulté, déblocages, niveaux d\'expérience, économie du jeu, récompenses et rythme.',
        'Difficulty curve, unlocks, XP levels, in-game economy, rewards and pacing.'] },
    { key: 'world', title: ['Univers & niveaux', 'World & levels'],
      guide: ['Structure du monde (linéaire, hub, monde ouvert), liste des niveaux/zones, objectifs, durée, secrets.',
        'World structure (linear, hub, open world), list of levels/zones, objectives, length, secrets.'] },
    { key: 'narrative', title: ['Narration', 'Narrative'],
      guide: ['Comment l\'histoire est racontée (cinématiques, dialogues, environnement). Détails dans le module Histoire.',
        'How the story is told (cutscenes, dialogue, environment). Details live in the Story module.'] },
    { key: 'art', title: ['Direction artistique', 'Art direction'],
      guide: ['Résumé du style visuel. Détails complets dans le module Direction artistique.',
        'Visual style summary. Full details in the Art direction module.'] },
    { key: 'audio', title: ['Son & musique', 'Audio & music'],
      guide: ['Style musical, musique adaptative, bruitages clés, doublage, ambiance sonore.',
        'Music style, adaptive music, key sound effects, voice acting, soundscape.'] },
    { key: 'ui', title: ['Interface & UX', 'UI & UX'],
      guide: ['HUD, menus, onboarding/tutoriel, accessibilité (daltonisme, sous-titres, remapping), flux d\'écrans.',
        'HUD, menus, onboarding/tutorial, accessibility (colorblind, subtitles, remapping), screen flow.'] },
    { key: 'tech', title: ['Technique & moteur', 'Tech & engine'],
      guide: ['Moteur (Unity, Unreal, Godot…), langages, outils, performances cibles, sauvegarde, réseau/multijoueur.',
        'Engine (Unity, Unreal, Godot…), languages, tools, target performance, save system, networking/multiplayer.'] },
    { key: 'business', title: ['Modèle économique', 'Business model'],
      guide: ['Prix, premium/F2P, DLC, monétisation éthique, budget, sources de financement.',
        'Price, premium/F2P, DLC, ethical monetization, budget, funding sources.'] },
    { key: 'marketing', title: ['Marketing & communauté', 'Marketing & community'],
      guide: ['Positionnement, page Steam, trailer, réseaux sociaux, festivals, influenceurs, communauté Discord.',
        'Positioning, Steam page, trailer, social media, festivals, creators, Discord community.'] },
    { key: 'production', title: ['Production & planning', 'Production & schedule'],
      guide: ['Équipe, jalons (prototype, vertical slice, alpha, bêta, sortie), scope réaliste, priorités (MoSCoW).',
        'Team, milestones (prototype, vertical slice, alpha, beta, launch), realistic scope, priorities (MoSCoW).'] },
    { key: 'risks', title: ['Risques & questions ouvertes', 'Risks & open questions'],
      guide: ['Ce qui peut faire échouer le projet, hypothèses à valider par prototype, questions non résolues.',
        'What could sink the project, assumptions to validate by prototyping, unresolved questions.'] },
  ];
  S.gddDef = (key) => S.GDD.find((d) => d.key === key);

  /* ---------- Catégories & statuts d'idées ---------- */
  S.IDEA_CATS = [
    ['gameplay', ['Gameplay', 'Gameplay']],
    ['story', ['Histoire', 'Story']],
    ['character', ['Personnage', 'Character']],
    ['vehicle', ['Véhicule', 'Vehicle']],
    ['level', ['Niveau / monde', 'Level / world']],
    ['art', ['Art / visuel', 'Art / visuals']],
    ['audio', ['Audio', 'Audio']],
    ['ui', ['UI / UX', 'UI / UX']],
    ['tech', ['Technique', 'Tech']],
    ['business', ['Business / marketing', 'Business / marketing']],
    ['other', ['Autre', 'Other']],
  ];
  S.IDEA_STATUS = [
    ['new', ['Nouvelle', 'New'], '#8b5cf6'],
    ['explore', ['À explorer', 'To explore'], '#22d3ee'],
    ['keep', ['Retenue', 'Kept'], '#22c55e'],
    ['done', ['Intégrée', 'Integrated'], '#64748b'],
    ['rejected', ['Rejetée', 'Rejected'], '#ef4444'],
  ];

  /* ---------- Fiches (entités) ---------- */
  const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
  const opts = (list) => list.map(([v, l]) => ({ v, l }));

  S.ENTITIES = {
    characters: {
      key: 'characters', icon: 'users',
      label: ['Personnages', 'Characters'], singular: ['Personnage', 'Character'],
      imageKind: 'character concept art, full body, clean neutral background, game character design sheet',
      subtitle: (x) => [roleLabel(x.role), x.age ? T(`${x.age} ans`, `age ${x.age}`) : '', x.occupation].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name'], 'text', { required: true, placeholder: ['Nom complet', 'Full name'] }),
          f('alias', ['Surnom / alias', 'Nickname / alias']),
          f('age', ['Âge', 'Age'], 'text', { placeholder: ['ex. 27, ~40, immortel', 'e.g. 27, ~40, immortal'] }),
          f('gender', ['Genre', 'Gender']),
          f('species', ['Espèce / race', 'Species / race']),
          f('role', ['Rôle', 'Role'], 'select', { options: opts([
            ['protagonist', ['Protagoniste', 'Protagonist']], ['antagonist', ['Antagoniste', 'Antagonist']],
            ['ally', ['Allié', 'Ally']], ['companion', ['Compagnon', 'Companion']], ['mentor', ['Mentor', 'Mentor']],
            ['rival', ['Rival', 'Rival']], ['boss', ['Boss', 'Boss']], ['npc', ['PNJ', 'NPC']],
            ['merchant', ['Marchand', 'Merchant']], ['other', ['Autre', 'Other']]]) }),
          f('importance', ['Importance', 'Importance'], 'select', { options: opts([
            ['main', ['Principal', 'Main']], ['secondary', ['Secondaire', 'Secondary']], ['minor', ['Mineur', 'Minor']]]) }),
          f('occupation', ['Métier / classe', 'Occupation / class']),
          f('faction', ['Faction', 'Faction'], 'ref', { ref: 'factions' }),
          f('origin', ['Origine', 'Origin'], 'ref', { ref: 'locations' }),
          f('status', ['Statut', 'Status'], 'select', { options: opts([
            ['alive', ['Vivant', 'Alive']], ['dead', ['Mort', 'Dead']], ['missing', ['Disparu', 'Missing']], ['unknown', ['Inconnu', 'Unknown']]]) }),
        ] },
        { label: ['Apparition dans le jeu', 'Appearance in the game'], fields: [
          f('firstChapter', ['Arrive au chapitre', 'First appears in chapter'], 'chapter'),
          f('firstAppearance', ['Quand / comment il arrive', 'When / how they appear'], 'textarea', { placeholder: ['ex. Niveau 3, sauve le héros lors de la poursuite…', 'e.g. Level 3, saves the hero during the chase…'] }),
          f('arc', ['Arc narratif / évolution', 'Story arc / evolution'], 'textarea'),
          f('fate', ['Destin / sortie', 'Fate / exit'], 'textarea'),
        ] },
        { label: ['Apparence', 'Looks'], fields: [
          f('height', ['Taille', 'Height']),
          f('build', ['Carrure / poids', 'Build / weight']),
          f('appearance', ['Description physique', 'Physical description'], 'textarea', { wide: true }),
          f('outfit', ['Tenue / équipement visible', 'Outfit / visible gear'], 'textarea'),
          f('distinctive', ['Signes distinctifs', 'Distinctive features'], 'textarea'),
          f('colors', ['Couleurs dominantes', 'Signature colors']),
        ] },
        { label: ['Personnalité', 'Personality'], fields: [
          f('personality', ['Personnalité', 'Personality'], 'textarea', { wide: true }),
          f('traits', ['Traits (mots-clés)', 'Traits (keywords)'], 'tags'),
          f('strengths', ['Forces', 'Strengths'], 'textarea'),
          f('weaknesses', ['Faiblesses / peurs', 'Weaknesses / fears'], 'textarea'),
          f('motivation', ['Motivations / objectifs', 'Motivations / goals'], 'textarea'),
          f('secret', ['Secret', 'Secret'], 'textarea'),
          f('quotes', ['Répliques / citations', 'Lines / quotes'], 'textarea'),
        ] },
        { label: ['Histoire & relations', 'Backstory & relationships'], fields: [
          f('backstory', ['Passé / biographie', 'Backstory / biography'], 'textarea', { wide: true, rows: 6 }),
          f('relations', ['Relations', 'Relationships'], 'relations', { ref: 'characters', wide: true }),
        ] },
        { label: ['Gameplay', 'Gameplay'], fields: [
          f('playable', ['Jouable ?', 'Playable?'], 'select', { options: opts([['yes', ['Oui', 'Yes']], ['no', ['Non', 'No']], ['partial', ['Partiellement', 'Partially']]]) }),
          f('abilities', ['Compétences / pouvoirs', 'Skills / powers'], 'textarea'),
          f('weapons', ['Armes / équipement de jeu', 'Weapons / gameplay gear'], 'textarea'),
          f('behavior', ['Comportement (IA, combat)', 'Behavior (AI, combat)'], 'textarea'),
          f('stats', ['Statistiques', 'Stats'], 'kv', { wide: true, placeholderK: ['PV', 'HP'], placeholderV: ['100', '100'] }),
          f('vehicles', ['Véhicules', 'Vehicles'], 'refs', { ref: 'vehicles' }),
        ] },
        { label: ['Production', 'Production'], fields: [
          f('voice', ['Voix / doubleur', 'Voice / actor']),
          f('music', ['Thème musical', 'Music theme']),
          f('references', ['Inspirations / références', 'Inspirations / references'], 'textarea'),
          f('tags', ['Tags', 'Tags'], 'tags'),
          f('notes', ['Notes', 'Notes'], 'textarea', { wide: true }),
        ] },
      ],
    },

    vehicles: {
      key: 'vehicles', icon: 'car',
      label: ['Véhicules', 'Vehicles'], singular: ['Véhicule', 'Vehicle'],
      imageKind: 'vehicle concept art, three-quarter front view, studio lighting, clean background, game vehicle design',
      subtitle: (x) => [x.manufacturer, x.model, x.year, x.vclass ? T(`Classe ${x.vclass}`, `Class ${x.vclass}`) : ''].filter(Boolean).join(' · '),
      ratings: ['rSpeed', 'rAccel', 'rHandling', 'rBraking', 'rDurability', 'rOffroad'],
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name'], 'text', { required: true }),
          f('manufacturer', ['Constructeur / marque', 'Manufacturer / brand']),
          f('model', ['Modèle', 'Model']),
          f('year', ['Année', 'Year']),
          f('category', ['Catégorie', 'Category'], 'select', { options: opts([
            ['sports', ['Sportive', 'Sports car']], ['super', ['Supercar / hypercar', 'Supercar / hypercar']], ['muscle', ['Muscle car', 'Muscle car']],
            ['tuner', ['Tuner / JDM', 'Tuner / JDM']], ['sedan', ['Berline', 'Sedan']], ['classic', ['Classique / rétro', 'Classic / retro']],
            ['suv', ['SUV', 'SUV']], ['offroad', ['Tout-terrain', 'Off-road']], ['rally', ['Rallye', 'Rally']], ['formula', ['Monoplace', 'Open-wheel']],
            ['truck', ['Camion / pick-up', 'Truck / pickup']], ['van', ['Fourgon', 'Van']], ['police', ['Police / urgence', 'Police / emergency']],
            ['military', ['Militaire', 'Military']], ['moto', ['Moto', 'Motorcycle']], ['scifi', ['Futuriste / sci-fi', 'Futuristic / sci-fi']],
            ['hover', ['Aéroglisseur / hover', 'Hover vehicle']], ['aircraft', ['Avion', 'Aircraft']], ['heli', ['Hélicoptère', 'Helicopter']],
            ['boat', ['Bateau', 'Boat']], ['other', ['Autre', 'Other']]]) }),
          f('vclass', ['Classe / tier', 'Class / tier'], 'select', { options: opts([['D', ['D', 'D']], ['C', ['C', 'C']], ['B', ['B', 'B']], ['A', ['A', 'A']], ['S', ['S', 'S']], ['S+', ['S+', 'S+']]]) }),
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
          f('exterior', ['Design extérieur', 'Exterior design'], 'textarea'),
          f('interior', ['Intérieur / cockpit', 'Interior / cockpit'], 'textarea'),
          f('colors', ['Couleurs / livrées', 'Colors / liveries']),
          f('inspiration', ['Inspiration réelle', 'Real-world inspiration']),
        ] },
        { label: ['Fiche technique', 'Spec sheet'], fields: [
          f('topSpeed', ['Vitesse max (km/h)', 'Top speed (km/h)'], 'number'),
          f('accel', ['0-100 km/h (s)', '0-100 km/h (s)'], 'number'),
          f('power', ['Puissance (ch)', 'Power (hp)'], 'number'),
          f('torque', ['Couple (Nm)', 'Torque (Nm)'], 'number'),
          f('weight', ['Poids (kg)', 'Weight (kg)'], 'number'),
          f('engine', ['Moteur', 'Engine']),
          f('transmission', ['Transmission', 'Transmission']),
          f('drivetrain', ['Motricité', 'Drivetrain'], 'select', { options: opts([
            ['FWD', ['Traction (FWD)', 'Front-wheel (FWD)']], ['RWD', ['Propulsion (RWD)', 'Rear-wheel (RWD)']],
            ['AWD', ['Intégrale (AWD)', 'All-wheel (AWD)']], ['4x4', ['4x4', '4x4']], ['other', ['Autre', 'Other']]]) }),
        ] },
        { label: ['Notes de conduite (0-10)', 'Driving ratings (0-10)'], fields: [
          f('rSpeed', ['Vitesse', 'Speed'], 'rating'),
          f('rAccel', ['Accélération', 'Acceleration'], 'rating'),
          f('rHandling', ['Maniabilité', 'Handling'], 'rating'),
          f('rBraking', ['Freinage', 'Braking'], 'rating'),
          f('rDurability', ['Résistance', 'Durability'], 'rating'),
          f('rOffroad', ['Tout-terrain', 'Off-road'], 'rating'),
        ] },
        { label: ['Gameplay', 'Gameplay'], fields: [
          f('handlingNotes', ['Comportement de conduite', 'Driving behavior'], 'textarea'),
          f('upgrades', ['Améliorations / personnalisation', 'Upgrades / customization'], 'textarea'),
          f('gadgets', ['Armes / gadgets', 'Weapons / gadgets'], 'textarea'),
          f('sound', ['Son du moteur', 'Engine sound']),
          f('tags', ['Tags', 'Tags'], 'tags'),
          f('notes', ['Notes', 'Notes'], 'textarea', { wide: true }),
        ] },
      ],
    },

    locations: {
      key: 'locations', icon: 'pin',
      label: ['Lieux', 'Locations'], singular: ['Lieu', 'Location'],
      imageKind: 'environment concept art, wide establishing shot, atmospheric lighting, game level design',
      subtitle: (x) => [optLabel('locations', 'ltype', x.ltype), x.region].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name'], 'text', { required: true }),
          f('ltype', ['Type', 'Type'], 'select', { options: opts([
            ['city', ['Ville', 'City']], ['village', ['Village', 'Village']], ['district', ['Quartier', 'District']],
            ['building', ['Bâtiment', 'Building']], ['interior', ['Intérieur', 'Interior']], ['dungeon', ['Donjon', 'Dungeon']],
            ['forest', ['Forêt', 'Forest']], ['desert', ['Désert', 'Desert']], ['mountain', ['Montagne', 'Mountain']],
            ['coast', ['Côte / mer', 'Coast / sea']], ['track', ['Circuit / route', 'Track / road']], ['space', ['Espace', 'Space']],
            ['hub', ['Hub', 'Hub']], ['other', ['Autre', 'Other']]]) }),
          f('region', ['Région / monde', 'Region / world']),
          f('firstChapter', ['Découvert au chapitre', 'Discovered in chapter'], 'chapter'),
          f('levelRange', ['Niveau / difficulté', 'Level / difficulty']),
          f('climate', ['Climat / météo / heure', 'Climate / weather / time']),
        ] },
        { label: ['Description', 'Description'], fields: [
          f('description', ['Description', 'Description'], 'textarea', { wide: true, rows: 5 }),
          f('atmosphere', ['Ambiance / atmosphère', 'Mood / atmosphere'], 'textarea'),
          f('pois', ['Points d\'intérêt', 'Points of interest'], 'textarea'),
          f('secrets', ['Secrets / collectibles', 'Secrets / collectibles'], 'textarea'),
        ] },
        { label: ['Gameplay & habitants', 'Gameplay & inhabitants'], fields: [
          f('activities', ['Activités / missions', 'Activities / missions'], 'textarea'),
          f('dangers', ['Dangers / ennemis', 'Dangers / enemies'], 'textarea'),
          f('inhabitants', ['Personnages présents', 'Characters present'], 'refs', { ref: 'characters' }),
          f('factions', ['Factions présentes', 'Factions present'], 'refs', { ref: 'factions' }),
          f('music', ['Musique / sons', 'Music / sounds']),
          f('tags', ['Tags', 'Tags'], 'tags'),
          f('notes', ['Notes', 'Notes'], 'textarea', { wide: true }),
        ] },
      ],
    },

    items: {
      key: 'items', icon: 'box',
      label: ['Objets & armes', 'Items & weapons'], singular: ['Objet', 'Item'],
      imageKind: 'game item prop concept art, isolated on plain background, detailed, icon-ready',
      subtitle: (x) => [optLabel('items', 'itype', x.itype), optLabel('items', 'rarity', x.rarity)].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name'], 'text', { required: true }),
          f('itype', ['Type', 'Type'], 'select', { options: opts([
            ['weapon', ['Arme', 'Weapon']], ['armor', ['Armure / tenue', 'Armor / outfit']], ['consumable', ['Consommable', 'Consumable']],
            ['key', ['Objet clé', 'Key item']], ['quest', ['Objet de quête', 'Quest item']], ['collectible', ['Collectible', 'Collectible']],
            ['material', ['Matériau / ressource', 'Material / resource']], ['gadget', ['Gadget / outil', 'Gadget / tool']],
            ['currency', ['Monnaie', 'Currency']], ['part', ['Pièce de véhicule', 'Vehicle part']], ['other', ['Autre', 'Other']]]) }),
          f('rarity', ['Rareté', 'Rarity'], 'select', { options: opts([
            ['common', ['Commun', 'Common']], ['uncommon', ['Peu commun', 'Uncommon']], ['rare', ['Rare', 'Rare']],
            ['epic', ['Épique', 'Epic']], ['legendary', ['Légendaire', 'Legendary']], ['unique', ['Unique', 'Unique']]]) }),
          f('value', ['Valeur / prix', 'Value / price']),
          f('owner', ['Propriétaire', 'Owner'], 'ref', { ref: 'characters' }),
          f('location', ['Où le trouver', 'Where to find it'], 'ref', { ref: 'locations' }),
        ] },
        { label: ['Détails', 'Details'], fields: [
          f('description', ['Description', 'Description'], 'textarea', { wide: true }),
          f('effect', ['Effet / fonction', 'Effect / function'], 'textarea'),
          f('obtain', ['Comment l\'obtenir', 'How to obtain'], 'textarea'),
          f('stats', ['Statistiques', 'Stats'], 'kv', { wide: true, placeholderK: ['Dégâts', 'Damage'], placeholderV: ['25', '25'] }),
          f('lore', ['Histoire / lore', 'Lore'], 'textarea'),
          f('tags', ['Tags', 'Tags'], 'tags'),
          f('notes', ['Notes', 'Notes'], 'textarea', { wide: true }),
        ] },
      ],
    },

    factions: {
      key: 'factions', icon: 'shield',
      label: ['Factions', 'Factions'], singular: ['Faction', 'Faction'],
      imageKind: 'faction emblem and banner design, heraldry, flat vector style, centered',
      subtitle: (x) => [x.ftype].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name'], 'text', { required: true }),
          f('ftype', ['Type (gang, guilde, royaume…)', 'Type (gang, guild, kingdom…)']),
          f('leader', ['Chef', 'Leader'], 'ref', { ref: 'characters' }),
          f('members', ['Membres', 'Members'], 'refs', { ref: 'characters' }),
          f('base', ['Quartier général', 'Headquarters'], 'ref', { ref: 'locations' }),
          f('symbol', ['Symbole / couleurs', 'Symbol / colors']),
        ] },
        { label: ['Profil', 'Profile'], fields: [
          f('ideology', ['Idéologie / valeurs', 'Ideology / values'], 'textarea'),
          f('goals', ['Objectifs', 'Goals'], 'textarea'),
          f('strength', ['Puissance / ressources', 'Power / resources'], 'textarea'),
          f('allies', ['Alliés', 'Allies'], 'textarea'),
          f('enemies', ['Ennemis', 'Enemies'], 'textarea'),
          f('history', ['Histoire', 'History'], 'textarea', { wide: true }),
          f('tags', ['Tags', 'Tags'], 'tags'),
          f('notes', ['Notes', 'Notes'], 'textarea', { wide: true }),
        ] },
      ],
    },

    quests: {
      key: 'quests', icon: 'flag',
      label: ['Quêtes & missions', 'Quests & missions'], singular: ['Mission', 'Mission'],
      imageKind: 'key art illustration of a dramatic game mission scene, cinematic composition',
      subtitle: (x) => [optLabel('quests', 'qtype', x.qtype), x.duration].filter(Boolean).join(' · '),
      groups: [
        { label: ['Identité', 'Identity'], fields: [
          f('name', ['Nom', 'Name'], 'text', { required: true }),
          f('qtype', ['Type', 'Type'], 'select', { options: opts([
            ['main', ['Principale', 'Main']], ['side', ['Secondaire', 'Side']], ['race', ['Course', 'Race']],
            ['contract', ['Contrat', 'Contract']], ['challenge', ['Défi', 'Challenge']], ['boss', ['Combat de boss', 'Boss fight']],
            ['event', ['Événement', 'Event']], ['other', ['Autre', 'Other']]]) }),
          f('chapter', ['Chapitre', 'Chapter'], 'chapter'),
          f('giver', ['Donneur de quête', 'Quest giver'], 'ref', { ref: 'characters' }),
          f('location', ['Lieu', 'Location'], 'ref', { ref: 'locations' }),
          f('difficulty', ['Difficulté', 'Difficulty'], 'rating'),
          f('duration', ['Durée estimée', 'Estimated length']),
        ] },
        { label: ['Déroulement', 'Walkthrough'], fields: [
          f('summary', ['Résumé', 'Summary'], 'textarea', { wide: true }),
          f('objectives', ['Objectifs / étapes', 'Objectives / steps'], 'textarea', { wide: true, rows: 5 }),
          f('fail', ['Conditions d\'échec', 'Fail conditions'], 'textarea'),
          f('rewards', ['Récompenses', 'Rewards'], 'textarea'),
          f('dialogue', ['Moments clés / dialogues', 'Key moments / dialogue'], 'textarea', { wide: true }),
          f('characters', ['Personnages impliqués', 'Characters involved'], 'refs', { ref: 'characters' }),
          f('vehicles', ['Véhicules impliqués', 'Vehicles involved'], 'refs', { ref: 'vehicles' }),
          f('tags', ['Tags', 'Tags'], 'tags'),
          f('notes', ['Notes', 'Notes'], 'textarea', { wide: true }),
        ] },
      ],
    },
  };
  S.ENTITY_ORDER = ['characters', 'vehicles', 'locations', 'items', 'factions', 'quests'];

  S.fields = (type) => S.ENTITIES[type].groups.flatMap((g) => g.fields);
  S.field = (type, key) => S.fields(type).find((x) => x.key === key);

  function optLabel(type, key, v) {
    if (!v) return '';
    const fd = S.field(type, key);
    const o = fd && fd.options && fd.options.find((x) => x.v === v);
    return o ? L(o.l) : v;
  }
  S.optLabel = optLabel;
  function roleLabel(v) { return optLabel('characters', 'role', v); }

  /* ---------- Préréglages de styles pour les images ---------- */
  S.IMAGE_STYLES = [
    ['project', ['Style du projet', 'Project style'], ''],
    ['none', ['Aucun style imposé', 'No imposed style'], ''],
    ['concept', ['Concept art peint', 'Painted concept art'], 'digital painting concept art, painterly brushwork, professional game concept art'],
    ['realistic', ['Réaliste / AAA', 'Realistic / AAA'], 'photorealistic, AAA game render, ray-traced lighting, highly detailed'],
    ['stylized', ['Stylisé 3D (Fortnite, Overwatch)', 'Stylized 3D (Fortnite, Overwatch)'], 'stylized 3D game art, hand-painted textures, vibrant colors, appealing shapes'],
    ['cel', ['Cel-shading', 'Cel-shading'], 'cel-shaded, bold outlines, flat shading, comic-like'],
    ['anime', ['Anime / manga', 'Anime / manga'], 'anime style, clean line art, expressive, studio quality'],
    ['pixel', ['Pixel art', 'Pixel art'], 'pixel art, 16-bit, limited palette, crisp pixels, no anti-aliasing'],
    ['lowpoly', ['Low poly', 'Low poly'], 'low poly 3D, flat shaded facets, minimalist'],
    ['voxel', ['Voxel', 'Voxel'], 'voxel art, cubic 3D, isometric lighting'],
    ['iso', ['Isométrique', 'Isometric'], 'isometric view, diorama, game map art'],
    ['watercolor', ['Aquarelle', 'Watercolor'], 'watercolor illustration, soft edges, paper texture'],
    ['comic', ['Bande dessinée', 'Comic book'], 'comic book art, ink lines, halftone shading'],
    ['darkfantasy', ['Dark fantasy', 'Dark fantasy'], 'dark fantasy, gothic, moody lighting, grim atmosphere'],
    ['cyberpunk', ['Cyberpunk / néon', 'Cyberpunk / neon'], 'cyberpunk, neon lights, rain-soaked streets, high contrast'],
    ['retro', ['Rétro années 80-90', '80s-90s retro'], 'retro 90s game art, synthwave palette, VHS aesthetic'],
    ['sketch', ['Croquis / crayonné', 'Sketch / pencil'], 'pencil sketch, rough concept lines, grayscale'],
  ];
  S.IMAGE_KINDS = [
    ['free', ['Libre', 'Free-form'], ''],
    ['concept', ['Concept art', 'Concept art'], 'concept art'],
    ['character', ['Personnage', 'Character'], 'character design, full body, clean background'],
    ['vehicle', ['Véhicule', 'Vehicle'], 'vehicle design, three-quarter view, studio lighting'],
    ['environment', ['Environnement / niveau', 'Environment / level'], 'environment concept art, wide shot'],
    ['prop', ['Objet / arme', 'Prop / weapon'], 'prop design, isolated on plain background'],
    ['icon', ['Icône', 'Icon'], 'game icon, centered, simple readable silhouette, plain background'],
    ['ui', ['Maquette d\'interface (UI)', 'UI mockup'], 'game UI mockup, HUD screen, clean layout'],
    ['keyart', ['Affiche / key art', 'Key art / cover'], 'game key art, cover illustration, dramatic composition, space for logo'],
    ['storyboard', ['Storyboard', 'Storyboard'], 'storyboard panels, cinematic framing, sketchy'],
    ['sprites', ['Sprites / planche', 'Sprite sheet'], 'sprite sheet, multiple poses, consistent character, plain background'],
    ['texture', ['Texture', 'Texture'], 'seamless tileable texture, top-down, even lighting'],
  ];
  S.ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
})();
