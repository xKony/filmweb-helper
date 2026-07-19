/**
 * Runs at document_start to censor ratings before first paint when possible.
 * Uses a sync sessionStorage hint, then confirms via extension storage.
 */
(() => {
  const ROOT_CLASS = 'fwh-hide-ratings';
  const STORAGE_HINT = 'fwh-hide-ratings';

  function applyHint(enabled) {
    const root = document.documentElement;
    if (!root) {
      return;
    }

    root.classList.toggle(ROOT_CLASS, Boolean(enabled));

    try {
      sessionStorage.setItem(STORAGE_HINT, enabled ? '1' : '0');
    } catch {
      // Private mode / blocked storage — ignore.
    }
  }

  try {
    if (sessionStorage.getItem(STORAGE_HINT) === '1') {
      applyHint(true);
    }
  } catch {
    // Ignore.
  }

  browser.storage.local.get(['hideRatings']).then((settings) => {
    applyHint(settings.hideRatings === true);
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.hideRatings) {
      return;
    }

    applyHint(changes.hideRatings.newValue === true);
  });
})();
