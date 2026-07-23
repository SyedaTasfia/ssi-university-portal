const express = require('express');
const QRCode = require('qrcode');
const crypto = require('node:crypto');
const { acapy } = require('../lib/acapy');
const store = require('../lib/store');

const router = express.Router();


router.post('/start', async (req, res) => {
  try {
    
    const presReq = await acapy('POST', '/present-proof-2.0/create-request', {
      auto_verify: true,
      presentation_request: {
        indy: {
          name: 'University Portal Login',
          version: '1.0',
          requested_attributes: {
            student_info: {
              names: ['student_name', 'student_id', 'department', 'email'],
              restrictions: [{ cred_def_id: process.env.CRED_DEF_ID }],
            },
          },
          requested_predicates: {},
        },
      },
    });
    
    const inv = await acapy('POST', '/out-of-band/create-invitation', {
      attachments: [{ id: presReq.pres_ex_id, type: 'present-proof' }],
    });

    const loginId = crypto.randomUUID();
    store.logins.set(loginId, { status: 'pending', presExId: presReq.pres_ex_id, user: null });
    store.byPresEx.set(presReq.pres_ex_id, loginId);   

    const qr = await QRCode.toDataURL(inv.invitation_url);
    res.json({ loginId, qr });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


router.get('/status/:loginId', (req, res) => {
  const login = store.logins.get(req.params.loginId);
  if (!login) return res.status(404).json({ status: 'unknown' });
  if (login.status === 'verified' && login.user) {
    req.session.user = login.user;   
  }
  res.json({ status: login.status });
});

module.exports = router;