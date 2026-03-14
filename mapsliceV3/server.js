const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = __dirname;
const ENTRY_FILE = path.join(ROOT_DIR, 'mapslice.html');
const ASSETS_DIR = path.join(ROOT_DIR, 'public');
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function serveFile(filePath, response, method) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'Content-Type': getContentType(filePath) });
    if (method === 'HEAD') {
      response.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal server error');
    });
    stream.pipe(response);
  });
}

function resolveAssetPath(pathname) {
  const relativePath = pathname.replace(/^\/+/, '');
  const resolved = path.resolve(ROOT_DIR, relativePath);
  if (resolved !== ASSETS_DIR && !resolved.startsWith(ASSETS_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

function requestHandler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  const requestUrl = new URL(request.url, 'http://localhost');
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === '/' || pathname === '/mapslice.html') {
    serveFile(ENTRY_FILE, response, request.method);
    return;
  }

  if (pathname.startsWith('/public/')) {
    const assetPath = resolveAssetPath(pathname);
    if (!assetPath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    serveFile(assetPath, response, request.method);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

function createServer() {
  return http.createServer(requestHandler);
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`MapSlice disponible sur http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
