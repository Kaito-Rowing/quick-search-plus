const DEFAULT_SETTINGS = {
  characterCountEnabled: true,
  characterCountThreshold: 30
};

const form = document.querySelector('#settings-form');
const enabledInput = document.querySelector('#count-enabled');
const thresholdInput = document.querySelector('#count-threshold');
const statusElement = document.querySelector('#status');

function normalizeThreshold(value) {
  const threshold = Number.parseInt(value, 10);

  if (!Number.isFinite(threshold) || threshold < 1) {
    return DEFAULT_SETTINGS.characterCountThreshold;
  }

  return threshold;
}

function setStatus(message) {
  statusElement.textContent = message;

  if (message) {
    window.setTimeout(() => {
      statusElement.textContent = '';
    }, 1600);
  }
}

function renderSettings(settings) {
  enabledInput.checked = settings.characterCountEnabled !== false;
  thresholdInput.value = String(normalizeThreshold(settings.characterCountThreshold));
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    if (chrome.runtime.lastError) {
      setStatus('Could not load settings.');
      return;
    }

    renderSettings(settings);
  });
}

function saveSettings(event) {
  event.preventDefault();

  const settings = {
    characterCountEnabled: enabledInput.checked,
    characterCountThreshold: normalizeThreshold(thresholdInput.value)
  };

  thresholdInput.value = String(settings.characterCountThreshold);

  chrome.storage.sync.set(settings, () => {
    if (chrome.runtime.lastError) {
      setStatus('Could not save settings.');
      return;
    }

    setStatus('Saved.');
  });
}

form.addEventListener('submit', saveSettings);
document.addEventListener('DOMContentLoaded', loadSettings);
