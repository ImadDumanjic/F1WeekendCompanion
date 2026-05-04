DROP TRIGGER IF EXISTS trg_prevent_locked_prediction_write ON predictions;
DROP FUNCTION IF EXISTS prevent_locked_prediction_write();

DROP INDEX IF EXISTS idx_races_year_round;

ALTER TABLE races
  DROP COLUMN IF EXISTS race_year,
  DROP COLUMN IF EXISTS race_round,
  DROP COLUMN IF EXISTS qualifying_start_at;
