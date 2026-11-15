# Entreno — rutina en casa (PWA)

App para usar **mientras entrenas**: dice qué toca, muestra cómo se hace cada ejercicio
(animación propia en SVG), cuenta el descanso y guarda lo que levantaste. Sin cuentas,
sin servidor; todo vive en el teléfono (localStorage) y funciona sin conexión después de la
primera carga.



## Archivos

| Archivo | Qué es |
| --- | --- |
| `lib/rutina.ts` | La rutina (Días 1-5, series, reps, descansos, claves técnicas, semana tipo). |
| `lib/animaciones.ts` | Motor de las animaciones (figura con articulaciones y poses clave por ejercicio). |
| `lib/datos.ts` | Historial, sesión en curso, «última vez», progresión doble, formatos. |
| `lib/sesion.ts` | Flujo de la sesión: registrar serie, superserie, descanso, pausa, retomar, deshacer. |
| `lib/aviso.ts`, `lib/wakelock.ts` | Pitidos/vibración y pantalla siempre encendida. |
| `components/Inicio.tsx` | Qué toca hoy, selector de día, lista de ejercicios, «Empezar». |
| `components/Sesion.tsx` | Calentamiento, serie, descanso, transición, pausa, menú. |
| `components/Resumen.tsx` | Fin de sesión: duración, series, mejor marca, «toca subir peso». |
| `components/Historial.tsx` | Sesiones por semana, evolución por ejercicio, exportar/importar copia. |
| `scripts/generar-sw.mjs` | Genera `out/sw.js` con todos los archivos para uso sin conexión. |

## Comandos

```bash

npm install
npm run dev     # desarrollo en http://localhost:3000 (sin service worker)
npm run build   # exportación estática en out/ + service worker
npx serve out   # probar el build (con modo sin conexión)
```

## Desplegar en Vercel

Nuevo proyecto en Vercel importando este repositorio
(framework: Next.js; el resto por defecto). Abre la URL en el teléfono y elige
«Agregar a pantalla de inicio» / «Instalar app».
