/* ============================================================
   ПОДАРКИ СО СМЫСЛОМ — main.js
   Меню, поиск, появление блоков, фильтры, пагинация, шаринг
   Vanilla JS, без библиотек
   ============================================================ */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CATEGORY_LABELS = {
    simvolika: 'Символика',
    primety: 'Приметы',
    psihologiya: 'Психология',
    cvety: 'Цветы',
    deti: 'Дети',
    prazdniki: 'Праздники'
  };

  /* ---------- Утилиты ---------- */

  let toastTimer;
  function toast(message) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  function lockBody(lock) {
    document.body.classList.toggle('is-locked', lock);
  }

  /* ---------- Год в подвале ---------- */

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Шапка при скролле ---------- */

  const header = $('.site-header');
  const backTop = $('.back-to-top');

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    if (backTop) backTop.classList.toggle('is-visible', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Мобильное меню ---------- */

  const burger = $('.burger');
  const mobileMenu = $('.mobile-menu');

  function closeMobileMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    lockBody(false);
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!isOpen));
      mobileMenu.classList.toggle('is-open', !isOpen);
      mobileMenu.setAttribute('aria-hidden', String(isOpen));
      lockBody(!isOpen);
    });

    $$('a', mobileMenu).forEach((link) => link.addEventListener('click', closeMobileMenu));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMobileMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) closeMobileMenu();
    });
  }

  /* ---------- Поиск ---------- */

  const searchModal = $('[data-search-modal]');
  const searchInput = $('[data-search-input]');
  const searchResults = $('[data-search-results]');
  const searchOpeners = $$('[data-search-open]');
  const searchClosers = $$('[data-search-close]');
  let searchIndex = Array.isArray(window.SITE_ARTICLES) ? window.SITE_ARTICLES : null;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function normalize(str) {
    return String(str).toLowerCase().replace(/ё/g, 'е').trim();
  }

  function renderSearch(query) {
    if (!searchResults) return;
    const q = normalize(query);

    if (!searchIndex || !searchIndex.length) {
      searchResults.innerHTML = '<p class="search-hint">Не удалось загрузить статьи.</p>';
      return;
    }

    const prefix = document.body.dataset.depth === 'root' ? '' : '../';
    const items = (q
      ? searchIndex.filter((a) =>
          normalize(`${a.title} ${a.excerpt} ${a.categoryLabel || ''} ${(a.tags || []).join(' ')}`).includes(q)
        )
      : searchIndex
    ).slice(0, 8);

    if (!items.length) {
      searchResults.innerHTML = '<p class="search-hint">Ничего не найдено. Попробуйте другой запрос — например, «цветы» или «приметы».</p>';
      return;
    }

    searchResults.innerHTML = items.map((a) => `
      <a class="search-result" href="${escapeHtml(prefix + a.url)}">
        <img src="${escapeHtml(prefix + a.cover)}" alt="" loading="lazy">
        <span class="search-result__body">
          <span class="search-result__cat">${escapeHtml(a.categoryLabel || CATEGORY_LABELS[a.category] || 'Статья')}</span>
          <span class="search-result__title">${escapeHtml(a.title)}</span>
          <span class="search-result__excerpt">${escapeHtml(a.excerpt)}</span>
        </span>
      </a>
    `).join('');
  }

  function openSearch() {
    if (!searchModal) return;
    searchModal.classList.add('is-open');
    searchModal.setAttribute('aria-hidden', 'false');
    lockBody(true);
    renderSearch('');
    setTimeout(() => searchInput && searchInput.focus(), 120);
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.classList.remove('is-open');
    searchModal.setAttribute('aria-hidden', 'true');
    lockBody(false);
    if (searchInput) searchInput.value = '';
  }

  if (searchModal) {
    searchOpeners.forEach((btn) => btn.addEventListener('click', openSearch));
    searchClosers.forEach((btn) => btn.addEventListener('click', closeSearch));

    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => renderSearch(e.target.value));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const first = $('.search-result', searchResults);
          if (first) window.location.href = first.getAttribute('href');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchModal.classList.contains('is-open') ? closeSearch() : openSearch();
      }
      if (e.key === 'Escape' && searchModal.classList.contains('is-open')) closeSearch();
    });

    // Загружаем индекс, если он не был встроен на страницу
    if (!searchIndex) {
      fetch((document.body.dataset.depth === 'root' ? '' : '../') + 'js/search-index.js')
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then((text) => {
          const match = text.match(/window\.SITE_ARTICLES\s*=\s*([\s\S]+?);?\s*$/);
          if (match) searchIndex = JSON.parse(match[1]);
        })
        .catch(() => {
          fetch('data/articles.json')
            .then((r) => r.json())
            .then((data) => {
              searchIndex = data.map((a) => ({
                title: a.title,
                url: (document.body.dataset.depth === 'root' ? '' : '../') + `articles/${a.slug}.html`,
                cover: (document.body.dataset.depth === 'root' ? '' : '../') + a.cover,
                excerpt: a.excerpt,
                category: a.category,
                tags: a.tags
              }));
            })
            .catch(() => {});
        });
    }
  }

  /* ---------- Появление блоков при скролле ---------- */

  const revealEls = $$('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    $$('[data-reveal-group]').forEach((group) => {
      $$('[data-reveal]', group).forEach((el, i) => {
        if (!el.style.getPropertyValue('--reveal-delay')) {
          el.style.setProperty('--reveal-delay', `${Math.min(i * 0.07, 0.42)}s`);
        }
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ---------- Прогресс чтения ---------- */

  const progressBar = $('[data-reading-progress]');
  const articleBody = $('[data-article-body]');

  if (progressBar && articleBody) {
    const updateProgress = () => {
      const rect = articleBody.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top + 120, 0), Math.max(total, 1));
      progressBar.style.width = `${Math.min((passed / Math.max(total, 1)) * 100, 100)}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ---------- Шаринг ---------- */

  $$('[data-share]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.dataset.share;
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      const links = {
        vk: `https://vk.com/share.php?url=${url}&title=${title}`,
        tg: `https://t.me/share/url?url=${url}&text=${title}`,
        pin: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`
      };
      if (type === 'copy') {
        const value = window.location.href;
        toast('Ссылка скопирована');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).catch(() => toast(value));
        }
        return;
      }
      if (links[type]) window.open(links[type], '_blank', 'noopener,noreferrer,width=640,height=540');
    });
  });

  /* ---------- Копирование RSS ---------- */

  $$('[data-copy-rss]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rssUrl = new URL('rss.xml', window.location.href).href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rssUrl).then(
          () => toast('Ссылка на RSS скопирована'),
          () => toast(rssUrl)
        );
      } else {
        toast(rssUrl);
      }
    });
  });

  /* ---------- Подсветка карточек ---------- */

  $$('.card, .cat-card').forEach((card) => {
    card.classList.add('card--spotlight');
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });

  /* ---------- Параллакс героя ---------- */

  const hero = $('.hero');
  const heroVisual = $('.hero__visual');

  if (hero && heroVisual && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        heroVisual.style.transform = `translate3d(${x * 14}px, ${y * 12}px, 0)`;
      });
    });
    hero.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      heroVisual.style.transform = '';
    });
  }

  /* ---------- Частицы в герое ---------- */

  const canvas = $('.hero__canvas');

  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const colors = ['139,92,246', '6,182,212', '236,72,153', '110,231,183'];
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationId = 0;

    function sizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(64, Math.max(24, Math.floor((width * height) / 26000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.8 + 0.6,
        c: colors[Math.floor(Math.random() * colors.length)],
        a: Math.random() * 0.5 + 0.2
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139,92,246,${(1 - dist / 130) * 0.16})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    sizeCanvas();
    draw();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sizeCanvas, 150);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animationId = requestAnimationFrame(draw);
      }
    });
  }

  /* ---------- Фильтры и пагинация ---------- */

  function initFilterGrid() {
    const grid = $('[data-filter-grid]');
    if (!grid) return;

    const items = $$('[data-article]', grid);
    const chips = $$('[data-filter]');
    const pagination = $('[data-pagination]');
    const empty = $('[data-empty]');
    const resultsCount = $('[data-results-count]');
    const pageSizeForViewport = () => {
      if (window.matchMedia('(max-width: 640px)').matches) return 3;
      if (window.matchMedia('(max-width: 900px)').matches) return 6;
      return 9;
    };
    let pageSize = pageSizeForViewport();
    let activeFilter = 'all';
    let page = 1;

    const getFiltered = () => items.filter((item) => {
      if (activeFilter === 'all') return true;
      const tags = (item.dataset.tags || '').toLowerCase().split('|');
      return tags.includes(activeFilter.toLowerCase()) || item.dataset.cat === activeFilter;
    });

    function renderPagination(pages, list) {
      if (!pagination) return;
      pagination.hidden = false;
      if (pages <= 1) {
        pagination.innerHTML = `<button class="page-btn is-active" aria-current="page">1</button>`;
        return;
      }
      const buttons = [];
      buttons.push(`<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Предыдущая страница">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>`);
      for (let i = 1; i <= pages; i++) {
        buttons.push(`<button class="page-btn ${i === page ? 'is-active' : ''}" data-page="${i}" ${i === page ? 'aria-current="page"' : ''}>${i}</button>`);
      }
      buttons.push(`<button class="page-btn" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Следующая страница">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>`);
      pagination.innerHTML = buttons.join('');
    }

    function render() {
      const list = getFiltered();
      const pages = Math.max(1, Math.ceil(list.length / pageSize));
      page = Math.min(Math.max(page, 1), pages);

      items.forEach((item) => { item.hidden = true; });
      list.slice((page - 1) * pageSize, page * pageSize).forEach((item) => { item.hidden = false; });

      if (empty) empty.hidden = list.length > 0;
      if (resultsCount) {
        resultsCount.textContent = list.length
          ? `Найдено материалов: ${list.length}`
          : 'Ничего не найдено';
      }
      renderPagination(pages, list);
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeFilter = chip.dataset.filter;
        page = 1;
        render();
      });
    });

    if (pagination) {
      pagination.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        page = parseInt(btn.dataset.page, 10);
        render();
        grid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }

    render();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const next = pageSizeForViewport();
        if (next === pageSize) return;
        pageSize = next;
        page = 1;
        render();
      }, 150);
    });
  }

  initFilterGrid();

  /* ---------- Активный пункт меню ---------- */

  const path = window.location.pathname.replace(/\\/g, '/');
  $$('.main-nav a, .mobile-menu__nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    const clean = href.replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/index\.html$/, '');
    if (clean && path.includes(clean.replace(/\.html$/, ''))) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Плавное появление страницы ---------- */

  if (!reduceMotion) {
    document.documentElement.classList.add('js');
    const main = $('main');
    if (main) main.classList.add('page-enter');
  }

  document.documentElement.dataset.ready = 'true';
})();
