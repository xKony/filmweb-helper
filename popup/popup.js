document.addEventListener('DOMContentLoaded', async () => {
  const randomBtn = document.getElementById('randomBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const resultEl = document.getElementById('result');
  const subtitleEl = document.getElementById('subtitle');

  document.getElementById('randomText').textContent =
    browser.i18n.getMessage('randomizeMovie');
  optionsBtn.textContent = browser.i18n.getMessage('openOptions');
  subtitleEl.textContent = browser.i18n.getMessage('popupSubtitle');

  randomBtn.addEventListener('click', async () => {
    randomBtn.disabled = true;
    resultEl.hidden = false;
    resultEl.className = 'result is-loading';
    resultEl.textContent = browser.i18n.getMessage('randomizing');

    try {
      const response = await browser.runtime.sendMessage({
        action: 'getRandomMovie',
      });

      if (!response) {
        throw new Error('NO_RESPONSE');
      }

      if (!response.success) {
        throw new Error(response.error || 'UNKNOWN');
      }

      renderResult(resultEl, response.movie);
    } catch (error) {
      resultEl.className = 'result is-error';
      resultEl.textContent = getErrorMessage(error.message);
    } finally {
      randomBtn.disabled = false;
    }
  });

  optionsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });

  const { lastRandomResult } = await browser.storage.local.get([
    'lastRandomResult',
  ]);
  if (lastRandomResult) {
    renderResult(resultEl, lastRandomResult);
  }
});

function renderResult(container, movie) {
  container.hidden = false;
  container.className = 'result is-success';
  container.replaceChildren();

  const label = document.createElement('p');
  label.className = 'result-label';
  label.textContent = browser.i18n.getMessage('randomResult');
  container.appendChild(label);

  const title = document.createElement('h2');
  title.className = 'result-title';
  title.textContent = movie.title;
  container.appendChild(title);

  if (movie.year) {
    const year = document.createElement('p');
    year.className = 'result-year';
    year.textContent = movie.year;
    container.appendChild(year);
  }

  if (movie.originalTitle && movie.originalTitle !== movie.title) {
    const original = document.createElement('p');
    original.className = 'result-original';
    original.textContent = movie.originalTitle;
    container.appendChild(original);
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
  meta.textContent = browser.i18n.getMessage('poolSize', [
    String(movie.totalCount),
  ]);
  container.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'result-actions';

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'btn btn-open';
  openBtn.textContent = browser.i18n.getMessage('openFilm');
  openBtn.addEventListener('click', () => openMovieOnFilmweb(movie.url));
  actions.appendChild(openBtn);

  container.appendChild(actions);
}

/** Prefer navigating an existing Filmweb tab instead of opening a new one. */
async function openMovieOnFilmweb(url) {
  try {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTab?.id && activeTab.url?.includes('filmweb.pl')) {
      await browser.tabs.update(activeTab.id, { url });
      window.close();
      return;
    }

    const filmwebTabs = await browser.tabs.query({
      url: ['*://www.filmweb.pl/*', '*://filmweb.pl/*'],
    });

    if (filmwebTabs[0]?.id) {
      await browser.tabs.update(filmwebTabs[0].id, { url, active: true });
      if (filmwebTabs[0].windowId != null) {
        await browser.windows.update(filmwebTabs[0].windowId, {
          focused: true,
        });
      }
      window.close();
      return;
    }

    await browser.tabs.create({ url });
    window.close();
  } catch {
    await browser.tabs.create({ url });
  }
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
