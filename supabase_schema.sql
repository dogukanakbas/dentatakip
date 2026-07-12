-- ==============================================================================
-- SOLO HEKİM PRO — Production SaaS PostgreSQL / Supabase Database Schema
-- Multi-Tenant Practice Isolation, Row Level Security (RLS) & KVKK Compliance
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PRACTICES TABLE (Muayenehane / Tenant Katmanı)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    chair_count INTEGER DEFAULT 1,
    subscription_status VARCHAR(50) DEFAULT 'trial_active', -- 'trial_active', 'active', 'cancelled'
    subscription_plan VARCHAR(50) DEFAULT 'solo_monthly_1490',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    whatsapp_phone_number_id VARCHAR(100),
    whatsapp_api_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. USERS TABLE (Hekim ve Asistan Rolleri)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS practice_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'doctor', -- 'doctor' (Tam Yetkili), 'assistant' (Finans Hariç/Dahil)
    kvkk_consent_accepted BOOLEAN DEFAULT TRUE,
    kvkk_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PATIENTS TABLE (Hasta Kartları - P0)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    patient_code VARCHAR(50) NOT NULL, -- Örn: P-101
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    tc_kimlik VARCHAR(11), -- KVKK uyarınca opsiyonel / maskelenebilir
    birth_date DATE,
    blood_group VARCHAR(10),
    medical_notes TEXT, -- Alerjiler, kronik hastalıklar vb.
    total_treatment_cost NUMERIC(12, 2) DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) GENERATED ALWAYS AS (total_treatment_cost - paid_amount) STORED,
    status VARCHAR(50) DEFAULT 'Yeni Kayıt',
    last_visit_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. TREATMENT NOTES / ODONTOGRAM (Kronolojik Tedavi Notları - P0)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    treatment_type VARCHAR(150) NOT NULL, -- Örn: Kanal Tedavisi, İmplant, Dolgu
    tooth_number VARCHAR(20) DEFAULT '-', -- Örn: 36, 14, Tümü
    clinical_note TEXT NOT NULL,
    treatment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. APPOINTMENTS TABLE (Takvim & Randevular - P0)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL, -- '09:30', '14:00'
    duration_minutes INTEGER DEFAULT 45,
    procedure_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Bekliyor', -- 'Bekliyor', 'Geldi', 'Gelmedi', 'İptal'
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for instant Conflict Detection query on same practice & slot
CREATE INDEX IF NOT EXISTS idx_appointments_conflict
ON appointments(practice_id, appointment_date, appointment_time)
WHERE status != 'İptal';

-- ------------------------------------------------------------------------------
-- 6. PAYMENTS TABLE (Tahsilat Kayıtları - P0)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Kredi Kartı', 'Nakit', 'EFT / Havale'
    payment_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. WHATSAPP AUTOMATION LOGS (Bölüm 6.4)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message_type VARCHAR(100) NOT NULL, -- 'Randevu Hatırlatma (24 saat)', 'Ödeme Hatırlatma'
    message_text TEXT NOT NULL,
    delivery_status VARCHAR(50) DEFAULT 'İletildi', -- 'İletildi', 'Onaylandı', 'Hata'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — Multi-Tenant KVKK Data Isolation
-- ==============================================================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policy: Users can only query & edit data within their own practice_id
CREATE POLICY practice_isolation_patients ON patients
    FOR ALL
    USING (practice_id IN (
        SELECT practice_id FROM practice_users WHERE email = current_user
    ));

CREATE POLICY practice_isolation_appointments ON appointments
    FOR ALL
    USING (practice_id IN (
        SELECT practice_id FROM practice_users WHERE email = current_user
    ));
