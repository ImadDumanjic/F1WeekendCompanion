ALTER TABLE races
  ADD COLUMN IF NOT EXISTS race_year SMALLINT,
  ADD COLUMN IF NOT EXISTS race_round SMALLINT,
  ADD COLUMN IF NOT EXISTS qualifying_start_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_races_year_round
  ON races(race_year, race_round)
  WHERE race_year IS NOT NULL AND race_round IS NOT NULL;

CREATE OR REPLACE FUNCTION prevent_locked_prediction_write()
RETURNS trigger AS $$
DECLARE
  lock_start TIMESTAMPTZ;
BEGIN
  SELECT qualifying_start_at
  INTO lock_start
  FROM races
  WHERE race_year = NEW.race_year
    AND race_round = NEW.race_round;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Race not found for prediction %.%', NEW.race_year, NEW.race_round
      USING ERRCODE = '23503';
  END IF;

  IF lock_start IS NOT NULL AND clock_timestamp() >= lock_start THEN
    RAISE EXCEPTION 'Predictions are locked for race %.%', NEW.race_year, NEW.race_round
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_prediction_write ON predictions;

CREATE TRIGGER trg_prevent_locked_prediction_write
BEFORE INSERT OR UPDATE OF race_year, race_round, p1, p2, p3, fastest_lap, safety_car_count
ON predictions
FOR EACH ROW
EXECUTE FUNCTION prevent_locked_prediction_write();
