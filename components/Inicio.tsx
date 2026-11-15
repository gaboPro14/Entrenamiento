"use client";

import { useState } from "react";
import Animacion from "./Animacion";
import { ejerciciosDe, fmtSeries, lunesDe, ultimaVez, type Prefs, type SesionActiva, type SesionGuardada } from "@/lib/datos";
import {
  DIAS, DIA5_CAMINATA, DIA5_CONDICION, DIA5_CORE, DIA5_OPCIONES, REGLAS, SEMANA, getDia, indiceSemana, textoReps, tituloDia,
} from "@/lib/rutina";

type Props = {
  hist: SesionGuardada[];
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  activa: SesionActiva | null;
  onEmpezar: (dia: number, seleccion5: string[]) => void;
  onContinuar: () => void;
  onDescartar: () => void;
  onHistorial: () => void;
  hoy: Date;
};

export default function Inicio({ hist, prefs, setPrefs, activa, onEmpezar, onContinuar, onDescartar, onHistorial, hoy }: Props) {
  const idxHoy = indiceSemana(hoy);
  const planHoy = SEMANA[idxHoy].plan;
  const lunes = lunesDe(hoy.getTime()).getTime();
  const hechosSemana = new Set(hist.filter((s) => s.inicio >= lunes).map((s) => s.dia));
  const sugerido = planHoy.tipo === "dia" ? planHoy.dia : ([1, 2, 3, 4].find((d) => !hechosSemana.has(d)) ?? 1);
  const [dia, setDia] = useState(sugerido);
  const sel5 = prefs.seleccion5;
  const ejs = getDia(dia, sel5).ejercicios;
  const faltan = [1, 2, 3, 4].filter((d) => !hechosSemana.has(d));
  const listo5 = sel5.length >= 3 && sel5.length <= 4;

  const toggle5 = (id: string) => {
    const n = sel5.includes(id) ? sel5.filter((x) => x !== id) : sel5.length < 4 ? [...sel5, id] : sel5;
    setPrefs({ ...prefs, seleccion5: n });
  };

  return (
    <main className="app">
      <div className="entre">
        <div>
          <p className="etiqueta">{SEMANA[idxHoy].nombre} {hoy.getDate()}</p>
          <p className="titulo">Entreno en casa</p>
        </div>
        <button className="btn btn-chico" onClick={onHistorial} data-prueba="ir-historial">Historial</button>
      </div>

      <div className="semana" aria-label="Semana tipo">
        {SEMANA.map((d, k) => {
          const hecho = d.plan.tipo === "dia" && hechosSemana.has(d.plan.dia);
          return (
            <div key={d.nombre} className={`semana-dia ${k === idxHoy ? "hoy" : ""} ${hecho ? "hecho" : ""}`}>
              {d.corto}
              <b>{d.plan.tipo === "dia" ? (hecho ? "✓" : `D${d.plan.dia}`) : d.plan.tipo === "descanso-activo" ? "🚶" : "—"}</b>
            </div>
          );
        })}
      </div>

      {planHoy.tipo === "descanso-activo" && (
        <div className="tarjeta">
          <p className="subtitulo">Hoy: descanso activo</p>
          <p>Caminata de 20-30 minutos. Si hoy quieres recuperar un día que te faltó, elígelo abajo.</p>
          <Animacion id="caminata" className="anim-chica" />
        </div>
      )}
      {planHoy.tipo === "descanso-total" && (
        <div className="tarjeta">
          <p className="subtitulo">Hoy: descanso total</p>
          <p>Recupera. Si hoy quieres recuperar un día que te faltó, elígelo abajo.</p>
        </div>
      )}

      <div>
        <p className="etiqueta" style={{ marginBottom: 6 }}>
          {planHoy.tipo === "dia" ? `Hoy toca: Día ${planHoy.dia}${planHoy.dia === 5 ? " (opcional)" : ""}` : "Elige el día"}
          {faltan.length > 0 && faltan.length < 4 && <span style={{ textTransform: "none", letterSpacing: 0 }}> · te falta: {faltan.map((d) => `D${d}`).join(", ")}</span>}
        </p>
        <div className="selector-dias" role="group" aria-label="Día de rutina">
          {[1, 2, 3, 4, 5].map((d) => (
            <button key={d} className={d === dia ? "activo" : ""} onClick={() => setDia(d)} data-prueba={`dia-${d}`}>
              D{d}
              <small>{hechosSemana.has(d) ? "hecho ✓" : d === 5 ? "opcional" : " "}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta" data-prueba="sesion-elegida">
        <p className="etiqueta">Día {dia}{dia === 5 ? " · opcional" : ""}</p>
        <p className="subtitulo" style={{ marginBottom: 6 }}>{tituloDia(dia)}</p>
        {dia !== 5 ? (
          <ul className="lista-ej">
            {DIAS.find((d) => d.num === dia)!.ejercicios.map((e) => {
              const v = prefs.variantes[e.id]?.[0] ?? 0;
              const mov = e.partes[0].variantes[Math.min(v, e.partes[0].variantes.length - 1)].mov;
              const u = e.partes.length === 1 ? ultimaVez(hist, mov.key, dia) : null;
              return (
                <li key={e.id}>
                  <div>
                    <div style={{ fontWeight: 650 }}>{e.nombre}</div>
                    {u && <div className="suave chico">Última vez: {fmtSeries(u.ej.series, u.ej.carga, u.ej.unidad)}{u.ej.tope ? " · ¡toca subir!" : ""}</div>}
                  </div>
                  <span className="series">{textoReps(e)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            <p className="error" style={{ marginBottom: 8 }}>{DIA5_CONDICION}</p>
            <p style={{ marginBottom: 8 }}>Elige 3-4 de lo que más quieras mejorar (3 series de 12-20):</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DIA5_OPCIONES.map((o) => (
                <button key={o.id} className={`check ${sel5.includes(o.id) ? "activo" : ""}`} onClick={() => toggle5(o.id)} data-prueba={`op-${o.id}`}>
                  <span className="caja">{sel5.includes(o.id) ? "✓" : ""}</span>
                  <span style={{ flex: 1 }}>{o.nombre}</span>
                  <span className="series acento">{textoReps(o)}</span>
                </button>
              ))}
            </div>
            <p className="etiqueta" style={{ margin: "12px 0 4px" }}>Cierra con core</p>
            <ul className="lista-ej">
              {DIA5_CORE.map((e) => (
                <li key={e.id}><span>{e.nombre}</span><span className="series">{textoReps(e)}</span></li>
              ))}
              <li><span>{DIA5_CAMINATA}</span></li>
            </ul>
          </>
        )}
      </div>

      <button
        className="btn btn-primario btn-gigante"
        disabled={dia === 5 && !listo5}
        onClick={() => onEmpezar(dia, sel5)}
        data-prueba="empezar"
      >
        {dia === 5 && !listo5 ? `Elige 3-4 (llevas ${sel5.length})` : `Empezar Día ${dia}`}
      </button>
      <p className="suave chico" style={{ textAlign: "center" }}>{ejs.length} ejercicios · {REGLAS.calentamiento.toLowerCase()}</p>

      <details className="tarjeta">
        <summary className="subtitulo">Reglas de la rutina ▾</summary>
        <ul style={{ paddingLeft: 20, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
          <li>{REGLAS.rir}</li>
          <li>{REGLAS.progresion}</li>
          <li>{REGLAS.descansos}</li>
          <li>{REGLAS.calentamiento}</li>
        </ul>
      </details>

      {activa && activa.fase.tipo !== "fin" && (
        <div className="capa" data-prueba="continuar-capa">
          <div>
            <p className="titulo">Tienes una sesión a medias</p>
            <p>
              Día {activa.dia} · {tituloDia(activa.dia)}. Ibas en <b>{ejerciciosDe(activa)[activa.i]?.nombre}</b> con{" "}
              {activa.bloques.reduce((a, b) => a + b.registros.reduce((x, r) => x + r.length, 0), 0)} series registradas.
            </p>
            <button className="btn btn-primario btn-gigante" onClick={onContinuar} data-prueba="continuar">Continuar donde iba</button>
            <button
              className="btn btn-ancho btn-peligro"
              onClick={() => { if (confirm("¿Descartar la sesión a medias? Se pierde lo registrado en ella.")) onDescartar(); }}
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
