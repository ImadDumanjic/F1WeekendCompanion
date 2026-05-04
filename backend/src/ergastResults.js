const BASE = 'https://api.jolpi.ca/ergast/f1';

export async function fetchRaceResults(year, round, { fetchImpl = globalThis.fetch } = {}) {
  let res;
  try {
    res = await fetchImpl(`${BASE}/${year}/${round}/results.json`);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }

  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race?.Results?.length) return null;

  const results = race.Results;
  const p1 = results[0]?.Driver?.code;
  const p2 = results[1]?.Driver?.code;
  const p3 = results[2]?.Driver?.code;
  if (!p1 || !p2 || !p3) return null;

  const fastestLapEntry = results.find((r) => r.FastestLap?.rank === '1');
  const fastest_lap = fastestLapEntry?.Driver?.code ?? null;

  return { p1, p2, p3, fastest_lap };
}
