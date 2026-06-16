-- Migration for existing LilTicket databases that do not have event hero backgrounds yet.
ALTER TABLE events
ADD COLUMN IF NOT EXISTS banner_url TEXT;
