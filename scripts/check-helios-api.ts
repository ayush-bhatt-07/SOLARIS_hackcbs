import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:8787/api';
const demoResponse = await fetch(`${base}/auth/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace: 'commercial' }), signal: AbortSignal.timeout(10000) });
assert.equal(demoResponse.status, 201, 'A temporary synthetic demo session must be created.');
const demo = await demoResponse.json();
try {
  const response = await fetch(`${base}/helios/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${demo.token}` }, body: JSON.stringify({ question: 'Explain how solar panels convert sunlight into electricity.' }), signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, 'Helios chat must respond successfully.');
  const reply = await response.json();
  assert.equal(reply.mode, 'gemini', 'Expected a live Gemini answer rather than the offline FAQ.');
  assert.equal(typeof reply.answer, 'string'); assert(reply.answer.trim().length > 10);
  console.log('PASS: authenticated /api/helios/chat returned a live Gemini answer.');
  console.log(`Source: ${reply.source}`);
} finally {
  await fetch(`${base}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${demo.token}` }, body: '{}' });
}
