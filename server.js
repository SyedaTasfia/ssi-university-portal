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

app.use('/api/login', require('./routes/login'));

function requireLogin(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');   // session na thakle gate-ei ferot
}

app.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));
app.get('/login', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', requireLogin, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.get('/api/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'not logged in' });
    res.json(req.session.user);
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get('/profile', requireLogin, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'profile.html')));

 // Faculty DIDComm Chat
app.use('/api/faculty', require('./routes/faculty'));
app.get('/faculty', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'faculty.html')));

// CSS ar onnano static file
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🎓 University Portal backend: http://localhost:${PORT}`));