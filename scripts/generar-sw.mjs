// Genera out/sw.js con la lista de TODOS los archivos de la exportación estática,
// para que la app funcione sin conexión después de la primera carga.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;
const archivos = [];
(function recorrer(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) recorrer(p);
    else archivos.push(p);
  }
})(OUT);

const hash = createHash("sha256");
const urls = [];
for (const p of archivos.sort()) {
  const rel = "/" + relative(OUT, p).split("\\").join("/");
  if (rel === "/sw.js" || rel.endsWith(".txt") || rel.endsWith(".map")) continue;
  hash.update(rel).update(readFileSync(p));
  urls.push(rel);
}
urls.push("/");
const VERSION = "entreno-" + hash.digest("hex").slice(0, 12);

const sw = `// Generado por scripts/generar-sw.mjs — no editar a mano.
const VERSION = ${JSON.stringify(VERSION)};
const ARCHIVOS = ${JSON.stringify(urls)};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // Página: la guardada (funciona en modo avión); se actualiza en segundo plano.
    e.respondWith(
      caches.match("/index.html").then((hit) => {
        const red = fetch(req).catch(() => hit);
        return hit || red;
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
          return res;
        })
    )
  );
});
`;
writeFileSync(join(OUT, "sw.js"), sw);
console.log(`sw.js: ${urls.length} archivos en caché (${VERSION})`);
