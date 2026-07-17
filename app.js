/* ═══════════════════════════════════════════════════════════════════════
   APP.JS — Main Orchestrator · 3-Screen SPA
   Home → Chat → Split (IDE left + Chat right)
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── TOAST ──────────────────────────────────────────────────────────── */
window.showToast = function (message, type = 'info', icon = 'ℹ️', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity .3s ease, transform .3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 350);
  }, duration);
};

/* ─── SCREEN MANAGER ─────────────────────────────────────────────────── */
const ScreenManager = (() => {
  let current = 'home'; // 'home' | 'app'

  function goToApp() {
    if (current === 'app') return;
    current = 'app';

    const homeScreen = document.getElementById('screen-home');
    const appScreen  = document.getElementById('screen-app');

    // Animate home → left out
    homeScreen.classList.remove('active');
    homeScreen.classList.add('slide-out-left');

    // Bring in app screen
    appScreen.style.display = 'flex';
    appScreen.classList.remove('active');
    // Force a reflow before adding active so transition fires
    void appScreen.offsetWidth;
    appScreen.classList.add('active');

    // Remove home after transition
    setTimeout(() => {
      homeScreen.style.display = 'none';
    }, 450);

    // Focus prompt
    setTimeout(() => {
      document.getElementById('prompt-input')?.focus();
    }, 500);
  }

  function goToHome() {
    if (current === 'home') return;
    current = 'home';

    const homeScreen = document.getElementById('screen-home');
    const appScreen  = document.getElementById('screen-app');

    appScreen.classList.remove('active');

    homeScreen.style.display = 'flex';
    homeScreen.classList.remove('slide-out-left');
    void homeScreen.offsetWidth;
    homeScreen.classList.add('active');

    setTimeout(() => {
      appScreen.style.display = 'none';
    }, 450);

    // Close IDE panel too
    IDEPanel.close();
  }

  function init() {
    // Make sure home screen is visible
    const home = document.getElementById('screen-home');
    const app  = document.getElementById('screen-app');
    if (home) { home.style.display = 'flex'; home.classList.add('active'); }
    if (app)  { app.style.display  = 'none'; }
  }

  return { goToApp, goToHome, getCurrent: () => current, init };
})();

/* ─── IDE PANEL MANAGER ──────────────────────────────────────────────── */
const IDEPanel = (() => {
  let isOpen       = false;
  let currentProject = null;
  let currentView  = 'code'; // 'code' | 'output'
  let lastPrompt   = '';

  /* Open IDE — slides in from left */
  function open(project) {
    if (project) currentProject = project;
    if (!currentProject) return;

    const panel         = document.getElementById('ide-panel');
    const resizeHandle  = document.getElementById('resize-handle');
    const topCenter     = document.getElementById('app-topbar-center');
    const actionGroup   = document.getElementById('ide-action-group');
    const topDivider    = document.getElementById('topbar-divider');

    if (!panel) return;

    // Slide IDE panel in
    panel.classList.add('open');
    if (resizeHandle) resizeHandle.style.display = 'block';

    // Show topbar items
    if (topCenter)  topCenter.style.display  = 'flex';
    if (actionGroup) actionGroup.style.display = 'flex';
    if (topDivider) topDivider.style.display  = 'block';

    // Update project name
    const nameEl = document.getElementById('ide-project-name');
    const metaEl = document.getElementById('ide-project-meta');
    if (nameEl) nameEl.textContent = currentProject.project_name || 'Project';
    if (metaEl) {
      const langs = extractLanguages(currentProject.files || []);
      metaEl.textContent = `${currentProject.files?.length || 0} files · ${langs.join(', ')}`;
    }

    isOpen = true;

    // Load editor and explorer
    EditorManager.ensureLoaded(() => {
      EditorManager.loadProject(currentProject);
      ExplorerManager.renderTree(currentProject);
      ExplorerManager.selectFirst();
    });

    // Load preview in background
    setTimeout(() => {
      if (currentProject) PreviewManager.render(currentProject);
    }, 300);

    switchView('code');
  }

  /* Close IDE — slides back left */
  function close() {
    isOpen = false;

    const panel         = document.getElementById('ide-panel');
    const resizeHandle  = document.getElementById('resize-handle');
    const topCenter     = document.getElementById('app-topbar-center');
    const actionGroup   = document.getElementById('ide-action-group');
    const topDivider    = document.getElementById('topbar-divider');

    if (panel) panel.classList.remove('open');
    if (resizeHandle) resizeHandle.style.display = 'none';
    if (topCenter)  topCenter.style.display  = 'none';
    if (actionGroup) actionGroup.style.display = 'none';
    if (topDivider) topDivider.style.display  = 'none';
  }

  /* Switch code ↔ preview */
  function switchView(view) {
    currentView = view;

    const codeView   = document.getElementById('code-view');
    const outputView = document.getElementById('output-view');
    const tabCode    = document.getElementById('tab-code');
    const tabOutput  = document.getElementById('tab-output');

    if (!codeView || !outputView) return;

    if (view === 'code') {
      codeView.style.display   = 'flex';
      outputView.style.display = 'none';
      tabCode?.classList.add('active');
      tabOutput?.classList.remove('active');
      if (window.monacoEditor) setTimeout(() => window.monacoEditor.layout(), 80);
    } else {
      codeView.style.display   = 'none';
      outputView.style.display = 'flex';
      tabCode?.classList.remove('active');
      tabOutput?.classList.add('active');
      const proj = currentProject || PreviewManager.getCurrentProject();
      if (proj) {
        PreviewManager.render(proj);
      } else {
        showToast('No project yet — generate one first!', 'warning', '⚠️');
      }
    }
  }

  function clearProject() {
    if (!confirm('Clear the current project? This cannot be undone.')) return;
    currentProject = null;
    EditorManager.clear();
    PreviewManager.showEmpty();
    close();
    showToast('Project cleared', 'info', '🗑️');
  }

  function regenerate() {
    if (!lastPrompt) { showToast('No prompt to regenerate from.', 'warning', '⚠️'); return; }
    close();
    setTimeout(() => promptAndGenerate(lastPrompt), 100);
  }

  return {
    open, close, switchView, clearProject, regenerate,
    setLastPrompt: (p) => { lastPrompt = p; },
    isOpen: () => isOpen,
    getProject: () => currentProject,
    setProject: (p) => { currentProject = p; },
  };
})();

/* Expose for external access */
window.IDEManager = IDEPanel;

/* ─── GENERATE WORKFLOW ──────────────────────────────────────────────── */
async function promptAndGenerate(promptText) {
  if (!promptText?.trim()) return;

  // Make sure we're on the app screen
  ScreenManager.goToApp();

  // Chat session
  const chatId = ChatManager.getActiveId() || (() => {
    const chat = ChatManager.createChat(ChatManager.autoTitle(promptText));
    ChatManager.setActive(chat.id);
    return chat.id;
  })();

  const chat = ChatManager.getChat(chatId);
  if (chat && chat.messages.length === 0) {
    ChatManager.updateChat(chatId, { title: ChatManager.autoTitle(promptText) });
    ChatManager.renderList();
  }

  // Update chat title in topbar
  const titleEl = document.getElementById('chat-title-display');
  if (titleEl) titleEl.textContent = ChatManager.autoTitle(promptText);

  ChatManager.addMessage(chatId, 'user', promptText);
  ChatManager.appendMessage('user', promptText, chatId);

  // Hide welcome state
  const welcome = document.getElementById('welcome-state');
  if (welcome) welcome.style.display = 'none';

  // Show typing indicator
  const typingEl = document.getElementById('typing-indicator');
  if (typingEl) typingEl.style.display = 'flex';

  IDEPanel.setLastPrompt(promptText);

  // Check if we have an existing project to modify
  const existingProject = chat?.project || null;

  try {
    const result = await APIManager.generate(promptText, chatId, existingProject);

    if (!result) {
      if (typingEl) typingEl.style.display = 'none';
      return;
    }

    const { project, elapsed } = result;
    if (typingEl) typingEl.style.display = 'none';

    ChatManager.setProject(chatId, project);

    const summary = buildProjectSummary(project, elapsed);
    ChatManager.addMessage(chatId, 'assistant', summary);
    ChatManager.finalizeStreamingMessage(summary, chatId, project);

    // Update explorer info
    ExplorerManager.updateProjectInfo(project, elapsed);

    // Open IDE panel — slides in from left, chat moves right
    IDEPanel.open(project);

    showToast(`${project.project_name} generated!`, 'success', '🚀');

  } catch (err) {
    if (typingEl) typingEl.style.display = 'none';
    const errMsg = `❌ Error: ${err.message}. Check your API key and try again.`;
    ChatManager.addMessage(chatId, 'assistant', errMsg);
    ChatManager.finalizeStreamingMessage(errMsg, chatId, null);
    showToast(err.message, 'error', '❌', 5000);
  }
}

/* ─── PROJECT SUMMARY ────────────────────────────────────────────────── */
function buildProjectSummary(project, elapsed) {
  const langs = extractLanguages(project.files || []);
  const size  = formatBytes(calcProjectSize(project.files || []));
  return `✅ **${project.project_name}** generated successfully!\n\n${project.description || ''}\n\n**Details:** ${project.files?.length || 0} files · ${langs.join(', ')} · ${size} · Generated in ${formatTime(elapsed)}`;
}

/* ─── INIT PROMPT INPUT ──────────────────────────────────────────────── */
function initPromptInput() {
  const textarea = document.getElementById('prompt-input');
  const sendBtn  = document.getElementById('send-btn');
  const counter  = document.getElementById('char-counter');

  if (!textarea || !sendBtn) return;

  // Auto-resize
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
    const len = textarea.value.trim().length;
    sendBtn.disabled = len === 0;
    if (counter) counter.textContent = textarea.value.length;
  });

  // Ctrl+Enter or just Enter sends
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSend();
    }
  });

  sendBtn.addEventListener('click', triggerSend);

  function triggerSend() {
    const prompt = textarea.value.trim();
    if (!prompt || APIManager.isGenerating()) return;
    textarea.value = '';
    textarea.style.height = 'auto';
    sendBtn.disabled = true;
    if (counter) counter.textContent = '0';
    promptAndGenerate(prompt);
  }
}

/* ─── SUGGESTION CHIPS ───────────────────────────────────────────────── */
function initSuggestionChips() {
  document.querySelectorAll('.suggestion-chip, .example-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (!prompt) return;
      ScreenManager.goToApp();
      setTimeout(() => {
        const textarea = document.getElementById('prompt-input');
        if (textarea) {
          textarea.value = prompt;
          textarea.dispatchEvent(new Event('input'));
        }
        promptAndGenerate(prompt);
      }, 200);
    });
  });
}

/* ─── SIDEBAR TOGGLE ─────────────────────────────────────────────────── */
function initSidebar() {
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  const toggleBtn   = document.getElementById('sidebar-toggle-btn');
  const sidebar     = document.getElementById('sidebar-chat');

  function toggleSidebar() {
    if (!sidebar) return;
    // Don't show in split mode (IDE is open)
    if (IDEPanel.isOpen()) return;
    sidebar.classList.toggle('collapsed');
  }

  collapseBtn?.addEventListener('click', toggleSidebar);
  toggleBtn?.addEventListener('click', toggleSidebar);
}

/* ─── NEW CHAT ───────────────────────────────────────────────────────── */
function initNewChat() {
  const handler = () => {
    const chat = ChatManager.createChat('New Chat');
    ChatManager.setActive(chat.id);
    ChatManager.renderList();

    const textarea = document.getElementById('prompt-input');
    if (textarea) { textarea.value = ''; textarea.dispatchEvent(new Event('input')); }

    const welcome = document.getElementById('welcome-state');
    if (welcome) welcome.style.display = '';

    const titleEl = document.getElementById('chat-title-display');
    if (titleEl) titleEl.textContent = 'New Conversation';

    IDEPanel.close();
    showToast('New chat started', 'info', '💬');
  };

  document.getElementById('new-chat-btn')?.addEventListener('click', handler);
  document.getElementById('new-chat-sidebar-btn')?.addEventListener('click', handler);
}

/* ─── HOME / BACK BUTTONS ────────────────────────────────────────────── */
function initNavigation() {
  document.getElementById('start-building-btn')?.addEventListener('click', () => ScreenManager.goToApp());
  document.getElementById('back-home-btn')?.addEventListener('click', () => ScreenManager.goToHome());

  // Example chips on home page
  document.querySelectorAll('.home-examples .example-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (!prompt) return;
      ScreenManager.goToApp();
      setTimeout(() => promptAndGenerate(prompt), 300);
    });
  });
}

/* ─── IDE TOPBAR BUTTONS ─────────────────────────────────────────────── */
function initIDEButtons() {
  document.getElementById('tab-code')?.addEventListener('click', () => IDEPanel.switchView('code'));
  document.getElementById('tab-output')?.addEventListener('click', () => IDEPanel.switchView('output'));
  document.getElementById('copy-all-btn')?.addEventListener('click', EditorManager.copyAllCode);
  document.getElementById('download-zip-btn')?.addEventListener('click', () => {
    const p = IDEPanel.getProject();
    if (p) ZipManager.downloadProject(p); else showToast('No project to download', 'warning', '⚠️');
  });
  document.getElementById('regenerate-btn')?.addEventListener('click', () => IDEPanel.regenerate());
  document.getElementById('clear-ide-btn')?.addEventListener('click', () => IDEPanel.clearProject());
  document.getElementById('preview-refresh-btn')?.addEventListener('click', () => PreviewManager.refresh());
  document.getElementById('preview-fullscreen-btn')?.addEventListener('click', () => PreviewManager.openInWindow?.() || PreviewManager.toggleFullscreen?.());
}

/* ─── FILE SELECT → EDITOR ───────────────────────────────────────────── */
function initExplorerFileSelect() {
  ExplorerManager.onFileSelect((file) => {
    EditorManager.ensureLoaded(() => EditorManager.openFile(file));
  });
}

/* ─── VOICE INPUT ────────────────────────────────────────────────────── */
function initVoiceInput() {
  const voiceBtn = document.getElementById('voice-btn');
  const textarea = document.getElementById('prompt-input');
  if (!voiceBtn || !textarea) return;
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    voiceBtn.style.display = 'none'; return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1;
  let listening = false;

  voiceBtn.addEventListener('click', () => { if (listening) rec.stop(); else rec.start(); });
  rec.addEventListener('start',  () => { listening = true;  voiceBtn.style.color = '#FF5D7A'; });
  rec.addEventListener('end',    () => { listening = false; voiceBtn.style.color = ''; });
  rec.addEventListener('result', (e) => {
    const txt = Array.from(e.results).map(r => r[0].transcript).join('');
    textarea.value = txt;
    textarea.dispatchEvent(new Event('input'));
  });
  rec.addEventListener('error', () => { listening = false; voiceBtn.style.color = ''; showToast('Voice error', 'error', '🎤'); });
}

/* ─── KEYBOARD SHORTCUTS ─────────────────────────────────────────────── */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K → focus prompt
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      ScreenManager.goToApp();
      setTimeout(() => document.getElementById('prompt-input')?.focus(), 300);
    }
    // Ctrl+Shift+D → download ZIP
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      const p = IDEPanel.getProject();
      if (p) ZipManager.downloadProject(p);
    }
    // Escape → close IDE
    if (e.key === 'Escape' && IDEPanel.isOpen()) {
      IDEPanel.close();
    }
  });
}

/* ─── DRAG RESIZE HANDLE ─────────────────────────────────────────────── */
function initResizeHandle() {
  const handle  = document.getElementById('resize-handle');
  const idePanel= document.getElementById('ide-panel');
  const splitEl = document.getElementById('app-body-split');
  if (!handle || !idePanel) return;

  let dragging = false;
  let startX = 0, startWidth = 0;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startWidth = idePanel.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const totalW = splitEl.getBoundingClientRect().width;
    const delta = e.clientX - startX;
    const newW = Math.min(Math.max(startWidth + delta, 320), totalW - 280);
    idePanel.style.width = newW + 'px';
    if (window.monacoEditor) window.monacoEditor.layout();
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

/* ─── STATUS DOT ─────────────────────────────────────────────────────── */
window.setStatus = function(status, text) {
  const dot  = document.getElementById('ai-status-dot');
  const span = document.getElementById('ai-status-text');
  if (dot)  { dot.className = 'status-dot status-' + status; }
  if (span) span.textContent = text;
};

/* ─── MAIN INIT ──────────────────────────────────────────────────────── */
function initApp() {
  console.log('%c🚀 AI Software Generator v2', 'color:#5B8CFF;font-size:1rem;font-weight:700');

  ScreenManager.init();
  initNavigation();
  initPromptInput();
  initSuggestionChips();
  initSidebar();
  initNewChat();
  initIDEButtons();
  initExplorerFileSelect();
  initVoiceInput();
  initKeyboardShortcuts();
  initResizeHandle();

  // Initialize first chat
  if (!ChatManager.getActiveId()) {
    const chat = ChatManager.createChat('New Chat');
    ChatManager.setActive(chat.id);
    ChatManager.renderList();
  }

  console.log('%c✓ Ready', 'color:#36FF8B');
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initApp, 100));
