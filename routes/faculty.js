const express = require('express');
const QRCode = require('qrcode');
const { acapy } = require('../lib/acapy');
const store = require('../lib/store');

const router = express.Router();

// Faculty-r nijer invitation QR
router.post('/invite', async (req, res) => {
  try {
    const inv = await acapy('POST', '/out-of-band/create-invitation?auto_accept=true', {
      alias: 'faculty-chat',
      my_label: 'Prof. Ayesha Rahman (Faculty)',
      handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
    });
    store.faculty = { status: 'waiting', invitationMsgId: inv.invi_msg_id, connectionId: null };
    store.byInvitation.set(inv.invi_msg_id, 'faculty');
    store.messages.length = 0;
    const qr = await QRCode.toDataURL(inv.invitation_url);
    res.json({ qr });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/status', (req, res) => res.json({ status: store.faculty.status }));

// Faculty -> student message (DIDComm basic message protocol)
router.post('/send', async (req, res) => {
  try {
    if (!store.faculty.connectionId) return res.status(400).json({ error: 'Not connected yet' });
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Empty message' });
    await acapy('POST', `/connections/${store.faculty.connectionId}/send-message`, { content: text });
    store.messages.push({ from: 'faculty', text, time: new Date().toISOString() });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Browser-er jonno: puro chat thread
router.get('/messages', (req, res) =>
  res.json({ status: store.faculty.status, messages: store.messages }));

module.exports = router;