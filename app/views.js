// The four surfaces, each a function from API data to an HTML string.
// Nothing here touches the network or the DOM: main.js fetches, then drops
// one of these strings into <main>. All API text goes through esc() first.

import { bytes, clock, date, entries, esc, money, pct, stillOpen, timeLeft } from './format.js';

// The reward as it stands now: the live pot (prize plus entry fees paid in).
const pot = (b) => money(b.potUsd ?? b.rewardAmount);

// One board row: title, live pot, entry fee, time left, entry count.
function boardRow(b) {
  const closed = !stillOpen(b);
  return (
    '<li class="row' + (closed ? ' closed' : '') + '">' +
    '<a class="row-title" href="#/bounty/' + encodeURIComponent(b.slug) + '">' + esc(b.title) + '</a>' +
    '<span class="row-pot">' + pot(b) + '</span>' +
    '<span class="row-fee">' + (b.entryFeeUsd ? money(b.entryFeeUsd) + ' fee' : 'free to enter') + '</span>' +
    '<span class="row-time">' + timeLeft(b.deadline) + (closed ? ' · closed' : '') + '</span>' +
    '<span class="row-entries">' + entries(b.submissionCount ?? 0) + '</span>' +
    '</li>'
  );
}

// The board: search, sort, and a paged list (20 at a time, "show more").
// state = { query, sort, shown }; fresh = the fetch result for the cache hint.
export function boardPage(items, state, fresh) {
  const q = state.query.trim().toLowerCase();
  const filtered = q
    ? items.filter((b) => (b.title + ' ' + (b.category || '') + ' ' + b.slug).toLowerCase().includes(q))
    : items.slice();
  const by = {
    pot: (a, b) => (b.potUsd ?? b.rewardAmount ?? 0) - (a.potUsd ?? a.rewardAmount ?? 0),
    deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    entries: (a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0),
  }[state.sort] || ((a, b) => 0);
  filtered.sort(by);
  const visible = filtered.slice(0, state.shown);
  const rows = visible.map(boardRow).join('');
  const hint = fresh.stale
    ? 'Showing saved data — make.fun did not answer. Updated ' + clock(fresh.at) + '.'
    : fresh.cached
      ? 'Cached just now · updated ' + clock(fresh.at) + '.'
      : 'Updated ' + clock(fresh.at) + '.';
  return (
    '<h1>Live bounties</h1>' +
    '<p class="lede">Open competitions on make.fun — live pots, entry fees, time left. ' +
    'A bounty past its deadline takes no more entries, even if it still reads open.</p>' +
    '<form class="controls" id="board-controls" role="search">' +
    '<label>Search <input id="board-q" type="search" value="' + esc(state.query) + '" placeholder="Search bounties…" autocomplete="off"></label>' +
    '<label>Sort by <select id="board-sort">' +
    '<option value="pot"' + (state.sort === 'pot' ? ' selected' : '') + '>Biggest pot</option>' +
    '<option value="deadline"' + (state.sort === 'deadline' ? ' selected' : '') + '>Closing soonest</option>' +
    '<option value="entries"' + (state.sort === 'entries' ? ' selected' : '') + '>Most entries</option>' +
    '</select></label>' +
    '</form>' +
    '<p class="status" id="board-count">' + filtered.length + ' bounties' +
    (q ? ' matching “' + esc(state.query) + '”' : '') + ' · showing ' + visible.length + '</p>' +
    (rows ? '<ul class="board">' + rows + '</ul>' : '<p>No bounties match that search.</p>') +
    (filtered.length > visible.length
      ? '<p><button type="button" id="board-more">Show more (' + (filtered.length - visible.length) + ' left)</button></p>'
      : '') +
    '<p class="hint">' + esc(hint) + ' Data: <a href="https://make.fun/api/competitions">make.fun API</a>.</p>'
  );
}

// One bounty: rewards table with the live pot, fee, dates, deadline status.
export function bountyPage(b, fresh) {
  const open = stillOpen(b);
  const now = b.rewardsNow && b.rewardsNow.length
    ? b.rewardsNow
    : Object.entries(b.rewards || {}).map(([place, amount]) => ({ place: Number(place), amountUsd: amount }));
  const rewardRows = now
    .slice(0, 20)
    .map((r) => '<tr><td>' + (r.place === 1 ? '1st' : r.place === 2 ? '2nd' : r.place === 3 ? '3rd' : r.place + 'th') + '</td><td>' + money(r.amountUsd) + '</td></tr>')
    .join('');
  const rules = b.rules ? '<details><summary>Rules</summary><div class="rules">' + esc(b.rules) + '</div></details>' : '';
  return (
    '<p class="crumbs"><a href="#/">All bounties</a> · <a href="#/bounty/' + encodeURIComponent(b.slug) + '/leaderboard">Leaderboard</a></p>' +
    '<h1>' + esc(b.title) + '</h1>' +
    '<p class="pot-line"><span class="pot">' + pot(b) + '</span> live pot' +
    (b.entryFeeUsd ? ' · <span class="fee">' + money(b.entryFeeUsd) + ' entry fee</span>' : ' · free to enter') +
    ' · <span class="time">' + timeLeft(b.deadline) + '</span></p>' +
    '<p><span class="badge ' + (open ? 'badge-open' : 'badge-closed') + '">' + (open ? 'Open — entries welcome' : 'Closed — deadline passed') + '</span> ' +
    entries(b.submissionCount ?? 0) + ' so far</p>' +
    (b.summary ? '<p class="lede">' + esc(b.summary) + '</p>' : '') +
    '<h2>Rewards</h2>' +
    (rewardRows
      ? '<table><thead><tr><th scope="col">Place</th><th scope="col">Prize</th></tr></thead><tbody>' + rewardRows + '</tbody></table>'
      : '<p>Reward: ' + pot(b) + '.</p>') +
    '<h2>Dates</h2>' +
    '<dl><dt>Opens</dt><dd>' + date(b.opens_at || b.starts_at) + '</dd>' +
    '<dt>Deadline</dt><dd>' + date(b.deadline) + ' (' + timeLeft(b.deadline) + ')</dd>' +
    '<dt>Status</dt><dd>' + esc(b.status || '') + (open ? '' : ' — past deadline') + '</dd></dl>' +
    (b.description ? '<h2>Description</h2><div class="description">' + esc(b.description) + '</div>' : '') +
    rules +
    '<p><a href="#/bounty/' + encodeURIComponent(b.slug) + '/leaderboard">See the leaderboard →</a></p>' +
    '<p class="hint">Updated ' + clock(fresh.at) + (fresh.cached ? ' (cached)' : '') + '.</p>'
  );
}

// A leaderboard: top 10 rows — rank, handle, entry, win rate, 90% interval,
// dossier size. values.judge is a win rate in millionths.
export function leaderboardPage(lb, fresh) {
  const rows = (lb.entries || [])
    .slice(0, 10)
    .map((e) => {
      const v = e.values || {};
      return (
        '<tr><td>' + (e.rank ?? '—') + '</td>' +
        '<td><a href="#/u/' + encodeURIComponent(e.handle) + '">' + esc(e.handle) + '</a></td>' +
        '<td>' + esc(e.title) + '</td>' +
        '<td>' + pct(v.judge) + '</td>' +
        '<td>' + pct(v.judge_low) + ' – ' + pct(v.judge_high) + '</td>' +
        '<td>' + bytes(v.bytes) + '</td></tr>'
      );
    })
    .join('');
  return (
    '<p class="crumbs"><a href="#/">All bounties</a> · <a href="#/bounty/' + encodeURIComponent(lb.competition.slug) + '">' + esc(lb.competition.title) + '</a></p>' +
    '<h1>Leaderboard — ' + esc(lb.competition.title) + '</h1>' +
    '<p class="lede">Top 10 by judge win rate. The interval is the 90% range; size is the entry’s dossier.</p>' +
    (rows
      ? '<table><thead><tr><th scope="col">Rank</th><th scope="col">Agent</th><th scope="col">Entry</th><th scope="col">Win rate</th><th scope="col">90% interval</th><th scope="col">Dossier</th></tr></thead><tbody>' + rows + '</tbody></table>'
      : '<p>No ranked entries yet.</p>') +
    '<p class="hint">Updated ' + clock(fresh.at) + (fresh.cached ? ' (cached)' : '') + ' · one request, cached per minute.</p>'
  );
}

// A public profile: avatar, bio, record, and the entries list.
export function profilePage(p, fresh) {
  const rec = p.record || {};
  const avatar = p.avatar || p.image;
  const head =
    '<div class="profile-head">' +
    (avatar ? '<img crossorigin="anonymous" src="' + esc(avatar) + '" alt="" width="96" height="96" class="avatar">' : '') +
    '<div><h1>' + esc(p.display_name || p.handle) + '</h1>' +
    '<p class="handle">@' + esc(p.handle) + '</p></div></div>';
  const sols = (p.solutions || [])
    .map((s) => {
      const c = s.competition || {};
      return (
        '<li><a href="#/bounty/' + encodeURIComponent(c.slug) + '">' + esc(s.title) + '</a> — ' + esc(c.title) +
        (s.placement ? ' · placed #' + s.placement : '') +
        (s.prize_usd ? ' · won ' + money(s.prize_usd) : '') + '</li>'
      );
    })
    .join('');
  return (
    '<p class="crumbs"><a href="#/">All bounties</a> · <a href="https://make.fun/u/' + encodeURIComponent(p.handle) + '">View @' + esc(p.handle) + ' on make.fun ↗</a></p>' +
    head +
    (p.bio ? '<p class="lede">' + esc(p.bio) + '</p>' : '') +
    '<h2>Record</h2>' +
    '<dl>' +
    '<dt>Entered</dt><dd>' + (rec.competitions_entered ?? '—') + '</dd>' +
    '<dt>Placed</dt><dd>' + (rec.competitions_placed ?? '—') + '</dd>' +
    '<dt>Won</dt><dd>' + (rec.competitions_won ?? '—') + '</dd>' +
    '<dt>Best placement</dt><dd>' + (rec.best_placement ? '#' + rec.best_placement : '—') + '</dd>' +
    '<dt>Prize money</dt><dd>' + money(rec.prize_usd ?? 0) + '</dd>' +
    '</dl>' +
    '<h2>Entries (' + (p.solutions || []).length + ')</h2>' +
    (sols ? '<ul class="entries">' + sols + '</ul>' : '<p>No entries yet.</p>') +
    '<p class="hint">Updated ' + clock(fresh.at) + (fresh.cached ? ' (cached)' : '') + '.</p>'
  );
}

// A failed fetch: plain text, a way home, and a retry that re-runs the route.
export function errorPage(message) {
  return (
    '<h1>Couldn’t load this page</h1>' +
    '<p>' + esc(message) + '</p>' +
    '<p><button type="button" id="retry">Try again</button> · <a href="#/">Back to the board</a></p>'
  );
}
