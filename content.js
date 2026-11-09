(() => {
  const { defaults, normalizeSettings, getOpenableUrl, countCharacters } = QuickSearchPlusCore;
  const message = (key, substitutions) => chrome.i18n.getMessage(key, substitutions);
  let settings = { ...defaults };
  let loaded = false;
  let settingsRevision = 0;
  let host, shadow, primary, copy, badge, status;
  let selected = '';
  let timer, feedbackTimer;
  let generation = 0;
  let dragging = false;
  let dismissed = false;
  let copying = false;
  let fallbackCopying = false;

  const ownEvent = event => host && event.composedPath().includes(host);
  const important = (name, value) => host.style.setProperty(name, value, 'important');
  function hide() {
    clearTimeout(timer);
    clearTimeout(feedbackTimer);
    generation++;
    selected = '';
    copying = false;
    if (host) {
      important('display', 'none');
      status.textContent = '';
      copy.disabled = false;
      primary.dataset.url = '';
    }
  }
  function readSelection() {
    const editable = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    if (active?.closest(editable)) return null;
    const selection = getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    const element = node => node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (element(range.startContainer)?.closest(editable) || element(range.endContainer)?.closest(editable)) return null;
    const ancestor = range.commonAncestorContainer;
    if (ancestor.querySelectorAll && [...ancestor.querySelectorAll(editable)].some(el => range.intersectsNode(el))) return null;
    const raw = selection.toString();
    if (!raw.trim()) return null;
    const rects = range.getClientRects();
    // Anchor to the moving end, including backwards selections.
    const backwards = selection.anchorNode === range.endContainer && selection.anchorOffset === range.endOffset;
    const rect = backwards ? rects[0] : rects[rects.length - 1];
    return rect ? { raw, text: raw.trim(), rect, backwards } : null;
  }
  function icon(button, name) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(key, value);
    const paths = {
      search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0M15 15l6 6',
      open: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
      copy: 'M9 9h12v12H9zM5 15H3V3h12v2',
      check: 'M5 12l4 4L20 5', error: 'M12 5v9M12 18v1'
    };
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', paths[name]);
    svg.append(path);
    button.replaceChildren(svg);
  }
  function label(button, text) {
    button.title = text;
    button.setAttribute('aria-label', text);
  }
  function resetCopy() {
    clearTimeout(feedbackTimer);
    copy.dataset.state = '';
    icon(copy, 'copy');
    label(copy, message('copyLabel'));
    status.textContent = '';
  }
  function createUi() {
    host = document.createElement('quick-search-plus');
    for (const [key, value] of Object.entries({ all: 'initial', position: 'fixed', display: 'none', margin: '0',
      padding: '0', border: '0', background: 'transparent', 'box-shadow': 'none',
      'z-index': '2147483647', 'color-scheme': 'light', transform: 'none', opacity: '1',
      visibility: 'visible', 'pointer-events': 'auto', overflow: 'visible', 'border-radius': '0' })) important(key, value);
    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .actions { display:flex; align-items:center; gap:6px; width:max-content; padding:0; margin:0; }
      button { all:initial; box-sizing:border-box; display:grid; place-items:center; flex:0 0 40px;
        width:40px; height:40px; padding:0; margin:0; border:0; border-radius:50%; color:white;
        background:linear-gradient(135deg,#2563eb,#16803d); appearance:none; cursor:pointer;
        box-shadow:0 3px 12px #0f172a33; user-select:none; -webkit-tap-highlight-color:transparent; }
      button[data-action="copy"] { background:#1e293b; }
      button[data-mode="open"] { background:linear-gradient(135deg,#087f8c,#2563eb); }
      button:hover { filter:brightness(1.12); }
      button:focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
      button:disabled { cursor:wait; opacity:.65; }
      button[data-state="success"] { background:#15803d; }
      button[data-state="error"] { background:#b91c1c; }
      svg { width:20px; height:20px; display:block; pointer-events:none; }
      .count { box-sizing:border-box; padding:6px 9px; border-radius:999px; background:#1e293b;
        color:white; font:600 12px/1 system-ui,sans-serif; white-space:nowrap; user-select:none; }
      [hidden] { display:none!important; }
      .status { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
      @media(forced-colors:active) { button,.count { background:ButtonFace; color:ButtonText; border:1px solid ButtonText; } }
    `;
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', message('actionsLabel'));
    primary = document.createElement('button');
    primary.type = 'button';
    primary.dataset.action = 'primary';
    copy = document.createElement('button');
    copy.type = 'button';
    copy.dataset.action = 'copy';
    badge = document.createElement('span');
    badge.className = 'count';
    status = document.createElement('span');
    status.className = 'status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    for (const button of [primary, copy]) button.addEventListener('pointerdown', event => {
      if (event.button === 0) event.preventDefault();
      event.stopPropagation();
    });
    primary.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      const current = readSelection();
      if (!event.isTrusted || !selected || !current) return;
      const url = settings.openUrlEnabled && getOpenableUrl(current.text);
      // Never switch a visible Search action into an unexpected direct navigation.
      if (url && primary.dataset.mode === 'open' && primary.dataset.url === url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        const search = new URL('https://www.google.com/search');
        search.searchParams.set('q', current.text);
        window.open(search.href, '_blank', 'noopener,noreferrer');
      }
      dismissed = true; hide();
    });
    copy.addEventListener('click', copySelection);
    actions.append(primary, copy, badge);
    shadow.append(style, actions, status);
    document.documentElement.append(host);
  }
  function fallbackCopy(text) {
    const selection = getSelection();
    const ranges = Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange());
    const focused = shadow.activeElement;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.cssText = 'position:fixed;left:-10000px;top:0;opacity:0;';
    fallbackCopying = true;
    shadow.append(textarea);
    try {
      textarea.select();
      return document.execCommand('copy');
    } finally {
      textarea.remove();
      selection.removeAllRanges();
      for (const range of ranges) selection.addRange(range);
      focused?.focus({ preventScroll: true });
      // Selection events from the temporary control are delivered asynchronously.
      setTimeout(() => { fallbackCopying = false; }, 0);
    }
  }
  async function copySelection(event) {
    event.preventDefault(); event.stopPropagation();
    const current = readSelection();
    if (!event.isTrusted || !settings.copyButtonEnabled || !selected || !current || copying) return;
    const version = generation;
    copying = true;
    copy.disabled = true;
    let success = false;
    try {
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(current.raw); success = true; } catch { /* Try the HTTP-compatible path. */ }
      }
      // If the user has changed selection while awaiting the API, do not move focus.
      if (!success && generation === version) success = fallbackCopy(current.raw);
    } catch { success = false; }
    if (generation !== version) return;
    copying = false;
    copy.disabled = false;
    copy.dataset.state = success ? 'success' : 'error';
    icon(copy, success ? 'check' : 'error');
    const text = message(success ? 'copied' : 'copyFailed');
    label(copy, text);
    status.textContent = text;
    feedbackTimer = setTimeout(resetCopy, 1600);
  }
  function update(point) {
    if (!loaded || dismissed || dragging || fallbackCopying) return;
    const current = readSelection();
    if (!current) return hide();
    if (!host) createUi();
    if (!host.isConnected) document.documentElement.append(host);
    if (selected !== current.raw) {
      generation++;
      copying = false;
      copy.disabled = false;
      resetCopy();
    }
    selected = current.raw;
    const url = settings.openUrlEnabled && getOpenableUrl(current.text);
    primary.dataset.mode = url ? 'open' : 'search';
    primary.dataset.url = url || '';
    label(primary, url ? `${message('openLabel')} — ${new URL(url).hostname}` : message('searchLabel'));
    icon(primary, url ? 'open' : 'search');
    copy.hidden = !settings.copyButtonEnabled;
    let count = 0;
    if (settings.characterCountEnabled) count = countCharacters(current.raw);
    badge.hidden = !settings.characterCountEnabled || count < settings.characterCountThreshold;
    badge.textContent = badge.hidden ? '' : message('characterCount', String(count));
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    if (current.rect.bottom < top || current.rect.top > bottom) return hide();
    important('display', 'block');
    // Badge and actions share one measured group so they cannot overlap.
    const box = shadow.querySelector('.actions').getBoundingClientRect();
    important('width', `${box.width}px`);
    important('height', `${box.height}px`);
    const anchor = point ?? { x: current.backwards ? current.rect.left : current.rect.right, y: current.rect.bottom };
    const clamp = (v, min, max) => Math.max(min, Math.min(v, Math.max(min, max)));
    const x = anchor.x + 12 + box.width > right - 8 ? anchor.x - box.width - 12 : anchor.x + 12;
    const y = anchor.y + 12 + box.height > bottom - 8 ? anchor.y - box.height - 12 : anchor.y + 12;
    important('left', `${clamp(x, left + 8, right - box.width - 8)}px`);
    important('top', `${clamp(y, top + 8, bottom - box.height - 8)}px`);
  }
  function schedule(point) { clearTimeout(timer); timer = setTimeout(() => update(point), 20); }
  const dismiss = () => { dismissed = true; hide(); };
  document.addEventListener('pointerdown', event => {
    if (ownEvent(event)) return;
    dragging = event.button === 0;
    dismissed = false; hide();
  }, true);
  document.addEventListener('pointerup', event => {
    if (ownEvent(event)) return;
    dragging = false;
    if (event.button === 0) schedule({ x: event.clientX, y: event.clientY });
  }, true);
  document.addEventListener('pointercancel', () => { dragging = false; hide(); }, true);
  document.addEventListener('selectionchange', () => {
    if (fallbackCopying || document.activeElement === host) return;
    dismissed = false; hide(); schedule();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey &&
        loaded && !dismissed && !dragging && document.activeElement !== host && readSelection()) {
      clearTimeout(timer); update();
      if (selected) { event.preventDefault(); primary.focus({ preventScroll: true }); }
    }
    if (event.key === 'Escape') {
      shadow?.activeElement?.blur(); dismiss();
    }
  }, true);
  document.addEventListener('keyup', event => {
    if (event.key === 'Escape' || event.key === 'Tab' || ownEvent(event)) return;
    if (event.shiftKey || event.key.startsWith('Arrow') || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')) {
      dismissed = false; schedule();
    }
  });
  document.addEventListener('scroll', dismiss, true);
  window.addEventListener('resize', dismiss);
  window.addEventListener('blur', () => { dragging = false; dismiss(); });
  window.addEventListener('pagehide', dismiss);
  document.addEventListener('visibilitychange', () => { if (document.hidden) dismiss(); });
  visualViewport?.addEventListener('scroll', dismiss);
  visualViewport?.addEventListener('resize', dismiss);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !Object.keys(defaults).some(key => key in changes)) return;
    settingsRevision++;
    const next = { ...settings };
    for (const key of Object.keys(defaults)) if (key in changes) next[key] = changes[key].newValue;
    settings = normalizeSettings(next);
    loaded = true;
    hide();
    if (!dismissed) schedule();
  });
  const initialRevision = settingsRevision;
  chrome.storage.sync.get(defaults, stored => {
    const error = chrome.runtime.lastError;
    if (!error && settingsRevision === initialRevision) settings = normalizeSettings(stored);
    loaded = true;
    if (!dismissed) schedule();
  });
})();
