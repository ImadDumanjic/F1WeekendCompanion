DROP TABLE IF EXISTS prediction_podium;
DROP TABLE IF EXISTS predictions;

CREATE TABLE predictions (
    id               SERIAL      PRIMARY KEY,
    user_id          INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    race_year        SMALLINT    NOT NULL,
    race_round       SMALLINT    NOT NULL,
    p1               VARCHAR(10) NOT NULL,
    p2               VARCHAR(10) NOT NULL,
    p3               VARCHAR(10) NOT NULL,
    fastest_lap      VARCHAR(10),
    safety_car_count SMALLINT    NOT NULL DEFAULT 0 CHECK (safety_car_count >= 0),
    points_earned    INT         NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked        BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (user_id, race_year, race_round)
);

CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_race    ON predictions(race_year, race_round);

CREATE TABLE race_results (
    id               SERIAL      PRIMARY KEY,
    race_year        SMALLINT    NOT NULL,
    race_round       SMALLINT    NOT NULL,
    p1               VARCHAR(10) NOT NULL,
    p2               VARCHAR(10) NOT NULL,
    p3               VARCHAR(10) NOT NULL,
    fastest_lap      VARCHAR(10),
    safety_car_count SMALLINT    NOT NULL DEFAULT 0 CHECK (safety_car_count >= 0),
    scored_at        TIMESTAMPTZ,
    UNIQUE (race_year, race_round)
);

CREATE INDEX idx_race_results_race ON race_results(race_year, race_round);
