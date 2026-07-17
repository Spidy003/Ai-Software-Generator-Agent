/* ═══════════════════════════════════════════════════════════════════════
   UTILS.JS — Shared utility functions used across all modules
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/**
 * Generates a unique ID string
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Debounce: delays function execution until after wait ms
 */
function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle: limits function to execute at most once per limit ms
 */
function throttle(fn, limit = 200) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable time
 */
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Copy text to clipboard, returns promise
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

/**
 * Get file language icon emoji based on extension
 */
function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    html:   '🌐',
    css:    '🎨',
    js:     '⚡',
    ts:     '💙',
    jsx:    '⚛️',
    tsx:    '⚛️',
    json:   '📋',
    md:     '📝',
    py:     '🐍',
    php:    '🐘',
    java:   '☕',
    go:     '🐹',
    rs:     '🦀',
    vue:    '💚',
    scss:   '💅',
    sass:   '💅',
    xml:    '📄',
    svg:    '🖼️',
    png:    '🖼️',
    jpg:    '🖼️',
    gif:    '🖼️',
    ico:    '🖼️',
    txt:    '📄',
    sh:     '🔧',
    env:    '🔒',
    yml:    '⚙️',
    yaml:   '⚙️',
    sql:    '🗃️',
    graphql:'🔷',
    dockerfile: '🐳',
    gitignore:  '🚫',
  };
  return icons[ext] || '📄';
}

/**
 * Get Monaco language ID from file extension
 */
function getMonacoLanguage(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap = {
    html:       'html',
    css:        'css',
    scss:       'scss',
    sass:       'scss',
    js:         'javascript',
    jsx:        'javascript',
    ts:         'typescript',
    tsx:        'typescript',
    json:       'json',
    md:         'markdown',
    py:         'python',
    php:        'php',
    java:       'java',
    go:         'go',
    rs:         'rust',
    vue:        'html',
    xml:        'xml',
    svg:        'xml',
    sql:        'sql',
    sh:         'shell',
    bash:       'shell',
    yml:        'yaml',
    yaml:       'yaml',
    graphql:    'graphql',
    dockerfile: 'dockerfile',
  };
  return langMap[ext] || 'plaintext';
}

/**
 * Get unique languages from file list
 */
function extractLanguages(files) {
  const langs = new Set();
  files.forEach(f => {
    const ext = f.name.split('.').pop()?.toUpperCase();
    if (ext) langs.add(ext);
  });
  return [...langs];
}

/**
 * Calculate total project size in bytes
 */
function calcProjectSize(files) {
  return files.reduce((total, f) => total + (f.code?.length || 0), 0);
}

/**
 * Format current time as HH:MM:SS
 */
function timeNow() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

/**
 * Date formatted as "Jul 17, 2026 · 8:45 PM"
 */
function dateTimeNow() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Clamps a value between min and max
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Adds ripple effect to a button element
 */
function addRipple(btn) {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
    `;
    btn.classList.add('ripple-container');
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

/**
 * Parse JSON safely — returns null on failure
 */
function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Extract JSON from a string that may contain markdown code blocks
 */
function extractJSON(text) {
  // Try to find JSON in markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    const parsed = safeParseJSON(codeBlockMatch[1]);
    if (parsed) return parsed;
  }

  // Try direct parse
  const direct = safeParseJSON(text);
  if (direct) return direct;

  // Try to find raw JSON object in text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = safeParseJSON(jsonMatch[0]);
    if (parsed) return parsed;
  }

  return null;
}

/**
 * LocalStorage helpers
 */
const Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch { /* noop */ }
  }
};

/**
 * Smooth scroll to element
 */
function scrollToElement(el, offset = 80) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Create DOM element with properties shorthand
 */
function createElement(tag, opts = {}) {
  const el = document.createElement(tag);
  if (opts.className) el.className = opts.className;
  if (opts.id) el.id = opts.id;
  if (opts.text) el.textContent = opts.text;
  if (opts.html) el.innerHTML = opts.html;
  if (opts.attrs) {
    Object.entries(opts.attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }
  return el;
}
