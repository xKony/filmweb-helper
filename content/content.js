/**
 * TODO: Implement rating hiding logic.
 * This script runs on filmweb.pl pages.
 */
(async function() {
  const settings = await browser.storage.local.get(['hideRatings']);
  
  if (settings.hideRatings) {
    applyRatingHider();
  }

  function applyRatingHider() {
    console.log('Filmweb Helper: Rating hider active');
    // TODO: Add MutationObserver to hide ratings in dynamically loaded lists
    // Example: document.querySelectorAll('.filmRate__rate').forEach(el => el.style.filter = 'blur(5px)');
  }
})();
