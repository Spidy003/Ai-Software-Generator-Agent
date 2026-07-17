/* ═══════════════════════════════════════════════════════════════════════
   EXPLORER.JS — File tree explorer with folder/file rendering
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const ExplorerManager = (() => {
  let currentProject = null;
  let openFolders = new Set(['root']);
  let selectedFile = null;
  let onFileSelectCallback = null;

  /* ── BUILD FILE TREE DATA ─────────────────────────────────── */
  function buildTree(files) {
    const root = { name: 'root', children: {}, files: [] };

    files.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length === 1) {
        // Root-level file
        root.files.push(file);
      } else {
        // Nested file
        let current = root;
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          if (!current.children[folderName]) {
            current.children[folderName] = { name: folderName, children: {}, files: [] };
          }
          current = current.children[folderName];
        }
        // File in folder — adjust name to just filename
        const fileCopy = { ...file, name: parts[parts.length - 1], fullPath: file.name };
        current.files.push(fileCopy);
      }
    });

    return root;
  }

  /* ── RENDER TREE ──────────────────────────────────────────── */
  function renderTree(project) {
    currentProject = project;
    const container = document.getElementById('file-tree');
    if (!container) return;

    container.innerHTML = '';

    const tree = buildTree(project.files);

    // Render root-level folder with project name
    const projectFolder = renderFolderNode(
      project.project_name || 'Project',
      tree,
      'root',
      true
    );
    container.appendChild(projectFolder);
  }

  function renderFolderNode(name, node, folderId, isRoot = false) {
    const folderEl = document.createElement('div');
    folderEl.className = 'tree-folder';
    folderEl.dataset.folderId = folderId;

    const isOpen = openFolders.has(folderId);

    // Folder header
    const header = document.createElement('div');
    header.className = 'tree-folder-header';
    header.innerHTML = `
      <svg class="tree-arrow ${isOpen ? 'open' : ''}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
      <span class="tree-folder-icon">📁</span>
      <span>${escapeHtml(name)}</span>
    `;

    header.addEventListener('click', () => {
      const arrow = header.querySelector('.tree-arrow');
      const children = folderEl.querySelector('.tree-folder-children');

      if (openFolders.has(folderId)) {
        openFolders.delete(folderId);
        arrow.classList.remove('open');
        if (children) children.style.display = 'none';
      } else {
        openFolders.add(folderId);
        arrow.classList.add('open');
        if (children) children.style.display = 'block';
      }
    });

    folderEl.appendChild(header);

    // Children
    const childrenEl = document.createElement('div');
    childrenEl.className = 'tree-folder-children';
    childrenEl.style.display = isOpen ? 'block' : 'none';

    // Sub-folders
    Object.entries(node.children).forEach(([childName, childNode]) => {
      const childId = `${folderId}/${childName}`;
      const childFolder = renderFolderNode(childName, childNode, childId);
      childrenEl.appendChild(childFolder);
    });

    // Files
    node.files.forEach(file => {
      const fileEl = renderFileNode(file);
      childrenEl.appendChild(fileEl);
    });

    folderEl.appendChild(childrenEl);
    return folderEl;
  }

  function renderFileNode(file) {
    const fileEl = document.createElement('div');
    fileEl.className = `tree-file${selectedFile?.name === file.name ? ' active' : ''}`;
    fileEl.dataset.fileName = file.fullPath || file.name;

    const icon = getFileIcon(file.name);

    fileEl.innerHTML = `
      <span class="file-icon">${icon}</span>
      <span>${escapeHtml(file.name)}</span>
    `;

    fileEl.addEventListener('click', () => {
      selectFile(file);
    });

    return fileEl;
  }

  /* ── FILE SELECTION ───────────────────────────────────────── */
  function selectFile(file) {
    selectedFile = file;

    // Update visual state
    document.querySelectorAll('.tree-file').forEach(el => {
      el.classList.toggle('active', el.dataset.fileName === (file.fullPath || file.name));
    });

    // Callback
    if (onFileSelectCallback) {
      onFileSelectCallback(file);
    }
  }

  /* ── SEARCH ───────────────────────────────────────────────── */
  function initSearch() {
    const input = document.getElementById('file-search-input');
    if (!input) return;

    input.addEventListener('input', debounce(() => {
      const query = input.value.toLowerCase().trim();
      filterFiles(query);
    }, 200));
  }

  function filterFiles(query) {
    const fileEls = document.querySelectorAll('.tree-file');
    if (!query) {
      fileEls.forEach(el => (el.style.display = 'flex'));
      return;
    }
    fileEls.forEach(el => {
      const name = el.dataset.fileName?.toLowerCase() || '';
      el.style.display = name.includes(query) ? 'flex' : 'none';
    });
  }

  /* ── UPDATE INFO PANEL ────────────────────────────────────── */
  function updateProjectInfo(project, elapsed) {
    const nameEl  = document.getElementById('exp-project-name');
    const filesEl = document.getElementById('exp-files-count');
    const timeEl  = document.getElementById('exp-gen-time');

    if (nameEl)  nameEl.textContent  = project.project_name || '—';
    if (filesEl) filesEl.textContent = `${project.files?.length || 0} files`;
    if (timeEl)  timeEl.textContent  = elapsed ? formatTime(elapsed) : dateTimeNow();
  }

  /* ── ONFILE SELECT ────────────────────────────────────────── */
  function onFileSelect(callback) {
    onFileSelectCallback = callback;
  }

  /* ── GET SELECTED ─────────────────────────────────────────── */
  function getSelected() { return selectedFile; }

  /* ── SELECT FIRST FILE ────────────────────────────────────── */
  function selectFirst() {
    if (!currentProject?.files?.length) return;
    selectFile(currentProject.files[0]);
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    initSearch();
  }

  return {
    init,
    renderTree,
    selectFile,
    selectFirst,
    onFileSelect,
    getSelected,
    updateProjectInfo,
  };
})();

document.addEventListener('DOMContentLoaded', ExplorerManager.init);
