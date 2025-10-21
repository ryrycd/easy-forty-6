

-- Additions for weekly targets and validity
ALTER TABLE links ADD COLUMN weekly_target INTEGER NOT NULL DEFAULT 0;
ALTER TABLE links ADD COLUMN valid_until TEXT;
ALTER TABLE links ADD COLUMN note TEXT;
