"use client";

import { useState } from "react";
import Animacion from "./Animacion";
import {
  cerrarSesion, ejerciciosDe, fmtDuracion, fmtSeries, mejorHistorica, puntaje, rondas,
  type SesionActiva, type SesionGuardada,
} from "@/lib/datos";
import { DIA5_CAMINATA, tituloDia } from "@/lib/rutina";

export default function Resumen({ s, hist, onListo }: { s: SesionActiva; hist: SesionGuardada[]; onListo: () => void }) {
  const g = cerrarSesion(s, s.ultimaActividad);
  const [caminata, setCaminata] = useState(false);
  const ejs = ejerciciosDe(s);
  const completos = s.bloques.filter((b, i) => rondas(b) >= ejs[i].series).length;
  const series = g.ejercicios.reduce((a, e) => a + e.series.length, 0);

  // Mejor serie de cada ejercicio y comparación con tu historial
  const marcas = g.ejercicios
    .filter((e) => e.carga !== "tiempo")
    .map((e) => {
      const mejor = e.series.reduce((m, r) => (puntaje(r.peso, r.reps) > puntaje(m.peso, m.reps) ? r : m), e.series[0]);
      const previa = mejorHistorica(hist, e.key, g.id);
      const p = puntaje(mejor.peso, mejor.reps);
      return { e, mejor, record: previa > 0 && p > previa + 1e-9, primera: previa === 0, mejora: previa > 0 ? p / previa : 0, p };
    });
  const records = marcas.filter((m) => m.record).sort((a, b) => b.mejora - a.mejora);
  const destacada = records[0] ?? [...marcas].sort((a, b) => b.p - a.p)[0];
  const subir = g.ejercicios.filter((e) => e.tope);

  return (
    <main className="app" data-prueba="resumen">
      <p className="etiqueta">Día {s.dia} · {tituloDia(s.dia)}</p>
      <p className="titulo">{series ? "¡Sesión terminada! Buen trabajo." : "Sesión terminada"}</p>
      <div className="tarjeta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: 8 }}>
        <div><div className="subtitulo" data-prueba="duracion">{fmtDuracion(g.duracionMs)}</div><div className="suave chico">duración</div></div>
        <div><div className="subtitulo">{completos}/{ejs.length}</div><div className="suave chico">ejercicios</div></div>
        <div><div className="subtitulo">{series}</div><div className="suave chico">series</div></div>
      </div>

      {destacada && (
        <div className="tarjeta" data-prueba="mejor-marca">
          <p className="etiqueta">Mejor marca del día</p>
          <p className="subtitulo">{destacada.e.nombre}: {fmtSeries([destacada.mejor], destacada.e.carga)}</p>
          {destacada.record && <p className="marca-ok">¡Tu mejor marca!</p>}
          {destacada.primera && <p className="suave chico">Primera vez registrada: esta es tu marca a superar.</p>}
        </div>
      )}
      {records.length > 1 && (
        <div className="tarjeta">
          <p className="etiqueta">Otras mejores marcas</p>
          {records.slice(1).map((m) => (
            <p key={m.e.key}>{m.e.nombre}: <b>{fmtSeries([m.mejor], m.e.carga)}</b></p>
          ))}
        </div>
      )}
      {subir.length > 0 && (
        <div className="banner" data-prueba="resumen-subir">
          ¡Toca subir peso la próxima vez en: {subir.map((e) => e.nombre).join(", ")}! Llegaste al tope del rango en todas las series.
        </div>
      )}

      <div className="tarjeta">
        <p className="etiqueta">Lo que hiciste</p>
        <ul className="lista-ej">
          {g.ejercicios.map((e, k) => (
            <li key={k}><span>{e.nombre}</span><b style={{ textAlign: "right" }}>{fmtSeries(e.series, e.carga, e.unidad)}</b></li>
          ))}
          {g.ejercicios.length === 0 && <li className="suave">No registraste series. No se guardará en el historial.</li>}
        </ul>
      </div>

      {s.dia === 5 && (
        <div className="tarjeta">
          <p className="subtitulo">{DIA5_CAMINATA}</p>
          <Animacion id="caminata" className="anim-chica" />
          <button className={`check ${caminata ? "activo" : ""}`} onClick={() => setCaminata(!caminata)} style={{ marginTop: 10 }}>
            <span className="caja">{caminata ? "✓" : ""}</span> Caminata hecha
          </button>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <button className="btn btn-primario btn-gigante" onClick={onListo} data-prueba="listo">Listo</button>
    </main>
  );
}
