// Datos guardados en el teléfono (localStorage). Sin cuentas ni servidor.
import { getDia, type Carga, type Ejercicio, type Movimiento } from "./rutina";

export type Registro = { peso: number; reps: number; key: string; t: number };

/** Un ejercicio dentro de una sesión en curso. */
export type Bloque = {
  ejId: string;
  /** Variante elegida por parte (índice). */
  variante: number[];
  /** registros[parte][serie] */
  registros: Registro[][];
};

export type Fase =
  | { tipo: "calentamiento" }
  | { tipo: "serie" }
  | { tipo: "descanso"; fin: number; total: number }
  | { tipo: "fin" };

export type SesionActiva = {
  id: string;
  dia: number;
  seleccion5: string[];
  inicio: number;
  /** Milisegundos acumulados en pausa (no cuentan en la duración). */
  pausado: number;
  pausaDesde: number | null;
  /** Segundos de descanso que quedaban al pausar. */
  restantePausa: number | null;
  ultimaActividad: number;
  bloques: Bloque[];
  i: number;
  /** Parte actual en superserie (0/1). */
  parte: number;
  fase: Fase;
  caminataHecha?: boolean;
};

export type EjercicioGuardado = {
  key: string;
  nombre: string;
  ejId: string;
  repMin: number;
  repMax: number;
  seriesPlan: number;
  carga: Carga;
  unidad?: "reps" | "s";
  series: { peso: number; reps: number }[];
  /** Llegó al tope del rango en todas las series planeadas. */
  tope: boolean;
};

export type SesionGuardada = {
  id: string;
  dia: number;
  inicio: number;
  fin: number;
  duracionMs: number;
  ejercicios: EjercicioGuardado[];
};

export type Prefs = {
  paso: number;
  seleccion5: string[];
  variantes: Record<string, number[]>;
};

const K_HIST = "entreno:v1:historial";
const K_ACTIVA = "entreno:v1:activa";
const K_PREFS = "entreno:v1:prefs";

function leer<T>(k: string, def: T): T {
  if (typeof window === "undefined") return def;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : def;
  } catch {
    return def;
  }
}
function escribir(k: string, v: unknown) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export const cargarHistorial = () => leer<SesionGuardada[]>(K_HIST, []);
export const guardarHistorial = (h: SesionGuardada[]) => escribir(K_HIST, h);
export const cargarActiva = () => leer<SesionActiva | null>(K_ACTIVA, null);
export const guardarActiva = (s: SesionActiva | null) => escribir(K_ACTIVA, s);
export const cargarPrefs = (): Prefs =>
  ({ paso: 1, seleccion5: [], variantes: {}, ...leer<Partial<Prefs>>(K_PREFS, {}) }) as Prefs;
export const guardarPrefs = (p: Prefs) => escribir(K_PREFS, p);

// ---------- Utilidades de la sesión ----------
export function ejerciciosDe(s: { dia: number; seleccion5: string[] }): Ejercicio[] {
  return getDia(s.dia, s.seleccion5).ejercicios;
}

export function movDe(ej: Ejercicio, b: Bloque, parte: number): Movimiento {
  const p = ej.partes[parte];
  return p.variantes[Math.min(b.variante[parte] ?? 0, p.variantes.length - 1)].mov;
}

/** Rondas completas de un bloque (una ronda = todas sus partes). */
export function rondas(b: Bloque): number {
  return Math.min(...b.registros.map((r) => r.length));
}

export function nuevaSesion(dia: number, seleccion5: string[], prefs: Prefs): SesionActiva {
  const ejs = getDia(dia, seleccion5).ejercicios;
  const ahora = Date.now();
  return {
    id: `s${ahora}`,
    dia,
    seleccion5,
    inicio: ahora,
    pausado: 0,
    pausaDesde: null,
    restantePausa: null,
    ultimaActividad: ahora,
    bloques: ejs.map((e) => ({
      ejId: e.id,
      variante: e.partes.map((p, i) => Math.min(prefs.variantes[e.id]?.[i] ?? 0, p.variantes.length - 1)),
      registros: e.partes.map(() => []),
    })),
    i: 0,
    parte: 0,
    fase: { tipo: "calentamiento" },
  };
}

export function duracionMs(s: SesionActiva, ahora = Date.now()): number {
  const pausaActual = s.pausaDesde ? ahora - s.pausaDesde : 0;
  return Math.max(0, ahora - s.inicio - s.pausado - pausaActual);
}

// ---------- Historial ----------
/** Último registro de un movimiento; prefiere el mismo día de rutina. */
export function ultimaVez(hist: SesionGuardada[], key: string, dia?: number): { ses: SesionGuardada; ej: EjercicioGuardado } | null {
  let otro: { ses: SesionGuardada; ej: EjercicioGuardado } | null = null;
  for (let i = hist.length - 1; i >= 0; i--) {
    const ses = hist[i];
    const ej = ses.ejercicios.find((e) => e.key === key && e.series.length > 0);
    if (!ej) continue;
    if (dia === undefined || ses.dia === dia) return { ses, ej };
    if (!otro) otro = { ses, ej };
  }
  return otro;
}

export function fmtPeso(p: number): string {
  return Number.isInteger(p) ? `${p}` : p.toFixed(p * 10 === Math.round(p * 10) ? 1 : 2);
}

/** "20 kg x 8, 8, 7, 7" (agrupa por peso). */
export function fmtSeries(series: { peso: number; reps: number }[], carga: Carga, unidad?: "reps" | "s"): string {
  if (!series.length) return "—";
  const u = unidad === "s" ? " s" : "";
  const grupos: { peso: number; reps: number[] }[] = [];
  for (const s of series) {
    const g = grupos[grupos.length - 1];
    if (g && g.peso === s.peso) g.reps.push(s.reps);
    else grupos.push({ peso: s.peso, reps: [s.reps] });
  }
  return grupos
    .map((g) => {
      const reps = g.reps.join(", ") + u;
      if (carga === "tiempo") return reps;
      if (carga === "corporal") return g.peso > 0 ? `+${fmtPeso(g.peso)} kg x ${reps}` : `${reps} reps`;
      return `${fmtPeso(g.peso)} kg x ${reps}`;
    })
    .join(" · ");
}

/** Puntaje para comparar marcas del mismo movimiento (1RM estimado; sin peso cuenta reps). */
export function puntaje(peso: number, reps: number): number {
  return peso > 0 ? peso * (1 + reps / 30) : reps / 1000;
}

export function mejorHistorica(hist: SesionGuardada[], key: string, excluir?: string): number {
  let m = 0;
  for (const s of hist) {
    if (s.id === excluir) continue;
    for (const e of s.ejercicios) if (e.key === key) for (const r of e.series) m = Math.max(m, puntaje(r.peso, r.reps));
  }
  return m;
}

/** Convierte la sesión en curso en una sesión guardada. */
export function cerrarSesion(s: SesionActiva, ahora = Date.now()): SesionGuardada {
  const ejs = ejerciciosDe(s);
  const ejercicios: EjercicioGuardado[] = [];
  s.bloques.forEach((b, bi) => {
    const ej = ejs[bi];
    if (!ej) return;
    ej.partes.forEach((_, pi) => {
      const regs = b.registros[pi] ?? [];
      // Agrupar por movimiento (si cambiaste de variante a mitad del ejercicio).
      const keys = [...new Set(regs.map((r) => r.key))];
      if (!keys.length) return;
      for (const key of keys) {
        const mov = ej.partes[pi].variantes.find((v) => v.mov.key === key)?.mov ?? movDe(ej, b, pi);
        const series = regs.filter((r) => r.key === key).map((r) => ({ peso: r.peso, reps: r.reps }));
        ejercicios.push({
          key,
          nombre: mov.nombre,
          ejId: ej.id,
          repMin: ej.repMin,
          repMax: ej.repMax,
          seriesPlan: ej.series,
          carga: mov.carga,
          unidad: ej.unidad,
          series,
          tope: series.length >= ej.series && series.every((r) => r.reps >= ej.repMax),
        });
      }
    });
  });
  return { id: s.id, dia: s.dia, inicio: s.inicio, fin: ahora, duracionMs: duracionMs(s, ahora), ejercicios };
}

// ---------- Fechas ----------
export function lunesDe(t: number): Date {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_SEM = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export function fmtFecha(t: number): string {
  const d = new Date(t);
  return `${DIAS_SEM[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}
export function fmtFechaCorta(t: number): string {
  const d = new Date(t);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}
export function fmtDuracion(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}
export function fmtReloj(seg: number): string {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
