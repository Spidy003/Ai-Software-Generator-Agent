/* ═══════════════════════════════════════════════════════════════════════
   COMPUTER3D.JS  –  Elevated 3D Multi-Screen Cyber Rig
   Horizontal Green Phosphor HTML Code On Front Screens Only
   ═══════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CODE_PARTS } from './monitorCodeData.js';

function initComputer3D() {
  const canvas = document.getElementById('computer-canvas');
  if (!canvas) return;

  const container = document.getElementById('computer-scene-global') || canvas.parentElement || canvas;

  /* ── 0. GLOBAL STATE VARIABLES ───────────────────────────────────────── */
  const baseRotY = 0.32 + Math.PI;
  let currentMode = 'home'; // 'home' | 'studio'
  let transitionProgress = 0.0;
  let targetProgress = 0.0;
  let cinematicAngle = baseRotY;
  const cinematicSpeed = 0.009; // Continuous smooth 360 cinematic turntable rotation
  let targetRotY = 0;
  let targetRotX = 0;

  /* ── 1. SCENE & CAMERA ─────────────────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = null;

  // Perspective camera with front isometric angle, elevated at topmost point
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(2.4, 2.0, 3.8);
  camera.lookAt(0, 0.70, 0);

  /* ── 2. RENDERER ───────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.30;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* ── 3. CLEAN NEUTRAL LIGHTING (No green wash on metallic body) ────── */
  // Ambient fill
  const ambLight = new THREE.AmbientLight(0xdde5ed, 1.2);
  scene.add(ambLight);

  // Crisp directional key light from top-front
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  // Soft neutral rim light from behind (defines metallic edges)
  const rimLight = new THREE.DirectionalLight(0xcfd8e5, 1.4);
  rimLight.position.set(-4, 5, -3);
  scene.add(rimLight);

  // Soft neutral front fill
  const frontFill = new THREE.DirectionalLight(0xffffff, 0.9);
  frontFill.position.set(0, 2, 5);
  scene.add(frontFill);

  /* ── 4. CRT DISPLAY CONFIGURATION (Dual-State: Glitch/Error vs Code) ── */
  const MONITOR_CONFIG = [
    { title: 'SYS://INDEX.HTML [PART 1/4 · HEAD & SETUP]', startLine: 1 },
    { title: 'SYS://INDEX.HTML [PART 2/4 · HERO & PROMPT]', startLine: 119 },
    { title: 'SYS://INDEX.HTML [PART 3/4 · WORKSPACE & IDE]', startLine: 237 },
    { title: 'SYS://INDEX.HTML [PART 4/4 · CHAT ENGINE]', startLine: 355 }
  ];

  const GLITCH_CONFIG = [
    {
      title: 'SYS://CRITICAL_FAULT [KERNEL PANIC · 0x00F7A]',
      status: 'MEMORY ADDR 0x7FFF8042 FAULT',
      badge: 'KERNEL PANIC',
      color: '#ef4444',
      accent: '#fca5a5',
      gutterStart: 0x0010,
      lines: [
        'FATAL EXCEPTION: SEGMENTATION_FAULT IN CORE COMPILER',
        '>> STACK TRACE LOG:',
        '   0x00F7A: core_pipeline.sys -> ILLEGAL_OPCODE',
        '   0x00F82: neural_synthesis.dll -> MEMORY_PANIC',
        '   0x00F9C: netrunner_bridge.sys -> NULL_PTR_DEREFERENCE',
        '   0x00FA4: crt_framebuffer.bin -> UNCAUGHT_OVERFLOW',
        '>> RAW MEM DUMP: B8 00 1F ?? FF ?? 33 C0 C3 ?? 89 E5 90 90',
        '>> ERROR CODE: 0xC0000005 (ACCESS_VIOLATION)',
        '>> STATUS: SYNTHESIS CLUSTER DISCONNECTED',
        '>> RECOVERY: SWITCH TO IDE CODE STUDIO TO RESTORE PIPELINE'
      ]
    },
    {
      title: 'SYS://STREAM_CORRUPTED [PARITY MISMATCH · CH-2]',
      status: 'SIGNAL SNR: 0.04% [UNSTABLE]',
      badge: 'STREAM CORRUPT',
      color: '#f97316',
      accent: '#fed7aa',
      gutterStart: 0x0120,
      lines: [
        'DATA PACKET DESYNCHRONIZED ACROSS PARALLEL CRT BUS',
        '>> CRC32 CHECKSUM FAILED: EXPECTED 0x9A4F GOT 0x0000',
        '   1011001? ??01101? 11001100 CORRUPT_CHUNK_#42',
        '   001011?? 1111000? 01010101 PACKET_LOSS_84%',
        '>> DEPENDENCY TREE RECONSTRUCTION HALTED',
        '>> RETRY COUNTER: 9999 [MAXIMUM EXHAUSTED]',
        '>> WARN: RECURSIVE PARSING COLLAPSE ON TOKEN "<div class=>"',
        '>> ACTION: INITIALIZE NEURAL STUDIO ENVIRONMENT'
      ]
    },
    {
      title: 'SYS://RUNTIME_HALT [COMPILER STOPPED · 0x404]',
      status: 'PIPELINE DEADLOCK DETECTED',
      badge: 'COMPILER STOPPED',
      color: '#eab308',
      accent: '#fef08a',
      gutterStart: 0x0240,
      lines: [
        'COMPILER RUNTIME EMERGENCY SHUTDOWN TRIPPED',
        '>> INSTRUCTION SEQUENCE FROZEN AT OFFSET 0x0010:',
        '   0x0010: E8 4F 00 00 00  CALL SYS_HALT',
        '   0x0015: 48 83 C4 20     ADD  RSP, 0x20',
        '   0x0019: C3              RET  [INTERRUPT_VECTOR_0x03]',
        '>> HEAP OVERFLOW: 1,048,576 BYTES DROPPED FROM BUFFER',
        '>> PROCESS DIED ABNORMALLY (EXIT SIGNAL 137)',
        '>> AWAITING OPERATOR MANUAL INITIALIZATION...'
      ]
    },
    {
      title: 'SYS://PORT_TIMEOUT [CLUSTER UNBOUND · 0x882B]',
      status: 'SOCKET 127.0.0.1:3000 ETIMEDOUT',
      badge: 'CLUSTER UNBOUND',
      color: '#f43f5e',
      accent: '#fecdd3',
      gutterStart: 0x0360,
      lines: [
        'NEURAL SOCKET HANDSHAKE ABORTED BY REMOTE HOST',
        '>> PROBING 127.0.0.1:3000... NO RESPONSE ACK',
        '>> TCP CONNECTION CLOSED BY PEER WITH RST_STREAM',
        '>> SYNTHESIS POD #4 DESYNCHRONIZED FROM WORKSPACE',
        '>> HEARTBEAT TIMEOUT: EXCEEDED 5000ms THRESHOLD',
        '>> HARDWARE WATCHDOG ARMED · SYSTEM IN SAFE MODE',
        '>> LAUNCH IDE STUDIO TO RE-ESTABLISH NEURAL UPLINK'
      ]
    }
  ];

  const CW = 1024;
  const CH = 640;
  const LINE_HEIGHT = 20;
  const HEADER_H = 42;

  const screenCanvases = [];
  const screenTextures = [];
  const screenMaterials = [];

  for (let idx = 0; idx < 4; idx++) {
    const sc = document.createElement('canvas');
    sc.width = CW;
    sc.height = CH;
    const sctx = sc.getContext('2d');

    const tex = new THREE.CanvasTexture(sc);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // Front-only emissive CRT material
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.25,
      roughness: 0.15,
      metalness: 0.05,
      side: THREE.FrontSide // FRONT ONLY: never visible from back of monitor
    });

    screenCanvases.push({ canvas: sc, ctx: sctx, partIndex: idx });
    screenTextures.push(tex);
    screenMaterials.push(mat);
  }

  /* ── 5. CRT SCREEN RENDERERS (Glitch Error vs Boot vs Green Code) ── */

  const ASCII_CHARS = '.,·-─~+:;=*π""┐┌┘┴┬╗╔╝╚╬╠╣░▒▓$#@!%&';

  // Helper: Draw syntax highlighted line with active propagating ASCII glitch ripple wave
  function drawAsciiGlitchSyntaxLine(ctx, text, startX, y, elapsed, lineIndex, waveCenter) {
    ctx.font = '14px "JetBrains Mono", "Courier New", monospace';
    const trimmed = text.trim();

    if (trimmed.startsWith('<!--') || trimmed.startsWith('//')) {
      ctx.fillStyle = '#16a34a';
      ctx.font = 'italic 13px "JetBrains Mono", monospace';
      ctx.fillText(text, startX, y);
      return;
    }

    let curX = startX;
    const len = Math.min(text.length, 64);
    // Line wave offset creates diagonal propagating ripple waves across all lines
    const lineWavePos = (waveCenter + lineIndex * 1.5) % 32;

    for (let c = 0; c < len; c++) {
      const char = text[c];
      const distFromWave = Math.abs(c - lineWavePos);

      if (distFromWave < 3.2 && char !== ' ') {
        // ACTIVE ASCII GLITCH RIPPLE CHARACTER (Continuous without needing mouse hover)
        const glitchChar = ASCII_CHARS[(c * 7 + Math.floor(elapsed * 26) + lineIndex * 3) % ASCII_CHARS.length];
        ctx.fillStyle = distFromWave < 1.4 ? '#ffffff' : '#86efac';
        ctx.fillText(glitchChar, curX, y);
      } else {
        // Normal syntax colored character
        if (char === '<' || char === '>' || char === '/') {
          ctx.fillStyle = '#38e892';
        } else if (char === '"' || char === "'") {
          ctx.fillStyle = '#dcfce7';
        } else if (char === '=') {
          ctx.fillStyle = '#22c55e';
        } else {
          ctx.fillStyle = '#4ade80';
        }
        ctx.fillText(char, curX, y);
      }
      curX += 8.4;
    }
  }

  // Full-Screen CRT Glitch Effect (Slice tearing, chromatic RGB fringe, tracking bars, ASCII bursts)
  function applyFullScreenGlitch(ctx, canvas, intensity = 1.0, elapsed = 0) {
    if (intensity <= 0) return;

    // 1. Multiple horizontal CRT slice tears across the entire canvas height
    const sliceCount = Math.floor(3 + intensity * 6);
    for (let s = 0; s < sliceCount; s++) {
      if (Math.random() < 0.75) {
        const sliceY = Math.random() * (CH - 24);
        const sliceH = Math.random() * (26 * intensity) + 6;
        const sliceDx = (Math.random() - 0.5) * (48 * intensity);

        ctx.drawImage(canvas, 0, sliceY, CW, sliceH, sliceDx, sliceY, CW, sliceH);

        // Chromatic RGB fringe along slice edge
        if (Math.random() < 0.6) {
          ctx.fillStyle = (s % 2 === 0) ? 'rgba(56, 232, 146, 0.35)' : 'rgba(239, 68, 68, 0.28)';
          ctx.fillRect(sliceDx > 0 ? 0 : CW + sliceDx, sliceY, Math.abs(sliceDx), sliceH);
        }
      }
    }

    // 2. Full-screen CRT horizontal tracking scan-lines / noise bars
    if (Math.random() < 0.70 * intensity) {
      const barY = ((elapsed * 280) + Math.random() * 120) % CH;
      const barH = Math.random() * 22 + 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(0, barY, CW, barH);
      ctx.fillStyle = 'rgba(56, 232, 146, 0.35)';
      ctx.fillRect(0, barY + barH, CW, 2);
    }

    // 3. Full-screen ASCII glitch block matrix burst
    if (intensity > 0.6 || Math.random() < 0.5 * intensity) {
      ctx.save();
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      const burstCount = Math.floor(6 + intensity * 8);
      const burstChars = '▓▒░█╬╣╠╝╚╔╗$#@%&*!~=+-';
      for (let b = 0; b < burstCount; b++) {
        const bx = Math.random() * (CW - 80) + 20;
        const by = Math.random() * (CH - 60) + 40;
        const str = burstChars[Math.floor(Math.random() * burstChars.length)] +
                    burstChars[Math.floor(Math.random() * burstChars.length)] +
                    burstChars[Math.floor(Math.random() * burstChars.length)];
        ctx.fillStyle = Math.random() < 0.3 ? '#ffffff' : (Math.random() < 0.5 ? '#86efac' : '#38e892');
        ctx.shadowColor = '#38e892';
        ctx.shadowBlur = 8;
        ctx.fillText(str, bx, by);
      }
      ctx.restore();
    }

    // 4. White flash bloom on peak glitch moment
    if (intensity > 1.2 && Math.random() < 0.4) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.fillRect(0, 0, CW, CH);
    }
  }

  // A. HOME MODE: CONTINUOUS ASCII GLITCH CODE + INTERMITTENT RED ERROR LOGO (2-3 sec cycle)
  function renderHomeGlitchCodeScreen(obj, elapsed) {
    const { ctx, partIndex } = obj;
    const cfg = MONITOR_CONFIG[partIndex];
    const lines = CODE_PARTS[partIndex] || [];
    const totalLines = lines.length || 1;

    // 4.4 second total cycle:
    // 0.0s -> 2.7s (~2.7 sec): Code with FULL SCREEN GLITCH EFFECT & ASCII Ripple Wave
    // 2.7s -> 4.4s (~1.7 sec): Flashing RED ERROR HAZARD LOGO & CRITICAL MALFUNCTION
    const cycle = elapsed % 4.4;
    const isErrorPhase = cycle >= 2.7;

    if (isErrorPhase) {
      // ══════════════════════════════════════════════════════════════
      // PHASE 2: RED ERROR LOGO & CRITICAL MALFUNCTION
      // ══════════════════════════════════════════════════════════════
      const flash = Math.floor(elapsed * 6) % 2 === 0;

      // Dark CRT background with pulsing red center aura
      ctx.fillStyle = '#080204';
      ctx.fillRect(0, 0, CW, CH);

      const radGlow = ctx.createRadialGradient(CW / 2, CH / 2 - 20, 20, CW / 2, CH / 2 - 20, 420);
      radGlow.addColorStop(0, 'rgba(239, 68, 68, 0.24)');
      radGlow.addColorStop(0.5, 'rgba(185, 28, 28, 0.08)');
      radGlow.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, CW, CH);

      // Header Bar
      ctx.fillStyle = '#140306';
      ctx.fillRect(0, 0, CW, HEADER_H);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, HEADER_H - 1, CW, 1);

      // Flashing alert LEDs
      ctx.fillStyle = flash ? '#ef4444' : '#7f1d1d';
      ctx.beginPath(); ctx.arc(20, HEADER_H / 2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(36, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(52, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();

      // Header title with glitch jitter
      const jitterX = (Math.random() < 0.3) ? (Math.random() * 6 - 3) : 0;
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fca5a5';
      ctx.textBaseline = 'middle';
      ctx.fillText(`SYS://ALERT_INTERRUPT [POD #${partIndex + 1} · CRITICAL_FAULT]`, 72 + jitterX, HEADER_H / 2);

      // Right badge
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = flash ? '#ffffff' : '#f87171';
      const badgeText = '[⚠ MALFUNCTION DETECTED]';
      ctx.fillText(badgeText, CW - ctx.measureText(badgeText).width - 18, HEADER_H / 2);

      // ── CENTER RED ERROR LOGO (Glowing Neon Hazard Triangle) ──
      const logoCenterY = 225;
      const logoCenterX = CW / 2 + jitterX;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(logoCenterX, logoCenterY - 75);
      ctx.lineTo(logoCenterX + 85, logoCenterY + 65);
      ctx.lineTo(logoCenterX - 85, logoCenterY + 65);
      ctx.closePath();

      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 30;
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.fill();

      // Exclamation mark inside triangle
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#fef08a';
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(logoCenterX - 5, logoCenterY - 30, 10, 48);
      ctx.beginPath();
      ctx.arc(logoCenterX, logoCenterY + 36, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Error text below logo ──
      ctx.textAlign = 'center';
      ctx.font = '900 24px "Orbitron", "JetBrains Mono", monospace';
      ctx.fillStyle = flash ? '#ffffff' : '#f87171';
      ctx.fillText('CRITICAL_FAULT // SYSTEM ERROR', CW / 2, 340);

      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(`[ POD #${partIndex + 1} EXCEPTION: 0xC0000005 · MEMORY CORRUPTION ]`, CW / 2, 372);

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('RAW_DUMP: B8 00 1F ?? FF ?? 33 C0 C3 ?? 89 E5 90 · RETRY_COUNT: 9999', CW / 2, 400);

      // Bottom flashing banner
      const bannerH = 40;
      const bannerY = CH - bannerH;
      ctx.fillStyle = flash ? 'rgba(185, 28, 28, 0.90)' : 'rgba(127, 29, 29, 0.75)';
      ctx.fillRect(0, bannerY, CW, bannerH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, bannerY, CW, 1);

      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = flash ? '#ffffff' : '#fecaca';
      ctx.fillText('⚠ [ MALFUNCTION · CLICK "ENTER IDE CODE STUDIO" TO RESTORE NEURAL CLUSTER ] ⚠', CW / 2, bannerY + bannerH / 2);

      // Glitch slice artifact
      if (Math.random() < 0.4) {
        const sliceY = Math.random() * (CH - 60) + 30;
        const sliceH = Math.random() * 24 + 6;
        const sliceDx = Math.random() * 26 - 13;
        ctx.drawImage(obj.canvas, 0, sliceY, CW, sliceH, sliceDx, sliceY, CW, sliceH);
      }

    } else {
      // ══════════════════════════════════════════════════════════════
      // PHASE 1: CODE WITH FULL SCREEN GLITCH EFFECT & ASCII RIPPLE
      // ══════════════════════════════════════════════════════════════
      ctx.fillStyle = '#030804';
      ctx.fillRect(0, 0, CW, CH);

      // Subtle radial glow in center
      const radGlow = ctx.createRadialGradient(CW / 2, CH / 2, 60, CW / 2, CH / 2, 480);
      radGlow.addColorStop(0, 'rgba(16, 185, 129, 0.09)');
      radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, CW, CH);

      // Header Bar
      ctx.fillStyle = '#07150a';
      ctx.fillRect(0, 0, CW, HEADER_H);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, HEADER_H - 1, CW, 1);

      // Window dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(20, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(36, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(52, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();

      // Title with glitch jitter
      const isBurst = cycle < 0.45 || (cycle > 1.25 && cycle < 1.45);
      const titleJitter = isBurst ? (Math.random() * 8 - 4) : 0;
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = isBurst ? '#86efac' : '#38e892';
      ctx.textBaseline = 'middle';
      ctx.fillText(`SYS://INDEX.HTML [PART ${partIndex + 1}/4 · GLITCH STREAM]`, 72 + titleJitter, HEADER_H / 2);

      // Right status pill with active ripple indicator
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = isBurst ? '#ffffff' : '#86efac';
      const statusText = isBurst ? '[FULL_SCREEN_GLITCH · BURST]' : '[ASCII_RIPPLE · ACTIVE · 4.8 GHz]';
      const stW = ctx.measureText(statusText).width;
      ctx.fillText(statusText, CW - stW - 18, HEADER_H / 2);

      // Gutter Background
      const GUTTER_W = 58;
      ctx.fillStyle = '#050c06';
      ctx.fillRect(0, HEADER_H, GUTTER_W, CH - HEADER_H);
      ctx.fillStyle = '#0f381c';
      ctx.fillRect(GUTTER_W - 1, HEADER_H, 1, CH - HEADER_H);

      // Code Lines with Continuous ASCII Glitch Ripple Wave
      const visibleLineCount = Math.ceil((CH - HEADER_H) / LINE_HEIGHT) + 2;
      const scrollSpeed = 16;
      const totalPixelHeight = totalLines * LINE_HEIGHT;
      const currentScroll = (elapsed * scrollSpeed) % totalPixelHeight;
      const firstLineIdx = Math.floor(currentScroll / LINE_HEIGHT);
      const subPixelOffset = currentScroll % LINE_HEIGHT;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, HEADER_H, CW, CH - HEADER_H);
      ctx.clip();

      const waveCenter = (elapsed * 8) % 36;

      for (let i = 0; i < visibleLineCount; i++) {
        const lineIdx = (firstLineIdx + i) % totalLines;
        const actualLineNum = cfg.startLine + lineIdx;
        const y = HEADER_H + i * LINE_HEIGHT - subPixelOffset + (LINE_HEIGHT / 2);

        if (y < HEADER_H - 10 || y > CH + 10) continue;

        // Line number in gutter
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#15803d';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(actualLineNum).padStart(3, '0'), GUTTER_W - 10, y);

        // Code text with active ASCII glitch ripple
        ctx.textAlign = 'left';
        const lineText = lines[lineIdx] || '';
        drawAsciiGlitchSyntaxLine(ctx, lineText, GUTTER_W + 14, y, elapsed, i, waveCenter);
      }

      ctx.restore();

      // Blinking cursor
      if (Math.floor(elapsed * 2) % 2 === 0) {
        ctx.fillStyle = '#38e892';
        ctx.fillRect(72 + ctx.measureText(cfg.title).width + 8, HEADER_H / 2 - 7, 7, 14);
      }

      // ── FULL SCREEN GLITCH EFFECT (Triggered on Code Come & Continual in Code Phase) ──
      const glitchIntensity = isBurst ? 1.55 : 0.65;
      applyFullScreenGlitch(ctx, obj.canvas, glitchIntensity, elapsed);
    }

    // CRT Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let sy = HEADER_H; sy < CH; sy += 3) {
      ctx.fillRect(0, sy, CW, 1);
    }

    // Edge Vignette
    const vigGrad = ctx.createLinearGradient(0, 0, CW, 0);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    vigGrad.addColorStop(0.04, 'transparent');
    vigGrad.addColorStop(0.96, 'transparent');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, CW, CH);
  }

  // B. NEURAL REBOOT / MATRIX DECODE SEQUENCE (Transit Mode)
  function renderBootScreen(obj, elapsed, progress) {
    const { ctx, partIndex } = obj;
    const pct = Math.min(100, Math.max(0, Math.floor(((progress - 0.15) / 0.70) * 100)));

    // Deep matrix green boot background
    ctx.fillStyle = '#020b05';
    ctx.fillRect(0, 0, CW, CH);

    // Header
    ctx.fillStyle = '#061a0b';
    ctx.fillRect(0, 0, CW, HEADER_H);
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, HEADER_H - 1, CW, 1);

    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(20, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.beginPath(); ctx.arc(36, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38e892';
    ctx.beginPath(); ctx.arc(52, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4ade80';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SYS://REBOOT_SEQUENCE.SYS [CRT #${partIndex + 1}]`, 72, HEADER_H / 2);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#86efac';
    const statusText = `[RESTORING · ${pct}%]`;
    ctx.fillText(statusText, CW - ctx.measureText(statusText).width - 18, HEADER_H / 2);

    // Boot progress bar
    const barW = CW - 80;
    const barH = 14;
    const barX = 40;
    const barY = 80;
    ctx.fillStyle = '#052e16';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(barX, barY, barW * (pct / 100), barH);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Terminal log lines
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#86efac';
    const logs = [
      '>> INITIALIZING NEURAL CODE SYNTHESIS ENGINE...',
      `>> ATTACHING COMPILER PIPELINE TO CRT #${partIndex + 1} ... OK`,
      `>> MOUNTING NETRUNNER-AI FLASH BACKPLANE ... OK`,
      `>> DECRYPTING HTML5/CSS/JS SOURCE TREE ... ${pct}%`,
      pct > 50 ? '>> COMPILER SUBSYSTEM ONLINE. SYNCING CRT BUFFERS...' : '>> SYNCHRONIZING PARALLEL BUS...',
      pct > 80 ? '>> SYSTEM RESTORED. COMPILER CODESTREAM ACTIVE.' : '>> RESOLVING DEPENDENCIES...'
    ];

    logs.forEach((log, idx) => {
      ctx.fillStyle = idx === logs.length - 1 ? '#4ade80' : '#22c55e';
      ctx.fillText(log, 40, 130 + idx * 28);
    });

    // Matrix rain / decode chars on right
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
    const chars = '0101100101ABCDEF<>{}/*=+-';
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 12; row++) {
        const ch = chars[(row * 7 + col + Math.floor(elapsed * 15)) % chars.length];
        ctx.fillText(ch, CW - 240 + col * 26, 120 + row * 24);
      }
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let sy = HEADER_H; sy < CH; sy += 3) {
      ctx.fillRect(0, sy, CW, 1);
    }
  }

  // C. CLEAN PHOSPHOR GREEN CODE TERMINAL (Studio Mode)
  function drawSyntaxLine(ctx, text, startX, y) {
    ctx.font = '14px "JetBrains Mono", "Courier New", monospace';
    const trimmed = text.trim();

    if (trimmed.startsWith('<!--') || trimmed.startsWith('//')) {
      ctx.fillStyle = '#16a34a';
      ctx.font = 'italic 13px "JetBrains Mono", "Courier New", monospace';
      ctx.fillText(text, startX, y);
      return;
    }

    const regex = /(<\/?[a-zA-Z0-9\-]+|[>/>]|"[^"]*"|'[^']*'|[a-zA-Z\-]+(?==)|[^\s<>"'=]+|\s+)/g;
    let match;
    let curX = startX;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      if (!token) continue;

      if (token.startsWith('<') || token === '>' || token === '/>') {
        ctx.fillStyle = '#38e892'; // Bright phosphor green tags
      } else if (token.startsWith('"') || token.startsWith("'")) {
        ctx.fillStyle = '#dcfce7'; // Glowing mint string literals
      } else if (/^[a-zA-Z\-]+$/.test(token) && text[match.index + token.length] === '=') {
        ctx.fillStyle = '#86efac'; // Mint green attributes
      } else if (token === '=') {
        ctx.fillStyle = '#22c55e';
      } else {
        ctx.fillStyle = '#4ade80'; // Body text
      }

      ctx.fillText(token, curX, y);
      curX += ctx.measureText(token).width;
      if (curX > CW - 20) break;
    }
  }

  function renderGreenCodeScreen(obj, elapsed) {
    const { ctx, partIndex } = obj;
    const cfg = MONITOR_CONFIG[partIndex];
    const lines = CODE_PARTS[partIndex] || [];
    const totalLines = lines.length || 1;

    // Background: CRT deep obsidian matrix
    ctx.fillStyle = '#030804';
    ctx.fillRect(0, 0, CW, CH);

    // Subtle radial glow in center
    const radGlow = ctx.createRadialGradient(CW / 2, CH / 2, 60, CW / 2, CH / 2, 480);
    radGlow.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, CW, CH);

    // ── Header Bar ──
    ctx.fillStyle = '#07150a';
    ctx.fillRect(0, 0, CW, HEADER_H);
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, HEADER_H - 1, CW, 1);

    // Terminal window dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(20, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath(); ctx.arc(36, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(52, HEADER_H / 2, 5, 0, Math.PI * 2); ctx.fill();

    // Title text
    ctx.font = 'bold 13px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = '#38e892';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.title, 72, HEADER_H / 2);

    // Right status pill
    ctx.font = '12px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = '#86efac';
    const statusText = `[HTML5 · UTF-8 · ${lines.length} LINES]`;
    const stW = ctx.measureText(statusText).width;
    ctx.fillText(statusText, CW - stW - 18, HEADER_H / 2);

    // ── Gutter Background ──
    const GUTTER_W = 58;
    ctx.fillStyle = '#050c06';
    ctx.fillRect(0, HEADER_H, GUTTER_W, CH - HEADER_H);
    ctx.fillStyle = '#0f381c';
    ctx.fillRect(GUTTER_W - 1, HEADER_H, 1, CH - HEADER_H);

    // ── Code Lines with Smooth Continuous Scrolling ──
    const visibleLineCount = Math.ceil((CH - HEADER_H) / LINE_HEIGHT) + 2;
    const scrollSpeed = 16; // pixels per second
    const totalPixelHeight = totalLines * LINE_HEIGHT;
    const currentScroll = (elapsed * scrollSpeed) % totalPixelHeight;
    const firstLineIdx = Math.floor(currentScroll / LINE_HEIGHT);
    const subPixelOffset = currentScroll % LINE_HEIGHT;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HEADER_H, CW, CH - HEADER_H);
    ctx.clip();

    for (let i = 0; i < visibleLineCount; i++) {
      const lineIdx = (firstLineIdx + i) % totalLines;
      const actualLineNum = cfg.startLine + lineIdx;
      const y = HEADER_H + i * LINE_HEIGHT - subPixelOffset + (LINE_HEIGHT / 2);

      if (y < HEADER_H - 10 || y > CH + 10) continue;

      // Line number in gutter
      ctx.font = '12px "JetBrains Mono", "Courier New", monospace';
      ctx.fillStyle = '#15803d';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(actualLineNum).padStart(3, '0'), GUTTER_W - 10, y);

      // Code text
      ctx.textAlign = 'left';
      const lineText = lines[lineIdx] || '';
      drawSyntaxLine(ctx, lineText, GUTTER_W + 14, y);
    }

    ctx.restore();

    // Blinking cursor
    if (Math.floor(elapsed * 2) % 2 === 0) {
      ctx.fillStyle = '#38e892';
      ctx.fillRect(72 + ctx.measureText(cfg.title).width + 8, HEADER_H / 2 - 7, 7, 14);
    }

    // ── CRT Scanlines ──
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let sy = HEADER_H; sy < CH; sy += 3) {
      ctx.fillRect(0, sy, CW, 1);
    }

    // ── Edge Vignette ──
    const vigGrad = ctx.createLinearGradient(0, 0, CW, 0);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
    vigGrad.addColorStop(0.04, 'transparent');
    vigGrad.addColorStop(0.96, 'transparent');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.40)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, CW, CH);
  }

  // Router for CRT canvas drawing
  function renderMonitorCanvas(obj, elapsed) {
    if (transitionProgress < 0.15) {
      // Home mode: Continuous ASCII glitch code + intermittent red error hazard logo
      renderHomeGlitchCodeScreen(obj, elapsed);
    } else if (transitionProgress < 0.85) {
      // Transit mode: Matrix reboot sequence
      renderBootScreen(obj, elapsed, transitionProgress);
    } else {
      // Studio mode: Clean scrolling green code
      renderGreenCodeScreen(obj, elapsed);
    }
  }

  // Pre-render initial state immediately
  for (let m = 0; m < 4; m++) {
    renderMonitorCanvas(screenCanvases[m], 0);
    screenTextures[m].needsUpdate = true;
  }

  /* ── 6. MODEL SOLID MATERIALS PALETTE (Dark metal & casing) ────────── */
  // Mechanical arms, joints & mounts: Sleek dark charcoal steel
  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x22262a,
    roughness: 0.45,
    metalness: 0.65
  });

  // Vertical central pipes & linkages: Gunmetal
  const matPipes = new THREE.MeshStandardMaterial({
    color: 0x1b1f23,
    roughness: 0.40,
    metalness: 0.70
  });

  // Monitor rear shell, bezels & back casing: 100% solid dark matte composite
  const matCasing = new THREE.MeshStandardMaterial({
    color: 0x121518,
    roughness: 0.55,
    metalness: 0.35,
    side: THREE.FrontSide
  });

  // Cables & wiring harnesses: Deep matte black rubber
  const matCable = new THREE.MeshStandardMaterial({
    color: 0x0c0e10,
    roughness: 0.85,
    metalness: 0.12
  });

  /* ── 7. CREATE DEDICATED FRONT SCREEN DISPLAY QUAD ──────────────────── */
  // This creates a dedicated front-only quad in local monitor coordinates:
  // Normal = +X (pointing outward to user)
  // Width along Y, Height along Z
  // Standard UVs: (0,0) BL, (1,0) BR, (1,1) TR, (0,1) TL
  function createFrontScreenQuad(box, material) {
    const x = box.max.x + 0.003; // slight offset in front of casing to avoid z-fight
    const yMin = box.min.y + 0.08;
    const yMax = box.max.y - 0.08;
    const zMin = box.min.z + 0.07;
    const zMax = box.max.z - 0.07;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      // Triangle 1: BL, BR, TR
      x, yMin, zMin,
      x, yMax, zMin,
      x, yMax, zMax,
      // Triangle 2: BL, TR, TL
      x, yMin, zMin,
      x, yMax, zMax,
      x, yMin, zMax
    ]);

    const uvs = new Float32Array([
      // Triangle 1: BL, BR, TR
      0, 0,
      1, 0,
      1, 1,
      // Triangle 2: BL, TR, TL
      0, 0,
      1, 1,
      0, 1
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();

    const screenMesh = new THREE.Mesh(geo, material);
    screenMesh.castShadow = false;
    screenMesh.receiveShadow = false;
    return screenMesh;
  }

  /* ── 8. LOAD GLB MODEL ──────────────────────────────────────────────── */
  const loader = new GLTFLoader();
  let modelPivot = null;

  // View angle looking into the 4 front monitors (baseRotY defined at top)

  // Primary front screen nodes for the 4 physical monitors
  const targetNodes = [
    { name: 'node_id62', matIndex: 0 }, // Monitor 1: Part 1
    { name: 'node_id66', matIndex: 1 }, // Monitor 2: Part 2
    { name: 'node_id70', matIndex: 2 }, // Monitor 3: Part 3
    { name: 'node_id74', matIndex: 3 }  // Monitor 4: Part 4
  ];

  loader.load(
    'screen.glb',
    (gltf) => {
      const model = gltf.scene;

      // 1. ALL ORIGINAL MESHES IN GLB GET SOLID METAL/CASING (NO TEXTURES ON BACK)
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;

        const count = child.geometry?.attributes?.position?.count || 0;

        if (count === 292 || count === 176 || count === 500) {
          // Monitor shells, back plates, bezels and rims: 100% solid dark casing
          child.material = matCasing;
        } else if (count === 1887) {
          child.material = matMetal;
        } else if (count === 133 || count === 148) {
          child.material = matCable;
        } else if (count <= 108) {
          child.material = matPipes;
        } else {
          child.material = matMetal;
        }
      });

      // 2. ATTACH THE 4 DEDICATED FRONT SCREEN QUADS TO EACH MONITOR
      targetNodes.forEach(({ name, matIndex }) => {
        const parentNode = model.getObjectByName(name);
        if (parentNode && parentNode.geometry) {
          parentNode.geometry.computeBoundingBox();
          const box = parentNode.geometry.boundingBox;
          if (box) {
            const screenQuad = createFrontScreenQuad(box, screenMaterials[matIndex]);
            parentNode.add(screenQuad);
            console.log(`[Computer3D] Attached horizontal front screen ${matIndex + 1} to ${name}`);
          }
        }
      });

      // 3. Center and scale model
      const bbox = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      const scale = 3.30 / (maxDim || 1);
      model.scale.setScalar(scale);

      // Center X and Z
      model.position.x = -center.x * scale;
      model.position.z = -center.z * scale;
      // Position model so top wires reach the ceiling / top edge
      model.position.y = -center.y * scale + 0.50;

      // Wrap in pivot group and position AT TOPMOST POINT
      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.position.y = 1.05;
      scene.add(pivot);

      modelPivot = pivot;
      modelPivot.rotation.y = baseRotY;

      updateScenePosition(true);
      onWindowResize();
    },
    (xhr) => {},
    (err) => console.error('[Computer3D] Load error:', err)
  );

  /* ── 9. MOUSE PARALLAX & TILT ───────────────────────────────────────── */
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / (rect.width || 1)) - 0.5;
    const ny = ((e.clientY - rect.top) / (rect.height || 1)) - 0.5;
    targetRotY = nx * 0.40;
    targetRotX = ny * 0.20;
  }
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  /* ── 10. RESIZE & VIEWPORT SYNCHRONIZATION ──────────────────────────── */
  function onWindowResize() {
    const w = container.clientWidth || 540;
    const h = container.clientHeight || 500;
    camera.aspect = w / (h || 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', () => {
    updateScenePosition(false);
    onWindowResize();
  }, { passive: true });
  window.addEventListener('scroll', () => updateScenePosition(true), { passive: true });

  const ro = new ResizeObserver(() => onWindowResize());
  ro.observe(container);

  /* ── 11. TRANSITION & CINEMATIC CAMERA SYSTEM ───────────────────────── */

  // Home: Isometric angled perspective looking into glitch screens
  const homeCamPos = new THREE.Vector3(2.4, 2.0, 3.8);
  const homeLookAt = new THREE.Vector3(0, 0.70, 0);

  // Studio: Centered level perspective for smooth cinematic turntable rotation without any cross-tilt
  const studioCamPos = new THREE.Vector3(0.0, 1.08, 4.0);
  const studioLookAt = new THREE.Vector3(0.0, 1.08, 0);

  function updateScenePosition(immediate = false) {
    const isStudio = currentMode === 'studio';
    const heroAnchor = document.getElementById('hero-3d-anchor');
    if (!heroAnchor) return;
    const heroRect = heroAnchor.getBoundingClientRect();
    if (heroRect.width === 0 || heroRect.height === 0) return;

    // Home: Wires connect higher up closer to Notch Navbar (26px)
    // Studio: 3D model lifted higher up behind Hamburg & New Chat bar (48px)
    const targetTop = isStudio ? 48 : 26;
    const targetWidth = heroRect.width;
    const targetHeight = heroRect.height;

    // In Home: heroRect.left (aligned with hero left panel)
    // In Studio: horizontally centered in #chat-main background
    let targetLeft = Math.round(heroRect.left);
    if (isStudio) {
      const chatMain = document.getElementById('chat-main');
      if (chatMain && chatMain.offsetWidth > 0) {
        const cmRect = chatMain.getBoundingClientRect();
        targetLeft = Math.round(cmRect.left + (cmRect.width - targetWidth) / 2);
      } else {
        targetLeft = Math.round((window.innerWidth - targetWidth) / 2);
      }
    }

    if (immediate) {
      container.style.transition = 'none';
    } else {
      // Smooth transition for left and top
      container.style.transition = 'left 1.15s cubic-bezier(0.16, 1, 0.3, 1), top 1.15s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    container.style.top = `${targetTop}px`;
    container.style.left = `${targetLeft}px`;
    container.style.width = `${targetWidth}px`;
    container.style.height = `${targetHeight}px`;

    if (immediate) {
      void container.offsetWidth;
      container.style.transition = '';
    }
  }

  function transitionTo(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    targetProgress = mode === 'studio' ? 1.0 : 0.0;

    // Toggle background layering class so 3D model is in background in studio
    if (mode === 'studio') {
      container.classList.add('mode-studio');
      document.body.classList.add('in-studio-mode');
    } else {
      container.classList.remove('mode-studio');
      document.body.classList.remove('in-studio-mode');
    }

    // First ensure the target element in the new screen has rendered
    requestAnimationFrame(() => {
      updateScenePosition(false);
    });

    // Run rapid resize-sync during the 1.2s flight
    const startTime = performance.now();
    const glideInterval = setInterval(() => {
      onWindowResize();
      if (performance.now() - startTime > 1350) {
        clearInterval(glideInterval);
        updateScenePosition(false);
        onWindowResize();
      }
    }, 28);
  }

  // Expose global controller
  window.Computer3D = {
    transitionTo,
    updateScenePosition,
    getMode: () => currentMode
  };

  // Initial positioning to hero-3d-anchor
  setTimeout(() => updateScenePosition(true), 50);

  /* ── 12. ANIMATION LOOP ─────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let lastCanvasUpdate = 0;

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Update screen code canvases (~30fps)
    if (elapsed - lastCanvasUpdate > 0.033) {
      lastCanvasUpdate = elapsed;
      for (let m = 0; m < 4; m++) {
        renderMonitorCanvas(screenCanvases[m], elapsed);
        screenTextures[m].needsUpdate = true;
      }
    }

    // Smooth transition interpolation (0 = Home, 1 = Studio)
    transitionProgress += (targetProgress - transitionProgress) * 0.055;

    // Smooth camera position & lookAt lerp into level Studio turntable perspective
    const curCamPos = new THREE.Vector3().lerpVectors(homeCamPos, studioCamPos, transitionProgress);
    camera.position.copy(curCamPos);

    const curLookAt = new THREE.Vector3().lerpVectors(homeLookAt, studioLookAt, transitionProgress);
    camera.lookAt(curLookAt);

    if (modelPivot) {
      // Model Pivot Height:
      const basePivotY = 1.08;
      const bob = Math.sin(elapsed * 1.5) * 0.015;
      modelPivot.position.y = basePivotY + bob;

      // Studio Mode: Scale model down slightly (0.84x) to make it sleek & compact
      const scaleMult = 1.0 - transitionProgress * 0.16;
      modelPivot.scale.setScalar(scaleMult);

      if (transitionProgress > 0.35) {
        // CINEMATIC STUDIO MODE:
        // Smooth 360-degree continuous turntable rotation (level perspective, zero diagonal cross-tilt)
        cinematicAngle += 0.0055;
        modelPivot.rotation.y = cinematicAngle + targetRotY * 0.15;
        modelPivot.rotation.x = targetRotX * 0.05;
        modelPivot.rotation.z = 0;
      } else {
        // HOME MODE:
        // Calibrated front-facing angle with interactive mouse parallax
        cinematicAngle = modelPivot.rotation.y;
        const targetY = baseRotY + targetRotY * 0.35;
        const targetX = targetRotX * 0.15;
        modelPivot.rotation.y += (targetY - modelPivot.rotation.y) * 0.06;
        modelPivot.rotation.x += (targetX - modelPivot.rotation.x) * 0.06;
        modelPivot.rotation.z = 0;
      }
    }

    renderer.render(scene, camera);
  }

  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComputer3D);
} else {
  initComputer3D();
}
