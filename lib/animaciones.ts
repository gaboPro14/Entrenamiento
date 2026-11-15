// Animaciones de los ejercicios: una figura de palitos en SVG que se mueve entre
// poses clave. Todo se calcula en el teléfono: sin videos ni internet.
//
// Coordenadas: lienzo 240 x 170, piso en y = 160, la figura mira a la derecha (+x).
// Ángulos en grados: 0 = derecha, 90 = abajo, -90 = arriba.

export type P = { x: number; y: number };
/** Una extremidad: por ángulos absolutos (a = segmento 1, b = segmento 2) o por objetivo (IK). */
export type Ext = { a: number; b: number } | { t: P; s: 1 | -1 };

export type PoseLado = {
  cadera: P;
  torso: number;
  cuello?: number;
  brazo: Ext;
  brazo2?: Ext;
  pierna: Ext;
  pierna2?: Ext;
  pie?: number;
  pie2?: number;
  /** Posición del objeto cuando no va en la mano (barra en la espalda o la cadera). */
  obj?: P;
};

export type PoseFrente = {
  cx: number;
  cadera: number;
  hombro: number;
  cabeza?: number;
  brazo: Ext;
  pierna: Ext;
};

export type Escena =
  | { tipo: "banco"; x: number; y: number; w: number }
  | { tipo: "inclinado"; x: number; y: number; w: number; ang: number; largo: number }
  | { tipo: "tabla"; x: number; w: number };

export type Objeto = { tipo: "mancuerna" | "barra"; en: "manos" | "mano" | "obj" };

type Frame<T> = { p: T; pausa: number; mover: number };

export type Anim =
  | { vista: "lado"; escena?: Escena[]; objeto?: Objeto; frames: Frame<PoseLado>[] }
  | { vista: "frente"; escena?: Escena[]; objeto?: Objeto; frames: Frame<PoseFrente>[] };

// ---------- Medidas ----------
export const L = { torso: 48, cuello: 15, cabeza: 9, brazo: 27, antebrazo: 25, muslo: 38, pierna: 37, pie: 12 };
const PISO = 160;

// ---------- Geometría ----------
const rad = (g: number) => (g * Math.PI) / 180;
const gra = (r: number) => (r * 180) / Math.PI;
export const dir = (a: number): P => ({ x: Math.cos(rad(a)), y: Math.sin(rad(a)) });
export const desde = (p: P, a: number, l: number): P => ({ x: p.x + l * Math.cos(rad(a)), y: p.y + l * Math.sin(rad(a)) });
const ang = (a: P, b: P) => gra(Math.atan2(b.y - a.y, b.x - a.x));
const dist = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);

/** Resuelve una extremidad de dos segmentos. Devuelve articulación media y extremo. */
export function resolver(base: P, e: Ext, l1: number, l2: number): [P, P] {
  if ("a" in e) {
    const m = desde(base, e.a, l1);
    return [m, desde(m, e.b, l2)];
  }
  let d = dist(base, e.t);
  d = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const phi = ang(base, e.t);
  const c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const alfa = gra(Math.acos(Math.min(1, Math.max(-1, c))));
  const m = desde(base, phi + e.s * alfa, l1);
  return [m, desde(m, ang(m, e.t), l2)];
}

// ---------- Interpolación ----------
type Num = number | { [k: string]: Num } | undefined;
function lerp<T>(a: T, b: T, t: number): T {
  if (typeof a === "number" && typeof b === "number") return (a + (b - a) * t) as T;
  if (a && b && typeof a === "object" && typeof b === "object") {
    const r: Record<string, Num> = {};
    for (const k of Object.keys(a)) {
      const va = (a as Record<string, Num>)[k];
      const vb = (b as Record<string, Num>)[k];
      r[k] = vb === undefined ? va : lerp(va, vb, t);
    }
    return r as T;
  }
  return a;
}
const suave = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

export function duracion(an: Anim): number {
  return (an.frames as Frame<unknown>[]).reduce((s, f) => s + f.pausa + f.mover, 0);
}

/** Pose en el instante `ms` (en bucle). */
export function poseEn(an: Anim, ms: number): PoseLado | PoseFrente {
  const frames = an.frames as Frame<PoseLado | PoseFrente>[];
  let t = ms % duracion(an);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const sig = frames[(i + 1) % frames.length];
    if (t < f.pausa) return f.p;
    t -= f.pausa;
    if (t < f.mover) return lerp(f.p, sig.p, suave(t / f.mover));
    t -= f.mover;
  }
  return frames[0].p;
}

// ---------- Dibujo ----------
export type Trazo =
  | { k: "linea"; a: P; b: P; w: number; c: "cuerpo" | "lejos" | "equipo" | "banco" }
  | { k: "circulo"; c0: P; r: number; c: "cuerpo" | "lejos" | "equipo" | "banco"; relleno?: boolean }
  | { k: "rect"; x: number; y: number; w: number; h: number; c: "banco" | "equipo" };

function escenaTrazos(es: Escena[] = []): Trazo[] {
  const r: Trazo[] = [];
  for (const e of es) {
    if (e.tipo === "banco") {
      r.push({ k: "rect", x: e.x, y: e.y, w: e.w, h: 7, c: "banco" });
      r.push({ k: "linea", a: { x: e.x + 8, y: e.y + 7 }, b: { x: e.x + 8, y: PISO }, w: 4, c: "banco" });
      r.push({ k: "linea", a: { x: e.x + e.w - 8, y: e.y + 7 }, b: { x: e.x + e.w - 8, y: PISO }, w: 4, c: "banco" });
    } else if (e.tipo === "inclinado") {
      r.push({ k: "rect", x: e.x, y: e.y, w: e.w, h: 7, c: "banco" });
      const ini = { x: e.x + 4, y: e.y + 3 };
      r.push({ k: "linea", a: ini, b: desde(ini, e.ang, e.largo), w: 8, c: "banco" });
      r.push({ k: "linea", a: { x: e.x + e.w - 6, y: e.y + 7 }, b: { x: e.x + e.w - 6, y: PISO }, w: 4, c: "banco" });
      r.push({ k: "linea", a: { x: e.x + 6, y: e.y + 7 }, b: { x: e.x + 6, y: PISO }, w: 4, c: "banco" });
    } else if (e.tipo === "tabla") {
      r.push({ k: "rect", x: e.x, y: PISO - 6, w: e.w, h: 6, c: "banco" });
    }
  }
  return r;
}

function objetoTrazos(o: Objeto, p: P, lejos = false): Trazo[] {
  const c = lejos ? "lejos" : "equipo";
  if (o.tipo === "barra")
    return [
      { k: "circulo", c0: p, r: 13, c, relleno: true },
      { k: "circulo", c0: p, r: 3, c: "banco", relleno: true },
    ];
  return [
    { k: "circulo", c0: p, r: 6.5, c, relleno: true },
    { k: "circulo", c0: p, r: 2, c: "banco", relleno: true },
  ];
}

export function trazos(an: Anim, pose: PoseLado | PoseFrente): Trazo[] {
  const r: Trazo[] = [...escenaTrazos(an.escena)];
  if (an.vista === "lado") {
    const p = pose as PoseLado;
    const hombro = desde(p.cadera, p.torso, L.torso);
    const cabeza = desde(hombro, p.cuello ?? p.torso, L.cuello);
    const [codo, mano] = resolver(hombro, p.brazo, L.brazo, L.antebrazo);
    const [codo2, mano2] = resolver(hombro, p.brazo2 ?? p.brazo, L.brazo, L.antebrazo);
    const [rod, tob] = resolver(p.cadera, p.pierna, L.muslo, L.pierna);
    const [rod2, tob2] = resolver(p.cadera, p.pierna2 ?? p.pierna, L.muslo, L.pierna);
    const punta = desde(tob, p.pie ?? 0, L.pie);
    const punta2 = desde(tob2, p.pie2 ?? p.pie ?? 0, L.pie);
    // Lado lejano
    r.push({ k: "linea", a: p.cadera, b: rod2, w: 7, c: "lejos" });
    r.push({ k: "linea", a: rod2, b: tob2, w: 7, c: "lejos" });
    r.push({ k: "linea", a: tob2, b: punta2, w: 5, c: "lejos" });
    r.push({ k: "linea", a: hombro, b: codo2, w: 6, c: "lejos" });
    r.push({ k: "linea", a: codo2, b: mano2, w: 6, c: "lejos" });
    if (an.objeto?.en === "manos") r.push(...objetoTrazos(an.objeto, mano2, true));
    // Cuerpo
    r.push({ k: "linea", a: p.cadera, b: hombro, w: 10, c: "cuerpo" });
    r.push({ k: "circulo", c0: cabeza, r: L.cabeza, c: "cuerpo", relleno: true });
    r.push({ k: "linea", a: p.cadera, b: rod, w: 8, c: "cuerpo" });
    r.push({ k: "linea", a: rod, b: tob, w: 7, c: "cuerpo" });
    r.push({ k: "linea", a: tob, b: punta, w: 5, c: "cuerpo" });
    if (an.objeto?.en === "obj" && p.obj) r.push(...objetoTrazos(an.objeto, p.obj));
    r.push({ k: "linea", a: hombro, b: codo, w: 7, c: "cuerpo" });
    r.push({ k: "linea", a: codo, b: mano, w: 6, c: "cuerpo" });
    if (an.objeto && an.objeto.en !== "obj") r.push(...objetoTrazos(an.objeto, mano));
  } else {
    const p = pose as PoseFrente;
    const espejo = (e: Ext): Ext =>
      "a" in e ? { a: 180 - e.a, b: 180 - e.b } : { t: { x: 2 * p.cx - e.t.x, y: e.t.y }, s: (-e.s) as 1 | -1 };
    const hD = { x: p.cx + 15, y: p.hombro };
    const hI = { x: p.cx - 15, y: p.hombro };
    const cD = { x: p.cx + 8, y: p.cadera };
    const cI = { x: p.cx - 8, y: p.cadera };
    for (const [cad, e, lado] of [
      [cD, p.pierna, 1],
      [cI, espejo(p.pierna), -1],
    ] as [P, Ext, number][]) {
      const [rod, tob] = resolver(cad, e, L.muslo, L.pierna);
      r.push({ k: "linea", a: cad, b: rod, w: 8, c: "cuerpo" });
      r.push({ k: "linea", a: rod, b: tob, w: 7, c: "cuerpo" });
      r.push({ k: "linea", a: tob, b: { x: tob.x + 7 * lado, y: tob.y }, w: 5, c: "cuerpo" });
    }
    r.push({ k: "linea", a: cI, b: cD, w: 8, c: "cuerpo" });
    r.push({ k: "linea", a: { x: p.cx, y: p.cadera }, b: { x: p.cx, y: p.hombro }, w: 16, c: "cuerpo" });
    r.push({ k: "linea", a: hI, b: hD, w: 9, c: "cuerpo" });
    r.push({ k: "circulo", c0: { x: p.cx, y: p.cabeza ?? p.hombro - L.cuello }, r: L.cabeza, c: "cuerpo", relleno: true });
    for (const [h, e] of [
      [hD, p.brazo],
      [hI, espejo(p.brazo)],
    ] as [P, Ext][]) {
      const [codo, mano] = resolver(h, e, L.brazo, L.antebrazo);
      r.push({ k: "linea", a: h, b: codo, w: 7, c: "cuerpo" });
      r.push({ k: "linea", a: codo, b: mano, w: 6, c: "cuerpo" });
      if (an.objeto) r.push(...objetoTrazos(an.objeto, mano));
    }
  }
  return r;
}

// ---------- Ayudas para armar poses ----------
const hombroDe = (cadera: P, torso: number) => desde(cadera, torso, L.torso);
/** Punto sobre el torso (fracción desde la cadera) desplazado hacia el frente (+) o la espalda (−). */
const sobreTorso = (cadera: P, torso: number, f: number, frente: number) =>
  desde(desde(cadera, torso, L.torso * f), torso + 90, frente);
const abajo = (p: P, l: number): P => ({ x: p.x, y: p.y + l });
const f = <T>(p: T, pausa: number, mover: number): Frame<T> => ({ p, pausa, mover });

// Banco plano en el que se acuesta la figura (cabeza a la izquierda).
const BANCO_PLANO: Escena = { tipo: "banco", x: 40, y: 111, w: 120 };
const acostado = (brazo: Ext): PoseLado => ({
  cadera: { x: 138, y: 104 },
  torso: 180,
  brazo,
  pierna: { t: { x: 182, y: 158 }, s: -1 },
});

function flexion(phi: number, manoX: number): PoseLado {
  const tob = { x: 44, y: 149 };
  const cadera = desde(tob, -phi, L.muslo + L.pierna);
  return {
    cadera,
    torso: -phi,
    brazo: { t: { x: manoX, y: PISO - 6 }, s: 1 },
    pierna: { a: 180 - phi, b: 180 - phi },
    pie: 95,
  };
}

function sentadilla(cadera: P, torso: number, barra: boolean): PoseLado {
  const h = hombroDe(cadera, torso);
  if (barra) {
    const obj = desde(h, torso - 90, 7);
    return {
      cadera, torso, obj,
      brazo: { t: desde(obj, torso + 90, 3), s: 1 },
      pierna: { t: { x: 112, y: 155 }, s: -1 },
    };
  }
  return {
    cadera, torso,
    brazo: { t: sobreTorso(cadera, torso, 0.72, 14), s: 1 },
    pierna: { t: { x: 112, y: 155 }, s: -1 },
  };
}

function remoInclinado(arriba: boolean): PoseLado {
  const cadera = { x: 88, y: 95 };
  const torso = -40;
  const h = hombroDe(cadera, torso);
  return {
    cadera, torso,
    brazo: { t: arriba ? sobreTorso(cadera, torso, 0.32, 11) : abajo(h, 51.5), s: 1 },
    pierna: { t: { x: 112, y: 155 }, s: -1 },
  };
}

function hipThrust(cadera: P): PoseLado {
  const hombro = { x: 88, y: 110 };
  const torso = ang(cadera, hombro);
  const obj = { x: cadera.x, y: cadera.y - 12 };
  return {
    cadera, torso, cuello: torso + 25, obj,
    brazo: { t: { x: obj.x - 4, y: obj.y }, s: 1 },
    pierna: { t: { x: 174, y: 155 }, s: -1 },
  };
}

function gemelos(pie: number): PoseLado {
  const punta = { x: 132, y: 159 };
  const tob = desde(punta, pie + 180, L.pie);
  const cadera = { x: tob.x, y: tob.y - L.muslo - L.pierna };
  return {
    cadera, torso: -90, pie,
    brazo: { a: 91, b: 90 },
    pierna: { a: 90, b: 90 },
  };
}

const parado = (brazo: Ext, extra: Partial<PoseLado> = {}): PoseLado => ({
  cadera: { x: 114, y: 84 },
  torso: -90,
  brazo,
  pierna: { t: { x: 116, y: 155 }, s: -1 },
  ...extra,
});

const sentado = (brazo: Ext): PoseLado => ({
  cadera: { x: 105, y: 112 },
  torso: -90,
  brazo,
  pierna: { t: { x: 150, y: 155 }, s: -1 },
});

const frente = (brazo: Ext, extra: Partial<PoseFrente> = {}): PoseFrente => ({
  cx: 120, cadera: 85, hombro: 37, brazo, pierna: { a: 87, b: 89 }, ...extra,
});

// ---------- Catálogo ----------
const pressBanca = (barra: boolean): Anim => ({
  vista: "lado",
  escena: [BANCO_PLANO],
  objeto: { tipo: barra ? "barra" : "mancuerna", en: "manos" },
  frames: [
    f(acostado({ t: { x: 92, y: 53 }, s: 1 }), 400, 1600),
    f(acostado({ t: { x: 99, y: barra ? 94 : 100 }, s: 1 }), 250, 1000),
  ],
});

const curl = (objeto: "barra" | "mancuerna", bajar: number): Anim => ({
  vista: "lado",
  objeto: { tipo: objeto, en: "manos" },
  frames: [
    f(parado({ a: 92, b: 86 }), 350, 1000),
    f(parado({ a: 90, b: -62 }), 300, bajar),
  ],
});

const zancada: Anim = {
  vista: "lado",
  objeto: { tipo: "mancuerna", en: "manos" },
  frames: [
    f({ cadera: { x: 108, y: 90 }, torso: -88, brazo: { a: 91, b: 90 }, pierna: { t: { x: 145, y: 155 }, s: -1 }, pierna2: { t: { x: 66, y: 152 }, s: 1 }, pie2: 35 }, 400, 2500),
    f({ cadera: { x: 105, y: 121 }, torso: -86, brazo: { a: 91, b: 90 }, pierna: { t: { x: 145, y: 155 }, s: -1 }, pierna2: { t: { x: 66, y: 152 }, s: 1 }, pie2: 35 }, 250, 1200),
  ],
};

const flexiones = (manoX: number): Anim => ({
  vista: "lado",
  escena: [{ tipo: "tabla", x: manoX - 18, w: 36 }],
  frames: [f(flexion(25, manoX), 350, 1400), f(flexion(9, manoX), 200, 1000)],
});

const remo = (objeto: "barra" | "mancuerna", pausa: number): Anim => ({
  vista: "lado",
  objeto: { tipo: objeto, en: "manos" },
  frames: [f(remoInclinado(false), 400, 900), f(remoInclinado(true), pausa, 1300)],
});

export const ANIMACIONES: Record<string, Anim> = {
  "press-banca": pressBanca(false),
  "press-banca-barra": pressBanca(true),
  flexiones: flexiones(156),
  "flexiones-cerradas": flexiones(150),
  "press-inclinado": {
    vista: "lado",
    escena: [{ tipo: "inclinado", x: 124, y: 117, w: 40, ang: -145, largo: 74 }],
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [
      f({ cadera: { x: 140, y: 110 }, torso: -145, cuello: -135, brazo: { t: { x: 104, y: 33 }, s: 1 }, pierna: { t: { x: 184, y: 155 }, s: -1 } }, 400, 1600),
      f({ cadera: { x: 140, y: 110 }, torso: -145, cuello: -135, brazo: { t: { x: 109, y: 76 }, s: 1 }, pierna: { t: { x: 184, y: 155 }, s: -1 } }, 250, 1000),
    ],
  },
  "press-militar": {
    vista: "lado",
    escena: [{ tipo: "banco", x: 70, y: 118, w: 80 }],
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [
      f(sentado({ t: { x: 112, y: 65 }, s: 1 }), 300, 1000),
      f(sentado({ t: { x: 108, y: 15 }, s: 1 }), 350, 1500),
    ],
  },
  laterales: {
    vista: "frente",
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [f(frente({ a: 80, b: 84 }), 300, 1100), f(frente({ a: 0, b: 8 }), 250, 1500)],
  },
  "extension-triceps": {
    vista: "lado",
    escena: [{ tipo: "banco", x: 70, y: 118, w: 80 }],
    objeto: { tipo: "mancuerna", en: "mano" },
    frames: [
      f({ ...sentado({ a: -76, b: -86 }), brazo2: { a: -76, b: -86 } }, 400, 1600),
      f({ ...sentado({ a: -76, b: 125 }), brazo2: { a: -76, b: 125 } }, 250, 1000),
    ],
  },
  "sentadilla-copa": {
    vista: "lado",
    objeto: { tipo: "mancuerna", en: "mano" },
    frames: [f(sentadilla({ x: 109, y: 84 }, -88, false), 400, 1700), f(sentadilla({ x: 84, y: 122 }, -62, false), 200, 1200)],
  },
  "sentadilla-barra": {
    vista: "lado",
    objeto: { tipo: "barra", en: "obj" },
    frames: [f(sentadilla({ x: 109, y: 84 }, -86, true), 400, 1700), f(sentadilla({ x: 82, y: 122 }, -52, true), 200, 1200)],
  },
  "peso-muerto": {
    vista: "lado",
    objeto: { tipo: "barra", en: "manos" },
    frames: [
      f({ cadera: { x: 108, y: 85 }, torso: -86, brazo: { a: 93, b: 91 }, pierna: { t: { x: 112, y: 155 }, s: -1 } }, 400, 1800),
      f({ cadera: { x: 80, y: 93 }, torso: -20, brazo: { a: 93, b: 91 }, pierna: { t: { x: 112, y: 155 }, s: -1 } }, 250, 1300),
    ],
  },
  bulgara: {
    vista: "lado",
    escena: [{ tipo: "banco", x: 28, y: 122, w: 62 }],
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [
      f({ cadera: { x: 120, y: 90 }, torso: -87, brazo: { a: 91, b: 90 }, pierna: { t: { x: 148, y: 155 }, s: -1 }, pierna2: { t: { x: 76, y: 117 }, s: 1 }, pie2: 180 }, 400, 2500),
      f({ cadera: { x: 113, y: 121 }, torso: -82, brazo: { a: 91, b: 90 }, pierna: { t: { x: 148, y: 155 }, s: -1 }, pierna2: { t: { x: 76, y: 117 }, s: 1 }, pie2: 180 }, 250, 1200),
    ],
  },
  zancada,
  "hip-thrust": {
    vista: "lado",
    escena: [{ tipo: "banco", x: 28, y: 116, w: 64 }],
    objeto: { tipo: "barra", en: "obj" },
    frames: [f(hipThrust({ x: 122, y: 140 }), 300, 1100), f(hipThrust({ x: 135, y: 108 }), 1000, 1300)],
  },
  gemelos: {
    vista: "lado",
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [f(gemelos(0), 1000, 900), f(gemelos(38), 1000, 1100)],
  },
  "remo-barra": remo("barra", 300),
  "remo-mancuernas": remo("mancuerna", 1000),
  "remo-una-mano": {
    vista: "lado",
    escena: [{ tipo: "banco", x: 30, y: 122, w: 112 }],
    objeto: { tipo: "mancuerna", en: "mano" },
    frames: [
      f({ cadera: { x: 80, y: 84 }, torso: -14.5, brazo: { t: { x: 125, y: 123 }, s: 1 }, brazo2: { t: { x: 128, y: 122 }, s: 1 }, pierna: { t: { x: 66, y: 155 }, s: 1 }, pierna2: { a: 90, b: 180 }, pie2: 120 }, 400, 1000),
      f({ cadera: { x: 80, y: 84 }, torso: -14.5, brazo: { t: { x: 100, y: 92 }, s: -1 }, brazo2: { t: { x: 128, y: 122 }, s: 1 }, pierna: { t: { x: 66, y: 155 }, s: 1 }, pierna2: { a: 90, b: 180 }, pie2: 120 }, 300, 1400),
    ],
  },
  "remo-menton": {
    vista: "frente",
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [f(frente({ t: { x: 125, y: 88 }, s: -1 }), 300, 1200), f(frente({ t: { x: 126, y: 48 }, s: -1 }), 250, 1500)],
  },
  "face-pull": {
    vista: "frente",
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [f(frente({ a: 92, b: 92 }), 300, 1200), f(frente({ a: -4, b: -82 }), 600, 1400)],
  },
  pajaros: {
    vista: "frente",
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [
      f(frente({ a: 88, b: 88 }, { hombro: 66, cabeza: 72, cadera: 88, pierna: { a: 84, b: 93 } }), 300, 1200),
      f(frente({ a: 2, b: 8 }, { hombro: 66, cabeza: 72, cadera: 88, pierna: { a: 84, b: 93 } }), 300, 1500),
    ],
  },
  "curl-barra": curl("barra", 1500),
  "curl-martillo": curl("mancuerna", 2000),
  "curl-mancuernas": curl("mancuerna", 1500),
  "press-frances": {
    vista: "lado",
    escena: [BANCO_PLANO],
    objeto: { tipo: "mancuerna", en: "manos" },
    frames: [f(acostado({ a: -100, b: -95 }), 350, 1600), f(acostado({ a: -100, b: 165 }), 250, 1000)],
  },
  plancha: {
    vista: "lado",
    frames: [
      f({ cadera: desde({ x: 44, y: 149 }, -8.4, 75), torso: -8.4, brazo: { a: 90, b: 0 }, pierna: { a: 171.6, b: 171.6 }, pie: 95 }, 900, 1400),
      f({ cadera: desde({ x: 44, y: 149 }, -9.2, 75), torso: -8.4, brazo: { a: 90, b: 0 }, pierna: { a: 170.8, b: 170.8 }, pie: 95 }, 900, 1400),
    ],
  },
  "elevaciones-piernas": {
    vista: "lado",
    frames: [
      f({ cadera: { x: 130, y: 153 }, torso: 180, brazo: { a: 2, b: 0 }, pierna: { a: -6, b: -6 }, pie: -86 }, 300, 1400),
      f({ cadera: { x: 130, y: 153 }, torso: 180, brazo: { a: 2, b: 0 }, pierna: { a: -86, b: -86 }, pie: -170 }, 300, 1800),
    ],
  },
  caminata: {
    vista: "lado",
    frames: [
      f({ cadera: { x: 120, y: 86 }, torso: -88, brazo: { a: 110, b: 80 }, brazo2: { a: 70, b: 40 }, pierna: { a: 68, b: 92 }, pierna2: { a: 110, b: 115 } }, 0, 600),
      f({ cadera: { x: 120, y: 84 }, torso: -88, brazo: { a: 70, b: 40 }, brazo2: { a: 110, b: 80 }, pierna: { a: 110, b: 115 }, pierna2: { a: 68, b: 92 } }, 0, 600),
    ],
  },
};
