-- ============================================================
-- F1 Weekend Companion — PostgreSQL Schema
-- ============================================================

-- Enums
CREATE TYPE race_status    AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE session_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE session_name   AS ENUM ('practice_1', 'practice_2', 'practice_3', 'qualifying', 'sprint', 'race');

-- ============================================================
-- teams
-- ============================================================
CREATE TABLE teams (
    id   SERIAL       PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- drivers
-- ============================================================
CREATE TABLE drivers (
    id            SERIAL       PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    age           SMALLINT     NOT NULL CHECK (age > 0),
    team_id       INT          NOT NULL REFERENCES teams(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    wins          INT          NOT NULL DEFAULT 0 CHECK (wins >= 0),
    standing      SMALLINT              CHECK (standing > 0),
    podiums       INT          NOT NULL DEFAULT 0 CHECK (podiums >= 0),
    is_champion   BOOLEAN      NOT NULL DEFAULT FALSE,
    championships SMALLINT     NOT NULL DEFAULT 0 CHECK (championships >= 0)
);

CREATE INDEX idx_drivers_team_id ON drivers(team_id);

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id                 SERIAL       PRIMARY KEY,
    username           VARCHAR(50)  NOT NULL UNIQUE,
    name               VARCHAR(100) NOT NULL,
    email              VARCHAR(255) NOT NULL UNIQUE,
    password_hash      VARCHAR(255) NOT NULL,
    remember_me        BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at      TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    phone_number       VARCHAR(20),
    score              INT          NOT NULL DEFAULT 0 CHECK (score >= 0),
    favorite_driver_id INT          REFERENCES drivers(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_users_favorite_driver_id ON users(favorite_driver_id);

-- ============================================================
-- races
-- ============================================================
CREATE TABLE races (
    id                       SERIAL          PRIMARY KEY,
    race_year                SMALLINT,
    race_round               SMALLINT,
    gp_name                  VARCHAR(100)    NOT NULL,
    circuit_name             VARCHAR(150)    NOT NULL,
    country                  VARCHAR(100)    NOT NULL,
    length                   DECIMAL(6, 3)   NOT NULL CHECK (length > 0),   -- circuit length in km
    laps                     SMALLINT        NOT NULL CHECK (laps > 0),
    qualifying_start_at      TIMESTAMPTZ,
    status                   race_status     NOT NULL DEFAULT 'scheduled',
    summary                  TEXT,
    is_removed_from_calendar BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_races_status ON races(status);
CREATE UNIQUE INDEX idx_races_year_round ON races(race_year, race_round)
    WHERE race_year IS NOT NULL AND race_round IS NOT NULL;

-- ============================================================
-- sessions
-- Resolves Race 1-to-many Session (composition in diagram).
-- ============================================================
CREATE TABLE sessions (
    id         SERIAL          PRIMARY KEY,
    name       session_name    NOT NULL,
    start_time TIMESTAMPTZ     NOT NULL,
    duration   SMALLINT        NOT NULL CHECK (duration > 0),  -- minutes
    status     session_status  NOT NULL DEFAULT 'scheduled',
    race_id    INT             NOT NULL REFERENCES races(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (race_id, name)
);

CREATE INDEX idx_sessions_race_id   ON sessions(race_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);

-- ============================================================
-- race_drivers
-- Resolves Race.listOfDrivers (List<Driver>) and the M:N
-- "drives in" relationship between drivers and races.
-- ============================================================
CREATE TABLE race_drivers (
    race_id   INT NOT NULL REFERENCES races(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (race_id, driver_id)
);

CREATE INDEX idx_race_drivers_driver_id ON race_drivers(driver_id);

-- ============================================================
-- lap_records
-- Resolves Race.lapRecord (Map<driver_id, time>).
-- Stores the fastest lap time per driver per race.
-- ============================================================
CREATE TABLE lap_records (
    id        SERIAL        PRIMARY KEY,
    race_id   INT           NOT NULL REFERENCES races(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    driver_id INT           NOT NULL REFERENCES drivers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    time      DECIMAL(8, 3) NOT NULL CHECK (time > 0),   -- lap time in seconds
    UNIQUE (race_id, driver_id)
);

CREATE INDEX idx_lap_records_race_id ON lap_records(race_id);

-- ============================================================
-- predictions
-- ============================================================
CREATE TABLE predictions (
    id                    SERIAL      PRIMARY KEY,
    user_id               INT         NOT NULL REFERENCES users(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    race_id               INT         NOT NULL REFERENCES races(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    fastest_lap_driver_id INT                  REFERENCES drivers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    safety_car_count      SMALLINT    NOT NULL DEFAULT 0 CHECK (safety_car_count >= 0),
    points_earned         INT         NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked             BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (user_id, race_id)   -- one prediction per user per race
);

CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_race_id ON predictions(race_id);

-- ============================================================
-- prediction_podium
-- Resolves Prediction.podiumPrediction (List<driverId>).
-- Stores P1/P2/P3 driver picks for a prediction.
-- ============================================================
CREATE TABLE prediction_podium (
    prediction_id INT      NOT NULL REFERENCES predictions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    position      SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 3),
    driver_id     INT      NOT NULL REFERENCES drivers(id)     ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (prediction_id, position),
    UNIQUE (prediction_id, driver_id)   -- same driver cannot occupy two positions
);

CREATE INDEX idx_prediction_podium_driver_id ON prediction_podium(driver_id);
