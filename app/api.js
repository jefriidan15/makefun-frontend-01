// Read-only client for make.fun's public API (https://make.fun/api, GET only,
// CORS open, no key, no sign-in). Every call goes through one cached fetch:
// the API's ETags are bound to the minute, so a request inside the same minute
// revalidates with If-None-Match and a 304 reuses the stored body instead of
// downloading it again. Answers are kept in memory and in localStorage, so a
// view costs at most one request and a revisit inside the minute costs none.

const API = 'https://make.fun/api';
const MINUTE = 60000;

const memory = new Map();

function minuteNow() {
  return Math.floor(Date.now() / MINUTE);
}

function stored(path) {
  try {
    const raw = localStorage.getItem('mf:' + path);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function store(path, entry) {
  try {
    localStorage.setItem('mf:' + path, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable: the in-memory copy still serves this tab.
  }
}

function readCache(path) {
  if (memory.has(path)) return memory.get(path);
  const entry = stored(path);
  if (entry) memory.set(path, entry);
  return entry;
}

// Fetches one API path. Returns { data, cached, at }: cached is true when the
// body came from a 304 revalidation or from storage, and at is the time the
// body was last fetched, for the "updated HH:MM" hint in the UI.
export async function fetchJson(path) {
  const minute = minuteNow();
  const hit = readCache(path);
  const headers = {};
  if (hit && hit.minute === minute && hit.etag) headers['If-None-Match'] = hit.etag;
  let res;
  try {
    res = await fetch(API + path, { headers });
  } catch (err) {
    if (hit) return { data: hit.body, cached: true, at: hit.at, stale: true };
    throw err;
  }
  if (res.status === 304 && hit) {
    return { data: hit.body, cached: true, at: hit.at, stale: false };
  }
  if (!res.ok) {
    if (hit) return { data: hit.body, cached: true, at: hit.at, stale: true };
    throw new Error('make.fun answered ' + res.status + ' for ' + path);
  }
  const body = await res.json();
  const entry = {
    etag: res.headers.get('etag'),
    body,
    minute,
    at: Date.now(),
  };
  memory.set(path, entry);
  store(path, entry);
  return { data: body, cached: false, at: entry.at, stale: false };
}

// The open bounties, one request for the whole board (limit 100 covers the
// field; activity=times keeps the payload to what the board shows).
export function getBounties() {
  return fetchJson('/competitions?status=open&activity=times&limit=100');
}

// One bounty, by slug.
export function getBounty(slug) {
  return fetchJson('/competitions/' + encodeURIComponent(slug));
}

// A bounty's leaderboard. rows takes only "all" or "first"; "first" returns
// the top 10, but the payload can still run to megabytes, so callers fetch it
// once per bounty and keep the result.
export function getLeaderboard(slug) {
  return fetchJson('/competitions/' + encodeURIComponent(slug) + '/leaderboard?rows=first');
}

// A public profile, by handle.
export function getProfile(handle) {
  return fetchJson('/profiles/' + encodeURIComponent(handle));
}
