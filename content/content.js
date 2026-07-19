const BUTTON_ID = 'filmweb-helper-random-btn';
const OVERLAY_ID = 'filmweb-helper-overlay';
const NAV_EVENT = 'filmweb-helper:navigation';

function t(key, substitutions) {
  return browser.i18n.getMessage(key, substitutions);
}

function extractUsername(url = window.location.href) {
  const match = String(url).match(/\/user\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

function getPageRoute(url = window.location.href) {
  const { pathname, search, hash } = new URL(url);
  return `${pathname}${search}${hash}`.toLowerCase();
}

function shouldShowButton() {
  return Boolean(extractUsername());
}

function ensureButton() {
  if (!shouldShowButton()) {
    document.getElementById(BUTTON_ID)?.remove();
    return;
  }

  let button = document.getElementById(BUTTON_ID);
  if (button) {
    return;
  }

  button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = t('pickRandomButton');
  button.addEventListener('click', () => runRandomPick(button));

  (document.body || document.documentElement).appendChild(button);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  (document.body || document.documentElement).appendChild(overlay);
}

function getErrorMessage(code) {
  switch (code) {
    case 'NOT_LOGGED_IN':
      return t('errorNotLoggedIn');
    case 'EMPTY_LIST':
      return t('errorEmptyList');
    case 'NO_RESPONSE':
      return t('errorNoResponse');
    default:
      return t('errorGeneric');
  }
}

async function runRandomPick(button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = t('randomizing');

  try {
    const response = await browser.runtime.sendMessage({
      action: 'getRandomMovie',
      username: extractUsername(),
    });

    if (!response) {
      throw new Error('NO_RESPONSE');
    }

    if (!response.success) {
      throw new Error(response.error || 'UNKNOWN');
    }

    showOverlay(response.movie);
  } catch (error) {
    alert(getErrorMessage(error.message));
  } finally {
    button.disabled = false;
    button.textContent = originalText;
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

function patchHistoryMethod(method) {
  const original = history[method];
  history[method] = function patchedHistoryMethod(...args) {
    const result = original.apply(this, args);
    window.dispatchEvent(new Event(NAV_EVENT));
    return result;
  };
}

patchHistoryMethod('pushState');
patchHistoryMethod('replaceState');

window.addEventListener(NAV_EVENT, syncUi);
window.addEventListener('hashchange', syncUi);
window.addEventListener('popstate', syncUi);

let lastRoute = getPageRoute();
setInterval(() => {
  const route = getPageRoute();
  if (route !== lastRoute) {
    lastRoute = route;
    syncUi();
  }
}, 500);

const observer = new MutationObserver(scheduleSync);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'showOverlay' && message.movie) {
    showOverlay(message.movie);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncUi);
} else {
  syncUi();
}

setTimeout(syncUi, 1000);
setTimeout(syncUi, 3000);
