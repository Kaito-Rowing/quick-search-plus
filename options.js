(() => {
  const { defaults, normalizeSettings, validThreshold } = QuickSearchPlusCore;
  const message = key => chrome.i18n.getMessage(key);
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.title = `Quick Search Plus — ${message('optionsTitle')}`;
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = message(element.dataset.i18n);
  const form = document.querySelector('#settings-form');
  const fieldset = form.querySelector('fieldset');
  const copy = document.querySelector('#copy-enabled');
  const url = document.querySelector('#open-url-enabled');
  const count = document.querySelector('#count-enabled');
  const threshold = document.querySelector('#count-threshold');
  const status = document.querySelector('#status');
  const retry = document.querySelector('#retry');
  let statusTimer;
  function setStatus(key, error = false, temporary = false) {
    clearTimeout(statusTimer);
    status.textContent = key ? message(key) : '';
    status.dataset.state = error ? 'error' : '';
    if (temporary) statusTimer = setTimeout(() => { status.textContent = ''; }, 2500);
  }
  function render(raw) {
    const settings = normalizeSettings(raw);
    copy.checked = settings.copyButtonEnabled;
    url.checked = settings.openUrlEnabled;
    count.checked = settings.characterCountEnabled;
    threshold.value = settings.characterCountThreshold;
    threshold.disabled = !count.checked;
  }
  async function load() {
    fieldset.disabled = true;
    retry.hidden = true;
    setStatus('loading');
    try {
      render(await chrome.storage.sync.get(defaults));
      fieldset.disabled = false;
      setStatus('');
    } catch {
      setStatus('loadFailed', true);
      retry.hidden = false;
    }
  }
  form.addEventListener('input', () => {
    threshold.disabled = !count.checked;
    threshold.setCustomValidity('');
    setStatus('unsaved');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (count.checked && !validThreshold(threshold.value)) {
      threshold.setCustomValidity(message('thresholdHint')); threshold.reportValidity(); return;
    }
    const settings = normalizeSettings({ copyButtonEnabled: copy.checked, openUrlEnabled: url.checked,
      characterCountEnabled: count.checked, characterCountThreshold: threshold.value });
    fieldset.disabled = true;
    setStatus('saving');
    try {
      await chrome.storage.sync.set(settings);
      threshold.value = settings.characterCountThreshold;
      setStatus('saved', false, true);
    } catch { setStatus('saveFailed', true); }
    finally { fieldset.disabled = false; }
  });
  document.querySelector('#reset').addEventListener('click', () => {
    render(defaults); threshold.setCustomValidity(''); setStatus('resetPending');
  });
  retry.addEventListener('click', load);
  load();
})();
