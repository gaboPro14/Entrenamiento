"use client";

import { useCallback, useEffect, useState } from "react";
import Inicio from "@/components/Inicio";
import Sesion from "@/components/Sesion";
import Historial from "@/components/Historial";
import {
  cargarActiva, cargarHistorial, cargarPrefs, cerrarSesion, guardarActiva, guardarHistorial, guardarPrefs, nuevaSesion,
  type Prefs, type SesionActiva, type SesionGuardada,
} from "@/lib/datos";
import { retomar } from "@/lib/sesion";

type Pantalla = "inicio" | "sesion" | "historial";

export default function App() {
  const [listo, setListo] = useState(false);
  const [pantalla, setPantalla] = useState<Pantalla>("inicio");
  const [hist, setHistE] = useState<SesionGuardada[]>([]);
  const [prefs, setPrefsE] = useState<Prefs>({ paso: 1, seleccion5: [], variantes: {} });
  const [activa, setActivaE] = useState<SesionActiva | null>(null);

  useEffect(() => {
    // Carga inicial desde el teléfono (localStorage solo existe en el navegador).
    setHistE(cargarHistorial());
    setPrefsE(cargarPrefs());
    const a = cargarActiva();
    // Una sesión que ya terminó quedó guardada en el historial: no hace falta retomarla.
    if (a?.fase.tipo === "fin") guardarActiva(null);
    else setActivaE(a);
    setListo(true);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const setHist = useCallback((h: SesionGuardada[]) => { setHistE(h); guardarHistorial(h); }, []);
  const setPrefs = useCallback((p: Prefs) => { setPrefsE(p); guardarPrefs(p); }, []);
  const setActiva = useCallback(
    (s: SesionActiva | null) => {
      setActivaE(s);
      guardarActiva(s);
      // Al terminar, la sesión se guarda en el historial de inmediato (si registraste algo).
      if (s && s.fase.tipo === "fin") {
        const g = cerrarSesion(s, s.ultimaActividad);
        setHistE((h) => {
          const sin = h.filter((x) => x.id !== g.id);
          const n = g.ejercicios.length ? [...sin, g] : sin;
          guardarHistorial(n);
          return n;
        });
      }
    },
    [],
  );

  if (!listo) return <main className="app" />;

  if (pantalla === "sesion" && activa)
    return (
      <Sesion
        s={activa}
        setS={setActiva}
        hist={hist.filter((h) => h.id !== activa.id)}
        prefs={prefs}
        setPrefs={setPrefs}
        onListo={() => { setActiva(null); setPantalla("inicio"); }}
      />
    );

  if (pantalla === "historial") return <Historial hist={hist} setHist={setHist} onVolver={() => setPantalla("inicio")} />;

  return (
    <Inicio
      hist={hist}
      prefs={prefs}
      setPrefs={setPrefs}
      activa={activa}
      hoy={new Date()}
      onEmpezar={(dia, sel5) => { setActiva(nuevaSesion(dia, sel5, prefs)); setPantalla("sesion"); }}
      onContinuar={() => { if (activa) setActiva(retomar(activa)); setPantalla("sesion"); }}
      onDescartar={() => setActiva(null)}
      onHistorial={() => setPantalla("historial")}
    />
  );
}
