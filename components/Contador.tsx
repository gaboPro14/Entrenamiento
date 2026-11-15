"use client";

import { useState } from "react";
import { fmtPeso } from "@/lib/datos";

/** Selector rápido con − / + gigantes. Tocar el número permite escribirlo (opcional). */
export default function Contador({
  valor, onCambio, paso, min = 0, max = 999, etiqueta, sufijo, prueba,
}: {
  valor: number; onCambio: (v: number) => void; paso: number; min?: number; max?: number;
  etiqueta: string; sufijo?: string; prueba?: string;
}) {
  const [editando, setEditando] = useState(false);
  const fijar = (v: number) => onCambio(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div>
      <div className="etiqueta" style={{ textAlign: "center", marginBottom: 4 }}>{etiqueta}</div>
      <div className="contador">
        <button aria-label={`Menos ${etiqueta}`} data-prueba={prueba && `${prueba}-menos`} onClick={() => fijar(valor - paso)}>−</button>
        <div className="valor">
          {editando ? (
            <input
              autoFocus
              inputMode="decimal"
              defaultValue={fmtPeso(valor)}
              onBlur={(e) => {
                const v = parseFloat(e.target.value.replace(",", "."));
                if (!Number.isNaN(v)) fijar(v);
                setEditando(false);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            />
          ) : (
            <b data-prueba={prueba && `${prueba}-valor`} onClick={() => setEditando(true)}>
              {fmtPeso(valor)}
              {sufijo && <span style={{ fontSize: 20, fontWeight: 700, color: "var(--suave)" }}> {sufijo}</span>}
            </b>
          )}
        </div>
        <button aria-label={`Más ${etiqueta}`} data-prueba={prueba && `${prueba}-mas`} onClick={() => fijar(valor + paso)}>+</button>
      </div>
    </div>
  );
}
