'use strict';
// Les 20 robes du mage. Chaque robe a sa silhouette, sa palette et son motif de tissu.
const L = require('./lib');
const { sym, poly, P, flip, both, at, hem, bodySegs, A, arms, sleeve, cuff, leg, legs, SKIN, hairBack, neck, head,
  star4, moon, flame, leaf, diamond, gear, sun, feather, furLine, qPts, N, folds, belt, dstr, f } = L;

const S1 = (d, color, w, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="1" stroke-width="${w}" ${extra}/>`;
const C = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;

module.exports = [
  {
    id: 'archimage-celeste', nom: "Robe d'Archimage Céleste", theme: 'Astres et constellations', bg: '#dfe4f5',
    couleurs: [['Bleu nuit', '#1b2a6b'], ['Indigo profond', '#111a45'], ['Or stellaire', '#e8b93c'], ['Étoile pâle', '#f6e7a8']],
    silhouette: 'Longue robe évasée jusqu’au sol, ourlet droit galonné d’or.',
    manches: 'Immenses manches de sorcier tombant sous les genoux.',
    details: 'Mantelet doré festonné, fermoir en croissant de lune, ceinture à pan.',
    coiffe: 'Grand chapeau pointu à la pointe recourbée.',
    motif: { type: 'stars', nom: 'Semis d’étoiles', c: { b: '#1b2a6b', m: '#e8b93c', n: '#f6e7a8' } },
    vroid: 'Une-pièce longue + manches larges ; chapeau en accessoire.',
    draw(K) {
      const c = { b: '#1b2a6b', d: '#111a45', t: '#e8b93c', a: '#f6e7a8' };
      const fab = K.pat('stars', this.motif.c), d = sym(bodySegs({ hemW: 60, hemY: 428 }));
      return [hairBack(), arms(), neck(),
        P(d, fab), K.shade(d), folds(178, 428, 60), K.trim(d, c.t, 7, 404),
        both(sleeve('wizard', fab, { edge: c.t, lining: c.d })),
        belt(178, 21, 7, c.t), P(poly([[146, 181], [154, 181], [157, 250], [150, 259], [143, 250]]), c.t),
        P(sym([['M', 150, 90], ['L', 140, 91], ['Q', 112, 96, 106, 116], ...hem(106, 150, 116, 'scallop', 3, 7, 1, 134)]), c.t),
        C(150, 119, 8.5, c.b), at(P(moon(5.5), c.a, N), 150, 119, -20),
        head(),
        `<ellipse cx="150" cy="41" rx="42" ry="9" fill="${c.d}"/>`,
        P('M124 40 Q134 6 146 -26 Q160 -40 176 -24 Q164 -26 160 -16 Q170 14 176 40 Q150 48 124 40 Z', fab),
        P('M125.5 33 Q150 43 174.5 33 L176 40 Q150 49 124 40 Z', c.t), at(P(star4(8), c.a), 151, 10)].join('');
    },
  },
  {
    id: 'pyromancien', nom: 'Robe du Pyromancien', theme: 'Feu et braises', bg: '#2a2026',
    couleurs: [['Écarlate', '#c81e1e'], ['Orange braise', '#ff8a1f'], ['Jaune flamme', '#ffd23f'], ['Noir charbon', '#1c1416']],
    silhouette: 'Tunique mi-mollet fendue devant, ourlet découpé en langues de feu.',
    manches: 'Sans manches : bras nus, bandages noirs et brassards.',
    details: 'Épaulières en pointes, col flamme, dégradé qui s’embrase vers le bas.',
    coiffe: 'Diadème fin orné d’une flamme.',
    motif: { type: 'flames', nom: 'Flammèches', c: { b: '#c81e1e', m: '#ff8a1f', n: '#ffd23f' } },
    vroid: 'Haut sans manches + jupe longue fendue + pantalon moulant noir.',
    draw(K) {
      const c = { b: '#c81e1e', d: '#7a0f12', t: '#ff8a1f', a: '#ffd23f', k: '#1c1416' };
      const fab = K.pat('flames', this.motif.c), d = sym(bodySegs({ hemW: 48, hemY: 366, hemStyle: 'flame', hemN: 4, hemAmp: 26 }));
      const heat = K.grad([[0, c.t, 0], [0.55, c.t, 0], [0.85, c.t, 0.9], [1, c.a, 1]]);
      const lg = legs({ fill: c.k, boot: '#3a2a2e', bootTop: 384, sole: c.t });
      return [hairBack(), lg, arms({ glove: c.k, gloveFrom: 0.45 }), neck(),
        P(d, fab), P(d, heat, N), K.shade(d),
        `<g clip-path="${K.clip(`<path d="${d}"/>`)}"><g clip-path="${K.clip(`<path d="${poly([[150, 198], [133, 420], [167, 420]])}"/>`)}">` +
        `<rect x="100" y="190" width="100" height="240" fill="${c.d}" stroke="none"/>${lg}</g></g>`,
        S1('M150 198 L134.5 400 M150 198 L165.5 400', c.a, 1.6),
        belt(178, 21, 8, c.k), at(P(diamond(6, 7), c.t), 150, 178),
        at(P(flame(12), c.a), 150, 137), at(P(flame(6.5), c.t, N), 150, 141),
        both(P(poly([[126, 108], [118, 95], [98, 80], [106, 98], [84, 100], [104, 110], [96, 126], [116, 119]]), c.t) +
          P(poly([[122, 108], [116, 100], [106, 94], [110, 104], [100, 106], [112, 110]]), c.a, N)),
        both(P(poly([[141, 95], [127, 70], [137, 80], [139, 61], [147, 84], [150, 97]]), c.t)),
        both(cuff(c.t, 0.4, 0.46, 9.5)),
        head(), S1('M132 47 Q150 40 168 47', c.a, 2.6), at(P(flame(7), c.t), 150, 39)].join('');
    },
  },
  {
    id: 'cryomancien', nom: 'Robe du Cryomancien', theme: 'Glace et givre', bg: '#24405a',
    couleurs: [['Bleu glacier', '#bfe9f7'], ['Bleu banquise', '#7fb9d6'], ['Blanc neige', '#ffffff'], ['Argent givré', '#8fa3b8']],
    silhouette: 'Manteau long et droit, ourlet taillé en cristaux.',
    manches: 'Manches ajustées terminées par des poignets de fourrure.',
    details: 'Gros col de fourrure blanche, pèlerine pointue, fermoirs losanges.',
    coiffe: 'Tiare de trois cristaux de glace.',
    motif: { type: 'snow', nom: 'Flocons', c: { b: '#bfe9f7', m: '#ffffff', n: '#7fb9d6' } },
    vroid: 'Manteau long cintré + col fourrure (texture) ; bottes claires.',
    draw(K) {
      const c = { b: '#bfe9f7', d: '#7fb9d6', t: '#ffffff', a: '#8fa3b8' };
      const fab = K.pat('snow', this.motif.c), d = sym(bodySegs({ hemW: 44, hemY: 410, hemStyle: 'zigzag', hemN: 3, hemAmp: 17, flare: 0.3 }));
      return [hairBack(), legs({ fill: '#e9f4fa', boot: c.a, bootTop: 404 }), arms({ glove: c.t, gloveFrom: 0.9 }), neck(),
        P(d, fab), K.shade(d), folds(178, 410, 44, 2), K.trim(d, c.t, 5, 384),
        S1('M150 140 V404', c.a, 1.6), [205, 255, 305, 355].map(y => at(P(diamond(5, 8), c.a), 150, y)).join(''),
        both(sleeve('fitted', fab)), both(furLine([A(0.93, 9), A(0.95, 3), A(0.95, -3), A(0.93, -9)], 6.5, c.t)),
        belt(178, 21, 5, c.a),
        P(sym([['M', 150, 91], ['L', 140, 92], ['Q', 108, 98, 102, 122], ...hem(102, 150, 122, 'zigzag', 2, 15, 1, 142)]), '#e6f6fc',
          `stroke="${c.a}" stroke-opacity="1" stroke-width="1.6"`),
        furLine(qPts([112, 103], [150, 130], [188, 103], 11), 9, c.t),
        head(), S1('M132 47 Q150 40 168 47', c.a, 2.4),
        at(P(diamond(4.5, 12), '#e1f7ff'), 150, 35), at(P(diamond(3.5, 8), '#e1f7ff'), 140, 40, -14), at(P(diamond(3.5, 8), '#e1f7ff'), 160, 40, 14)].join('');
    },
  },
  {
    id: 'druide-sylvestre', nom: 'Robe du Druide Sylvestre', theme: 'Forêt ancienne', bg: '#e9efd9',
    couleurs: [['Vert forêt', '#2f6b3a'], ['Vert feuille', '#9bc45a'], ['Brun écorce', '#7b5231'], ['Chanvre', '#c9a66b']],
    silhouette: 'Tunique aux genoux à ourlet en feuilles, sur une sous-robe brune effilochée.',
    manches: 'Manches cloche doublées de brun.',
    details: 'Mantelet de feuilles, ceinture de corde nouée, agrafe-feuille.',
    coiffe: 'Capuche relevée surmontée de bois de cerf.',
    motif: { type: 'leaves', nom: 'Feuillage', c: { b: '#2f6b3a', m: '#9bc45a', n: '#1f4a28' } },
    vroid: 'Tunique mi-longue + jupe longue dessous ; capuche et bois en accessoires.',
    draw(K) {
      const c = { b: '#2f6b3a', d: '#1f4a28', t: '#7b5231', a: '#9bc45a', r: '#c9a66b' };
      const fab = K.pat('leaves', this.motif.c);
      const u = sym(bodySegs({ hemW: 42, hemY: 402, hemStyle: 'ragged', hemN: 5, hemAmp: 11, seed: 4 }));
      const d = sym(bodySegs({ hemW: 52, hemY: 336, hemStyle: 'leaf', hemN: 4, hemAmp: 20 }));
      return [P(sym([['M', 150, 24], ['C', 116, 24, 108, 66, 114, 104], ['L', 150, 110]]), c.d),
        legs({ fill: c.t, boot: '#4a3220', bootTop: 408 }), arms(), neck(),
        P(u, c.t), K.shade(u), P(d, fab), K.shade(d), folds(178, 336, 52, 2),
        both(sleeve('bell', fab, { lining: c.t })),
        S1('M129 176 Q150 185 171 176', c.r, 4.5), S1('M141 181 Q136 216 142 250 M147 182 Q151 222 146 264', c.r, 3),
        C(142, 252, 3.6, c.r), C(146, 266, 3.6, c.r),
        P(sym([['M', 150, 92], ['L', 140, 93], ['Q', 112, 98, 106, 112], ...hem(106, 150, 112, 'leaf', 3, 13, 1, 126)]), c.a),
        at(P(leaf(8), c.b), 150, 116),
        head(),
        both(P(dstr([['M', 150, 26], ['C', 124, 26, 119, 60, 125, 97], ['L', 134, 99], ['C', 128, 66, 132, 42, 150, 39]]) + ' Z', c.b)),
        both(S1('M138 29 Q128 12 118 2 M131 18 Q122 15 113 19 M126 10 Q128 0 124 -8', c.t, 4))].join('');
    },
  },
  {
    id: 'necromancien', nom: 'Robe du Nécromancien', theme: 'Tombes et esprits', bg: '#cdd6c6',
    couleurs: [['Noir tombe', '#17151c'], ['Gris linceul', '#2a2733'], ['Vert spectral', '#7dff5a'], ['Os', '#d9d6c5']],
    silhouette: 'Robe très longue et étroite, en lambeaux, doublée d’une cape déchirée.',
    manches: 'Manches de sorcier à doublure verte luisante.',
    details: 'Cage thoracique peinte sur le buste, boucle en crâne, liseré spectral.',
    coiffe: 'Capuche profonde, regard vert dans l’ombre.',
    motif: { type: 'runes', nom: 'Runes funèbres', c: { b: '#17151c', m: '#35472f', n: '#2a3626' } },
    vroid: 'Une-pièce longue étroite + cape ; bords « déchirés » peints en transparence.',
    draw(K) {
      const c = { b: '#17151c', d: '#0a090d', t: '#7dff5a', a: '#d9d6c5' }, pale = '#d8cfc4';
      const fab = K.pat('runes', this.motif.c), d = sym(bodySegs({ hemW: 40, hemY: 430, hemStyle: 'ragged', hemN: 6, hemAmp: 16, seed: 7, flare: 0.3 }));
      return [P(sym([['M', 150, 96], ['L', 118, 100], ['C', 98, 200, 88, 330, 78, 418], ...hem(78, 150, 418, 'ragged', 6, 18, 3)]), '#2a2733'),
        P(sym([['M', 150, 22], ['C', 112, 22, 106, 70, 112, 106], ['L', 150, 112]]), c.d),
        arms({ skin: pale }), neck(pale),
        P(d, fab), K.shade(d), K.trim(d, c.t, 2, 396),
        both(sleeve('wizard', fab, { lining: '#2f7a22' })),
        `<g fill="none" stroke="${c.a}" stroke-opacity="1" stroke-width="2.6"><path d="M150 116 V168"/>` +
        both('<path d="M150 122 Q138 120 133 129 M150 134 Q137 132 131 142 M150 146 Q138 144 133 154 M150 158 Q140 157 136 165"/>') + '</g>',
        belt(180, 21, 6, '#3a3644'), C(150, 181, 8.5, c.a), `<rect x="146" y="186" width="8" height="6" rx="1.5" fill="${c.a}"/>`,
        C(147, 180.5, 2, c.d, N), C(153, 180.5, 2, c.d, N),
        head({ skin: pale }), `<ellipse cx="150" cy="52" rx="18" ry="15" fill="#000" opacity=".4" stroke="none"/>`,
        C(142.5, 61, 2.7, c.t, N), C(157.5, 61, 2.7, c.t, N),
        both(P(dstr([['M', 150, 24], ['C', 120, 24, 114, 62, 122, 100], ['L', 133, 100], ['C', 127, 66, 131, 40, 150, 38]]) + ' Z', c.b))].join('');
    },
  },
  {
    id: 'pretresse-solaire', nom: 'Robe de la Prêtresse Solaire', theme: 'Lumière et soleil', bg: '#3f4f7d',
    couleurs: [['Ivoire', '#f6efd9'], ['Or solaire', '#d9a520'], ['Azur', '#2e86c1'], ['Sable clair', '#ecd9a0']],
    silhouette: 'Robe longue évasée, recouverte d’un tabard doré en pointe.',
    manches: 'Manches kimono rectangulaires bordées d’or.',
    details: 'Large pectoral doré, emblème du soleil, ceinture azur.',
    coiffe: 'Halo rayonnant derrière la tête et diadème à gemme.',
    motif: { type: 'rays', nom: 'Petits soleils', c: { b: '#f6efd9', m: '#ecd9a0', n: '#f0e2b8' } },
    vroid: 'Une-pièce longue blanche + tabard (couche par-dessus) ; halo en accessoire.',
    draw(K) {
      const c = { b: '#f6efd9', t: '#d9a520', a: '#2e86c1' };
      const fab = K.pat('rays', this.motif.c), d = sym(bodySegs({ hemW: 56, hemY: 428 }));
      return [C(150, 52, 40, '#f8e08a', 'opacity=".3" stroke="none"'), S1('M184 52 A34 34 0 1 0 116 52 A34 34 0 1 0 184 52', c.t, 4),
        at(S1(sun(27, 12), c.t, 3.2), 150, 52),
        hairBack(), arms(), neck(),
        P(d, fab), K.shade(d), folds(178, 428, 56), K.trim(d, c.t, 6, 408),
        both(sleeve('kimono', fab, { edge: c.t })),
        P(poly([[137, 112], [163, 112], [165, 356], [150, 378], [135, 356]]), c.t),
        S1(poly([[141, 150], [159, 150], [161, 352], [150, 367], [139, 352]]), '#fff3c4', 1.5),
        at(C(0, 0, 8, c.b) + S1(sun(8, 8), c.b, 2.4), 150, 232), at(P(diamond(5, 8), c.a), 150, 316),
        belt(178, 23, 6, c.a),
        P(sym([['M', 150, 90], ['L', 140, 91], ['Q', 110, 96, 104, 112], ['Q', 128, 146, 150, 148]]), c.t),
        S1(sym([['M', 150, 99], ['L', 139, 99], ['Q', 121, 104, 118, 113], ['Q', 134, 133, 150, 135]]), c.a, 2.6),
        [120, 135, 150, 165, 180].map((x, i) => C(x, [124, 139, 147, 139, 124][i], 2.6, c.b)).join(''),
        head(), S1('M131 47 Q150 38 169 47', c.t, 3), C(150, 41, 4.2, c.a)].join('');
    },
  },
  {
    id: 'electromancien', nom: 'Veste-robe de l’Électromancien', theme: 'Foudre et orage', bg: '#2b2f3a',
    couleurs: [['Jaune foudre', '#ffd21f'], ['Anthracite', '#2d3038'], ['Cyan arc', '#4fe3ff'], ['Ocre électrique', '#d4a300']],
    silhouette: 'Veste courte à ourlet en zigzag, pan asymétrique sur une seule hanche, pantalon anthracite.',
    manches: 'Manches courtes au coude, longs gants isolants.',
    details: 'Grand éclair en travers du buste, col montant, ceinture à sacoches.',
    coiffe: 'Lunettes de protection relevées sur le front.',
    motif: { type: 'bolts', nom: 'Éclairs', c: { b: '#ffd21f', m: '#2d3038', n: '#d4a300' } },
    vroid: 'Veste courte + pantalon + gants longs ; pan latéral peint sur une jupe courte.',
    draw(K) {
      const c = { b: '#ffd21f', d: '#d4a300', t: '#2d3038', a: '#4fe3ff' };
      const fab = K.pat('bolts', this.motif.c), d = sym(bodySegs({ hemW: 36, hemY: 284, hemStyle: 'zigzag', hemN: 3, hemAmp: 14, flare: 0.6 }));
      return [hairBack(), legs({ fill: c.t, boot: '#17181d', bootTop: 356, sole: c.b }), both(S1('M139 204 L140 354', c.b, 2.4)),
        arms({ glove: c.t, gloveFrom: 0.5 }), neck(),
        P(poly([[166, 176], [190, 292], [186, 378], [172, 306], [158, 282]]), c.b, `stroke="${c.t}" stroke-opacity="1" stroke-width="2"`),
        P(d, c.b), K.shade(d), K.trim(d, c.t, 3, 262),
        P(poly([[161, 106], [139, 152], [152, 152], [136, 202], [169, 140], [155, 140], [167, 106]]), c.t, `stroke="${c.a}" stroke-opacity="1" stroke-width="1.6"`),
        both(sleeve('short', fab) + cuff(c.t, 0.36, 0.43, 14) + cuff(c.a, 0.5, 0.54, 9.2)),
        both(P(poly([[141, 96], [130, 71], [142, 80], [150, 98]]), c.t)),
        belt(180, 21, 9, c.t), both(`<rect x="124" y="183" width="11" height="15" rx="2" fill="#4a4e59"/>`),
        `<rect x="145.5" y="175.5" width="9" height="9" rx="1.5" fill="${c.a}"/>`,
        head(), S1('M131 45 Q150 37 169 45', c.t, 5),
        both(C(141, 42.5, 6.5, c.a, `stroke="${c.t}" stroke-opacity="1" stroke-width="2.6"`))].join('');
    },
  },
  {
    id: 'mage-des-marees', nom: 'Robe du Mage des Marées', theme: 'Océan et récifs', bg: '#f1e4cb',
    couleurs: [['Sarcelle', '#0f8f8f'], ['Lagon', '#47c4bd'], ['Corail', '#ff7f66'], ['Nacre', '#f4ead7']],
    silhouette: 'Fourreau sirène : moulant jusqu’aux genoux puis évasé en nageoire festonnée.',
    manches: 'Manches cloche couleur lagon, doublure corail.',
    details: 'Col coquillage nacré, ceinture de perles de corail, liseré corail.',
    coiffe: 'Couronne de branches de corail.',
    motif: { type: 'scales', nom: 'Écailles', c: { b: '#0f8f8f', m: '#47c4bd', n: '#f4ead7' } },
    vroid: 'Une-pièce longue moulante, bas élargi ; texture écailles sur la jupe.',
    draw(K) {
      const c = { b: '#0f8f8f', t: '#ff7f66', a: '#f4ead7', l: '#47c4bd' };
      const fab = K.pat('scales', this.motif.c);
      const d = sym(bodySegs({ hemW: 62, hemY: 418, kneeW: 21, kneeY: 328, hemStyle: 'scallop', hemN: 4, hemAmp: 8 }));
      const fin = sym([['M', 150, 334], ['L', 128, 334], ['Q', 114, 384, 72, 428], ...hem(72, 150, 428, 'scallop', 5, 6)]);
      return [hairBack(), arms(), neck(), P(fin, c.l), K.shade(fin),
        P(d, fab), K.shade(d), K.trim(d, c.t, 4, 392),
        both(sleeve('bell', c.l, { lining: c.t })),
        furLine(qPts([130, 177], [150, 187], [170, 177], 9), 3.4, c.t),
        P(sym([['M', 150, 90], ['L', 140, 91], ['Q', 112, 95, 108, 108], ...hem(108, 150, 108, 'scallop', 3, 8, 1, 132)]), c.a),
        `<g fill="none" stroke="#cdb991" stroke-opacity="1" stroke-width="1.3"><path d="M150 96 V146"/>` + both('<path d="M150 96 L114 114 M150 96 L126 128 M150 96 L139 140"/>') + '</g>',
        C(150, 98, 4.5, c.t),
        head(), S1('M150 39 V15 M150 27 L143 18 M150 23 L157 14', c.t, 3.6),
        both(S1('M139 37 Q135 24 129 15 M136 27 Q141 21 141 13 M133 21 Q127 21 123 25', c.t, 3.4))].join('');
    },
  },
  {
    id: 'illusionniste', nom: 'Robe de l’Illusionniste', theme: 'Mirages et carnaval', bg: '#241736',
    couleurs: [['Magenta', '#d81b8c'], ['Cyan', '#19c3e6'], ['Or grelot', '#ffcf33'], ['Blanc fraise', '#ffffff']],
    silhouette: 'Tunique mi-partie, une moitié magenta et l’autre cyan, grandes pointes à grelots.',
    manches: 'Manches bouffantes aux couleurs inversées, poignets blancs.',
    details: 'Fraise blanche dentelée, pompons dorés, collants dépareillés.',
    coiffe: 'Bonnet de bouffon à deux cornes et loup noir.',
    motif: { type: 'diamonds', nom: 'Losanges arlequin', c: { b: '#d81b8c', m: '#a8136c', n: '#ffcf33' } },
    vroid: 'Tunique courte bicolore (texture coupée au milieu) + collants de deux couleurs.',
    draw(K) {
      const c = { b: '#d81b8c', s: '#19c3e6', t: '#ffcf33', a: '#ffffff', k: '#1d1030' };
      const fa = K.pat('diamonds', this.motif.c), fb = K.pat('diamonds', { b: c.s, m: '#0f93b0', n: c.t });
      const d = sym(bodySegs({ hemW: 52, hemY: 316, hemStyle: 'zigzag', hemN: 3, hemAmp: 34, flare: 0.6 }));
      return [hairBack(), leg({ fill: c.s, boot: c.b, bootTop: 416 }) + flip(leg({ fill: c.b, boot: c.s, bootTop: 416 })),
        arms({ glove: c.a, gloveFrom: 0.86 }), neck(),
        P(d, fa), `<g clip-path="${K.clip('<rect x="150" y="0" width="150" height="500"/>')}">${P(d, fb)}</g>`, K.shade(d),
        both([106.7, 124, 141.3].map(x => C(x, 352, 4.2, c.t)).join('')),
        [126, 150, 174].map(y => C(150, y, 5, c.t)).join(''),
        sleeve('fitted', c.s) + sleeve('puff', c.s, { r: 20 }) + flip(sleeve('fitted', c.b) + sleeve('puff', c.b, { r: 20 })),
        both(cuff(c.a, 0.88, 0.98, 10.5)),
        P(sym([['M', 150, 88], ['L', 140, 89], ['Q', 120, 92, 114, 100], ...hem(114, 150, 100, 'zigzag', 4, 8, 1, 108)]), c.a),
        head(),
        P(sym([['M', 150, 55], ['Q', 136, 51, 130, 58], ['Q', 134, 69, 144, 68], ['Q', 148, 66, 150, 63]]), c.k),
        C(142.5, 61, 2.1, '#fff', N), C(157.5, 61, 2.1, '#fff', N),
        P('M150 46 Q138 40 130 50 Q122 32 98 20 Q124 4 150 24 Z', c.b) + flip(P('M150 46 Q138 40 130 50 Q122 32 98 20 Q124 4 150 24 Z', c.s)),
        both(C(98, 20, 4.6, c.t)), S1('M130 50 Q150 40 170 50', c.t, 4)].join('');
    },
  },
  {
    id: 'chronomancien', nom: 'Redingote du Chronomancien', theme: 'Temps et rouages', bg: '#e8e0cf',
    couleurs: [['Cuivre', '#9c5226'], ['Crème', '#f1e3c6'], ['Laiton', '#d4a53a'], ['Cuir sombre', '#4a2d1b']],
    silhouette: 'Redingote structurée ouverte sur un gilet crème, tombant aux chevilles.',
    manches: 'Manches bouffantes resserrées par de larges revers crème.',
    details: 'Grand rouage de laiton dans le dos, revers sombres, montre à gousset.',
    coiffe: 'Petit haut-de-forme à lunettes et monocle.',
    motif: { type: 'gears', nom: 'Engrenages', c: { b: '#9c5226', m: '#b86c3c', n: '#6e3515' } },
    vroid: 'Manteau long ouvert + chemise/gilet dessous ; rouage dorsal en accessoire.',
    draw(K) {
      const c = { b: '#9c5226', d: '#6e3515', t: '#f1e3c6', a: '#d4a53a', k: '#4a2d1b' };
      const fab = K.pat('gears', this.motif.c), d = sym(bodySegs({ hemW: 46, hemY: 394, flare: 0.35 }));
      return [at(P(gear(40, 12, 10), c.a) + C(0, 0, 29, '#b98a2c') + C(0, 0, 10, c.d), 150, 116),
        hairBack(), legs({ fill: c.k, boot: '#2f1c12', bootTop: 400 }), arms({ glove: c.k, gloveFrom: 0.93 }), neck(),
        P(d, fab), K.shade(d), K.trim(d, c.d, 4, 374),
        P(poly([[150, 146], [142, 180], [133, 394], [167, 394], [158, 180]]), c.t), S1('M150 150 V394', '#cdbb96', 1.2),
        [170, 195, 220, 245].map(y => C(150, y, 2.7, c.a)).join(''),
        both(P(poly([[141, 94], [126, 112], [136, 140], [150, 150], [150, 112]]), c.d)),
        P(poly([[143, 94], [157, 94], [154, 112], [150, 123], [146, 112]]), c.t),
        both(C(131.5, 160, 3, c.a) + C(131, 200, 3, c.a)),
        belt(180, 21, 7, c.k), `<rect x="145" y="175.5" width="10" height="9" rx="1.5" fill="${c.a}"/>`,
        S1('M158 184 Q168 206 177 194', c.a, 1.8), C(178, 200, 6.5, c.a), C(178, 200, 4, c.t, N),
        both(sleeve('bishop', fab) + cuff(c.t, 0.86, 1.02, 11) + C(f(A(0.94, 6)[0]), f(A(0.94, 6)[1]), 1.8, c.a, N)),
        head(), `<ellipse cx="150" cy="38" rx="27" ry="5.5" fill="${c.d}"/>`, P('M134 37 L136 8 Q150 4 164 8 L166 37 Z', c.b),
        P('M134.6 27 L165.4 27 L166 35 L134 35 Z', c.t), both(C(143, 31, 5, '#9fd9d0', `stroke="${c.a}" stroke-opacity="1" stroke-width="2.2"`)),
        C(157.5, 61, 6.2, 'rgba(255,255,255,.3)', `stroke="${c.a}" stroke-opacity="1" stroke-width="1.8"`), S1('M163 64 Q170 78 164 96', c.a, 1.2)].join('');
    },
  },
  {
    id: 'geomancien', nom: 'Robe du Géomancien', theme: 'Roche et cristaux', bg: '#e6d8ba',
    couleurs: [['Gris pierre', '#8a8d93'], ['Ardoise', '#4e5159'], ['Améthyste', '#9b59d0'], ['Quartz lilas', '#c9b3ee']],
    silhouette: 'Tunique lourde et droite aux mollets, bande centrale d’ardoise.',
    manches: 'Manches courtes larges, gantelets de pierre.',
    details: 'Épaulières de roc d’où jaillissent des cristaux, large ceinture à gemme.',
    coiffe: 'Bandeau hérissé de trois éclats de cristal.',
    motif: { type: 'hex', nom: 'Dallage hexagonal', c: { b: '#8a8d93', m: '#6f727a', n: '#c9b3ee' } },
    vroid: 'Tunique droite mi-longue + épaulières rocheuses en accessoire.',
    draw(K) {
      const c = { b: '#8a8d93', d: '#4e5159', t: '#9b59d0', a: '#c9b3ee' };
      const fab = K.pat('hex', this.motif.c), d = sym(bodySegs({ hemW: 42, hemY: 388, flare: 0.3 }));
      return [hairBack(), legs({ fill: '#6b6e75', boot: c.d, bootTop: 386 }), arms({ glove: c.d, gloveFrom: 0.55 }), neck(),
        P(d, fab), K.shade(d), K.trim(d, c.d, 7, 370),
        P(poly([[143, 100], [157, 100], [160, 388], [140, 388]]), c.d),
        [215, 262, 309, 356].map(y => at(P(diamond(5, 9), c.t), 150, y)).join(''),
        both(sleeve('short', fab)),
        both(P(poly([[97, 84], [89, 50], [104, 80]]), c.t) + P(poly([[106, 82], [110, 58], [116, 86]]), c.a) + P(poly([[88, 92], [74, 70], [93, 86]]), c.a) +
          P(poly([[127, 106], [116, 86], [96, 80], [79, 94], [83, 117], [102, 127], [123, 121]]), '#9da0a6') +
          S1('M116 86 L104 102 L83 117 M104 102 L123 121 M96 80 L104 102', c.d, 1.2)),
        belt(180, 22, 13, c.d), at(P(poly([[0, -9], [8, -4.5], [8, 4.5], [0, 9], [-8, 4.5], [-8, -4.5]]), c.t) + P(poly([[0, -9], [8, -4.5], [0, 0], [-8, -4.5]]), c.a, N), 150, 180),
        head(), S1('M131 47 Q150 39 169 47', c.d, 4),
        at(P(diamond(4, 12), c.t), 150, 35), at(P(diamond(3.2, 8), c.a), 140, 40, -16), at(P(diamond(3.2, 8), c.a), 160, 40, 16)].join('');
    },
  },
  {
    id: 'voile-lune', nom: 'Robe Voile-de-Lune', theme: 'Lune et songes', bg: '#1c2140',
    couleurs: [['Lavande', '#b9a7e8'], ['Glycine', '#8f7bc9'], ['Argent lunaire', '#e6e9f2'], ['Lueur pâle', '#fff7c2']],
    silhouette: 'Robe empire à taille haute, fluide jusqu’au sol, ourlet ondulé.',
    manches: 'Épaules nues ; longs voiles transparents accrochés aux bras.',
    details: 'Cape de voile translucide, pendentif croissant, bracelets d’argent.',
    coiffe: 'Diadème en croissant de lune, voile sur les cheveux.',
    motif: { type: 'crescents', nom: 'Croissants', c: { b: '#b9a7e8', m: '#e6e9f2', n: '#8f7bc9' } },
    vroid: 'Une-pièce taille haute sans manches ; voiles peints avec transparence.',
    draw(K) {
      const c = { b: '#b9a7e8', d: '#8f7bc9', t: '#e6e9f2', a: '#fff7c2' };
      const fab = K.pat('crescents', this.motif.c);
      const d = sym(bodySegs({ chY: 126, waW: 19, waY: 150, hemW: 50, hemY: 430, hemStyle: 'wave', hemN: 4, hemAmp: 4, flare: 0.25 }));
      return [P(sym([['M', 150, 26], ['C', 112, 28, 104, 80, 100, 120], ['C', 86, 240, 76, 340, 68, 424], ...hem(68, 150, 424, 'wave', 4, 5)]), c.t, 'opacity=".32"'),
        hairBack(), arms(), neck(),
        P(d, fab), K.shade(d), folds(150, 430, 50, 3), K.trim(d, c.t, 4, 412),
        P(poly([[143, 93.5], [157, 93.5], [150, 117]]), SKIN),
        belt(150, 20, 7, c.t), S1('M142 95 Q150 122 158 95', c.t, 1.4), at(P(moon(7), c.a), 150, 125, -90),
        both(P(poly([A(0.18, 9), A(0.5, 9), [56, 338], [104, 264], A(0.3, -9)]), '#ffffff', 'opacity=".5"') + cuff(c.t, 0.2, 0.26, 9.6) + cuff(c.t, 0.9, 0.95, 7.2)),
        head(), S1('M131 47 Q150 40 169 47', c.t, 2.2), at(P(moon(10), c.t), 150, 31, -90), at(P(star4(4), c.a, N), 150, 26)].join('');
    },
  },
  {
    id: 'mage-du-desert', nom: 'Tenue du Mage du Désert', theme: 'Dunes et caravanes', bg: '#f7eedb',
    couleurs: [['Safran', '#f59a12'], ['Indigo', '#2b2f8f'], ['Miel', '#ffb84a'], ['Lin clair', '#fff1d0']],
    silhouette: 'Tunique croisée à ourlet en biais, sur un sarouel indigo bouffant.',
    manches: 'Manches ballon serrées par des poignets indigo.',
    details: 'Large ceinture-écharpe nouée sur la hanche, deux pans qui pendent, babouches.',
    coiffe: 'Turban indigo à gemme, pan retombant sur l’épaule.',
    motif: { type: 'stripes', nom: 'Rayures de caravane', c: { b: '#f59a12', m: '#ffb84a', n: '#2b2f8f' } },
    vroid: 'Tunique asymétrique + pantalon large ; turban en coiffure ou accessoire.',
    draw(K) {
      const c = { b: '#f59a12', t: '#2b2f8f', a: '#fff1d0' };
      const fab = K.pat('stripes', this.motif.c);
      const d = dstr([['M', 150, 93], ['L', 141, 93], ['L', 116, 101], ['L', 125, 130], ['Q', 129, 155, 130, 178], ['C', 122, 220, 112, 265, 106, 298],
        ['L', 198, 348], ['C', 192, 280, 178, 220, 170, 178], ['Q', 171, 155, 175, 130], ['L', 184, 101], ['L', 159, 93]]) + ' Z';
      return [hairBack(),
        both(P(dstr([['M', 150, 200], ['L', 132, 200], ['C', 102, 270, 110, 362, 132, 404], ['L', 149, 404]]) + ' Z', c.t) +
          `<rect x="130" y="400" width="19.5" height="9" rx="2" fill="${c.b}"/>` +
          P(dstr([['M', 134, 409], ['L', 148.5, 409], ['L', 149.5, 432], ['Q', 138, 440, 124, 436], ['Q', 114, 433, 117, 424], ['Q', 124, 430, 132, 424]]) + ' Z', c.b)),
        arms(), neck(),
        P(d, fab), K.shade(d), S1('M106 298 L198 348', c.t, 7), S1('M158 95 Q141 140 131 174', c.t, 4),
        both(sleeve('bishop', fab) + cuff(c.t, 0.86, 1.02, 10)),
        belt(180, 22, 20, c.t), S1('M129 176 H171 M129 184 H171', '#4a4fc0', 1.4),
        P(poly([[124, 186], [133, 188], [137, 270], [129, 283], [120, 270]]), c.t), P(poly([[116, 186], [124, 186], [121, 250], [113, 259], [108, 246]]), '#3d42b0'),
        S1('M121 262 L136 262', c.b, 3), C(127, 182, 7.5, c.t),
        head({ bangs: false }),
        P(poly([[131, 48], [124, 52], [115, 100], [127, 106]]), c.t),
        P(dstr([['M', 128, 53], ['C', 121, 24, 140, 13, 150, 13], ['C', 164, 13, 181, 24, 172, 53], ['Q', 150, 41, 128, 53]]) + ' Z', c.t),
        S1('M130 44 Q150 26 171 41 M134 31 Q152 21 168 30', '#4a4fc0', 1.6), at(P(diamond(5, 7), c.b), 150, 35)].join('');
    },
  },
  {
    id: 'alchimiste', nom: 'Blouse de l’Alchimiste', theme: 'Laboratoire et potions', bg: '#e9e3d2',
    couleurs: [['Olive', '#7a8427'], ['Cuir', '#6b4226'], ['Moutarde', '#d9b23c'], ['Vert bouteille', '#565e17']],
    silhouette: 'Blouse-manteau à carreaux descendant aux mollets, sous un tablier de cuir.',
    manches: 'Manches retroussées au coude, gants de cuir.',
    details: 'Bandoulière garnie de fioles, poches du tablier, foulard moutarde.',
    coiffe: 'Chignon piqué de deux baguettes et lunettes rondes.',
    motif: { type: 'plaid', nom: 'Carreaux', c: { b: '#7a8427', m: '#565e17', n: '#d9b23c' } },
    vroid: 'Robe-chemise mi-longue + tablier (couche) ; fioles et lunettes en accessoires.',
    draw(K) {
      const c = { b: '#7a8427', d: '#565e17', t: '#6b4226', a: '#d9b23c', k: '#3d2a1c' };
      const fab = K.pat('plaid', this.motif.c), d = sym(bodySegs({ hemW: 46, hemY: 380, flare: 0.4 }));
      const vial = col => `<rect x="-3" y="-8" width="6" height="15" rx="2.6" fill="${col}"/><rect x="-2.6" y="-11.5" width="5.2" height="4.5" fill="#c9a66b"/>`;
      const ap = dstr([['M', 131, 176], ['L', 169, 176], ['L', 180, 328], ['Q', 150, 343, 120, 328]]) + ' Z';
      return [C(150, 27, 10, L.HAIR), S1('M141 14 L158 34 M160 13 L144 33', c.a, 2), hairBack(),
        legs({ fill: c.k, boot: c.t, bootTop: 392 }), arms({ glove: c.t, gloveFrom: 0.5 }), neck(),
        P(d, fab), K.shade(d), K.trim(d, c.d, 4, 362),
        both(sleeve('short', fab) + cuff('#a3ad4f', 0.36, 0.44, 14)),
        S1('M138 120 L143 96 M162 120 L157 96', c.t, 3.2),
        P(poly([[137, 118], [163, 118], [166, 177], [134, 177]]), c.t), P(ap, c.t),
        S1(dstr([['M', 135, 182], ['L', 165, 182], ['L', 175, 324], ['Q', 150, 336, 125, 324]]) + ' Z', '#c79a6b', 1.1, 'stroke-dasharray="3 3"'),
        at(vial('#e2504a'), 133, 234, -6) + at(vial('#4fc3e8'), 140, 236, 6),
        both(`<rect x="126" y="238" width="19" height="25" rx="2.5" fill="#55331c"/>`),
        belt(178, 22, 7, c.k),
        S1('M121 106 L172 187', c.k, 7.5), at(vial('#6fe36a'), 137, 131, -33) + at(vial('#e2504a'), 148, 149, -33) + at(vial('#b06be8'), 159, 167, -33),
        P(sym([['M', 150, 89], ['L', 140, 90], ['Q', 124, 93, 121, 102], ['L', 150, 122]]), c.a),
        head(),
        both(C(142.5, 61, 6.6, 'rgba(255,255,255,.28)', `stroke="${c.a}" stroke-opacity="1" stroke-width="1.8"`)), S1('M149 60 H151', c.a, 1.8)].join('');
    },
  },
  {
    id: 'enchanteresse-des-roses', nom: 'Robe de l’Enchanteresse des Roses', theme: 'Roseraie enchantée', bg: '#34503c',
    couleurs: [['Rose poudré', '#f4a9c0'], ['Rose dragée', '#fbd3df'], ['Framboise', '#9b2f55'], ['Vert tige', '#5f9e54']],
    silhouette: 'Robe de bal à quatre étages de volants festonnés, très ample.',
    manches: 'Petites manches ballon, épaules dégagées, gants courts.',
    details: 'Corset framboise lacé, rose au décolleté, gros nœud dans le dos.',
    coiffe: 'Couronne de cinq roses.',
    motif: { type: 'roses', nom: 'Roses', c: { b: '#f4a9c0', m: '#9b2f55', n: '#e07fa0', g: '#5f9e54' } },
    vroid: 'Une-pièce à jupe volumineuse (volants peints par étages) + corset par-dessus.',
    draw(K) {
      const c = { b: '#f4a9c0', d: '#e07fa0', t: '#9b2f55', a: '#5f9e54', l: '#fbd3df' };
      const fab = K.pat('roses', this.motif.c);
      const tier = (top, wT, hy, w, fill) => {
        const dd = sym([['M', 150, top], ['L', 150 - wT, top], ['Q', 150 - w + 3, (top + hy) / 2, 150 - w, hy], ...hem(150 - w, 150, hy, 'scallop', 4, 5)]);
        return P(dd, fill) + K.shade(dd);
      };
      const rose = (x, y, r) => C(x, y, r, c.b) + C(x - 0.6, y - 0.6, r * 0.62, c.d, N) + C(x, y, r * 0.28, c.t, N);
      return [both(P(dstr([['M', 150, 176], ['C', 128, 146, 100, 152, 100, 176], ['C', 100, 200, 128, 202, 150, 184]]) + ' Z', c.t)),
        hairBack(), arms({ glove: '#fff5f8', gloveFrom: 0.8 }), neck(),
        P(sym([['M', 150, 93], ['L', 141, 93], ['L', 116, 101], ['L', 125, 130], ['L', 150, 134]]), SKIN),
        tier(350, 50, 422, 74, fab), tier(294, 40, 364, 62, c.l), tier(238, 30, 308, 50, fab), tier(178, 20, 252, 38, c.l),
        P(sym([['M', 150, 121], ['Q', 141, 108, 127, 114], ['L', 125, 130], ['Q', 129, 155, 130, 178], ['L', 150, 187]]), c.t),
        S1('M144 134 L156 144 M156 134 L144 144 M144 150 L156 160 M156 150 L144 160 M144 166 L156 176 M156 166 L144 176', c.l, 1.5),
        both(sleeve('puff', c.b, { r: 16 })), belt(182, 21, 5, c.b),
        both(at(P(leaf(7), c.a), 141, 121, 70)), rose(150, 119, 8),
        S1('M143.5 86 Q150 90 156.5 86', c.t, 3.2),
        head(), both(at(P(leaf(5), c.a), 136, 41, -40) + at(P(leaf(5), c.a), 145, 35, -15)),
        [[132, 45], [140.5, 38], [150, 35], [159.5, 38], [168, 45]].map(p => rose(p[0], p[1], 6)).join('')].join('');
    },
  },
  {
    id: 'arcaniste', nom: 'Robe de l’Arcaniste', theme: 'Savoir et runes', bg: '#e7def3',
    couleurs: [['Violet royal', '#5b21a6'], ['Aubergine', '#3c1273'], ['Argent', '#c9ced9'], ['Mauve arcane', '#c084fc']],
    silhouette: 'Toge d’érudit longue et droite, galon d’argent.',
    manches: 'Manches cloche bordées d’argent.',
    details: 'Étole argentée gravée de runes, pèlerine à deux pointes, grimoire à la hanche.',
    coiffe: 'Capuche rabattue, cercle d’argent, deux éclats flottants.',
    motif: { type: 'arcane', nom: 'Cercles arcaniques', c: { b: '#5b21a6', m: '#7a3fc9', n: '#c084fc' } },
    vroid: 'Une-pièce longue droite + étole et pèlerine peintes sur une couche de manteau.',
    draw(K) {
      const c = { b: '#5b21a6', d: '#3c1273', t: '#c9ced9', a: '#c084fc' };
      const fab = K.pat('arcane', this.motif.c), d = sym(bodySegs({ hemW: 48, hemY: 430, flare: 0.4 }));
      const glyph = `<path d="M-2.5 -5 V5 M-2.5 -5 L3 -1 L-2.5 2.5" fill="none" stroke="${c.b}" stroke-opacity="1" stroke-width="1.6"/>`;
      return [P(sym([['M', 150, 64], ['C', 122, 66, 110, 90, 114, 114], ['L', 150, 118]]), c.d), hairBack(), arms(), neck(),
        P(d, fab), K.shade(d), folds(178, 430, 48), K.trim(d, c.t, 5, 412),
        both(sleeve('bell', fab, { edge: c.t, lining: c.d })), belt(178, 21, 5, c.t),
        at(`<rect x="-9" y="-12" width="18" height="24" rx="2" fill="#2a1050"/><rect x="-9" y="-12" width="4.5" height="24" fill="${c.t}"/>` + P(diamond(3, 5), c.a, N), 173, 208, 8),
        S1('M168 180 L171 196', c.t, 1.6),
        P(sym([['M', 150, 91], ['L', 140, 92], ['Q', 110, 97, 104, 118], ...hem(104, 150, 118, 'zigzag', 2, 18, 1, 132)]), c.d, `stroke="${c.t}" stroke-opacity="1" stroke-width="2"`),
        both(P(poly([[139, 95], [147.5, 97], [145, 328], [138.5, 341], [132, 328]]), c.t) + [165, 205, 245, 285].map(y => at(glyph, 139.5, y)).join('')),
        at(C(0, 0, 10, c.d, `stroke="${c.t}" stroke-opacity="1" stroke-width="2"`) + S1('M0 -6 L5.6 4 L-5.6 4 Z', c.a, 1.5) + C(0, 0.6, 1.8, c.a, N), 150, 122),
        head(), S1('M131 47 Q150 39 169 47', c.t, 2.8), at(P(diamond(3.5, 5.5), c.a), 150, 41),
        both(at(P(diamond(4, 8), c.a), 113, 44, -12) + at(P(diamond(2.6, 5), c.b), 104, 62, 10))].join('');
    },
  },
  {
    id: 'sorcier-de-cour', nom: 'Justaucorps du Sorcier de Cour', theme: 'Palais et intrigues', bg: '#dccfb9',
    couleurs: [['Bordeaux', '#6b1230'], ['Or brocart', '#d4a53a'], ['Noir velours', '#15131a'], ['Dentelle', '#f5efe6']],
    silhouette: 'Justaucorps cintré à basques évasées s’arrêtant aux genoux, culotte et cuissardes.',
    manches: 'Manches bouffantes, revers dorés et dentelle au poignet.',
    details: 'Plastron de brocart boutonné, jabot, demi-cape noire sur une seule épaule.',
    coiffe: 'Chapeau à large bord et double plume.',
    motif: { type: 'damask', nom: 'Damas', c: { b: '#6b1230', m: '#8a2145', n: '#d4a53a' } },
    vroid: 'Veste longue cintrée + short/culotte + bottes hautes ; demi-cape en accessoire.',
    draw(K) {
      const c = { b: '#6b1230', t: '#d4a53a', a: '#15131a', l: '#f5efe6' };
      const fab = K.pat('damask', this.motif.c), d = sym(bodySegs({ hemW: 54, hemY: 328, flare: 0.75 }));
      return [hairBack(), legs({ fill: c.a, boot: '#0e0d12', bootTop: 300 }), both(`<rect x="132.5" y="295" width="19" height="10" rx="2" fill="${c.t}"/>`),
        arms({ glove: c.a, gloveFrom: 0.96 }), neck(),
        P(d, fab), K.shade(d), folds(178, 328, 54, 2), K.trim(d, c.t, 4, 310),
        P(poly([[143, 98], [157, 98], [161, 328], [139, 328]]), c.t), [150, 180, 210, 240, 270, 300].map(y => C(150, y, 2.7, c.a)).join(''),
        both(sleeve('bishop', fab) + cuff(c.t, 0.84, 0.98, 11) + cuff(c.l, 0.98, 1.05, 10)),
        belt(178, 21, 6, c.a), `<rect x="145" y="174" width="10" height="8" rx="1.5" fill="none" stroke="${c.t}" stroke-opacity="1" stroke-width="2"/>`,
        P(sym([['M', 150, 104], ['L', 143, 104], ['Q', 139, 117, 142, 124], ...hem(142, 150, 124, 'scallop', 2, 3)]), c.l),
        P(sym([['M', 150, 93], ['L', 141, 93], ['Q', 136, 105, 139, 111], ...hem(139, 150, 111, 'scallop', 2, 3)]), c.l),
        P(dstr([['M', 143, 93], ['L', 114, 99], ['C', 86, 150, 80, 262, 90, 352], ['L', 128, 340], ['C', 120, 262, 124, 170, 138, 116]]) + ' Z', c.a),
        S1('M138 116 C124 170 120 262 128 340', c.t, 3), S1('M139 110 Q160 124 182 105', c.t, 2.2), C(182, 105, 4.2, c.t),
        head(),
        `<ellipse cx="150" cy="41" rx="49" ry="9" fill="${c.a}" transform="rotate(-7 150 41)"/>`,
        P('M130 39 Q131 15 150 13 Q169 15 171 35 Q150 43 130 39 Z', c.a), S1('M130.5 33 Q150 40 170.5 30', c.t, 3.4),
        at(feather(50, 10, c.b), 168, 30, 38), at(feather(38, 7, c.t), 170, 31, 62)].join('');
    },
  },
  {
    id: 'sylphe-des-vents', nom: 'Robe de la Sylphe des Vents', theme: 'Vent et plumes', bg: '#2c4758',
    couleurs: [['Menthe', '#a9ecc9'], ['Vert d’eau', '#74cfa3'], ['Blanc nuage', '#ffffff'], ['Or pâle', '#ffe9a3']],
    silhouette: 'Robe courte en pétales superposés, jambes nues et sandales lacées.',
    manches: 'Sans manches ; rubans blancs enroulés autour des bras.',
    details: 'Petites ailes de plumes dans le dos, longs rubans flottants, col licou.',
    coiffe: 'Plumes derrière les oreilles et fin cercle doré.',
    motif: { type: 'swirls', nom: 'Volutes de vent', c: { b: '#a9ecc9', m: '#ffffff', n: '#74cfa3' } },
    vroid: 'Une-pièce courte sans manches (ourlet en pétales par transparence) ; ailes en accessoire.',
    draw(K) {
      const c = { b: '#a9ecc9', d: '#74cfa3', t: '#ffffff', a: '#ffe9a3' };
      const fab = K.pat('swirls', this.motif.c);
      const u = sym(bodySegs({ shW: 30, hemW: 46, hemY: 304, hemStyle: 'leaf', hemN: 3, hemAmp: 20, flare: 0.6 }));
      const d = sym(bodySegs({ shW: 30, hemW: 56, hemY: 282, hemStyle: 'leaf', hemN: 4, hemAmp: 20, flare: 0.7 }));
      return [both([-78, -52, -26].map((r, i) => at(feather(62 - i * 9, 12, i % 2 ? c.b : c.t), 120, 114, r)).join('')),
        S1('M120 112 C82 160 72 240 38 304', c.t, 6, 'opacity=".85"'), S1('M180 112 C232 172 214 252 264 322', c.t, 6, 'opacity=".85"'),
        hairBack(), legs({ fill: SKIN, boot: c.t, bootTop: 420 }),
        both(S1('M137.5 350 L149 362 M149 350 L137.5 362 M137.5 374 L149 386 M149 374 L137.5 386 M137.5 398 L149 410 M149 398 L137.5 410', c.t, 2)),
        arms(), neck(),
        P(u, c.t), P(d, fab), K.shade(d),
        both(S1(L.line([A(0.34, 8), A(0.44, -8)]) + ' ' + L.line([A(0.52, 8), A(0.62, -7)]) + ' ' + L.line([A(0.7, 7), A(0.8, -7)]), c.t, 2.6) + cuff(c.a, 0.18, 0.23, 9.6)),
        P(sym([['M', 150, 90], ['L', 141, 91], ['L', 138, 99], ['L', 150, 106]]), c.t), C(150, 100, 3, c.a),
        belt(178, 21, 6, c.t), at(feather(36, 7.5, c.t), 136, 181, 188), at(feather(27, 6, c.a), 144, 181, 174),
        head(), S1('M131 47 Q150 40 169 47', c.a, 2.2), C(150, 42, 2.6, c.b),
        both(at(feather(32, 6.5, c.t), 131, 57, -28) + at(feather(23, 5.5, c.b), 130, 61, -62))].join('');
    },
  },
  {
    id: 'prismancien', nom: 'Chasuble du Prismancien', theme: 'Lumière décomposée', bg: '#23242b',
    couleurs: [['Blanc nacré', '#f4f4f8'], ['Rouge spectre', '#ff5d73'], ['Jaune spectre', '#ffe14d'], ['Cyan spectre', '#3ecbe6'], ['Violet spectre', '#a26bff']],
    silhouette: 'Chasuble triangulaire rigide, de l’épaule au sol, ourlet en pointe centrale.',
    manches: 'Manches blanches ajustées, poignets en prisme (un cyan, un rose).',
    details: 'Empiècement blanc, emblème du prisme d’où part un faisceau arc-en-ciel.',
    coiffe: 'Éclats de verre colorés en éventail derrière la nuque et sur le front.',
    motif: { type: 'triangles', nom: 'Facettes arc-en-ciel', c: { b: '#f4f4f8', m: '#f4f4f8', rb: ['#ff5d73', '#ff9f43', '#ffe14d', '#5fe08a', '#3ecbe6', '#5b7bff', '#a26bff', '#ff7ad9'] } },
    vroid: 'Poncho / robe trapèze longue ; texture à facettes, col rigide en accessoire.',
    draw(K) {
      const c = { b: '#f4f4f8', d: '#c9cad6', rb: this.motif.c.rb };
      const fab = K.pat('triangles', this.motif.c), d = sym([['M', 150, 93], ['L', 141, 93], ['L', 116, 101], ['L', 68, 396], ['L', 150, 440]]);
      return [both([[106, 30, '#3ecbe6'], [88, 62, '#a26bff'], [124, 16, '#ffe14d']].map(q => P(poly([[139, 102], [150, 100], [q[0], q[1]]]), q[2], 'opacity=".85"')).join('')),
        hairBack(), legs({ fill: c.b, boot: c.d, bootTop: 424 }), arms({ glove: c.b, gloveFrom: 0.9 }), neck(),
        P(d, fab), K.shade(d), K.trim(d, c.b, 7, 0),
        P(sym([['M', 150, 93], ['L', 141, 93], ['L', 116, 101], ['L', 108, 152], ['L', 150, 178]]), c.b),
        c.rb.map((col, i) => S1(`M157 141 L196 ${f(118 + i * 6.4)}`, col, 3)).join(''), S1('M110 150 L143 141', c.d, 2.4),
        P(poly([[150, 120], [167, 150], [133, 150]]), c.b, 'stroke="#23242b" stroke-opacity="1" stroke-width="1.6"'),
        sleeve('fitted', c.b) + P(poly([A(0.8, 7.5), A(1.03, 21), A(1.03, -21), A(0.8, -7.5)]), '#3ecbe6') +
        flip(sleeve('fitted', c.b) + P(poly([A(0.8, 7.5), A(1.03, 21), A(1.03, -21), A(0.8, -7.5)]), '#ff7ad9')),
        both(P(poly([[141, 96], [128, 70], [139, 86], [150, 99]]), c.b)),
        head(), at(P(diamond(4.2, 14), '#3ecbe6'), 150, 29), at(P(diamond(3.6, 11), '#ff7ad9'), 139, 35, -18), at(P(diamond(3.6, 11), '#ffe14d'), 161, 35, 18)].join('');
    },
  },
  {
    id: 'chamane-des-esprits', nom: 'Poncho du Chamane des Esprits', theme: 'Totems et ancêtres', bg: '#e9dcc4',
    couleurs: [['Chocolat', '#4a2c1a'], ['Turquoise', '#1fb5a8'], ['Os', '#efe6d0'], ['Daim', '#b98a57']],
    silhouette: 'Grand poncho en pointe couvrant le buste, sur une jupe droite à franges.',
    manches: 'Bras nus sous le poncho, bracelets de perles.',
    details: 'Chevrons turquoise, franges de daim, collier de dents, bottes fourrées.',
    coiffe: 'Cornes d’os, trois plumes dressées, peinture sur les joues.',
    motif: { type: 'tribal', nom: 'Frise totémique', c: { b: '#4a2c1a', m: '#1fb5a8', n: '#efe6d0' } },
    vroid: 'Jupe longue + poncho (couche de manteau) ; cornes et plumes en accessoires.',
    draw(K) {
      const c = { b: '#4a2c1a', d: '#2f1b0f', t: '#1fb5a8', a: '#efe6d0', n: '#b98a57' };
      const fab = K.pat('tribal', this.motif.c), d = sym(bodySegs({ hemW: 44, hemY: 382, hemStyle: 'zigzag', hemN: 11, hemAmp: 14, flare: 0.4 }));
      const dp = sym([['M', 150, 90], ['L', 141, 91], ['L', 78, 176], ['L', 150, 264]]);
      const fr = Array.from({ length: 12 }, (_, i) => { const t = (i + 0.5) / 12, x = 78 + 72 * t, y = 176 + 88 * t; return `M${f(x)} ${f(y)} l-2.5 11`; }).join(' ');
      return [hairBack(), legs({ fill: SKIN, boot: c.b, bootTop: 406 }), both(furLine([[135.5, 406], [142, 405], [148.5, 406]], 5, c.a)),
        arms(), neck(), both(cuff(c.t, 0.9, 0.95, 7.6) + cuff(c.a, 0.83, 0.88, 7.6)),
        P(d, fab), K.shade(d), K.trim(d, c.n, 3, 366),
        both(S1(fr, c.n, 1.8)), P(dp, c.d),
        `<g clip-path="${K.clip(`<path d="${dp}"/>`)}">` + S1('M60 142 L150 240 L240 142', c.t, 7, 'stroke-linejoin="miter"') +
        S1('M60 122 L150 220 L240 122', c.a, 2.6, 'stroke-linejoin="miter"') + S1('M60 163 L150 261 L240 163', c.n, 3.4, 'stroke-linejoin="miter"') + '</g>',
        qPts([131, 99], [150, 130], [169, 99], 7).map(p => at(P('M-2.6 0 L2.6 0 L0 8.5 Z', c.a), p[0], p[1])).join(''),
        head(), both(S1('M134.5 66 h7 M134.5 69.6 h6', c.t, 1.7)),
        both(P(dstr([['M', 133, 45], ['C', 118, 42, 107, 28, 111, 6], ['C', 116, 24, 126, 32, 139, 36]]) + ' Z', c.a)),
        at(feather(36, 7.5, c.t), 150, 38, 0), at(feather(29, 6.5, c.a), 141, 40, -24), at(feather(29, 6.5, c.n), 159, 40, 24),
        S1('M131 47 Q150 39 169 47', c.n, 4.4), [138, 150, 162].map((x, i) => C(x, [43.6, 42.4, 43.6][i], 1.9, c.t, N)).join('')].join('');
    },
  },
];
