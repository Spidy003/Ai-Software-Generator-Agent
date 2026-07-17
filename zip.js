/* ═══════════════════════════════════════════════════════════════════════
   ZIP.JS — Generate and download project ZIP using JSZip
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const ZipManager = (() => {

  /**
   * Download the full project as a ZIP file
   */
  async function downloadProject(project) {
    if (!project || !project.files || project.files.length === 0) {
      showToast('No project to download', 'error', '❌');
      return;
    }

    if (!window.JSZip) {
      showToast('JSZip not loaded. Please refresh.', 'error', '❌');
      return;
    }

    try {
      showToast('Creating ZIP archive...', 'info', '📦');

      const zip = new JSZip();

      // Project root folder name
      const rootName = (project.project_name || 'project')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '');

      const root = zip.folder(rootName);

      // Add all files
      project.files.forEach(file => {
        const content = file.code || '';
        const filePath = file.name; // may include subfolders like "assets/style.css"

        if (filePath.includes('/')) {
          // Create folder structure
          const parts = filePath.split('/');
          const fileName = parts.pop();
          const folderPath = parts.join('/');
          const folder = root.folder(folderPath);
          folder.file(fileName, content);
        } else {
          root.file(filePath, content);
        }
      });

      // Generate ZIP blob
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rootName}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const size = formatBytes(blob.size);
      showToast(`Downloaded ${rootName}.zip (${size})`, 'success', '📦');

    } catch (err) {
      console.error('[ZipManager] ZIP error:', err);
      showToast('Failed to create ZIP: ' + err.message, 'error', '❌');
    }
  }

  /**
   * Download a single file
   */
  function downloadFile(file) {
    if (!file) return;
    const blob = new Blob([file.code || ''], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = file.name.split('/').pop();
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${file.name}`, 'success', '📄');
  }

  return {
    downloadProject,
    downloadFile,
  };
})();
