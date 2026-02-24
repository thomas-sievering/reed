import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

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

async function renderPath(path, { preserveScroll = false } = {}) {
  const previousScrollPercent = preserveScroll ? getScrollPercent() : 0;

  const html = await invoke("render_file", { path });
  content.innerHTML = html;
  currentFilePath = path;

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

function extractDroppedPath(event) {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const dropped = files[0];
    if (typeof dropped.path === "string" && dropped.path.length > 0) {
      return dropped.path;
    }
  }

  const uriList = event.dataTransfer?.getData("text/uri-list");
  if (!uriList) {
    return null;
  }

  const first = uriList.split("\n").find((line) => line && !line.startsWith("#"));
  if (!first) {
    return null;
  }

  try {
    const url = new URL(first.trim());
    if (url.protocol !== "file:") {
      return null;
    }
    return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
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

    if ((cmdOrCtrl && key === "w") || (cmdOrCtrl && key === "q")) {
      event.preventDefault();
      void appWindow.close();
      return;
    }

    if (event.key === "F5") {
      event.preventDefault();
      void manualReload();
    }
  });
}

function registerDragAndDrop() {
  window.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  window.addEventListener("drop", (event) => {
    event.preventDefault();
    const path = extractDroppedPath(event);
    if (!path) {
      return;
    }
    void renderPath(path);
  });
}

function registerTopHoverReveal() {
  window.addEventListener("mousemove", (event) => {
    if (event.clientY <= 90) {
      document.body.classList.add("near-top");
    } else {
      document.body.classList.remove("near-top");
    }
  });

  window.addEventListener("mouseleave", () => {
    document.body.classList.remove("near-top");
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
    const html = event.payload;
    if (typeof html !== "string") {
      return;
    }

    const previousScrollPercent = getScrollPercent();
    content.innerHTML = html;
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

  attachOpenButtonHandler();
  registerShortcuts();
  registerDragAndDrop();
  registerTopHoverReveal();
  await registerTauriEvents();
}

renderLanding();
void init();
