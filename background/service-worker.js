import browser from '../lib/browser.js';
import {
  extractUsername,
  getLoggedUsername,
  pickRandomWantToSeeFilm,
} from '../lib/want2see.js';

async function resolveUsername(tab, explicitUsername) {
  if (explicitUsername) {
    return explicitUsername;
  }

  if (tab?.url) {
    const fromUrl = extractUsername(tab.url);
    if (fromUrl) {
      return fromUrl;
    }
  }

  try {
    return await getLoggedUsername();
  } catch {
    return null;
  }
}

async function pickRandomMovie(tab, explicitUsername) {
  const username = await resolveUsername(tab, explicitUsername);

  if (!username) {
    throw new Error('NOT_LOGGED_IN');
  }

  const movie = await pickRandomWantToSeeFilm({ username });
  await browser.storage.local.set({ lastRandomResult: movie });
  return { success: true, movie };
}

async function showOverlayOnTab(tab, movie) {
  if (!tab?.id || !tab.url?.includes('filmweb.pl')) {
    return;
  }

  try {
    await browser.tabs.sendMessage(tab.id, {
      action: 'showOverlay',
      movie,
    });
  } catch {
    // Content script may not be injected yet.
  }
}

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await browser.storage.local.set({
      hideRatings: false,
      randomizerEnabled: true,
      lastRandomResult: null,
    });
  }
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action !== 'getRandomMovie') {
    return undefined;
  }

  return (async () => {
    const tab =
      sender.tab ??
      (await browser.tabs.query({ active: true, currentWindow: true }))[0];

    try {
      const result = await pickRandomMovie(tab, message.username);
      // Popup-initiated picks: also show overlay on the Filmweb tab.
      if (!sender.tab) {
        await showOverlayOnTab(tab, result.movie);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  })();
});
