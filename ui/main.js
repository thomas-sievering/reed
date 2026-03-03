const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { getCurrentWindow } = window.__TAURI__.window;

const THEME_KEY = "reed-theme";
const DEFAULT_CONFIG = Object.freeze({
  theme: "dark",
  font_size_px: 16,
  max_content_width_px: 720,
  show_status_bar: true,
});

const content = document.querySelector("#content");
const themeToggle = document.querySelector("#theme-toggle");
const settingsToggle = document.querySelector("#settings-toggle");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsClose = document.querySelector("#settings-close");
const themeField = document.querySelector("#setting-theme");
const fontSizeField = document.querySelector("#setting-font-size");
const fontSizeValue = document.querySelector("#setting-font-size-value");
const maxWidthField = document.querySelector("#setting-max-width");
const maxWidthValue = document.querySelector("#setting-max-width-value");
const showStatusField = document.querySelector("#setting-show-status");
const appWindow = getCurrentWindow();

let currentFilePath = null;
let currentConfig = { ...DEFAULT_CONFIG };
const headingNavigation = {
  headings: [],
  selectedIndex: -1,
  hideTimer: null,
  overlay: null,
  list: null,
  label: null,
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLanding() {
  currentFilePath = null;
  content.innerHTML = `
    <section class="landing" aria-live="polite">
      <p>Drop a markdown file here or open one from the command line</p>
      <button id="open-file" type="button">Open File</button>
    </section>
  `;
  refreshHeadingNavigation();
  hideStatusBar();
  attachOpenButtonHandler();
}

function getScrollPercent() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) {
    return 0;
  }
  return window.scrollY / maxScroll;
}

function restoreScrollPercent(percent) {
  requestAnimationFrame(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * percent, behavior: "auto" });
  });
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

function normalizeConfig(config) {
  const parsedFont = Number.parseInt(`${config?.font_size_px ?? DEFAULT_CONFIG.font_size_px}`, 10);
  const parsedWidth = Number.parseInt(
    `${config?.max_content_width_px ?? DEFAULT_CONFIG.max_content_width_px}`,
    10,
  );

  return {
    theme: normalizeTheme(config?.theme),
    font_size_px: clamp(Number.isNaN(parsedFont) ? DEFAULT_CONFIG.font_size_px : parsedFont, 12, 24),
    max_content_width_px: clamp(
      Number.isNaN(parsedWidth) ? DEFAULT_CONFIG.max_content_width_px : parsedWidth,
      560,
      1100,
    ),
    show_status_bar: typeof config?.show_status_bar === "boolean"
      ? config.show_status_bar
      : DEFAULT_CONFIG.show_status_bar,
  };
}

function applyConfig(config) {
  setTheme(config.theme);
  document.documentElement.style.setProperty("--font-size-px", `${config.font_size_px}px`);
  document.documentElement.style.setProperty("--content-max-width", `${config.max_content_width_px}px`);
  document.body.classList.toggle("hide-status-bar", !config.show_status_bar);
}

function updateSettingsSummary() {
  fontSizeValue.textContent = `${currentConfig.font_size_px}px`;
  maxWidthValue.textContent = `${currentConfig.max_content_width_px}px`;
}

function syncSettingsFields() {
  themeField.value = currentConfig.theme;
  fontSizeField.value = `${currentConfig.font_size_px}`;
  maxWidthField.value = `${currentConfig.max_content_width_px}`;
  showStatusField.checked = currentConfig.show_status_bar;
  updateSettingsSummary();
}

async function persistConfig(config) {
  localStorage.setItem(THEME_KEY, config.theme);

  try {
    await invoke("save_config", { config });
  } catch {
    // localStorage fallback for theme only
  }
}

async function setConfig(nextConfig, { persist = true, syncFields = true } = {}) {
  currentConfig = normalizeConfig(nextConfig);
  applyConfig(currentConfig);

  if (syncFields) {
    syncSettingsFields();
  }

  if (persist) {
    await persistConfig(currentConfig);
  }
}

async function loadInitialConfig() {
  try {
    const loaded = await invoke("load_config");
    return normalizeConfig(loaded);
  } catch {
    return normalizeConfig({
      ...DEFAULT_CONFIG,
      theme: normalizeTheme(localStorage.getItem(THEME_KEY)),
    });
  }
}

async function toggleTheme() {
  const nextTheme = currentConfig.theme === "dark" ? "light" : "dark";
  await setConfig({ ...currentConfig, theme: nextTheme });
}

function filenameFromPath(path) {
  return path.split(/[\\/]/).pop() ?? path;
}

function isMarkdownPath(path) {
  const normalized = path.toLowerCase();
  return normalized.endsWith(".md") || normalized.endsWith(".markdown");
}

async function setWindowTitleForPath(path) {
  const filename = filenameFromPath(path);
  try {
    await invoke("set_window_title", { filename });
  } catch {
    // Best effort
  }
}

function attachOpenButtonHandler() {
  const openFileButton = document.querySelector("#open-file");
  if (!openFileButton) {
    return;
  }

  openFileButton.addEventListener("click", () => {
    void openFileWithDialog();
  });
}

async function startWatching(path) {
  try {
    await invoke("stop_watching");
  } catch {
    // Nothing to stop
  }

  try {
    await invoke("start_watching", { path });
  } catch {
    // Best effort: app still works without watcher
  }
}

function updateStatusBar(stats) {
  if (!currentConfig.show_status_bar) {
    return;
  }

  let bar = document.querySelector("#status-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "status-bar";
    document.body.appendChild(bar);
  }

  bar.textContent = `${stats.words.toLocaleString()} words - ${stats.chars.toLocaleString()} chars - ~${stats.tokens.toLocaleString()} tokens`;
  bar.hidden = false;
}

function hideStatusBar() {
  const bar = document.querySelector("#status-bar");
  if (bar) {
    bar.hidden = true;
  }
}

function ensureHeadingOverlay() {
  if (headingNavigation.overlay) {
    return;
  }

  const overlay = document.createElement("section");
  overlay.id = "heading-nav-overlay";
  overlay.hidden = true;
  overlay.setAttribute("aria-live", "polite");
  overlay.setAttribute("aria-label", "Heading navigation");

  const label = document.createElement("p");
  label.className = "heading-nav-label";
  overlay.appendChild(label);

  const list = document.createElement("ul");
  list.className = "heading-nav-list";
  overlay.appendChild(list);

  document.body.appendChild(overlay);
  headingNavigation.overlay = overlay;
  headingNavigation.list = list;
  headingNavigation.label = label;
}

function hideHeadingOverlay() {
  const overlay = headingNavigation.overlay;
  if (!overlay) {
    return;
  }

  overlay.classList.remove("visible");
  overlay.hidden = true;
}

function scheduleOverlayHide() {
  if (headingNavigation.hideTimer !== null) {
    window.clearTimeout(headingNavigation.hideTimer);
  }

  headingNavigation.hideTimer = window.setTimeout(() => {
    hideHeadingOverlay();
    headingNavigation.hideTimer = null;
  }, 1500);
}

function refreshHeadingNavigation() {
  ensureHeadingOverlay();
  headingNavigation.headings = Array.from(
    content.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  )
    .map((element) => {
      const text = element.textContent?.trim();
      if (!text) {
        return null;
      }

      return {
        element,
        level: Number.parseInt(element.tagName.slice(1), 10),
        text,
      };
    })
    .filter((heading) => heading !== null);

  if (headingNavigation.headings.length === 0) {
    headingNavigation.selectedIndex = -1;
    hideHeadingOverlay();
    return;
  }

  if (headingNavigation.selectedIndex >= headingNavigation.headings.length) {
    headingNavigation.selectedIndex = 0;
  }
}

function renderHeadingOverlay() {
  const { list, label, headings, selectedIndex } = headingNavigation;
  if (!list || !label || headings.length === 0) {
    return;
  }

  list.replaceChildren();
  label.textContent = "Tab/Shift+Tab to navigate headings";

  headings.forEach((heading, index) => {
    const item = document.createElement("li");
    item.className = "heading-nav-item";
    if (index === selectedIndex) {
      item.classList.add("active");
    }

    const badge = document.createElement("span");
    badge.className = "heading-level";
    badge.textContent = `H${heading.level}`;
    item.appendChild(badge);

    const text = document.createElement("span");
    text.className = "heading-text";
    text.textContent = heading.text;
    item.appendChild(text);

    list.appendChild(item);
  });
}

function showHeadingOverlay() {
  const overlay = headingNavigation.overlay;
  if (!overlay) {
    return;
  }

  overlay.hidden = false;
  requestAnimationFrame(() => {
    overlay.classList.add("visible");
  });
}

function navigateHeadings(direction) {
  if (!currentFilePath) {
    return false;
  }

  const total = headingNavigation.headings.length;
  if (total === 0) {
    return false;
  }

  if (headingNavigation.selectedIndex === -1) {
    headingNavigation.selectedIndex = direction > 0 ? 0 : total - 1;
  } else {
    const next = headingNavigation.selectedIndex + direction;
    headingNavigation.selectedIndex = (next + total) % total;
  }

  const currentHeading = headingNavigation.headings[headingNavigation.selectedIndex];
  currentHeading.element.scrollIntoView({ behavior: "smooth", block: "start" });
  renderHeadingOverlay();
  showHeadingOverlay();
  scheduleOverlayHide();
  return true;
}

async function renderPath(path, { preserveScroll = false } = {}) {
  const previousScrollPercent = preserveScroll ? getScrollPercent() : 0;

  const result = await invoke("render_file", { path });
  content.innerHTML = result.html;
  currentFilePath = path;
  refreshHeadingNavigation();
  updateStatusBar(result);

  await setWindowTitleForPath(path);

  if (preserveScroll) {
    restoreScrollPercent(previousScrollPercent);
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  await startWatching(path);
}

async function openFileWithDialog() {
  const selectedPath = await invoke("open_file_dialog");
  if (!selectedPath) {
    return;
  }
  await renderPath(selectedPath);
}

async function manualReload() {
  if (!currentFilePath) {
    return;
  }
  await renderPath(currentFilePath, { preserveScroll: true });
}

function openSettingsDialog() {
  if (settingsDialog.open) {
    return;
  }
  syncSettingsFields();
  settingsDialog.showModal();
}

function closeSettingsDialog() {
  if (!settingsDialog.open) {
    return;
  }
  settingsDialog.close();
}

function registerSettings() {
  settingsToggle.addEventListener("click", () => {
    openSettingsDialog();
  });

  settingsClose.addEventListener("click", () => {
    closeSettingsDialog();
  });

  settingsDialog.addEventListener("click", (event) => {
    const rect = settingsDialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;

    if (!inside) {
      closeSettingsDialog();
    }
  });

  themeField.addEventListener("change", () => {
    void setConfig({ ...currentConfig, theme: normalizeTheme(themeField.value) }, { syncFields: false });
  });

  fontSizeField.addEventListener("input", () => {
    const value = Number.parseInt(fontSizeField.value, 10);
    void setConfig({ ...currentConfig, font_size_px: value }, { syncFields: false });
    updateSettingsSummary();
  });

  maxWidthField.addEventListener("input", () => {
    const value = Number.parseInt(maxWidthField.value, 10);
    void setConfig({ ...currentConfig, max_content_width_px: value }, { syncFields: false });
    updateSettingsSummary();
  });

  showStatusField.addEventListener("change", () => {
    void setConfig({ ...currentConfig, show_status_bar: showStatusField.checked }, { syncFields: false });
  });
}

function registerShortcuts() {
  window.addEventListener("keydown", (event) => {
    const cmdOrCtrl = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    const settingsOpen = settingsDialog.open;

    if (event.key === "Escape") {
      if (settingsOpen) {
        event.preventDefault();
        closeSettingsDialog();
        return;
      }
      hideHeadingOverlay();
    }

    if (cmdOrCtrl && key === ",") {
      event.preventDefault();
      openSettingsDialog();
      return;
    }

    if (settingsOpen) {
      return;
    }

    if (event.key === "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const direction = event.shiftKey ? -1 : 1;
      if (navigateHeadings(direction)) {
        event.preventDefault();
        return;
      }
    }

    if (cmdOrCtrl && key === "d") {
      event.preventDefault();
      void toggleTheme();
      return;
    }

    if (cmdOrCtrl && key === "o") {
      event.preventDefault();
      void openFileWithDialog();
      return;
    }

    if (cmdOrCtrl && key === "w") {
      event.preventDefault();
      void appWindow.close();
      return;
    }

    if (cmdOrCtrl && key === "q") {
      event.preventDefault();
      void invoke("quit_app");
      return;
    }

    if (event.key === "F5") {
      event.preventDefault();
      void manualReload();
    }
  });
}

function registerDragAndDrop() {
  // Tauri v2 drag-drop event
  if (typeof appWindow.onDragDropEvent === "function") {
    appWindow.onDragDropEvent((event) => {
      if (event.payload.type !== "drop") {
        return;
      }

      const paths = event.payload.paths;
      if (!paths || paths.length === 0) {
        return;
      }

      const path = paths[0];
      if (typeof path === "string" && isMarkdownPath(path)) {
        void renderPath(path);
      }
    });
  }
}

function registerHoverReveal() {
  window.addEventListener("mousemove", (event) => {
    if (event.clientY <= 90) {
      document.body.classList.add("near-top");
    } else {
      document.body.classList.remove("near-top");
    }

    if (event.clientY >= window.innerHeight - 50) {
      document.body.classList.add("near-bottom");
    } else {
      document.body.classList.remove("near-bottom");
    }
  });

  window.addEventListener("mouseleave", () => {
    document.body.classList.remove("near-top");
    document.body.classList.remove("near-bottom");
  });
}

async function registerTauriEvents() {
  await listen("file-opened", async (event) => {
    const path = event.payload;
    if (typeof path !== "string") {
      return;
    }
    await renderPath(path);
  });

  await listen("file-changed", (event) => {
    const result = event.payload;
    if (!result || typeof result.html !== "string") {
      return;
    }

    const previousScrollPercent = getScrollPercent();
    content.innerHTML = result.html;
    refreshHeadingNavigation();
    updateStatusBar(result);
    restoreScrollPercent(previousScrollPercent);
  });

  await listen("file-deleted", (event) => {
    const path = event.payload;
    const displayPath = typeof path === "string" ? path : "the current file";
    const previousScrollPercent = getScrollPercent();
    content.innerHTML = `<p class="error">File not found: <code>${escapeHtml(displayPath)}</code></p>`;
    refreshHeadingNavigation();
    restoreScrollPercent(previousScrollPercent);
  });
}

async function init() {
  ensureHeadingOverlay();
  const loadedConfig = await loadInitialConfig();
  await setConfig(loadedConfig, { persist: false });

  themeToggle.addEventListener("click", () => {
    void toggleTheme();
  });

  registerSettings();
  registerShortcuts();
  registerDragAndDrop();
  registerHoverReveal();
  await registerTauriEvents();
}

renderLanding();
void init().then(async () => {
  const initialFile = await invoke("get_initial_file");
  if (initialFile) {
    await renderPath(initialFile);
  }
});
