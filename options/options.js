document.addEventListener('DOMContentLoaded', async () => {
  const hideRatingsInput = document.getElementById('hideRatings');
  const subtitlesLinkInput = document.getElementById('subtitlesLinkEnabled');
  const subtitleLanguageSelect = document.getElementById('subtitleLanguage');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  document.getElementById('pageTitle').textContent =
    browser.i18n.getMessage('settingsTitle');
  document.getElementById('hideRatingsLabel').textContent =
    browser.i18n.getMessage('hideRatingsLabel');
  document.getElementById('hideRatingsDescription').textContent =
    browser.i18n.getMessage('hideRatingsDescription');
  document.getElementById('subtitlesLinkLabel').textContent =
    browser.i18n.getMessage('subtitlesLinkLabel');
  document.getElementById('subtitlesLinkDescription').textContent =
    browser.i18n.getMessage('subtitlesLinkDescription');
  document.getElementById('subtitleLanguageLabel').textContent =
    browser.i18n.getMessage('subtitleLanguageLabel');
  document.getElementById('subtitleLanguagePolishOption').textContent =
    browser.i18n.getMessage('subtitleLanguagePolish');
  document.getElementById('subtitleLanguageEnglishOption').textContent =
    browser.i18n.getMessage('subtitleLanguageEnglish');
  saveBtn.textContent = browser.i18n.getMessage('saveSettings');

  const settings = await browser.storage.local.get([
    'hideRatings',
    'subtitlesLinkEnabled',
    'subtitleLanguage',
  ]);

  hideRatingsInput.checked = settings.hideRatings === true;
  subtitlesLinkInput.checked = settings.subtitlesLinkEnabled !== false;
  subtitleLanguageSelect.value =
    settings.subtitleLanguage === 'eng' ? 'eng' : 'pol';
  subtitleLanguageSelect.disabled = !subtitlesLinkInput.checked;

  const showSaved = () => {
    status.textContent = browser.i18n.getMessage('settingsSaved');
    status.classList.add('visible');
    window.setTimeout(() => status.classList.remove('visible'), 2000);
  };

  const saveSettings = async () => {
    subtitleLanguageSelect.disabled = !subtitlesLinkInput.checked;

    await browser.storage.local.set({
      hideRatings: hideRatingsInput.checked,
      subtitlesLinkEnabled: subtitlesLinkInput.checked,
      subtitleLanguage:
        subtitleLanguageSelect.value === 'eng' ? 'eng' : 'pol',
    });
    showSaved();
  };

  hideRatingsInput.addEventListener('change', saveSettings);
  subtitlesLinkInput.addEventListener('change', saveSettings);
  subtitleLanguageSelect.addEventListener('change', saveSettings);
  saveBtn.addEventListener('click', saveSettings);
});
