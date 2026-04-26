/**
 * Admin Module — Full CRUD for Articles, Tags, and User Management
 * All API calls use apiFetch() from services/api.js (includes Bearer token).
 */

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────

/** Show a modal overlay by ID */
function adminShowModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
}

/** Hide a modal overlay by ID */
function adminHideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

/** Generic confirm modal — resolves true on OK, false on Cancel */
function adminConfirm(title, text) {
    return new Promise((resolve) => {
        const titleEl = document.getElementById('admin-confirm-title');
        const textEl = document.getElementById('admin-confirm-text');
        const okBtn = document.getElementById('admin-confirm-ok');
        const cancelBtn = document.getElementById('admin-confirm-cancel');

        if (titleEl) titleEl.textContent = title;
        if (textEl) textEl.textContent = text;

        adminShowModal('admin-confirm-overlay');

        const cleanup = (result) => {
            adminHideModal('admin-confirm-overlay');
            okBtn.replaceWith(okBtn.cloneNode(true));
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            resolve(result);
        };

        // Re-query after clone
        document.getElementById('admin-confirm-ok').addEventListener('click', () => cleanup(true), { once: true });
        document.getElementById('admin-confirm-cancel').addEventListener('click', () => cleanup(false), { once: true });

        // Close on overlay click
        document.getElementById('admin-confirm-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'admin-confirm-overlay') cleanup(false);
        }, { once: true });
    });
}

/** Show a toast notification */
function adminToast(message, type = 'success') {
    let toastContainer = document.getElementById('admin-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'admin-toast-container';
        toastContainer.style.cssText = 'position:fixed;top:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const color = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb';
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';
    toast.style.cssText = `background:#fff;border-left:4px solid ${color};padding:14px 20px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);font-size:14px;color:#0f172a;display:flex;align-items:center;gap:10px;min-width:280px;animation:fadeInRight 0.3s ease;`;
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${color};font-size:16px;"></i>${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

/** Set sidebar username from AppState */
function adminSetSidebarName(nameId) {
    const el = document.getElementById(nameId);
    if (el && AppState.user) el.textContent = AppState.user.name || 'Admin';
}

// ─────────────────────────────────────────────
// ADMIN ARTICLES
// ─────────────────────────────────────────────

function initAdminArticles() {
    adminSetSidebarName('admin-sidebar-name');
    setupAdminSidebarNav({
        'nav-admin-articles': 'admin-articles',
        'nav-admin-categories': 'admin-categories',
        'nav-admin-users': 'admin-users',
    });

    fetchAdminArticles();
    setupArticleModal();
    setupArticleSearch();
}

let _allAdminArticles = [];

async function fetchAdminArticles() {
    const tbody = document.getElementById('admin-articles-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Loading articles...</td></tr>`;

    try {
        const data = await apiFetch('/api/articles');
        _allAdminArticles = (data.success && data.data) ? data.data : [];
        renderAdminArticlesTable(_allAdminArticles);
        updateAdminArticleStats(_allAdminArticles);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:40px;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i>Failed to connect to backend. Is the server running?</td></tr>`;
    }
}

function updateAdminArticleStats(articles) {
    const statTotal = document.getElementById('admin-stat-total');
    const statMonth = document.getElementById('admin-stat-month');

    if (statTotal) statTotal.textContent = articles.length;

    if (statMonth) {
        const now = new Date();
        const thisMonth = articles.filter(a => {
            if (!a.created_at) return false;
            const d = new Date(a.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        statMonth.textContent = thisMonth;
    }

    // Fetch tag count for stat
    apiFetch('/api/tags').then(tagData => {
        const statTags = document.getElementById('admin-stat-tags');
        if (statTags && tagData.data) statTags.textContent = tagData.data.length;
    }).catch(() => {});
}

function renderAdminArticlesTable(articles) {
    const tbody = document.getElementById('admin-articles-tbody');
    const showing = document.getElementById('admin-articles-showing');
    if (!tbody) return;

    if (!articles || articles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:#64748b;">No articles found.</td></tr>`;
        if (showing) showing.textContent = 'No articles found';
        return;
    }

    if (showing) showing.textContent = `Showing ${articles.length} article${articles.length !== 1 ? 's' : ''}`;

    tbody.innerHTML = '';
    articles.forEach(article => {
        const tags = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '—');
        const dateStr = article.created_at
            ? new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:#0f172a;font-weight:500;max-width:280px;" class="truncate-1">${article.title}</td>
            <td><span style="color:#3b82f6;font-size:13px;">${tags}</span></td>
            <td style="color:#64748b;">${dateStr}</td>
            <td>
                <button class="action-icon admin-edit-article-btn" data-id="${article.id}" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-icon text-red admin-delete-article-btn" data-id="${article.id}" data-title="${article.title.replace(/"/g, '&quot;')}" title="Delete">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Attach row-level events
    tbody.querySelectorAll('.admin-edit-article-btn').forEach(btn => {
        btn.addEventListener('click', () => openArticleModal(btn.dataset.id));
    });
    tbody.querySelectorAll('.admin-delete-article-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteArticle(btn.dataset.id, btn.dataset.title));
    });
}

function setupArticleSearch() {
    const input = document.getElementById('admin-articles-search');
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        const filtered = q
            ? _allAdminArticles.filter(a => a.title.toLowerCase().includes(q))
            : _allAdminArticles;
        renderAdminArticlesTable(filtered);
    });
}

// ── Article Modal ──────────────────────────────

let _availableTags = [];

async function loadTagsForPicker() {
    try {
        const data = await apiFetch('/api/tags');
        _availableTags = (data.success && data.data) ? data.data : [];
    } catch (e) {
        _availableTags = [];
    }
}

function renderTagPicker(selectedTagIds = []) {
    const container = document.getElementById('article-modal-tags');
    if (!container) return;

    if (_availableTags.length === 0) {
        container.innerHTML = '<span style="color:#94a3b8;font-size:13px;">No tags available</span>';
        return;
    }

    container.innerHTML = _availableTags.map(tag => {
        const checked = selectedTagIds.includes(tag.id) ? 'checked' : '';
        return `
            <label class="admin-tag-checkbox">
                <input type="checkbox" value="${tag.id}" ${checked}>
                <span>${tag.name}</span>
            </label>
        `;
    }).join('');
}

function getSelectedTagIds() {
    const checkboxes = document.querySelectorAll('#article-modal-tags input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

function setupArticleModal() {
    const addBtn = document.getElementById('add-new-article-btn');
    if (addBtn) addBtn.addEventListener('click', () => openArticleModal(null));

    const closeBtn = document.getElementById('article-modal-close');
    const cancelBtn = document.getElementById('article-modal-cancel');
    if (closeBtn) closeBtn.addEventListener('click', () => { adminHideModal('article-modal-overlay'); resetImageUploadUI(); });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { adminHideModal('article-modal-overlay'); resetImageUploadUI(); });

    // Close on overlay click
    const overlay = document.getElementById('article-modal-overlay');
    if (overlay) overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { adminHideModal('article-modal-overlay'); resetImageUploadUI(); }
    });

    const saveBtn = document.getElementById('article-modal-save');
    if (saveBtn) saveBtn.addEventListener('click', saveArticle);

    // Setup image tabs
    setupImageTabs();

    // Load tags for the picker
    loadTagsForPicker();
}

async function openArticleModal(articleId) {
    const modalTitle = document.getElementById('article-modal-title');
    const idInput = document.getElementById('article-modal-id');
    const titleInput = document.getElementById('article-modal-title-input');
    const contentInput = document.getElementById('article-modal-content');
    const imageInput = document.getElementById('article-modal-image');
    const difficultySelect = document.getElementById('article-modal-difficulty');

    // Reset image upload UI to URL tab
    resetImageUploadUI();

    // Refresh tags
    await loadTagsForPicker();

    if (articleId) {
        // Edit mode — fetch latest data
        if (modalTitle) modalTitle.textContent = 'Edit Article';
        if (idInput) idInput.value = articleId;

        try {
            const data = await apiFetch(`/api/articles/${articleId}`);
            const article = data.data;
            if (titleInput) titleInput.value = article.title || '';
            if (contentInput) contentInput.value = article.content || '';
            if (imageInput) imageInput.value = article.image_url || '';
            if (difficultySelect) difficultySelect.value = article.difficulty || 'Beginner';

            // Map tag names → IDs
            const tagNames = Array.isArray(article.tags) ? article.tags : [];
            const selectedIds = _availableTags
                .filter(t => tagNames.includes(t.name))
                .map(t => t.id);
            renderTagPicker(selectedIds);
        } catch (e) {
            adminToast('Failed to load article data', 'error');
            return;
        }
    } else {
        // Create mode
        if (modalTitle) modalTitle.textContent = 'Add New Article';
        if (idInput) idInput.value = '';
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        if (imageInput) imageInput.value = '';
        if (difficultySelect) difficultySelect.value = 'Beginner';
        renderTagPicker([]);
    }

    adminShowModal('article-modal-overlay');
    if (titleInput) titleInput.focus();
}

async function saveArticle() {
    const id = document.getElementById('article-modal-id')?.value;
    const title = document.getElementById('article-modal-title-input')?.value.trim();
    const content = document.getElementById('article-modal-content')?.value.trim();
    const image_url = document.getElementById('article-modal-image')?.value.trim();
    const difficulty = document.getElementById('article-modal-difficulty')?.value || 'Beginner';
    const tag_ids = getSelectedTagIds();
    const saveBtn = document.getElementById('article-modal-save');

    if (!title) { adminToast('Title is required', 'error'); return; }
    if (!content) { adminToast('Content is required', 'error'); return; }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }

    try {
        if (id) {
            await apiFetch(`/api/articles/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title, content, image_url, difficulty, tag_ids }),
            });
            adminToast('Article updated successfully!');
        } else {
            await apiFetch('/api/articles', {
                method: 'POST',
                body: JSON.stringify({ title, content, image_url, difficulty, tag_ids }),
            });
            adminToast('Article created successfully!');
        }
        adminHideModal('article-modal-overlay');
        await fetchAdminArticles();
    } catch (err) {
        adminToast(err.message || 'Failed to save article', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Article'; }
    }
}

async function deleteArticle(articleId, title) {
    const confirmed = await adminConfirm(
        'Delete Article',
        `Are you sure you want to delete "${title}"? This will also remove all vocabulary entries linked to it.`
    );
    if (!confirmed) return;

    try {
        await apiFetch(`/api/articles/${articleId}`, { method: 'DELETE' });
        adminToast('Article deleted.');
        await fetchAdminArticles();
    } catch (err) {
        adminToast(err.message || 'Failed to delete article', 'error');
    }
}

// ─────────────────────────────────────────────
// ADMIN CATEGORIES (TAGS)
// ─────────────────────────────────────────────

function initAdminCategories() {
    adminSetSidebarName('cat-sidebar-name');
    setupAdminSidebarNav({
        'nav-cat-articles': 'admin-articles',
        'nav-cat-categories': 'admin-categories',
        'nav-cat-users': 'admin-users',
    });

    fetchAdminCategories();
    setupTagModal();
    setupCategorySearch();
}

let _allAdminTags = [];

async function fetchAdminCategories() {
    const tbody = document.getElementById('admin-categories-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Loading categories...</td></tr>`;

    try {
        const data = await apiFetch('/api/tags');
        _allAdminTags = (data.success && data.data) ? data.data : [];
        renderAdminCategoriesTable(_allAdminTags);
        updateCategoryStats(_allAdminTags);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:40px;">Failed to connect to backend.</td></tr>`;
    }
}

function updateCategoryStats(tags) {
    const total = document.getElementById('cat-stat-total');
    const most = document.getElementById('cat-stat-most');
    const mostCount = document.getElementById('cat-stat-most-count');
    const empty = document.getElementById('cat-stat-empty');
    const emptyLabel = document.getElementById('cat-stat-empty-label');

    if (total) total.textContent = tags.length;

    const sorted = [...tags].sort((a, b) => b.article_count - a.article_count);
    if (most && sorted.length > 0) most.textContent = sorted[0].name;
    if (mostCount && sorted.length > 0) mostCount.textContent = `${sorted[0].article_count} article${sorted[0].article_count !== 1 ? 's' : ''} linked`;

    const emptyCount = tags.filter(t => t.article_count === 0).length;
    if (empty) empty.textContent = emptyCount;
    if (emptyLabel) emptyLabel.textContent = emptyCount > 0 ? 'Action required' : 'All categories in use';
}

function renderAdminCategoriesTable(tags) {
    const tbody = document.getElementById('admin-categories-tbody');
    const showing = document.getElementById('admin-cats-showing');
    if (!tbody) return;

    if (!tags || tags.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:#64748b;">No categories found.</td></tr>`;
        if (showing) showing.textContent = 'No categories found';
        return;
    }

    if (showing) showing.textContent = `Showing ${tags.length} categor${tags.length !== 1 ? 'ies' : 'y'}`;

    tbody.innerHTML = '';
    tags.forEach(tag => {
        const slug = tag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const countColor = tag.article_count === 0 ? 'count-orange' : tag.article_count < 3 ? 'count-blue' : 'count-green';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:#0f172a;font-weight:500;">
                <i class="fa-solid fa-tag" style="color:#3b82f6;margin-right:8px;font-size:13px;"></i>${tag.name}
            </td>
            <td><span style="color:#64748b;font-family:monospace;font-size:13px;">${slug}</span></td>
            <td><span class="count-badge ${countColor}">${tag.article_count}</span></td>
            <td>
                <button class="action-icon admin-edit-tag-btn" data-id="${tag.id}" data-name="${tag.name.replace(/"/g, '&quot;')}" title="Rename">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-icon text-red admin-delete-tag-btn" data-id="${tag.id}" data-name="${tag.name.replace(/"/g, '&quot;')}" title="Delete">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.admin-edit-tag-btn').forEach(btn => {
        btn.addEventListener('click', () => openTagModal(btn.dataset.id, btn.dataset.name));
    });
    tbody.querySelectorAll('.admin-delete-tag-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteTag(btn.dataset.id, btn.dataset.name));
    });
}

function setupCategorySearch() {
    const input = document.getElementById('admin-cats-search');
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        const filtered = q ? _allAdminTags.filter(t => t.name.toLowerCase().includes(q)) : _allAdminTags;
        renderAdminCategoriesTable(filtered);
    });
}

// ── Tag Modal ──────────────────────────────

function setupTagModal() {
    const addBtn = document.getElementById('add-new-category-btn');
    if (addBtn) addBtn.addEventListener('click', () => openTagModal(null, null));

    const closeBtn = document.getElementById('tag-modal-close');
    const cancelBtn = document.getElementById('tag-modal-cancel');
    if (closeBtn) closeBtn.addEventListener('click', () => adminHideModal('tag-modal-overlay'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => adminHideModal('tag-modal-overlay'));

    const overlay = document.getElementById('tag-modal-overlay');
    if (overlay) overlay.addEventListener('click', (e) => {
        if (e.target === overlay) adminHideModal('tag-modal-overlay');
    });

    const saveBtn = document.getElementById('tag-modal-save');
    if (saveBtn) saveBtn.addEventListener('click', saveTag);

    const nameInput = document.getElementById('tag-modal-name-input');
    if (nameInput) nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveTag();
    });
}

function openTagModal(tagId, tagName) {
    const modalTitle = document.getElementById('tag-modal-title');
    const idInput = document.getElementById('tag-modal-id');
    const nameInput = document.getElementById('tag-modal-name-input');

    if (tagId) {
        if (modalTitle) modalTitle.textContent = 'Rename Tag';
        if (idInput) idInput.value = tagId;
        if (nameInput) nameInput.value = tagName || '';
    } else {
        if (modalTitle) modalTitle.textContent = 'Add New Tag';
        if (idInput) idInput.value = '';
        if (nameInput) nameInput.value = '';
    }

    adminShowModal('tag-modal-overlay');
    if (nameInput) nameInput.focus();
}

async function saveTag() {
    const id = document.getElementById('tag-modal-id')?.value;
    const name = document.getElementById('tag-modal-name-input')?.value.trim();
    const saveBtn = document.getElementById('tag-modal-save');

    if (!name) { adminToast('Tag name is required', 'error'); return; }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }

    try {
        if (id) {
            await apiFetch(`/api/tags/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name }),
            });
            adminToast('Tag renamed successfully!');
        } else {
            await apiFetch('/api/tags', {
                method: 'POST',
                body: JSON.stringify({ name }),
            });
            adminToast('Tag created successfully!');
        }
        adminHideModal('tag-modal-overlay');
        await fetchAdminCategories();
    } catch (err) {
        adminToast(err.message || 'Failed to save tag', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Tag'; }
    }
}

async function deleteTag(tagId, name) {
    const confirmed = await adminConfirm(
        'Delete Tag',
        `Are you sure you want to delete the tag "${name}"? Articles using this tag will lose this category.`
    );
    if (!confirmed) return;

    try {
        await apiFetch(`/api/tags/${tagId}`, { method: 'DELETE' });
        adminToast('Tag deleted.');
        await fetchAdminCategories();
    } catch (err) {
        adminToast(err.message || 'Failed to delete tag', 'error');
    }
}

// ─────────────────────────────────────────────
// ADMIN USERS
// ─────────────────────────────────────────────

function initAdminUsers() {
    adminSetSidebarName('users-sidebar-name');
    setupAdminSidebarNav({
        'nav-users-articles': 'admin-articles',
        'nav-users-categories': 'admin-categories',
        'nav-users-users': 'admin-users',
    });

    fetchAdminUsers();
    setupUsersSearch();
    setupUserModal();
}

let _allAdminUsers = [];

async function fetchAdminUsers() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Loading users...</td></tr>`;

    try {
        const data = await apiFetch('/api/users');
        _allAdminUsers = (data.success && data.data) ? data.data : [];
        renderAdminUsersTable(_allAdminUsers);
        updateUserStats(_allAdminUsers);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:40px;">Failed to load users. Are you logged in as admin?</td></tr>`;
    }
}

function updateUserStats(users) {
    const total = document.getElementById('users-stat-total');
    const admins = document.getElementById('users-stat-admins');
    const month = document.getElementById('users-stat-month');

    if (total) total.textContent = users.length;
    if (admins) admins.textContent = users.filter(u => u.role === 'admin').length;

    if (month) {
        const now = new Date();
        const thisMonth = users.filter(u => {
            if (!u.created_at) return false;
            const d = new Date(u.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        month.textContent = thisMonth;
    }
}

function renderAdminUsersTable(users) {
    const tbody = document.getElementById('admin-users-tbody');
    const showing = document.getElementById('admin-users-showing');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#64748b;">No users found.</td></tr>`;
        if (showing) showing.textContent = 'No users found';
        return;
    }

    if (showing) showing.textContent = `Showing ${users.length} user${users.length !== 1 ? 's' : ''}`;

    tbody.innerHTML = '';
    users.forEach(user => {
        const dateStr = user.created_at
            ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';
        const roleColor = user.role === 'admin' ? '#7c3aed' : '#0284c7';
        const roleBg = user.role === 'admin' ? '#f5f3ff' : '#f0f9ff';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:#0f172a;font-weight:500;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0;">
                        ${user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    ${user.name || '—'}
                </div>
            </td>
            <td style="color:#64748b;">${user.email}</td>
            <td>
                <span style="background:${roleBg};color:${roleColor};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;text-transform:capitalize;">
                    ${user.role}
                </span>
            </td>
            <td style="color:#64748b;">${dateStr}</td>
            <td>
                <button class="action-icon text-red admin-delete-user-btn" data-id="${user.id}" data-name="${(user.name || '').replace(/"/g, '&quot;')}" title="Delete User">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Attach delete events
    tbody.querySelectorAll('.admin-delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(parseInt(btn.dataset.id), btn.dataset.name));
    });
}

function setupUsersSearch() {
    const input = document.getElementById('admin-users-search');
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        const filtered = q
            ? _allAdminUsers.filter(u =>
                u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
            )
            : _allAdminUsers;
        renderAdminUsersTable(filtered);
    });
}

// ─────────────────────────────────────────────
// SHARED SIDEBAR NAV SETUP
// ─────────────────────────────────────────────

function setupAdminSidebarNav(linkMap) {
    Object.entries(linkMap).forEach(([id, view]) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                animateTransition(view);
            });
        }
    });
}

// ─────────────────────────────────────────────
// USER MODAL (Create)
// ─────────────────────────────────────────────

function setupUserModal() {
    // Wire Add User button (may not exist if we're not on users page yet, so check repeatedly)
    const wireAddBtn = () => {
        const addBtn = document.getElementById('add-new-user-btn');
        if (addBtn && !addBtn._wired) {
            addBtn._wired = true;
            addBtn.addEventListener('click', openUserModal);
        }
    };
    wireAddBtn();
    // Also try after short delay in case DOM isn't ready
    setTimeout(wireAddBtn, 300);

    const closeBtn = document.getElementById('user-modal-close');
    const cancelBtn = document.getElementById('user-modal-cancel');
    if (closeBtn) closeBtn.addEventListener('click', () => adminHideModal('user-modal-overlay'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => adminHideModal('user-modal-overlay'));

    const overlay = document.getElementById('user-modal-overlay');
    if (overlay) overlay.addEventListener('click', (e) => {
        if (e.target === overlay) adminHideModal('user-modal-overlay');
    });

    const saveBtn = document.getElementById('user-modal-save');
    if (saveBtn) saveBtn.addEventListener('click', adminSaveUser);
}

function openUserModal() {
    const nameInput = document.getElementById('user-modal-name');
    const emailInput = document.getElementById('user-modal-email');
    const passInput = document.getElementById('user-modal-password');
    const roleSelect = document.getElementById('user-modal-role');
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';
    if (roleSelect) roleSelect.value = 'user';
    adminShowModal('user-modal-overlay');
    if (nameInput) nameInput.focus();
}

async function adminSaveUser() {
    const name = document.getElementById('user-modal-name')?.value.trim();
    const email = document.getElementById('user-modal-email')?.value.trim();
    const password = document.getElementById('user-modal-password')?.value;
    const role = document.getElementById('user-modal-role')?.value || 'user';
    const saveBtn = document.getElementById('user-modal-save');

    if (!name) { adminToast('Name is required', 'error'); return; }
    if (!email) { adminToast('Email is required', 'error'); return; }
    if (!password || password.length < 8) { adminToast('Password must be at least 8 characters', 'error'); return; }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...'; }

    try {
        await apiFetch('/api/users/admin-create', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role }),
        });
        adminToast(`User "${name}" created successfully!`);
        adminHideModal('user-modal-overlay');
        await fetchAdminUsers();
    } catch (err) {
        adminToast(err.message || 'Failed to create user', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Create User'; }
    }
}

async function deleteUser(userId, name) {
    const confirmed = await adminConfirm(
        'Delete User',
        `Are you sure you want to delete the account of "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
        await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
        adminToast('User deleted successfully.');
        await fetchAdminUsers();
    } catch (err) {
        adminToast(err.message || 'Failed to delete user', 'error');
    }
}

// ─────────────────────────────────────────────
// IMAGE UPLOAD TABS
// ─────────────────────────────────────────────

function setupImageTabs() {
    const urlBtn = document.getElementById('img-tab-url-btn');
    const fileBtn = document.getElementById('img-tab-file-btn');
    const urlDiv = document.getElementById('img-input-url');
    const fileDiv = document.getElementById('img-input-file');
    const dropZone = document.getElementById('img-drop-zone');
    const fileInput = document.getElementById('article-modal-file');

    if (!urlBtn || !fileBtn) return;

    urlBtn.addEventListener('click', () => {
        urlBtn.style.cssText = 'flex:1;padding:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:#eff6ff;color:#2563eb;transition:all .2s;';
        fileBtn.style.cssText = 'flex:1;padding:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:#f8fafc;color:#64748b;transition:all .2s;';
        if (urlDiv) urlDiv.style.display = '';
        if (fileDiv) fileDiv.style.display = 'none';
    });

    fileBtn.addEventListener('click', () => {
        fileBtn.style.cssText = 'flex:1;padding:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:#eff6ff;color:#2563eb;transition:all .2s;';
        urlBtn.style.cssText = 'flex:1;padding:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:#f8fafc;color:#64748b;transition:all .2s;';
        if (urlDiv) urlDiv.style.display = 'none';
        if (fileDiv) fileDiv.style.display = '';
    });

    // Drop zone click → trigger file input
    if (dropZone) dropZone.addEventListener('click', () => fileInput && fileInput.click());

    // Drag & drop styling
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#2563eb'; dropZone.style.background = '#eff6ff'; });
        dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = ''; });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
        });
    }

    if (fileInput) fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });
}

function resetImageUploadUI() {
    const urlBtn = document.getElementById('img-tab-url-btn');
    const fileBtn = document.getElementById('img-tab-file-btn');
    const urlDiv = document.getElementById('img-input-url');
    const fileDiv = document.getElementById('img-input-file');
    const progress = document.getElementById('img-upload-progress');
    const preview = document.getElementById('img-preview');
    const fileInput = document.getElementById('article-modal-file');

    if (urlBtn) urlBtn.style.cssText = 'flex:1;padding:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:#eff6ff;color:#2563eb;transition:all .2s;';
    if (fileBtn) fileBtn.style.cssText = 'flex:1;padding:8px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:#f8fafc;color:#64748b;transition:all .2s;';
    if (urlDiv) urlDiv.style.display = '';
    if (fileDiv) fileDiv.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
}

async function handleFileUpload(file) {
    const progress = document.getElementById('img-upload-progress');
    const bar = document.getElementById('img-progress-bar');
    const status = document.getElementById('img-upload-status');
    const preview = document.getElementById('img-preview');
    const previewImg = document.getElementById('img-preview-img');
    const previewName = document.getElementById('img-preview-name');
    const imageInput = document.getElementById('article-modal-image');

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        adminToast('File too large. Max 10 MB.', 'error');
        return;
    }

    // Show progress
    if (progress) progress.style.display = '';
    if (preview) preview.style.display = 'none';
    if (bar) bar.style.width = '30%';
    if (status) status.textContent = `Uploading ${file.name}...`;

    try {
        const token = localStorage.getItem('token') || '';
        const formData = new FormData();
        formData.append('file', file);

        if (bar) bar.style.width = '60%';

        const resp = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        const result = await resp.json();

        if (!resp.ok || !result.success) {
            throw new Error(result.detail || result.message || 'Upload failed');
        }

        if (bar) bar.style.width = '100%';
        if (status) status.textContent = 'Upload complete!';

        // Set the image URL field
        if (imageInput) imageInput.value = result.url;

        // Show preview
        setTimeout(() => {
            if (progress) progress.style.display = 'none';
            if (preview) preview.style.display = '';
            if (previewImg) {
                if (file.type.startsWith('image/')) {
                    previewImg.src = result.url;
                    previewImg.style.display = '';
                } else {
                    previewImg.style.display = 'none';
                }
            }
            if (previewName) previewName.textContent = `✅ ${file.name} uploaded successfully`;
        }, 400);

        adminToast(`File "${file.name}" uploaded!`);
    } catch (err) {
        if (progress) progress.style.display = 'none';
        adminToast(err.message || 'Upload failed', 'error');
    }
}