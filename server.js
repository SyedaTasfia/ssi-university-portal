require('dotenv').config();
const path = require('node:path');
const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json({ limit: '5mb' }));   // proof-er payload boro hote pare

// Login session: browser-e cookie, server-er memory-te data (demo-r jonno thik)
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-only-secret',
    resave: false,
    saveUninitialized: true,
}));

// ACA-Py-r thele pathano khobor
app.use('/webhooks', require('./routes/webhooks'));

app.use('/api/admin', require('./routes/admin'));
app.get('/admin', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// CSS ar onnano static file
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🎓 University Portal backend: http://localhost:${PORT}`));