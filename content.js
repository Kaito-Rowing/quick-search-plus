(() => {
  const ICON_ID = 'quick-google-search-icon';
  const VISIBLE_CLASS = 'quick-google-search-icon--visible';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICON_SIZE = 40;
  const OFFSET = 12;
  const EDGE_MARGIN = 8;

  let searchIcon = null;
  let selectedText = '';

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
    button.title = 'Googleで検索';
    button.setAttribute('aria-label', 'Googleで検索');

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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
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
    hideIcon();
  }

  function updateSelectionIcon(point) {
    const text = getSelectedText();

    if (text) {
      selectedText = text;
      showIcon(point);
      return;
    }

    selectedText = '';
    hideIcon();
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

    hideIcon();
  });

  document.addEventListener('scroll', hideIcon, true);
  window.addEventListener('resize', hideIcon);
})();
