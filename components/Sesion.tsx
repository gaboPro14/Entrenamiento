"use client";

import { useEffect, useRef, useState } from "react";
import Animacion from "./Animacion";
import Contador from "./Contador";
import Resumen from "./Resumen";
import {
  duracionMs, ejerciciosDe, fmtFechaCorta, fmtReloj, fmtSeries, movDe, rondas, ultimaVez,
  type Prefs, type SesionActiva, type SesionGuardada,
} from "@/lib/datos";
import { REGLAS, DIA5_CONDICION, textoReps, tituloDia, type Ejercicio, type Movimiento } from "@/lib/rutina";
import {
  cambiarVariante, deshacer, empezarSeries, irA, mas30, pausar, reanudar, registrarSerie, terminar, terminarDescanso, totalSeries,
} from "@/lib/sesion";
import { alarma, prepararAudio, tic } from "@/lib/aviso";
import { usePantallaEncendida } from "@/lib/wakelock";

type Props = {
  s: SesionActiva;
  setS: (s: SesionActiva) => void;
  hist: SesionGuardada[];
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  onListo: () => void;
};

const ETIQUETA_PESO: Record<string, string> = {
  mancuernas: "Peso por mancuerna",
  mancuerna: "Peso de la mancuerna",
  barra: "Peso total (barra + discos)",
  corporal: "Peso extra (mochila)",
};

function textoObjetivo(ej: Ejercicio) {
  const u = ej.unidad === "s" ? "s" : "reps";
  return `${ej.repMin}-${ej.repMax} ${u}${ej.porLado ? ` por ${ej.porLado}` : ""}`;
}

export default function Sesion({ s, setS, hist, prefs, setPrefs, onListo }: Props) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [menu, setMenu] = useState(false);
  const [transicion, setTransicion] = useState<{ ej: Ejercicio; mov: Movimiento; tope: string | null } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [entrada, setEntrada] = useState<{ clave: string; peso: number; reps: number } | null>(null);
  const [crono, setCrono] = useState<number | null>(null);
  const [calent, setCalent] = useState<number | null>(null);
  const ultimoTic = useRef<number>(-1);

  const ejs = ejerciciosDe(s);
  const ej = ejs[s.i];
  const b = s.bloques[s.i];
  const mov = movDe(ej, b, s.parte);
  const enPausa = !!s.pausaDesde;

  usePantallaEncendida(s.fase.tipo !== "fin");

  // Reloj de la pantalla
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  // Fin del descanso: pitidos, vibración y a la siguiente serie
  useEffect(() => {
    if (s.fase.tipo !== "descanso" || enPausa) return;
    const resta = (s.fase.fin - ahora) / 1000;
    const seg = Math.ceil(resta);
    if (resta <= 0) {
      alarma();
      ultimoTic.current = -1;
      setS(terminarDescanso(s));
      setAviso("Descanso terminado. ¡Vamos!");
      return;
    }
    if (seg <= 3 && seg !== ultimoTic.current) {
      ultimoTic.current = seg;
      tic();
    }
  }, [ahora, s, enPausa, setS]);

  // Calentamiento con temporizador opcional
  useEffect(() => {
    if (calent && ahora >= calent) {
      alarma();
      setCalent(null);
      setAviso("Calentamiento listo. Primera serie efectiva.");
    }
  }, [ahora, calent]);

  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(id);
  }, [aviso]);

  useEffect(() => {
    if (!transicion) return;
    const id = setTimeout(() => setTransicion(null), 3200);
    return () => clearTimeout(id);
  }, [transicion]);

  if (s.fase.tipo === "fin") return <Resumen s={s} hist={hist} onListo={onListo} />;

  // ---------- Sugerencia de peso y reps ----------
  const regsParte = b.registros[s.parte];
  const nSerie = regsParte.length; // índice de la serie actual
  const previa = ultimaVez(hist, mov.key, s.dia);
  const enEsta = regsParte.filter((r) => r.key === mov.key);
  const sugerido = {
    peso: enEsta.length
      ? enEsta[enEsta.length - 1].peso
      : previa
        ? (previa.ej.series[nSerie] ?? previa.ej.series[previa.ej.series.length - 1]).peso
        : 0,
    reps: previa?.ej.series[nSerie]?.reps ?? (enEsta.length ? enEsta[enEsta.length - 1].reps : ej.repMin),
  };
  const claveSerie = `${s.i}-${s.parte}-${nSerie}-${mov.key}`;
  const val = entrada?.clave === claveSerie ? entrada : { clave: claveSerie, ...sugerido };
  const fijar = (c: Partial<typeof val>) => setEntrada({ ...val, ...c });

  const marcarHecha = () => {
    prepararAudio();
    let reps = val.reps;
    if (mov.carga === "tiempo" && crono) {
      reps = Math.round((Date.now() - crono) / 1000);
      setCrono(null);
    }
    const peso = mov.carga === "tiempo" ? 0 : val.peso;
    const n = registrarSerie(s, peso, reps, mov.key);
    ultimoTic.current = -1;
    if (n.i !== s.i && n.fase.tipo !== "fin") {
      const regs = n.bloques[s.i].registros;
      const tope = regs.every((r) => r.length >= ej.series && r.every((x) => x.reps >= ej.repMax));
      setTransicion({
        ej: ejs[n.i],
        mov: movDe(ejs[n.i], n.bloques[n.i], 0),
        tope: tope ? `${ej.nombre}: llegaste al tope del rango en todas las series. ¡Toca subir peso la próxima vez!` : null,
      });
    } else if (n.parte > s.parte) {
      setAviso(`Sin descanso: ahora ${movDe(ej, b, n.parte).nombre}`);
    }
    setS(n);
  };

  const { hechas, plan } = totalSeries(s);
  const dur = duracionMs(s, ahora);
  const durTxt = fmtReloj(dur / 1000);

  const cabecera = (
    <>
      <div className="barra-sup">
        <div>
          <div className="etiqueta">Día {s.dia} · {tituloDia(s.dia)}</div>
          <div style={{ fontWeight: 800, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>⏱ {durTxt}</div>
        </div>
        <div className="fila" style={{ flex: "none" }}>
          <button className="btn btn-chico" onClick={() => setS(pausar(s))} data-prueba="pausar">Pausar</button>
          <button className="btn btn-chico" onClick={() => setMenu(true)} aria-label="Menú">☰</button>
        </div>
      </div>
      <div className="progreso" aria-label={`${hechas} de ${plan} series`}>
        <div style={{ width: `${plan ? (100 * hechas) / plan : 0}%` }} />
      </div>
      {aviso && <div className="banner azul" data-prueba="aviso">{aviso}</div>}
    </>
  );

  // ---------- Capas: pausa, menú, transición ----------
  const capas = (
    <>
      {enPausa && (
        <div className="capa">
          <div>
            <p className="titulo">Sesión en pausa</p>
            <p className="suave">Lo registrado está guardado. Llevas {durTxt} de entrenamiento.</p>
            <button className="btn btn-primario btn-gigante" onClick={() => setS(reanudar(s))} data-prueba="reanudar">Reanudar</button>
            <button className="btn btn-ancho" onClick={() => { if (confirm("¿Terminar la sesión ahora? Se guarda lo que llevas.")) setS(terminar(reanudar(s))); }}>
              Terminar sesión
            </button>
          </div>
        </div>
      )}
      {menu && (
        <div className="capa" onClick={() => setMenu(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxHeight: "100%", overflowY: "auto" }}>
            <p className="subtitulo">Ejercicios</p>
            {ejs.map((e, j) => {
              const r = rondas(s.bloques[j]);
              return (
                <button key={e.id} className={`check ${j === s.i ? "activo" : ""}`} onClick={() => { setS(irA(s, j)); setMenu(false); }}>
                  <span className="caja">{r >= e.series ? "✓" : ""}</span>
                  <span style={{ flex: 1 }}>{e.nombre}</span>
                  <span className="suave chico">{r}/{e.series}</span>
                </button>
              );
            })}
            <div className="fila">
              <button className="btn" onClick={() => { setS(deshacer(s)); setMenu(false); }} disabled={hechas === 0}>Deshacer última serie</button>
            </div>
            <button className="btn btn-ancho btn-peligro" onClick={() => { if (confirm("¿Terminar la sesión ahora? Se guarda lo que llevas.")) { setS(terminar(s)); setMenu(false); } }}>
              Terminar sesión
            </button>
            <button className="btn btn-ancho" onClick={() => setMenu(false)}>Cerrar</button>
          </div>
        </div>
      )}
      {transicion && (
        <div className="capa" onClick={() => setTransicion(null)} data-prueba="transicion">
          <div className="transicion">
            {transicion.tope && <div className="banner">{transicion.tope}</div>}
            <p className="etiqueta">Siguiente</p>
            <p className="titulo">{transicion.mov.nombre}</p>
            <p className="reps-obj">{textoReps(transicion.ej)}</p>
            <Animacion id={transicion.mov.anim} className="anim-chica" />
            <p className="suave">Descansa, respira. Toca para seguir.</p>
          </div>
        </div>
      )}
    </>
  );

  // ---------- Calentamiento ----------
  if (s.fase.tipo === "calentamiento") {
    const primero = movDe(ejs[0], s.bloques[0], 0);
    return (
      <main className="app">
        {cabecera}
        <p className="titulo">Calentamiento</p>
        <p className="clave">{REGLAS.calentamiento}</p>
        {s.dia === 5 && <p className="error">{DIA5_CONDICION}</p>}
        {calent ? (
          <div className="tarjeta" style={{ textAlign: "center" }}>
            <div className="reloj" style={{ fontSize: 96 }}>{fmtReloj((calent - ahora) / 1000)}</div>
            <button className="btn btn-texto" onClick={() => setCalent(null)}>Quitar temporizador</button>
          </div>
        ) : (
          <div className="fila">
            <button className="btn" onClick={() => { prepararAudio(); setCalent(Date.now() + 5 * 60000); }}>Contar 5 min</button>
            <button className="btn" onClick={() => { prepararAudio(); setCalent(Date.now() + 8 * 60000); }}>Contar 8 min</button>
          </div>
        )}
        <div className="tarjeta">
          <p className="etiqueta">Primer ejercicio</p>
          <p className="subtitulo">{primero.nombre}</p>
          <p className="acento" style={{ fontWeight: 800 }}>{textoReps(ejs[0])}</p>
          <Animacion id={primero.anim} className="anim-chica" />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primario btn-gigante" onClick={() => { prepararAudio(); setCalent(null); setS(empezarSeries(s)); }} data-prueba="listo-calentamiento">
          Listo: primera serie
        </button>
        {capas}
      </main>
    );
  }

  // ---------- Descanso ----------
  if (s.fase.tipo === "descanso") {
    const resta = Math.min(s.fase.total, enPausa ? (s.restantePausa ?? 0) : (s.fase.fin - ahora) / 1000);
    const pct = Math.min(100, Math.max(0, 100 * (1 - resta / s.fase.total)));
    const sigEj = ejs[s.i];
    const sigB = s.bloques[s.i];
    const sigMov = movDe(sigEj, sigB, 0);
    const cambioEj = s.i !== ultimoBloque(s);
    const ult = ultimoRegistro(s);
    return (
      <main className="app">
        {cabecera}
        <div className="descanso" data-prueba="descanso">
          <p className="etiqueta" style={{ textAlign: "center" }}>Descanso · {ejs[ultimoBloque(s)]?.descansoTexto}</p>
          <div className="reloj" data-prueba="reloj">{fmtReloj(resta)}</div>
          <div className="barra-descanso"><div style={{ width: `${pct}%` }} /></div>
          <p className="subtitulo" style={{ textAlign: "center" }}>Descansa, respira.</p>
          <div className="fila">
            <button className="btn" style={{ minHeight: 76 }} onClick={() => setS(mas30(s))} data-prueba="mas30">+30 s</button>
            <button className="btn" style={{ minHeight: 76 }} onClick={() => setS(terminarDescanso(s))} data-prueba="saltar">Saltar descanso</button>
          </div>
          {ult && (
            <p className="suave" style={{ textAlign: "center" }}>
              Hecho: <b style={{ color: "var(--texto)" }}>{fmtSeries([ult], ult.carga, ult.unidad)}</b>
            </p>
          )}
          <div className="tarjeta">
            {cambioEj ? (
              <>
                <p className="etiqueta">Siguiente ejercicio</p>
                <p className="subtitulo">{sigMov.nombre}</p>
                <p className="acento" style={{ fontWeight: 800 }}>{textoReps(sigEj)}</p>
              </>
            ) : (
              <>
                <p className="etiqueta">Siguiente</p>
                <p className="subtitulo">Serie {rondas(sigB) + 1} de {sigEj.series} · {textoObjetivo(sigEj)}</p>
              </>
            )}
            <Animacion id={sigMov.anim} className="anim-chica" />
            <p className="chico" style={{ marginTop: 6 }}>{sigEj.clave}</p>
          </div>
        </div>
        {capas}
      </main>
    );
  }

  // ---------- Serie ----------
  const superserie = ej.partes.length > 1;
  const varianteIdx = b.variante[s.parte] ?? 0;
  const variantes = ej.partes[s.parte].variantes;
  const ref = ej.referencia && mov.key === ej.referencia.key ? ultimaVez(hist, ej.referencia.key, ej.referencia.dia) : null;
  const esTiempo = mov.carga === "tiempo";
  const cronoSeg = crono ? Math.floor((ahora - crono) / 1000) : 0;

  return (
    <main className="app" style={{ paddingBottom: 130 }}>
      {cabecera}
      <div>
        <p className="etiqueta">Ejercicio {s.i + 1} de {ejs.length}</p>
        <h1 className="nombre-ej" data-prueba="nombre-ej">{mov.nombre}</h1>
      </div>
      {superserie && (
        <div className="banner azul">
          Superserie · parte {s.parte + 1} de 2: {s.parte === 0 ? `sigue ${movDe(ej, b, 1).nombre.toLowerCase()} sin descanso` : "al terminar, 90 s de descanso"}
        </div>
      )}
      <div className="entre">
        <span className="serie-grande" data-prueba="serie">Serie {nSerie + 1} de {ej.series}</span>
        <span className="reps-obj">{textoObjetivo(ej)}</span>
      </div>
      {variantes.length > 1 && (
        <div className="variantes" role="group" aria-label="Variante">
          {variantes.map((v, k) => (
            <button
              key={v.mov.key}
              className={k === varianteIdx ? "activo" : ""}
              onClick={() => {
                setS(cambiarVariante(s, s.parte, k));
                const vs = { ...prefs.variantes, [ej.id]: b.variante.map((x, pi) => (pi === s.parte ? k : x)) };
                setPrefs({ ...prefs, variantes: vs });
              }}
            >
              {v.etiqueta}
            </button>
          ))}
        </div>
      )}
      <Animacion id={mov.anim} className="anim" />
      <div>
        <p className="clave" data-prueba="clave">{ej.clave}</p>
        {mov.clave && mov.clave !== ej.clave && <p className="clave" style={{ marginTop: 6 }}>{mov.clave}</p>}
        {mov.error && <p className="error" style={{ marginTop: 6 }}>{mov.error}</p>}
      </div>

      {previa ? (
        <div className="tarjeta" data-prueba="ultima-vez">
          <span className="suave">Última vez ({fmtFechaCorta(previa.ses.inicio)}{previa.ses.dia !== s.dia ? `, Día ${previa.ses.dia}` : ""}): </span>
          <b>{fmtSeries(previa.ej.series, previa.ej.carga, previa.ej.unidad)}</b>
        </div>
      ) : (
        <p className="suave chico">Primera vez con este ejercicio: elige un peso con el que llegues al rango con RIR 1-3.</p>
      )}
      {ref && ref.ses.dia !== previa?.ses.dia && (
        <div className="tarjeta"><span className="suave">Día 1: </span><b>{fmtSeries(ref.ej.series, ref.ej.carga)}</b></div>
      )}
      {previa?.ej.tope && enEsta.length === 0 && (
        <div className="banner" data-prueba="toca-subir">
          La vez pasada llegaste al tope en todas las series: ¡toca subir peso! Sube el menor incremento posible y vuelve a construir repeticiones.
        </div>
      )}
      {regsParte.length > 0 && (
        <div className="registros" aria-label="Series de hoy">
          {regsParte.map((r, k) => (
            <span key={k} className={r.reps >= ej.repMax ? "tope" : ""}>
              {k + 1}: {fmtSeries([r], mov.carga, ej.unidad)}
            </span>
          ))}
        </div>
      )}

      {!esTiempo && (
        <>
          <Contador
            etiqueta={ETIQUETA_PESO[mov.carga]}
            valor={val.peso}
            paso={prefs.paso}
            sufijo="kg"
            max={500}
            onCambio={(v) => fijar({ peso: v })}
            prueba="peso"
          />
          <div className="pasos" aria-label="Incremento">
            {[0.5, 1, 2.5].map((p) => (
              <button key={p} className={prefs.paso === p ? "activo" : ""} onClick={() => setPrefs({ ...prefs, paso: p })}>
                ±{String(p).replace(".", ",")} kg
              </button>
            ))}
          </div>
        </>
      )}
      {esTiempo && (
        <div className="tarjeta" style={{ textAlign: "center" }}>
          {crono ? (
            <>
              <div className="reloj" style={{ fontSize: 96 }}>{cronoSeg}s</div>
              <p className="suave">Aguanta. Toca «Serie hecha» al terminar.</p>
            </>
          ) : (
            <button className="btn btn-ancho" onClick={() => { prepararAudio(); setCrono(Date.now()); }}>Iniciar cronómetro</button>
          )}
        </div>
      )}
      {!(esTiempo && crono) && (
        <Contador
          etiqueta={esTiempo ? "Segundos" : ej.porLado ? `Reps por ${ej.porLado}` : "Repeticiones"}
          valor={val.reps}
          paso={esTiempo ? 5 : 1}
          max={esTiempo ? 600 : 100}
          onCambio={(v) => fijar({ reps: Math.round(v) })}
          prueba="reps"
        />
      )}
      <p className="suave chico">RIR 1-3: termina con 1 a 3 repeticiones en reserva y buena técnica.</p>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 16px calc(env(safe-area-inset-bottom) + 12px)", background: "linear-gradient(transparent, var(--fondo) 30%)" }}>
        <div style={{ maxWidth: 528, margin: "0 auto" }}>
          <button className="btn btn-primario btn-gigante" onClick={marcarHecha} data-prueba="serie-hecha">
            Serie hecha ✓
          </button>
        </div>
      </div>
      {capas}
    </main>
  );
}

type UltimoRegistro = { peso: number; reps: number; t: number; carga: Movimiento["carga"]; unidad?: "reps" | "s" };

function ultimoRegistro(s: SesionActiva): UltimoRegistro | null {
  let mejor: UltimoRegistro | null = null as UltimoRegistro | null;
  const ejs = ejerciciosDe(s);
  s.bloques.forEach((b, bi) =>
    b.registros.forEach((r, pi) => {
      const u = r[r.length - 1];
      if (u && (!mejor || u.t > mejor.t)) {
        const mov = ejs[bi].partes[pi].variantes.find((v) => v.mov.key === u.key)?.mov;
        mejor = { peso: u.peso, reps: u.reps, t: u.t, carga: mov?.carga ?? "mancuernas", unidad: ejs[bi].unidad };
      }
    }),
  );
  return mejor;
}

function ultimoBloque(s: SesionActiva): number {
  let t = -1;
  let idx = s.i;
  s.bloques.forEach((b, bi) => b.registros.forEach((r) => {
    const u = r[r.length - 1];
    if (u && u.t > t) { t = u.t; idx = bi; }
  }));
  return idx;
}
