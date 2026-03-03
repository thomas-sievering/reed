const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { getCurrentWindow } = window.__TAURI__.window;

const THEME_KEY = "reed-theme";
const DEFAULT_THEME = "dark";

const content = document.querySelector("#content");
const themeToggle = document.querySelector("#theme-toggle");
const appWindow = getCurrentWindow();

let currentFilePath = null;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLanding() {
  content.innerHTML = `
    <section class="landing" aria-live="polite">
      <p>Drop a markdown file here or open one from the command line</p>
      <button id="open-file" type="button">Open File</button>
    </section>
  `;
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

async function loadThemePreference() {
  try {
    const loaded = await invoke("load_config");
    if (loaded?.theme === "light" || loaded?.theme === "dark") {
      return loaded.theme;
    }
  } catch {
    // localStorage fallback
  }

  const local = localStorage.getItem(THEME_KEY);
  if (local === "light" || local === "dark") {
    return local;
  }

  return DEFAULT_THEME;
}

async function saveThemePreference(theme) {
  localStorage.setItem(THEME_KEY, theme);

  try {
    await invoke("save_config", { config: { theme } });
  } catch {
    // localStorage fallback
  }
}

async function toggleTheme() {
  const current = document.body.dataset.theme === "light" ? "light" : "dark";
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  await saveThemePreference(next);
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
  let bar = document.querySelector("#status-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "status-bar";
    document.body.appendChild(bar);
  }
  bar.textContent = `${stats.words.toLocaleString()} words · ${stats.chars.toLocaleString()} chars · ~${stats.tokens.toLocaleString()} tokens`;
  bar.hidden = false;
}

function hideStatusBar() {
  const bar = document.querySelector("#status-bar");
  if (bar) {
    bar.hidden = true;
  }
}

async function renderPath(path, { preserveScroll = false } = {}) {
  const previousScrollPercent = preserveScroll ? getScrollPercent() : 0;

  const result = await invoke("render_file", { path });
  content.innerHTML = result.html;
  currentFilePath = path;
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

function registerShortcuts() {
  window.addEventListener("keydown", (event) => {
    const cmdOrCtrl = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

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
    updateStatusBar(result);
    restoreScrollPercent(previousScrollPercent);
  });

  await listen("file-deleted", (event) => {
    const path = event.payload;
    const displayPath = typeof path === "string" ? path : "the current file";
    const previousScrollPercent = getScrollPercent();
    content.innerHTML = `<p class="error">File not found: <code>${escapeHtml(displayPath)}</code></p>`;
    restoreScrollPercent(previousScrollPercent);
  });
}

async function init() {
  const preferredTheme = await loadThemePreference();
  setTheme(preferredTheme);

  themeToggle.addEventListener("click", () => {
    void toggleTheme();
  });

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
