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

  CREATE TABLE IF NOT EXISTS lab_jobs (
    id TEXT PRIMARY KEY,
    practice_id TEXT NOT NULL,
    patient_id TEXT,
    patient_name TEXT NOT NULL,
    doctor_id TEXT,
    doctor_name TEXT NOT NULL,
    lab_name TEXT NOT NULL,
    work_type TEXT NOT NULL,
    shade TEXT DEFAULT 'A2',
    sent_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    cost REAL DEFAULT 0,
    status TEXT DEFAULT 'Ölçü Gönderildi',
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(practice_id) REFERENCES practices(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_lab_practice ON lab_jobs(practice_id);
`);

/* --- SAFE SCHEMA MIGRATIONS FOR DENTATAKİP 2.0 (SUPER ADMIN & MULTI-DOCTOR) --- */
const migrations = [
  "ALTER TABLE practices ADD COLUMN status TEXT DEFAULT 'active'",
  "ALTER TABLE practices ADD COLUMN plan_type TEXT DEFAULT 'solo'",
  "ALTER TABLE users ADD COLUMN title TEXT DEFAULT 'Diş Hekimi'",
  "ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN room TEXT DEFAULT '1. Koltuk'",
  "ALTER TABLE users ADD COLUMN commission_rate REAL DEFAULT 40",
  "ALTER TABLE patients ADD COLUMN doctor_id TEXT",
  "ALTER TABLE patients ADD COLUMN doctor_name TEXT",
  "ALTER TABLE appointments ADD COLUMN doctor_id TEXT",
  "ALTER TABLE appointments ADD COLUMN doctor_name TEXT",
  "ALTER TABLE payments ADD COLUMN doctor_id TEXT",
  "ALTER TABLE payments ADD COLUMN doctor_name TEXT"
];
migrations.forEach(m => {
  try { db.exec(m); } catch (e) { /* Column already exists */ }
});

// Auto-promote initial creator doctors to owner if no owner exists for their practice
try {
  db.exec(`
    UPDATE users SET role = 'owner' 
    WHERE role = 'doctor' 
    AND id IN (
      SELECT u.id FROM users u 
      WHERE u.role = 'doctor' AND NOT EXISTS (
        SELECT 1 FROM users u2 WHERE u2.practice_id = u.practice_id AND u2.role = 'owner'
      )
    );
  `);
} catch (e) {}

// Ensure default Super Admin practice and user exist
try {
  const superExist = db.prepare("SELECT id FROM users WHERE role = 'superadmin'").get();
  if (!superExist) {
    const superPracticeId = 'PR-SUPERADMIN';
    const superUserId = 'USR-SUPERADMIN';
    const passwordHash = bcrypt.hashSync('Admin2026!', 10);
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT OR IGNORE INTO practices (id, name, doctor_name, phone, address, chair_count, status, plan_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(superPracticeId, 'DentaTakip Platform Yönetimi', 'Süper Admin', '+90 850 000 00 00', 'İstanbul, Türkiye', 99, 'active', 'enterprise', now);

    db.prepare(`
      INSERT OR IGNORE INTO users (id, practice_id, email, password_hash, full_name, role, title, phone, room, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(superUserId, superPracticeId, 'admin@dentatakip.com', passwordHash, 'Platform Yöneticisi', 'superadmin', 'Süper Admin', '+90 850 000 00 00', 'Merkez Ofis', now);
    
    console.log("👑 Varsayılan Süper Admin hesabı oluşturuldu -> E-posta: admin@dentatakip.com | Şifre: Admin2026!");
  }
} catch (e) {
  console.error("Superadmin seed error:", e);
}

/* --- MIDDLEWARE --- */
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files and uploaded X-ray archives
app.use(express.static(__dirname, { index: 'landing.html' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// JWT Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Oturum açmanız gerekiyor.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (decoded.role !== 'superadmin') {
      const p = db.prepare('SELECT status FROM practices WHERE id = ?').get(decoded.practice_id);
      if (p && p.status === 'suspended') {
        return res.status(403).json({ error: 'Bu muayenehanenin hesabı geçici olarak askıya alınmıştır. Lütfen platform yönetimi ile iletişime geçin.' });
      }
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Oturum süreniz dolmuş veya geçersiz.' });
  }
}

function superAdminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Bu işlem için Süper Admin yetkiniz olmalıdır.' });
  }
  next();
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
    INSERT INTO practices (id, name, doctor_name, phone, address, chair_count, status, plan_type, whatsapp_api_token, created_at)
    VALUES (?, ?, ?, ?, ?, 1, 'active', 'solo', '', ?)
  `);
  const insertUser = db.prepare(`
    INSERT INTO users (id, practice_id, email, password_hash, full_name, role, title, phone, room, created_at)
    VALUES (?, ?, ?, ?, ?, 'owner', 'Başhekim / Diş Hekimi', ?, '1. Koltuk', ?)
  `);

  const hashedPass = bcrypt.hashSync(password, 10);
  const registerTx = db.transaction(() => {
    insertPractice.run(practiceId, practiceTitle, doctorName, phone || '', 'Türkiye • Solo Muayenehane', now);
    insertUser.run(userId, practiceId, cleanEmail, hashedPass, doctorName, phone || '', now);
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
  const { name, phone, tc, birthDate, bloodGroup, notes, doctor_id, doctor_name } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Hasta adı ve telefonu zorunludur.' });

  const id = `P-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const targetDocId = doctor_id || req.user.id;
  const targetDocName = doctor_name || req.user.full_name || 'Diş Hekimi';

  db.prepare(`
    INSERT INTO patients (id, practice_id, name, phone, tc, birthDate, bloodGroup, notes, totalCost, paidAmount, balance, lastVisit, status, doctor_id, doctor_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 'Yeni Kayıt', ?, ?, ?)
  `).run(id, req.user.practice_id, name, phone, tc || '', birthDate || '', bloodGroup || '', notes || '', today, targetDocId, targetDocName, now);

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
  const { patientName, phone, date, time, procedure, durationMinutes, forceConflictOverride, doctor_id, doctor_name } = req.body;
  if (!patientName || !date || !time) {
    return res.status(400).json({ error: 'Hasta adı, randevu tarihi ve saati zorunludur.' });
  }

  const targetDocId = doctor_id || req.user.id;
  const targetDocName = doctor_name || req.user.full_name || 'Diş Hekimi';

  // Conflict Check (Check by practice AND specific doctor if doctor_id is specified)
  const conflict = db.prepare(`
    SELECT * FROM appointments
    WHERE practice_id = ? AND date = ? AND time = ? AND (doctor_id = ? OR doctor_id IS NULL OR ? = '') AND status != 'İptal'
  `).get(req.user.practice_id, date, time, targetDocId, targetDocId);

  if (conflict && !forceConflictOverride) {
    return res.status(409).json({
      error: `ÇAKIŞMA UYARISI: Bu saat diliminde (${conflict.time}) "${conflict.doctor_name || 'Hekim'}" üzerinde başka bir randevu mevcuttur.`,
      conflict
    });
  }

  const id = `A-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO appointments (id, practice_id, patientName, phone, date, time, durationMinutes, procedure, status, notes, doctor_id, doctor_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Bekliyor', '', ?, ?, ?)
  `).run(id, req.user.practice_id, patientName, phone || '', date, time, durationMinutes || 45, procedure || 'Genel Muayene', targetDocId, targetDocName, now);

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
  const { patientId, patientName, amount, method, note, doctor_id, doctor_name } = req.body;
  const id = `PAY-${Date.now().toString().slice(-4)}`;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  let targetDocId = doctor_id || '';
  let targetDocName = doctor_name || '';

  if (patientId && (!targetDocId || !targetDocName)) {
    const pInfo = db.prepare('SELECT doctor_id, doctor_name FROM patients WHERE id = ? AND practice_id = ?').get(patientId, req.user.practice_id);
    if (pInfo) {
      if (!targetDocId) targetDocId = pInfo.doctor_id || '';
      if (!targetDocName) targetDocName = pInfo.doctor_name || '';
    }
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (id, practice_id, patientId, patientName, amount, method, date, note, doctor_id, doctor_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.practice_id, patientId || '', patientName || 'Hasta', Number(amount) || 0, method || 'Nakit', today, note || '', targetDocId, targetDocName, now);

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
  const price = isYearly ? 14999 : 1499;
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

/* ==============================================================================
   6. SUPER ADMIN PLATFORM MANAGEMENT API (ONLY FOR role = 'superadmin')
   ============================================================================== */

app.get('/api/admin/overview', authMiddleware, superAdminMiddleware, (req, res) => {
  const practices = db.prepare("SELECT id, status FROM practices WHERE id != 'PR-SUPERADMIN'").all();
  const doctors = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('owner', 'doctor') AND practice_id != 'PR-SUPERADMIN'").get();
  const patients = db.prepare("SELECT COUNT(*) as count FROM patients WHERE practice_id != 'PR-SUPERADMIN'").get();

  let activeCount = 0;
  let trialCount = 0;
  let expiredCount = 0;
  let suspendedCount = 0;
  let estimatedMRR = 0;

  const now = new Date().toISOString().split('T')[0];

  practices.forEach(p => {
    if (p.status === 'suspended') {
      suspendedCount++;
      return;
    }
    const sub = db.prepare('SELECT * FROM subscriptions WHERE practice_id = ? ORDER BY created_at DESC').get(p.id);
    if (!sub || sub.status === 'trial') {
      const ends = sub ? sub.trial_ends_at : p.created_at;
      if (ends >= now) {
        trialCount++;
      } else {
        expiredCount++;
      }
    } else if (sub.status === 'active') {
      if (sub.current_period_end >= now) {
        activeCount++;
        estimatedMRR += sub.billing_cycle === 'yearly' ? Math.round(sub.price / 12) : sub.price;
      } else {
        expiredCount++;
      }
    }
  });

  return res.status(200).json({
    totalPractices: practices.length,
    activePractices: activeCount,
    trialPractices: trialCount,
    expiredPractices: expiredCount,
    suspendedPractices: suspendedCount,
    totalDoctors: doctors.count || 0,
    totalPatients: patients.count || 0,
    estimatedMRR
  });
});

app.get('/api/admin/practices', authMiddleware, superAdminMiddleware, (req, res) => {
  const practices = db.prepare("SELECT * FROM practices WHERE id != 'PR-SUPERADMIN' ORDER BY created_at DESC").all();
  const now = new Date().toISOString().split('T')[0];

  const enriched = practices.map(p => {
    const owner = db.prepare("SELECT full_name, email, phone FROM users WHERE practice_id = ? AND role = 'owner'").get(p.id) ||
                  db.prepare("SELECT full_name, email, phone FROM users WHERE practice_id = ? ORDER BY created_at ASC").get(p.id) || {};
    const doctorCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE practice_id = ? AND role IN ('owner', 'doctor')").get(p.id).count;
    const patientCount = db.prepare("SELECT COUNT(*) as count FROM patients WHERE practice_id = ?").get(p.id).count;
    let sub = db.prepare("SELECT * FROM subscriptions WHERE practice_id = ? ORDER BY created_at DESC").get(p.id);

    if (!sub) {
      const created = new Date(p.created_at || Date.now());
      const trialEnds = new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      sub = {
        status: 'trial',
        plan_name: '14 Gün Ücretsiz Deneme Planı',
        trial_ends_at: trialEnds,
        current_period_end: trialEnds,
        billing_cycle: 'monthly',
        price: 0
      };
    }

    let computedStatus = p.status === 'suspended' ? 'suspended' : sub.status;
    const endDate = sub.status === 'trial' ? sub.trial_ends_at : sub.current_period_end;
    if (computedStatus !== 'suspended' && endDate < now) {
      computedStatus = 'expired';
    }

    return {
      ...p,
      owner_name: owner.full_name || p.doctor_name || 'Hekim',
      email: owner.email || '-',
      owner_phone: owner.phone || p.phone || '-',
      doctor_count: doctorCount,
      patient_count: patientCount,
      subscription: sub,
      computed_status: computedStatus,
      end_date: endDate
    };
  });

  return res.status(200).json(enriched);
});

app.post('/api/admin/practices/:id/extend', authMiddleware, superAdminMiddleware, (req, res) => {
  const { days, customDate } = req.body;
  const practiceId = req.params.id;
  const practice = db.prepare('SELECT * FROM practices WHERE id = ?').get(practiceId);
  if (!practice) return res.status(404).json({ error: 'Muayenehane bulunamadı.' });

  let sub = db.prepare('SELECT * FROM subscriptions WHERE practice_id = ? ORDER BY created_at DESC').get(practiceId);
  let targetDate;

  if (customDate) {
    targetDate = customDate;
  } else {
    const baseDate = sub ? new Date(sub.current_period_end || sub.trial_ends_at) : new Date();
    const now = new Date();
    const effectiveBase = baseDate < now ? now : baseDate;
    effectiveBase.setDate(effectiveBase.getDate() + Number(days || 14));
    targetDate = effectiveBase.toISOString().split('T')[0];
  }

  const nowIso = new Date().toISOString();
  if (!sub) {
    const subId = `SUB-${Date.now()}`;
    db.prepare(`
      INSERT INTO subscriptions (id, practice_id, plan_id, plan_name, status, price, billing_cycle, trial_ends_at, current_period_end, created_at)
      VALUES (?, ?, 'solo-trial', 'Özel Uzatılmış Deneme Planı', 'trial', 0, 'monthly', ?, ?, ?)
    `).run(subId, practiceId, targetDate, targetDate, nowIso);
  } else {
    if (sub.status === 'trial') {
      db.prepare('UPDATE subscriptions SET trial_ends_at = ?, current_period_end = ? WHERE id = ?').run(targetDate, targetDate, sub.id);
    } else {
      db.prepare('UPDATE subscriptions SET current_period_end = ?, status = ? WHERE id = ?').run(targetDate, 'active', sub.id);
    }
  }

  db.prepare("UPDATE practices SET status = 'active' WHERE id = ?").run(practiceId);
  return res.status(200).json({ success: true, message: `Muayenehane süresi ${targetDate} tarihine kadar uzatıldı.` });
});

app.post('/api/admin/practices/:id/status', authMiddleware, superAdminMiddleware, (req, res) => {
  const { status } = req.body;
  const practiceId = req.params.id;
  db.prepare('UPDATE practices SET status = ? WHERE id = ?').run(status, practiceId);
  return res.status(200).json({ success: true, status });
});

app.post('/api/admin/practices/:id/plan', authMiddleware, superAdminMiddleware, (req, res) => {
  const { plan_type, chair_count } = req.body;
  const practiceId = req.params.id;
  db.prepare('UPDATE practices SET plan_type = ?, chair_count = ? WHERE id = ?').run(plan_type || 'solo', Number(chair_count) || 1, practiceId);
  return res.status(200).json({ success: true, plan_type, chair_count });
});

/* ==============================================================================
   7. MULTI-DOCTOR & CLINIC TEAM MANAGEMENT API (FOR role = 'owner' or 'superadmin')
   ============================================================================== */

app.get('/api/team', authMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, email, full_name, role, title, phone, room, commission_rate, created_at 
    FROM users WHERE practice_id = ? ORDER BY created_at ASC
  `).all(req.user.practice_id);
  return res.status(200).json(users);
});

app.post('/api/team', authMiddleware, (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Yeni hekim/asistan ekleme yetkiniz bulunmuyor (Sadece Başhekim/Sahibi ekleyebilir).' });
  }

  const { full_name, email, password, role, title, phone, room, commission_rate } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Ad Soyad, E-posta ve Şifre alanları zorunludur.' });
  }

  const targetRole = role === 'assistant' ? 'assistant' : 'doctor';

  // Strict Plan Quota Enforcement (Solo package allows max 1 doctor/owner)
  if (req.user.role !== 'superadmin' && targetRole === 'doctor') {
    const practice = db.prepare('SELECT plan_type, chair_count FROM practices WHERE id = ?').get(req.user.practice_id);
    if (practice && practice.plan_type === 'solo') {
      const docCountObj = db.prepare("SELECT count(*) as cnt FROM users WHERE practice_id = ? AND role IN ('doctor', 'owner')").get(req.user.practice_id);
      if (docCountObj && docCountObj.cnt >= 1) {
        return res.status(403).json({
          error: 'Mevcut Solo Hekim Pro paketiniz tek hekim/koltuk ile sınırlıdır. Ek hekim ve prim takibi için Poliklinik Pro paketine yükseltin.',
          code: 'PLAN_LIMIT_REACHED'
        });
      }
    }
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'Bu e-posta adresiyle kayıtlı bir kullanıcı zaten mevcut.' });
  }

  const userId = `user-${Date.now()}`;
  const now = new Date().toISOString();
  const hashedPass = bcrypt.hashSync(password, 10);
  const commRate = Number(commission_rate) >= 0 ? Number(commission_rate) : 40;

  db.prepare(`
    INSERT INTO users (id, practice_id, email, password_hash, full_name, role, title, phone, room, commission_rate, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, req.user.practice_id, cleanEmail, hashedPass, full_name, targetRole, title || 'Diş Hekimi', phone || '', room || '1. Koltuk', commRate, now);

  const created = db.prepare('SELECT id, email, full_name, role, title, phone, room, commission_rate, created_at FROM users WHERE id = ?').get(userId);
  return res.status(201).json(created);
});

app.put('/api/team/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Güncelleme yetkiniz bulunmuyor.' });
  }
  const targetId = req.params.id;
  const { title, room, phone, commission_rate, role } = req.body;

  const target = db.prepare('SELECT id, role FROM users WHERE id = ? AND practice_id = ?').get(targetId, req.user.practice_id);
  if (!target) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  const commRate = Number(commission_rate) >= 0 ? Number(commission_rate) : 40;
  const newRole = target.role === 'owner' ? 'owner' : (role === 'assistant' ? 'assistant' : 'doctor');

  db.prepare(`
    UPDATE users SET title = ?, room = ?, phone = ?, commission_rate = ?, role = ?
    WHERE id = ? AND practice_id = ?
  `).run(title || 'Diş Hekimi', room || '1. Koltuk', phone || '', commRate, newRole, targetId, req.user.practice_id);

  const updated = db.prepare('SELECT id, email, full_name, role, title, phone, room, commission_rate, created_at FROM users WHERE id = ?').get(targetId);
  return res.status(200).json(updated);
});

app.get('/api/team/payouts', authMiddleware, (req, res) => {
  const doctors = db.prepare(`
    SELECT id, full_name, title, role, commission_rate 
    FROM users WHERE practice_id = ? AND role IN ('doctor', 'owner') ORDER BY created_at ASC
  `).all(req.user.practice_id);

  const payments = db.prepare('SELECT amount, doctor_id, doctor_name, patientId FROM payments WHERE practice_id = ?').all(req.user.practice_id);
  const patients = db.prepare('SELECT id, doctor_id, doctor_name FROM patients WHERE practice_id = ?').all(req.user.practice_id);
  const labJobs = db.prepare('SELECT cost, doctor_id, doctor_name FROM lab_jobs WHERE practice_id = ?').all(req.user.practice_id);

  const payouts = doctors.map(doc => {
    const grossRevenue = payments.reduce((sum, pay) => {
      if (pay.doctor_id === doc.id || pay.doctor_name === doc.full_name) {
        return sum + (Number(pay.amount) || 0);
      }
      if (!pay.doctor_id && !pay.doctor_name && pay.patientId) {
        const p = patients.find(pt => pt.id === pay.patientId);
        if (p && (p.doctor_id === doc.id || p.doctor_name === doc.full_name)) {
          return sum + (Number(pay.amount) || 0);
        }
      }
      return sum;
    }, 0);

    const labCost = labJobs.reduce((sum, lab) => {
      if (lab.doctor_id === doc.id || lab.doctor_name === doc.full_name) {
        return sum + (Number(lab.cost) || 0);
      }
      return sum;
    }, 0);

    const netBase = Math.max(0, grossRevenue - labCost);
    const commRate = Number(doc.commission_rate) || 40;
    const doctorShare = Math.round((netBase * commRate) / 100);
    const clinicShare = Math.round(grossRevenue - doctorShare - labCost);

    return {
      doctor_id: doc.id,
      doctor_name: doc.full_name,
      title: doc.title,
      role: doc.role,
      commission_rate: commRate,
      gross_revenue: grossRevenue,
      lab_cost: labCost,
      net_base: netBase,
      doctor_share: doctorShare,
      clinic_share: clinicShare
    };
  });

  return res.status(200).json(payouts);
});

app.delete('/api/team/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Silme yetkiniz bulunmuyor.' });
  }
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Kendi hesabınızı bu ekrandan silemezsiniz.' });
  }

  const target = db.prepare('SELECT role FROM users WHERE id = ? AND practice_id = ?').get(targetId, req.user.practice_id);
  if (!target) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  if (target.role === 'owner') {
    return res.status(400).json({ error: 'Muayenehane sahibi / başhekim hesabı silinemez.' });
  }

  db.prepare('DELETE FROM users WHERE id = ? AND practice_id = ?').run(targetId, req.user.practice_id);
  return res.status(200).json({ success: true, id: targetId });
});

/* ==============================================================================
   8. LAB JOBS & PROSTHESIS TRACKING API
   ============================================================================== */

app.get('/api/lab-jobs', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM lab_jobs WHERE practice_id = ? ORDER BY created_at DESC').all(req.user.practice_id);
  return res.status(200).json(rows);
});

app.post('/api/lab-jobs', authMiddleware, (req, res) => {
  const { patient_id, patient_name, doctor_id, doctor_name, lab_name, work_type, shade, due_date, cost, notes } = req.body;
  if (!patient_name || !work_type || !lab_name) {
    return res.status(400).json({ error: 'Hasta adı, iş türü ve laboratuvar adı zorunludur.' });
  }

  const id = `LAB-${Date.now().toString().slice(-4)}`;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  let targetDocId = doctor_id || req.user.id;
  let targetDocName = doctor_name || req.user.full_name;

  db.prepare(`
    INSERT INTO lab_jobs (id, practice_id, patient_id, patient_name, doctor_id, doctor_name, lab_name, work_type, shade, sent_date, due_date, cost, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.practice_id, patient_id || '', patient_name, targetDocId, targetDocName, lab_name, work_type, shade || 'A2', today, due_date || today, Number(cost) || 0, 'Ölçü Gönderildi', notes || '', now);

  const created = db.prepare('SELECT * FROM lab_jobs WHERE id = ?').get(id);
  return res.status(201).json(created);
});

app.put('/api/lab-jobs/:id/status', authMiddleware, (req, res) => {
  const { status, cost } = req.body;
  const targetId = req.params.id;

  const job = db.prepare('SELECT id, cost FROM lab_jobs WHERE id = ? AND practice_id = ?').get(targetId, req.user.practice_id);
  if (!job) return res.status(404).json({ error: 'Sipariş bulunamadı.' });

  const newCost = cost !== undefined ? Number(cost) : job.cost;
  db.prepare('UPDATE lab_jobs SET status = ?, cost = ? WHERE id = ? AND practice_id = ?').run(status || 'Ölçü Gönderildi', newCost, targetId, req.user.practice_id);

  const updated = db.prepare('SELECT * FROM lab_jobs WHERE id = ?').get(targetId);
  return res.status(200).json(updated);
});

app.delete('/api/lab-jobs/:id', authMiddleware, (req, res) => {
  const targetId = req.params.id;
  db.prepare('DELETE FROM lab_jobs WHERE id = ? AND practice_id = ?').run(targetId, req.user.practice_id);
  return res.status(200).json({ success: true, id: targetId });
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
