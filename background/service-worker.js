import browser from '../lib/browser.js';
import {
  extractUsername,
  getLoggedUsername,
  pickRandomWantToSeeFilm,
} from '../lib/want2see.js';

async function resolveUsername(tab) {
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

async function pickRandomMovie(tab) {
  const username = await resolveUsername(tab);
  const movie = await pickRandomWantToSeeFilm({ username });
  await browser.storage.local.set({ lastRandomResult: movie });
  return { success: true, movie };
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
    const tab = sender.tab ?? (await browser.tabs.query({ active: true, currentWindow: true }))[0];

    if (tab?.id && tab.url?.includes('filmweb.pl')) {
      try {
        const response = await browser.tabs.sendMessage(tab.id, {
          action: 'getRandomMovie',
          username: extractUsername(tab.url),
        });

        if (response?.success) {
          return response;
        }
      } catch {
        // Content script unavailable — fall back to background fetch.
      }
    }

    try {
      return await pickRandomMovie(tab);
    } catch (error) {
      return { success: false, error: error.message };
    }
  })();
});
