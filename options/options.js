document.addEventListener('DOMContentLoaded', async () => {
  const hideRatingsInput = document.getElementById('hideRatings');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const description = document.getElementById('hideRatingsDescription');

  document.getElementById('pageTitle').textContent =
    browser.i18n.getMessage('settingsTitle');
  document.getElementById('hideRatingsLabel').textContent =
    browser.i18n.getMessage('hideRatingsLabel');
  description.textContent = browser.i18n.getMessage('hideRatingsDescription');
  saveBtn.textContent = browser.i18n.getMessage('saveSettings');

  const settings = await browser.storage.local.get(['hideRatings']);
  hideRatingsInput.checked = settings.hideRatings === true;

  const showSaved = () => {
    status.textContent = browser.i18n.getMessage('settingsSaved');
    status.classList.add('visible');
    window.setTimeout(() => status.classList.remove('visible'), 2000);
  };

  const saveSettings = async () => {
    await browser.storage.local.set({
      hideRatings: hideRatingsInput.checked,
    });
    showSaved();
  };

  hideRatingsInput.addEventListener('change', saveSettings);
  saveBtn.addEventListener('click', saveSettings);
});
