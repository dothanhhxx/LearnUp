/**
 * Vocabulary Page — Rich vocabulary library with Vietnamese meaning,
 * pronunciation, example sentences fetched from API.
 */

let _vocabData = [];       // cached API data
let vocabCurrentPage = 1;
const vocabPerPage = 5;

/**
 * Load vocabulary from API and render
 */
async function loadVocabulary() {
    const tbody = document.getElementById('vocab-tbody');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center;padding:40px 0;color:#94a3b8;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;display:block;"></i>
                Loading your vocabulary...
            </td>
        </tr>
    `;

    try {
        const response = await fetchVocabularyAPI();
        if (response.success) {
            _vocabData = response.data || [];
        } else {
            _vocabData = [];
        }
    } catch (err) {
        console.error('Failed to load vocabulary:', err);
        _vocabData = [];
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:40px 0;color:#ef4444;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:24px;margin-bottom:12px;display:block;"></i>
                    Failed to load vocabulary. Please try again.
                </td>
            </tr>
        `;
        return;
    }

    vocabCurrentPage = 1;
    renderVocabTable();
}

/**
 * Render vocabulary table with rich display (from cached _vocabData)
 */
function renderVocabTable(searchTerm = '') {
    const tbody = document.getElementById('vocab-tbody');
    if (!tbody) return;

    let data = _vocabData;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        data = data.filter(v =>
            (v.word && v.word.toLowerCase().includes(term)) ||
            (v.definition && v.definition.toLowerCase().includes(term)) ||
            (v.vietnamese && v.vietnamese.toLowerCase().includes(term))
        );
    }

    // Handle empty state
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:48px 0;color:#94a3b8;">
                    <i class="fa-regular fa-bookmark" style="font-size:36px;margin-bottom:16px;display:block;color:#cbd5e1;"></i>
                    <p style="font-size:16px;font-weight:600;color:#64748b;margin-bottom:6px;">
                        ${searchTerm ? 'No words match your search.' : 'Your library is empty'}
                    </p>
                    <p style="font-size:14px;color:#94a3b8;">
                        ${searchTerm ? 'Try a different keyword.' : 'Read articles and save new words to build your vocabulary!'}
                    </p>
                </td>
            </tr>
        `;

        const showingText = document.getElementById('vocab-showing-text');
        if (showingText) showingText.textContent = '0 words';
        const paginationEl = document.getElementById('vocab-pagination');
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }

    const start = (vocabCurrentPage - 1) * vocabPerPage;
    const paged = data.slice(start, start + vocabPerPage);

    tbody.innerHTML = paged.map(v => {
        const word = escapeHtml(v.word || '');
        const phonetic = escapeHtml(v.phonetic || '');
        const definition = escapeHtml(v.definition || '');
        const example = escapeHtml(v.example || '');
        const vietnamese = escapeHtml(v.vietnamese || '');
        const articleTitle = escapeHtml(v.article_title || '');
        const createdAt = v.created_at ? new Date(v.created_at).toLocaleDateString('vi-VN') : '';

        return `
        <tr class="vocab-rich-row" data-vocab-id="${v.id}">
            <!-- WORD + PHONETIC + AUDIO -->
            <td style="vertical-align:top;width:200px;padding:16px 12px;">
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <strong style="font-size:17px;color:#0f172a;letter-spacing:-0.3px;">${word}</strong>
                        <button class="btn-play-audio" data-word="${word}" title="Play pronunciation"
                            style="background:none;border:none;cursor:pointer;color:#3b82f6;font-size:14px;padding:4px;border-radius:50%;transition:all .2s;display:flex;align-items:center;justify-content:center;width:28px;height:28px;"
                            onmouseenter="this.style.background='#eff6ff';"
                            onmouseleave="this.style.background='none';">
                            <i class="fa-solid fa-volume-high"></i>
                        </button>
                    </div>
                    <span style="font-size:13px;color:#94a3b8;font-style:italic;">${phonetic}</span>
                    ${vietnamese ? `
                        <div style="margin-top:4px;background:#eff6ff;border-radius:6px;padding:5px 8px;display:inline-block;max-width:fit-content;">
                            <span style="font-size:11px;color:#2563eb;font-weight:700;letter-spacing:0.3px;">🇻🇳</span>
                            <span style="font-size:13px;color:#1e40af;font-weight:600;margin-left:4px;">${vietnamese}</span>
                        </div>
                    ` : ''}
                </div>
            </td>

            <!-- DEFINITION -->
            <td class="vocab-meaning-cell" style="vertical-align:top;padding:16px 12px;">
                <p style="font-size:14px;color:#334155;line-height:1.5;margin:0;">${definition || '<span style="color:#cbd5e1;font-style:italic;">No definition</span>'}</p>
            </td>

            <!-- EXAMPLE -->
            <td class="vocab-example-cell" style="vertical-align:top;padding:16px 12px;">
                ${example ? `
                    <p style="font-size:13px;color:#64748b;line-height:1.5;margin:0;font-style:italic;border-left:3px solid #e2e8f0;padding-left:10px;">
                        "${example}"
                    </p>
                ` : '<span style="color:#cbd5e1;font-style:italic;font-size:13px;">No example</span>'}
                ${articleTitle ? `
                    <div style="margin-top:8px;display:flex;align-items:center;gap:4px;">
                        <i class="fa-regular fa-newspaper" style="font-size:10px;color:#94a3b8;"></i>
                        <span style="font-size:11px;color:#94a3b8;">${articleTitle}</span>
                    </div>
                ` : ''}
            </td>

            <!-- ACTIONS -->
            <td style="vertical-align:top;padding:16px 8px;width:50px;">
                <button class="btn-delete-vocab" title="Remove from library" data-id="${v.id}"
                    style="background:none;border:none;color:#cbd5e1;cursor:pointer;font-size:15px;padding:8px;border-radius:8px;transition:all .2s;display:flex;align-items:center;justify-content:center;"
                    onmouseenter="this.style.color='#ef4444';this.style.background='#fef2f2';"
                    onmouseleave="this.style.color='#cbd5e1';this.style.background='none';">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    // Attach delete events (no confirmation)
    tbody.querySelectorAll('.btn-delete-vocab').forEach(btn => {
        btn.addEventListener('click', () => deleteVocabWord(btn.dataset.id));
    });

    // Attach audio play events
    tbody.querySelectorAll('.btn-play-audio').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            playVocabAudio(btn.dataset.word, btn);
        });
    });

    // Update showing text
    const showingText = document.getElementById('vocab-showing-text');
    if (showingText) {
        showingText.textContent = `Showing ${start + 1}–${Math.min(start + vocabPerPage, data.length)} of ${data.length} words`;
    }

    // Render pagination
    renderVocabPagination(data.length, searchTerm);
}

/**
 * Render pagination controls
 */
function renderVocabPagination(totalItems, searchTerm) {
    const paginationEl = document.getElementById('vocab-pagination');
    if (!paginationEl) return;

    const totalPages = Math.ceil(totalItems / vocabPerPage);
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button class="page-btn" ${vocabCurrentPage <= 1 ? 'disabled' : ''} data-page="${vocabCurrentPage - 1}">
        <i class="fa-solid fa-chevron-left"></i>
    </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === vocabCurrentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    // Next button
    html += `<button class="page-btn" ${vocabCurrentPage >= totalPages ? 'disabled' : ''} data-page="${vocabCurrentPage + 1}">
        <i class="fa-solid fa-chevron-right"></i>
    </button>`;

    paginationEl.innerHTML = html;

    // Attach click events
    paginationEl.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            vocabCurrentPage = parseInt(btn.dataset.page);
            renderVocabTable(searchTerm);
        });
    });
}

/**
 * Play pronunciation for a word using Dictionary API audio
 * Shows visual feedback on the button while loading/playing
 */
async function playVocabAudio(word, btnEl) {
    if (!word) return;

    // Visual feedback: show loading
    const originalIcon = btnEl ? btnEl.innerHTML : '';
    if (btnEl) {
        btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btnEl.disabled = true;
    }

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (response.ok) {
            const data = await response.json();
            const audioUrl = data[0]?.phonetics?.find(p => p.audio)?.audio;
            if (audioUrl) {
                const audio = new Audio(audioUrl);
                audio.play();
                // Restore icon after playing
                audio.addEventListener('ended', () => {
                    if (btnEl) { btnEl.innerHTML = originalIcon; btnEl.disabled = false; }
                });
                audio.addEventListener('error', () => {
                    if (btnEl) { btnEl.innerHTML = originalIcon; btnEl.disabled = false; }
                });
                // Fallback timeout
                setTimeout(() => {
                    if (btnEl) { btnEl.innerHTML = originalIcon; btnEl.disabled = false; }
                }, 5000);
                return;
            }
        }
    } catch (e) { /* ignore */ }

    // No audio available
    if (btnEl) {
        btnEl.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        btnEl.style.color = '#94a3b8';
        setTimeout(() => {
            btnEl.innerHTML = originalIcon;
            btnEl.style.color = '';
            btnEl.disabled = false;
        }, 1500);
    }
}

/**
 * Delete a vocabulary word — no confirmation dialog, instant delete with undo toast
 */
async function deleteVocabWord(vocabId) {
    if (!vocabId) return;

    const vocab = _vocabData.find(v => v.id === vocabId);
    const wordName = vocab ? vocab.word : 'this word';

    // Animate row removal
    const row = document.querySelector(`tr[data-vocab-id="${vocabId}"]`);
    if (row) {
        row.style.transition = 'opacity 0.3s, transform 0.3s';
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
    }

    try {
        await deleteVocabularyAPI(vocabId);

        // Remove from local cache and re-render after animation
        setTimeout(() => {
            _vocabData = _vocabData.filter(v => v.id !== vocabId);

            // Adjust page if needed
            const totalPages = Math.ceil(_vocabData.length / vocabPerPage);
            if (vocabCurrentPage > totalPages && totalPages > 0) {
                vocabCurrentPage = totalPages;
            }

            renderVocabTable(document.getElementById('vocab-search')?.value || '');
        }, 300);

        showVocabToast(`"${wordName}" removed from your library.`, 'success');
    } catch (err) {
        // Restore row on error
        if (row) {
            row.style.opacity = '1';
            row.style.transform = '';
        }
        showVocabToast(err.message || 'Failed to delete word.', 'error');
    }
}

/**
 * Show toast notification on vocabulary page
 */
function showVocabToast(msg, type = 'success') {
    const existing = document.getElementById('vocab-toast');
    if (existing) existing.remove();

    const colors = { success: '#22c55e', error: '#ef4444', info: '#64748b' };
    const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-info-circle' };

    const toast = document.createElement('div');
    toast.id = 'vocab-toast';
    toast.style.cssText = `
        position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
        background:${colors[type] || colors.info};color:#fff;
        padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;
        z-index:99999;display:flex;align-items:center;gap:8px;
        box-shadow:0 4px 24px rgba(0,0,0,.18);
        animation:toastIn .25s ease;
    `;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity .3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/**
 * Attach events cho vocabulary page
 */
function attachVocabularyEvents() {
    // Load real data from API
    loadVocabulary();

    // Navigation links
    const navLinks = {
        'nav-vocab-articles': 'articles',
        'nav-vocab-quiz': 'quiz',
        'nav-vocab-dashboard': 'user-dashboard',
        'vocab-to-articles': 'articles',
        'vocab-back-to-articles': 'articles',
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

    // Search
    const searchInput = document.getElementById('vocab-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            vocabCurrentPage = 1;
            renderVocabTable(e.target.value);
        });
    }
}
