/* DELIFLOR Bloom Lab V11 module */
(function(root){'use strict';
  var G=root.Genome,App=root.App,M=root.MeshGen,GL=root.GL,T=root.Thumbs,QR=root.QR;
  if(!G||!App||!M||!GL||!T){if(root.console)console.error('Bloom Lab V11: núcleo base no disponible');return;}
  var B=root.BloomLabV11=root.BloomLabV11||{};B.version='11.0.0';B.build='1101';
  /* -----------------------------------------------------------------
     1. Atlas morfológico ampliado
     Se reutilizan los cuatro índices finales del genoma compacto. Al mutar
     las matrices exportadas, el codificador privado conserva compatibilidad
     y sigue viajando en pocas decenas de bytes dentro del QR.
     ----------------------------------------------------------------- */
  var FAMILY_META = {
    ballhia:   { ncs: 'NCS 6 · Pompon',              ray: 'Pétalo corto e incurvado',     disc: 'Centro oculto' },
    decorative:{ ncs: 'NCS 4 · Decorative',          ray: 'Pétalo ancho superpuesto',     disc: 'Centro mínimo' },
    margriet:  { ncs: 'NCS 7 · Single / Daisy',      ray: 'Pétalo plano ligulado',        disc: 'Disco visible' },
    spoon:     { ncs: 'NCS 9 · Spoon',               ray: 'Base tubular y punta abierta', disc: 'Disco visible' },
    spider:    { ncs: 'NCS 11 · Spider',             ray: 'Tubular largo y flexible',     disc: 'Centro pequeño' },
    anemone:   { ncs: 'NCS 8 · Anemone',             ray: 'Rayos planos periféricos',     disc: 'Centro petaloide' },
    quill:     { ncs: 'NCS 10 · Quill',              ray: 'Tubular uniforme y estrecho',  disc: 'Centro oculto' },
    reflex:    { ncs: 'NCS 2 · Reflex',              ray: 'Pétalo arqueado hacia abajo',  disc: 'Centro oculto' },
    incurve:   { ncs: 'NCS 3 · Regular Incurve',     ray: 'Pétalo incurvado al centro',   disc: 'Centro oculto' },
    brush:     { ncs: 'NCS 12 · Brush / Thistle',    ray: 'Tubos cortos y erectos',       disc: 'Centro integrado' }
  };

  var NEW_PRESETS = {
    quill: {
      shape: 'expanded', openness: 0.72, volume: 0.48, centerSize: 0.08,
      petalShape: 'tubular', petalLength: 0.86, petalWidth: 0.16, petalCurve: 0.66,
      petalTwist: 0.18, petalEdge: 'curled', arrangement: 'spiral',
      density: 0.66, layers: 8, diameter: 'xlarge', growth: 'disbud'
    },
    reflex: {
      shape: 'semispherical', openness: 0.56, volume: 0.66, centerSize: 0.05,
      petalShape: 'long', petalLength: 0.82, petalWidth: 0.52, petalCurve: 0.84,
      petalTwist: 0.08, petalEdge: 'smooth', arrangement: 'layered',
      density: 0.76, layers: 9, diameter: 'large', growth: 'disbud'
    },
    incurve: {
      shape: 'spherical', openness: 0.26, volume: 0.86, centerSize: 0.04,
      petalShape: 'rounded', petalLength: 0.60, petalWidth: 0.58, petalCurve: 0.16,
      petalTwist: 0.05, petalEdge: 'smooth', arrangement: 'spiral',
      density: 0.94, layers: 12, diameter: 'large', growth: 'disbud'
    },
    brush: {
      shape: 'compact', openness: 0.68, volume: 0.38, centerSize: 0.16,
      petalShape: 'tubular', petalLength: 0.42, petalWidth: 0.17, petalCurve: 0.48,
      petalTwist: 0.28, petalEdge: 'curled', arrangement: 'radial',
      density: 0.74, layers: 6, diameter: 'medium', growth: 'spraySmall'
    }
  };

  function replaceFamily(oldId, newId, preset) {
    var i = G.FAMILIES.indexOf(oldId);
    if (i >= 0) G.FAMILIES[i] = newId;
    G.PRESETS[newId] = preset;
    try { delete G.PRESETS[oldId]; } catch (e) {}
  }
  replaceFamily('single', 'quill', NEW_PRESETS.quill);
  replaceFamily('semidouble', 'reflex', NEW_PRESETS.reflex);
  replaceFamily('double', 'incurve', NEW_PRESETS.incurve);
  replaceFamily('surprise', 'brush', NEW_PRESETS.brush);

  Object.assign(App.LB, {
    quill: ['Quill', 'Quill'],
    reflex: ['Refleja', 'Reflex'],
    incurve: ['Incurvada', 'Incurve'],
    brush: ['Brush / Thistle', 'Brush / Thistle']
  });

  /* -----------------------------------------------------------------
     2. Validación botánica estricta por familia
     ----------------------------------------------------------------- */
  var BASE_NORMALIZE = G.normalize;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function expandedRange(a, b, mode, normalized) {
    var span = b - a;
    var f = mode === 'natural' ? 0 : mode === 'experimental' ? 0.18 : 0.38;
    var lo = a - span * f, hi = b + span * f;
    return normalized === false ? [lo, hi] : [clamp(lo, 0, 1), clamp(hi, 0, 1)];
  }
  function range(g, key, a, b, integer) {
    var r = expandedRange(a, b, g.mode, !integer);
    g[key] = clamp(g[key], r[0], r[1]);
    if (integer) g[key] = Math.round(g[key]);
  }
  function familyConstraint(g) {
    var natural = g.mode === 'natural';
    switch (g.family) {
      case 'ballhia':
        range(g,'openness',.16,.36); range(g,'volume',.72,.94); range(g,'centerSize',.02,.10);
        range(g,'petalLength',.42,.62); range(g,'petalWidth',.50,.74); range(g,'petalCurve',.08,.30);
        range(g,'petalTwist',0,.16); range(g,'density',.84,.98); range(g,'layers',10,13,true);
        if (natural) { g.shape='spherical'; g.petalShape=['rounded','oval'].indexOf(g.petalShape)>=0?g.petalShape:'rounded'; g.arrangement='spiral'; g.growth='disbud'; }
        break;
      case 'decorative':
        range(g,'openness',.54,.84); range(g,'volume',.24,.58); range(g,'centerSize',.02,.16);
        range(g,'petalLength',.54,.80); range(g,'petalWidth',.56,.84); range(g,'petalCurve',.24,.54);
        range(g,'density',.60,.86); range(g,'layers',7,10,true);
        if (natural) { g.shape=['semispherical','convex','circular'].indexOf(g.shape)>=0?g.shape:'semispherical'; g.petalShape=['rounded','oval','wavy'].indexOf(g.petalShape)>=0?g.petalShape:'rounded'; }
        break;
      case 'margriet':
        range(g,'openness',.88,1); range(g,'volume',.08,.28); range(g,'centerSize',.30,.50);
        range(g,'petalLength',.56,.76); range(g,'petalWidth',.30,.48); range(g,'petalCurve',.40,.60);
        range(g,'density',.26,.48); range(g,'layers',1,3,true);
        if (natural) { g.shape=['flat','circular'].indexOf(g.shape)>=0?g.shape:'flat'; g.petalShape=['rounded','oval','pointed'].indexOf(g.petalShape)>=0?g.petalShape:'oval'; g.arrangement='radial'; }
        break;
      case 'spoon':
        range(g,'openness',.72,.94); range(g,'volume',.18,.48); range(g,'centerSize',.20,.40);
        range(g,'petalLength',.66,.86); range(g,'petalWidth',.22,.40); range(g,'petalCurve',.46,.68);
        range(g,'density',.36,.60); range(g,'layers',2,4,true);
        if (natural) { g.shape=['convex','flat','circular'].indexOf(g.shape)>=0?g.shape:'convex'; g.petalShape='spoon'; g.arrangement='radial'; }
        break;
      case 'spider':
        range(g,'openness',.62,.84); range(g,'volume',.28,.54); range(g,'centerSize',.07,.22);
        range(g,'petalLength',.84,.99); range(g,'petalWidth',.10,.25); range(g,'petalCurve',.68,.92);
        range(g,'petalTwist',.14,.40); range(g,'density',.36,.60); range(g,'layers',4,6,true);
        if (natural) { g.shape='expanded'; g.petalShape='tubular'; g.arrangement='spiral'; }
        break;
      case 'anemone':
        range(g,'openness',.82,.98); range(g,'volume',.16,.40); range(g,'centerSize',.42,.64);
        range(g,'petalLength',.48,.68); range(g,'petalWidth',.34,.54); range(g,'petalCurve',.38,.58);
        range(g,'density',.30,.52); range(g,'layers',1,3,true);
        if (natural) { g.shape=['circular','flat','concave'].indexOf(g.shape)>=0?g.shape:'circular'; g.arrangement='radial'; }
        break;
      case 'quill':
        range(g,'openness',.62,.82); range(g,'volume',.34,.58); range(g,'centerSize',.03,.16);
        range(g,'petalLength',.72,.94); range(g,'petalWidth',.08,.22); range(g,'petalCurve',.54,.78);
        range(g,'petalTwist',.10,.32); range(g,'density',.50,.76); range(g,'layers',6,9,true);
        if (natural) { g.shape=['expanded','semispherical'].indexOf(g.shape)>=0?g.shape:'expanded'; g.petalShape='tubular'; g.arrangement='spiral'; }
        break;
      case 'reflex':
        range(g,'openness',.44,.70); range(g,'volume',.50,.78); range(g,'centerSize',.02,.12);
        range(g,'petalLength',.66,.90); range(g,'petalWidth',.38,.64); range(g,'petalCurve',.70,.94);
        range(g,'density',.62,.88); range(g,'layers',7,10,true);
        if (natural) { g.shape=['semispherical','convex'].indexOf(g.shape)>=0?g.shape:'semispherical'; g.petalShape=['rounded','oval','long'].indexOf(g.petalShape)>=0?g.petalShape:'long'; g.arrangement='layered'; }
        break;
      case 'incurve':
        range(g,'openness',.16,.38); range(g,'volume',.72,.96); range(g,'centerSize',.01,.09);
        range(g,'petalLength',.48,.72); range(g,'petalWidth',.42,.68); range(g,'petalCurve',.06,.28);
        range(g,'density',.82,.98); range(g,'layers',9,13,true);
        if (natural) { g.shape=['spherical','semispherical'].indexOf(g.shape)>=0?g.shape:'spherical'; g.petalShape=['rounded','oval'].indexOf(g.petalShape)>=0?g.petalShape:'rounded'; g.arrangement='spiral'; g.growth='disbud'; }
        break;
      case 'brush':
        range(g,'openness',.58,.82); range(g,'volume',.22,.50); range(g,'centerSize',.08,.26);
        range(g,'petalLength',.28,.54); range(g,'petalWidth',.08,.24); range(g,'petalCurve',.34,.62);
        range(g,'petalTwist',.14,.44); range(g,'density',.58,.84); range(g,'layers',4,7,true);
        if (natural) { g.shape=['compact','circular'].indexOf(g.shape)>=0?g.shape:'compact'; g.petalShape=['tubular','curly'].indexOf(g.petalShape)>=0?g.petalShape:'tubular'; g.arrangement='radial'; }
        break;
    }
    if (natural) g.symmetry = Math.max(g.symmetry, 0.84);
    return g;
  }
  G.normalize = function (g) { BASE_NORMALIZE(g); return familyConstraint(g); };

  var BASE_RANDOMIZE = G.randomize;
  G.randomize = function (g, seed) {
    var out = BASE_RANDOMIZE(g, seed);
    var s = (seed || out.seed || Date.now()) >>> 0;
    if (s % 10 === 9) {
      G.applyPreset(out, 'brush');
      out.seed = s & 0xFFFF || 1;
    }
    return G.normalize(out);
  };


  B.familyMeta=FAMILY_META; B.clamp=clamp;

})(window);
