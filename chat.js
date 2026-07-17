/* ═══════════════════════════════════════════════════════════════════════
   CHAT.JS — Chat history management, rendering, search, pin, delete
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const ChatManager = (() => {
  const STORAGE_KEY = 'aisg-chats';
  let chats = [];
  let activeChatId = null;

  /* ── CRUD ─────────────────────────────────────────────────── */
  function load() {
    chats = Storage.get(STORAGE_KEY, []);
  }

  function save() {
    Storage.set(STORAGE_KEY, chats);
  }

  function createChat(title = 'New Chat') {
    const id = generateId();
    const chat = {
      id,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      messages: [],
      project: null,
    };
    chats.unshift(chat);
    save();
    return chat;
  }

  function getChat(id) {
    return chats.find(c => c.id === id) || null;
  }

  function updateChat(id, updates) {
    const idx = chats.findIndex(c => c.id === id);
    if (idx === -1) return;
    chats[idx] = { ...chats[idx], ...updates, updatedAt: Date.now() };
    save();
  }

  function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    save();
    if (activeChatId === id) {
      activeChatId = null;
    }
  }

  function pinChat(id) {
    const chat = getChat(id);
    if (!chat) return;
    updateChat(id, { pinned: !chat.pinned });
  }

  function renameChat(id, newTitle) {
    updateChat(id, { title: newTitle });
  }

  function addMessage(chatId, role, content) {
    const chat = getChat(chatId);
    if (!chat) return;
    chat.messages.push({ id: generateId(), role, content, ts: Date.now() });
    chat.updatedAt = Date.now();
    save();
  }

  function setProject(chatId, project) {
    updateChat(chatId, { project });
  }

  /* ── TITLE AUTO-GENERATION ────────────────────────────────── */
  function autoTitle(prompt) {
    const words = prompt.trim().split(/\s+/).slice(0, 6).join(' ');
    return words.length > 40 ? words.slice(0, 40) + '...' : words;
  }

  /* ── ACTIVE CHAT ──────────────────────────────────────────── */
  function setActive(id) {
    activeChatId = id;
    renderList();
    renderMessages(id);
    updateChatTitleBar(id);
  }

  function getActive() {
    return chats.find(c => c.id === activeChatId) || null;
  }

  function getActiveId() { return activeChatId; }

  /* ── RENDER LIST ──────────────────────────────────────────── */
  function renderList(filter = '') {
    const pinnedEl = document.getElementById('pinned-chats-list');
    const recentEl = document.getElementById('chat-history-list');
    const emptyEl  = document.getElementById('chat-empty-state');
    if (!pinnedEl || !recentEl) return;

    const lower = filter.toLowerCase();
    const filtered = filter
      ? chats.filter(c => c.title.toLowerCase().includes(lower))
      : chats;

    const pinned = filtered.filter(c => c.pinned);
    const recent = filtered.filter(c => !c.pinned);

    pinnedEl.innerHTML = '';
    recentEl.innerHTML = '';

    if (pinned.length === 0 && recent.length === 0) {
      if (!filter) {
        recentEl.innerHTML = '';
        emptyEl && (emptyEl.style.display = 'flex');
        return;
      }
    }
    emptyEl && (emptyEl.style.display = 'none');

    pinned.forEach(c => pinnedEl.appendChild(makeChatItem(c)));
    recent.forEach(c => recentEl.appendChild(makeChatItem(c)));

    if (recent.length === 0 && !filter) {
      emptyEl && (emptyEl.style.display = 'flex');
    }
  }

  function makeChatItem(chat) {
    const item = document.createElement('div');
    item.className = `chat-item${chat.id === activeChatId ? ' active' : ''}`;
    item.dataset.id = chat.id;

    const emoji = chat.project ? '🗂️' : '💬';

    item.innerHTML = `
      <span class="chat-item-icon">${chat.pinned ? '📌' : emoji}</span>
      <span class="chat-item-text" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</span>
      <div class="chat-item-actions">
        <button class="chat-item-action-btn pin-btn" title="${chat.pinned ? 'Unpin' : 'Pin'}" data-action="pin">
          ${chat.pinned ? '📌' : '📍'}
        </button>
        <button class="chat-item-action-btn rename-btn" title="Rename" data-action="rename">✏️</button>
        <button class="chat-item-action-btn delete-btn" title="Delete" data-action="delete">🗑️</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        handleChatAction(action, chat.id);
        return;
      }
      setActive(chat.id);
    });

    return item;
  }

  function handleChatAction(action, chatId) {
    if (action === 'pin') {
      pinChat(chatId);
      renderList();
      showToast('Chat pinned', 'info', '📌');
    } else if (action === 'rename') {
      const chat = getChat(chatId);
      if (!chat) return;
      const newTitle = prompt('Rename chat:', chat.title);
      if (newTitle && newTitle.trim()) {
        renameChat(chatId, newTitle.trim());
        renderList();
        if (chatId === activeChatId) updateChatTitleBar(chatId);
        showToast('Chat renamed', 'success', '✏️');
      }
    } else if (action === 'delete') {
      if (!confirm('Delete this chat?')) return;
      deleteChat(chatId);
      renderList();
      if (activeChatId === null) {
        clearMessages();
      }
      showToast('Chat deleted', 'success', '🗑️');
    }
  }

  /* ── RENDER MESSAGES ──────────────────────────────────────── */
  function renderMessages(chatId) {
    const area = document.getElementById('messages-area');
    const welcomeState = document.getElementById('welcome-state');
    if (!area) return;

    const chat = getChat(chatId);
    if (!chat || chat.messages.length === 0) {
      area.innerHTML = '';
      if (welcomeState) {
        area.appendChild(welcomeState);
        welcomeState.style.display = 'flex';
      }
      return;
    }

    area.innerHTML = '';
    chat.messages.forEach(msg => {
      const msgEl = createMessageElement(msg.role, msg.content, msg.id, chat.project);
      area.appendChild(msgEl);
    });

    area.scrollTop = area.scrollHeight;
  }

  function createMessageElement(role, content, msgId, project) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${role === 'user' ? 'user' : 'assistant'}`;
    wrapper.dataset.msgId = msgId || '';

    const initials = role === 'user' ? 'U' : '✦';
    const avatarClass = role === 'user' ? 'user-avatar' : 'ai-avatar';

    const parsedContent = role === 'assistant'
      ? renderMarkdown(content)
      : `<p>${escapeHtml(content)}</p>`;

    const projectBtn = (role === 'assistant' && project)
      ? `<button class="open-ide-btn" onclick="window.IDEManager && window.IDEManager.open()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          Open in IDE
        </button>`
      : '';

    wrapper.innerHTML = `
      <div class="message-avatar ${avatarClass}">${initials}</div>
      <div>
        <div class="message-bubble">
          ${parsedContent}
          ${projectBtn}
        </div>
        <div class="message-actions">
          <button class="msg-action-btn copy-msg-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
        </div>
      </div>
    `;

    // Bind copy
    const copyBtn = wrapper.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const ok = await copyToClipboard(content);
        if (ok) showToast('Copied to clipboard', 'success', '✓');
      });
    }

    // Highlight code blocks
    wrapper.querySelectorAll('pre code').forEach(block => {
      if (window.hljs) hljs.highlightElement(block);
    });

    return wrapper;
  }

  function renderMarkdown(content) {
    if (window.marked) {
      return marked.parse(content);
    }
    return `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`;
  }

  function clearMessages() {
    const area = document.getElementById('messages-area');
    const welcomeState = document.getElementById('welcome-state');
    if (!area) return;
    area.innerHTML = '';
    if (welcomeState) {
      area.appendChild(welcomeState);
      welcomeState.style.display = 'flex';
    }
    updateChatTitleBar(null);
  }

  function appendMessage(role, content, chatId, project) {
    const area = document.getElementById('messages-area');
    const welcomeState = document.getElementById('welcome-state');
    if (!area) return;

    // Hide welcome
    if (welcomeState && welcomeState.parentElement === area) {
      welcomeState.style.display = 'none';
    }

    const msgId = generateId();
    const chat = getChat(chatId);
    const el = createMessageElement(role, content, msgId, project || chat?.project);
    area.appendChild(el);
    area.scrollTop = area.scrollHeight;
    return msgId;
  }

  function appendStreamingMessage() {
    const area = document.getElementById('messages-area');
    const welcomeState = document.getElementById('welcome-state');
    if (!area) return null;

    if (welcomeState && welcomeState.parentElement === area) {
      welcomeState.style.display = 'none';
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper assistant';
    wrapper.id = 'streaming-msg';

    wrapper.innerHTML = `
      <div class="message-avatar ai-avatar">✦</div>
      <div>
        <div class="message-bubble" id="streaming-bubble">
          <span class="typing-cursor"></span>
        </div>
      </div>
    `;

    area.appendChild(wrapper);
    area.scrollTop = area.scrollHeight;
    return wrapper;
  }

  function updateStreamingMessage(text) {
    const bubble = document.getElementById('streaming-bubble');
    if (!bubble) return;
    bubble.innerHTML = `<p>${escapeHtml(text)}</p><span class="typing-cursor"></span>`;
    const area = document.getElementById('messages-area');
    if (area) area.scrollTop = area.scrollHeight;
  }

  function finalizeStreamingMessage(content, chatId, project) {
    const wrapper = document.getElementById('streaming-msg');
    if (wrapper) wrapper.remove();
    appendMessage('assistant', content, chatId, project);
  }

  /* ── TITLE BAR ────────────────────────────────────────────── */
  function updateChatTitleBar(chatId) {
    const el = document.getElementById('chat-title-display');
    if (!el) return;
    const chat = chatId ? getChat(chatId) : null;
    el.textContent = chat ? chat.title : 'New Conversation';
  }

  /* ── SEARCH ───────────────────────────────────────────────── */
  function initSearch() {
    const input = document.getElementById('chat-search-input');
    if (!input) return;
    input.addEventListener('input', debounce(() => {
      renderList(input.value);
    }, 200));
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    load();
    renderList();
    initSearch();
  }

  return {
    init,
    load,
    save,
    createChat,
    getChat,
    updateChat,
    deleteChat,
    pinChat,
    renameChat,
    addMessage,
    setProject,
    setActive,
    getActive,
    getActiveId,
    renderList,
    renderMessages,
    appendMessage,
    appendStreamingMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    clearMessages,
    autoTitle,
  };
})();

document.addEventListener('DOMContentLoaded', ChatManager.init);
