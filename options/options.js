document.addEventListener('DOMContentLoaded', async () => {
  const hideRatingsInput = document.getElementById('hideRatings');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Localize
  document.getElementById('pageTitle').textContent = browser.i18n.getMessage('settingsTitle');
  document.getElementById('hideRatingsLabel').textContent = browser.i18n.getMessage('hideRatingsLabel');
  saveBtn.textContent = browser.i18n.getMessage('saveSettings');

  // Load current settings
  const settings = await browser.storage.local.get(['hideRatings']);
  hideRatingsInput.checked = settings.hideRatings || false;

  saveBtn.addEventListener('click', async () => {
    await browser.storage.local.set({
      hideRatings: hideRatingsInput.checked
    });

    status.textContent = browser.i18n.getMessage('settingsSaved');
    status.classList.add('visible');
    
    setTimeout(() => {
      status.classList.remove('visible');
    }, 2000);
  });
});
