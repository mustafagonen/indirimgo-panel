-- ═══════════════════════════════════════════════════════════════
-- indirimGO Admin Panel — Supabase SQL Migration
-- Supabase SQL Editor'a kopyalayıp çalıştırın
-- ═══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────
-- 1. COMPANIES (Firmalar)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  logo_url    TEXT,
  category    TEXT NOT NULL CHECK (category IN (
                'fashion','food','electronics','beauty',
                'sports','home','supermarket','entertainment'
              )),
  phone       TEXT,
  website     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 2. LOCATIONS (Lokasyonlar)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  latitude    FLOAT8 NOT NULL,
  longitude   FLOAT8 NOT NULL,
  mall_name   TEXT,
  floor       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 3. DISCOUNTS (İndirimler)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_id       UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  discount_percent  INT4 NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  original_price    FLOAT8,
  discounted_price  FLOAT8,
  badge             TEXT,
  valid_until       TIMESTAMPTZ NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  rating            FLOAT4 CHECK (rating BETWEEN 1.0 AND 5.0),
  review_count      INT4 DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_locations_company_id ON locations(company_id);
CREATE INDEX IF NOT EXISTS idx_discounts_company_id ON discounts(company_id);
CREATE INDEX IF NOT EXISTS idx_discounts_location_id ON discounts(location_id);
CREATE INDEX IF NOT EXISTS idx_discounts_valid_until ON discounts(valid_until);
CREATE INDEX IF NOT EXISTS idx_discounts_is_active ON discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);

-- ─────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Flutter app (anonim kullanıcılar) için sadece okuma
CREATE POLICY "Public read companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Public read locations" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Public read discounts" ON discounts
  FOR SELECT USING (true);

-- Admin (authenticated) için tam yetki
CREATE POLICY "Admin full access companies" ON companies
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access locations" ON locations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access discounts" ON discounts
  FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────
-- STORAGE BUCKET (Logo yükleme için)
-- ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: herkes okuyabilir
CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

-- Sadece authenticated kullanıcılar yükleyebilir
CREATE POLICY "Admin upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-logos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-logos' AND auth.role() = 'authenticated'
  );

-- ─────────────────────────────────────────────────
-- ÖRNEK VERİ (Opsiyonel — kaldırabilirsiniz)
-- ─────────────────────────────────────────────────

-- Örnek firma
INSERT INTO companies (id, name, category, phone, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Zara', 'fashion', '+90 212 000 00 00', true),
  ('22222222-2222-2222-2222-222222222222', 'McDonald''s', 'food', '+90 444 00 00', true),
  ('33333333-3333-3333-3333-333333333333', 'MediaMarkt', 'electronics', '+90 850 000 00 00', true)
ON CONFLICT (id) DO NOTHING;

-- Örnek lokasyon
INSERT INTO locations (company_id, address, city, latitude, longitude, mall_name, floor)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Cevahir AVM', 'İstanbul', 41.0622, 28.9999, 'Cevahir AVM', 'Kat 2'),
  ('22222222-2222-2222-2222-222222222222', 'Kızılay Meydanı No:1', 'Ankara', 39.9208, 32.8541, null, null),
  ('33333333-3333-3333-3333-333333333333', 'Forum Bornova AVM', 'İzmir', 38.4750, 27.2219, 'Forum Bornova', 'Zemin Kat')
ON CONFLICT DO NOTHING;
