/**
 * Article Card Component — Tạo card bài viết
 * Extracted from app.js createArticleCard()
 */

/**
 * Get difficulty badge HTML with color coding
 * @param {string} difficulty - beginner | intermediate | advanced
 * @returns {string} HTML string
 */
function getDifficultyBadge(difficulty) {
    const level = (difficulty || 'beginner').toLowerCase();
    const config = {
        beginner:     { label: 'Beginner',     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        intermediate: { label: 'Intermediate', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        advanced:     { label: 'Advanced',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    };
    const c = config[level] || config.beginner;
    return `<span class="difficulty-badge" style="background:${c.bg};color:${c.color};border:1px solid ${c.border};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;letter-spacing:0.3px;">${c.label}</span>`;
}

/**
 * Tạo HTML cho article card
 * @param {object} article - Dữ liệu bài viết
 * @returns {string} HTML string
 */
function createArticleCard(article) {
    const isBookmarked = AppState.bookmarkedArticles.includes(article.id);
    const imageUrl = article.image_url || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80';
    // Backend may return tags as array or comma-separated string
    const tags = Array.isArray(article.tags) ? article.tags : (article.tags ? article.tags.split(',').map(t => t.trim()) : []);
    const firstTag = tags.length > 0 ? tags[0] : 'General';

    return `
        <div class="article-card" data-article-id="${article.id}">
            <div class="card-img-wrapper">
                <img src="${imageUrl}" alt="${escapeHtml(article.title)}" 
                     onerror="this.src='https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80'">
            </div>
            <div class="card-content">
                <div class="card-meta-row" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                    <span class="category-tag" style="margin-bottom:0;">${escapeHtml(firstTag)}</span>
                    ${getDifficultyBadge(article.difficulty)}
                </div>
                <h3>${escapeHtml(article.title)}</h3>
                <p class="card-excerpt">${escapeHtml(article.description || article.content || '')}</p>
                <div class="card-footer">
                    <div class="author">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(article.author || 'Author')}&background=2563eb&color=fff&size=32" alt="Author">
                        <span>${escapeHtml(article.author || 'LearnUP')}</span>
                    </div>
                    <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" data-id="${article.id}" title="${isBookmarked ? 'Remove bookmark' : 'Save article'}">
                        <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}
