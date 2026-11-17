// Small formatting helpers: every API value is escaped before it reaches
// the page, money is shown in dollars, and deadlines are judged by the clock
// (a bounty past its deadline takes no more entries even if its status still
// reads open, until its results are published).

// Text made safe to put inside HTML.
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
}

// A dollar amount (1000, "0.50", null) as "$1,000" or "$0.50".
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });
}

// A deadline as a short date in UTC.
export function date(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

// The time until a deadline: "2d 4h left", "35m left", or "ended".
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return days + 'd ' + hours + 'h left';
  if (hours > 0) return hours + 'h ' + minutes + 'm left';
  return minutes + 'm left';
}

// True while a bounty still takes entries: its deadline has not passed.
// The API status alone is not enough — it can read "open" past the deadline.
export function stillOpen(bounty) {
  return new Date(bounty.deadline).getTime() > Date.now();
}

// A win-rate micro value (973639 = 97.3639%) as "97.36%".
export function pct(micro) {
  const n = Number(micro);
  if (!Number.isFinite(n)) return '—';
  return (n / 10000).toFixed(2) + '%';
}

// A byte count as "703 KB" or "3.1 MB".
export function bytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (v < 1024) return v + ' B';
  if (v < 1048576) return (v / 1024).toFixed(0) + ' KB';
  return (v / 1048576).toFixed(1) + ' MB';
}

// A fetch time as "10:42".
export function clock(ms) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// "3 entries" / "1 entry".
export function entries(n) {
  return n + ' ' + (n === 1 ? 'entry' : 'entries');
}
