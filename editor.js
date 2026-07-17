/* ═══════════════════════════════════════════════════════════════════════
   EDITOR.JS — Monaco Editor integration with tabs, themes, copy
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const EditorManager = (() => {
  let editor = null;
  let monacoLoaded = false;
  let currentFile = null;
  let openTabs = []; // [{ file, model }]
  let currentProject = null;

  /* ── MONACO INITIALIZATION ────────────────────────────────── */
  function initMonaco() {
    return new Promise((resolve) => {
      if (monacoLoaded) { resolve(); return; }

      require.config({
        paths: {
          vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
        }
      });

      window.MonacoEnvironment = {
        getWorkerUrl: () =>
          `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = { baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/' };
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/base/worker/workerMain.js');
          `)}`
      };

      require(['vs/editor/editor.main'], () => {
        monacoLoaded = true;
        defineCustomThemes();
        createEditor();
        resolve();
      });
    });
  }

  /* ── CUSTOM THEMES ────────────────────────────────────────── */
  function defineCustomThemes() {
    monaco.editor.defineTheme('ai-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',  foreground: '5a6480', fontStyle: 'italic' },
        { token: 'keyword',  foreground: '7A5CFF', fontStyle: 'bold' },
        { token: 'string',   foreground: '36FF8B' },
        { token: 'number',   foreground: '00F5FF' },
        { token: 'type',     foreground: '5B8CFF' },
        { token: 'function', foreground: 'FFB347' },
        { token: 'variable', foreground: 'E2E8F0' },
        { token: 'tag',      foreground: 'FF5D7A' },
        { token: 'attribute.name', foreground: '5B8CFF' },
        { token: 'attribute.value', foreground: '36FF8B' },
      ],
      colors: {
        'editor.background':          '#080d24',
        'editor.foreground':          '#E2E8F0',
        'editor.lineHighlightBackground': 'rgba(91,140,255,0.06)',
        'editor.selectionBackground': 'rgba(91,140,255,0.3)',
        'editorCursor.foreground':    '#5B8CFF',
        'editorLineNumber.foreground':'#3a4060',
        'editorLineNumber.activeForeground': '#5B8CFF',
        'editor.inactiveSelectionBackground': 'rgba(91,140,255,0.15)',
        'editorGutter.background':    '#080d24',
        'scrollbarSlider.background': 'rgba(255,255,255,0.08)',
        'scrollbarSlider.hoverBackground': 'rgba(255,255,255,0.15)',
        'minimap.background':         '#060b1e',
      }
    });

    monaco.editor.defineTheme('ai-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#f8faff',
        'editor.foreground': '#0d1117',
      }
    });
  }

  /* ── CREATE EDITOR INSTANCE ───────────────────────────────── */
  function createEditor() {
    const container = document.getElementById('monaco-container');
    if (!container) return;

    const isDark = ThemeManager.isDark();

    editor = monaco.editor.create(container, {
      value: '// Select a file from the explorer to view its code',
      language: 'plaintext',
      theme: isDark ? 'ai-dark' : 'ai-light',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      lineHeight: 22,
      minimap: { enabled: true, scale: 1 },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      padding: { top: 16, bottom: 16 },
      renderLineHighlight: 'line',
      cursorStyle: 'line',
      cursorWidth: 2,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      renderWhitespace: 'selection',
      readOnly: false,
      contextmenu: true,
      copyWithSyntaxHighlighting: true,
    });

    window.monacoEditor = editor;

    // Handle resize
    window.addEventListener('resize', () => editor.layout());
  }

  /* ── OPEN FILE IN EDITOR ──────────────────────────────────── */
  function openFile(file) {
    if (!editor) {
      initMonaco().then(() => openFile(file));
      return;
    }

    currentFile = file;

    // Check if tab already open
    let tab = openTabs.find(t => t.file.name === file.name);

    if (!tab) {
      // Create new Monaco model
      const lang = getMonacoLanguage(file.name);
      const uri  = monaco.Uri.parse(`file:///${file.name}`);
      let model  = monaco.editor.getModel(uri);

      if (!model) {
        model = monaco.editor.createModel(file.code || '', lang, uri);
      }

      // Sync manual edits back to the file object instantly
      model.onDidChangeContent(() => {
        if (tab && tab.file) {
          tab.file.code = model.getValue();
        }
      });

      tab = { file, model };
      openTabs.push(tab);
    }

    editor.setModel(tab.model);
    editor.focus();

    renderTabs();
    highlightActiveTab(file.name);
  }

  /* ── TABS ─────────────────────────────────────────────────── */
  function renderTabs() {
    const bar = document.getElementById('editor-tabs-bar');
    if (!bar) return;

    bar.innerHTML = '';
    openTabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `editor-file-tab${currentFile?.name === tab.file.name ? ' active' : ''}`;
      tabEl.dataset.fileName = tab.file.name;

      const icon = getFileIcon(tab.file.name);

      tabEl.innerHTML = `
        <span>${icon}</span>
        <span>${escapeHtml(tab.file.name.split('/').pop())}</span>
        <span class="tab-close" data-close="${tab.file.name}">×</span>
      `;

      tabEl.addEventListener('click', (e) => {
        if (e.target.dataset.close) {
          closeTab(e.target.dataset.close);
        } else {
          openFile(tab.file);
        }
      });

      bar.appendChild(tabEl);
    });
  }

  function highlightActiveTab(fileName) {
    document.querySelectorAll('.editor-file-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.fileName === fileName);
    });
  }

  function closeTab(fileName) {
    const idx = openTabs.findIndex(t => t.file.name === fileName);
    if (idx === -1) return;

    // Dispose model
    openTabs[idx].model.dispose();
    openTabs.splice(idx, 1);

    if (openTabs.length === 0) {
      if (editor) editor.setModel(null);
      currentFile = null;
    } else {
      const newIdx = Math.max(0, idx - 1);
      openFile(openTabs[newIdx].file);
    }

    renderTabs();
  }

  /* ── LOAD PROJECT ─────────────────────────────────────────── */
  function loadProject(project) {
    currentProject = project;

    // Close all tabs
    openTabs.forEach(t => t.model.dispose());
    openTabs = [];
    currentFile = null;

    if (editor) {
      const container = document.getElementById('monaco-container');
      if (container) editor.layout();
    }

    renderTabs();
  }

  /* ── COPY CODE ────────────────────────────────────────────── */
  async function copyCurrentCode() {
    if (!editor) return;
    const code = editor.getValue();
    const ok = await copyToClipboard(code);
    if (ok) showToast(`Copied ${currentFile?.name || 'code'} to clipboard`, 'success', '✓');
  }

  async function copyAllCode() {
    if (!currentProject?.files) return;
    const allCode = currentProject.files
      .map(f => `// ═══ ${f.name} ═══\n${f.code}`)
      .join('\n\n');
    const ok = await copyToClipboard(allCode);
    if (ok) showToast('All code copied to clipboard', 'success', '✓');
  }

  /* ── CLEAR ────────────────────────────────────────────────── */
  function clear() {
    openTabs.forEach(t => t.model.dispose());
    openTabs = [];
    currentFile = null;
    currentProject = null;
    if (editor) editor.setValue('// Select a file to view code');
    renderTabs();
  }

  /* ── ENSURE LOADED ────────────────────────────────────────── */
  function ensureLoaded(callback) {
    if (monacoLoaded && editor) {
      callback();
    } else {
      initMonaco().then(callback);
    }
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    // Monaco loads lazily when IDE opens
  }

  return {
    init,
    initMonaco,
    openFile,
    loadProject,
    copyCurrentCode,
    copyAllCode,
    clear,
    ensureLoaded,
    getCurrentFile: () => currentFile,
    getCurrentProject: () => currentProject,
  };
})();

document.addEventListener('DOMContentLoaded', EditorManager.init);
