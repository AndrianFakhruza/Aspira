(() => {
  const MIN_LOADING_TIME = 380;
  let loadingStartedAt = performance.now();

  function loaderMarkup() {
    const isPublic = document.body.classList.contains('public-shell');
    const isLogin = document.body.classList.contains('login-shell');
    const lines = isLogin
      ? '<div class="sk-line sk-w-45"></div><div class="sk-line sk-w-80"></div><div class="sk-input"></div><div class="sk-input"></div><div class="sk-button"></div>'
      : isPublic
        ? '<div class="sk-line sk-w-55 sk-title"></div><div class="sk-line sk-w-80"></div><div class="sk-field"></div><div class="sk-field"></div><div class="sk-field"></div><div class="sk-button"></div>'
        : '<div class="sk-top"><div class="sk-line sk-w-35 sk-title"></div><div class="sk-line sk-w-60"></div></div><div class="sk-kpis"><div></div><div></div><div></div></div><div class="sk-table"><i></i><i></i><i></i><i></i></div>';
    return `<div id="app-loader" class="app-loader" role="status" aria-label="Memuat halaman"><div class="loader-card ${isLogin ? 'loader-login' : ''}"><div class="loader-brand"><span></span>ASPIRA</div>${lines}<p>Menyiapkan pengalaman terbaik untuk Anda…</p></div></div>`;
  }

  function showLoader() {
    // Only the login-to-dashboard handoff needs a full-page transition.
    if (document.body.classList.contains('login-shell') && !document.getElementById('app-loader')) {
      document.body.insertAdjacentHTML('afterbegin', loaderMarkup());
    }
    loadingStartedAt = performance.now();
    document.body.classList.add('is-loading');
  }

  function hideLoader() {
    const loader = document.getElementById('app-loader');
    const wait = Math.max(0, MIN_LOADING_TIME - (performance.now() - loadingStartedAt));
    window.setTimeout(() => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('page-ready');
      if (loader) {
        loader.classList.add('is-leaving');
        window.setTimeout(() => loader.remove(), 420);
      }
    }, wait);
  }

  function navigate(url) {
    if (!url || url === window.location.href) return;
    if (!document.body.classList.contains('login-shell')) {
      window.location.href = url;
      return;
    }
    showLoader();
    document.body.classList.remove('page-ready');
    window.setTimeout(() => { window.location.href = url; }, 210);
  }

  async function logout() {
    try { await fetch('api.php?action=logout', { credentials: 'include' }); } catch (_) {}
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminUsername');
    window.location.href = 'index.html';
  }

  window.AspiraUI = { navigate, showLoader, hideLoader, logout };
  showLoader();

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('click', event => {
        const href = link.getAttribute('href');
        if (event.defaultPrevented || link.target === '_blank' || link.hasAttribute('download') || !href || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return;
        event.preventDefault();
        navigate(link.href);
      });
    });
    hideLoader();
  });

  window.addEventListener('pageshow', hideLoader);
})();
