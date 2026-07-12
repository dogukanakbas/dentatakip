/* ==============================================================================
   SOLO HEKİM PRO SAAS — PRODUCTION EXPRESS & RELATIONAL SQLITE BACKEND
   Powered by Express, better-sqlite3 (ACID SQL Database), and JWT Auth.
   ============================================================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'solo_hekim_pro_super_secret_jwt_key_2026';
const DB_PATH = path.join(__dirname, 'solohekim_production.db');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Connect to Better-SQLite3 production database with WAL mode for high concurrency
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ==============================================================================
   INITIALIZE PRODUCTION SQL RELATIONAL SCHEMA
   ============================================================================== */
db.exec(`
  CREATE TABLE IF NOT EXISTS practices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    chair_count INTEGER DEFAULT 1,
    whatsapp_api_token TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'doctor',
    created_at TEXT NOT NULL,
    FOREIGN KEY(practice_id) REFERENCES practices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    tc TEXT,
    birthDate TEXT,
    bloodGroup TEXT,
    notes TEXT,
    totalCost REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    lastVisit TEXT,
    status TEXT DEFAULT 'Yeni Kayıt',
    created_at TEXT NOT NULL,
    FOREIGN KEY(practice_id) REFERENCES practices(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_patients_practice ON patients(practice_id);

  CREATE TABLE IF NOT EXISTS patient_files (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'Röntgen',
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_files_patient ON patient_files(patient_id);

  CREATE TABLE IF NOT EXISTS patient_history (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    tooth TEXT DEFAULT '-',
    note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_history_patient ON patient_history(patient_id);

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    patientName TEXT NOT NULL,
    phone TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    durationMinutes INTEGER DEFAULT 45,
    procedure TEXT DEFAULT 'Muayene',
    status TEXT DEFAULT 'Bekliyor',
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(practice_id) REFERENCES practices(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_appts_practice_date ON appointments(practice_id, date);

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    patientId TEXT,
    patientName TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT DEFAULT 'Nakit',
    date TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(practice_id) REFERENCES practices(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_payments_practice ON payments(practice_id);

  CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_resets_email ON password_resets(email);

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    status TEXT DEFAULT 'trial',
    price REAL NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly',
    trial_ends_at TEXT NOT NULL,
    current_period_end TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(practice_id) REFERENCES practices(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_subs_practice ON subscriptions(practice_id);
`);

/* --- MIDDLEWARE --- */
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files and uploaded X-ray archives
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// JWT Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Oturum açmanız gerekiyor.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Oturum süreniz dolmuş veya geçersiz.' });
  }
}

/* ==============================================================================
   1. AUTH & TENANT REGISTRATION API
   ============================================================================== */

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { doctorName, practiceTitle, email, password, phone } = req.body;
  if (!doctorName || !practiceTitle || !email || !password) {
    return res.status(400).json({ error: 'Lütfen zorunlu tüm alanları doldurunuz.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut.' });
  }

  const practiceId = `prac-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const now = new Date().toISOString();

  const insertPractice = db.prepare(`
    INSERT INTO practices (id, name, doctor_name, phone, address, chair_count, whatsapp_api_token, created_at)
    VALUES (?, ?, ?, ?, ?, 1, '', ?)
  `);
  const insertUser = db.prepare(`
    INSERT INTO users (id, practice_id, email, password_hash, full_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, 'doctor', ?)
  `);

  const hashedPass = bcrypt.hashSync(password, 10);
  const registerTx = db.transaction(() => {
    insertPractice.run(practiceId, practiceTitle, doctorName, phone || '', 'Türkiye • Solo Muayenehane', now);
    insertUser.run(userId, practiceId, cleanEmail, hashedPass, doctorName, now);
  });
  registerTx();

  const token = jwt.sign({ id: userId, practice_id: practiceId, email: cleanEmail, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });
  const practice = db.prepare('SELECT * FROM practices WHERE id = ?').get(practiceId);

  return res.status(201).json({
    message: 'Muayenehaneniz SQL veritabanında başarıyla açıldı!',
    token,
    user: { id: userId, email: cleanEmail, full_name: doctorName, role: 'doctor' },
    practice
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı. Lütfen kontrol ediniz.' });
  }

  const practice = db.prepare('SELECT * FROM practices WHERE id = ?').get(user.practice_id) || {};
  const token = jwt.sign({ id: user.id, practice_id: user.practice_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(200).json({
    message: 'Giriş başarılı!',
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    practice
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  const practice = db.prepare('SELECT * FROM practices WHERE id = ?').get(req.user.practice_id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  return res.status(200).json({ user, practice });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req, res) => {
  const cleanEmail = (req.body.email || '').trim().toLowerCase();
  if (!cleanEmail) return res.status(400).json({ error: 'E-posta adresi zorunludur.' });

  const user = db.prepare('SELECT id, full_name FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'Bu e-posta adresiyle kayıtlı bir hekim bulunamadı.' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const resetId = `RST-${Date.now()}`;
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 dakika geçerli
  const now = new Date().toISOString();

  db.prepare('DELETE FROM password_resets WHERE email = ?').run(cleanEmail);
  db.prepare(`
    INSERT INTO password_resets (id, email, code, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(resetId, cleanEmail, code, expiresAt, now);

  return res.status(200).json({
    message: 'Şifre sıfırlama kodu oluşturuldu.',
    email: cleanEmail,
    code // Canlı öncesi veya SMS/Mail entegrasyonu için test amaçlı dönülür
  });
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req, res) => {
  const cleanEmail = (req.body.email || '').trim().toLowerCase();
  const { code, newPassword } = req.body;

  if (!cleanEmail || !code || !newPassword) {
    return res.status(400).json({ error: 'Tüm alanları doldurunuz.' });
  }

  const resetRecord = db.prepare('SELECT * FROM password_resets WHERE email = ? AND code = ?').get(cleanEmail, code);
  if (!resetRecord || resetRecord.expires_at < Date.now()) {
    return res.status(400).json({ error: 'Sıfırlama kodu geçersiz veya süresi dolmuş.' });
  }

  const hashedPass = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hashedPass, cleanEmail);
  db.prepare('DELETE FROM password_resets WHERE email = ?').run(cleanEmail);

  return res.status(200).json({
    message: 'Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz.'
  });
});

/* ==============================================================================
   2. PATIENTS & RELATIONAL FILES ARCHIVE API
   ============================================================================== */

// Helper to hydrate full patient record with SQL child tables
function hydratePatient(p) {
  const files = db.prepare('SELECT id, name, url, type, date FROM patient_files WHERE patient_id = ? ORDER BY created_at DESC').all(p.id);
  const history = db.prepare('SELECT id, date, type, tooth, note FROM patient_history WHERE patient_id = ? ORDER BY created_at DESC').all(p.id);
  return { ...p, files, history };
}

// GET /api/patients
app.get('/api/patients', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM patients WHERE practice_id = ? ORDER BY created_at DESC').all(req.user.practice_id);
  const hydrated = rows.map(hydratePatient);
  return res.status(200).json(hydrated);
});

// POST /api/patients
app.post('/api/patients', authMiddleware, (req, res) => {
  const { name, phone, tc, birthDate, bloodGroup, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Hasta adı ve telefonu zorunludur.' });

  const id = `P-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  db.prepare(`
    INSERT INTO patients (id, practice_id, name, phone, tc, birthDate, bloodGroup, notes, totalCost, paidAmount, balance, lastVisit, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 'Yeni Kayıt', ?)
  `).run(id, req.user.practice_id, name, phone, tc || '', birthDate || '', bloodGroup || '', notes || '', today, now);

  const newPatient = hydratePatient(db.prepare('SELECT * FROM patients WHERE id = ?').get(id));
  return res.status(201).json(newPatient);
});

// POST /api/patients/:id/upload (Real multipart/Base64 Image & X-Ray Uploads stored to disk + SQL table)
app.post('/api/patients/:id/upload', authMiddleware, (req, res) => {
  const patientId = req.params.id;
  const patient = db.prepare('SELECT id FROM patients WHERE id = ? AND practice_id = ?').get(patientId, req.user.practice_id);
  if (!patient) return res.status(404).json({ error: 'Hasta kartı bulunamadı.' });

  const { fileName, fileData, fileCategory } = req.body;
  if (!fileName || !fileData) return res.status(400).json({ error: 'Dosya seçilmedi.' });

  const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const filePath = path.join(UPLOADS_DIR, safeName);

  const base64Content = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
  fs.writeFileSync(filePath, base64Content, 'base64');

  const fileId = `F-${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const url = `/uploads/${safeName}`;
  const type = fileCategory || 'Röntgen';

  db.prepare(`
    INSERT INTO patient_files (id, practice_id, patient_id, name, url, type, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(fileId, req.user.practice_id, patientId, fileName, url, type, today, now);

  return res.status(201).json({
    message: 'Dosya fiziki diske ve SQL veritabanına kaydedildi.',
    file: { id: fileId, name: fileName, url, type, date: today }
  });
});

// POST /api/patients/:id/notes
app.post('/api/patients/:id/notes', authMiddleware, (req, res) => {
  const patientId = req.params.id;
  const patient = db.prepare('SELECT id FROM patients WHERE id = ? AND practice_id = ?').get(patientId, req.user.practice_id);
  if (!patient) return res.status(404).json({ error: 'Hasta kartı bulunamadı.' });

  const noteId = `H-${Date.now()}`;
  const today = req.body.date || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO patient_history (id, practice_id, patient_id, date, type, tooth, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(noteId, req.user.practice_id, patientId, today, req.body.type || 'Muayene', req.body.tooth || '-', req.body.note || '', now);

  return res.status(201).json({
    id: noteId, date: today, type: req.body.type || 'Muayene', tooth: req.body.tooth || '-', note: req.body.note || ''
  });
});

/* ==============================================================================
   3. APPOINTMENTS API (WITH SERVER-SIDE CONFLICT DETECTION)
   ============================================================================== */

app.get('/api/appointments', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM appointments WHERE practice_id = ? ORDER BY date ASC, time ASC').all(req.user.practice_id);
  return res.status(200).json(rows);
});

app.post('/api/appointments', authMiddleware, (req, res) => {
  const { patientName, phone, date, time, procedure, durationMinutes, forceConflictOverride } = req.body;
  if (!patientName || !date || !time) {
    return res.status(400).json({ error: 'Hasta adı, randevu tarihi ve saati zorunludur.' });
  }

  // Conflict Check
  const conflict = db.prepare(`
    SELECT * FROM appointments
    WHERE practice_id = ? AND date = ? AND time = ? AND status != 'İptal'
  `).get(req.user.practice_id, date, time);

  if (conflict && !forceConflictOverride) {
    return res.status(409).json({
      error: 'ÇAKIŞMA UYARISI: Bu saat diliminde başka bir randevunuz mevcuttur.',
      conflict
    });
  }

  const id = `A-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO appointments (id, practice_id, patientName, phone, date, time, durationMinutes, procedure, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Bekliyor', '', ?)
  `).run(id, req.user.practice_id, patientName, phone || '', date, time, durationMinutes || 45, procedure || 'Genel Muayene', now);

  const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  return res.status(201).json(created);
});

app.patch('/api/appointments/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE appointments SET status = ? WHERE id = ? AND practice_id = ?').run(status, req.params.id, req.user.practice_id);
  return res.status(200).json({ ok: true, status });
});

/* ==============================================================================
   4. PAYMENTS & FINANCIAL LEDGER API
   ============================================================================== */

app.get('/api/payments', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM payments WHERE practice_id = ? ORDER BY date DESC').all(req.user.practice_id);
  return res.status(200).json(rows);
});

app.post('/api/payments', authMiddleware, (req, res) => {
  const { patientId, patientName, amount, method, note } = req.body;
  const id = `PAY-${Date.now().toString().slice(-4)}`;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (id, practice_id, patientId, patientName, amount, method, date, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.practice_id, patientId || '', patientName || 'Hasta', Number(amount) || 0, method || 'Nakit', today, note || '', now);

    if (patientId) {
      const p = db.prepare('SELECT totalCost, paidAmount FROM patients WHERE id = ? AND practice_id = ?').get(patientId, req.user.practice_id);
      if (p) {
        const newPaid = (p.paidAmount || 0) + Number(amount);
        const newBalance = Math.max(0, (p.totalCost || 0) - newPaid);
        db.prepare('UPDATE patients SET paidAmount = ?, balance = ? WHERE id = ?').run(newPaid, newBalance, patientId);
      }
    }
  });
  tx();

  const created = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  return res.status(201).json(created);
});

/* ==============================================================================
   5. SAAS ABONELİK & ÖDEME GEÇİDİ (SUBSCRIPTION & CHECKOUT API)
   ============================================================================== */

app.get('/api/subscription/me', authMiddleware, (req, res) => {
  let sub = db.prepare('SELECT * FROM subscriptions WHERE practice_id = ? ORDER BY created_at DESC').get(req.user.practice_id);
  if (!sub) {
    // Return default 14-day trial status
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    sub = {
      id: `SUB-TRIAL-${req.user.practice_id}`,
      practice_id: req.user.practice_id,
      plan_id: 'solo-trial',
      plan_name: '14 Gün Ücretsiz Deneme Planı',
      status: 'trial',
      price: 0,
      billing_cycle: 'monthly',
      trial_ends_at: trialEnds,
      current_period_end: trialEnds,
      created_at: now.toISOString()
    };
  }
  return res.status(200).json(sub);
});

app.post('/api/subscription/checkout', authMiddleware, (req, res) => {
  const { planId, billingCycle } = req.body;
  const isYearly = billingCycle === 'yearly';
  const price = isYearly ? 14900 : 1490;
  const planName = isYearly ? 'DentaTakip Pro — Yıllık Tam Lisans' : 'DentaTakip Pro — Aylık Esnek Plan';

  const subId = `SUB-${Date.now()}`;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  db.prepare('DELETE FROM subscriptions WHERE practice_id = ?').run(req.user.practice_id);
  db.prepare(`
    INSERT INTO subscriptions (id, practice_id, plan_id, plan_name, status, price, billing_cycle, trial_ends_at, current_period_end, created_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
  `).run(subId, req.user.practice_id, planId || 'solo-pro', planName, price, billingCycle || 'monthly', periodEnd, periodEnd, now.toISOString());

  const updatedSub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subId);

  return res.status(200).json({
    success: true,
    message: 'Ödeme başarılı! Pro aboneliğiniz aktif hale getirildi.',
    subscription: updatedSub
  });
});

// Fallback to landing page for root request
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

app.listen(PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`🚀 DENTATAKİP (dentatakip.com) — PRODUCTION SQL & EXPRESS SUNUCUSU AKTİF!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️ Veritabanı: Relational SQLite (${DB_PATH}) (WAL Modu)`);
  console.log(`===============================================================\n`);
});
