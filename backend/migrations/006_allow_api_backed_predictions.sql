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
    RETURN NEW;
  END IF;

  IF lock_start IS NOT NULL AND clock_timestamp() >= lock_start THEN
    RAISE EXCEPTION 'Predictions are locked for race %.%', NEW.race_year, NEW.race_round
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
