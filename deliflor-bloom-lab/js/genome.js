/* =========================================================================
   DELIFLOR BLOOM LAB — Genoma de la flor
   Fuente única de verdad. Todo lo demás (3D, ramo, pasaporte, QR, prompt
   de IA, indicadores) son funciones puras de este objeto.
   ========================================================================= */
(function (root) {
  'use strict';

  /* ---------------------------------------------------------------
     Paleta del catálogo Deliflor Américas 2024
     El índice es parte del formato del QR: NO reordenar ni insertar.
     --------------------------------------------------------------- */
  var PALETTE = [
    { id: 'white',    es: 'Blanco',        en: 'White',        hex: '#FBF8F4' },
    { id: 'ivory',    es: 'Marfil',        en: 'Ivory',        hex: '#F3E9D6' },
    { id: 'cream',    es: 'Crema',         en: 'Cream',        hex: '#F6DFAF' },
    { id: 'yellow',   es: 'Amarillo',      en: 'Yellow',       hex: '#EFBB2C' },
    { id: 'lime',     es: 'Verde lima',    en: 'Lime green',   hex: '#C3D24B' },
    { id: 'green',    es: 'Verde intenso', en: 'Deep green',   hex: '#7E9B4E' },
    { id: 'softpink', es: 'Rosa suave',    en: 'Soft pink',    hex: '#F2C2D2' },
    { id: 'pink',     es: 'Rosa fuerte',   en: 'Strong pink',  hex: '#E0709F' },
    { id: 'magenta',  es: 'Magenta',       en: 'Magenta',      hex: '#9C3071' },
    { id: 'fuchsia',  es: 'Fucsia',        en: 'Fuchsia',      hex: '#C21F7B' },
    { id: 'lilac',    es: 'Lila',          en: 'Lilac',        hex: '#C3A7D8' },
    { id: 'purple',   es: 'Morado',        en: 'Purple',       hex: '#7A3E96' },
    { id: 'wine',     es: 'Vino',          en: 'Wine',         hex: '#7C214D' },
    { id: 'red',      es: 'Rojo',          en: 'Red',          hex: '#B4271F' },
    { id: 'salmon',   es: 'Salmón',        en: 'Salmon',       hex: '#F09877' },
    { id: 'coral',    es: 'Coral',         en: 'Coral',        hex: '#E4674C' },
    { id: 'bronze',   es: 'Bronce',        en: 'Bronze',       hex: '#B5703A' },
    { id: 'orange',   es: 'Naranja',       en: 'Orange',       hex: '#E08A26' },
    { id: 'earth',    es: 'Tierra',        en: 'Earth',        hex: '#8C6B52' }
  ];

  /* Listas ordenadas — el índice viaja en el QR. No reordenar. */
  var MODES        = ['natural', 'experimental', 'fantastic'];
  var FAMILIES     = ['ballhia','decorative','margriet','spoon','spider','anemone','single','semidouble','double','surprise'];
  var SHAPES       = ['circular','spherical','semispherical','flat','concave','convex','star','organic','compact','expanded'];
  var PETAL_SHAPES = ['rounded','oval','long','tubular','spoon','curly','pointed','wavy','spiral','irregular'];
  var EDGES        = ['smooth','wavy','toothed','curled','faded','sharp'];
  var ARRANGEMENTS = ['radial','layered','spiral','compact','open','asym'];
  var PATTERNS     = ['solid','gradientCenter','gradientTips','contrastCenter','contrastTips','bicolor','striped','mottled','speckled','edged','watercolor','iridescent'];
  var GROWTH       = ['disbud','spraySmall','sprayFull','cluster','cascade'];
  var DIAMETERS    = ['mini','small','medium','large','xlarge'];
  var STEMS        = ['short','medium','long'];
  var FOLIAGE      = ['light','medium','abundant','compact','wild'];
  var BQ_STYLES    = ['mono','round','asymmetric','wild','minimal','sculptural','celebration','gift','runway'];
  var BQ_ABUNDANCE = ['small','medium','abundant','monumental'];
  var BQ_EXTRAS    = ['none','lightFoliage','fullFoliage','neutralFlowers','dried','textures'];
  var BQ_WRAP      = ['none','whitePaper','naturalPaper','deliflorPaper','textile','vase'];
  var BQ_BG        = ['studio','greenhouse','floralEvent','elegantTable','natural','deliflor','artistic'];
  var PERSONALITY  = ['elegant','joyful','romantic','powerful','delicate','exotic','modern','serene','mysterious','natural','bold','sophisticated','tropical','minimal','festive'];

  /* Rango real de diámetro en cm, para el pasaporte */
  var DIAMETER_CM = { mini: '3–5', small: '5–8', medium: '8–11', large: '11–14', xlarge: '14–18' };

  /* ---------------------------------------------------------------
     Genoma base — Ballhia blanca tipo 'Superbowl'
     --------------------------------------------------------------- */
  function base() {
    return {
      mode: 'natural',
      family: 'ballhia',
      shape: 'spherical',
      openness: 0.28,
      symmetry: 0.94,
      volume: 0.72,
      centerSize: 0.06,
      petalShape: 'rounded',
      petalLength: 0.52,
      petalWidth: 0.55,
      petalCurve: 0.34,
      petalTwist: 0.06,
      petalEdge: 'smooth',
      arrangement: 'spiral',
      density: 0.9,
      layers: 11,
      colors: { primary: 0, secondary: 1, center: 4, tip: 0, reverse: 1 },
      pattern: 'solid',
      diameter: 'large',
      growth: 'disbud',
      flowersPerStem: 1,
      stemLength: 'long',
      foliage: 'medium',
      personality: [],
      bouquet: { style: 'round', abundance: 'medium', extras: 'lightFoliage', wrap: 'naturalPaper', bg: 'studio' },
      name: '',
      seed: 1
    };
  }

  /* ---------------------------------------------------------------
     Presets por familia. Al elegir familia el visitante ya recibe una
     flor terminada y armónica: las pantallas siguientes son refinamiento.
     --------------------------------------------------------------- */
  var PRESETS = {
    ballhia: {
      shape: 'spherical', openness: 0.24, volume: 0.78, centerSize: 0.05,
      petalShape: 'rounded', petalLength: 0.52, petalWidth: 0.62, petalCurve: 0.18,
      petalTwist: 0.05, petalEdge: 'smooth', arrangement: 'spiral',
      density: 0.98, layers: 13, diameter: 'large', growth: 'disbud'
    },
    decorative: {
      shape: 'semispherical', openness: 0.46, volume: 0.66, centerSize: 0.08,
      petalShape: 'oval', petalLength: 0.6, petalWidth: 0.5, petalCurve: 0.4,
      petalTwist: 0.08, petalEdge: 'smooth', arrangement: 'layered',
      density: 0.82, layers: 9, diameter: 'large', growth: 'disbud'
    },
    margriet: {
      shape: 'flat', openness: 0.95, volume: 0.2, centerSize: 0.4,
      petalShape: 'oval', petalLength: 0.66, petalWidth: 0.4, petalCurve: 0.52,
      petalTwist: 0.02, petalEdge: 'smooth', arrangement: 'radial',
      density: 0.38, layers: 2, diameter: 'small', growth: 'sprayFull'
    },
    spoon: {
      shape: 'convex', openness: 0.8, volume: 0.34, centerSize: 0.3,
      petalShape: 'spoon', petalLength: 0.78, petalWidth: 0.3, petalCurve: 0.58,
      petalTwist: 0.12, petalEdge: 'smooth', arrangement: 'radial',
      density: 0.5, layers: 3, diameter: 'medium', growth: 'spraySmall'
    },
    spider: {
      shape: 'expanded', openness: 0.74, volume: 0.42, centerSize: 0.12,
      petalShape: 'tubular', petalLength: 0.97, petalWidth: 0.22, petalCurve: 0.86,
      petalTwist: 0.30, petalEdge: 'curled', arrangement: 'spiral',
      density: 0.5, layers: 5, diameter: 'xlarge', growth: 'disbud'
    },
    anemone: {
      shape: 'circular', openness: 0.9, volume: 0.26, centerSize: 0.52,
      petalShape: 'rounded', petalLength: 0.58, petalWidth: 0.46, petalCurve: 0.5,
      petalTwist: 0.03, petalEdge: 'smooth', arrangement: 'radial',
      density: 0.42, layers: 2, diameter: 'medium', growth: 'spraySmall'
    },
    single: {
      shape: 'flat', openness: 1.0, volume: 0.16, centerSize: 0.42,
      petalShape: 'oval', petalLength: 0.7, petalWidth: 0.38, petalCurve: 0.5,
      petalTwist: 0.0, petalEdge: 'smooth', arrangement: 'radial',
      density: 0.3, layers: 1, diameter: 'small', growth: 'sprayFull'
    },
    semidouble: {
      shape: 'concave', openness: 0.88, volume: 0.3, centerSize: 0.28,
      petalShape: 'oval', petalLength: 0.64, petalWidth: 0.42, petalCurve: 0.48,
      petalTwist: 0.04, petalEdge: 'wavy', arrangement: 'layered',
      density: 0.5, layers: 3, diameter: 'medium', growth: 'sprayFull'
    },
    double: {
      shape: 'semispherical', openness: 0.56, volume: 0.6, centerSize: 0.1,
      petalShape: 'oval', petalLength: 0.58, petalWidth: 0.48, petalCurve: 0.42,
      petalTwist: 0.07, petalEdge: 'smooth', arrangement: 'spiral',
      density: 0.8, layers: 8, diameter: 'medium', growth: 'spraySmall'
    },
    surprise: null  /* se resuelve con randomize() */
  };

  /* ---------------------------------------------------------------
     Aleatoriedad con semilla — reproducible desde el QR
     --------------------------------------------------------------- */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }
  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length) % arr.length]; }

  /* ---------------------------------------------------------------
     Armonías de color por modo creativo
     --------------------------------------------------------------- */
  var HARMONIES = [
    /* [principal, secundario, centro, punta, reverso] por índice de paleta */
    [0, 1, 4, 0, 1],    /* blanco puro       */
    [3, 2, 5, 2, 3],    /* amarillo cálido   */
    [8, 7, 4, 6, 12],   /* magenta Deliflor  */
    [12, 8, 4, 7, 12],  /* vino profundo     */
    [7, 6, 4, 0, 8],    /* rosa fresco       */
    [11, 10, 4, 10, 12],/* morado noble      */
    [13, 15, 3, 14, 12],/* rojo intenso      */
    [16, 17, 4, 2, 18], /* bronce otoñal     */
    [15, 14, 4, 2, 16], /* coral cálido      */
    [4, 5, 3, 1, 5],    /* lima botánico     */
    [10, 6, 4, 0, 11],  /* lila suave        */
    [17, 3, 5, 2, 16]   /* naranja luminoso  */
  ];

  function randomize(g, seedIn) {
    var seed = seedIn || Math.floor(Math.random() * 65535) + 1;
    var rand = rng(seed);
    var mode = g.mode || 'natural';
    var out = clone(g);
    out.seed = seed;

    var fam = pick(rand, FAMILIES.slice(0, 9));
    out.family = fam;
    applyPreset(out, fam);

    /* Variación dentro de rangos creíbles para el modo elegido */
    var span = mode === 'natural' ? 0.12 : (mode === 'experimental' ? 0.26 : 0.42);
    function jitter(v) { return clamp01(v + (rand() * 2 - 1) * span); }

    out.openness    = jitter(out.openness);
    out.volume      = jitter(out.volume);
    out.centerSize  = jitter(out.centerSize);
    out.petalLength = jitter(out.petalLength);
    out.petalWidth  = jitter(out.petalWidth);
    out.petalCurve  = jitter(out.petalCurve);
    out.density     = jitter(out.density);
    out.symmetry    = mode === 'fantastic' ? 0.55 + rand() * 0.45 : 0.82 + rand() * 0.18;
    out.petalTwist  = mode === 'natural' ? out.petalTwist : clamp01(out.petalTwist + rand() * span);

    if (mode !== 'natural' && rand() > 0.55) out.petalShape = pick(rand, PETAL_SHAPES);
    if (rand() > 0.6) out.petalEdge = pick(rand, EDGES);
    if (rand() > 0.7) out.shape = pick(rand, SHAPES);

    var h = HARMONIES[Math.floor(rand() * HARMONIES.length)];
    out.colors = { primary: h[0], secondary: h[1], center: h[2], tip: h[3], reverse: h[4] };

    var pats = mode === 'fantastic' ? PATTERNS
             : mode === 'experimental' ? PATTERNS.slice(0, 11)
             : ['solid', 'gradientCenter', 'gradientTips', 'contrastCenter', 'contrastTips'];
    out.pattern = pick(rand, pats);

    out.diameter = pick(rand, DIAMETERS);
    out.growth   = pick(rand, GROWTH);
    out.flowersPerStem = out.growth === 'disbud' ? 1 : 2 + Math.floor(rand() * 7);
    out.stemLength = pick(rand, STEMS);
    out.foliage  = pick(rand, FOLIAGE);
    out.layers   = Math.max(1, Math.min(14, out.layers + Math.floor((rand() * 2 - 1) * 3)));

    return normalize(out);
  }

  function applyPreset(g, family) {
    var p = PRESETS[family];
    if (!p) return g;
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) g[k] = p[k];
    g.family = family;
    if (g.growth === 'disbud') g.flowersPerStem = 1;
    else if (g.flowersPerStem < 2) g.flowersPerStem = 5;
    return g;
  }

  /* ---------------------------------------------------------------
     Reglas del modo creativo. El modo natural mantiene la flor dentro
     de lo que un fitomejorador reconocería como cultivable.
     --------------------------------------------------------------- */
  function normalize(g) {
    g.openness   = clamp01(g.openness);
    g.symmetry   = clamp01(g.symmetry);
    g.volume     = clamp01(g.volume);
    g.centerSize = clamp01(g.centerSize);
    g.petalLength= clamp01(g.petalLength);
    g.petalWidth = clamp01(g.petalWidth);
    g.petalCurve = clamp01(g.petalCurve);
    g.petalTwist = clamp01(g.petalTwist);
    g.density    = clamp01(g.density);
    g.layers     = Math.max(1, Math.min(14, Math.round(g.layers)));
    g.flowersPerStem = Math.max(1, Math.min(9, Math.round(g.flowersPerStem)));

    if (g.mode === 'natural') {
      if (g.pattern === 'iridescent') g.pattern = 'gradientTips';
      g.symmetry   = Math.max(0.78, g.symmetry);
      g.petalTwist = Math.min(0.35, g.petalTwist);
      g.layers     = Math.min(13, g.layers);
    } else if (g.mode === 'experimental') {
      if (g.pattern === 'iridescent') g.pattern = 'watercolor';
      g.symmetry = Math.max(0.55, g.symmetry);
    }
    if (g.growth === 'disbud') g.flowersPerStem = 1;
    if (g.growth !== 'disbud' && g.flowersPerStem < 2) g.flowersPerStem = 3;
    if (g.personality.length > 3) g.personality = g.personality.slice(0, 3);
    return g;
  }

  /* ---------------------------------------------------------------
     Motor de recomendaciones — sugiere, nunca obliga
     --------------------------------------------------------------- */
  function advice(g, lang) {
    var es = lang !== 'en';
    var out = [];
    if (g.petalLength > 0.8 && g.density > 0.8) {
      out.push({
        text: es ? 'Pétalos muy largos con densidad muy alta: una apertura media conserva la silueta legible.'
                 : 'Very long petals at high density: a medium opening keeps the silhouette readable.',
        fix: { openness: 0.55 },
        label: es ? 'Ajustar apertura' : 'Adjust opening'
      });
    }
    if (contrast(hex(g.colors.primary), hex(g.colors.center)) < 0.18) {
      out.push({
        text: es ? 'El centro casi no se distingue del pétalo. Un centro lima le da profundidad.'
                 : 'The centre barely reads against the petal. A lime centre adds depth.',
        fix: { colors: assign({}, g.colors, { center: 4 }) },
        label: es ? 'Probar centro lima' : 'Try a lime centre'
      });
    }
    if (g.diameter === 'xlarge' && (g.growth === 'sprayFull' || g.flowersPerStem >= 6)) {
      out.push({
        text: es ? 'Flor extra grande en spray abundante: una combinación muy experimental para un tallo real.'
                 : 'Extra-large bloom on a full spray: a very experimental combination for a real stem.',
        fix: null, label: null
      });
    }
    if (g.layers >= 10 && g.openness > 0.85) {
      out.push({
        text: es ? 'Muchas capas con apertura máxima aplanan la flor. Baja un poco la apertura para ganar volumen.'
                 : 'Many layers at full opening flatten the bloom. Lower the opening to gain volume.',
        fix: { openness: 0.6 }, label: es ? 'Ganar volumen' : 'Gain volume'
      });
    }
    return out;
  }

  /* ---------------------------------------------------------------
     Indicadores lúdicos del pasaporte
     --------------------------------------------------------------- */
  function scores(g) {
    var d = 0;
    d += Math.abs(g.openness - 0.55) * 55;
    d += Math.abs(g.petalLength - 0.6) * 40;
    d += g.petalTwist * 60;
    d += (1 - g.symmetry) * 70;
    d += (g.layers > 10 ? (g.layers - 10) * 7 : 0);
    d += (g.pattern === 'solid' ? 0 : 14);
    d += (g.pattern === 'iridescent' || g.pattern === 'watercolor' ? 16 : 0);
    d += (g.petalShape === 'tubular' || g.petalShape === 'spiral' || g.petalShape === 'irregular' ? 18 : 0);
    d += (g.mode === 'fantastic' ? 22 : g.mode === 'experimental' ? 11 : 0);
    var novelty = Math.round(Math.max(12, Math.min(99, d)));

    var cPT = contrast(hex(g.colors.primary), hex(g.colors.tip));
    var cPC = contrast(hex(g.colors.primary), hex(g.colors.center));
    var h = 100;
    h -= Math.abs(cPT - 0.34) * 62;                     /* contraste punta ideal medio */
    h -= (cPC < 0.16 ? (0.16 - cPC) * 190 : 0);          /* centro que no se distingue  */
    h -= Math.abs(g.density - (g.openness > 0.7 ? 0.45 : 0.82)) * 44;
    h -= (1 - g.symmetry) * 26;
    h -= (g.layers >= 9 && g.openness > 0.8) ? 14 : 0;
    var harmony = Math.round(Math.max(28, Math.min(99, h)));

    var c = 0;
    c += g.layers * 3.4;
    c += g.density * 26;
    c += (g.petalShape === 'tubular' || g.petalShape === 'spoon' || g.petalShape === 'spiral') ? 17 : 0;
    c += (g.pattern === 'bicolor' || g.pattern === 'striped' || g.pattern === 'mottled' || g.pattern === 'speckled') ? 19 : 0;
    c += (g.pattern === 'iridescent') ? 30 : 0;
    c += (g.diameter === 'xlarge' && g.growth !== 'disbud') ? 16 : 0;
    c += g.flowersPerStem > 5 ? 9 : 0;
    c += (1 - g.symmetry) * 20;
    var challenge = Math.round(Math.max(15, Math.min(99, c)));

    return { novelty: novelty, harmony: harmony, challenge: challenge };
  }

  /* ---------------------------------------------------------------
     Generador de nombres
     --------------------------------------------------------------- */
  var NAME_COLOR = {
    white: ['Nieve','Lumen','Alba','Perla'], ivory: ['Marfil','Duna','Seda'],
    cream: ['Crema','Miel','Vainilla'], yellow: ['Solar','Ámbar','Faro','Mimosa'],
    lime: ['Lima','Brote','Savia'], green: ['Bosque','Hoja','Musgo'],
    softpink: ['Rubor','Pétalo','Aurora'], pink: ['Rosalía','Fresa','Danza'],
    magenta: ['Magenta','Vértigo','Fiesta'], fuchsia: ['Fucsia','Chispa','Neón'],
    lilac: ['Lila','Bruma','Susurro'], purple: ['Violeta','Realeza','Nocturno'],
    wine: ['Vino','Terciopelo','Granate'], red: ['Rubí','Fuego','Carmín'],
    salmon: ['Salmón','Atardecer','Coralina'], coral: ['Coral','Brasa','Trópico'],
    bronze: ['Bronce','Otoño','Cobre'], orange: ['Naranja','Amanecer','Mandarina'],
    earth: ['Tierra','Raíz','Barro']
  };
  var NAME_MOOD = {
    elegant: ['Elegante','Noble','Gala'], joyful: ['Alegre','Festiva','Vivaz'],
    romantic: ['Romance','Beso','Ternura'], powerful: ['Titán','Fuerza','Trueno'],
    delicate: ['Delicada','Pluma','Roce'], exotic: ['Exótica','Sirena','Bali'],
    modern: ['Neo','Prisma','Studio'], serene: ['Serena','Calma','Lago'],
    mysterious: ['Enigma','Eclipse','Sombra'], natural: ['Natural','Campo','Silvestre'],
    bold: ['Audaz','Rebelde','Impacto'], sophisticated: ['Sofía','Couture','Atelier'],
    tropical: ['Trópico','Palma','Caribe'], minimal: ['Mínima','Puro','Línea'],
    festive: ['Fiesta','Confeti','Carnaval']
  };
  var NAME_TAIL = ['Bloom','Star','Nova','Joy','Light','Dream','Spirit','Wonder','Élan','Éclat','Aura','Sol'];

  function suggestNames(g, n, salt) {
    var rand = rng((g.seed || 1) * 2654435761 + (salt || 0) * 40503 +
                   PALETTE.length * (g.colors.primary + 1));
    var cWords = NAME_COLOR[PALETTE[g.colors.primary].id] || ['Bloom'];
    var mWords = g.personality.length
      ? (NAME_MOOD[g.personality[0]] || ['Bloom'])
      : NAME_MOOD.elegant;
    var out = [], guard = 0;
    while (out.length < (n || 3) && guard++ < 60) {
      var form = Math.floor(rand() * 3);
      var s;
      if (form === 0)      s = pick(rand, mWords) + ' ' + pick(rand, cWords);
      else if (form === 1) s = pick(rand, cWords) + ' ' + pick(rand, NAME_TAIL);
      else                 s = pick(rand, mWords) + ' ' + pick(rand, NAME_TAIL);
      if (s.length <= 24 && out.indexOf(s) === -1 && checkName(s).ok) out.push(s);
    }
    return out;
  }

  /* Moderación local. Cubre español e inglés y sustituciones comunes. */
  var BLOCKED = ('puta puto mierda coño joder cabron cabrón polla pene vagina teta culo zorra maricon maricón ' +
    'fuck shit cunt dick cock bitch whore slut ass nigg fag rape nazi hitler stalin isis kkk ' +
    'matar muerte suicid kill death bomb terror droga cocain heroin porn sexo sexy xxx ' +
    'coca-cola cocacola pepsi nestle nestlé nike adidas disney google apple amazon deliflor').split(/\s+/);

  function checkName(raw) {
    var s = String(raw || '').trim();
    if (!s) return { ok: false, reason: 'empty' };
    if (s.length > 24) return { ok: false, reason: 'long' };
    var flat = s.toLowerCase()
      .normalize ? s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : s.toLowerCase();
    flat = flat.replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
               .replace(/4/g, 'a').replace(/5\$/g, 's').replace(/7/g, 't')
               .replace(/[^a-z]/g, '');
    for (var i = 0; i < BLOCKED.length; i++) {
      if (BLOCKED[i] && flat.indexOf(BLOCKED[i]) !== -1) return { ok: false, reason: 'blocked' };
    }
    if (/(.)\1{4,}/.test(flat)) return { ok: false, reason: 'spam' };
    return { ok: true };
  }

  /* ---------------------------------------------------------------
     Prompt estructurado para el render fotorrealista opcional
     --------------------------------------------------------------- */
  var EN = {
    shape: { circular:'circular', spherical:'perfectly spherical', semispherical:'semi-spherical dome',
      flat:'flat open', concave:'concave cupped', convex:'convex rounded', star:'star-shaped',
      organic:'organically irregular', compact:'tightly compact', expanded:'widely expanded' },
    petal: { rounded:'rounded', oval:'oval', long:'elongated', tubular:'tubular quill-like',
      spoon:'spoon-tipped', curly:'curled', pointed:'sharply pointed', wavy:'wavy',
      spiral:'spiralling', irregular:'irregular' },
    arrangement: { radial:'a single radial whorl', layered:'concentric layers', spiral:'a spiral phyllotaxis',
      compact:'a dense compact dome', open:'an open airy whorl', asym:'a controlled asymmetric spread' },
    pattern: { solid:'solid colour', gradientCenter:'a gradient radiating from the centre',
      gradientTips:'a gradient toward the tips', contrastCenter:'a contrasting centre',
      contrastTips:'contrasting tips', bicolor:'a bicolour split', striped:'fine striping',
      mottled:'soft mottling', speckled:'delicate speckling', edged:'contrasting petal edges',
      watercolor:'a watercolour wash', iridescent:'an iridescent sheen' },
    growth: { disbud:'a single disbudded bloom per stem', spraySmall:'a light spray',
      sprayFull:'an abundant spray', cluster:'a compact cluster', cascade:'a tiered cascading habit' },
    bq: { mono:'monofloral', round:'round', asymmetric:'asymmetric', wild:'wild garden-style',
      minimal:'minimalist', sculptural:'sculptural', celebration:'celebratory', gift:'gift', runway:'couture runway' },
    wrap: { none:'no wrapping', whitePaper:'white paper', naturalPaper:'natural kraft paper',
      deliflorPaper:'deep wine Deliflor paper', textile:'soft textile', vase:'a ceramic vase' },
    bg: { studio:'a clean white studio', greenhouse:'a bright chrysanthemum greenhouse',
      floralEvent:'an elegant floral event', elegantTable:'a refined dining table',
      natural:'a soft natural garden', deliflor:'a deep wine Deliflor backdrop', artistic:'an artistic set' },
    ab: { small:'8', medium:'15', abundant:'25', monumental:'40' }
  };

  function prompt(g) {
    var c = function (i) { return PALETTE[i].en.toLowerCase(); };
    var name = g.name || 'Unnamed';
    var s = 'Professional botanical product photography of an entirely new chrysanthemum cultivar named "' + name + '". ';
    s += 'The flower has a ' + EN.shape[g.shape] + ' silhouette, ' +
         (g.density > 0.75 ? 'very high' : g.density > 0.5 ? 'high' : g.density > 0.3 ? 'medium' : 'light') +
         ' petal density and ' + EN.petal[g.petalShape] + ' petals arranged in ' + EN.arrangement[g.arrangement] + '. ';
    s += 'Petals are ' + c(g.colors.primary) + ' with ' + EN.pattern[g.pattern] + ', ' +
         c(g.colors.secondary) + ' accents and a ' + c(g.colors.center) + ' centre. ';
    s += 'Flower diameter is ' + g.diameter + ' (' + DIAMETER_CM[g.diameter] + ' cm). ';
    s += 'Growth habit is ' + EN.growth[g.growth] + '. ';
    s += 'Create a sophisticated ' + EN.bq[g.bouquet.style] + ' bouquet containing ' +
         EN.ab[g.bouquet.abundance] + ' stems, presented with ' + EN.wrap[g.bouquet.wrap] +
         ' against ' + EN.bg[g.bouquet.bg] + ' setting. ';
    s += 'Photorealistic botanical details, realistic chrysanthemum leaves and stems, natural petal ' +
         'translucency, professional floral styling, premium studio lighting, highly detailed, ' +
         'botanically coherent, centered composition, no text, no watermark, no logos.';
    if (g.mode === 'fantastic') s += ' Subtle otherworldly luminosity is welcome, but the flower must remain recognisable as a chrysanthemum.';
    return s;
  }

  var NEGATIVE = 'roses, tulips, lilies, sunflowers, unrelated flower species, plastic petals, fabric ' +
    'flowers, malformed petals, duplicated stems, floating flowers, impossible vase geometry, artificial ' +
    'leaves, distorted bouquet, text, watermark, logo, people, hands, insects, excessive blur, ' +
    'cropped bouquet, low resolution.';

  /* ---------------------------------------------------------------
     Serialización compacta para el QR
     Formato v1. Cambiar el orden rompe los QR ya impresos.
     --------------------------------------------------------------- */
  function BitWriter() { this.bits = []; }
  BitWriter.prototype.w = function (val, n) {
    for (var i = n - 1; i >= 0; i--) this.bits.push((val >> i) & 1);
    return this;
  };
  BitWriter.prototype.bytes = function () {
    while (this.bits.length % 8) this.bits.push(0);
    var out = new Uint8Array(this.bits.length / 8);
    for (var i = 0; i < this.bits.length; i++) out[i >> 3] |= this.bits[i] << (7 - (i & 7));
    return out;
  };
  function BitReader(bytes) { this.b = bytes; this.p = 0; }
  BitReader.prototype.r = function (n) {
    var v = 0;
    for (var i = 0; i < n; i++) {
      var byte = this.b[this.p >> 3] || 0;
      v = (v << 1) | ((byte >> (7 - (this.p & 7))) & 1);
      this.p++;
    }
    return v;
  };

  function q6(v) { return Math.max(0, Math.min(63, Math.round(v * 63))); }
  function d6(v) { return v / 63; }
  function idx(arr, v) { var i = arr.indexOf(v); return i < 0 ? 0 : i; }

  function encode(g) {
    var w = new BitWriter();
    w.w(1, 4);                                   /* versión de formato */
    w.w(idx(MODES, g.mode), 2);
    w.w(idx(FAMILIES, g.family), 4);
    w.w(idx(SHAPES, g.shape), 4);
    w.w(idx(PETAL_SHAPES, g.petalShape), 4);
    w.w(idx(EDGES, g.petalEdge), 3);
    w.w(idx(ARRANGEMENTS, g.arrangement), 3);
    w.w(idx(PATTERNS, g.pattern), 4);
    w.w(idx(GROWTH, g.growth), 3);
    w.w(idx(DIAMETERS, g.diameter), 3);
    w.w(idx(STEMS, g.stemLength), 2);
    w.w(idx(FOLIAGE, g.foliage), 3);
    w.w(q6(g.openness), 6);   w.w(q6(g.symmetry), 6);   w.w(q6(g.volume), 6);
    w.w(q6(g.centerSize), 6); w.w(q6(g.petalLength), 6); w.w(q6(g.petalWidth), 6);
    w.w(q6(g.petalCurve), 6); w.w(q6(g.petalTwist), 6);  w.w(q6(g.density), 6);
    w.w(g.layers, 4);
    w.w(g.flowersPerStem, 4);
    w.w(g.colors.primary, 5); w.w(g.colors.secondary, 5); w.w(g.colors.center, 5);
    w.w(g.colors.tip, 5);     w.w(g.colors.reverse, 5);
    w.w(idx(BQ_STYLES, g.bouquet.style), 4);
    w.w(idx(BQ_ABUNDANCE, g.bouquet.abundance), 2);
    w.w(idx(BQ_EXTRAS, g.bouquet.extras), 3);
    w.w(idx(BQ_WRAP, g.bouquet.wrap), 3);
    w.w(idx(BQ_BG, g.bouquet.bg), 3);
    var mask = 0;
    for (var i = 0; i < PERSONALITY.length; i++) {
      if (g.personality.indexOf(PERSONALITY[i]) !== -1) mask |= (1 << i);
    }
    w.w(mask >> 8, 7); w.w(mask & 255, 8);
    w.w((g.seed || 1) & 0xFFFF, 16);

    var head = w.bytes();
    var nameBytes = utf8(String(g.name || '').slice(0, 24));
    var out = new Uint8Array(head.length + 1 + nameBytes.length);
    out.set(head, 0);
    out[head.length] = nameBytes.length;
    out.set(nameBytes, head.length + 1);
    return b64url(out);
  }

  function decode(str) {
    try {
      var bytes = unb64url(str);
      var r = new BitReader(bytes);
      if (r.r(4) !== 1) return null;
      var g = base();
      g.mode        = MODES[r.r(2)] || 'natural';
      g.family      = FAMILIES[r.r(4)] || 'ballhia';
      g.shape       = SHAPES[r.r(4)] || 'spherical';
      g.petalShape  = PETAL_SHAPES[r.r(4)] || 'rounded';
      g.petalEdge   = EDGES[r.r(3)] || 'smooth';
      g.arrangement = ARRANGEMENTS[r.r(3)] || 'spiral';
      g.pattern     = PATTERNS[r.r(4)] || 'solid';
      g.growth      = GROWTH[r.r(3)] || 'disbud';
      g.diameter    = DIAMETERS[r.r(3)] || 'medium';
      g.stemLength  = STEMS[r.r(2)] || 'long';
      g.foliage     = FOLIAGE[r.r(3)] || 'medium';
      g.openness = d6(r.r(6)); g.symmetry = d6(r.r(6)); g.volume = d6(r.r(6));
      g.centerSize = d6(r.r(6)); g.petalLength = d6(r.r(6)); g.petalWidth = d6(r.r(6));
      g.petalCurve = d6(r.r(6)); g.petalTwist = d6(r.r(6)); g.density = d6(r.r(6));
      g.layers = r.r(4) || 1;
      g.flowersPerStem = r.r(4) || 1;
      g.colors = {
        primary: r.r(5) % PALETTE.length, secondary: r.r(5) % PALETTE.length,
        center: r.r(5) % PALETTE.length, tip: r.r(5) % PALETTE.length,
        reverse: r.r(5) % PALETTE.length
      };
      g.bouquet = {
        style: BQ_STYLES[r.r(4)] || 'round',
        abundance: BQ_ABUNDANCE[r.r(2)] || 'medium',
        extras: BQ_EXTRAS[r.r(3)] || 'lightFoliage',
        wrap: BQ_WRAP[r.r(3)] || 'naturalPaper',
        bg: BQ_BG[r.r(3)] || 'studio'
      };
      var mask = (r.r(7) << 8) | r.r(8);
      g.personality = [];
      for (var i = 0; i < PERSONALITY.length; i++) {
        if (mask & (1 << i)) g.personality.push(PERSONALITY[i]);
      }
      g.personality = g.personality.slice(0, 3);
      g.seed = r.r(16) || 1;

      var headLen = Math.ceil(r.p / 8);
      var nameLen = bytes[headLen] || 0;
      g.name = nameLen ? fromUtf8(bytes.subarray(headLen + 1, headLen + 1 + nameLen)) : '';
      return normalize(g);
    } catch (e) { return null; }
  }

  /* ------------------------------- utilidades ------------------------------- */
  function utf8(s) {
    var out = [], i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) { out.push(192 | (c >> 6), 128 | (c & 63)); }
      else { out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63)); }
    }
    return new Uint8Array(out);
  }
  function fromUtf8(b) {
    var s = '', i = 0, c;
    while (i < b.length) {
      c = b[i++];
      if (c < 128) s += String.fromCharCode(c);
      else if (c < 224) s += String.fromCharCode(((c & 31) << 6) | (b[i++] & 63));
      else s += String.fromCharCode(((c & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63));
    }
    return s;
  }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64url(bytes) {
    var s = '', i;
    for (i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      var rem = bytes.length - i;
      s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
      if (rem > 1) s += B64[(n >> 6) & 63];
      if (rem > 2) s += B64[n & 63];
    }
    return s;
  }
  function unb64url(s) {
    var out = [], i, n, rem;
    for (i = 0; i < s.length; i += 4) {
      var a = B64.indexOf(s[i]), b = B64.indexOf(s[i + 1]),
          c = B64.indexOf(s[i + 2]), d = B64.indexOf(s[i + 3]);
      n = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
      rem = s.length - i;
      out.push((n >> 16) & 255);
      if (rem > 2 && c >= 0) out.push((n >> 8) & 255);
      if (rem > 3 && d >= 0) out.push(n & 255);
    }
    return new Uint8Array(out);
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function assign(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i];
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
    }
    return t;
  }
  function hex(i) { return PALETTE[i] ? PALETTE[i].hex : '#FFFFFF'; }
  function rgb(h) {
    return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  }
  function lum(h) { var c = rgb(h); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { return Math.abs(lum(a) - lum(b)); }

  root.Genome = {
    PALETTE: PALETTE, MODES: MODES, FAMILIES: FAMILIES, SHAPES: SHAPES,
    PETAL_SHAPES: PETAL_SHAPES, EDGES: EDGES, ARRANGEMENTS: ARRANGEMENTS,
    PATTERNS: PATTERNS, GROWTH: GROWTH, DIAMETERS: DIAMETERS, STEMS: STEMS,
    FOLIAGE: FOLIAGE, BQ_STYLES: BQ_STYLES, BQ_ABUNDANCE: BQ_ABUNDANCE,
    BQ_EXTRAS: BQ_EXTRAS, BQ_WRAP: BQ_WRAP, BQ_BG: BQ_BG,
    PERSONALITY: PERSONALITY, DIAMETER_CM: DIAMETER_CM, PRESETS: PRESETS,
    base: base, clone: clone, applyPreset: applyPreset, normalize: normalize,
    randomize: randomize, rng: rng, advice: advice, scores: scores,
    suggestNames: suggestNames, checkName: checkName,
    prompt: prompt, NEGATIVE: NEGATIVE,
    encode: encode, decode: decode,
    hex: hex, rgb: rgb, contrast: contrast
  };
})(window);
