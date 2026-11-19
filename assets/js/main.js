(function () {
  'use strict';

  const CAT_LABEL = {
    cg: '传统 CG',
    ue: 'UE',
    ai: 'AI 视频',
    proc: '程序化开发'
  };

  const grid = document.getElementById('worksGrid');
  const emptyHint = document.getElementById('worksEmpty');
  const filters = document.getElementById('filters');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- 渲染作品卡片 ---------------- */

  const works = Array.isArray(window.WORKS) ? window.WORKS : [];

  function mediaHTML(work) {
    if (work.cover) {
      return `<img src="${work.cover}" alt="${work.title}" loading="lazy" decoding="async">`;
    }
    const bg = work.gradient || 'linear-gradient(135deg,#1b1d21,#0b0b0c)';
    return `<div class="card__ph" style="background:${bg}"></div>`;
  }

  function cardHTML(work, index) {
    const tag = work.href ? 'a' : 'article';
    const attrs = work.href
      ? ` href="${work.href}" target="_blank" rel="noopener"`
      : '';
    const num = String(index + 1).padStart(2, '0');

    return `
      <${tag} class="card" data-cat="${work.category}"${attrs}>
        <div class="card__media">
          ${mediaHTML(work)}
          <span class="card__num">${num}</span>
        </div>
        <div class="card__body">
          <div class="card__row">
            <h3 class="card__title">${work.title}</h3>
            <span class="card__year">${work.year || ''}</span>
          </div>
          <p class="card__meta">
            <span class="card__cat">${CAT_LABEL[work.category] || work.category}</span>
            ${work.role ? '<span class="card__sep">/</span>' + work.role : ''}
          </p>
        </div>
      </${tag}>
    `;
  }

  if (grid) {
    grid.innerHTML = works.map(cardHTML).join('');
    layoutWide(grid);
    observeReveal(grid.querySelectorAll('.card'));
  }

  /* 每 6 个卡片的第 1 个跨两列，制造版面节奏 */
  function layoutWide(container) {
    const cards = Array.from(container.querySelectorAll('.card:not(.is-hidden)'));
    cards.forEach((card) => card.classList.remove('card--wide'));
    cards.forEach((card, i) => {
      if (i % 6 === 0) card.classList.add('card--wide');
    });
  }

  /* ---------------- 分类筛选 ---------------- */

  if (filters && grid) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;

      filters.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
      btn.classList.add('is-active');

      const target = btn.dataset.filter;
      const cards = Array.from(grid.querySelectorAll('.card'));

      cards.forEach((card) => {
        const show = target === 'all' || card.dataset.cat === target;
        card.classList.toggle('is-hidden', !show);
      });

      layoutWide(grid);

      const visible = cards.filter((c) => !c.classList.contains('is-hidden'));
      if (emptyHint) emptyHint.hidden = visible.length > 0;

      /* 让新出现的卡片重新播放入场 */
      visible.forEach((card, i) => {
        card.classList.remove('is-in');
        card.style.setProperty('--i', String(Math.min(i, 8)));
      });
      requestAnimationFrame(() => {
        visible.forEach((card) => card.classList.add('is-in'));
      });
    });
  }

  /* ---------------- 滚动入场 ---------------- */

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function observeReveal(nodes) {
    if (!nodes.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    nodes.forEach((n, i) => {
      if (!n.style.getPropertyValue('--i')) {
        n.style.setProperty('--i', String(Math.min(i, 6)));
      }
      io.observe(n);
    });
  }

  observeReveal(document.querySelectorAll('[data-reveal]'));

  /* ---------------- 顶栏与首屏视差 ---------------- */

  const header = document.getElementById('siteHeader');
  const heroTitle = document.querySelector('.hero__title');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', y > 24);

    if (heroTitle && !reduceMotion && y < window.innerHeight) {
      heroTitle.style.transform = `translate3d(0, ${y * -0.06}px, 0)`;
    }

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  onScroll();

  /* ---------------- 平滑锚点（对不支持 scroll-behavior 的浏览器兜底） ---------------- */

  if (!('scrollBehavior' in document.documentElement.style)) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 60);
      });
    });
  }
})();
