// Transiciones de la sesión en curso. Funciones puras: reciben la sesión y devuelven otra.
import { ejerciciosDe, rondas, type SesionActiva } from "./datos";

/** Pausa automática si la app estuvo cerrada más de este tiempo. */
const HUECO_PAUSA = 3 * 60 * 1000;

export function empezarSeries(s: SesionActiva): SesionActiva {
  return { ...s, fase: { tipo: "serie" } };
}

export function registrarSerie(s: SesionActiva, peso: number, reps: number, key: string, ahora = Date.now()): SesionActiva {
  const ejs = ejerciciosDe(s);
  const ej = ejs[s.i];
  const bloques = s.bloques.map((b, bi) =>
    bi !== s.i
      ? b
      : { ...b, registros: b.registros.map((r, pi) => (pi === s.parte ? [...r, { peso, reps, key, t: ahora }] : r)) },
  );
  const n = { ...s, bloques, ultimaActividad: ahora };
  // Superserie: de la parte 1 a la 2 sin descanso.
  if (s.parte < ej.partes.length - 1) return { ...n, parte: s.parte + 1, fase: { tipo: "serie" } };
  n.parte = 0;
  const completo = rondas(bloques[s.i]) >= ej.series;
  if (completo) {
    const sig = siguientePendiente(n, s.i);
    if (sig === null) return { ...n, fase: { tipo: "fin" } };
    n.i = sig;
  }
  return { ...n, fase: { tipo: "descanso", fin: ahora + ej.descanso * 1000, total: ej.descanso } };
}

/** Siguiente ejercicio con series pendientes después de `desde` (luego da la vuelta). */
export function siguientePendiente(s: SesionActiva, desde: number): number | null {
  const ejs = ejerciciosDe(s);
  const total = ejs.length;
  for (let k = 1; k <= total; k++) {
    const j = (desde + k) % total;
    if (rondas(s.bloques[j]) < ejs[j].series) return j;
  }
  return null;
}

export function mas30(s: SesionActiva): SesionActiva {
  if (s.fase.tipo !== "descanso") return s;
  if (s.pausaDesde) return { ...s, restantePausa: (s.restantePausa ?? 0) + 30 };
  return { ...s, fase: { ...s.fase, fin: s.fase.fin + 30000, total: s.fase.total + 30 } };
}

export function terminarDescanso(s: SesionActiva): SesionActiva {
  return { ...s, fase: { tipo: "serie" }, restantePausa: null };
}

export function pausar(s: SesionActiva, ahora = Date.now()): SesionActiva {
  if (s.pausaDesde) return s;
  return {
    ...s,
    pausaDesde: ahora,
    restantePausa: s.fase.tipo === "descanso" ? Math.max(0, (s.fase.fin - ahora) / 1000) : null,
  };
}

export function reanudar(s: SesionActiva, ahora = Date.now()): SesionActiva {
  if (!s.pausaDesde) return s;
  const n: SesionActiva = { ...s, pausado: s.pausado + (ahora - s.pausaDesde), pausaDesde: null, restantePausa: null, ultimaActividad: ahora };
  if (s.fase.tipo === "descanso") {
    const resta = s.restantePausa ?? 0;
    n.fase = resta > 0 ? { ...s.fase, fin: ahora + resta * 1000 } : { tipo: "serie" };
  }
  return n;
}

/** Al volver a abrir la app a mitad de sesión. */
export function retomar(s: SesionActiva, ahora = Date.now()): SesionActiva {
  let n = s;
  if (!n.pausaDesde && ahora - n.ultimaActividad > HUECO_PAUSA) n = pausar(n, n.ultimaActividad);
  if (n.pausaDesde) {
    // El descanso que quedó corriendo al cerrar ya no aplica: vuelves a la serie.
    if (n.fase.tipo === "descanso") n = { ...n, fase: { tipo: "serie" }, restantePausa: null };
    return reanudar(n, ahora);
  }
  if (n.fase.tipo === "descanso" && n.fase.fin <= ahora) n = { ...n, fase: { tipo: "serie" } };
  return { ...n, ultimaActividad: ahora };
}

export function irA(s: SesionActiva, i: number): SesionActiva {
  return { ...s, i, parte: 0, fase: { tipo: "serie" } };
}

export function cambiarVariante(s: SesionActiva, parte: number, v: number): SesionActiva {
  return {
    ...s,
    bloques: s.bloques.map((b, bi) => (bi !== s.i ? b : { ...b, variante: b.variante.map((x, pi) => (pi === parte ? v : x)) })),
  };
}

/** Borra la última serie registrada y vuelve a ella. */
export function deshacer(s: SesionActiva): SesionActiva {
  let mejor: { bi: number; pi: number; t: number } | null = null;
  s.bloques.forEach((b, bi) =>
    b.registros.forEach((r, pi) => {
      const ult = r[r.length - 1];
      if (ult && (!mejor || ult.t > mejor.t)) mejor = { bi, pi, t: ult.t };
    }),
  );
  if (!mejor) return s;
  const { bi, pi } = mejor;
  return {
    ...s,
    i: bi,
    parte: pi,
    fase: { tipo: "serie" },
    bloques: s.bloques.map((b, j) => (j !== bi ? b : { ...b, registros: b.registros.map((r, k) => (k === pi ? r.slice(0, -1) : r)) })),
  };
}

export function terminar(s: SesionActiva, ahora = Date.now()): SesionActiva {
  return { ...s, fase: { tipo: "fin" }, ultimaActividad: ahora };
}

export function totalSeries(s: SesionActiva): { hechas: number; plan: number } {
  const ejs = ejerciciosDe(s);
  let hechas = 0;
  let plan = 0;
  s.bloques.forEach((b, i) => {
    plan += (ejs[i]?.series ?? 0) * b.registros.length;
    hechas += b.registros.reduce((a, r) => a + r.length, 0);
  });
  return { hechas, plan };
}
