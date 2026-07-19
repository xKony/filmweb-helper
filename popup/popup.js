document.addEventListener('DOMContentLoaded', async () => {
  const randomBtn = document.getElementById('randomBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const resultEl = document.getElementById('result');

  document.getElementById('randomText').textContent = browser.i18n.getMessage('randomizeMovie');
  optionsBtn.textContent = browser.i18n.getMessage('openOptions');

  randomBtn.addEventListener('click', async () => {
    randomBtn.disabled = true;
    resultEl.className = 'result-area loading';
    resultEl.textContent = browser.i18n.getMessage('randomizing');

    try {
      const response = await browser.runtime.sendMessage({ action: 'getRandomMovie' });

      if (!response) {
        throw new Error('NO_RESPONSE');
      }

      if (!response.success) {
        throw new Error(response.error || 'UNKNOWN');
      }

      renderResult(resultEl, response.movie);
    } catch (error) {
      resultEl.className = 'result-area error';
      resultEl.textContent = getErrorMessage(error.message);
    } finally {
      randomBtn.disabled = false;
    }
  });

  optionsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });

  const { lastRandomResult } = await browser.storage.local.get(['lastRandomResult']);
  if (lastRandomResult) {
    renderResult(resultEl, lastRandomResult);
  }
});

function renderResult(container, movie) {
  container.className = 'result-area success';
  container.innerHTML = '';

  const title = document.createElement('strong');
  title.textContent = movie.title;
  container.appendChild(title);

  if (movie.year) {
    const year = document.createElement('span');
    year.className = 'result-year';
    year.textContent = ` (${movie.year})`;
    container.appendChild(year);
  }

  if (movie.countMismatch) {
    const warning = document.createElement('p');
    warning.className = 'result-warning';
    warning.textContent = browser.i18n.getMessage('countMismatch', [
      String(movie.countMismatch.fetched),
      String(movie.countMismatch.expected),
    ]);
    container.appendChild(warning);
  }

  const meta = document.createElement('p');
  meta.className = 'result-meta';
  meta.textContent = browser.i18n.getMessage('poolSize', [String(movie.totalCount)]);
  container.appendChild(meta);

  const link = document.createElement('a');
  link.href = movie.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = browser.i18n.getMessage('openFilm');
  link.className = 'result-link';
  container.appendChild(link);
}

function getErrorMessage(code) {
  switch (code) {
    case 'NOT_LOGGED_IN':
      return browser.i18n.getMessage('errorNotLoggedIn');
    case 'EMPTY_LIST':
      return browser.i18n.getMessage('errorEmptyList');
    case 'NO_RESPONSE':
      return browser.i18n.getMessage('errorNoResponse');
    default:
      return browser.i18n.getMessage('errorGeneric');
  }
}
