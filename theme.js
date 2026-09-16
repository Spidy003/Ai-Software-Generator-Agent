/* ═══════════════════════════════════════════════════════════════════════
   THEME.JS — Dark / Light theme toggle with persistence
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const ThemeManager = (() => {
  const STORAGE_KEY = 'aisg-theme';
  const DARK = 'dark-theme';
  const LIGHT = 'light-theme';

  let currentTheme = DARK;

  function getPreferred() {
    const saved = Storage.get(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT : DARK;
  }

  function apply(theme) {
    const body = document.getElementById('app-body');
    if (!body) return;
    body.classList.remove(DARK, LIGHT);
    body.classList.add(theme);
    currentTheme = theme;

    // Update all toggle icons
    document.querySelectorAll('.icon-sun').forEach(el => {
      el.style.display = theme === DARK ? 'block' : 'none';
    });
    document.querySelectorAll('.icon-moon').forEach(el => {
      el.style.display = theme === LIGHT ? 'block' : 'none';
    });

    // Update Monaco editor theme if available
    if (window.monacoEditor) {
      const monacoTheme = theme === DARK ? 'ai-dark' : 'ai-light';
      try {
        monaco.editor.setTheme(monacoTheme);
      } catch { /* noop */ }
    }

    Storage.set(STORAGE_KEY, theme);
  }

  function toggle() {
    const next = currentTheme === DARK ? LIGHT : DARK;
    apply(next);
    showToast(`Switched to ${next === DARK ? 'Dark' : 'Light'} mode`, 'info', '🌓');
  }

  function init() {
    const theme = getPreferred();
    apply(theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);

    const btnHome = document.getElementById('theme-toggle-home');
    if (btnHome) btnHome.addEventListener('click', toggle);

    const btnNotch = document.getElementById('theme-toggle-notch');
    if (btnNotch) btnNotch.addEventListener('click', toggle);

    const btnNotchMobile = document.getElementById('theme-toggle-notch-mobile');
    if (btnNotchMobile) btnNotchMobile.addEventListener('click', toggle);
  }

  function isDark() {
    return currentTheme === DARK;
  }

  return { init, toggle, apply, isDark, getPreferred };
})();

document.addEventListener('DOMContentLoaded', ThemeManager.init);
