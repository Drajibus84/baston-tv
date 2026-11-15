// Cache PWA v0.19. Network-first pour HTML/CSS/JS afin de voir les mises à jour publiées.
const CACHE = "baston-tv-v019";
const FILES = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/boxeur-1.png", "./assets/boxeur-2.png", "./assets/boxeur-3.png", "./assets/boxeur-4.png", "./assets/boxeur-5.png", "./assets/boxeur-6.png", "./assets/ninja-1.png", "./assets/ninja-2.png", "./assets/ninja-3.png", "./assets/ninja-4.png", "./assets/ninja-5.png", "./assets/ninja-6.png", "./assets/sumo-1.png", "./assets/sumo-2.png", "./assets/sumo-3.png", "./assets/sumo-4.png", "./assets/sumo-5.png", "./assets/sumo-6.png", "./assets/audio/clic.wav", "./assets/audio/confirmation.wav", "./assets/audio/sac-frappe.wav", "./assets/audio/coup-rapide.wav", "./assets/audio/uppercut.wav", "./assets/audio/riposte.wav"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("baston-tv-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); }
    return response;
  }).catch(()=>caches.match(event.request)));
});
