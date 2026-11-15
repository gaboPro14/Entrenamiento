"use client";

import { useRef, useState } from "react";
import { fmtDuracion, fmtFecha, fmtFechaCorta, fmtSeries, lunesDe, type SesionGuardada } from "@/lib/datos";
import { tituloDia } from "@/lib/rutina";

type Props = {
  hist: SesionGuardada[];
  setHist: (h: SesionGuardada[]) => void;
  onVolver: () => void;
};

export default function Historial({ hist, setHist, onVolver }: Props) {
  const [tab, setTab] = useState<"sesiones" | "ejercicios">("sesiones");
  const archivo = useRef<HTMLInputElement>(null);

  // Sesiones por semana (más reciente primero)
  const semanas = new Map<number, SesionGuardada[]>();
  for (const s of [...hist].sort((a, b) => b.inicio - a.inicio)) {
    const k = lunesDe(s.inicio).getTime();
    semanas.set(k, [...(semanas.get(k) ?? []), s]);
  }

  // Por ejercicio: evolución (más reciente primero)
  const porEj = new Map<string, { nombre: string; filas: { s: SesionGuardada; e: SesionGuardada["ejercicios"][number] }[] }>();
  for (const s of [...hist].sort((a, b) => b.inicio - a.inicio)) {
    for (const e of s.ejercicios) {
      const x = porEj.get(e.key) ?? { nombre: e.nombre, filas: [] };
      x.filas.push({ s, e });
      porEj.set(e.key, x);
    }
  }

  const exportar = () => {
    const blob = new Blob([JSON.stringify({ app: "entreno", version: 1, historial: hist }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `entreno-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const importar = async (f: File) => {
    try {
      const d = JSON.parse(await f.text());
      const nuevas: SesionGuardada[] = Array.isArray(d) ? d : d.historial;
      if (!Array.isArray(nuevas)) throw new Error();
      const ids = new Set(hist.map((s) => s.id));
      setHist([...hist, ...nuevas.filter((s) => s && s.id && !ids.has(s.id))].sort((a, b) => a.inicio - b.inicio));
      alert("Copia importada.");
    } catch {
      alert("Ese archivo no es una copia de Entreno.");
    }
  };

  return (
    <main className="app" data-prueba="historial">
      <div className="entre">
        <p className="titulo">Historial</p>
        <button className="btn btn-chico" onClick={onVolver}>Volver</button>
      </div>
      <div className="tabs">
        <button className={tab === "sesiones" ? "activo" : ""} onClick={() => setTab("sesiones")}>Sesiones</button>
        <button className={tab === "ejercicios" ? "activo" : ""} onClick={() => setTab("ejercicios")} data-prueba="tab-ejercicios">Por ejercicio</button>
      </div>

      {hist.length === 0 && <p className="suave">Aún no hay sesiones. Cuando termines la primera, aparece aquí.</p>}

      {tab === "sesiones" &&
        [...semanas.entries()].map(([lunes, ses]) => (
          <section key={lunes} className="lista-hist">
            <p className="etiqueta">Semana del {fmtFechaCorta(lunes)} · {ses.length} {ses.length === 1 ? "sesión" : "sesiones"}</p>
            {ses.map((s) => (
              <details key={s.id} className="tarjeta" data-prueba="sesion-hist">
                <summary>
                  <div className="entre">
                    <div>
                      <div style={{ fontWeight: 800 }}>{fmtFecha(s.inicio)} · Día {s.dia}</div>
                      <div className="suave chico">{tituloDia(s.dia)} · {fmtDuracion(s.duracionMs)} · {s.ejercicios.reduce((a, e) => a + e.series.length, 0)} series</div>
                    </div>
                    <span className="suave">▾</span>
                  </div>
                </summary>
                <ul className="lista-ej" style={{ marginTop: 8 }}>
                  {s.ejercicios.map((e, k) => (
                    <li key={k} style={{ flexDirection: "column", gap: 2 }}>
                      <span>{e.nombre}</span>
                      <b>{fmtSeries(e.series, e.carga, e.unidad)}{e.tope && <span className="marca-ok"> · tope ✓ sube peso</span>}</b>
                    </li>
                  ))}
                </ul>
                <button
                  className="btn btn-texto btn-peligro"
                  onClick={() => { if (confirm("¿Borrar esta sesión del historial?")) setHist(hist.filter((x) => x.id !== s.id)); }}
                >
                  Borrar sesión
                </button>
              </details>
            ))}
          </section>
        ))}

      {tab === "ejercicios" &&
        [...porEj.entries()].map(([key, x]) => (
          <details key={key} className="tarjeta" data-prueba="ej-hist">
            <summary className="entre">
              <span style={{ fontWeight: 800 }}>{x.nombre}</span>
              <span className="suave chico" style={{ whiteSpace: "nowrap" }}>{x.filas.length} ▾</span>
            </summary>
            <ul className="lista-ej" style={{ marginTop: 8 }}>
              {x.filas.map(({ s, e }, k) => (
                <li key={k}>
                  <span className="suave">{fmtFechaCorta(s.inicio)} · D{s.dia}</span>
                  <b style={{ textAlign: "right" }}>{fmtSeries(e.series, e.carga, e.unidad)}{e.tope && <span className="marca-ok"> ↑</span>}</b>
                </li>
              ))}
            </ul>
          </details>
        ))}

      <div className="tarjeta">
        <p className="etiqueta">Copia de seguridad</p>
        <p className="suave chico" style={{ margin: "4px 0 10px" }}>Tus datos viven solo en este teléfono. Exporta una copia de vez en cuando.</p>
        <div className="fila">
          <button className="btn btn-chico" onClick={exportar} disabled={!hist.length}>Exportar</button>
          <button className="btn btn-chico" onClick={() => archivo.current?.click()}>Importar</button>
        </div>
        <input ref={archivo} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
      </div>
    </main>
  );
}
