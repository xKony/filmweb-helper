const api = globalThis.browser ?? globalThis.chrome;

if (!api) {
  throw new Error('Filmweb Helper: WebExtension APIs are unavailable.');
}

export default api;
