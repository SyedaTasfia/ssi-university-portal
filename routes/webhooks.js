const express = require('express');
const store = require('../lib/store');
const { acapy } = require('../lib/acapy');

const router = express.Router();

router.post('/topic/:topic', async (req, res) => {
  res.sendStatus(200); // age receipt, tarpor kaj — agent jeno atke na thake
  const { topic } = req.params;
  const rec = req.body;
  try {
    if (topic === 'connections') onConnection(rec);
    else if (topic === 'issue_credential_v2_0') onIssue(rec);
    else if (topic === 'present_proof_v2_0') await onProof(rec);
    else if (topic === 'basicmessages') onMessage(rec);
  } catch (err) {
    console.error('webhook handle error:', err.message);
  }
});

// ---- Connection: kon QR-er bodolote ke connect holo? ----
function onConnection(rec) {
  console.log(`🔗 connection: state=${rec.state} conn=${rec.connection_id}`);
  const key = rec.invitation_msg_id;
  if (!key || !store.byInvitation.has(key)) return;
  if (!['active', 'completed'].includes(rec.state)) return;

  const target = store.byInvitation.get(key);
  if (target === 'faculty') {                       // Phase 11-er jonno
    store.faculty.connectionId = rec.connection_id;
    store.faculty.status = 'connected';
    console.log('🎓 faculty chat connection ready');
    return;
  }
  const ob = store.onboardings.get(target);
  if (ob && ob.status === 'waiting') {
    ob.connectionId = rec.connection_id;
    ob.status = 'connected';
    store.byConnection.set(rec.connection_id, target);
    console.log(`✅ student connected: ${ob.student.student_name}`);
  }
}

// ---- Credential: issue sesh hole onboarding-ta 'issued' koro ----
function onIssue(rec) {
  console.log(`🎫 credential: state=${rec.state}`);
  const obId = store.byConnection.get(rec.connection_id);
  const ob = obId && store.onboardings.get(obId);
  if (ob && rec.state === 'done') {
    ob.status = 'issued';
    console.log(`🎉 credential issued to ${ob.student.student_name}`);
  }
}

// ---- Proof: verified hole login-ta 'verified' koro ar attribute gulo tule rakho ----
async function onProof(rec) {
  console.log(`🕵️ proof: state=${rec.state} verified=${rec.verified}`);
  const loginId = store.byPresEx.get(rec.pres_ex_id);
  const login = loginId && store.logins.get(loginId);
  if (!login || rec.state !== 'done') return;

  if (String(rec.verified) !== 'true') {
    login.status = 'failed';
    return;
  }
  // Webhook-e sob somoy by_format thake na — dorkar hole record ta abar pore ani
  let full = rec;
  if (!full.by_format) {
    try { full = await acapy('GET', `/present-proof-2.0/records/${rec.pres_ex_id}`); }
    catch (e) { /* record na pele webhook body diyei cholbe */ }
  }
  login.user = extractAttributes(full) || {};
  login.status = 'verified';
  console.log(`🔓 login verified: ${login.user.student_name || 'unknown'}`);
}

// Proof record-er bhetor theke reveal kora attribute gulo ber kore ana.
// ACA-Py-r shape ektu ghurano, tai duto possible jayga-i dekhi.
function extractAttributes(record) {
  const pres = record?.by_format?.pres || record?.pres_ex_record?.by_format?.pres;
  const proof = pres?.indy?.requested_proof;
  if (!proof) return null;
  const out = {};
  for (const group of Object.values(proof.revealed_attr_groups || {})) {
    for (const [name, v] of Object.entries(group.values || {})) out[name] = v.raw;
  }
  for (const [name, v] of Object.entries(proof.revealed_attrs || {})) out[name] = v.raw;
  return out;
}

// ---- Basic message (Phase 11): student-er pathano chat ----
function onMessage(rec) {
  console.log(`💬 message theke ${rec.connection_id}: ${rec.content}`);
  if (rec.connection_id !== store.faculty.connectionId) return;
  store.messages.push({ from: 'student', text: rec.content, time: new Date().toISOString() });
}

module.exports = router;