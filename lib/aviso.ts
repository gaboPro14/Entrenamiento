// Sonido y vibración del temporizador. El audio se «desbloquea» con un toque del usuario.
let ctx: AudioContext | null = null;

export function prepararAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    /* sin audio */
  }
}

function tono(frec: number, inicio: number, dur: number, vol = 0.35) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.value = frec;
  const t0 = ctx.currentTime + inicio;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** Pitido corto (cuenta regresiva 3-2-1). */
export function tic() {
  prepararAudio();
  tono(880, 0, 0.12, 0.2);
  try { navigator.vibrate?.(60); } catch { /* */ }
}

/** Fin del descanso: tres pitidos y vibración larga. */
export function alarma() {
  prepararAudio();
  tono(1046, 0, 0.22);
  tono(1046, 0.3, 0.22);
  tono(1318, 0.6, 0.5);
  try { navigator.vibrate?.([300, 150, 300, 150, 600]); } catch { /* */ }
}
