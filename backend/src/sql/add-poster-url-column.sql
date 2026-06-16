-- Migration for existing LilTicket databases that still use events.banner_url.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'banner_url'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'poster_url'
  ) THEN
    ALTER TABLE events RENAME COLUMN banner_url TO poster_url;
  END IF;
END $$;
