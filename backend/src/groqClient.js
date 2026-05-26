import Groq from 'groq-sdk';


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
  // Primary sources: f1api.dev for race metadata/standings, OpenF1 for live session data
  const [raceInfo, driversStandings, constructorsStandings] = await Promise.all([
    safeFetch(`https://f1api.dev/api/${year}/${round}`),
    safeFetch(`https://f1api.dev/api/${year}/drivers-championship`),
    safeFetch(`https://f1api.dev/api/${year}/constructors-championship`),
  ]);

  // f1api.dev returns race as an array; fall back to object/root shape for safety
  const race = Array.isArray(raceInfo?.race) ? raceInfo.race[0] : (raceInfo?.race ?? raceInfo);
  if (!race?.winner?.name) return null; // Race hasn't finished yet

  const raceDate = race.schedule?.race?.date;

  // Find Race session on OpenF1 by date
  const raceSessions = await safeFetch(
    `https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`,
    6000
  );
  const raceSession = Array.isArray(raceSessions)
    ? raceSessions.find((s) => s.date_start?.startsWith(raceDate))
    : null;

  if (!raceSession?.session_key) return null;

  const sessionKey = raceSession.session_key;

  // Sequential OpenF1 fetches to stay within rate limits (parallel → 429s)
  const driversData   = await safeFetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`, 6000);
  const positionsData = await safeFetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`, 8000);
  const rcData        = await safeFetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`, 6000);

  // Build driver map — normalize OpenF1 "Lando NORRIS" → "Lando Norris"
  const driverMap = {};
  if (Array.isArray(driversData)) {
    for (const d of driversData) {
      const normalizedName = d.full_name
        ? d.full_name.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : (d.name_acronym ?? `#${d.driver_number}`);
      driverMap[d.driver_number] = { name: normalizedName, code: d.name_acronym, team: d.team_name };
    }
  }

  // Final position per driver (latest timestamp wins)
  const finalPositions = {};
  if (Array.isArray(positionsData)) {
    for (const p of positionsData) {
      const prev = finalPositions[p.driver_number];
      if (!prev || p.date > prev.date) finalPositions[p.driver_number] = p;
    }
  }
  const sortedDrivers = Object.values(finalPositions).sort((a, b) => a.position - b.position);

  // Top 10
  const top10 = sortedDrivers.slice(0, 10).map((p, i) => {
    const driver = driverMap[p.driver_number] ?? { name: `Driver ${p.driver_number}`, code: 'UNK', team: 'Unknown' };
    return { driverName: driver.name, code: driver.code, team: driver.team, displayTime: i === 0 ? 'Winner' : 'Finished' };
  });

  // Pole: driver at position 1 in the earliest position record (no extra API call)
  let pole = 'N/A';
  if (Array.isArray(positionsData) && positionsData.length > 0) {
    const earliest = [...positionsData].sort((a, b) => a.date.localeCompare(b.date)).find((p) => p.position === 1);
    if (earliest && driverMap[earliest.driver_number]) {
      pole = driverMap[earliest.driver_number].name;
    }
  }

  // Fastest lap — f1api.dev driver_id is lowercase surname (e.g. "norris")
  const fastestLapDriverId   = race.fast_lap?.fast_lap_driver_id ?? null;
  const fastestLapTime       = race.fast_lap?.fast_lap ?? null;
  const fastestLapDriverInfo = fastestLapDriverId && Array.isArray(driversData)
    ? driversData.find((d) => d.full_name?.split(' ').pop()?.toLowerCase() === fastestLapDriverId.toLowerCase())
    : null;
  const fastestLapCode = fastestLapDriverInfo?.name_acronym ?? null;
  const fastestLap = fastestLapDriverInfo
    ? `${driverMap[fastestLapDriverInfo.driver_number]?.name ?? fastestLapDriverId} (${fastestLapTime ?? '?'})`
    : fastestLapTime ? `${fastestLapDriverId} (${fastestLapTime})` : 'N/A';

  // Race control — SC / VSC / red flags
  let safetyCars = 0;
  let virtualSafetyCars = 0;
  let redFlags = 0;
  if (Array.isArray(rcData)) {
    safetyCars        = rcData.filter((m) => m.category === 'SafetyCar' && m.message === 'SAFETY CAR DEPLOYED').length;
    virtualSafetyCars = rcData.filter((m) => m.category === 'SafetyCar' && typeof m.message === 'string' && m.message.startsWith('VIRTUAL SAFETY CAR') && m.message.includes('DEPLOYED')).length;
    redFlags          = rcData.filter((m) => m.flag === 'RED').length;
  }

  // Championship standings
  const dsList = driversStandings?.drivers_championship ?? [];
  const csLst  = constructorsStandings?.constructors_championship ?? [];
  const driversLeader      = dsList[0] ? `${dsList[0].driver?.name} ${dsList[0].driver?.surname} with ${dsList[0].points} pts` : 'N/A';
  const constructorsLeader = csLst[0]  ? `${csLst[0].team?.teamName} with ${csLst[0].points} pts` : 'N/A';

  return {
    raceName:         race.raceName,
    round:            Number(round),
    season:           Number(year),
    circuitName:      race.circuit?.circuitName ?? '',
    city:             race.circuit?.city ?? '',
    country:          race.circuit?.country ?? '',
    date:             raceDate ?? '',
    results:          top10,
    pole,
    fastestLap,
    fastestLapCode,
    dnfs:             [],
    safetyCars,
    virtualSafetyCars,
    redFlags,
    driversLeader,
    constructorsLeader,
  };
}
