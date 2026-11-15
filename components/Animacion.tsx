"use client";

import { useEffect, useRef, useState } from "react";
import { ANIMACIONES, poseEn, trazos, type Trazo } from "@/lib/animaciones";

const COLOR: Record<string, string> = {
  cuerpo: "var(--figura)",
  lejos: "var(--figura-lejos)",
  equipo: "var(--acento)",
  banco: "var(--banco)",
};

function Dibujo({ t }: { t: Trazo[] }) {
  return (
    <>
      {t.map((x, i) => {
        if (x.k === "linea")
          return (
            <line key={i} x1={x.a.x} y1={x.a.y} x2={x.b.x} y2={x.b.y} stroke={COLOR[x.c]} strokeWidth={x.w} strokeLinecap="round" />
          );
        if (x.k === "circulo")
          return <circle key={i} cx={x.c0.x} cy={x.c0.y} r={x.r} fill={COLOR[x.c]} />;
        return <rect key={i} x={x.x} y={x.y} width={x.w} height={x.h} rx={2} fill={COLOR[x.c]} />;
      })}
    </>
  );
}

/** Animación en bucle del ejercicio. `fijo` (ms) congela un instante (para pruebas). */
export default function Animacion({ id, fijo, className }: { id: string; fijo?: number; className?: string }) {
  const an = ANIMACIONES[id];
  const [ms, setMs] = useState(fijo ?? 0);
  const ref = useRef(0);

  useEffect(() => {
    if (fijo !== undefined || !an) return;
    const ini = performance.now();
    const paso = (ahora: number) => {
      setMs(ahora - ini);
      ref.current = requestAnimationFrame(paso);
    };
    ref.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(ref.current);
  }, [an, fijo]);

  if (!an) return null;
  const t = trazos(an, poseEn(an, fijo ?? ms));
  return (
    <svg viewBox="0 0 240 170" className={className} role="img" aria-label="Animación del ejercicio">
      <line x1={4} y1={161} x2={236} y2={161} stroke="var(--piso)" strokeWidth={3} strokeLinecap="round" />
      <Dibujo t={t} />
    </svg>
  );
}
