/* ==========================================================================
   OwO — custom JS for Enhancer for YouTube
   Pairs with lumen.css. Swaps favicon, tab title and search placeholder to
   the OwO brand, adds a scroll-progress line and an "Ends at" clock pill
   in the player, and can hide Shorts.
   ========================================================================== */
(() => {
  if (window.__lumenLoaded) return;
  window.__lumenLoaded = true;

  /* ----- Settings: edit these ----- */
  const CONFIG = {
    brand: 'OwO',
    hideShorts: false,   // true removes Shorts shelves and the Shorts sidebar entry
    scrollLine: true,    // thin amber progress line at the top of the page
    endsAt: true,        // "Ends 10:42 PM" pill on the player (respects playback speed)
    searchPlaceholder: 'Search OwO',
  };

  const FAVICON = 'data:image/png;base64,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';

  const $ = (sel, root = document) => root.querySelector(sel);

  /* ----- 1. Favicon ----- */
  function setFavicon() {
    const links = document.querySelectorAll('link[rel~="icon"]');
    if (links.length === 1 && links[0].dataset.lumen === '1') return;
    links.forEach((l) => l.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = FAVICON;
    link.dataset.lumen = '1';
    document.head.appendChild(link);
  }

  /* ----- 2. Tab title: "Video name - YouTube" -> "Video name · OwO" ----- */
  function rebrandTitle() {
    const t = document.title;
    let next = t.replace(/\s*[-–—]\s*YouTube\s*$/i, ` · ${CONFIG.brand}`);
    if (/^YouTube$/i.test(next.trim())) next = CONFIG.brand;
    next = next.replace(/^\(\d+\)\s*/, (m) => m); // keep notification counts
    if (next !== t) document.title = next;
  }

  /* ----- 3. Search placeholder ----- */
  function setPlaceholder() {
    const input = $('input#search, input.ytSearchboxComponentInput, yt-searchbox input');
    if (input && input.placeholder !== CONFIG.searchPlaceholder) {
      input.placeholder = CONFIG.searchPlaceholder;
    }
  }

  /* ----- 4. Scroll progress line ----- */
  function initScrollLine() {
    if (!CONFIG.scrollLine || $('#lumen-scroll')) return;
    const bar = document.createElement('div');
    bar.id = 'lumen-scroll';
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      bar.style.width = (max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0) + '%';
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ----- 5. "Ends at" pill inside the player ----- */
  function updateEndsAt() {
    if (!CONFIG.endsAt) return;
    const player = $('#movie_player');
    if (!player) return;
    let pill = $('.lumen-ends', player);
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'lumen-ends';
      player.appendChild(pill);
    }
    const v = $('video.html5-main-video', player);
    if (!v || !isFinite(v.duration) || v.duration <= 0) {
      pill.textContent = ''; // live streams, loading, etc.
      return;
    }
    const remaining = (v.duration - v.currentTime) / (v.playbackRate || 1);
    const end = new Date(Date.now() + remaining * 1000);
    const clock = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const text = `Ends ${clock}`;
    if (pill.textContent !== text) pill.textContent = text;
  }

  /* ----- 6. Shorts toggle ----- */
  document.documentElement.classList.toggle('lumen-no-shorts', !!CONFIG.hideShorts);

  /* ----- Wiring ----- */
  function applyAll() {
    setFavicon();
    rebrandTitle();
    setPlaceholder();
    initScrollLine();
  }

  applyAll();

  // YouTube is a single-page app: re-apply after each internal navigation
  window.addEventListener('yt-navigate-finish', applyAll);
  window.addEventListener('yt-page-data-updated', applyAll);

  // YouTube rewrites the title and favicon on its own, so watch for that
  const titleEl = $('title');
  if (titleEl) new MutationObserver(rebrandTitle).observe(titleEl, { childList: true });
  new MutationObserver((muts) => {
    if (muts.some((m) => [...m.addedNodes].some((n) => n.nodeName === 'LINK'))) setFavicon();
  }).observe(document.head, { childList: true });

  // Search box is created late and re-rendered; check lightly for a while
  let tries = 0;
  const poll = setInterval(() => {
    setPlaceholder();
    if (++tries > 40) clearInterval(poll);
  }, 500);

  setInterval(updateEndsAt, 1000);
})();
