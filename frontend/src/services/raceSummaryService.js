const API = `${import.meta.env.VITE_API_URL}/api`;

function getToken() {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token');
}

export async function fetchRaceSummary(year, round) {
  const res = await fetch(`${API}/race-summary/${year}/${round}`);
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    if (body.status === 'race_not_finished') return { notFinished: true };
    return null;
  }
  if (!res.ok) throw new Error(`Failed to fetch race summary: ${res.status}`);
  return res.json();
}

export async function fetchPersonalRecap(year, round) {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API}/race-summary/${year}/${round}/personal`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json(); // may include { notPredicted: true }
}
