# Filmweb Helper

Rozszerzenie przeglądarki do losowania filmów z listy **„Chcę zobaczyć”** na [Filmwebie](https://www.filmweb.pl/).

Obsługiwane przeglądarki:

| Przeglądarka | Branch Git | Manifest |
| --- | --- | --- |
| Firefox | [`firefox`](./tree/firefox) | `background.scripts` + `browser_specific_settings.gecko` |
| Google Chrome | [`chromium`](./tree/chromium) | `background.service_worker` |
| Microsoft Edge | [`chromium`](./tree/chromium) | ten sam co Chrome |

Kod aplikacji (`lib/`, `content/`, `popup/`, `background/`) jest wspólny. Różnią się tylko pliki `manifest.json` między branchami.

## Instalacja

### Firefox

```bash
git checkout firefox
```

1. Otwórz `about:debugging`
2. **Tymczasowe rozszerzenie** → **Załaduj tymczasowe rozszerzenie**
3. Wskaż plik `manifest.json` z repozytorium

### Chrome / Edge

```bash
git checkout chromium
```

**Chrome:** `chrome://extensions` → **Tryb deweloperski** → **Załaduj rozpakowane**

**Edge:** `edge://extensions` → **Tryb deweloperski** → **Załaduj rozpakowane**

W obu przypadkach wybierz folder repozytorium (ten, w którym leży `manifest.json`).

## Użycie

1. Zaloguj się na Filmwebie.
2. Otwórz listę filmów do obejrzenia, np. `https://www.filmweb.pl/user/TWOJ_NICK#/wantToSee/film`.
3. Kliknij **Wylosuj film** (przycisk na stronie albo w popupie rozszerzenia).

Rozszerzenie pobiera **całą listę** przez API Filmwebu (wszystkie strony paginacji), porównuje liczbę filmów z licznikiem na stronie i losuje jeden tytuł.

## Struktura branchy

- **`main`** — wspólny kod, szablony manifestów w `manifests/`, domyślnie manifest Firefoksa
- **`firefox`** — gotowy manifest pod Firefoksa
- **`chromium`** — gotowy manifest pod Chrome i Edge

### Przełączanie manifestu lokalnie (bez zmiany brancha)

Windows (PowerShell):

```powershell
./scripts/use-manifest.ps1 firefox
./scripts/use-manifest.ps1 chromium
```

Linux / macOS:

```bash
chmod +x scripts/use-manifest.sh
./scripts/use-manifest.sh firefox
./scripts/use-manifest.sh chromium
```

## Wymagania

- Firefox 109+ (branch `firefox`)
- Chrome / Edge 109+ (branch `chromium`)
- Konto na Filmwebie z filmami na liście „Chcę zobaczyć”
