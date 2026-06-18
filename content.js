(() => {
  const TOOLBAR_ID = 'quick-search-plus-toolbar';
  const PRIMARY_BUTTON_ID = 'quick-google-search-icon';
  const COPY_BUTTON_ID = 'quick-search-plus-copy-button';
  const COUNT_BADGE_ID = 'quick-google-search-count-badge';
  const TOOLBAR_VISIBLE_CLASS = 'quick-search-plus-toolbar--visible';
  const PRIMARY_OPEN_CLASS = 'quick-search-plus-primary--open';
  const COPY_SUCCESS_CLASS = 'quick-search-plus-copy-button--success';
  const COPY_ERROR_CLASS = 'quick-search-plus-copy-button--error';
  const COUNT_BADGE_VISIBLE_CLASS = 'quick-google-search-count-badge--visible';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICON_SIZE = 40;
  const TOOLBAR_GAP = 6;
  const OFFSET = 12;
  const EDGE_MARGIN = 8;
  const COUNT_BADGE_OFFSET = 8;
  const COPY_FEEDBACK_MS = 1100;
  const DEFAULT_SETTINGS = {
    characterCountEnabled: true,
    characterCountThreshold: 30,
    copyButtonEnabled: true,
    openUrlEnabled: true
  };

  let toolbar = null;
  let primaryButton = null;
  let copyButton = null;
  let countBadge = null;
  let selectedText = '';
  let selectedUrl = null;
  let settings = { ...DEFAULT_SETTINGS };
  let copyFeedbackTimer = null;
  let graphemeSegmenter = null;

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  }

  function createSvgElement(tagName, attributes) {
    const element = document.createElementNS(SVG_NS, tagName);

    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });

    return element;
  }

  function createIconSvg(paths) {
    const svg = createSvgElement('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false'
    });

    paths.forEach((path) => {
      if (path.tag === 'circle') {
        svg.appendChild(createSvgElement('circle', path.attributes));
        return;
      }

      if (path.tag === 'rect') {
        svg.appendChild(createSvgElement('rect', path.attributes));
        return;
      }

      svg.appendChild(createSvgElement('path', path.attributes));
    });

    return svg;
  }

  function getIconPaths(name) {
    const icons = {
      search: [
        { tag: 'circle', attributes: { cx: '11', cy: '11', r: '8' } },
        { tag: 'path', attributes: { d: 'm21 21-4.35-4.35' } }
      ],
      open: [
        { tag: 'path', attributes: { d: 'M15 3h6v6' } },
        { tag: 'path', attributes: { d: 'M10 14 21 3' } },
        { tag: 'path', attributes: { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' } }
      ],
      copy: [
        { tag: 'rect', attributes: { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' } },
        { tag: 'path', attributes: { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' } }
      ],
      check: [
        { tag: 'path', attributes: { d: 'M20 6 9 17l-5-5' } }
      ],
      alert: [
        { tag: 'path', attributes: { d: 'M12 9v4' } },
        { tag: 'path', attributes: { d: 'M12 17h.01' } },
        { tag: 'path', attributes: { d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z' } }
      ]
    };

    return icons[name];
  }

  function setButtonIcon(button, iconName) {
    button.replaceChildren(createIconSvg(getIconPaths(iconName)));
  }

  function createIconButton(id, title, iconName) {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);
    setButtonIcon(button, iconName);
    button.addEventListener('mousedown', handleToolbarMouseDown);
    return button;
  }

  function createSelectionToolbar() {
    const container = document.createElement('div');
    container.id = TOOLBAR_ID;
    container.setAttribute('aria-label', 'Quick Search Plus actions');

    primaryButton = createIconButton(PRIMARY_BUTTON_ID, 'Search with Google', 'search');
    primaryButton.addEventListener('click', handlePrimaryButtonClick);

    copyButton = createIconButton(COPY_BUTTON_ID, 'Copy selected text', 'copy');
    copyButton.addEventListener('click', handleCopyButtonClick);

    container.append(primaryButton, copyButton);
    (document.body || document.documentElement).appendChild(container);
    return container;
  }

  function createCountBadge() {
    const badge = document.createElement('div');
    badge.id = COUNT_BADGE_ID;
    badge.setAttribute('aria-hidden', 'true');
    applyCountBadgeBaseStyles(badge);
    applyCountBadgeVisibility(badge, false);

    (document.body || document.documentElement).appendChild(badge);
    return badge;
  }

  function setImportantStyle(element, property, value) {
    element.style.setProperty(property, value, 'important');
  }

  function applyCountBadgeBaseStyles(badge) {
    const styles = {
      position: 'fixed',
      'box-sizing': 'border-box',
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'min-width': '38px',
      height: '24px',
      padding: '0 8px',
      border: '1px solid rgba(15, 23, 42, 0.12)',
      'border-radius': '999px',
      background: 'rgba(17, 24, 39, 0.9)',
      color: '#ffffff',
      'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'font-size': '12px',
      'font-weight': '600',
      'line-height': '1',
      'white-space': 'nowrap',
      'z-index': '2147483647',
      'box-shadow': '0 6px 18px rgba(15, 23, 42, 0.22)',
      'pointer-events': 'none',
      'user-select': 'none'
    };

    Object.entries(styles).forEach(([property, value]) => {
      setImportantStyle(badge, property, value);
    });
  }

  function applyCountBadgeVisibility(badge, isVisible) {
    setImportantStyle(badge, 'opacity', isVisible ? '1' : '0');
    setImportantStyle(badge, 'visibility', isVisible ? 'visible' : 'hidden');
    setImportantStyle(badge, 'transform', isVisible ? 'scale(1)' : 'scale(0.92)');
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function normalizeSettings(rawSettings) {
    const threshold = Number.parseInt(rawSettings.characterCountThreshold, 10);

    return {
      characterCountEnabled: rawSettings.characterCountEnabled !== false,
      characterCountThreshold: Number.isFinite(threshold) && threshold > 0
        ? threshold
        : DEFAULT_SETTINGS.characterCountThreshold,
      copyButtonEnabled: rawSettings.copyButtonEnabled !== false,
      openUrlEnabled: rawSettings.openUrlEnabled !== false
    };
  }

  function loadSettings() {
    if (
      typeof chrome === 'undefined' ||
      !chrome.storage ||
      !chrome.storage.sync
    ) {
      return;
    }

    chrome.storage.sync.get(DEFAULT_SETTINGS, (storedSettings) => {
      if (chrome.runtime.lastError) {
        return;
      }

      settings = normalizeSettings(storedSettings);
    });
  }

  function countCharacters(text) {
    if (graphemeSegmenter) {
      return Array.from(graphemeSegmenter.segment(text)).length;
    }

    return Array.from(text).length;
  }

  function getToolbarPosition(point) {
    const fallbackWidth = settings.copyButtonEnabled
      ? ICON_SIZE * 2 + TOOLBAR_GAP
      : ICON_SIZE;
    const rect = toolbar.getBoundingClientRect();
    const toolbarWidth = rect.width || fallbackWidth;
    const toolbarHeight = rect.height || ICON_SIZE;
    const maxX = window.innerWidth - toolbarWidth - EDGE_MARGIN;
    const maxY = window.innerHeight - toolbarHeight - EDGE_MARGIN;

    let x = point.x + OFFSET;
    let y = point.y + OFFSET;

    if (x > maxX) {
      x = point.x - toolbarWidth - OFFSET;
    }

    if (y > maxY) {
      y = point.y - toolbarHeight - OFFSET;
    }

    return {
      x: clamp(x, EDGE_MARGIN, Math.max(EDGE_MARGIN, maxX)),
      y: clamp(y, EDGE_MARGIN, Math.max(EDGE_MARGIN, maxY))
    };
  }

  function getCountBadgePosition(point) {
    const rect = countBadge.getBoundingClientRect();
    const badgeWidth = rect.width || 64;
    const badgeHeight = rect.height || 24;
    const maxX = window.innerWidth - badgeWidth - EDGE_MARGIN;
    const maxY = window.innerHeight - badgeHeight - EDGE_MARGIN;

    let x = point.x - badgeWidth - COUNT_BADGE_OFFSET;
    let y = point.y + COUNT_BADGE_OFFSET;

    if (x < EDGE_MARGIN) {
      x = point.x + COUNT_BADGE_OFFSET;
    }

    if (y > maxY) {
      y = point.y - badgeHeight - COUNT_BADGE_OFFSET;
    }

    return {
      x: clamp(x, EDGE_MARGIN, Math.max(EDGE_MARGIN, maxX)),
      y: clamp(y, EDGE_MARGIN, Math.max(EDGE_MARGIN, maxY))
    };
  }

  function getSelectedText() {
    const activeElement = document.activeElement;

    if (
      activeElement &&
      (activeElement.tagName === 'TEXTAREA' ||
        (activeElement.tagName === 'INPUT' &&
          /^(search|text|url|email|tel)$/i.test(activeElement.type))) &&
      typeof activeElement.selectionStart === 'number' &&
      typeof activeElement.selectionEnd === 'number'
    ) {
      return activeElement.value
        .slice(activeElement.selectionStart, activeElement.selectionEnd)
        .trim();
    }

    return window.getSelection().toString().trim();
  }

  function isEmailLike(text) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  }

  function hasDomainHostname(hostname) {
    return /^(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(hostname);
  }

  function getOpenableUrl(text) {
    const trimmedText = text.trim();

    if (
      !trimmedText ||
      trimmedText.length > 2048 ||
      /\s/.test(trimmedText) ||
      isEmailLike(trimmedText)
    ) {
      return null;
    }

    const hasHttpScheme = /^https?:\/\//i.test(trimmedText);
    const bareDomainPattern = /^(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d{2,5})?(?:[/?#][^\s]*)?$/i;

    if (!hasHttpScheme && !bareDomainPattern.test(trimmedText)) {
      return null;
    }

    try {
      const url = new URL(hasHttpScheme ? trimmedText : `https://${trimmedText}`);

      if (!/^https?:$/i.test(url.protocol) || !hasDomainHostname(url.hostname)) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  function openInNewTab(url) {
    const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (openedWindow) {
      openedWindow.opener = null;
    }
  }

  function searchGoogle(text) {
    const query = text.trim();

    if (!query) {
      return;
    }

    const url = new URL('https://www.google.com/search');
    url.searchParams.set('q', query);
    openInNewTab(url.toString());
  }

  function configurePrimaryButton(url) {
    if (!primaryButton) {
      return;
    }

    if (url) {
      primaryButton.title = 'Open link';
      primaryButton.setAttribute('aria-label', 'Open link');
      primaryButton.classList.add(PRIMARY_OPEN_CLASS);
      setButtonIcon(primaryButton, 'open');
      return;
    }

    primaryButton.title = 'Search with Google';
    primaryButton.setAttribute('aria-label', 'Search with Google');
    primaryButton.classList.remove(PRIMARY_OPEN_CLASS);
    setButtonIcon(primaryButton, 'search');
  }

  function resetCopyButtonFeedback() {
    if (!copyButton) {
      return;
    }

    window.clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
    copyButton.classList.remove(COPY_SUCCESS_CLASS, COPY_ERROR_CLASS);
    copyButton.title = 'Copy selected text';
    copyButton.setAttribute('aria-label', 'Copy selected text');
    setButtonIcon(copyButton, 'copy');
  }

  function showCopyButtonFeedback(isSuccess) {
    if (!copyButton) {
      return;
    }

    window.clearTimeout(copyFeedbackTimer);
    copyButton.classList.remove(COPY_SUCCESS_CLASS, COPY_ERROR_CLASS);

    if (isSuccess) {
      copyButton.classList.add(COPY_SUCCESS_CLASS);
      copyButton.title = 'Copied';
      copyButton.setAttribute('aria-label', 'Copied');
      setButtonIcon(copyButton, 'check');
    } else {
      copyButton.classList.add(COPY_ERROR_CLASS);
      copyButton.title = 'Copy failed';
      copyButton.setAttribute('aria-label', 'Copy failed');
      setButtonIcon(copyButton, 'alert');
    }

    copyFeedbackTimer = window.setTimeout(resetCopyButtonFeedback, COPY_FEEDBACK_MS);
  }

  async function copySelectedText() {
    if (!selectedText) {
      return false;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(selectedText);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = selectedText;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    (document.body || document.documentElement).appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } finally {
      textarea.remove();
    }
  }

  function showToolbar(point, url) {
    if (!toolbar) {
      toolbar = createSelectionToolbar();
    }

    resetCopyButtonFeedback();
    configurePrimaryButton(url);
    copyButton.hidden = !settings.copyButtonEnabled;
    setImportantStyle(
      copyButton,
      'display',
      settings.copyButtonEnabled ? 'inline-flex' : 'none'
    );

    const position = getToolbarPosition(point);
    toolbar.style.left = `${position.x}px`;
    toolbar.style.top = `${position.y}px`;
    toolbar.classList.add(TOOLBAR_VISIBLE_CLASS);
  }

  function hideToolbar() {
    if (toolbar) {
      toolbar.classList.remove(TOOLBAR_VISIBLE_CLASS);
      resetCopyButtonFeedback();
    }
  }

  function showCountBadge(point, characterCount) {
    if (!countBadge) {
      countBadge = createCountBadge();
    }

    countBadge.textContent = `${characterCount}\u6587\u5b57`;

    const position = getCountBadgePosition(point);
    setImportantStyle(countBadge, 'left', `${position.x}px`);
    setImportantStyle(countBadge, 'top', `${position.y}px`);
    applyCountBadgeVisibility(countBadge, true);
    countBadge.classList.add(COUNT_BADGE_VISIBLE_CLASS);
  }

  function hideCountBadge() {
    if (countBadge) {
      applyCountBadgeVisibility(countBadge, false);
      countBadge.classList.remove(COUNT_BADGE_VISIBLE_CLASS);
    }
  }

  function hideSelectionUi() {
    hideToolbar();
    hideCountBadge();
  }

  function handleToolbarMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handlePrimaryButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (selectedUrl) {
      openInNewTab(selectedUrl);
    } else {
      searchGoogle(selectedText);
    }

    hideSelectionUi();
  }

  async function handleCopyButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    try {
      showCopyButtonFeedback(await copySelectedText());
    } catch {
      showCopyButtonFeedback(false);
    }
  }

  function updateSelectionUi(point) {
    const text = getSelectedText();

    if (text) {
      const characterCount = countCharacters(text);

      selectedText = text;
      selectedUrl = settings.openUrlEnabled ? getOpenableUrl(text) : null;
      showToolbar(point, selectedUrl);

      if (
        settings.characterCountEnabled &&
        characterCount >= settings.characterCountThreshold
      ) {
        showCountBadge(point, characterCount);
      } else {
        hideCountBadge();
      }

      return;
    }

    selectedText = '';
    selectedUrl = null;
    hideSelectionUi();
  }

  loadSettings();

  if (
    typeof chrome !== 'undefined' &&
    chrome.storage &&
    chrome.storage.onChanged
  ) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') {
        return;
      }

      if (
        changes.characterCountEnabled ||
        changes.characterCountThreshold ||
        changes.copyButtonEnabled ||
        changes.openUrlEnabled
      ) {
        settings = normalizeSettings({
          characterCountEnabled: changes.characterCountEnabled
            ? changes.characterCountEnabled.newValue
            : settings.characterCountEnabled,
          characterCountThreshold: changes.characterCountThreshold
            ? changes.characterCountThreshold.newValue
            : settings.characterCountThreshold,
          copyButtonEnabled: changes.copyButtonEnabled
            ? changes.copyButtonEnabled.newValue
            : settings.copyButtonEnabled,
          openUrlEnabled: changes.openUrlEnabled
            ? changes.openUrlEnabled.newValue
            : settings.openUrlEnabled
        });
        hideSelectionUi();
      }
    });
  }

  document.addEventListener('mouseup', (event) => {
    if (toolbar && toolbar.contains(event.target)) {
      return;
    }

    const point = {
      x: event.clientX,
      y: event.clientY
    };

    window.setTimeout(() => updateSelectionUi(point), 10);
  });

  document.addEventListener('mousedown', (event) => {
    if (toolbar && toolbar.contains(event.target)) {
      return;
    }

    hideSelectionUi();
  });

  document.addEventListener('scroll', hideSelectionUi, true);
  window.addEventListener('resize', hideSelectionUi);
})();
