const API_BASE = 'https://www.filmweb.pl/api/v1';

export function extractUsername(url) {
  const match = url.match(/\/user\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function isWantToSeeFilmPage(url = window.location.href) {
  return /\/user\/[^/?#]+/.test(url) && /#\/wantToSee\/film/i.test(url);
}

export async function getLoggedUsername() {
  const res = await fetch(`${API_BASE}/logged/info`, {
    credentials: 'include',
    headers: { 'X-Locale': 'pl', Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error('NOT_LOGGED_IN');
  }

  const data = await res.json();
  return data.name || data.login || data.nick || data.username || null;
}

export async function fetchWantToSeeCount(username) {
  const res = await fetch(
    `${API_BASE}/user/${encodeURIComponent(username)}/want2see/film/count`,
    {
      credentials: 'include',
      headers: { 'X-Locale': 'pl' },
    }
  );

  if (!res.ok) {
    throw new Error(`COUNT_FETCH_FAILED:${res.status}`);
  }

  const count = parseInt(await res.text(), 10);
  if (Number.isNaN(count)) {
    throw new Error('COUNT_PARSE_FAILED');
  }

  return count;
}

export async function fetchAllWantToSeeFilms() {
  const films = [];
  let page = 1;

  while (true) {
    const res = await fetch(`${API_BASE}/logged/want2see/film?page=${page}`, {
      credentials: 'include',
      headers: { 'X-Locale': 'pl', Accept: 'application/json' },
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('NOT_LOGGED_IN');
    }

    if (!res.ok) {
      throw new Error(`API_ERROR:${res.status}`);
    }

    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    films.push(...batch);
    page += 1;
  }

  return films;
}

export async function fetchTitleInfo(entityId) {
  const res = await fetch(`${API_BASE}/title/${entityId}/info`, {
    credentials: 'include',
    headers: { 'X-Locale': 'pl', Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`TITLE_FETCH_FAILED:${res.status}`);
  }

  return res.json();
}

function slugifyTitle(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/gi, 'l')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '+');
}

export function buildFilmUrl(id, title, year) {
  return `https://www.filmweb.pl/film/${slugifyTitle(title)}-${year}-${id}`;
}

export function scrapeFilmsFromDom(root = document) {
  const films = new Map();

  root.querySelectorAll('a[href*="/film/"]').forEach((link) => {
    const match = link.href.match(/\/film\/[^/?#]*-(\d+)(?:[/?#]|$)/);
    if (!match) {
      return;
    }

    const id = Number(match[1]);
    const title = link.textContent.trim();
    films.set(id, {
      id,
      title: title || `#${id}`,
      url: link.href,
    });
  });

  return [...films.values()];
}

export function readExpectedCountFromDom(root = document) {
  const text = root.body?.innerText || '';
  const patterns = [
    /(\d+)\s*film(?:ów|y|u)?/i,
    /chc[eę]\s+zobaczy[cć][^\d]*(\d+)/i,
    /(\d+)\s*pozyc/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

export async function pickRandomWantToSeeFilm({ username } = {}) {
  let films = [];
  let apiError = null;
  let expectedCount = null;

  try {
    films = await fetchAllWantToSeeFilms();
  } catch (error) {
    apiError = error;
    if (error.message !== 'NOT_LOGGED_IN') {
      throw error;
    }
  }

  if (username) {
    try {
      expectedCount = await fetchWantToSeeCount(username);
    } catch {
      expectedCount = readExpectedCountFromDom();
    }
  } else {
    expectedCount = readExpectedCountFromDom();
  }

  if (films.length === 0 && typeof document !== 'undefined') {
    films = scrapeFilmsFromDom().map((film) => ({ entity: film.id, _dom: film }));
  }

  if (films.length === 0) {
    if (apiError?.message === 'NOT_LOGGED_IN') {
      throw new Error('NOT_LOGGED_IN');
    }
    throw new Error('EMPTY_LIST');
  }

  const countMismatch =
    expectedCount !== null && films.length !== expectedCount
      ? { fetched: films.length, expected: expectedCount }
      : null;

  const picked = films[Math.floor(Math.random() * films.length)];
  const entityId = picked.entity ?? picked.id;

  if (picked._dom) {
    return {
      id: picked._dom.id,
      title: picked._dom.title,
      year: null,
      url: picked._dom.url,
      totalCount: films.length,
      expectedCount,
      countMismatch,
    };
  }

  const info = await fetchTitleInfo(entityId);

  return {
    id: entityId,
    title: info.title,
    originalTitle: info.originalTitle,
    year: info.year,
    url: buildFilmUrl(entityId, info.title, info.year),
    totalCount: films.length,
    expectedCount,
    countMismatch,
  };
}
