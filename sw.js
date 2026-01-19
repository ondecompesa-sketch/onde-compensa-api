const CACHE_NAME = 'ondecompensa-v3'; // Mudamos para v3 para forçar atualização
const urlsToCache = [
  './',
  './index.html',
  './lista.html',         // <--- O item novo!
  './login.html',
  './nova-nota.html',
  './perfil.html',
  './oferta.html',
  './importar.html',
  './calculadora.html',
  './icon.png',
  './manifest.json',
  // Bibliotecas externas essenciais
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força o app a atualizar na hora
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
            return caches.delete(cache); // Apaga a versão velha
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