-- ====================================================
-- Magnet POS — Supabase Database Schema
-- شغّل هذا الـ SQL في Supabase SQL Editor
-- ====================================================

-- جدول الطلبات الموحد
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number  TEXT NOT NULL UNIQUE,
  items         JSONB NOT NULL DEFAULT '[]',
  subtotal      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','rejected','preparing','ready','delivered','completed')),
  order_source  TEXT NOT NULL DEFAULT 'pos'
                  CHECK (order_source IN ('pos','mobile_app')),
  payment_method TEXT CHECK (payment_method IN ('cash','card','wallet')),
  customer_name  TEXT,
  customer_phone TEXT,
  notes          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_source        ON orders (order_source);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON orders (created_at DESC);

-- تفعيل Realtime على جدول الطلبات
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) — اختياري، فعّله إذا أردت
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- بيانات تجريبية (اختياري)
-- ====================================================
INSERT INTO orders (order_number, items, subtotal, tax, total, status, order_source, customer_name, customer_phone)
VALUES
  (
    'MOB-001',
    '[{"id":"p1","name":"برجر كلاسيك","price":32,"quantity":2,"category":"burger","subtotal":64},{"id":"p9","name":"كولا","price":8,"quantity":2,"category":"drinks","subtotal":16}]',
    80.00, 12.00, 92.00,
    'pending', 'mobile_app', 'محمد العمري', '0501234567'
  ),
  (
    'MOB-002',
    '[{"id":"p4","name":"بيتزا مارغريتا","price":45,"quantity":1,"category":"pizza","subtotal":45}]',
    45.00, 6.75, 51.75,
    'accepted', 'mobile_app', 'سارة الأحمدي', '0559876543'
  );
