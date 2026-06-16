-- LilTicket PostgreSQL schema for Supabase.
-- Run this file in Supabase SQL Editor before starting the Express.js backend.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone_number VARCHAR(30),
  role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('CUSTOMER', 'ADMIN'))
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100),
  capacity INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT venues_capacity_check CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  venue_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  poster_url TEXT,
  banner_url TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
  CONSTRAINT events_time_check CHECK (end_at IS NULL OR end_at > start_at),
  CONSTRAINT events_category_id_fk FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
  CONSTRAINT events_venue_id_fk FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  quota INTEGER NOT NULL,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  sale_start_at TIMESTAMPTZ,
  sale_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ticket_types_price_check CHECK (price >= 0),
  CONSTRAINT ticket_types_quota_check CHECK (quota > 0),
  CONSTRAINT ticket_types_sold_quantity_check CHECK (sold_quantity >= 0 AND sold_quantity <= quota),
  CONSTRAINT ticket_types_sale_time_check CHECK (sale_end_at IS NULL OR sale_start_at IS NULL OR sale_end_at > sale_start_at),
  CONSTRAINT ticket_types_event_id_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  booking_code VARCHAR(40) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING_PAYMENT',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_status_check CHECK (status IN ('WAITING_PAYMENT', 'CONFIRMED', 'CANCELLED')),
  CONSTRAINT bookings_total_amount_check CHECK (total_amount >= 0),
  CONSTRAINT bookings_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT bookings_event_id_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  ticket_type_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT booking_items_unit_price_check CHECK (unit_price >= 0),
  CONSTRAINT booking_items_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT booking_items_booking_id_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT booking_items_ticket_type_id_fk FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id) ON DELETE RESTRICT,
  CONSTRAINT booking_items_booking_ticket_type_unique UNIQUE (booking_id, ticket_type_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100) UNIQUE,
  checkout_url TEXT,
  xendit_invoice_id VARCHAR(100) UNIQUE,
  xendit_external_id VARCHAR(100) UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_status_check CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED')),
  CONSTRAINT payments_amount_check CHECK (amount >= 0),
  CONSTRAINT payments_booking_id_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  booking_item_id UUID,
  ticket_code VARCHAR(80) NOT NULL UNIQUE,
  holder_name VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
  activated_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tickets_status_check CHECK (status IN ('INACTIVE', 'ACTIVE', 'USED')),
  CONSTRAINT tickets_booking_id_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT tickets_booking_item_id_fk FOREIGN KEY (booking_item_id) REFERENCES booking_items (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_events_title ON events (title);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events (category_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events (venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
