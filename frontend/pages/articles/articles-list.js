/**
 * Articles List Page — Fetch articles, render grid with pagination, filters, search, bookmarks
 */

const ARTICLES_PER_PAGE = 6;

/**
 * Fetch articles từ API và render lên grid
 */
async function fetchArticles() {
    try {
        const articles = await fetchArticlesAPI();
        AppState.articles = articles;
        applyFilters();
    } catch (error) {
        console.error('Failed to fetch articles:', error);
        const grid = document.getElementById('articles-grid');
        if (grid) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #94a3b8;">
                <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 16px; display: block;"></i>
                Failed to load articles. Please try again later.
            </div>`;
        }
    }
}

/**
 * Apply all active filters (tags, difficulty, search, saved) and re-render
 */
function applyFilters() {
    let result = [...AppState.articles];
    const searchInput = document.getElementById('articles-search-input');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Filter by saved articles
    if (AppState.showSavedOnly) {
        result = result.filter(a => AppState.bookmarkedArticles.includes(a.id));
    }

    // Filter by tags
    if (AppState.activeTagFilters.length > 0) {
        result = result.filter(article => {
            const tags = Array.isArray(article.tags) ? article.tags : (article.tags ? article.tags.split(',').map(t => t.trim()) : []);
            return AppState.activeTagFilters.some(filter =>
                tags.some(tag => tag.toLowerCase() === filter.toLowerCase())
            );
        });
    }

    // Filter by difficulty
    if (AppState.activeDifficultyFilter) {
        result = result.filter(article => {
            const diff = (article.difficulty || 'beginner').toLowerCase();
            return diff === AppState.activeDifficultyFilter.toLowerCase();
        });
    }

    // Search filter
    if (searchTerm) {
        result = result.filter(article =>
            (article.title || '').toLowerCase().includes(searchTerm) ||
            (article.content || '').toLowerCase().includes(searchTerm) ||
            (article.description || '').toLowerCase().includes(searchTerm)
        );
    }

    AppState.filteredArticles = result;
    AppState.currentPage = 1;
    renderArticlesGrid();
    renderActiveFiltersBar();
}

/**
 * Render active filters bar (tags, difficulty shown as pills)
 */
function renderActiveFiltersBar() {
    const bar = document.getElementById('active-filters-bar');
    const container = document.getElementById('active-tags-container');
    if (!bar || !container) return;

    const hasFilters = AppState.activeTagFilters.length > 0 || AppState.activeDifficultyFilter;

    if (!hasFilters) {
        bar.style.display = 'none';
        return;
    }

    bar.style.display = 'flex';
    let html = '';

    // Tag pills
    AppState.activeTagFilters.forEach(tag => {
        html += `<span class="active-tag">${escapeHtml(tag)}<button data-remove-tag="${tag}" title="Remove"><i class="fa-solid fa-xmark"></i></button></span>`;
    });

    // Difficulty pill
    if (AppState.activeDifficultyFilter) {
        html += `<span class="active-tag" style="background:#fffbeb;color:#d97706;border-color:#fde68a;">${escapeHtml(AppState.activeDifficultyFilter)}<button data-remove-difficulty title="Remove"><i class="fa-solid fa-xmark"></i></button></span>`;
    }

    container.innerHTML = html;

    // Attach remove events
    container.querySelectorAll('[data-remove-tag]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.removeTag;
            AppState.activeTagFilters = AppState.activeTagFilters.filter(t => t !== tag);
            // Uncheck sidebar checkbox
            const checkbox = document.querySelector(`.sidebar-filters input[type="checkbox"][value="${tag}"]`);
            if (checkbox) checkbox.checked = false;
            applyFilters();
        });
    });

    container.querySelectorAll('[data-remove-difficulty]').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.activeDifficultyFilter = null;
            // Uncheck sidebar radio
            document.querySelectorAll('.sidebar-filters input[name="difficulty"]').forEach(r => r.checked = false);
            applyFilters();
        });
    });
}

/**
 * Render articles grid với phân trang
 */
function renderArticlesGrid() {
    const grid = document.getElementById('articles-grid');
    if (!grid) return;

    const articles = AppState.filteredArticles;

    // Update title based on mode
    const titleEl = document.getElementById('discover-title');
    if (titleEl) {
        titleEl.textContent = AppState.showSavedOnly ? 'Saved Articles' : 'Discover';
    }

    if (articles.length === 0) {
        const emptyMsg = AppState.showSavedOnly
            ? 'No saved articles yet. Click the bookmark icon to save articles.'
            : 'No articles found.';
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #94a3b8;">
            <i class="${AppState.showSavedOnly ? 'far fa-bookmark' : 'fas fa-search'}" style="font-size: 32px; margin-bottom: 16px; display: block;"></i>
            ${emptyMsg}
        </div>`;
        renderPagination(0, 0);
        return;
    }

    // Phân trang
    const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
    if (AppState.currentPage < 1) AppState.currentPage = 1;
    if (AppState.currentPage > totalPages) AppState.currentPage = totalPages;

    const startIndex = (AppState.currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    const pageArticles = articles.slice(startIndex, endIndex);

    grid.innerHTML = pageArticles.map(article => createArticleCard(article)).join('');

    // Article click -> detail
    grid.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.bookmark-btn')) return;
            const articleId = card.dataset.articleId;
            const article = AppState.articles.find(a => a.id == articleId);
            if (article) {
                AppState.selectedArticle = article;
                animateTransition('article-detail');
            }
        });
    });

    // Attach bookmark events
    attachBookmarkEvents();
    renderPagination(totalPages, articles.length);

    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Render pagination buttons
 */
function renderPagination(totalPages, totalArticles) {
    const paginationEl = document.getElementById('articles-pagination');
    const infoEl = document.getElementById('pagination-info');

    if (!paginationEl) return;

    if (infoEl) {
        if (totalArticles === 0) {
            infoEl.textContent = '';
        } else {
            const start = (AppState.currentPage - 1) * ARTICLES_PER_PAGE + 1;
            const end = Math.min(AppState.currentPage * ARTICLES_PER_PAGE, totalArticles);
            infoEl.textContent = `Showing ${start}–${end} of ${totalArticles} articles`;
        }
    }

    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

    let html = '';
    html += `<button class="icon-btn ${AppState.currentPage === 1 ? 'disabled' : ''}" data-page="${AppState.currentPage - 1}" ${AppState.currentPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;
    const pages = getPaginationRange(AppState.currentPage, totalPages);
    pages.forEach(page => {
        if (page === '...') {
            html += `<span class="ellipsis">…</span>`;
        } else {
            html += `<button class="page-btn ${page === AppState.currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
        }
    });
    html += `<button class="icon-btn ${AppState.currentPage === totalPages ? 'disabled' : ''}" data-page="${AppState.currentPage + 1}" ${AppState.currentPage === totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;

    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page >= 1 && page <= totalPages && page !== AppState.currentPage) {
                AppState.currentPage = page;
                renderArticlesGrid();
            }
        });
    });
}

/**
 * Pagination range helper
 */
function getPaginationRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current <= 3) { pages.push(2, 3, 4, '...', total); }
    else if (current >= total - 2) { pages.push('...', total - 3, total - 2, total - 1, total); }
    else { pages.push('...', current - 1, current, current + 1, '...', total); }
    return pages;
}

/**
 * Attach bookmark button events with localStorage persistence
 */
function attachBookmarkEvents() {
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const index = AppState.bookmarkedArticles.indexOf(id);

            if (index > -1) {
                AppState.bookmarkedArticles.splice(index, 1);
                btn.classList.remove('active');
                btn.querySelector('i').className = 'far fa-bookmark';
            } else {
                AppState.bookmarkedArticles.push(id);
                btn.classList.add('active');
                btn.querySelector('i').className = 'fas fa-bookmark';
            }

            // Persist to localStorage
            localStorage.setItem('learnup_bookmarks', JSON.stringify(AppState.bookmarkedArticles));

            // If in saved-only mode and un-bookmarked, re-render
            if (AppState.showSavedOnly && index > -1) {
                applyFilters();
            }
        });
    });
}

/**
 * Attach events cho articles page
 */
function attachArticlesEvents() {
    // Navigation links
    const navLinks = {
        'nav-articles-library': 'vocabulary',
        'nav-articles-quiz': 'quiz',
        'nav-articles-dashboard': 'user-dashboard',
    };

    Object.entries(navLinks).forEach(([id, view]) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                animateTransition(view);
            });
        }
    });

    // View toggles (grid/list)
    const viewToggleBtns = document.querySelectorAll('.view-toggles button');
    viewToggleBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            viewToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const grid = document.getElementById('articles-grid');
            if (grid) grid.classList.toggle('list-view', index === 1);
        });
    });

    // Search input
    const searchInput = document.getElementById('articles-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }

    // Saved Articles toggle
    const savedToggle = document.getElementById('saved-articles-toggle');
    if (savedToggle) {
        savedToggle.addEventListener('click', () => {
            AppState.showSavedOnly = !AppState.showSavedOnly;
            const icon = savedToggle.querySelector('i');
            if (AppState.showSavedOnly) {
                savedToggle.style.background = '#eff6ff';
                savedToggle.style.borderColor = '#bfdbfe';
                savedToggle.style.color = '#2563eb';
                if (icon) icon.className = 'fas fa-bookmark';
            } else {
                savedToggle.style.background = 'none';
                savedToggle.style.borderColor = '#e2e8f0';
                savedToggle.style.color = '#64748b';
                if (icon) icon.className = 'far fa-bookmark';
            }
            applyFilters();
        });
    }

    // Apply Filters button
    const applyBtn = document.getElementById('apply-filters-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            // Collect checked topic filters
            const topicCheckboxes = document.querySelectorAll('.sidebar-filters input[type="checkbox"]:checked');
            AppState.activeTagFilters = Array.from(topicCheckboxes).map(cb => cb.value);

            // Collect difficulty filter
            const diffRadio = document.querySelector('.sidebar-filters input[name="difficulty"]:checked');
            AppState.activeDifficultyFilter = diffRadio ? diffRadio.value : null;

            applyFilters();
        });
    }

    // Reset Filters button
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            AppState.activeTagFilters = [];
            AppState.activeDifficultyFilter = null;
            AppState.showSavedOnly = false;

            // Uncheck all checkboxes and radios
            document.querySelectorAll('.sidebar-filters input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('.sidebar-filters input[name="difficulty"]').forEach(r => r.checked = false);

            // Reset saved toggle
            const savedToggle = document.getElementById('saved-articles-toggle');
            if (savedToggle) {
                savedToggle.style.background = 'none';
                savedToggle.style.borderColor = '#e2e8f0';
                savedToggle.style.color = '#64748b';
                const icon = savedToggle.querySelector('i');
                if (icon) icon.className = 'far fa-bookmark';
            }

            // Reset search
            const searchInput = document.getElementById('articles-search-input');
            if (searchInput) searchInput.value = '';

            applyFilters();
        });
    }

    // Fetch articles
    fetchArticles();
}
