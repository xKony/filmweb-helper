/**
 * Hides community Filmweb ratings until the logged-in user has voted
 * on that title. Uses the public `/user/{nick}/vote/{type}` lists.
 */
(() => {
  const ROOT_CLASS = 'fwh-hide-ratings';
  const RATED_CLASS = 'fwh-rated';
  const API_BASE = 'https://www.filmweb.pl/api/v1';
  const VOTE_TYPES = ['film', 'serial', 'videogame'];
  const COMMUNITY_SELECTORS = [
    '.filmRating--filmRate',
    '.rankingType__rateWrapper',
    '.filmRating--entityInUserTaste',
  ].join(', ');

  let enabled = false;
  let username = null;
  /** @type {Set<number>} */
  let votedIds = new Set();
  let syncScheduled = false;
  let votesRefreshTimer = null;
  let lastVotesFetch = 0;

  function scheduleSync() {
    if (syncScheduled) {
      return;
    }

    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      applyRevealState();
    });
  }

  async function apiJson(path, { credentials = 'omit' } = {}) {
    const res = await fetch(`${API_BASE}/${path}`, {
      credentials,
      headers: {
        Accept: 'application/json',
        'X-Locale': 'pl',
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

    return JSON.parse(text);
  }

  function parseVoteIds(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((entry) => {
        if (Array.isArray(entry)) {
          return Number(entry[0]);
        }
        if (entry && typeof entry === 'object') {
          return Number(entry.entity ?? entry.id);
        }
        return Number(entry);
      })
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  async function resolveUsername() {
    try {
      const data = await apiJson('logged/info', { credentials: 'include' });
      return data?.name || data?.login || data?.nick || data?.username || null;
    } catch {
      return null;
    }
  }

  async function fetchVotedIds(nick) {
    const lists = await Promise.all(
      VOTE_TYPES.map(async (type) => {
        try {
          const data = await apiJson(
            `user/${encodeURIComponent(nick)}/vote/${type}`
          );
          return parseVoteIds(data);
        } catch {
          return [];
        }
      })
    );

    return new Set(lists.flat());
  }

  function extractIdFromHref(href) {
    if (!href) {
      return null;
    }

    const match = String(href).match(
      /\/(?:film|serial|videogame)\/[^/?#]*-(\d+)(?:[/?#]|$)/i
    );
    return match ? Number(match[1]) : null;
  }

  function getPageEntityId() {
    const fromUrl = extractIdFromHref(window.location.pathname);
    if (fromUrl) {
      return fromUrl;
    }

    const cover = document.querySelector('[data-film-id], [data-entity-id]');
    const raw = cover?.dataset?.filmId || cover?.dataset?.entityId;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function findEntityId(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const filmId = Number(node.dataset?.filmId || node.dataset?.entityId);
      if (Number.isFinite(filmId) && filmId > 0) {
        return filmId;
      }

      if (node.classList?.contains('rankingType__rateWrapper')) {
        const rankingId = Number(node.dataset?.id);
        if (Number.isFinite(rankingId) && rankingId > 0) {
          return rankingId;
        }
      }

      if (node.tagName === 'A') {
        const fromHref = extractIdFromHref(node.getAttribute('href'));
        if (fromHref) {
          return fromHref;
        }
      }

      const link = node.querySelector?.(
        'a[href*="/film/"], a[href*="/serial/"], a[href*="/videogame/"]'
      );
      const fromChild = extractIdFromHref(link?.getAttribute('href'));
      if (fromChild) {
        return fromChild;
      }

      node = node.parentElement;
    }

    return getPageEntityId();
  }

  /** DOM fallback right after voting, before the public vote list refreshes. */
  function pageLooksUserRated() {
    const panel = document.querySelector(
      '.ratingPanel, .filmRatingSection__filmActionBox'
    );
    if (!panel) {
      return false;
    }

    if (
      panel.querySelector(
        '[data-user-rate], .userRate, .simpleRate--rated, .hasRate, [aria-checked="true"]'
      )
    ) {
      return true;
    }

    const text = (panel.textContent || '').toLowerCase();
    const hasRateCta = text.includes('oceń') || text.includes('rate');
    const hasScore = /(?:^|\D)([1-9]|10)(?:\D|$)/.test(text);
    return hasScore && !hasRateCta;
  }

  function isEntityRated(id) {
    if (id && votedIds.has(id)) {
      return true;
    }

    if (id && id === getPageEntityId() && pageLooksUserRated()) {
      return true;
    }

    return false;
  }

  function applyRevealState() {
    if (!enabled) {
      document.documentElement.classList.remove(ROOT_CLASS);
      document
        .querySelectorAll(`.${RATED_CLASS}`)
        .forEach((el) => el.classList.remove(RATED_CLASS));
      return;
    }

    document.documentElement.classList.add(ROOT_CLASS);

    document.querySelectorAll(COMMUNITY_SELECTORS).forEach((el) => {
      const id = findEntityId(el);
      const rated = isEntityRated(id);
      el.classList.toggle(RATED_CLASS, rated);

      const container = el.closest(
        '.filmCoverSection__ratings, .rankingType, .preview, .previewCard, [data-film-id]'
      );
      if (container) {
        container.classList.toggle(RATED_CLASS, rated);
      }
    });

    const pageId = getPageEntityId();
    const pageRated = isEntityRated(pageId);
    document
      .querySelector('.filmCoverSection__ratings')
      ?.classList.toggle(RATED_CLASS, pageRated);
  }

  async function refreshVotes({ force = false } = {}) {
    if (!enabled) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastVotesFetch < 5000) {
      scheduleSync();
      return;
    }

    username = username || (await resolveUsername());
    if (!username) {
      votedIds = new Set();
      applyRevealState();
      return;
    }

    try {
      votedIds = await fetchVotedIds(username);
      lastVotesFetch = Date.now();
    } catch {
      // Keep previous cache on transient failures.
    }

    applyRevealState();
  }

  async function setEnabled(nextEnabled) {
    enabled = Boolean(nextEnabled);

    if (!enabled) {
      applyRevealState();
      return;
    }

    await refreshVotes({ force: true });
  }

  function onPossibleVote() {
    window.setTimeout(() => {
      refreshVotes({ force: true });
    }, 1200);
  }

  browser.storage.local.get(['hideRatings']).then((settings) => {
    setEnabled(settings.hideRatings === true);
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.hideRatings) {
      return;
    }

    setEnabled(changes.hideRatings.newValue === true);
  });

  document.addEventListener(
    'click',
    (event) => {
      if (!enabled) {
        return;
      }

      if (
        event.target.closest(
          '.ratingPanel, .filmRatingSection, .filmRatingSection__filmActionBox, [class*="rateStar"], [class*="RateStar"]'
        )
      ) {
        onPossibleVote();
      }
    },
    true
  );

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && enabled) {
      refreshVotes({ force: true });
    }
  });

  votesRefreshTimer = window.setInterval(() => {
    if (enabled && document.visibilityState === 'visible') {
      refreshVotes({ force: true });
    }
  }, 60_000);

  window.addEventListener('beforeunload', () => {
    window.clearInterval(votesRefreshTimer);
  });
})();
