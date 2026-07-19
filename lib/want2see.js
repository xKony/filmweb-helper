const API_BASE = 'https://www.filmweb.pl/api/v1';

export function extractUsername(url) {
  const match = String(url).match(/\/user\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getPageRoute(url = window.location.href) {
  const { pathname, search, hash } = new URL(url);
  return `${pathname}${search}${hash}`.toLowerCase();
}

export function isWantToSeeFilmPage(url = window.location.href) {
  if (!extractUsername(url)) {
    return false;
  }

  const route = getPageRoute(url);

  if (/wanttosee\/film|want2see\/film|chce-zobaczyc\/film/.test(route)) {
    return true;
  }

  if (typeof document !== 'undefined') {
    return isWantToSeeFilmPageDom();
  }

  return false;
}

export function isWantToSeeFilmPageDom(root = document) {
  const activeLink = root.querySelector(
    [
      'a[href*="wantToSee/film"][aria-current="page"]',
      'a[href*="wantToSee/film"].active',
      'a[href*="wantToSee/film"].is-active',
      'a[href*="wantToSee/film"].selected',
      'a[href*="want2See"][aria-current="page"]',
      '[data-active-tab*="wantToSee/film"]',
    ].join(', ')
  );

  if (activeLink) {
    return true;
  }

  const route = getPageRoute();
  return /wanttosee\/film|want2see\/film|want2see/.test(route);
}

async function apiFetch(path, { credentials = 'omit' } = {}) {
  const res = await fetch(`${API_BASE}/${path}`, {
    credentials,
    headers: {
      'X-Locale': 'pl',
      Accept: 'application/json',
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('NOT_LOGGED_IN');
  }

  if (!res.ok) {
    throw new Error(`API_ERROR:${res.status}`);
  }

  const text = await res.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('API_ERROR:INVALID_JSON');
  }
}

function normalizeWant2SeeEntries(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  if (Array.isArray(data[0])) {
    return data
      .filter((entry) => Array.isArray(entry) && entry.length >= 1 && Number(entry[0]) > 0)
      .map((entry) => ({
        entity: Number(entry[0]),
        timestamp: entry[1] != null ? Number(entry[1]) : undefined,
      }));
  }

  if (typeof data[0] === 'object' && data[0] !== null) {
    return data
      .filter((entry) => entry.entity != null)
      .map((entry) => ({
        entity: Number(entry.entity),
        timestamp: entry.timestamp != null ? Number(entry.timestamp) : undefined,
      }));
  }

  return [];
}

function dedupeFilms(films) {
  const seen = new Map();
  for (const film of films) {
    seen.set(film.entity, film);
  }
  return [...seen.values()];
}

/** Public endpoint — full list, no login required. */
export async function fetchWantToSeeFilmsByUsername(username) {
  const data = await apiFetch(
    `user/${encodeURIComponent(username)}/want2see/film`
  );
  return dedupeFilms(normalizeWant2SeeEntries(data));
}

/** Logged-in fallback — needs Filmweb session cookies. */
export async function fetchLoggedWantToSeeFilms() {
  const data = await apiFetch('logged/want2see?entityName=film', {
    credentials: 'include',
  });
  return dedupeFilms(normalizeWant2SeeEntries(data));
}

export async function getLoggedUsername() {
  try {
    const data = await apiFetch('logged/info', { credentials: 'include' });
    return data?.name || data?.login || data?.nick || data?.username || null;
  } catch (error) {
    if (error.message === 'NOT_LOGGED_IN') {
      throw error;
    }
    throw new Error('NOT_LOGGED_IN');
  }
}

export async function fetchWantToSeeCount(username) {
  const res = await fetch(
    `${API_BASE}/user/${encodeURIComponent(username)}/want2see/film/count`,
    {
      credentials: 'omit',
      headers: {
        'X-Locale': 'pl',
        Accept: 'application/json',
      },
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

export async function fetchTitleInfo(entityId) {
  return apiFetch(`title/${entityId}/info`);
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

function extractFilmIdFromHref(href) {
  const match = href.match(/-(\d+)(?:[/?#]|$)/);
  return match ? Number(match[1]) : null;
}

export function scrapeFilmsFromDom(root = document) {
  const films = new Map();

  const addFilm = (id, title, url) => {
    const numericId = Number(id);
    if (!numericId) {
      return;
    }

    films.set(numericId, {
      id: numericId,
      title: title?.trim() || `#${numericId}`,
      url: url || `https://www.filmweb.pl/film/-${numericId}`,
    });
  };

  root.querySelectorAll('a[href*="/film/"]').forEach((link) => {
    const id = extractFilmIdFromHref(link.href);
    if (id) {
      addFilm(id, link.textContent, link.href);
    }
  });

  root.querySelectorAll('[data-id], [data-film-id], [data-entity-id]').forEach((el) => {
    const id = el.dataset.id || el.dataset.filmId || el.dataset.entityId;
    if (id) {
      addFilm(id, el.textContent, null);
    }
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
  let resolvedUsername = username || null;

  if (!resolvedUsername) {
    try {
      resolvedUsername = await getLoggedUsername();
    } catch (error) {
      apiError = error;
    }
  }

  if (resolvedUsername) {
    try {
      films = await fetchWantToSeeFilmsByUsername(resolvedUsername);
    } catch (error) {
      apiError = error;
    }

    try {
      expectedCount = await fetchWantToSeeCount(resolvedUsername);
    } catch {
      expectedCount =
        typeof document !== 'undefined' ? readExpectedCountFromDom() : null;
    }
  } else {
    expectedCount =
      typeof document !== 'undefined' ? readExpectedCountFromDom() : null;
  }

  if (films.length === 0) {
    try {
      films = await fetchLoggedWantToSeeFilms();
      apiError = null;
    } catch (error) {
      apiError = error;
    }
  }

  if (films.length === 0 && typeof document !== 'undefined') {
    films = scrapeFilmsFromDom().map((film) => ({ entity: film.id, _dom: film }));
  }

  if (films.length === 0) {
    if (apiError?.message === 'NOT_LOGGED_IN' || !resolvedUsername) {
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
