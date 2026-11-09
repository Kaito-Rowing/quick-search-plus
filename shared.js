(() => {
  const defaults = Object.freeze({
    characterCountEnabled: true, characterCountThreshold: 30,
    copyButtonEnabled: true, openUrlEnabled: true
  });
  const validThreshold = value => ['number', 'string'].includes(typeof value) && String(value).trim() !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100000;
  function normalizeSettings(raw = {}) {
    return {
      characterCountEnabled: typeof raw.characterCountEnabled === 'boolean' ? raw.characterCountEnabled : defaults.characterCountEnabled,
      characterCountThreshold: validThreshold(raw.characterCountThreshold) ? Number(raw.characterCountThreshold) : defaults.characterCountThreshold,
      copyButtonEnabled: typeof raw.copyButtonEnabled === 'boolean' ? raw.copyButtonEnabled : defaults.copyButtonEnabled,
      openUrlEnabled: typeof raw.openUrlEnabled === 'boolean' ? raw.openUrlEnabled : defaults.openUrlEnabled
    };
  }
  function getOpenableUrl(text) {
    const value = text.trim();
    // Never interpret credentials, control characters or other schemes as links.
    if (!value || value.length > 2048 || /[\s\u0000-\u001f\u007f\\]/u.test(value)) return null;
    const explicit = /^https?:\/\//i.test(value);
    if (!explicit && !/^(?:[\p{L}\p{N}-]+\.)+[\p{L}]{2,}(?::\d{1,5})?(?:[/?#].*)?$/u.test(value)) return null;
    try {
      const url = new URL(explicit ? value : `https://${value}`);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
      const labels = url.hostname.split('.');
      const domain = labels.length >= 2 && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) && /[a-z]/i.test(labels.at(-1));
      if (!domain || url.hostname.length > 253) return null;
      return url.href;
    } catch { return null; }
  }
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  function countCharacters(text) {
    let count = 0;
    for (const _segment of segmenter.segment(text)) count++;
    return count;
  }
  globalThis.QuickSearchPlusCore = Object.freeze({ defaults, validThreshold, normalizeSettings, getOpenableUrl, countCharacters });
})();
