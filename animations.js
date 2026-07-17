/* ═══════════════════════════════════════════════════════════════════════
   ANIMATIONS.JS — Particle Canvas, Scroll Reveal, Micro-animations
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── PARTICLE SYSTEM ───────────────────────────────────────────────── */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.connections = [];
    this.mouse = { x: null, y: null, radius: 120 };
    this.animFrame = null;
    this.running = false;

    this.config = {
      count: 80,
      minSize: 0.8,
      maxSize: 2.5,
      speed: 0.4,
      connectionDist: 120,
      primaryColor: '91, 140, 255',
      accentColor: '0, 245, 255',
      opacity: 0.5,
    };

    this.resize();
    this.init();
    this.bindEvents();
  }

  resize() {
    const wrapper = this.canvas.parentElement;
    this.canvas.width = wrapper.offsetWidth;
    this.canvas.height = wrapper.offsetHeight;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const isAccent = Math.random() < 0.15;
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * this.config.speed,
      vy: (Math.random() - 0.5) * this.config.speed,
      size: this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize),
      opacity: 0.2 + Math.random() * 0.6,
      color: isAccent ? this.config.accentColor : this.config.primaryColor,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    };
  }

  bindEvents() {
    window.addEventListener('resize', throttle(() => {
      this.resize();
      this.init();
    }, 300));

    this.canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.parentElement.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  update() {
    this.particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      p.x += p.vx;
      p.y += p.vy;

      // Bounce off walls
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      // Mouse repulsion
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.connectionDist) {
          const alpha = (1 - dist / this.config.connectionDist) * 0.25;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(${a.color}, ${alpha})`;
          this.ctx.lineWidth = 0.6;
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    this.particles.forEach(p => {
      const pulseFactor = 0.85 + Math.sin(p.pulse) * 0.15;
      const size = p.size * pulseFactor;
      const opacity = p.opacity * pulseFactor;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color}, ${opacity})`;
      this.ctx.fill();

      // Glow
      if (size > 1.5) {
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        gradient.addColorStop(0, `rgba(${p.color}, ${opacity * 0.4})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
    });
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}

/* ─── SCROLL REVEAL ─────────────────────────────────────────────────── */
class ScrollReveal {
  constructor() {
    this.elements = [];
    this.observer = null;
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(el.dataset.delay) || 0;
            setTimeout(() => {
              el.classList.add('revealed');
            }, delay);
            this.observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    this.observe();
  }

  observe() {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      this.observer.observe(el);
    });
  }
}

/* ─── NAV SCROLL EFFECT ─────────────────────────────────────────────── */
function initNavScroll() {
  const nav = document.getElementById('topnav');
  if (!nav) return;

  const handler = throttle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, 100);

  window.addEventListener('scroll', handler, { passive: true });
}

/* ─── RIPPLE INIT ───────────────────────────────────────────────────── */
function initRipples() {
  const targets = document.querySelectorAll(
    '.btn-primary-hero, .btn-secondary-hero, .btn-new-chat, .btn-nav-primary, .btn-send, .btn-save-api'
  );
  targets.forEach(btn => addRipple(btn));
}

/* ─── REVEAL FEATURE CARDS ──────────────────────────────────────────── */
function setupReveal() {
  document.querySelectorAll('.feature-card, .pricing-card, .section-header').forEach((el, i) => {
    el.classList.add('reveal-on-scroll');
    const delay = parseInt(el.dataset.delay) || (i * 80);
    el.dataset.delay = delay;
  });
}

/* ─── HERO MOUSE PARALLAX ───────────────────────────────────────────── */
function initParallax() {
  const heroVisual = document.getElementById('hero-visual');
  if (!heroVisual) return;

  document.addEventListener('mousemove', throttle((e) => {
    const { innerWidth: W, innerHeight: H } = window;
    const mx = (e.clientX - W / 2) / W;
    const my = (e.clientY - H / 2) / H;

    const cards = heroVisual.querySelectorAll('.hero-card');
    cards.forEach((card, i) => {
      const factor = (i + 1) * 4;
      card.style.transform = `translate(${mx * factor}px, ${my * factor}px)`;
    });
  }, 50));
}

/* ─── SMOOTH SECTION NAVIGATION ─────────────────────────────────────── */
function initSmoothNav() {
  document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        scrollToElement(target, 80);
        // Update active state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
}

/* ─── AUTO-RESIZE TEXTAREA ──────────────────────────────────────────── */
function autoResizeTextarea(textarea) {
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  });
}

/* ─── INIT ALL ANIMATIONS ───────────────────────────────────────────── */
function initAnimations() {
  // Particles
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const particles = new ParticleSystem(canvas);
    // Only run when page is visible
    document.addEventListener('visibilitychange', () => {
      document.hidden ? particles.stop() : particles.start();
    });
    particles.start();
    window._particles = particles;
  }

  // Scroll effects
  initNavScroll();
  setupReveal();
  new ScrollReveal();
  initRipples();
  initParallax();
  initSmoothNav();

  // Textarea resize
  const textarea = document.getElementById('prompt-input');
  if (textarea) autoResizeTextarea(textarea);

  // Animate hero on load
  animateHeroIn();
}

/* ─── HERO ENTRANCE ─────────────────────────────────────────────────── */
function animateHeroIn() {
  const elements = [
    { id: 'hero-badge', delay: 0 },
    { id: 'hero-title', delay: 100 },
    { id: 'hero-subtitle', delay: 200 },
    { id: 'hero-cta', delay: 300 },
    { id: 'hero-stats', delay: 400 },
    { id: 'hero-visual', delay: 500 },
  ];

  elements.forEach(({ id, delay }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay + 100);
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initAnimations);
