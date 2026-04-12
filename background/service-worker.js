browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    // Set default settings
    await browser.storage.local.set({
      hideRatings: false,
      randomizerEnabled: true,
      lastRandomResult: null
    });
  }
});

browser.runtime.onMessage.addListener(async (message, sender) => {
  // TODO: Implement background logic for list fetching or state management
  if (message.action === "getRandomMovie") {
    return { success: true, movie: "TODO: Pick from list" };
  }
});
