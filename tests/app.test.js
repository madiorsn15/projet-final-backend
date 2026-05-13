const assert = require('node:assert/strict');
const User = require('../models/User');
const { app } = require('../server');

let server;
let baseUrl;

const originalFindOne = User.findOne;
const originalCreate = User.create;

const tests = [];

const addTest = (name, fn) => {
  tests.push({ name, fn });
};

const startHttpServer = async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
};

const stopHttpServer = async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

const resetMocks = () => {
  User.findOne = originalFindOne;
  User.create = originalCreate;
};

addTest('GET /api/health returns service status', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'OK');
  assert.ok(body.timestamp);
});

addTest('POST /api/auth/register validates required fields', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.message, 'Données invalides.');
  assert.ok(body.errors.some((error) => error.field === 'password'));
});

addTest('POST /api/auth/register defaults public registration role to client', async () => {
  User.findOne = async () => null;
  User.create = async (payload) => ({
    _id: '507f1f77bcf86cd799439011',
    ...payload,
    toObject() {
      return { _id: this._id, ...payload };
    },
  });

  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice Ndiaye',
      email: 'alice@example.com',
      password: 'secret1',
      whatsapp: '+221770000000',
    }),
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.user.role, 'client');
  assert.ok(body.token);
});

addTest('unknown routes return 404 with explicit message', async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.match(body.message, /introuvable/i);
});

const run = async () => {
  process.env.NODE_ENV = 'test';
  let failures = 0;

  await startHttpServer();

  for (const { name, fn } of tests) {
    try {
      resetMocks();
      await fn();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  resetMocks();
  await stopHttpServer();

  if (failures > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`All tests passed (${tests.length})`);
};

run().catch((error) => {
  console.error('Test runner failed');
  console.error(error);
  process.exitCode = 1;
});
