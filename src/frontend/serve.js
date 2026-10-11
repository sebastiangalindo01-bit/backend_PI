/* ==========================================================================
   SAICI · Servidor local SOLO para el front end (demostración)
   - No usa base de datos, no usa Express y no llama a ninguna API.
   - Sirve esta carpeta (src/frontend) como sitio web estático.

   Uso (desde la raíz del proyecto):
       node src/frontend/serve.js          → http://localhost:8080
       npm run front                       → lo mismo
   Otro puerto:
       PORT=5000 node src/frontend/serve.js

   Las direcciones con el prefijo /src/frontend/ también funcionan, por ejemplo:
       http://localhost:8080/src/frontend/admin/02-gestionar-reservas.html
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const PREFIX = '/src/frontend';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8'
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(body);
}

function notFound(res, urlPath) {
  send(res, 404,
    '<!DOCTYPE html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Página no encontrada · SAICI</title>' +
    '<body style="font-family:system-ui,sans-serif;max-width:480px;margin:15vh auto;padding:0 20px;color:#193A22">' +
    '<h1>No encontramos esa pantalla</h1>' +
    '<p>La dirección <code>' + urlPath.replace(/[<>&"]/g, '') + '</code> no existe en el prototipo.</p>' +
    '<p><a href="/auth/01-login.html" style="color:#27823D;font-weight:700">Ir al inicio de sesión</a></p></body></html>',
    'text/html; charset=utf-8');
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Método no permitido');

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    return send(res, 400, 'Dirección inválida');
  }

  // Acepta tanto /admin/... como /src/frontend/admin/...
  if (urlPath === PREFIX || urlPath.startsWith(PREFIX + '/')) urlPath = urlPath.slice(PREFIX.length) || '/';

  // La raíz lleva al inicio de sesión
  if (urlPath === '/' || urlPath === '') {
    res.writeHead(302, { Location: '/auth/01-login.html' });
    return res.end();
  }

  // Evita salir de la carpeta del front
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return notFound(res, urlPath);

  fs.stat(filePath, (err, stat) => {
    if (err) return notFound(res, urlPath);
    const target = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    fs.readFile(target, (err2, data) => {
      if (err2) return notFound(res, urlPath);
      const type = TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
});

server.listen(PORT, () => {
  console.log('SAICI · front end en http://localhost:' + PORT);
  console.log('  Inicio de sesión:  http://localhost:' + PORT + '/auth/01-login.html');
  console.log('  Usuario:           http://localhost:' + PORT + '/usuario/01-inicio.html');
  console.log('  Administración:    http://localhost:' + PORT + '/admin/01-panel.html');
  console.log('  Laboratorio:       http://localhost:' + PORT + '/laboratorio/01-panel.html');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error('El puerto ' + PORT + ' ya está en uso. Prueba: PORT=5000 node src/frontend/serve.js');
  else console.error(e);
  process.exit(1);
});
