# Site Shelves

A lightweight, themeable start page for your favorite sites with categories, drag-and-drop ordering, search, and a companion Chrome extension that lets you add the current tab as a card directly into your shelves in real time.


## Overview

- **App page**: `index.html` + `style.css` + `app.js`
- **Extension**: `site-shelves-extension/` (Manifest V3)
- **Storage**: Browser `localStorage` (no server)


## App Page

### Files
- `index.html`
  - Loads `style.css`, `SortableJS`, and `app.js` (as a module).
  - Header bar (`.search-bar`) with:
    - Settings button `#settingsBtn`
    - Grid size select `#gridSize`
    - Category jump `#categoryJump`
    - Optional header image `.header-image`
    - Search input `#searchInput` and clear button `#clearSearch`
    - Add Site button `#addSiteBtn`
  - Main grid container: `#cardGrid` where cards and group separators render.
  - Modals:
    - Add/Edit Site modal `#siteModal` with form `#siteForm` (`#siteUrl`, `#siteTitle`, optional icon upload `#siteIconFile`, category select `#siteCategorySelect`, and a new category flow via `#newCategoryContainer`).
    - Settings modal `#settingsModal` with tabs for Storage and Themes.
- `style.css`
  - Multi-theme support (`default`, `bright`, `comic`, `cyber`, `bronze`, `beautiful`).
  - Grid layout classes, card styles, hover states, and SortableJS drag visuals.
  - Empty states:
    - Global: when there are no cards, renders a card-sized `.card.empty-card` with CTA.
    - Per-category: renders `.card.empty-card.category-empty` after a group separator when a group has no cards.
  - Responsive/mobile rules: header bar stacks, search moves below, grid reflows at small breakpoints.
  - Background “Beautiful Day” theme flora and tiled SVG bushes with overlap.
- `app.js`
  - Core logic for:
    - Loading/saving sites and groups to `localStorage` (`sites`, `groups`, `sitesOrder`, preferences like `gridSize`).
    - Rendering grid via `refreshGrid()` with group separators, per-group empty cards, and global empty card.
    - Creating cards (`createCard()`), separators (`createGroupSeparator()`), and drag-and-drop integration (SortableJS) with group and card reordering.
    - Search (`initSearch()`), theme management (`setTheme()`), and dynamic background flora utilities.
    - Category jump menu generation.
    - Add/Edit site modal (`openModal()`), including optional custom icon preview and clear.
    - Storage settings UI: view/edit JSON snapshot, backup/restore/append, purge, clear icon cache.
  - Defaults:
    - Starter sites (when no stored data): Google Gemini, Google Search, YouTube, X.com, ANTICONTAINMENT SYSTEM, Pump.fun.
    - Groups default to a single group “Main Sites” containing starter sites, unless `groups` already exist.
  - Query parameter handler (extension integration):
    - On `DOMContentLoaded`, parses `?add=1&url=&title=&category=&newCategory=`.
    - Resolves/creates a target group, adds the site if missing, pushes it into the group, saves to `localStorage`, calls `refreshGrid()` (with `skipMetadata` fast path then full render), scrolls to the group, and then cleans the URL (removes query).


### Data Model (localStorage)
- `sites`: Array of `{ url, title, customIcon? }`.
- `groups`: Array of `{ id, name, sites: string[] }` where `sites` holds URLs.
- `sitesOrder` (optional): order reference if needed.
- Preferences like `gridSize`, theme, and icon cache entries.


### Key UI Behaviors
- **Drag-and-drop**: Cards can be moved within/between groups; groups can be reordered by dragging their separators. Reorders persist in `localStorage`.
- **Empty states**: Clear, card-sized CTA to guide users to add a site globally or within a category.
- **Search**: Filters visible cards and highlights matched content.
- **Responsive header (mobile mode)**: Right-side items appear above left controls, search below everything.
- **Themes**: Switch in settings; each theme adjusts colors, card accents, and in “Beautiful Day” shows dynamic flora/bushes behind the grid.


## Chrome Extension (MV3)

### Files
- `site-shelves-extension/manifest.json`
  - `permissions`: `storage`, `activeTab`, `scripting`, `contextMenus`, `tabs`.
  - `host_permissions`: `<all_urls>` (can be tightened to your domain).
  - `action.default_popup`: `popup.html` and `action.default_icon` for toolbar.
  - `background.service_worker`: `background.js`.
  - App/toolbar icons configured at `icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`.
- `site-shelves-extension/background.js`
  - Provides a default `APP_URL` (your hosted `index.html`) and context menu “Add to Site Shelves”.
  - Clicking the browser action opens the add flow.
- `site-shelves-extension/popup.html` + `popup.js`
  - On open:
    - Prefills Title and URL from the focused tab.
    - Ensures the Site Shelves page is open (background if needed) and reads categories by injecting a small script that returns `localStorage.groups`.
    - Populates a category select with existing groups and a "Create new category…" option.
  - On Save:
    - Navigates the existing Site Shelves tab to `?add=1&url=...&title=...&category=...&newCategory=...` so the app’s query handler performs the add and visibly updates the page.
    - If the tab isn’t open, creates one with the same query params.
- `site-shelves-extension/options.html` + `options.js`
  - Save and open your hosted Site Shelves URL (`APP_URL`) in `chrome.storage.sync`.
- `site-shelves-extension/icon-gen.html`
  - Utility to generate 16/32/48/128 PNG icons from any image with cover/contain and rounded corner options.
- `site-shelves-extension/icons/`
  - Place generated `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` here.


### Extension Flow
1. Click the toolbar icon.
2. Popup appears with current tab’s Title and URL prefilled.
3. Categories load from the currently open (or auto-opened) Site Shelves page.
4. Choose an existing category or select "Create new category…" and enter a name.
5. Click Save. The Site Shelves tab is brought to front and shows the new card appended in real time.


## Hosting and Setup

1. Deploy the app files (`index.html`, `style.css`, `app.js`, and any assets) to a static host (e.g., your domain). Example:
   - `https://anticontainmentsystem.com/SiteShelves/index.html`
2. In the extension, set the default URL in `background.js` or via Options page.
3. Load the extension:
   - Open `chrome://extensions` → Enable Developer Mode → "Load unpacked" → select `site-shelves-extension/`.
4. Generate and add icons using `icon-gen.html` to `site-shelves-extension/icons/`.


## Development Notes

- If you change the app significantly and the extension doesn’t see updates due to caching, add a cache-busting query to the app script in `index.html`, e.g. `app.js?v=YYYYMMDD`.
- The app’s add-from-query handler is tolerant:
  - Matches category by id, then by name (case-insensitive).
  - Creates a unique `group.id` when a new category name collides.
  - Adds the site if not present, then ensures it’s listed under the chosen group.
- `refreshGrid()` is called first with `{ skipMetadata: true }` for speed, then again fully, to fetch metadata like favicons/titles when available.
- SortableJS is used for both groups (by dragging separators) and cards. After group reorder, the grid is rebuilt to keep cards with their group separators.
- Empty states are rendered as `.card` elements to occupy exactly one grid cell.


## Privacy and Limits

- All data is stored locally in your browser’s `localStorage`. No data is sent to a server.
- LocalStorage is typically limited to around 5MB. You can back up or restore from the Settings modal.


## Troubleshooting

- **Extension fails to load**: Ensure icons exist at `site-shelves-extension/icons/` with the exact filenames referenced by `manifest.json`, or temporarily remove the `icons` and `action.default_icon` blocks to load without icons.
- **Card doesn’t appear after Save**: Confirm the hosted app includes the latest `app.js` with the add-from-query handler. Hard refresh the Site Shelves tab or add a cache-buster to the script tag.
- **Categories missing in popup**: The popup reads `localStorage.groups` from the Site Shelves tab. Make sure it’s open at the hosted URL. The popup will open it in the background if needed.


## License

Personal use. Update as needed.
