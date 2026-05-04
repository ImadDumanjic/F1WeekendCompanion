const FAVORITE_DRIVER_KEY = 'favoriteDriver';
const FAVORITE_TEAM_KEY = 'favoriteTeam';

function readJson(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFavoriteDriver() {
  return readJson(FAVORITE_DRIVER_KEY);
}

export function setFavoriteDriver(driver) {
  writeJson(FAVORITE_DRIVER_KEY, driver);
}

export function getFavoriteTeam() {
  return readJson(FAVORITE_TEAM_KEY);
}

export function setFavoriteTeam(team) {
  writeJson(FAVORITE_TEAM_KEY, team);
}

export function clearFavorites() {
  localStorage.removeItem(FAVORITE_DRIVER_KEY);
  localStorage.removeItem(FAVORITE_TEAM_KEY);
}
