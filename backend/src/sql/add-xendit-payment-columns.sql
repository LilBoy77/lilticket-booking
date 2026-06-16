ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS xendit_invoice_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS xendit_external_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_xendit_invoice_id
  ON payments (xendit_invoice_id)
  WHERE xendit_invoice_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_xendit_external_id
  ON payments (xendit_external_id)
  WHERE xendit_external_id IS NOT NULL;
