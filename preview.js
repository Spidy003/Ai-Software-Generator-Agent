/* ═══════════════════════════════════════════════════════════════════════
   PREVIEW.JS — HTML live preview with full CSS/JS inlining
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

const PreviewManager = (() => {
  let currentProject = null;

  /* ── BUILD SELF-CONTAINED HTML ────────────────────────────── */
  function buildPreviewHTML(project) {
    const files = project.files || [];

    // Map filename -> code for quick lookup
    const fileMap = {};
    files.forEach(f => {
      fileMap[f.name] = f.code || '';
      // Also store by basename (e.g. "style.css" for "assets/style.css")
      const base = f.name.split('/').pop();
      if (!fileMap[base]) fileMap[base] = f.code || '';
    });

    // Find main HTML file
    const htmlFile = files.find(f => f.name === 'index.html')
                  || files.find(f => f.name.endsWith('.html'));

    if (!htmlFile) {
      return buildNoPreviewHTML(project.project_name);
    }

    let html = htmlFile.code || '';

    // ── Step 1: Replace <link rel="stylesheet" href="..."> with inline <style>
    html = html.replace(
      /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
      (match, href) => {
        const filename = href.split('/').pop().split('?')[0];
        const css = fileMap[href] || fileMap[filename];
        if (css) {
          return `<style>/* inlined: ${filename} */\n${css}\n</style>`;
        }
        return ''; // remove unresolvable link tags
      }
    );

    // Also handle <link href="..." rel="stylesheet">
    html = html.replace(
      /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi,
      (match, href) => {
        const filename = href.split('/').pop().split('?')[0];
        const css = fileMap[href] || fileMap[filename];
        if (css) {
          return `<style>/* inlined: ${filename} */\n${css}\n</style>`;
        }
        return '';
      }
    );

    // ── Step 2: Inline any remaining CSS files that aren't already in the HTML
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const htmlHasStyles = /<style[\s>]/i.test(html);
    if (cssFiles.length > 0 && !htmlHasStyles) {
      const combined = cssFiles.map(f => `/* ${f.name} */\n${f.code}`).join('\n\n');
      const tag = `<style>\n${combined}\n</style>`;
      if (/<\/head>/i.test(html)) {
        html = html.replace(/<\/head>/i, `${tag}\n</head>`);
      } else {
        html = tag + '\n' + html;
      }
    }

    // ── Step 3: Replace <script src="..."> with inline <script>
    html = html.replace(
      /<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi,
      (match, src) => {
        // Skip CDN / external scripts
        if (src.startsWith('http') || src.startsWith('//')) return match;
        const filename = src.split('/').pop().split('?')[0];
        const js = fileMap[src] || fileMap[filename];
        if (js) {
          return `<script>/* inlined: ${filename} */\ntry{\n${js}\n}catch(e){console.warn('${filename} error:',e);}\n<\/script>`;
        }
        return ''; // remove unresolvable script tags
      }
    );

    // ── Step 4: Inject remaining JS files not yet inlined
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    if (jsFiles.length > 0) {
      const alreadyInlined = (html.match(/\/\* inlined:/g) || []).length;
      if (alreadyInlined < jsFiles.length) {
        const notInlined = jsFiles.filter(f => {
          const base = f.name.split('/').pop();
          return !html.includes(`/* inlined: ${base}`);
        });
        if (notInlined.length > 0) {
          const jsContent = notInlined
            .map(f => `/* ${f.name} */\n${f.code}`)
            .join('\n\n');
          const scriptTag = `<script>\ntry{\n${jsContent}\n}catch(e){console.warn('Preview JS error:',e);}\n<\/script>`;
          if (/<\/body>/i.test(html)) {
            html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
          } else {
            html += '\n' + scriptTag;
          }
        }
      }
    }

    return html;
  }

  function buildNoPreviewHTML(projectName) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#080d24;color:#E2E8F0;
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      padding:24px;text-align:center}
    .icon{font-size:4rem;margin-bottom:16px}
    h1{font-size:1.4rem;font-weight:700;margin-bottom:8px}
    p{color:#9AA4C7;font-size:.9rem;line-height:1.6}
    .tip{margin-top:20px;padding:12px 18px;border-radius:10px;
      background:rgba(91,140,255,.1);border:1px solid rgba(91,140,255,.25);
      font-size:.82rem;color:#5B8CFF}
  </style>
</head>
<body>
  <div>
    <div class="icon">🗂️</div>
    <h1>${(projectName||'Project').replace(/</g,'&lt;')} — Generated!</h1>
    <p>No HTML file found for live preview.<br/>Switch to <strong>Code</strong> view to browse the files.</p>
    <div class="tip">💡 Projects without an index.html can't be previewed directly.</div>
  </div>
</body>
</html>`;
  }

  /* ── RENDER INTO IFRAME ───────────────────────────────────── */
  function render(project) {
    if (!project) return;
    currentProject = project;

    const frame = document.getElementById('preview-frame');
    if (!frame) return;

    const html = buildPreviewHTML(project);

    // IMPORTANT: clear srcdoc first — srcdoc takes priority over src in browsers
    frame.removeAttribute('srcdoc');
    frame.src = 'about:blank';

    // Use setTimeout to let the browser reset before writing new content
    setTimeout(() => {
      try {
        // Write directly to the iframe document — most reliable cross-origin approach
        frame.contentDocument.open();
        frame.contentDocument.write(html);
        frame.contentDocument.close();
      } catch (e) {
        // Fallback: blob URL
        try {
          if (frame._blobUrl) URL.revokeObjectURL(frame._blobUrl);
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          frame._blobUrl = URL.createObjectURL(blob);
          frame.src = frame._blobUrl;
        } catch (e2) {
          // Last resort: srcdoc
          frame.srcdoc = html;
        }
      }
    }, 30);

    // Update URL bar
    const urlBar = document.getElementById('preview-url');
    if (urlBar) {
      const name = (project.project_name || 'project').toLowerCase().replace(/\s+/g, '-');
      urlBar.textContent = `preview://${name}/index.html`;
    }
  }

  /* ── REFRESH ──────────────────────────────────────────────── */
  function refresh() {
    if (currentProject) {
      render(currentProject);
      showToast('Preview refreshed', 'info', '🔄');
    } else {
      showToast('No project to preview yet', 'warning', '⚠️');
    }
  }

  /* ── OPEN IN NEW WINDOW ───────────────────────────────────── */
  function openInWindow() {
    if (!currentProject) {
      showToast('No project to open', 'warning', '⚠️');
      return;
    }
    const html = buildPreviewHTML(currentProject);
    const win = window.open('', '_blank', 'width=1280,height=800,scrollbars=yes,resizable=yes');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      showToast('Opened in new window', 'info', '🖥️');
    }
  }

  /* ── EMPTY STATE ──────────────────────────────────────────── */
  function showEmpty() {
    const frame = document.getElementById('preview-frame');
    if (!frame) return;
    frame.removeAttribute('srcdoc');
    frame.src = 'about:blank';
    setTimeout(() => {
      try {
        const emptyHtml = `<html><body style="background:#080d24;color:#9AA4C7;
          display:flex;align-items:center;justify-content:center;height:100vh;
          font-family:system-ui,sans-serif;text-align:center;flex-direction:column;gap:14px;margin:0;">
          <div style="font-size:3rem">🖥️</div>
          <p style="font-size:.9rem">Generate a project to see live preview here</p>
        </body></html>`;
        frame.contentDocument.open();
        frame.contentDocument.write(emptyHtml);
        frame.contentDocument.close();
      } catch(e) {
        frame.srcdoc = `<html><body style="background:#080d24;color:#9AA4C7;
          display:flex;align-items:center;justify-content:center;height:100vh;
          font-family:system-ui,sans-serif;text-align:center;flex-direction:column;gap:14px;margin:0;">
          <div style="font-size:3rem">🖥️</div>
          <p style="font-size:.9rem">Generate a project to see live preview here</p>
        </body></html>`;
      }
    }, 10);
    const urlBar = document.getElementById('preview-url');
    if (urlBar) urlBar.textContent = 'preview://generated-project';
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    document.getElementById('preview-refresh-btn')
      ?.addEventListener('click', refresh);
    document.getElementById('preview-fullscreen-btn')
      ?.addEventListener('click', openInWindow);
    showEmpty();
  }

  return {
    init,
    render,
    refresh,
    openInWindow,
    showEmpty,
    getCurrentProject: () => currentProject,
  };
})();

document.addEventListener('DOMContentLoaded', PreviewManager.init);
