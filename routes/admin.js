const express = require('express');
const QRCode = require('qrcode');
const crypto = require('node:crypto');
const { acapy } = require('../lib/acapy');
const store = require('../lib/store');

const router = express.Router();


router.post('/onboard', async (req, res) => {
  try {
    const { student_name, student_id, department, email } = req.body;
    if (!student_name || !student_id || !department || !email) {
      return res.status(400).json({ error: 'All 4 fields are required' });
    }
    const inv = await acapy('POST', '/out-of-band/create-invitation?auto_accept=true', {
      alias: `student:${student_id}`,
      my_label: process.env.AGENT_LABEL || 'University Portal',
      handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
    });
    const onboardId = crypto.randomUUID();
    store.onboardings.set(onboardId, {
      student: { student_name, student_id, department, email },
      status: 'waiting',
      invitationMsgId: inv.invi_msg_id,
      connectionId: null,
    });
    store.byInvitation.set(inv.invi_msg_id, onboardId);   
    const qr = await QRCode.toDataURL(inv.invitation_url);
    res.json({ onboardId, qr });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


router.get('/onboard/:id/status', (req, res) => {
  const ob = store.onboardings.get(req.params.id);
  if (!ob) return res.status(404).json({ error: 'not found' });
  res.json({ status: ob.status });   
});


router.post('/onboard/:id/issue', async (req, res) => {
  try {
    const ob = store.onboardings.get(req.params.id);
    if (!ob) return res.status(404).json({ error: 'not found' });
    if (!ob.connectionId) return res.status(400).json({ error: 'Student not connected yet' });
    await acapy('POST', '/issue-credential-2.0/send', {
      connection_id: ob.connectionId,
      auto_remove: false,
      credential_preview: {
        '@type': 'issue-credential/2.0/credential-preview',
        attributes: Object.entries(ob.student).map(([name, value]) => ({ name, value })),
      },
      filter: { indy: { cred_def_id: process.env.CRED_DEF_ID } },
    });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;