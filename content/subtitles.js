/**
 * Injects an OpenSubtitles.org download link on Filmweb film/serial pages.
 * Language comes from extension settings (Polish / English).
 */
(() => {
  const LINK_ID = 'filmweb-helper-subtitles-link';
  const DEFAULT_LANGUAGE = 'pol';
  const { buildOpenSubtitlesSearchUrl } = globalThis.FilmwebHelperSubtitles;

  let enabled = true;
  let language = DEFAULT_LANGUAGE;
  let syncScheduled = false;

  function t(key, substitutions) {
    return browser.i18n.getMessage(key, substitutions);
  }

  function isTitlePage(url = window.location.href) {
    return /\/(?:film|serial)\/[^/?#]+-\d+/i.test(url);
  }

  function readTextWithoutYear(el) {
    if (!el) {
      return '';
    }

    const clone = el.cloneNode(true);
    clone.querySelectorAll('.filmCoverSection__year, .year').forEach((node) => {
      node.remove();
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function getTitleMeta() {
    const polishTitle = document
      .querySelector('h1.filmCoverSection__title, h1[itemprop="name"]')
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();

    const originalTitle =
      readTextWithoutYear(
        document.querySelector('.filmCoverSection__originalTitle')
      ) ||
      document
        .querySelector('.filmInfo__group--originalTitle .filmInfo__info')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim();

    const year =
      document
        .querySelector(
          '.filmCoverSection__year, .filmCoverSection__originalTitle .filmCoverSection__year'
        )
        ?.textContent?.trim()
        .match(/\d{4}/)?.[0] || null;

    const imdbHref = document.querySelector(
      'a[href*="imdb.com/title/tt"]'
    )?.href;
    const imdbId = imdbHref?.match(/tt(\d{5,})/i)?.[1] ?? null;

    return {
      title: originalTitle || polishTitle || '',
      year,
      imdbId,
    };
  }

  function languageLabel() {
    return language === 'eng'
      ? t('subtitleLanguageEnglish')
      : t('subtitleLanguagePolish');
  }

  function ensureLink() {
    if (!enabled || !isTitlePage()) {
      document.getElementById(LINK_ID)?.remove();
      return;
    }

    const meta = getTitleMeta();
    if (!meta.title && !meta.imdbId) {
      document.getElementById(LINK_ID)?.remove();
      return;
    }

    const href = buildOpenSubtitlesSearchUrl({
      ...meta,
      language,
    });

    let link = document.getElementById(LINK_ID);
    if (!link) {
      link = document.createElement('a');
      link.id = LINK_ID;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    link.href = href;
    link.textContent = t('downloadSubtitlesLink', [languageLabel()]);
    link.title = t('downloadSubtitlesTitle', [languageLabel()]);

    const mount =
      document.querySelector('.filmCoverSection__titleDetails') ||
      document.querySelector('.filmCoverSection__card') ||
      document.body;

    if (link.parentElement !== mount) {
      mount.appendChild(link);
    }
  }

  function scheduleSync() {
    if (syncScheduled) {
      return;
    }

    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      ensureLink();
    });
  }

  async function loadSettings() {
    const settings = await browser.storage.local.get([
      'subtitlesLinkEnabled',
      'subtitleLanguage',
    ]);

    enabled = settings.subtitlesLinkEnabled !== false;
    language = settings.subtitleLanguage === 'eng' ? 'eng' : DEFAULT_LANGUAGE;
    ensureLink();
  }

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
      return;
    }

    if (changes.subtitlesLinkEnabled) {
      enabled = changes.subtitlesLinkEnabled.newValue !== false;
    }

    if (changes.subtitleLanguage) {
      language =
        changes.subtitleLanguage.newValue === 'eng' ? 'eng' : DEFAULT_LANGUAGE;
    }

    if (changes.subtitlesLinkEnabled || changes.subtitleLanguage) {
      ensureLink();
    }
  });

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener('hashchange', scheduleSync);
  window.addEventListener('popstate', scheduleSync);

  loadSettings();
  scheduleSync();
})();
