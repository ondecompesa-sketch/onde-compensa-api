const CACHE_NAME = 'ondecompensa-v2'; // Mudei para v2 para forçar atualização
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './lista.html',
  './nova-nota.html',
  './perfil.html',
  './oferta.html',        // Novo
  './importar.html',      // Novo
  './calculadora.html',   // Novo
  './icon.png',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força a atualização imediata
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Limpa o cache antigo (v1)
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});