/**
 * LearnUp — Mobile UI Controller
 * Handles: Mobile Header, Hamburger Drawer, Search Overlay, Bottom Navigation
 * Works with all SPA templates (articles, vocab, quiz, dashboard, admin)
 */

(function () {
    'use strict';

    const BP = 768; // mobile breakpoint (px)
    const isMobile = () => window.innerWidth <= BP;

    /* ── Bottom nav mapping ──────────────────────────────────────────────── */
    const NAV_ITEMS = [
        { id: 'mob-nav-articles',  icon: 'fa-solid fa-newspaper',   label: 'Articles',   views: ['articles', 'article-detail'] },
        { id: 'mob-nav-vocab',     icon: 'fa-solid fa-book-open',   label: 'Vocab',      views: ['vocabulary'] },
        { id: 'mob-nav-quiz',      icon: 'fa-solid fa-circle-play', label: 'Quiz',       views: ['quiz'],   fab: true },
        { id: 'mob-nav-dashboard', icon: 'fa-solid fa-chart-line',  label: 'Dashboard',  views: ['user-dashboard'] },
    ];

    /* ── Drawer nav items ────────────────────────────────────────────────── */
    const DRAWER_ITEMS = [
        { icon: 'fa-solid fa-newspaper',   label: 'Articles',    view: 'articles',      color: '#2563eb', bg: '#eff6ff' },
        { icon: 'fa-solid fa-book-open',   label: 'Vocabulary',  view: 'vocabulary',    color: '#7c3aed', bg: '#f5f3ff' },
        { icon: 'fa-solid fa-circle-play', label: 'Quiz',        view: 'quiz',          color: '#0891b2', bg: '#e0f2fe' },
        { icon: 'fa-solid fa-chart-line',  label: 'Dashboard',   view: 'user-dashboard',color: '#059669', bg: '#ecfdf5' },
    ];

    /* ── State ───────────────────────────────────────────────────────────── */
    let _drawerOpen = false;
    let _searchOpen = false;

    /* =========================================================================
       ENTRY POINT — called by app.js after every SPA render
       ========================================================================= */
    function init() {
        if (!isMobile()) return;

        // Build persistent UI elements (idempotent — check before creating)
        _buildSearchOverlay();
        _buildDrawer();
        _buildBottomNav();

        // Per-render: inject buttons into whichever header is now in DOM
        const header = document.querySelector('.main-header');
        if (header) _patchHeader(header);

        // Set active bottom nav item
        _syncNav();
    }

    /* Expose for app.js */
    window.initMobileUI = init;

    /* =========================================================================
       1. PATCH THE DESKTOP HEADER (add search btn + hamburger)
       ========================================================================= */
    function _patchHeader(header) {
        if (header.dataset.mobPatched) return; // already done this render
        header.dataset.mobPatched = '1';

        // Hide desktop-only elements
        const searchBar = header.querySelector('.search-bar');
        const mainNav   = header.querySelector('.main-nav');
        if (searchBar) searchBar.style.display = 'none';
        if (mainNav)   mainNav.style.display   = 'none';

        // Build the mobile right-side action group
        const wrap = document.createElement('div');
        wrap.className = 'mob-hdr-actions';

        // Search button
        const searchBtn = _el('button', 'mob-icon-btn', `<i class="fa-solid fa-magnifying-glass"></i>`);
        searchBtn.setAttribute('aria-label', 'Search');
        searchBtn.id = 'mob-search-btn';
        searchBtn.addEventListener('click', _openSearch);

        // Avatar / user dropdown stays in header — just reuse existing .user-profile-dropdown
        const avatar = header.querySelector('.user-profile-dropdown');

        // Hamburger
        const burger = _el('button', 'mob-icon-btn mob-burger', `
            <span class="bline"></span>
            <span class="bline"></span>
            <span class="bline"></span>
        `);
        burger.setAttribute('aria-label', 'Menu');
        burger.id = 'mob-burger-btn';
        burger.addEventListener('click', _openDrawer);

        wrap.appendChild(searchBtn);
        if (avatar) wrap.appendChild(avatar); // moves it to the right group
        wrap.appendChild(burger);

        header.appendChild(wrap);
    }

    /* =========================================================================
       2. SEARCH OVERLAY
       ========================================================================= */
    function _buildSearchOverlay() {
        if (document.getElementById('mob-search-overlay')) return;

        const el = document.createElement('div');
        el.id = 'mob-search-overlay';
        el.className = 'mob-search-overlay';
        el.innerHTML = `
          <div class="mob-search-panel">
            <div class="mob-search-row">
              <button class="mob-search-back" id="mob-search-back" aria-label="Close search">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <div class="mob-search-field">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input id="mob-search-input" class="mob-search-input"
                  type="search" placeholder="Search articles, words…"
                  autocomplete="off" enterkeyhint="search">
              </div>
            </div>
          </div>
          <div class="mob-search-scrim" id="mob-search-scrim"></div>
        `;

        document.body.appendChild(el);

        el.querySelector('#mob-search-back').addEventListener('click', _closeSearch);
        el.querySelector('#mob-search-scrim').addEventListener('click', _closeSearch);

        const input = el.querySelector('#mob-search-input');
        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') { _closeSearch(); return; }
            if (e.key === 'Enter') {
                _mirrorSearch(input.value);
                _closeSearch();
            }
        });
        input.addEventListener('input', () => _mirrorSearch(input.value));
    }

    function _mirrorSearch(val) {
        // Propagate to desktop search input for live filtering
        const desktop = document.querySelector('.search-bar input');
        if (desktop) {
            desktop.value = val;
            desktop.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function _openSearch() {
        const ov = document.getElementById('mob-search-overlay');
        if (!ov) return;
        ov.classList.add('show');
        _searchOpen = true;
        setTimeout(() => {
            const inp = ov.querySelector('#mob-search-input');
            inp && inp.focus();
        }, 120);
    }

    function _closeSearch() {
        const ov = document.getElementById('mob-search-overlay');
        if (ov) ov.classList.remove('show');
        _searchOpen = false;
    }

    /* =========================================================================
       3. SIDE DRAWER
       ========================================================================= */
    function _buildDrawer() {
        if (document.getElementById('mob-drawer')) return;

        const user = _getUser();

        // Scrim
        const scrim = document.createElement('div');
        scrim.id = 'mob-drawer-scrim';
        scrim.className = 'mob-drawer-scrim';
        scrim.addEventListener('click', _closeDrawer);
        document.body.appendChild(scrim);

        // Drawer
        const drawer = document.createElement('div');
        drawer.id = 'mob-drawer';
        drawer.className = 'mob-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', 'Menu');

        const navHTML = DRAWER_ITEMS.map(item => `
          <button class="mob-drawer-link" data-view="${item.view}">
            <span class="mob-drawer-icon" style="background:${item.bg};color:${item.color};">
              <i class="${item.icon}"></i>
            </span>
            <span class="mob-drawer-link-label">${item.label}</span>
            <i class="fa-solid fa-chevron-right mob-drawer-chev"></i>
          </button>
        `).join('');

        drawer.innerHTML = `
          <!-- HEADER -->
          <div class="mob-drawer-hdr">
            <div class="mob-drawer-brand">
              <span class="mob-drawer-brand-icon">
                <i class="fa-solid fa-graduation-cap" style="transform:rotate(-45deg)"></i>
              </span>
              LearnUP
            </div>
            <button class="mob-drawer-x" id="mob-drawer-x" aria-label="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- USER CARD -->
          <div class="mob-drawer-user">
            <div class="mob-drawer-user-ava">
              <i class="fa-solid fa-user"></i>
            </div>
            <div class="mob-drawer-user-info">
              <span class="mob-drawer-user-name" id="mob-drawer-name">
                ${user ? (user.name || 'User') : 'Guest'}
              </span>
              <span class="mob-drawer-user-email" id="mob-drawer-email">
                ${user ? (user.email || '') : ''}
              </span>
            </div>
          </div>

          <!-- NAV -->
          <div class="mob-drawer-body">
            <p class="mob-drawer-section">Navigation</p>
            ${navHTML}

            <div class="mob-drawer-sep"></div>
            <p class="mob-drawer-section">Account</p>

            <button class="mob-drawer-link change-password-btn">
              <span class="mob-drawer-icon" style="background:#f0fdf4;color:#059669;">
                <i class="fa-solid fa-lock"></i>
              </span>
              <span class="mob-drawer-link-label">Change Password</span>
              <i class="fa-solid fa-chevron-right mob-drawer-chev"></i>
            </button>

            <div class="mob-drawer-sep"></div>

            <button class="mob-drawer-link mob-drawer-danger logout-btn">
              <span class="mob-drawer-icon" style="background:#fef2f2;color:#dc2626;">
                <i class="fa-solid fa-right-from-bracket"></i>
              </span>
              <span class="mob-drawer-link-label">Logout</span>
            </button>
          </div>

          <!-- FOOTER -->
          <div class="mob-drawer-foot">
            <span>LearnUP © 2026</span>
          </div>
        `;

        document.body.appendChild(drawer);

        // Wire close
        drawer.querySelector('#mob-drawer-x').addEventListener('click', _closeDrawer);

        // Wire nav links
        drawer.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                _closeDrawer();
                setTimeout(() => {
                    if (typeof animateTransition === 'function') animateTransition(view);
                }, 260);
            });
        });
        // Change password & logout wired in app.js via event delegation on body
    }

    function _openDrawer() {
        const drawer = document.getElementById('mob-drawer');
        const scrim  = document.getElementById('mob-drawer-scrim');
        const burger = document.getElementById('mob-burger-btn');
        if (!drawer) return;

        // Refresh user info
        const user = _getUser();
        const nameEl  = document.getElementById('mob-drawer-name');
        const emailEl = document.getElementById('mob-drawer-email');
        if (nameEl  && user) nameEl.textContent  = user.name  || 'User';
        if (emailEl && user) emailEl.textContent = user.email || '';

        drawer.classList.add('open');
        scrim  && scrim.classList.add('show');
        burger && burger.classList.add('open');
        document.body.style.overflow = 'hidden';
        _drawerOpen = true;
    }

    function _closeDrawer() {
        const drawer = document.getElementById('mob-drawer');
        const scrim  = document.getElementById('mob-drawer-scrim');
        const burger = document.getElementById('mob-burger-btn');
        if (!drawer) return;
        drawer.classList.remove('open');
        scrim  && scrim.classList.remove('show');
        burger && burger.classList.remove('open');
        document.body.style.overflow = '';
        _drawerOpen = false;
    }

    /* expose so app.js delegation can close drawer before opening modal */
    window.closeMobileDrawer = _closeDrawer;

    /* =========================================================================
       4. BOTTOM NAVIGATION
       ========================================================================= */
    function _buildBottomNav() {
        if (document.getElementById('mob-bottom-nav')) return;

        const nav = document.createElement('nav');
        nav.id = 'mob-bottom-nav';
        nav.className = 'mob-bottom-nav';
        nav.setAttribute('aria-label', 'App navigation');

        nav.innerHTML = NAV_ITEMS.map(item => {
            if (item.fab) {
                return `
                  <button class="mob-nav-btn mob-nav-fab" id="${item.id}"
                    data-views="${item.views.join(',')}" aria-label="${item.label}">
                    <span class="mob-nav-fab-disc">
                      <i class="${item.icon}"></i>
                    </span>
                    <span class="mob-nav-lbl">${item.label}</span>
                  </button>`;
            }
            return `
              <button class="mob-nav-btn" id="${item.id}"
                data-views="${item.views.join(',')}" aria-label="${item.label}">
                <i class="${item.icon}"></i>
                <span class="mob-nav-lbl">${item.label}</span>
              </button>`;
        }).join('');

        document.body.appendChild(nav);

        nav.querySelectorAll('.mob-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.views.split(',')[0];
                if (typeof animateTransition === 'function') animateTransition(view);
            });
        });
    }

    function _syncNav() {
        const view = (typeof AppState !== 'undefined' && AppState.currentView)
            ? AppState.currentView
            : 'articles';

        document.querySelectorAll('.mob-nav-btn').forEach(btn => {
            const views = (btn.dataset.views || '').split(',');
            btn.classList.toggle('active', views.includes(view));
        });

        // Hide bottom nav if not logged in or on auth/landing pages
        const nav = document.getElementById('mob-bottom-nav');
        if (nav) {
            const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : !!_getUser();
            if (!loggedIn || view === 'landing' || view === 'login' || view === 'register') {
                nav.style.display = 'none';
            } else {
                nav.style.display = 'flex';
            }
        }
    }

    /* expose for app.js to call after render */
    window.syncMobileNav = _syncNav;

    /* =========================================================================
       HELPERS
       ========================================================================= */
    function _el(tag, cls, html) {
        const e = document.createElement(tag);
        e.className = cls;
        if (html) e.innerHTML = html;
        return e;
    }

    function _getUser() {
        try {
            return JSON.parse(localStorage.getItem('user') || localStorage.getItem('learnup_user') || 'null');
        } catch { return null; }
    }

    /* =========================================================================
       KEYBOARD & SWIPE HANDLING
       ========================================================================= */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (_searchOpen) _closeSearch();
            else if (_drawerOpen) _closeDrawer();
        }
    });

    /* Swipe right to close drawer */
    let _tx = 0, _ty = 0;
    document.addEventListener('touchstart', e => {
        _tx = e.touches[0].clientX;
        _ty = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!_drawerOpen) return;
        const dx = e.changedTouches[0].clientX - _tx;
        const dy = Math.abs(e.changedTouches[0].clientY - _ty);
        if (dx > 55 && dy < 35) _closeDrawer();
    }, { passive: true });

    /* =========================================================================
       RESIZE — reset when switching from mobile → desktop
       ========================================================================= */
    let _resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => { if (isMobile()) init(); }, 200);
    });

    /* Auto-run on page load */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
