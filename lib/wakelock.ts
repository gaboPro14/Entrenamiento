"use client";
import { useEffect } from "react";

/** Mantiene la pantalla encendida mientras `activo` sea verdadero (si el navegador lo permite). */
export function usePantallaEncendida(activo: boolean) {
  useEffect(() => {
    if (!activo || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let vivo = true;
    const pedir = async () => {
      try {
        if (document.visibilityState === "visible" && vivo) lock = await navigator.wakeLock.request("screen");
      } catch {
        /* rechazado (batería baja, etc.) */
      }
    };
    void pedir();
    const alVolver = () => { if (document.visibilityState === "visible") void pedir(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alVolver);
      void lock?.release().catch(() => {});
    };
  }, [activo]);
}

export const soportaWakeLock = () => typeof navigator !== "undefined" && "wakeLock" in navigator;
