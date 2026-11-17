// A make.fun frontend: the board, a bounty page, its leaderboard, and a
// public profile, on hash routes — each reachable by a link and by its URL.
//
//   #/                             the board
//   #/bounty/<slug>                one bounty
//   #/bounty/<slug>/leaderboard    its top 10
//   #/u/<handle>                   a public profile
//
// One request per view, answered from the minute cache on revisits. The board
// filters, sorts and pages client-side, so typing or sorting never refetches.
// window.__shotReady is false while a route loads and true once its data is
// on screen, so a screenshot script knows when to capture.

import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { boardPage, bountyPage, errorPage, leaderboardPage, profilePage } from './views.js';

const app = document.getElementById('app');
const status = document.getElementById('status');
let nav = 0;

// Board state survives navigation, so going back keeps your search and sort.
const boardState = { query: '', sort: 'pot', shown: 20 };
let boardItems = null;

function announce(text) {
  status.textContent = text;
}

function parseRoute() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/').map(decodeURIComponent);
  if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') {
    return { view: 'leaderboard', slug: parts[1] };
  }
  if (parts[0] === 'bounty' && parts[1]) return { view: 'bounty', slug: parts[1] };
  if (parts[0] === 'u' && parts[1]) return { view: 'profile', handle: parts[1] };
  return { view: 'board' };
}

async function renderBoard() {
  if (!boardItems) {
    const fresh = await getBounties();
    boardItems = fresh.data.items || [];
    app.innerHTML = boardPage(boardItems, boardState, fresh);
    announce(boardItems.length + ' open bounties loaded.');
  } else {
    app.innerHTML = boardPage(boardItems, boardState, { at: Date.now(), cached: true });
  }
  document.title = 'Live bounties | make.fun';
}

async function renderBounty(slug) {
  const fresh = await getBounty(slug);
  const b = fresh.data;
  if (!b || !b.slug) throw new Error('No bounty named ' + slug + ' on make.fun.');
  app.innerHTML = bountyPage(b, fresh);
  document.title = b.title + ' | make.fun';
  announce(b.title + ' loaded.');
}

async function renderLeaderboard(slug) {
  const fresh = await getLeaderboard(slug);
  const lb = fresh.data;
  if (!lb || !lb.entries) throw new Error('No leaderboard for ' + slug + ' yet.');
  app.innerHTML = leaderboardPage(lb, fresh);
  document.title = 'Leaderboard — ' + lb.competition.title + ' | make.fun';
  announce('Leaderboard for ' + lb.competition.title + ' loaded.');
}

async function renderProfile(handle) {
  const fresh = await getProfile(handle);
  const p = fresh.data;
  if (!p || !p.handle) throw new Error('No profile for @' + handle + ' on make.fun.');
  app.innerHTML = profilePage(p, fresh);
  document.title = '@' + p.handle + ' | make.fun';
  announce('Profile for @' + p.handle + ' loaded.');
}

async function render() {
  const mine = ++nav;
  window.__shotReady = false;
  announce('Loading…');
  try {
    const route = parseRoute();
    if (route.view === 'bounty') await renderBounty(route.slug);
    else if (route.view === 'leaderboard') await renderLeaderboard(route.slug);
    else if (route.view === 'profile') await renderProfile(route.handle);
    else await renderBoard();
  } catch (err) {
    app.innerHTML = errorPage(err.message || 'make.fun did not answer.');
    document.title = 'Error | make.fun';
    announce('Loading failed.');
  }
  if (mine === nav) {
    window.scrollTo(0, 0);
    window.__shotReady = true;
  }
}

// Board controls re-render from the fetched list: no new request.
app.addEventListener('input', (event) => {
  if (event.target.id === 'board-q' && boardItems) {
    boardState.query = event.target.value;
    boardState.shown = 20;
    const caret = event.target.selectionStart;
    app.innerHTML = boardPage(boardItems, boardState, { at: Date.now(), cached: true });
    const box = document.getElementById('board-q');
    box.focus();
    box.setSelectionRange(caret, caret);
  }
});

app.addEventListener('change', (event) => {
  if (event.target.id === 'board-sort' && boardItems) {
    boardState.sort = event.target.value;
    boardState.shown = 20;
    app.innerHTML = boardPage(boardItems, boardState, { at: Date.now(), cached: true });
    document.getElementById('board-sort').focus();
  }
});

app.addEventListener('click', (event) => {
  if (event.target.id === 'board-more' && boardItems) {
    boardState.shown += 20;
    app.innerHTML = boardPage(boardItems, boardState, { at: Date.now(), cached: true });
    const more = document.getElementById('board-more');
    if (more) more.focus();
  } else if (event.target.id === 'retry') {
    render();
  }
});

window.addEventListener('hashchange', render);
render();
