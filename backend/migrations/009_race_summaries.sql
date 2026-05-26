CREATE TABLE race_summaries (
  id                   SERIAL      PRIMARY KEY,
  race_id              VARCHAR(20) UNIQUE NOT NULL,  -- "{year}_{round}", e.g. "2026_6"
  race_year            SMALLINT    NOT NULL,
  race_round           SMALLINT    NOT NULL,
  headline             TEXT        NOT NULL,
  story                TEXT        NOT NULL,
  key_moments          JSONB       NOT NULL,          -- string[]
  championship_impact  TEXT        NOT NULL,
  driver_of_the_day    JSONB       NOT NULL,          -- { name, reason }
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  groq_tokens_used     INT,
  groq_latency_ms      INT
);

CREATE INDEX idx_race_summaries_race_id ON race_summaries(race_id);
CREATE INDEX idx_race_summaries_year_round ON race_summaries(race_year, race_round);
