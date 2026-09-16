/* ═══════════════════════════════════════════════════════════════════════
   ANIMATIONS.JS — Simple, Lightweight & Fast Helper Scripts
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

// Auto-resize prompt textarea
function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  });
}

function initHudTicker() {
  const ticker = document.getElementById('hud-ticker-text');
  if (!ticker) return;

  const logs = [
    "Neural pipeline listening. Enter prompt on the right to synthesize complete web software...",
    "4x Display Pods synchronized on channel 01 [HTML5/CSS3/JS stream active]...",
    "Gemini 2.5 Flash neural core ready. Response latency: 14ms...",
    "Direct browser compilation primed. Live preview sandbox ready...",
    "Prompt suggestion chips available: Netflix, Banking, Restaurant, Store, Portfolio..."
  ];

  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % logs.length;
    ticker.style.opacity = '0';
    setTimeout(() => {
      ticker.textContent = logs[idx];
      ticker.style.opacity = '1';
    }, 280);
  }, 4200);
}

/* ═══════════════════════════════════════════════════════════════════════
   VENGEANCEUI ASCII GLITCH RIPPLE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const WAVE_THRESH = 3;
const CHAR_MULT = 3;
const ANIM_STEP = 40;
const WAVE_BUF = 5;
const DEFAULT_CHARS = '.,·-─~+:;=*π""┐┌┘┴┬╗╔╝╚╬╠╣╩╦║░▒▓█▄▀▌▐■!?&#$@0123456789*';

function attachAsciiGlitchRipple(el, options = {}) {
  const dur = options.dur || 1000;
  const chars = options.chars || DEFAULT_CHARS;
  const preserveSpaces = options.preserveSpaces !== false;
  const spread = options.spread || 1.0;

  let origTxt = el.textContent.trim();
  if (!origTxt) return;
  let origChars = origTxt.split('');
  let isAnim = false;
  let cursorPos = 0;
  let waves = [];
  let animId = null;
  let isHover = false;
  let origW = null;

  function updateCursorPos(e) {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const len = origTxt.length;
    if (len === 0 || rect.width === 0) return;
    const pos = Math.round((x / rect.width) * len);
    cursorPos = Math.max(0, Math.min(pos, len - 1));
  }

  function stop() {
    el.textContent = origTxt;
    el.classList.remove('as');
    if (origW !== null) {
      el.style.width = '';
      origW = null;
    }
    isAnim = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function calcWaveEffect(charIdx, t) {
    let shouldAnim = false;
    let resultChar = origChars[charIdx];

    for (const w of waves) {
      const age = t - w.startTime;
      const prog = Math.min(age / dur, 1);
      const dist = Math.abs(charIdx - w.startPos);
      const maxDist = Math.max(w.startPos, origChars.length - w.startPos - 1);
      const rad = (prog * (maxDist + WAVE_BUF)) / spread;

      if (dist <= rad) {
        shouldAnim = true;
        const intens = Math.max(0, rad - dist);
        if (intens <= WAVE_THRESH && intens > 0) {
          const index = (dist * CHAR_MULT + Math.floor(age / ANIM_STEP)) % chars.length;
          resultChar = chars[index];
        }
      }
    }

    return { shouldAnim, char: resultChar };
  }

  function genScrambledTxt(t) {
    return origChars
      .map((char, i) => {
        if (preserveSpaces && char === ' ') return ' ';
        const res = calcWaveEffect(i, t);
        return res.shouldAnim ? res.char : char;
      })
      .join('');
  }

  function start() {
    if (isAnim) return;

    if (origW === null) {
      origW = el.getBoundingClientRect().width;
      el.style.width = `${origW}px`;
    }

    isAnim = true;
    el.classList.add('as');

    function animate() {
      const t = Date.now();
      waves = waves.filter((w) => t - w.startTime < dur);

      if (waves.length === 0) {
        stop();
        return;
      }

      el.textContent = genScrambledTxt(t);
      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
  }

  function startWave() {
    if (!isAnim) {
      origTxt = el.textContent;
      origChars = origTxt.split('');
    }
    waves.push({
      startPos: cursorPos,
      startTime: Date.now(),
      id: Math.random()
    });

    if (!isAnim) start();
  }

  el.addEventListener('mouseenter', (e) => {
    isHover = true;
    updateCursorPos(e);
    startWave();
  });

  el.addEventListener('mousemove', (e) => {
    if (!isHover) return;
    const old = cursorPos;
    updateCursorPos(e);
    if (cursorPos !== old) startWave();
  });

  el.addEventListener('mouseleave', () => {
    isHover = false;
  });
}

function initAllAsciiGlitches() {
  const selectors = [
    '.brand-name',
    '.notch-logo-text',
    '.hero-title-accent',
    '.hero-eyebrow',
    '.btn-generate span',
    '.pop-button span',
    '.btn-clean-ghost',
    '.notch-link span',
    '.notch-login-btn span',
    '.notch-signup-btn span',
    '.retro-chip',
    '.stat-label',
    '.nav-badge',
    '.hud-sys-name',
    '.hud-metric-value',
    '.hud-metric-label',
    '.studio-3d-badge span',
    '.welcome-badge',
    '.ascii-glitch'
  ];

  document.querySelectorAll(selectors.join(', ')).forEach((el) => {
    if (el.dataset.asciiInit) return;
    el.dataset.asciiInit = 'true';
    el.classList.add('ascii-glitch-text');
    attachAsciiGlitchRipple(el);
  });
}

function initSimpleUI() {
  const homeInput = document.getElementById('hero-prompt-input');
  const chatInput = document.getElementById('prompt-input');

  autoResizeTextarea(homeInput);
  autoResizeTextarea(chatInput);
  initHudTicker();
  initAllAsciiGlitches();
}

document.addEventListener('DOMContentLoaded', initSimpleUI);
