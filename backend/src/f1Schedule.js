const DEFAULT_SCHEDULE_API_BASE = 'https://f1api.dev/api';

function parseUtc(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const time = timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`;
  const parsed = new Date(`${dateStr}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickQualifyingSession(schedule = {}) {
  return schedule.qualy
    ?? schedule.qualifying
    ?? schedule.qualification
    ?? schedule.sprintQualy
    ?? null;
}

export function normalizeApiRace(apiRace, raceYear, fallbackRound) {
  if (!apiRace) return null;

  const raceRound = Number(apiRace?.round ?? fallbackRound);
  if (!raceYear || !raceRound) return null;

  const qualifyingSession = pickQualifyingSession(apiRace?.schedule);
  const qualifyingStart = parseUtc(
    qualifyingSession?.date,
    qualifyingSession?.time
  );

  return {
    id: null,
    race_year: Number(raceYear),
    race_round: raceRound,
    gp_name: apiRace?.raceName ?? apiRace?.name ?? apiRace?.gpName ?? null,
    qualifying_start_at: qualifyingStart ? qualifyingStart.toISOString() : null,
    source: 'schedule_api',
  };
}

export async function fetchRaceFromScheduleApi(
  { raceYear, raceRound },
  {
    fetchImpl = globalThis.fetch,
    apiBase = process.env.F1_SCHEDULE_API_BASE ?? DEFAULT_SCHEDULE_API_BASE,
  } = {}
) {
  if (!raceYear || !raceRound || typeof fetchImpl !== 'function') return null;

  let response;
  try {
    response = await fetchImpl(`${apiBase}/${raceYear}`);
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    return null;
  }

  const races = Array.isArray(data?.races) ? data.races : [];
  const apiRace = races.find((race, index) => Number(race?.round ?? index + 1) === Number(raceRound));

  return apiRace ? normalizeApiRace(apiRace, raceYear, raceRound) : null;
}
