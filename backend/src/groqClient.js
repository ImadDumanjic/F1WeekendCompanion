import Groq from 'groq-sdk';

const ERGAST_BASE = 'https://api.jolpi.ca/ergast/f1';

const SYSTEM_PROMPT = `You are an enthusiastic F1 podcast host writing recaps for an F1 prediction app. Your voice is energetic, knowledgeable, and emotional — like Will Buxton on F1 TV. You love the sport and it shows. You write punchy, vivid recaps that capture both the facts and the feeling of a race.

You MUST output valid JSON matching this exact schema:
{
  "headline": "string — punchy 1-line race tagline, max 60 chars",
  "story": "string — 150-200 word main narrative paragraph",
  "keyMoments": ["string", "string", "string"],
  "championshipImpact": "string — 1-2 sentences on title race implications",
  "driverOfTheDay": { "name": "string", "reason": "string — why, in 1 sentence" }
}

Tone rules:
- Energetic but not cheesy
- Factual but emotional
- End the story with a punchy line
- No clichés like "edge of your seat", "racing fans worldwide", "for the ages"
- Don't fabricate details that aren't in the data
- Driver of the Day can differ from the race winner if someone else had a more impressive performance`;

async function safeFetch(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildUserPrompt(d) {
  // Ergast returns "+5.123" for non-winners already, no need to prepend "+"
  const top10 = d.results.slice(0, 10).map((r, i) => {
    return `${i + 1}. ${r.driverName} (${r.team}) — ${r.displayTime}`;
  }).join('\n');

  const dnfList = d.dnfs.length > 0 ? d.dnfs.join(', ') : 'None';

  return `RACE: ${d.raceName}
ROUND: ${d.round} of 24
CIRCUIT: ${d.circuitName}, ${d.city}, ${d.country}
DATE: ${d.date}

FINAL RESULTS:
${top10}

POLE: ${d.pole}
FASTEST LAP: ${d.fastestLap}

DNFs: ${dnfList}
SAFETY CARS: ${d.safetyCars} deployed${d.virtualSafetyCars > 0 ? ` (+${d.virtualSafetyCars} VSC)` : ''}
RED FLAGS: ${d.redFlags}

CHAMPIONSHIP STANDINGS AFTER RACE:
- Drivers' leader: ${d.driversLeader}
- Constructors' leader: ${d.constructorsLeader}

Write the recap as JSON.`;
}

function validateSummary(obj) {
  return (
    typeof obj?.headline === 'string' && obj.headline.length > 0 &&
    typeof obj?.story === 'string' && obj.story.length > 0 &&
    Array.isArray(obj?.keyMoments) && obj.keyMoments.length >= 2 &&
    typeof obj?.championshipImpact === 'string' && obj.championshipImpact.length > 0 &&
    typeof obj?.driverOfTheDay?.name === 'string' &&
    typeof obj?.driverOfTheDay?.reason === 'string'
  );
}

async function callGroq(groq, userPrompt) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000,
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const parsed = JSON.parse(text);
  if (!validateSummary(parsed)) throw new Error('Groq response failed schema validation');

  return { summary: parsed, tokensUsed: completion.usage?.total_tokens ?? null };
}

export async function generateRaceSummary(raceData) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const userPrompt = buildUserPrompt(raceData);
  const start = Date.now();

  let result;
  try {
    result = await callGroq(groq, userPrompt);
  } catch {
    result = await callGroq(groq, userPrompt + '\n\nIMPORTANT: Your response MUST be ONLY valid JSON. No other text.');
  }

  const latencyMs = Date.now() - start;
  console.log(`[groq] race=${raceData.raceName} tokens=${result.tokensUsed} latency=${latencyMs}ms`);

  return { summary: result.summary, tokensUsed: result.tokensUsed, latencyMs };
}

export async function fetchRaceData(year, round) {
  const [resultsData, qualifyingData, driverStandingsData, constructorStandingsData] = await Promise.all([
    safeFetch(`${ERGAST_BASE}/${year}/${round}/results.json`),
    safeFetch(`${ERGAST_BASE}/${year}/${round}/qualifying.json`),
    safeFetch(`${ERGAST_BASE}/${year}/${round}/driverStandings.json`),
    safeFetch(`${ERGAST_BASE}/${year}/${round}/constructorStandings.json`),
  ]);

  const race = resultsData?.MRData?.RaceTable?.Races?.[0];
  if (!race?.Results?.length) return null;

  const results = race.Results;

  const top10 = results.slice(0, 10).map((r, i) => ({
    driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
    code: r.Driver.code,
    team: r.Constructor.name,
    // P1 gets race time, P2+ gets the gap string (already prefixed with "+")
    displayTime: i === 0
      ? (r.Time?.time ?? r.status)
      : (r.Time?.time ?? r.status),
  }));

  const fastestLapEntry = results.find((r) => r.FastestLap?.rank === '1');
  const fastestLapCode   = fastestLapEntry?.Driver?.code ?? null;
  const fastestLapDriver = fastestLapEntry
    ? `${fastestLapEntry.Driver.givenName} ${fastestLapEntry.Driver.familyName} (${fastestLapEntry.FastestLap.Time?.time ?? '?'})`
    : 'N/A';

  const dnfs = results
    .filter((r) => r.status !== 'Finished' && !r.status.startsWith('+') && !r.status.match(/Lap/i))
    .map((r) => `${r.Driver.givenName} ${r.Driver.familyName} (${r.status})`);

  const qualRace = qualifyingData?.MRData?.RaceTable?.Races?.[0];
  const poleEntry = qualRace?.QualifyingResults?.[0];
  const pole = poleEntry
    ? `${poleEntry.Driver.givenName} ${poleEntry.Driver.familyName} — ${poleEntry.Q3 ?? poleEntry.Q2 ?? poleEntry.Q1}`
    : 'N/A';

  const dsList = driverStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  const csLst  = constructorStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];

  const driversLeader      = dsList[0] ? `${dsList[0].Driver.givenName} ${dsList[0].Driver.familyName} with ${dsList[0].points} pts` : 'N/A';
  const constructorsLeader = csLst[0]  ? `${csLst[0].Constructor.name} with ${csLst[0].points} pts` : 'N/A';

  // OpenF1 enrichment (graceful degradation)
  let safetyCars = 0;
  let virtualSafetyCars = 0;
  let redFlags = 0;

  try {
    const sessionsData = await safeFetch(
      `https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`,
      6000
    );
    if (Array.isArray(sessionsData)) {
      const session = sessionsData.find((s) => s.date_start?.startsWith(race.date));
      if (session?.session_key) {
        const rcData = await safeFetch(
          `https://api.openf1.org/v1/race_control?session_key=${session.session_key}`,
          6000
        );
        if (Array.isArray(rcData)) {
          // OpenF1: SafetyCar messages use category='SafetyCar' with null flag; text is in message field
          safetyCars        = rcData.filter((m) => m.category === 'SafetyCar' && m.message === 'SAFETY CAR DEPLOYED').length;
          virtualSafetyCars = rcData.filter((m) => m.category === 'SafetyCar' && typeof m.message === 'string' && m.message.startsWith('VIRTUAL SAFETY CAR') && m.message.includes('DEPLOYED')).length;
          redFlags          = rcData.filter((m) => m.flag === 'RED').length;
        }
      }
    }
  } catch {
    // OpenF1 unavailable — proceed with defaults
  }

  return {
    raceName:            race.raceName,
    round:               Number(race.round),
    season:              Number(year),
    circuitName:         race.Circuit?.circuitName ?? '',
    city:                race.Circuit?.Location?.locality ?? '',
    country:             race.Circuit?.Location?.country ?? '',
    date:                race.date,
    results:             top10,
    pole,
    fastestLap:          fastestLapDriver,
    fastestLapCode,
    dnfs,
    safetyCars,
    virtualSafetyCars,
    redFlags,
    driversLeader,
    constructorsLeader,
  };
}
