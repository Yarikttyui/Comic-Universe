const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 80);
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.exe': 'application/octet-stream',
  '.apk': 'application/vnd.android.package-archive',
  '.zip': 'application/zip',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  if (ext && ext !== '.html') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }
  res.setHeader('Content-Type', contentType);

  fs.createReadStream(filePath).pipe(res);
}

function safeResolve(urlPathname) {
  const normalized = path.normalize(urlPathname).replace(/^(\.\.[/\\])+/, '');
  const resolved = path.resolve(DIST_DIR, `.${normalized}`);
  if (!resolved.startsWith(path.resolve(DIST_DIR))) {
    return null;
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname || '/');

  if (pathname === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('healthy\n');
    return;
  }

  const candidate = safeResolve(pathname);
  if (!candidate) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  let targetFile = candidate;
  if (pathname.endsWith('/')) {
    targetFile = path.join(candidate, 'index.html');
  }

  fs.stat(targetFile, (err, stats) => {
    if (!err && stats.isFile()) {
      res.statusCode = 200;
      sendFile(res, targetFile);
      return;
    }

    fs.stat(INDEX_FILE, (indexErr, indexStats) => {
      if (indexErr || !indexStats.isFile()) {
        res.statusCode = 500;
        res.end('index.html not found');
        return;
      }
      res.statusCode = 200;
      sendFile(res, INDEX_FILE);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running at http://0.0.0.0:${PORT}`);
});
