/* DevPortals — classement du catalogue (partagé par le studio et le catalogue public) */
(function () {
  const DP = (window.DP = window.DP || {});
  DP.catalog = {
    GENRES: [
      ['action', ['Action', 'Action']], ['adventure', ['Aventure', 'Adventure']], ['rpg', ['RPG', 'RPG']],
      ['shooter', ['Tir / FPS', 'Shooter / FPS']], ['racing', ['Course', 'Racing']], ['platformer', ['Plateforme', 'Platformer']],
      ['puzzle', ['Réflexion / puzzle', 'Puzzle']], ['strategy', ['Stratégie', 'Strategy']], ['simulation', ['Simulation', 'Simulation']],
      ['management', ['Gestion', 'Management']], ['sports', ['Sport', 'Sports']], ['fighting', ['Combat', 'Fighting']],
      ['horror', ['Horreur', 'Horror']], ['survival', ['Survie', 'Survival']], ['sandbox', ['Bac à sable', 'Sandbox']],
      ['openworld', ['Monde ouvert', 'Open world']], ['stealth', ['Infiltration', 'Stealth']], ['metroidvania', ['Metroidvania', 'Metroidvania']],
      ['roguelike', ['Roguelike / lite', 'Roguelike / lite']], ['rhythm', ['Rythme / musique', 'Rhythm / music']],
      ['narrative', ['Narratif / visual novel', 'Narrative / visual novel']], ['party', ['Party game', 'Party game']],
      ['cardgame', ['Cartes / plateau', 'Cards / board']], ['educational', ['Éducatif', 'Educational']],
    ],
    STYLES: [
      ['pixel', ['Pixel art', 'Pixel art']], ['lowpoly', ['Low poly', 'Low poly']], ['realistic', ['Réaliste', 'Realistic']],
      ['stylized', ['3D stylisée', 'Stylized 3D']], ['cartoon', ['Cartoon', 'Cartoon']], ['anime', ['Anime / manga', 'Anime / manga']],
      ['handdrawn', ['Dessiné à la main', 'Hand-drawn']], ['painterly', ['Peinture', 'Painterly']], ['voxel', ['Voxel', 'Voxel']],
      ['retro', ['Rétro / PS1', 'Retro / PS1']], ['minimalist', ['Minimaliste', 'Minimalist']], ['neon', ['Néon / cyberpunk', 'Neon / cyberpunk']],
      ['dark', ['Sombre / gothique', 'Dark / gothic']], ['cozy', ['Mignon / cozy', 'Cute / cozy']], ['isometric', ['Isométrique', 'Isometric']],
      ['2d', ['2D', '2D']], ['3d', ['3D', '3D']], ['firstperson', ['Vue à la 1re personne', 'First person']], ['thirdperson', ['Vue à la 3e personne', 'Third person']],
      ['topdown', ['Vue de dessus', 'Top-down']],
    ],
    MODES: [
      ['solo', ['Solo', 'Single player']], ['coop-local', ['Coop locale', 'Local co-op']], ['coop-online', ['Coop en ligne', 'Online co-op']],
      ['pvp', ['JcJ / versus', 'PvP / versus']], ['mmo', ['Massivement multijoueur', 'Massively multiplayer']],
    ],
    PLATFORMS: [
      ['pc', ['PC', 'PC']], ['mac', ['Mac', 'Mac']], ['linux', ['Linux', 'Linux']], ['playstation', ['PlayStation', 'PlayStation']],
      ['xbox', ['Xbox', 'Xbox']], ['switch', ['Switch', 'Switch']], ['mobile', ['Mobile', 'Mobile']], ['web', ['Navigateur', 'Browser']], ['vr', ['Réalité virtuelle', 'VR']],
    ],
    STAGES: [['concept', ['Concept', 'Concept']], ['prototype', ['Prototype', 'Prototype']], ['vslice', ['Vertical slice', 'Vertical slice']],
      ['alpha', ['Alpha', 'Alpha']], ['beta', ['Bêta', 'Beta']], ['early', ['Accès anticipé', 'Early access']], ['release', ['Sorti', 'Released']]],
    /** Libellé d'une clé dans une liste, dans la langue demandée */
    label(list, key, lang) {
      const it = list.find((x) => x[0] === key);
      return it ? it[1][lang === 'en' ? 1 : 0] : key;
    },
  };
})();
