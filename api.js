/* ═══════════════════════════════════════════════════════════════════════
   API.JS — Gemini API integration, prompt building, response parsing
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const APIManager = (() => {
  const STORAGE_KEY = 'aisg-api-key';
  const MODEL_ID = 'gemini-3.8-flash';
  const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
  const DEFAULT_KEY = ''; // Enter your API key in the settings panel
  
  let apiKey = DEFAULT_KEY;

  let isGenerating = false;
  let startTime = 0;

  /* ── API KEY ──────────────────────────────────────────────── */
  function loadKey() {
    // Use saved key from storage, fall back to pre-configured default key
    const saved = Storage.get(STORAGE_KEY, '');
    apiKey = saved || DEFAULT_KEY;
    const input = document.getElementById('api-key-input');
    if (input) input.value = apiKey;
  }

  function saveKey() {
    const input = document.getElementById('api-key-input');
    if (!input) return;
    const key = input.value.trim();
    if (!key) {
      showToast('Please enter a valid API key', 'error', '🔑');
      return;
    }
    apiKey = key;
    Storage.set(STORAGE_KEY, key);
    showToast('API key saved successfully!', 'success', '🔑');
  }

  function getKey() { return apiKey; }
  function hasKey() { return !!apiKey && apiKey.length > 10; }

  /* ── PROMPT BUILDER ───────────────────────────────────────── */
  function buildSystemPrompt() {
    return `You are an elite front-end software engineer AI. Your task is to generate COMPLETE, real-world, production-ready websites that run DIRECTLY in a browser with zero build steps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — BROWSER-NATIVE FILES ONLY (ABSOLUTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every file MUST be .html, .css, .js, or .md. NEVER generate:
  ✗ .ts, .tsx, .jsx files
  ✗ vite.config.*, tsconfig.json, postcss.config.js
  ✗ package.json with npm dependencies
  ✗ Any file requiring "npm install" or a build step
  ✗ ES module import/export referencing node_modules

If the user requests React, Vite, TypeScript, Tailwind, Framer Motion, Lucide, or any npm package — implement the equivalent with CDN tags in vanilla HTML/CSS/JS. Non-negotiable.

CDN EQUIVALENTS:
  • Tailwind CSS   → <script src="https://cdn.tailwindcss.com"></script> + inline tailwind.config script
  • Lucide Icons   → <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script> + lucide.createIcons()
  • GSAP/Animations→ <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  • ScrollTrigger  → <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  • Alpine.js      → <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
  • AOS            → <link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css"> + <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
  • Swiper         → <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"> + <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
  • Google Fonts   → <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2 — MULTI-PAGE NAVIGATION: USE SPA ROUTING (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER link to separate .html files (e.g. href="about.html") because those files cannot be loaded in a preview iframe. If a user doesn't click links because pages don't exist, the project is BROKEN and USELESS.

ALWAYS build multi-page sites as a Single-Page Application (SPA) inside ONE index.html:
  1. Each "page" is a <section id="page-home" class="page"> ... </section> div
  2. Only one page is visible at a time using CSS: .page { display: none } .page.active { display: block }
  3. A router function in JS handles navigation:
     function showPage(id) {
       document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
       document.getElementById('page-' + id).classList.add('active');
       window.scrollTo(0, 0);
     }
  4. ALL nav links use onclick="showPage('about')" — NEVER href="about.html"
  5. Buttons like "Learn More", "View Projects", "Contact Us" etc. must ALL be wired up with showPage() calls
  6. Every page referenced in the nav MUST have full, real content — not a placeholder, not "coming soon"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 3 — COMPLETE, REAL-WORLD WEBSITE CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build websites that feel REAL and USABLE — as if a real business would actually use them. This means:

EVERY PAGE must have FULL content:
  • Home       → Hero, features grid, testimonials, stats counter, CTA section
  • About      → Story/mission, team members with photos (use UI avatars or CSS), timeline, values
  • Services   → Cards for each service with icons, pricing table
  • Portfolio  → Filterable gallery/grid with category tabs, lightbox on click
  • Blog       → Article cards with category, date, read time; clicking opens full article view
  • Contact    → Working form with validation, Google Maps embed or stylized map, contact info
  • Pricing    → Tiered plans with feature comparison table, toggle monthly/annual

INTERACTIVE FEATURES to implement:
  • Mobile hamburger menu that opens/closes a full nav
  • Sticky header that changes style on scroll
  • Smooth page transitions (fade in/out)
  • Scroll-triggered animations (use AOS or Intersection Observer)
  • Counters that animate to their number when scrolled into view
  • Image carousels/sliders (use Swiper CDN)
  • Working contact form with client-side validation and success/error states
  • Dark/Light mode toggle (persisted in localStorage)
  • Back-to-top button
  • Portfolio filter tabs with animated grid re-layout
  • FAQ accordion
  • Cookie consent banner
  • Loading screen animation
  • Testimonial slider

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 4 — PREMIUM DESIGN STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Use curated, modern color palettes — NOT plain red/blue/green
  • Load Google Fonts (Inter, Plus Jakarta Sans, Outfit, or similar)
  • CSS custom properties for all colors, spacing, radius
  • Glassmorphism, neumorphism, or gradient cards where appropriate
  • Micro-animations on hover, focus, and scroll
  • Hero with gradient background, animated particles or floating shapes
  • Cards with depth (box-shadow, hover lift)
  • Consistent spacing system (8px grid)
  • Fully responsive (mobile 320px → desktop 1920px)
  • Burger menu on mobile with smooth slide-in
  • Footer with links, social icons, newsletter form, copyright

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 5 — OUTPUT FORMAT (STRICT JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS respond with ONLY valid JSON. No markdown. No prose. No explanation.
{
  "project_name": "Project Name",
  "description": "Brief description",
  "framework": "HTML/CSS/JS",
  "files": [
    { "name": "index.html", "language": "html", "code": "<!DOCTYPE html>..." },
    { "name": "assets/css/styles.css", "language": "css", "code": "..." },
    { "name": "js/router.js", "language": "javascript", "code": "..." },
    { "name": "js/animations.js", "language": "javascript", "code": "..." },
    { "name": "js/app.js", "language": "javascript", "code": "..." },
    { "name": "README.md", "language": "markdown", "code": "..." }
  ]
}

File organization — use subdirectories:
  index.html           ← main SPA shell with ALL page sections inside it
  assets/css/          ← styles.css (main), animations.css, components.css
  js/                  ← router.js, animations.js, app.js, components.js
  README.md

NEVER:
  - Return markdown or prose
  - Leave TODO comments, placeholders, or "Coming Soon" content
  - Return partial or truncated code
  - Link to pages that don't exist as SPA sections
  - Create nav items without fully building that page's content
  - Generate .ts, .tsx, .jsx, vite.config, tsconfig, or build-tool files`;
  }


  /* ── STATUS UPDATE ────────────────────────────────────────── */
  function setStatus(status, text) {
    const dot = document.querySelector('.status-dot');
    const span = document.getElementById('ai-status-text');
    if (dot) {
      dot.className = `status-dot status-${status}`;
    }
    if (span) span.textContent = text;
  }

  function updateTokenDisplay(text) {
    const el = document.getElementById('token-display');
    if (el) el.textContent = text;
  }

  function updateGenTime(ms) {
    const el = document.getElementById('gen-time-display');
    if (el) el.textContent = formatTime(ms);
  }

  /* ── LOADING ANIMATION ────────────────────────────────────── */
  const loadingSteps = [
    'Analyzing Request...',
    'Planning Project Structure...',
    'Generating HTML Components...',
    'Writing CSS Styles...',
    'Adding JavaScript Logic...',
    'Finalizing & Packaging...',
  ];

  let stepTimer = null;
  let currentStep = 0;

  function startLoadingAnimation() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';

    currentStep = 0;
    updateLoadingStep(0);

    stepTimer = setInterval(() => {
      currentStep = Math.min(currentStep + 1, loadingSteps.length - 1);
      updateLoadingStep(currentStep);
    }, 1800);
  }

  function updateLoadingStep(idx) {
    const mainText = document.getElementById('loading-main-text');
    if (mainText) mainText.textContent = loadingSteps[idx];

    for (let i = 0; i < loadingSteps.length; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (!stepEl) continue;
      stepEl.className = 'loading-step';
      if (i < idx) stepEl.classList.add('done');
      else if (i === idx) stepEl.classList.add('active');
    }
  }

  function stopLoadingAnimation() {
    if (stepTimer) {
      clearInterval(stepTimer);
      stepTimer = null;
    }
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  /* ── PROJECT INFO PANEL UPDATE ────────────────────────────── */
  function updateProjectPanel(project) {
    const nameEl = document.getElementById('project-name-display');
    const filesEl = document.getElementById('files-count-display');
    const langEl = document.getElementById('lang-tags-display');
    const projCard = document.getElementById('current-project-card');
    const filesCard = document.getElementById('files-info-card');
    const langCard = document.getElementById('lang-info-card');

    if (nameEl) nameEl.textContent = project.project_name || '—';
    if (filesEl) filesEl.textContent = `${project.files?.length || 0} files`;

    if (langEl && project.files) {
      const langs = extractLanguages(project.files);
      langEl.innerHTML = langs.map(l =>
        `<span class="lang-tag">${l}</span>`
      ).join('');
    }

    if (projCard) projCard.style.display = 'block';
    if (filesCard) filesCard.style.display = 'block';
    if (langCard) langCard.style.display = 'block';

    // IDE meta
    const ideMeta = document.getElementById('ide-project-meta');
    if (ideMeta && project.files) {
      const langs = extractLanguages(project.files);
      ideMeta.textContent = `${project.files.length} files · ${langs.join(', ')}`;
    }
  }

  /* ── GENERATE WORKFLOW ────────────────────────────────────── */
  async function generate(userPrompt, chatId, existingProject = null) {
    if (isGenerating) {
      showToast('Already generating. Please wait.', 'warning', '⏳');
      return null;
    }

    if (!hasKey()) {
      showToast('Please enter your NETRUNNER-Ai API key in the right panel first.', 'error', '🔑');
      return null;
    }

    isGenerating = true;
    startTime = Date.now();

    try {
      setStatus('loading', 'Generating...');
      startLoadingAnimation();

      // Disable send button
      const sendBtn = document.getElementById('send-btn');
      if (sendBtn) sendBtn.disabled = true;

      const systemPrompt = buildSystemPrompt();
      let fullPrompt = `${systemPrompt}\n\nUser request: ${userPrompt}`;

      if (existingProject && existingProject.files && existingProject.files.length > 0) {
        fullPrompt += `\n\n--- EXISTING PROJECT TO MODIFY ---\n`;
        fullPrompt += `You are modifying an existing project. The user request is an instruction to change the codebase below. \n`;
        fullPrompt += `IMPORTANT: Return the FULL updated JSON array containing ALL files (both the modified ones and the untouched ones). Do not output partial files or omit unchanged files.\n`;
        fullPrompt += `Current project name: ${existingProject.project_name}\n\n`;
        fullPrompt += `Existing files JSON:\n`;
        fullPrompt += JSON.stringify(existingProject.files, null, 2);
      }

      const response = await fetch(
        `${API_BASE}/${MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 65536,
              topK: 40,
              topP: 0.95,
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'object',
                properties: {
                  project_name: { type: 'string' },
                  description: { type: 'string' },
                  framework: { type: 'string' },
                  files: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        language: { type: 'string' },
                        code: { type: 'string' }
                      },
                      required: ['name', 'language', 'code']
                    }
                  }
                },
                required: ['project_name', 'description', 'framework', 'files']
              }
            }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message = errData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`NETRUNNER-Ai API Error: ${message}`);
      }

      const data = await response.json();
      const elapsed = Date.now() - startTime;

      // Extract text
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from NETRUNNER-Ai');

      // Token info
      const promptTokens = data?.usageMetadata?.promptTokenCount || 0;
      const outputTokens = data?.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = promptTokens + outputTokens;

      updateGenTime(elapsed);
      updateTokenDisplay(`${totalTokens.toLocaleString()} tokens`);

      // Parse JSON
      console.log('[APIManager] Raw text received:', rawText);
      const project = extractJSON(rawText);

      if (!project || !project.files || !Array.isArray(project.files)) {
        throw new Error('Invalid project structure returned by AI. Please try again.');
      }

      if (project.files.length === 0) {
        throw new Error('No files were generated. Please refine your prompt.');
      }

      // Ensure README exists
      ensureReadme(project);

      setStatus('active', 'Done');
      updateProjectPanel(project);

      return { project, elapsed, totalTokens };

    } catch (err) {
      setStatus('error', 'Error');
      console.error('[APIManager] Generation error:', err);
      throw err;
    } finally {
      isGenerating = false;
      stopLoadingAnimation();
      const sendBtn = document.getElementById('send-btn');
      if (sendBtn) sendBtn.disabled = false;
      setTimeout(() => setStatus('idle', 'Ready'), 3000);
    }
  }

  /* ── ENSURE README ────────────────────────────────────────── */
  function ensureReadme(project) {
    const hasReadme = project.files.some(f =>
      f.name.toLowerCase() === 'readme.md'
    );
    if (!hasReadme) {
      project.files.push({
        name: 'README.md',
        language: 'markdown',
        code: `# ${project.project_name || 'Generated Project'}\n\n${project.description || ''}\n\n## Getting Started\n\nOpen \`index.html\` in your browser to run the project.\n\n## Generated By\n\nNETRUNNER-Ai (AI Software Generator)\n`
      });
    }
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    loadKey();

    const saveBtn = document.getElementById('save-api-btn');
    const eyeBtn = document.getElementById('api-eye-btn');
    const keyInput = document.getElementById('api-key-input');

    if (saveBtn) saveBtn.addEventListener('click', saveKey);

    if (eyeBtn && keyInput) {
      eyeBtn.addEventListener('click', () => {
        const isHidden = keyInput.type === 'password';
        keyInput.type = isHidden ? 'text' : 'password';
      });
    }
  }

  return {
    init,
    generate,
    hasKey,
    getKey,
    saveKey,
    isGenerating: () => isGenerating,
  };
})();

document.addEventListener('DOMContentLoaded', APIManager.init);
