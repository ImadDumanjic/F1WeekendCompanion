const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

async function fetchJson(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error('Unable to load current F1 standings.');
  return res.json();
}

export async function getCurrentDriverStandings() {
  const data = await fetchJson('/current/driverstandings.json');
  const standings =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];

  return standings.map(entry => {
    const driver = entry.Driver ?? {};
    const constructor = entry.Constructors?.[0] ?? {};
    const name = [driver.givenName, driver.familyName].filter(Boolean).join(' ');

    return {
      id: driver.driverId,
      name,
      code: driver.code ?? '',
      number: driver.permanentNumber ?? '',
      team: constructor.name ?? '',
      nationality: driver.nationality ?? '',
      position: entry.position ?? '',
      points: entry.points ?? '',
      wins: entry.wins ?? '',
    };
  });
}

export async function getCurrentConstructorStandings() {
  const data = await fetchJson('/current/constructorstandings.json');
  const standings =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];

  return standings.map(entry => {
    const constructor = entry.Constructor ?? {};

    return {
      id: constructor.constructorId,
      name: constructor.name ?? '',
      nationality: constructor.nationality ?? '',
      position: entry.position ?? '',
      points: entry.points ?? '',
      wins: entry.wins ?? '',
    };
  });
}
