// ─── Circuit metadata (lat/lng for weather, timezone for local times) ────────
export const CIRCUIT_DATA = {
  bahrain:       { lat: 26.0325,  lng: 50.5106,   timezone: "Asia/Bahrain" },
  jeddah:        { lat: 21.6319,  lng: 39.1044,   timezone: "Asia/Riyadh" },
  albert_park:   { lat: -37.8497, lng: 144.9680,  timezone: "Australia/Melbourne" },
  suzuka:        { lat: 34.8431,  lng: 136.5407,  timezone: "Asia/Tokyo" },
  shanghai:      { lat: 31.3389,  lng: 121.2198,  timezone: "Asia/Shanghai" },
  miami:         { lat: 25.9581,  lng: -80.2389,  timezone: "America/New_York" },
  imola:         { lat: 44.3439,  lng: 11.7167,   timezone: "Europe/Rome" },
  monaco:        { lat: 43.7347,  lng: 7.4206,    timezone: "Europe/Monaco" },
  villeneuve:    { lat: 45.5000,  lng: -73.5228,  timezone: "America/Toronto" },
  catalunya:     { lat: 41.5700,  lng: 2.2611,    timezone: "Europe/Madrid" },
  madrid:        { lat: 40.4539,  lng: -3.6883,   timezone: "Europe/Madrid" },
  ifema_madrid:  { lat: 40.4539,  lng: -3.6883,   timezone: "Europe/Madrid" },
  red_bull_ring: { lat: 47.2197,  lng: 14.7647,   timezone: "Europe/Vienna" },
  silverstone:   { lat: 52.0786,  lng: -1.0169,   timezone: "Europe/London" },
  hungaroring:   { lat: 47.5789,  lng: 19.2486,   timezone: "Europe/Budapest" },
  spa:           { lat: 50.4372,  lng: 5.9714,    timezone: "Europe/Brussels" },
  zandvoort:     { lat: 52.3888,  lng: 4.5408,    timezone: "Europe/Amsterdam" },
  monza:         { lat: 45.6156,  lng: 9.2811,    timezone: "Europe/Rome" },
  baku:          { lat: 40.3725,  lng: 49.8533,   timezone: "Asia/Baku" },
  marina_bay:    { lat: 1.2914,   lng: 103.8647,  timezone: "Asia/Singapore" },
  americas:      { lat: 30.1328,  lng: -97.6411,  timezone: "America/Chicago" },
  rodriguez:     { lat: 19.4042,  lng: -99.0907,  timezone: "America/Mexico_City" },
  interlagos:    { lat: -23.7036, lng: -46.6997,  timezone: "America/Sao_Paulo" },
  vegas:         { lat: 36.1147,  lng: -115.1728, timezone: "America/Los_Angeles" },
  losail:        { lat: 25.4900,  lng: 51.4542,   timezone: "Asia/Qatar" },
  yas_marina:    { lat: 24.4672,  lng: 54.6031,   timezone: "Asia/Dubai" },
};

export const COUNTRY_FLAGS = {
  Bahrain: "🇧🇭", "Saudi Arabia": "🇸🇦", Australia: "🇦🇺",
  Japan: "🇯🇵", China: "🇨🇳", "United States": "🇺🇸", USA: "🇺🇸",
  Italy: "🇮🇹", Monaco: "🇲🇨", Canada: "🇨🇦", Spain: "🇪🇸",
  Austria: "🇦🇹", "United Kingdom": "🇬🇧", UK: "🇬🇧", Belgium: "🇧🇪",
  Hungary: "🇭🇺", Netherlands: "🇳🇱", Azerbaijan: "🇦🇿",
  Singapore: "🇸🇬", Mexico: "🇲🇽", Brazil: "🇧🇷",
  Qatar: "🇶🇦", "Abu Dhabi": "🇦🇪", UAE: "🇦🇪",
};

export const SESSION_META = {
  fp1:         { label: "Free Practice 1",   short: "FP1"   },
  fp2:         { label: "Free Practice 2",   short: "FP2"   },
  fp3:         { label: "Free Practice 3",   short: "FP3"   },
  sprintQualy: { label: "Sprint Qualifying", short: "SQ"    },
  sprintRace:  { label: "Sprint Race",       short: "SPR"   },
  qualy:       { label: "Qualifying",        short: "QUALI" },
  race:        { label: "Race",              short: "RACE"  },
};

export const SESSION_ORDER = ["fp1", "fp2", "sprintQualy", "sprintRace", "fp3", "qualy", "race"];

export function parseUTC(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const t = timeStr.endsWith("Z") ? timeStr : timeStr + "Z";
  return new Date(`${dateStr}T${t}`);
}

export function formatLocalTime(dt, timezone) {
  if (!dt) return null;
  const day  = dt.toLocaleDateString("en-GB",  { timeZone: timezone, weekday: "short" }).toUpperCase();
  const time = dt.toLocaleTimeString("en-GB",  { timeZone: timezone, hour: "2-digit", minute: "2-digit" });
  return { day, time };
}

// Returns short form: "20–22 Mar" or "29 Mar – 1 Apr"
export function formatDateRange(schedule) {
  if (!schedule) return "";
  const dates = Object.values(schedule).filter(Boolean).map(s => s.date).filter(Boolean).sort();
  if (!dates.length) return "";
  const parse = str => { const [y, m, d] = str.split("-").map(Number); return new Date(y, m - 1, d); };
  const start = parse(dates[0]);
  const end   = parse(dates[dates.length - 1]);
  const mOpts = { month: "short", day: "numeric" };
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}–${end.toLocaleDateString("en-GB", mOpts)}`
    : `${start.toLocaleDateString("en-GB", mOpts)} – ${end.toLocaleDateString("en-GB", mOpts)}`;
}

// Returns long form: "March 20–22, 2026" or "March 29 – April 1, 2026"
export function formatDateRangeLong(schedule) {
  if (!schedule) return "";
  const dates = Object.values(schedule).filter(Boolean).map(s => s.date).filter(Boolean).sort();
  if (!dates.length) return "";
  const parse = str => { const [y, m, d] = str.split("-").map(Number); return new Date(y, m - 1, d); };
  const start    = parse(dates[0]);
  const end      = parse(dates[dates.length - 1]);
  const year     = end.getFullYear();
  const endMonth = end.toLocaleDateString("en-US", { month: "long" });
  if (start.getMonth() === end.getMonth()) {
    return `${endMonth} ${start.getDate()}–${end.getDate()}, ${year}`;
  }
  const startMonth = start.toLocaleDateString("en-US", { month: "long" });
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
}

export function wmoInfo(code) {
  if (code == null) return { icon: "🌤️", label: "Unknown" };
  if (code === 0)   return { icon: "☀️",  label: "Clear Sky" };
  if (code <= 3)    return { icon: "⛅",  label: "Partly Cloudy" };
  if (code <= 48)   return { icon: "🌫️", label: "Foggy" };
  if (code <= 55)   return { icon: "🌦️", label: "Drizzle" };
  if (code <= 65)   return { icon: "🌧️", label: "Rain" };
  if (code <= 75)   return { icon: "❄️",  label: "Snow" };
  if (code <= 82)   return { icon: "🌧️", label: "Showers" };
  if (code <= 99)   return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌤️", label: "Mixed" };
}

export function getRaceDateTime(race) {
  return parseUTC(race.schedule?.race?.date, race.schedule?.race?.time);
}
