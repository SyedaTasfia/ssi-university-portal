
require('dotenv').config();

const BASE = process.env.ACAPY_ADMIN_URL || 'http://localhost:8031';

async function acapy(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`ACA-Py ${method} ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

module.exports = { acapy };