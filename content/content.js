import browser from '../lib/browser.js';
import {
  extractUsername,
  isWantToSeeFilmPage,
  pickRandomWantToSeeFilm,
} from '../lib/want2see.js';

const BUTTON_ID = 'filmweb-helper-random-btn';
const OVERLAY_ID = 'filmweb-helper-overlay';

function t(key, substitutions) {
  return browser.i18n.getMessage(key, substitutions);
}

function ensureButton() {
  if (!isWantToSeeFilmPage()) {
    document.getElementById(BUTTON_ID)?.remove();
    return;
  }

  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = t('pickRandomButton');
  button.addEventListener('click', () => runRandomPick(button));
  document.body.appendChild(button);
}

function showOverlay(movie) {
  document.getElementById(OVERLAY_ID)?.remove();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.innerHTML = `
    <div class="fwh-modal" role="dialog" aria-labelledby="fwh-modal-title">
      <button type="button" class="fwh-close" aria-label="${t('closeOverlay')}">&times;</button>
      <p class="fwh-label">${t('randomResult')}</p>
      <h2 id="fwh-modal-title" class="fwh-title">${escapeHtml(movie.title)}</h2>
      ${movie.year ? `<p class="fwh-year">${movie.year}</p>` : ''}
      ${movie.originalTitle && movie.originalTitle !== movie.title
        ? `<p class="fwh-original">${escapeHtml(movie.originalTitle)}</p>`
        : ''}
      ${movie.countMismatch
        ? `<p class="fwh-warning">${t('countMismatch', [
            String(movie.countMismatch.fetched),
            String(movie.countMismatch.expected),
          ])}</p>`
        : ''}
      <p class="fwh-meta">${t('poolSize', [String(movie.totalCount)])}</p>
      <a class="fwh-link" href="${movie.url}" target="_blank" rel="noopener">${t('openFilm')}</a>
    </div>
  `;

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('.fwh-close')) {
      overlay.remove();
    }
  });

  document.body.appendChild(overlay);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function runRandomPick(button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = t('randomizing');

  try {
    const username = extractUsername(window.location.href);
    const movie = await pickRandomWantToSeeFilm({ username });
    await browser.storage.local.set({ lastRandomResult: movie });
    showOverlay(movie);
  } catch (error) {
    alert(getErrorMessage(error));
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function getErrorMessage(error) {
  switch (error.message) {
    case 'NOT_LOGGED_IN':
      return t('errorNotLoggedIn');
    case 'EMPTY_LIST':
      return t('errorEmptyList');
    default:
      return t('errorGeneric');
  }
}

function syncUi() {
  ensureButton();
}

let syncScheduled = false;
function scheduleSync() {
  if (syncScheduled) {
    return;
  }

  syncScheduled = true;
  requestAnimationFrame(() => {
    syncScheduled = false;
    syncUi();
  });
}

window.addEventListener('hashchange', syncUi);
window.addEventListener('popstate', syncUi);

const observer = new MutationObserver(scheduleSync);

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action !== 'getRandomMovie') {
    return undefined;
  }

  const username =
    message.username || extractUsername(window.location.href) || undefined;

  return pickRandomWantToSeeFilm({ username })
    .then(async (movie) => {
      await browser.storage.local.set({ lastRandomResult: movie });
      if (isWantToSeeFilmPage()) {
        showOverlay(movie);
      }
      return { success: true, movie };
    })
    .catch((error) => ({
      success: false,
      error: error.message,
    }));
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncUi);
} else {
  syncUi();
}
