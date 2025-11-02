// Load and save data from localStorage
let sortableGrid;
let currentGridSize = 6;
let groups = [];

function loadSites() {
  try {
    const sites = localStorage.getItem('sites');
    const order = localStorage.getItem('sitesOrder');
    const savedGroups = localStorage.getItem('groups');
    
    let sitesList = sites ? JSON.parse(sites) : [
      { url: 'https://gemini.google.com/', title: 'Google Gemini' },
      { url: 'https://www.google.com/', title: 'Google Search' },
      { url: 'https://www.youtube.com/@ANTICONTAINMENTSYSTEM', title: 'YouTube' },
      { url: 'https://x.com/NinetentwoNTT', title: 'X.com' },
      { url: 'https://anticontainmentsystem.com/', title: 'ANTICONTAINMENT SYSTEM' },
      { url: 'https://pump.fun/coin/2pABQvq9Ga8Y2TAAxZWYE2ebRBFsnfFHwQgWZAdapump', title: 'Pump.fun' }
    ];

    groups = savedGroups ? JSON.parse(savedGroups) : [
      { id: 'default', name: 'Main Sites', sites: sitesList.map(site => site.url) }
    ];

    // If we have a saved order, use it to sort the sites
    if (order) {
      const orderArray = JSON.parse(order);
      const sitesMap = new Map(sitesList.map(site => [site.url, site]));
      sitesList = orderArray
        .map(url => sitesMap.get(url))
        .filter(site => site)
        .concat(sitesList.filter(site => !orderArray.includes(site.url)));
    }

    return sitesList;
  } catch (error) {
    console.error('Error loading sites:', error);
    return [
      { url: 'https://google.com', title: 'Google' },
      { url: 'https://github.com', title: 'GitHub' },
      { url: 'https://reddit.com', title: 'Reddit' },
      { url: 'https://youtube.com', title: 'YouTube' },
      { url: 'https://twitter.com', title: 'X' },
      { url: 'https://wikipedia.org', title: 'Wikipedia' }
    ];
  }

  // Icon input handlers
  if (iconInput && iconPreview) {
    iconInput.onchange = (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        pendingCustomIcon = e.target.result;
        iconPreview.src = pendingCustomIcon;
        iconPreview.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    };
  }
  if (clearIconBtn && iconPreview) {
    clearIconBtn.onclick = (ev) => {
      ev.preventDefault();
      pendingCustomIcon = '__clear__';
      iconPreview.src = '';
      iconPreview.style.display = 'none';
      if (iconInput) iconInput.value = '';
    };
  }
}

function saveSites(sites) {
  try {
    localStorage.setItem('sites', JSON.stringify(sites));
  } catch (error) {
    console.error('Error saving sites:', error);
  }
}

function saveOrder() {
  try {
    const cards = document.querySelectorAll('.card');
    const order = Array.from(cards).map(card => card.dataset.url);
    localStorage.setItem('sitesOrder', JSON.stringify(order));
  } catch (error) {
    console.error('Error saving order:', error);
  }
}

function saveGroups() {
  try {
    localStorage.setItem('groups', JSON.stringify(groups));
  } catch (error) {
    console.error('Error saving groups:', error);
  }
}

let sites = loadSites();

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (error) {
    console.error('Error getting favicon:', error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==';
  }
}

// Lightweight cache for resolved icon URLs by hostname
function loadIconCache() {
  try { return JSON.parse(localStorage.getItem('iconCache') || '{}'); } catch { return {}; }
}
function saveIconCache(cache) {
  try { localStorage.setItem('iconCache', JSON.stringify(cache)); } catch {}
}
function getCachedIcon(url) {
  try {
    const host = new URL(url).hostname;
    const cache = loadIconCache();
    return cache[host] || null;
  } catch { return null; }
}
function setCachedIcon(url, iconUrl) {
  try {
    const host = new URL(url).hostname;
    const cache = loadIconCache();
    cache[host] = iconUrl;
    saveIconCache(cache);
  } catch {}
}
function removeCachedIcon(url) {
  try {
    const host = new URL(url).hostname;
    const cache = loadIconCache();
    if (cache[host]) { delete cache[host]; saveIconCache(cache); }
  } catch {}
}

function getFaviconCandidates(url) {
  try {
    const u = new URL(url);
    const domain = u.hostname;
    const cached = getCachedIcon(url);
    const list = [];
    if (cached && isLikelyFaviconSrc(cached, url)) {
      list.push(cached);
    } else if (cached) {
      removeCachedIcon(url);
    }
    // 1) Local app-bundled icons (relative to index.html)
    //    Supported locations:
    //    - ./favicons/<domain>.{png,ico,svg}
    //    - ./<domain>.{png,ico,svg}
    list.push(
      `favicons/${domain}.png`,
      `favicons/${domain}.ico`,
      `favicons/${domain}.svg`,
      `${domain}.png`,
      `${domain}.ico`,
      `${domain}.svg`
    );
    // 2) Providers first to preserve well-known site icons
    list.push(
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://api.faviconkit.com/${domain}/128`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://icon.horse/icon/${domain}`,
      // 3) Then site-declared conventional favicon paths for lesser-known sites
      `${u.origin}/favicon.ico`,
      `${u.origin}/favicon-32x32.png`,
      `${u.origin}/favicon-16x16.png`,
      `${u.origin}/favicon.png`
    );
    // Deduplicate while preserving order
    const seen = new Set();
    return list.filter(src => {
      if (!src || seen.has(src)) return false;
      seen.add(src);
      return true;
    });

    // Clear icon cache
    if (clearIconCacheBtn) {
      clearIconCacheBtn.addEventListener('click', () => {
        try {
          localStorage.removeItem('iconCache');
        } catch {}
        refreshGrid({ skipMetadata: true });
        setTimeout(() => refreshGrid(), 0);
      });
    }
  } catch (error) {
    console.error('Error building favicon candidates:', error);
    return [ getFaviconUrl(url) ];
  }
}

// External lookup: FaviconGrabber API (returns multiple icon candidates)
async function fetchBestGrabberIcon(siteUrl) {
  try {
    const domain = new URL(siteUrl).hostname;
    const resp = await fetch(`https://favicongrabber.com/api/grab/${domain}`);
    if (!resp.ok) throw new Error(`grabber status ${resp.status}`);
    const json = await resp.json();
    const icons = Array.isArray(json.icons) ? json.icons : [];
    if (!icons.length) return null;
    // Prefer png, then ico; pick largest size when available
    const scored = icons.map(i => {
      let score = 0;
      const src = i.src || '';
      if (/\.png(\?|$)/i.test(src)) score += 3;
      if (/\.ico(\?|$)/i.test(src)) score += 2;
      if (typeof i.sizes === 'string') {
        const m = i.sizes.match(/(\d+)x(\d+)/);
        if (m) score += parseInt(m[1]) + parseInt(m[2]);
      }
      return { src, score };
    }).filter(x => x.src);
    if (!scored.length) return null;
    scored.sort((a,b) => b.score - a.score);
    return scored[0].src;
  } catch (e) {
    return null;
  }
}

function isLikelyFaviconSrc(src, siteUrl) {
  try {
    const srcUrl = new URL(src, window.location.href);
    const origin = new URL(siteUrl).origin;
    const siteDomain = new URL(siteUrl).hostname;
    const p = srcUrl.pathname || '';
    const isLocalFavicons = /\/favicons\//.test(p) && (p.endsWith(`/${siteDomain}.png`) || p.endsWith(`/${siteDomain}.ico`) || p.endsWith(`/${siteDomain}.svg`));
    const isLocalSameDir = p.endsWith(`/${siteDomain}.png`) || p.endsWith(`/${siteDomain}.ico`) || p.endsWith(`/${siteDomain}.svg`);
    return src.includes('www.google.com/s2/favicons')
      || src.includes('icons.duckduckgo.com/ip3')
      || src.includes('api.faviconkit.com')
      || src.includes('icon.horse/icon/')
      || srcUrl.href.startsWith(origin + '/favicon')
      || isLocalFavicons
      || isLocalSameDir;
  } catch { return false; }
}

// --- Hover Preview (mShots) ---
let previewOverlay = null;
let previewImg = null;
let previewShowTimer = null;
let previewHideTimer = null;
let previewLoadTimer = null;

function ensurePreviewOverlay() {
  if (previewOverlay) return previewOverlay;
  previewOverlay = document.createElement('div');
  previewOverlay.id = 'previewOverlay';
  const box = document.createElement('div');
  box.className = 'preview-box';
  previewImg = document.createElement('img');
  box.appendChild(previewImg);
  previewOverlay.appendChild(box);

  // Keep open while hovering overlay
  previewOverlay.addEventListener('mouseenter', () => {
    if (previewHideTimer) { clearTimeout(previewHideTimer); previewHideTimer = null; }
  });
  previewOverlay.addEventListener('mouseleave', () => {
    scheduleHidePreview(100);
  });

  document.body.appendChild(previewOverlay);
  return previewOverlay;
}

function getPreviewCandidates(siteUrl) {
  // Direct-image providers first, then dynamic fetch (Microlink screenshot)
  try {
    const enc = encodeURIComponent(siteUrl);
    return [
      { type: 'img', src: `https://s.wordpress.com/mshots/v1/${enc}?w=600` },
      { type: 'img', src: `https://s0.wp.com/mshots/v1/${enc}?w=600` },
      { type: 'img', src: `https://image.thum.io/get/width/600/crop/800/${siteUrl}` },
      { type: 'microlink' }
    ];
  } catch {
    return [];
  }
}

async function tryLoadMicrolinkScreenshot(siteUrl) {
  try {
    const resp = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(siteUrl)}&screenshot=true&meta=false&embed=screenshot.url&waitFor=1000`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const shot = data && data.data && data.data.screenshot && data.data.screenshot.url;
    return shot || null;
  } catch { return null; }
}

function loadPreviewWithFallback(siteUrl) {
  const candidates = getPreviewCandidates(siteUrl);
  let idx = 0;

  const next = async () => {
    if (previewLoadTimer) { clearTimeout(previewLoadTimer); previewLoadTimer = null; }
    if (idx >= candidates.length) return; // give up; keep whatever is there
    const c = candidates[idx++];
    if (c.type === 'img' && c.src) {
      // set timeout to move on if provider hangs (e.g., mShots generation)
      previewLoadTimer = setTimeout(() => {
        // only advance if still showing this src (hasn't switched)
        if (previewImg && previewImg.src === c.src) next();
      }, 2000);
      previewImg.onerror = () => next();
      previewImg.onload = () => {
        if (previewLoadTimer) { clearTimeout(previewLoadTimer); previewLoadTimer = null; }
      };
      previewImg.src = c.src;
    } else if (c.type === 'microlink') {
      try {
        const shot = await tryLoadMicrolinkScreenshot(siteUrl);
        if (shot) {
          previewImg.onerror = () => next();
          previewImg.onload = () => {};
          previewImg.src = shot;
        } else {
          next();
        }
      } catch { next(); }
    } else {
      next();
    }
  };

  next();
}

function positionPreviewNearRect(rect) {
  const margin = 12;
  const maxW = Math.min(600, Math.floor(window.innerWidth * 0.5));
  const maxH = Math.min(400, Math.floor(window.innerHeight * 0.5));
  const box = previewOverlay.querySelector('.preview-box');
  box.style.maxWidth = maxW + 'px';
  box.style.maxHeight = maxH + 'px';

  let left = rect.right + margin;
  let top = rect.top;
  // If overflowing right, place to the left
  const estimatedWidth = maxW;
  if (left + estimatedWidth > window.innerWidth - 10) {
    left = Math.max(10, rect.left - margin - estimatedWidth);
  }
  // Clamp vertically
  if (top + maxH > window.innerHeight - 10) {
    top = Math.max(10, window.innerHeight - maxH - 10);
  }
  previewOverlay.style.left = left + 'px';
  previewOverlay.style.top = top + 'px';
}

function showPreviewFor(element, siteUrl) {
  ensurePreviewOverlay();
  if (previewHideTimer) { clearTimeout(previewHideTimer); previewHideTimer = null; }
  const rect = element.getBoundingClientRect();
  positionPreviewNearRect(rect);
  loadPreviewWithFallback(siteUrl);
  previewOverlay.style.display = 'block';
}

function scheduleShowPreview(element, siteUrl, delay = 150) {
  if (previewShowTimer) clearTimeout(previewShowTimer);
  previewShowTimer = setTimeout(() => showPreviewFor(element, siteUrl), delay);
}

function scheduleHidePreview(delay = 150) {
  if (previewShowTimer) { clearTimeout(previewShowTimer); previewShowTimer = null; }
  if (previewHideTimer) clearTimeout(previewHideTimer);
  previewHideTimer = setTimeout(() => {
    if (previewLoadTimer) { clearTimeout(previewLoadTimer); previewLoadTimer = null; }
    if (previewOverlay) previewOverlay.style.display = 'none';
  }, delay);
}

// removed getNextFavicon; handled in createCard

async function fetchSiteMetadata(url) {
  if (!url) {
    throw new Error('URL is required');
  }

  try {
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Prefer a site logo over a page image when available
    const logo = data?.data?.logo?.url;
    const image = logo || data?.data?.image?.url || null;
    return {
      title: data?.data?.title || new URL(url).hostname,
      description: data?.data?.description || '',
      image: image || getFaviconUrl(url)
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    // Return fallback data
    try {
      return {
        title: new URL(url).hostname,
        description: '',
        image: getFaviconUrl(url)
      };
    } catch (e) {
      return {
        title: url,
        description: '',
        image: getFaviconUrl('https://example.com') // Fallback icon
      };
    }
  }
}

function createCard(data) {
  if (!data) {
    console.error('No data provided for card creation');
    return null;
  }

  try {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.url = data.url;
    card.dataset.groupId = data.groupId;
    
    const domain = data.url ? new URL(data.url).hostname : 'Unknown';
    
    card.innerHTML = `
      <div class="card-actions">
        <button class="action-button edit" aria-label="Edit site">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
          </svg>
        </button>
        <button class="action-button delete" aria-label="Delete site">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <a href="${data.url}" target="_blank" rel="noopener noreferrer" class="card-link">
        <img src="${data.customIcon ? data.customIcon : ''}" 
             class="card-icon" 
             alt="Site icon"
             data-attempt="1">
        <h3 class="card-title">${data.title || data.url}</h3>
        <div class="card-url">${domain}</div>
      </a>
    `;

    // Add event listeners for edit and delete
    const editBtn = card.querySelector('.edit');
    const deleteBtn = card.querySelector('.delete');

    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(data);
    });

    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this site?')) {
        sites = sites.filter(site => site.url !== data.url);
        saveSites(sites);
        refreshGrid();
      }
    });
    
    // Make card draggable but don't interfere with link clicks
    card.addEventListener('mousedown', (e) => {
      if (e.target.closest('.card-actions')) {
        e.stopPropagation();
      }
    });

    card.addEventListener('dragstart', (e) => {
      if (e.target.closest('.card-link')) {
        e.preventDefault();
      }
    });
    
    // Icon handling: prefer customIcon if provided; else try candidates
    const img = card.querySelector('.card-icon');
    if (img) {
      if (data.customIcon) {
        // No fallback when user provided a custom icon
      } else {
        const candidates = getFaviconCandidates(data.url);
        let attempt = 0;
        const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==';
        const isLikelyFavicon = (src) => {
          try {
            const srcUrl = new URL(src, window.location.href);
            const origin = new URL(data.url).origin;
            return src.includes('www.google.com/s2/favicons')
              || src.includes('icons.duckduckgo.com/ip3')
              || srcUrl.href.startsWith(origin + '/favicon');
          } catch { return false; }
        };
        const tryNext = () => {
          if (attempt < candidates.length) {
            img.src = candidates[attempt++];
          } else {
            img.src = placeholder;
          }
        };
        img.onerror = tryNext;
        img.onload = () => {
          if (img.src && img.src !== placeholder && isLikelyFavicon(img.src, data.url)) {
            setCachedIcon(data.url, img.src);
          }
        };
        tryNext();
        // Attempt async upgrade via FaviconGrabber
        (async () => {
          try {
            const grab = await fetchBestGrabberIcon(data.url);
            if (grab && grab !== img.src && isLikelyFavicon(grab, data.url)) {
              img.src = grab;
              setCachedIcon(data.url, grab);
            }
          } catch {}
        })();
      }

      // Hover preview events on favicon
      img.addEventListener('mouseenter', () => scheduleShowPreview(img, data.url, 200));
      img.addEventListener('mouseleave', () => scheduleHidePreview(150));
    }

    return card;
  } catch (error) {
    console.error('Error creating card:', error);
    return null;
  }
}

function createGroupSeparator(group) {
  const separator = document.createElement('div');
  separator.className = 'group-separator';
  separator.dataset.groupId = group.id;
  separator.id = `group-${group.id}`;
  
  separator.innerHTML = `
    <input type="text" class="group-title" value="${group.name}" />
    <div class="group-actions">
      <button class="group-add-button add-site" title="Add site to group">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
        </svg>
      </button>
      <button class="group-add-button delete-group" title="Delete group">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  `;

  // Add event listeners
  const titleInput = separator.querySelector('.group-title');
  titleInput.addEventListener('change', (e) => {
    group.name = e.target.value;
    saveGroups();
    try { updateCategoryJump(); } catch (e) {}
  });

  const addButton = separator.querySelector('.add-site');
  addButton.addEventListener('click', () => {
    openModal(null, group.id);
  });

  const deleteButton = separator.querySelector('.delete-group');
  deleteButton.addEventListener('click', () => {
    if (confirm('Delete this group and all its sites?')) {
      sites = sites.filter(site => !group.sites.includes(site.url));
      groups = groups.filter(g => g.id !== group.id);
      saveSites(sites);
      saveGroups();
      refreshGrid();
    }
  });

  return separator;
}

// Update the category jump dropdown to reflect current groups in DOM order
function updateCategoryJump() {
  try {
    const select = document.getElementById('categoryJump');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Jump to category';
    select.appendChild(placeholder);
    const separators = document.querySelectorAll('.group-separator');
    separators.forEach(sep => {
      const id = sep.dataset.groupId;
      const nameInput = sep.querySelector('.group-title');
      const name = nameInput ? nameInput.value : (id || 'Group');
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = name;
      select.appendChild(opt);
    });
    if (current && Array.from(select.options).some(o => o.value === current)) {
      select.value = current;
    } else {
      select.value = '';
    }
  } catch (err) {
    console.error('Error updating category jump:', err);
  }
}

// Smoothly scroll the scrollable container to a specific group separator
function scrollToGroup(groupId) {
  try {
    const container = document.querySelector('.scrollable-container');
    if (!container) return;
    let target = document.getElementById(`group-${groupId}`);
    if (!target) {
      target = document.querySelector(`.group-separator[data-group-id="${groupId}"]`);
      if (target && !target.id) target.id = `group-${groupId}`;
    }
    if (!target) return;
    let y = 0;
    let node = target;
    while (node && node !== container) {
      y += node.offsetTop;
      node = node.offsetParent;
    }
    container.scrollTo({ top: Math.max(y - 20, 0), behavior: 'smooth' });
  } catch (err) {
    console.error('Error scrolling to group:', err);
  }
}

async function refreshGrid(options = {}) {
  const { skipMetadata = false } = options;
  const grid = document.getElementById('cardGrid');
  if (!grid) return;

  grid.innerHTML = '';
  updateGridSize(currentGridSize);
  
  try {
    // First, show sites that are in groups
    for (const group of groups) {
      grid.appendChild(createGroupSeparator(group));
      let groupAddedAny = false;
      
      for (const siteUrl of group.sites) {
        const site = sites.find(s => s.url === siteUrl);
        if (!site) continue;
        
        if (skipMetadata) {
          const card = createCard({
            url: site.url,
            title: site.title,
            customIcon: site.customIcon,
            image: getFaviconUrl(site.url),
            groupId: group.id
          });
          if (card) { grid.appendChild(card); groupAddedAny = true; }
        } else {
          try {
            const metadata = await fetchSiteMetadata(site.url);
            const card = createCard({
              url: site.url,
              title: site.title || metadata?.title,
              image: metadata?.image,
              customIcon: site.customIcon,
              groupId: group.id
            });
            if (card) { grid.appendChild(card); groupAddedAny = true; }
          } catch (error) {
            console.error(`Error processing item ${site.url}:`, error);
            const card = createCard({
              url: site.url,
              title: site.title,
              customIcon: site.customIcon,
              image: getFaviconUrl(site.url),
              groupId: group.id
            });
            if (card) { grid.appendChild(card); groupAddedAny = true; }
          }
        }
      }

      // Per-category empty state: render a normal card-size CTA within this group
      if (!groupAddedAny) {
        const emptyCat = document.createElement('div');
        emptyCat.className = 'card empty-card category-empty';
        emptyCat.innerHTML = `
          <a href="#" class="card-link" onclick="return false;">
            <div class="empty-illustration" aria-hidden="true">➕</div>
            <h3 class="card-title">No sites in ${group.name || 'this category'}</h3>
            <div class="card-url">Add a site to populate this category</div>
            <button type="button" class="btn-primary add-in-category">Add Site</button>
          </a>
        `;
        grid.appendChild(emptyCat);
        const btn = emptyCat.querySelector('.add-in-category');
        if (btn) btn.addEventListener('click', () => openModal(null, group.id));
      }
    }

    // Initialize Sortable
    if (sortableGrid) {
      sortableGrid.destroy();
    }
    
    sortableGrid = new Sortable(grid, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      handle: '.card, .group-separator',
      onEnd: function(evt) {
        try {
          const movedEl = evt.item;
          if (movedEl && movedEl.classList.contains('group-separator')) {
            // Reorder groups by separator order, preserve their site lists
            const separators = Array.from(grid.querySelectorAll('.group-separator'));
            const idOrder = separators.map(sep => sep.dataset.groupId);
            const currentById = new Map(groups.map(g => [g.id, g]));
            const reordered = [];
            idOrder.forEach(id => {
              if (currentById.has(id)) {
                reordered.push(currentById.get(id));
                currentById.delete(id);
              }
            });
            // Append any groups not present in DOM (safety)
            currentById.forEach(g => reordered.push(g));
            groups = reordered;
            saveGroups();
            // Rebuild grid so cards move with their separator block
            refreshGrid({ skipMetadata: true });
            setTimeout(() => refreshGrid(), 0);
          } else {
            // A card was moved; derive group->sites from DOM order
            updateGroupsOrder();
          }
        } catch (e) {
          console.error('Error handling drag end:', e);
          // Fallback to deriving from DOM
          updateGroupsOrder();
        }
      }
    });
    // Update the category jump after grid is built
    updateCategoryJump();

    // Empty state: show friendly call-to-action when there are no cards (render as a normal card)
    if (!grid.querySelector('.card')) {
      const empty = document.createElement('div');
      empty.className = 'card empty-card';
      empty.innerHTML = `
        <a href="#" class="card-link" onclick="return false;">
          <div class="empty-illustration" aria-hidden="true">🌼</div>
          <h3 class="card-title">No sites yet</h3>
          <div class="card-url">Add your first site to get started</div>
          <button type="button" class="btn-primary" id="emptyAddSiteBtn">Add Site</button>
        </a>
      `;
      grid.appendChild(empty);
      const btn = empty.querySelector('#emptyAddSiteBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          const firstGroupId = (groups && groups[0] && groups[0].id) || null;
          openModal(null, firstGroupId);
        });
      }
    }
  } catch (error) {
    console.error('Error refreshing grid:', error);
  }
}

function updateGroupsOrder() {
  const grid = document.getElementById('cardGrid');
  const elements = Array.from(grid.children);
  
  let currentGroup = null;
  const newGroups = [];
  
  elements.forEach(element => {
    if (element.classList.contains('group-separator')) {
      const groupId = element.dataset.groupId;
      currentGroup = {
        id: groupId,
        name: element.querySelector('.group-title').value,
        sites: []
      };
      newGroups.push(currentGroup);
    } else if (element.classList.contains('card') && currentGroup) {
      currentGroup.sites.push(element.dataset.url);
    }
  });
  
  groups = newGroups;
  saveGroups();
  saveOrder();
  try { updateCategoryJump(); } catch (e) {}
}

function updateGridSize(size) {
  const grid = document.getElementById('cardGrid');
  // Remove any existing grid-* classes
  grid.className = grid.className.replace(/\bgrid-\d+\b/g, '');
  // Add new grid class
  grid.classList.add(`grid-${size}`);
  // Save preference
  localStorage.setItem('gridSize', size);
  currentGridSize = size;
}

// Modal handling
const modal = document.getElementById('siteModal');
const form = document.getElementById('siteForm');
const addButton = document.getElementById('addSiteBtn');
const cancelButton = document.getElementById('cancelBtn');
let editingUrl = null;
let editingOriginalGroupId = null;
let pendingCustomIcon = null; // data URL or null; '__clear__' to remove

function populateCategorySelect(selectedGroupId = null) {
  const select = document.getElementById('siteCategorySelect');
  const newCatContainer = document.getElementById('newCategoryContainer');
  if (!select) return;
  select.innerHTML = '';
  // build options from current groups in DOM order
  const separators = document.querySelectorAll('.group-separator');
  const added = new Set();
  separators.forEach(sep => {
    const gid = sep.dataset.groupId;
    const titleInput = sep.querySelector('.group-title');
    const name = titleInput ? titleInput.value : gid;
    if (!added.has(gid)) {
      const opt = document.createElement('option');
      opt.value = gid;
      opt.textContent = name;
      select.appendChild(opt);
      added.add(gid);
    }
  });
  // Fallback to groups array if none in DOM yet
  if (select.options.length === 0) {
    groups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      select.appendChild(opt);
    });
  }
  // New category option
  const newOpt = document.createElement('option');
  newOpt.value = '__new__';
  newOpt.textContent = 'Create new category…';
  select.appendChild(newOpt);
  // Set selection
  if (selectedGroupId && Array.from(select.options).some(o => o.value === selectedGroupId)) {
    select.value = selectedGroupId;
  } else if (select.options.length > 0) {
    select.selectedIndex = 0;
  }
  if (newCatContainer) newCatContainer.style.display = 'none';
}

function openModal(data = null, groupId = null) {
  const urlInput = document.getElementById('siteUrl');
  const titleInput = document.getElementById('siteTitle');
  const modalTitle = document.querySelector('#modalTitle');
  const categorySelect = document.getElementById('siteCategorySelect');
  const newCatContainer = document.getElementById('newCategoryContainer');
  const confirmNewCategoryBtn = document.getElementById('confirmNewCategoryBtn');
  const cancelNewCategoryBtn = document.getElementById('cancelNewCategoryBtn');
  const newCategoryNameInput = document.getElementById('newCategoryName');
  const iconInput = document.getElementById('siteIconFile');
  const iconPreview = document.getElementById('siteIconPreview');
  const clearIconBtn = document.getElementById('clearSiteIconBtn');
  
  if (data) {
    modalTitle.textContent = 'Edit Site';
    urlInput.value = data.url;
    titleInput.value = data.title;
    editingUrl = data.url;
    editingOriginalGroupId = data.groupId || null;
    populateCategorySelect(editingOriginalGroupId);
    // Load existing custom icon preview
    pendingCustomIcon = null;
    if (iconPreview) {
      if (data.customIcon) {
        iconPreview.src = data.customIcon;
        iconPreview.style.display = 'inline-block';
      } else {
        iconPreview.src = '';
        iconPreview.style.display = 'none';
      }
    }
  } else {
    modalTitle.textContent = 'Add Site';
    urlInput.value = '';
    titleInput.value = '';
    editingUrl = null;
    editingOriginalGroupId = null;
    populateCategorySelect(groupId || (groups[0] && groups[0].id));
    pendingCustomIcon = null;
    if (iconPreview) {
      iconPreview.src = '';
      iconPreview.style.display = 'none';
    }
  }

  form.dataset.groupId = groupId;
  modal.classList.add('active');
  urlInput.focus();
  // wire select change to toggle new category field
  if (categorySelect && newCatContainer) {
    // store previous selection to restore on cancel
    categorySelect.dataset.prev = categorySelect.value || '';
    categorySelect.onchange = () => {
      if (categorySelect.value === '__new__') {
        newCatContainer.style.display = 'flex';
        document.getElementById('newCategoryName').focus();
      } else {
        newCatContainer.style.display = 'none';
      }
    };
  }

  // Confirm new category: keep UI open but ensure name is set; do not submit form yet
  if (confirmNewCategoryBtn) {
    confirmNewCategoryBtn.onclick = (ev) => {
      ev.preventDefault();
      if (newCategoryNameInput && newCategoryNameInput.value.trim() === '') {
        // subtle inline cue instead of alert
        newCategoryNameInput.style.borderColor = 'var(--danger-color)';
        newCategoryNameInput.focus();
        return;
      }
      if (newCategoryNameInput) {
        newCategoryNameInput.style.borderColor = '';
      }
      // Nothing else to do; form submit will create the group
    };
  }

  // Cancel new category: hide UI and restore previous selection
  if (cancelNewCategoryBtn && categorySelect) {
    cancelNewCategoryBtn.onclick = (ev) => {
      ev.preventDefault();
      newCatContainer.style.display = 'none';
      const prev = categorySelect.dataset.prev || '';
      const fallback = (categorySelect.options[0] && categorySelect.options[0].value) || '';
      categorySelect.value = prev && Array.from(categorySelect.options).some(o => o.value === prev) ? prev : fallback;
    };
  }
}

function closeModal() {
  modal.classList.remove('active');
  form.reset();
  editingUrl = null;
}

addButton.addEventListener('click', () => openModal());
cancelButton.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const url = document.getElementById('siteUrl').value;
  const title = document.getElementById('siteTitle').value;
  const categorySelect = document.getElementById('siteCategorySelect');
  const selectedValue = categorySelect ? categorySelect.value : null;
  const newCategoryNameInput = document.getElementById('newCategoryName');
  let targetGroupId = form.dataset.groupId || null;
  // Determine target group
  if (selectedValue === '__new__') {
    const name = (newCategoryNameInput && newCategoryNameInput.value.trim()) || 'New Group';
    const newGroup = {
      id: 'group_' + Date.now(),
      name,
      sites: []
    };
    groups.push(newGroup);
    targetGroupId = newGroup.id;
  } else if (selectedValue) {
    targetGroupId = selectedValue;
  }

  if (editingUrl) {
    // Update existing site
    sites = sites.map(site => {
      if (site.url === editingUrl) {
        const next = { url, title, customIcon: site.customIcon };
        if (pendingCustomIcon === '__clear__') {
          delete next.customIcon;
        } else if (typeof pendingCustomIcon === 'string') {
          next.customIcon = pendingCustomIcon;
        }
        return next;
      }
      return site;
    });
    // Move between groups if changed or URL changed
    const fromGroupId = editingOriginalGroupId;
    const toGroupId = targetGroupId || fromGroupId;
    if (fromGroupId && toGroupId) {
      if (fromGroupId !== toGroupId || editingUrl !== url) {
        const fromGroup = groups.find(g => g.id === fromGroupId);
        const toGroup = groups.find(g => g.id === toGroupId) || groups[0];
        if (fromGroup) {
          fromGroup.sites = fromGroup.sites.filter(s => s !== editingUrl);
        }
        if (toGroup) {
          // append as last card
          if (!toGroup.sites.includes(url)) toGroup.sites.push(url);
        }
      } else {
        // same group, but url may change: update in-place
        const grp = groups.find(g => g.id === fromGroupId);
        if (grp) {
          grp.sites = grp.sites.map(s => (s === editingUrl ? url : s));
        }
      }
    }
  } else {
    // Add new site
    const newSite = { url, title };
    if (typeof pendingCustomIcon === 'string') newSite.customIcon = pendingCustomIcon;
    sites.push(newSite);
    
    // Add to selected/new group as last
    const group = groups.find(g => g.id === targetGroupId) || groups[0];
    if (group) group.sites.push(url);
  }

  saveSites(sites);
  saveGroups();
  closeModal();
  refreshGrid({ skipMetadata: true });
  setTimeout(() => refreshGrid(), 0);
});

function initSearch() {
  const searchInput = document.querySelector('.search-input');
  const clearButton = document.getElementById('clearSearch');
  
  if (!searchInput || !clearButton) {
    console.error('Search elements not found');
    return;
  }

  searchInput.addEventListener('input', (e) => {
    try {
      const searchTerm = (e.target.value || '').toLowerCase();
      const cards = document.querySelectorAll('.card');
      const groups = document.querySelectorAll('.group-separator');
      
      // Track which groups have visible cards
      const groupVisibility = new Map();
      
      cards.forEach(card => {
        const text = (card.innerText || '').toLowerCase();
        const isVisible = text.includes(searchTerm);
        card.style.display = isVisible ? 'block' : 'none';
        
        // Track group visibility
        const groupId = card.dataset.groupId;
        if (isVisible) {
          groupVisibility.set(groupId, true);
        }
      });
      
      // Show/hide groups based on whether they have visible cards
      groups.forEach(group => {
        const groupId = group.dataset.groupId;
        group.style.display = groupVisibility.get(groupId) ? 'flex' : 'none';
      });
      
      // Show/hide clear button based on search input
      clearButton.style.display = searchInput.value ? 'flex' : 'none';
    } catch (error) {
      console.error('Error during search:', error);
    }
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    clearButton.style.display = 'none';
  });
  
  // Initialize clear button visibility
  clearButton.style.display = 'none';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStorageInfo() {
  try {
    const sitesJson = localStorage.getItem('sites');
    const orderJson = localStorage.getItem('sitesOrder');
    const storageUsed = new Blob([sitesJson, orderJson]).size;
    const storageLimit = 5 * 1024 * 1024; // 5MB typical localStorage limit
    
    return {
      used: formatBytes(storageUsed),
      total: formatBytes(storageLimit),
      percentage: ((storageUsed / storageLimit) * 100).toFixed(1),
      currentData: `Sites: ${sitesJson}\nOrder: ${orderJson}`
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      used: '0 Bytes',
      total: '5 MB',
      percentage: 0,
      currentData: '[]'
    };
  }
}

function openSettingsModal() {
  const storageInfo = getStorageInfo();
  const settingsModal = document.getElementById('settingsModal');
  const storageDetails = document.getElementById('storageDetails');
  const storageSize = document.getElementById('storageSize');
  
  // Format the data for better readability
  const formattedData = JSON.stringify({
    sites: sites,
    groups: groups
  }, null, 2);
  
  storageDetails.value = formattedData;
  storageSize.innerHTML = `
    <span>Storage Used: ${storageInfo.used}</span>
    <span>Available: ${storageInfo.total}</span>
  `;
  
  settingsModal.classList.add('active');
}

// Theme handling
let currentTheme = localStorage.getItem('theme') || 'default';

function setTheme(theme) {
  // Remove previous theme
  document.body.classList.remove('default-theme', 'bright-theme', 'comic-theme', 'cyber-theme', 'bronze-theme', 'beautiful-theme');
  // Add new theme
  document.body.classList.add(`${theme}-theme`);
  document.body.setAttribute('data-theme', theme);
  // Save preference
  localStorage.setItem('theme', theme);
  currentTheme = theme;
  
  // Update active state in theme cards
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === theme);
  });

  // Toggle bronze background DOM effects
  if (theme === 'bronze') {
    ensureBronzeBackground();
  } else {
    removeBronzeBackground();
  }
  // Toggle beautiful day background DOM effects
  if (theme === 'beautiful') {
    ensureBeautifulBackground();
    ensureBeautifulFlora();
  } else {
    removeBeautifulBackground();
    removeBeautifulFlora();
  }
}

// Bronze background DOM effects
function ensureBronzeBackground() {
  try {
    if (document.getElementById('bronzeBackground')) return;
    const root = document.createElement('div');
    root.id = 'bronzeBackground';
    const container = document.createElement('div');
    container.className = 'brass-lines-container';
    // Generate a few moving rectangles (balanced for perf)
    const lines = [];
    // Horizontal bars
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'brass-line horizontal';
      el.style.setProperty('--length', `${40 + i * 20}vw`);
      el.style.setProperty('--position', `${20 + i * 25}%`);
      el.style.setProperty('--duration', `${20 + i * 6}s`);
      el.style.setProperty('--delay', `${i * 2}s`);
      lines.push(el);
    }
    // Vertical bars
    for (let i = 0; i < 2; i++) {
      const el = document.createElement('div');
      el.className = 'brass-line vertical';
      el.style.setProperty('--length', `${40 + i * 25}vh`);
      el.style.setProperty('--position', `${30 + i * 35}%`);
      el.style.setProperty('--duration', `${26 + i * 7}s`);
      el.style.setProperty('--delay', `${1 + i * 2.5}s`);
      lines.push(el);
    }
    lines.forEach(el => container.appendChild(el));
    root.appendChild(container);
    document.body.appendChild(root);
  } catch (e) {
    console.error('Error creating bronze background:', e);
  }
}

function removeBronzeBackground() {
  try {
    const el = document.getElementById('bronzeBackground');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  } catch (e) {
    console.error('Error removing bronze background:', e);
  }
}

// Beautiful Day background DOM effects (clouds + pollen)
function ensureBeautifulBackground() {
  try {
    if (document.getElementById('beautifulBackground')) return;
    const root = document.createElement('div');
    root.id = 'beautifulBackground';

    // Clouds
    const cloudSpecs = [
      { top: '12%', w: 260, h: 120, dur: 70, delay: 0 },
      { top: '28%', w: 220, h: 100, dur: 60, delay: 5 },
      { top: '44%', w: 300, h: 140, dur: 80, delay: 9 },
      { top: '62%', w: 200, h: 90, dur: 55, delay: 3 }
    ];
    cloudSpecs.forEach((c) => {
      const el = document.createElement('div');
      el.className = 'cloud';
      el.style.setProperty('--top', c.top);
      el.style.setProperty('--w', `${c.w}px`);
      el.style.setProperty('--h', `${c.h}px`);
      el.style.setProperty('--dur', `${c.dur}s`);
      el.style.setProperty('--delay', `${c.delay}s`);
      root.appendChild(el);
    });

    // Canvas-based floating motes (pollen alternative)
    const canvas = document.createElement('canvas');
    canvas.id = 'beautifulPollenCanvas';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    // Ensure visibility on light backgrounds; try 'normal' first for stronger contrast
    canvas.style.mixBlendMode = 'normal';
    canvas.style.zIndex = '0';
    root.appendChild(canvas); // append after clouds? place on top for visibility

    const dpr = () => Math.max(window.devicePixelRatio || 1, 1);
    const ctx = canvas.getContext('2d');
    let particles = [];
    let frameId = null;
    let last = performance.now();

    function resize() {
      const ratio = dpr();
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Seed particles proportional to area (denser for better visibility)
      const target = Math.min(100, Math.floor((w * h) / 8000));
      particles = new Array(target).fill(0).map(() => spawn(w, h));
    }

    function spawn(w, h) {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 120,
        r: 3 + Math.random() * 4.5, // bigger motes
        vx: (Math.random() * 0.6 - 0.3),
        vy: -(8 + Math.random() * 10), // slower upward for persistence
        sway: (Math.random() * 0.8 + 0.3),
        hue: 48 + Math.random() * 12, // warm yellow range
        alpha: 0.9 + Math.random() * 0.1
      };
    }

    function step(ts) {
      // Use viewport dimensions to avoid scrollbar-width artifacts
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      ctx.clearRect(0, 0, w, h);
      for (let p of particles) {
        // Horizontal wind + sway
        let wind = 0;
        // Nudge left near right edge to prevent clustering by scrollbar
        if (p.x > w * 0.9) wind -= 30 * dt;
        if (p.x < w * 0.1) wind += 15 * dt;
        p.x += p.vx + wind + Math.sin(ts * 0.001 + p.r) * p.sway * dt * 30;
        p.y += p.vy * dt;
        // Wrap horizontally rather than hard-respawn to avoid edge sticking
        if (p.x < -40) p.x = w + 40;
        if (p.x > w + 40) p.x = -40;
        // Respawn from bottom when fully off the top
        if (p.y < -30) {
          const np = spawn(w, h);
          p.x = np.x; p.y = np.y; p.r = np.r; p.vx = np.vx; p.vy = np.vy; p.sway = np.sway; p.hue = np.hue; p.alpha = np.alpha;
        }
        // draw bright core with soft halo
        const coreR = p.r * 0.9;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,247,194,${p.alpha})`;
        ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2);
        ctx.fill();
        const grad = ctx.createRadialGradient(p.x, p.y, coreR, p.x, p.y, p.r * 3.2);
        grad.addColorStop(0, `rgba(255,247,194,${p.alpha * 0.9})`);
        grad.addColorStop(0.5, `rgba(255,247,194,${p.alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(255,247,194,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      frameId = requestAnimationFrame(step);
    }

    const onResize = () => { resize(); };
    window.addEventListener('resize', onResize);
    resize();
    frameId = requestAnimationFrame(step);

    // Keep references for cleanup
    root.dataset.animAttached = 'true';
    root._pollenRAF = frameId;
    root._pollenOnResize = onResize;
    root._pollenCanvas = canvas;

    document.body.appendChild(root);
  } catch (e) {
    console.error('Error creating beautiful background:', e);
  }
}

function removeBeautifulBackground() {
  try {
    const el = document.getElementById('beautifulBackground');
    if (el) {
      if (el._pollenRAF) cancelAnimationFrame(el._pollenRAF);
      if (el._pollenOnResize) window.removeEventListener('resize', el._pollenOnResize);
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  } catch (e) {
    console.error('Error removing beautiful background:', e);
  }
}

// Beautiful Day flora (plants + big flowers at bottom, behind cards)
function ensureBeautifulFlora() {
  try {
    if (document.getElementById('beautifulFlora')) return;
    const flora = document.createElement('div');
    flora.id = 'beautifulFlora';

    // Layered background bands to blend with page bottom
    const back = document.createElement('div'); back.className = 'flora-layer layer-back';
    const mid = document.createElement('div');  mid.className = 'flora-layer layer-mid';
    const front = document.createElement('div');front.className = 'flora-layer layer-front';
    flora.appendChild(back); flora.appendChild(mid); flora.appendChild(front);

    // Helper to create organic SVG bush (non-oval) with jagged canopy
    const SVG_NS = 'http://www.w3.org/2000/svg';
    function makeSvgBush(w, h, options) {
      const { fill = '#2f7f4f', stroke = '#1f5d3a', strokeWidth = 2 } = options || {};
      const wrap = document.createElement('div');
      wrap.className = 'svg-bush';
      wrap.style.position = 'absolute';
      wrap.style.bottom = '0';
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // Generate jagged top via multiple bezier segments
      const segments = 6 + Math.floor(Math.random() * 5);
      const step = w / segments;
      let d = `M 0 ${h} L 0 ${h * 0.55}`;
      let x = 0;
      for (let i = 0; i < segments; i++) {
        const nx = Math.min(w, x + step);
        const peak = h * (0.18 + Math.random() * 0.22);
        const mid = h * (0.28 + Math.random() * 0.25);
        d += ` C ${x + step * 0.3} ${mid}, ${x + step * 0.6} ${peak}, ${nx} ${mid}`;
        x = nx;
      }
      d += ` L ${w} ${h} Z`;
      const canopy = document.createElementNS(SVG_NS, 'path');
      canopy.setAttribute('d', d);
      canopy.setAttribute('fill', fill);
      canopy.setAttribute('stroke', stroke);
      canopy.setAttribute('stroke-width', strokeWidth);
      canopy.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(canopy);
      // Add leaf clusters near top edge
      const leaves = 14 + Math.floor(Math.random() * 10);
      for (let i = 0; i < leaves; i++) {
        const lx = Math.floor(Math.random() * w);
        const ly = Math.floor(h * (0.22 + Math.random() * 0.2));
        const rw = 8 + Math.floor(Math.random() * 10);
        const rh = rw * (0.6 + Math.random() * 0.6);
        const leaf = document.createElementNS(SVG_NS, 'ellipse');
        leaf.setAttribute('cx', lx);
        leaf.setAttribute('cy', ly);
        leaf.setAttribute('rx', rw);
        leaf.setAttribute('ry', rh);
        leaf.setAttribute('fill', Math.random() < 0.5 ? fill : '#3aa364');
        leaf.setAttribute('stroke', stroke);
        leaf.setAttribute('stroke-width', 1);
        leaf.setAttribute('opacity', '1');
        svg.appendChild(leaf);
      }
      wrap.appendChild(svg);
      return wrap;
    }

    // Add SVG bushes (non-oval, opaque) tiled to fully cover width with overlap
    function tileBushes(container, config) {
      const { fill, stroke, wMin, wMax, hMin, hMax, stepFactor } = config;
      const vw = window.innerWidth;
      let x = -Math.floor(wMax * 0.3); // start slightly offscreen to the left
      while (x < vw + Math.floor(wMax * 0.3)) {
        const W = wMin + Math.floor(Math.random() * (wMax - wMin + 1));
        const H = hMin + Math.floor(Math.random() * (hMax - hMin + 1));
        const bush = makeSvgBush(W, H, { fill, stroke, strokeWidth: 2 });
        bush.style.left = `${x}px`;
        container.appendChild(bush);
        // advance with overlap to avoid gaps
        const step = Math.floor(W * (stepFactor || 0.65));
        x += Math.max(40, step);
      }
    }
    tileBushes(back, { fill: '#2f7f4f', stroke: '#1f5d3a', wMin: 220, wMax: 360, hMin: 120, hMax: 200, stepFactor: 0.62 });
    tileBushes(mid,  { fill: '#2e7d4f', stroke: '#20623e', wMin: 260, wMax: 420, hMin: 150, hMax: 240, stepFactor: 0.6 });

    // Generate plants across the width with random heights/flowers
    const width = window.innerWidth;
    const count = Math.max(12, Math.floor(width / 120));
    for (let i = 0; i < count; i++) {
      const plant = document.createElement('div');
      plant.className = 'plant';
      const x = Math.round((i + Math.random() * 0.6) / count * 100);
      const stemH = 16 + Math.random() * 18; // vh
      const swayDur = 6 + Math.random() * 5; // s
      plant.style.left = `${x}vw`;
      plant.style.setProperty('--stemH', `${stemH}vh`);
      plant.style.setProperty('--swayDur', `${swayDur}s`);

      const stem = document.createElement('div'); stem.className = 'stem';
      plant.appendChild(stem);

      // Base leaves + additional leaves for fullness
      const baseLeaves = [
        { cls: 'leaf left' , pos: 0.35 },
        { cls: 'leaf right', pos: 0.55 }
      ];
      baseLeaves.forEach(l => {
        const leaf = document.createElement('div');
        leaf.className = l.cls;
        leaf.style.top = `calc(var(--stemH) * ${l.pos})`;
        if (Math.random() < 0.4) leaf.classList.add('small');
        plant.appendChild(leaf);
      });
      const extraLeaves = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < extraLeaves; k++) {
        const leaf = document.createElement('div');
        const side = Math.random() < 0.5 ? 'left' : 'right';
        leaf.className = `leaf ${side}`;
        const pos = 0.15 + Math.random() * 0.7; // along stem
        leaf.style.top = `calc(var(--stemH) * ${pos})`;
        if (Math.random() < 0.6) leaf.classList.add('small');
        plant.appendChild(leaf);
      }

      // All plants have flowers; vary color/size/shape
      const flower = document.createElement('div');
      flower.className = 'flower';
      const palettes = ['#ff7eb9','#ffd1dc','#ffdda6','#fff59d','#c9f5c1','#d2e7ff','#e0b0ff','#ffb3ba'];
      flower.style.setProperty('--flowerC', palettes[Math.floor(Math.random()*palettes.length)]);
      flower.style.setProperty('--flowerS', `${56 + Math.floor(Math.random()*36)}px`);

      const shapes = ['daisy','tulip','sun'];
      const shape = shapes[Math.floor(Math.random()*shapes.length)];
      if (shape !== 'daisy') flower.classList.add(shape);

      const petals = shape === 'tulip' ? 6 + Math.floor(Math.random()*3) : 10 + Math.floor(Math.random()*8);
      for (let p = 0; p < petals; p++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        const angle = (360 / petals) * p;
        const petalW = shape === 'sun' ? 18 : 20 + Math.floor(Math.random()*8);
        const petalH = shape === 'tulip' ? 44 + Math.floor(Math.random()*8) : 40 + Math.floor(Math.random()*14);
        petal.style.setProperty('--petalW', `${petalW}px`);
        petal.style.setProperty('--petalH', `${petalH}px`);
        petal.style.transform = `rotate(${angle}deg)`;
        flower.appendChild(petal);
      }
      const center = document.createElement('div'); center.className = 'center';
      flower.appendChild(center);
      plant.appendChild(flower);

      flora.appendChild(plant);
    }

    // Handle resize to reflow counts
    function rebuild() {
      try {
        // remove existing plants and bushes
        flora.querySelectorAll('.plant').forEach(p => p.remove());
        flora.querySelectorAll('.svg-bush').forEach(b => b.remove());
        // rebuild SVG bushes, tiled with overlap to eliminate gaps
        tileBushes(back, { fill: '#2f7f4f', stroke: '#1f5d3a', wMin: 220, wMax: 360, hMin: 120, hMax: 200, stepFactor: 0.62 });
        tileBushes(mid,  { fill: '#2e7d4f', stroke: '#20623e', wMin: 260, wMax: 420, hMin: 150, hMax: 240, stepFactor: 0.6 });
        const w = window.innerWidth;
        const c = Math.max(12, Math.floor(w / 120));
        for (let i = 0; i < c; i++) {
          const plant = document.createElement('div');
          plant.className = 'plant';
          const x = Math.round((i + Math.random() * 0.6) / c * 100);
          const stemH = 16 + Math.random() * 18;
          const swayDur = 6 + Math.random() * 5;
          plant.style.left = `${x}vw`;
          plant.style.setProperty('--stemH', `${stemH}vh`);
          plant.style.setProperty('--swayDur', `${swayDur}s`);
          const stem = document.createElement('div'); stem.className = 'stem';
          plant.appendChild(stem);
          const baseLeaves2 = [
            { cls: 'leaf left' , pos: 0.35 },
            { cls: 'leaf right', pos: 0.55 }
          ];
          baseLeaves2.forEach(l => {
            const leaf = document.createElement('div');
            leaf.className = l.cls;
            leaf.style.top = `calc(var(--stemH) * ${l.pos})`;
            if (Math.random() < 0.4) leaf.classList.add('small');
            plant.appendChild(leaf);
          });
          const extraLeaves2 = 3 + Math.floor(Math.random() * 3);
          for (let k = 0; k < extraLeaves2; k++) {
            const leaf = document.createElement('div');
            const side = Math.random() < 0.5 ? 'left' : 'right';
            leaf.className = `leaf ${side}`;
            const pos = 0.15 + Math.random() * 0.7;
            leaf.style.top = `calc(var(--stemH) * ${pos})`;
            if (Math.random() < 0.6) leaf.classList.add('small');
            plant.appendChild(leaf);
          }
          // All plants have flowers; vary color/size/shape
          const flower = document.createElement('div'); flower.className = 'flower';
          const palettes = ['#ff7eb9','#ffd1dc','#ffdda6','#fff59d','#c9f5c1','#d2e7ff','#e0b0ff','#ffb3ba'];
          flower.style.setProperty('--flowerC', palettes[Math.floor(Math.random()*palettes.length)]);
          flower.style.setProperty('--flowerS', `${56 + Math.floor(Math.random()*36)}px`);
          const shapes = ['daisy','tulip','sun'];
          const shape = shapes[Math.floor(Math.random()*shapes.length)];
          if (shape !== 'daisy') flower.classList.add(shape);
          const petals = shape === 'tulip' ? 6 + Math.floor(Math.random()*3) : 10 + Math.floor(Math.random()*8);
          for (let p = 0; p < petals; p++) {
            const petal = document.createElement('div'); petal.className = 'petal';
            const angle = (360 / petals) * p;
            const petalW = shape === 'sun' ? 18 : 20 + Math.floor(Math.random()*8);
            const petalH = shape === 'tulip' ? 44 + Math.floor(Math.random()*8) : 40 + Math.floor(Math.random()*14);
            petal.style.setProperty('--petalW', `${petalW}px`);
            petal.style.setProperty('--petalH', `${petalH}px`);
            petal.style.transform = `rotate(${angle}deg)`;
            flower.appendChild(petal);
          }
          const center = document.createElement('div'); center.className = 'center';
          flower.appendChild(center);
          plant.appendChild(flower);
          flora.appendChild(plant);
        }
      } catch {}
    }
    window.addEventListener('resize', rebuild);
    flora._onResize = rebuild;

    document.body.appendChild(flora);
  } catch (e) {
    console.error('Error creating beautiful flora:', e);
  }
}

function removeBeautifulFlora() {
  try {
    const el = document.getElementById('beautifulFlora');
    if (el) {
      if (el._onResize) window.removeEventListener('resize', el._onResize);
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  } catch (e) {
    console.error('Error removing beautiful flora:', e);
  }
}

// Initialize theme
setTheme(currentTheme);

window.addEventListener('DOMContentLoaded', () => {
  try {
    // Load saved grid size preference
    const savedGridSize = localStorage.getItem('gridSize');
    if (savedGridSize) {
      currentGridSize = parseInt(savedGridSize);
      document.getElementById('gridSize').value = currentGridSize;
    }
    updateGridSize(currentGridSize);
    
    // Add grid size change listener
    document.getElementById('gridSize').addEventListener('change', (e) => {
      updateGridSize(parseInt(e.target.value));
    });

    refreshGrid();
    initSearch();
    
    // Handle extension add flow via URL params
    (function processAddFromQuery(){
      try {
        const sp = new URLSearchParams(location.search);
        if (sp.get('add') !== '1') return;
        const url = sp.get('url') || '';
        const title = sp.get('title') || '';
        const category = sp.get('category') || '';
        const newCategory = sp.get('newCategory') || '';
        if (!url) return;

        // Resolve or create target group
        let targetGroupId = null;
        const nameEq = (a,b) => (a||'').toLowerCase() === (b||'').toLowerCase();
        if (newCategory) {
          // Create a new group id from name
          const baseId = newCategory.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
          let gid = baseId || 'group-' + Math.random().toString(36).slice(2,7);
          // avoid collisions
          const existingIds = new Set(groups.map(g=>g.id));
          let n = 2; while (existingIds.has(gid)) { gid = baseId + '-' + (n++); }
          groups.push({ id: gid, name: newCategory.trim(), sites: [] });
          targetGroupId = gid;
          saveGroups();
        } else if (category) {
          const byId = groups.find(g => g.id === category);
          const byName = groups.find(g => nameEq(g.name, category));
          if (byId) targetGroupId = byId.id; else if (byName) targetGroupId = byName.id;
        }
        if (!targetGroupId && groups[0]) targetGroupId = groups[0].id;

        // Add site if not present
        const exists = sites.some(s => s.url === url);
        if (!exists) {
          sites.push({ url, title: title || url });
          saveSites(sites);
        }
        // Ensure site is in the target group
        if (targetGroupId) {
          const g = groups.find(x => x.id === targetGroupId);
          if (g && !g.sites.includes(url)) {
            g.sites.push(url);
            saveGroups();
          }
        }
        // Rebuild UI and scroll to target group
        refreshGrid({ skipMetadata: true });
        setTimeout(() => {
          refreshGrid();
          if (targetGroupId) scrollToGroup(targetGroupId);
        }, 0);
        // Clean query to avoid re-adding on refresh
        try { history.replaceState({}, document.title, location.pathname); } catch {}
      } catch (e) {
        console.error('Error processing add-from-query:', e);
      }
    })();

    // Add settings button click handler
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveDataBtn = document.getElementById('saveDataBtn');
    const purgeDataBtn = document.getElementById('purgeDataBtn');
    const backupDataBtn = document.getElementById('backupDataBtn');
    const restoreDataBtn = document.getElementById('restoreDataBtn');
    const appendDataBtn = document.getElementById('appendDataBtn');
    const clearIconCacheBtn = document.getElementById('clearIconCacheBtn');
    const restoreFileInput = document.getElementById('restoreFileInput');
    const appendFileInput = document.getElementById('appendFileInput');
    
    settingsBtn.addEventListener('click', openSettingsModal);
    
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('active');
    });
    
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
      }
    });

    // Save data changes
    saveDataBtn.addEventListener('click', () => {
      try {
        const storageDetails = document.getElementById('storageDetails');
        const data = JSON.parse(storageDetails.value);
        
        if (data.sites && Array.isArray(data.sites) && 
            data.groups && Array.isArray(data.groups)) {
          sites = data.sites;
          groups = data.groups;
          saveSites(sites);
          saveGroups();
          refreshGrid({ skipMetadata: true });
          setTimeout(() => { refreshGrid(); }, 0);
          alert('Data saved successfully!');
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please check the format and try again.');
      }
    });

    // Backup data to file
    backupDataBtn.addEventListener('click', () => {
      const data = {
        sites: sites,
        groups: groups
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homepage-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Restore data from file
    restoreDataBtn.addEventListener('click', () => {
      restoreFileInput.click();
    });

    restoreFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data.sites && Array.isArray(data.sites) && 
                data.groups && Array.isArray(data.groups)) {
              if (confirm('This will replace all current data. Are you sure?')) {
                sites = data.sites;
                groups = data.groups;
                saveSites(sites);
                saveGroups();
                refreshGrid({ skipMetadata: true });
                setTimeout(() => { refreshGrid(); }, 0);
                openSettingsModal();
                alert('Data restored successfully!');
              }
            } else {
              throw new Error('Invalid backup file format');
            }
          } catch (error) {
            console.error('Error restoring data:', error);
            alert('Error restoring data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
      e.target.value = ''; // Reset file input
    });

    // Append data from file
    appendDataBtn.addEventListener('click', () => {
      appendFileInput.click();
    });

    appendFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data.sites && Array.isArray(data.sites) && 
                data.groups && Array.isArray(data.groups)) {
              
              // Add new sites to the sites array (avoid duplicates)
              const existingUrls = new Set(sites.map(s => s.url));
              const newSites = data.sites.filter(s => !existingUrls.has(s.url));
              sites = [...sites, ...newSites];

              // Handle groups
              data.groups.forEach(importedGroup => {
                // Find if group exists by name
                const existingGroup = groups.find(g => g.name === importedGroup.name);
                
                if (existingGroup) {
                  // Add new sites to existing group
                  const groupSites = new Set(existingGroup.sites);
                  importedGroup.sites.forEach(site => {
                    if (sites.some(s => s.url === site)) { // Only add if site exists
                      groupSites.add(site);
                    }
                  });
                  existingGroup.sites = Array.from(groupSites);
                } else {
                  // Create new group with valid sites
                  const validSites = importedGroup.sites.filter(site => 
                    sites.some(s => s.url === site)
                  );
                  groups.push({
                    id: `group_${Date.now()}`,
                    name: importedGroup.name,
                    sites: validSites
                  });
                }
              });

              saveSites(sites);
              saveGroups();
              refreshGrid({ skipMetadata: true });
              setTimeout(() => { refreshGrid(); }, 0);
              openSettingsModal();
              alert(`Appended ${newSites.length} sites and updated groups!`);
            } else {
              throw new Error('Invalid backup file format');
            }
          } catch (error) {
            console.error('Error appending data:', error);
            alert('Error appending data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
      e.target.value = ''; // Reset file input
    });

    // Purge all data
    purgeDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to purge all data? This cannot be undone!')) {
        localStorage.clear();
        sites = [];
        groups = [];
        refreshGrid();
        openSettingsModal();
        alert('All data has been purged.');
      }
    });
    
    // Add new group button
    const searchBar = document.querySelector('.search-bar');
    const newGroupBtn = document.createElement('button');
    newGroupBtn.className = 'add-button';
    newGroupBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" fill="currentColor"/>
      </svg>
    `;
    newGroupBtn.addEventListener('click', () => {
      const newGroup = {
        id: 'group_' + Date.now(),
        name: 'New Group',
        sites: []
      };
      groups.push(newGroup);
      saveGroups();
      refreshGrid();
    });
    searchBar.appendChild(newGroupBtn);

    // Theme handling
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        setTheme(card.dataset.theme);
      });
    });

    // Category jump handling
    const categoryJump = document.getElementById('categoryJump');
    if (categoryJump) {
      categoryJump.addEventListener('change', (e) => {
        if (e.target.value) {
          scrollToGroup(e.target.value);
        }
      });
      // Initialize once
      updateCategoryJump();
    }

    // Tab handling in settings
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
        
        // Update modal title
        const modalTitle = document.getElementById('settingsModalTitle');
        modalTitle.textContent = button.dataset.tab === 'storage' ? 'Storage Settings' : 'Theme Settings';
      });
    });
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});