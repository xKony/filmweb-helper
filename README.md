# Filmweb Helper

Polskie, nieoficjalne rozszerzenie przeglądarki do [Filmweba](https://www.filmweb.pl/).

> **Uwaga / Disclaimer:** ten projekt jest niezależny i **nie jest powiązany** z Filmweb Sp. z o.o. ani żadną spółką z grupy Filmweb / Ringier Axel Springer. Filmweb® jest znakiem towarowym swoich właścicieli. Rozszerzenie korzysta z publicznie dostępnych stron i API serwisu na własną odpowiedzialność użytkownika.

Licencja: [MIT](./LICENSE).

## Funkcje

- **Losowanie filmu** z listy „Chcę zobaczyć” (przycisk na stronie profilu albo w popupie rozszerzenia)
- **Ukrywanie ocen** społeczności i krytyków, dopóki sam nie ocenisz tytułu (włączane w ustawieniach)
- **Link do napisów** na [OpenSubtitles.org](https://www.opensubtitles.org/) na stronach filmów i seriali (język PL/EN w ustawieniach)

## Obsługiwane przeglądarki

Jeden wspólny kod źródłowy. Różnica między Chrome/Edge a Firefoksem to tylko plik `manifest.json` (szablony w `manifests/`).

| Przeglądarka | Manifest |
| --- | --- |
| Google Chrome | `manifests/manifest.chromium.json` (domyślny w repo) |
| Microsoft Edge | ten sam co Chrome |
| Firefox | `manifests/manifest.firefox.json` |

## Instalacja

Sklonuj repozytorium:

```bash
git clone https://github.com/xKony/filmweb-helper.git
cd filmweb-helper
```

### Chrome / Edge (domyślny manifest)

Repozytorium ma już ustawiony manifest Chromium w `manifest.json`.

1. **Chrome:** `chrome://extensions` → **Tryb deweloperski** → **Załaduj rozpakowane**
2. **Edge:** `edge://extensions` → **Tryb deweloperski** → **Załaduj rozpakowane**
3. Wskaż folder repozytorium (ten z `manifest.json`)

### Firefox

Najpierw podmień manifest na wersję Firefoksa:

```powershell
# Windows (PowerShell)
./scripts/use-manifest.ps1 firefox
```

```bash
# Linux / macOS
chmod +x scripts/use-manifest.sh
./scripts/use-manifest.sh firefox
```

Potem:

1. Otwórz `about:debugging`
2. **Tymczasowe rozszerzenie** → **Załaduj tymczasowe rozszerzenie**
3. Wskaż plik `manifest.json` z repozytorium

Aby wrócić do manifestu Chromium:

```powershell
./scripts/use-manifest.ps1 chromium
```

```bash
./scripts/use-manifest.sh chromium
```

## Użycie

1. Zaloguj się na Filmwebie.
2. Otwórz swój profil / listę „Chcę zobaczyć”, np. `https://www.filmweb.pl/user/TWOJ_NICK#/wantToSee/film`.
3. Kliknij **Wylosuj film** (przycisk na stronie albo w popupie).
4. Opcje (ukrywanie ocen, język napisów) znajdziesz w **Ustawieniach** rozszerzenia.

Losowanie pobiera listę przez publiczne API Filmwebu (`/api/v1/user/{nick}/want2see/film`).

## Struktura projektu

| Ścieżka | Rola |
| --- | --- |
| `lib/` | Wspólna logika (API, napisy, polyfille) |
| `content/` | Skrypty i style wstrzykiwane na filmweb.pl |
| `background/` | Service worker / skrypty w tle |
| `popup/` | Popup paska narzędzi |
| `options/` | Strona ustawień |
| `manifests/` | Szablony manifestów Chromium i Firefox |
| `scripts/` | Przełączanie `manifest.json` lokalnie |
| `_locales/` | Tłumaczenia PL / EN |

Branch **`main`** — kod produkcyjny. Branch **`dev`** — bieżąca praca rozwojowa.

## Wymagania

- Chrome / Edge 109+ lub Firefox 109+
- Konto na Filmwebie (do losowania z własnej listy i wykrywania ocenionych tytułów)

## Licencja

Kod udostępniony na licencji [MIT](./LICENSE) — Copyright (c) 2026 xKony.
