CREATE TABLE badges (
  id          SERIAL       PRIMARY KEY,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT         NOT NULL,
  icon        VARCHAR(10)  NOT NULL
);

CREATE TABLE user_badges (
  user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  badge_id   INT         NOT NULL REFERENCES badges(id) ON DELETE CASCADE ON UPDATE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

INSERT INTO badges (slug, name, description, icon) VALUES
  ('green_light',    'Green Light',    'Score your first correct prediction.',                                   '🟢'),
  ('hat_trick_hero', 'Hat-Trick Hero', 'Score at least one correct prediction in 3 consecutive races.',         '🎩'),
  ('race_pace',      'Race Pace',      'Score at least one correct prediction in 5 consecutive races.',         '🔥'),
  ('clean_air',      'Clean Air',      'Score at least one correct prediction in 10 consecutive races.',        '💨'),
  ('podium_prophet', 'Podium Prophet', 'Predict the exact P1, P2, and P3 finishers in the correct order.',     '🔮');
