/* ═══════════════════════════════════════════════════════════════════════
   API.JS — Gemini API integration, prompt building, response parsing
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const APIManager = (() => {
  const STORAGE_KEY = 'aisg-api-key';
  const MODEL_ID = 'gemini-3.1-flash-lite';
  const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
  const DEFAULT_KEY = 'AIzaSyCLhJVlXuPXBXfZTFBGfqdBJVX55iXPpXc'; // pre-configured

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
    return `You are an elite full-stack software engineer AI. Your task is to generate COMPLETE, working software projects.

CRITICAL RULES:
1. ALWAYS respond with ONLY valid JSON. Never use markdown. Never add prose.
2. The JSON must follow this exact structure:
{
  "project_name": "Project Name",
  "description": "Brief description of what was built",
  "framework": "HTML/CSS/JS or React etc.",
  "files": [
    {
      "name": "index.html",
      "language": "html",
      "code": "<!DOCTYPE html>..."
    },
    {
      "name": "styles.css", 
      "language": "css",
      "code": "..."
    },
    {
      "name": "script.js",
      "language": "javascript",
      "code": "..."
    }
  ]
}

QUALITY REQUIREMENTS:
- Generate COMPLETE, production-ready code. No placeholders. No "// TODO".
- Use modern, beautiful design with CSS variables, flexbox/grid, animations.
- Include ALL files needed for the project to work.
- For HTML projects: include index.html, styles.css, script.js at minimum.
- Add a README.md explaining the project.
- Code must be fully functional and self-contained.
- Use beautiful UI with gradients, shadows, hover effects.
- Make it look professional and modern.
- Ensure responsive design (works on mobile and desktop).
- Use semantic HTML and accessible markup.

NEVER:
- Return markdown
- Use FILE: prefix
- Leave TODO comments
- Return partial code
- Skip important files`;
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
      showToast('Please enter your Gemini API key in the right panel first.', 'error', '🔑');
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
              maxOutputTokens: 8192,
              topK: 40,
              topP: 0.95,
            }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message = errData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Gemini API Error: ${message}`);
      }

      const data = await response.json();
      const elapsed = Date.now() - startTime;

      // Extract text
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      // Token info
      const promptTokens = data?.usageMetadata?.promptTokenCount || 0;
      const outputTokens = data?.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = promptTokens + outputTokens;

      updateGenTime(elapsed);
      updateTokenDisplay(`${totalTokens.toLocaleString()} tokens`);

      // Parse JSON
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
        code: `# ${project.project_name || 'Generated Project'}\n\n${project.description || ''}\n\n## Getting Started\n\nOpen \`index.html\` in your browser to run the project.\n\n## Generated By\n\nAI Software Generator — Powered by Gemini AI\n`
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
