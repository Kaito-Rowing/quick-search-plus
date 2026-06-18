(() => {
  const ICON_ID = 'quick-google-search-icon';
  const COUNT_BADGE_ID = 'quick-google-search-count-badge';
  const VISIBLE_CLASS = 'quick-google-search-icon--visible';
  const COUNT_BADGE_VISIBLE_CLASS = 'quick-google-search-count-badge--visible';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICON_SIZE = 40;
  const OFFSET = 12;
  const EDGE_MARGIN = 8;
  const COUNT_BADGE_OFFSET = 8;
  const DEFAULT_COUNT_SETTINGS = {
    characterCountEnabled: true,
    characterCountThreshold: 30
  };

  let searchIcon = null;
  let countBadge = null;
  let selectedText = '';
  let countSettings = { ...DEFAULT_COUNT_SETTINGS };
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

  function createSearchIcon() {
    const button = document.createElement('button');
    button.id = ICON_ID;
    button.type = 'button';
    button.title = 'Search with Google';
    button.setAttribute('aria-label', 'Search with Google');

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

    svg.append(
      createSvgElement('circle', { cx: '11', cy: '11', r: '8' }),
      createSvgElement('path', { d: 'm21 21-4.35-4.35' })
    );

    button.appendChild(svg);
    button.addEventListener('mousedown', handleIconMouseDown);
    button.addEventListener('click', handleIconClick);

    (document.body || document.documentElement).appendChild(button);
    return button;
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

  function normalizeCountSettings(settings) {
    const threshold = Number.parseInt(settings.characterCountThreshold, 10);

    return {
      characterCountEnabled: settings.characterCountEnabled !== false,
      characterCountThreshold: Number.isFinite(threshold) && threshold > 0
        ? threshold
        : DEFAULT_COUNT_SETTINGS.characterCountThreshold
    };
  }

  function loadCountSettings() {
    if (
      typeof chrome === 'undefined' ||
      !chrome.storage ||
      !chrome.storage.sync
    ) {
      return;
    }

    chrome.storage.sync.get(DEFAULT_COUNT_SETTINGS, (settings) => {
      if (chrome.runtime.lastError) {
        return;
      }

      countSettings = normalizeCountSettings(settings);
    });
  }

  function countCharacters(text) {
    if (graphemeSegmenter) {
      return Array.from(graphemeSegmenter.segment(text)).length;
    }

    return Array.from(text).length;
  }

  function getViewportPosition(point) {
    const maxX = window.innerWidth - ICON_SIZE - EDGE_MARGIN;
    const maxY = window.innerHeight - ICON_SIZE - EDGE_MARGIN;

    let x = point.x + OFFSET;
    let y = point.y + OFFSET;

    if (x > maxX) {
      x = point.x - ICON_SIZE - OFFSET;
    }

    if (y > maxY) {
      y = point.y - ICON_SIZE - OFFSET;
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

  function showIcon(point) {
    if (!searchIcon) {
      searchIcon = createSearchIcon();
    }

    const position = getViewportPosition(point);
    searchIcon.style.left = `${position.x}px`;
    searchIcon.style.top = `${position.y}px`;
    searchIcon.classList.add(VISIBLE_CLASS);
  }

  function hideIcon() {
    if (searchIcon) {
      searchIcon.classList.remove(VISIBLE_CLASS);
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
    hideIcon();
    hideCountBadge();
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

  function searchGoogle(text) {
    const query = text.trim();

    if (!query) {
      return;
    }

    const url = new URL('https://www.google.com/search');
    url.searchParams.set('q', query);

    const openedWindow = window.open(url.toString(), '_blank', 'noopener,noreferrer');

    if (openedWindow) {
      openedWindow.opener = null;
    }
  }

  function handleIconMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleIconClick(event) {
    event.preventDefault();
    event.stopPropagation();

    searchGoogle(selectedText);
    hideSelectionUi();
  }

  function updateSelectionIcon(point) {
    const text = getSelectedText();

    if (text) {
      const characterCount = countCharacters(text);

      selectedText = text;
      showIcon(point);

      if (
        countSettings.characterCountEnabled &&
        characterCount >= countSettings.characterCountThreshold
      ) {
        showCountBadge(point, characterCount);
      } else {
        hideCountBadge();
      }

      return;
    }

    selectedText = '';
    hideSelectionUi();
  }

  loadCountSettings();

  if (
    typeof chrome !== 'undefined' &&
    chrome.storage &&
    chrome.storage.onChanged
  ) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') {
        return;
      }

      if (changes.characterCountEnabled || changes.characterCountThreshold) {
        countSettings = normalizeCountSettings({
          characterCountEnabled: changes.characterCountEnabled
            ? changes.characterCountEnabled.newValue
            : countSettings.characterCountEnabled,
          characterCountThreshold: changes.characterCountThreshold
            ? changes.characterCountThreshold.newValue
            : countSettings.characterCountThreshold
        });
        hideCountBadge();
      }
    });
  }

  document.addEventListener('mouseup', (event) => {
    if (searchIcon && searchIcon.contains(event.target)) {
      return;
    }

    const point = {
      x: event.clientX,
      y: event.clientY
    };

    window.setTimeout(() => updateSelectionIcon(point), 10);
  });

  document.addEventListener('mousedown', (event) => {
    if (searchIcon && searchIcon.contains(event.target)) {
      return;
    }

    hideSelectionUi();
  });

  document.addEventListener('scroll', hideSelectionUi, true);
  window.addEventListener('resize', hideSelectionUi);
})();
