/**
 * Builds an OpenSubtitles.org search URL for a title.
 * Prefers IMDb ID when known; otherwise original title + year.
 */
export function buildOpenSubtitlesSearchUrl({
  title,
  year,
  language = 'pol',
  imdbId = null,
} = {}) {
  const lang = language === 'eng' ? 'eng' : 'pol';
  const base = 'https://www.opensubtitles.org/en/search';

  const cleanImdb = normalizeImdbId(imdbId);
  if (cleanImdb) {
    return `${base}/sublanguageid-${lang}/imdbid-${cleanImdb}`;
  }

  const slug = slugifyMovieName(title);
  if (!slug) {
    return `${base}/sublanguageid-${lang}`;
  }

  let url = `${base}/sublanguageid-${lang}/moviename-${slug}`;
  if (year && /^\d{4}$/.test(String(year))) {
    url += `/movieyear-${year}`;
  }

  return url;
}

/** Strip optional `tt` prefix; OpenSubtitles expects digits only. */
export function normalizeImdbId(value) {
  if (value == null) {
    return null;
  }

  const match = String(value).trim().match(/^(?:tt)?(\d{5,})$/i);
  return match ? match[1].replace(/^0+/, '') || match[1] : null;
}

export function slugifyMovieName(title) {
  return String(title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '+')
    .replace(/^\++|\++$/g, '')
    .toLowerCase();
}
