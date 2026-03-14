const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');

const { createServer } = require('../server');

let server;
let port;

function request(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        method: 'GET',
        path: pathname,
        port
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            body,
            headers: res.headers,
            statusCode: res.statusCode
          });
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

test.before(async () => {
  server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  port = server.address().port;
});

test.after(async () => {
  server.close();
  await once(server, 'close');
});

test('sert la page principale sur /', async () => {
  const response = await request('/');
  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /text\/html/);
  assert.match(response.body, /Géocodage & zones/);
});

test('sert le fichier CSS des assets', async () => {
  const response = await request('/public/css/styles.css');
  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /text\/css/);
  assert.match(response.body, /--accent-start/);
});

test('retourne 404 pour une route inconnue', async () => {
  const response = await request('/inconnu');
  assert.equal(response.statusCode, 404);
});
