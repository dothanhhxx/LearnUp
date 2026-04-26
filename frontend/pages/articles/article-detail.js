/**
 * Article Detail Page — Render nội dung bài viết, lookup từ, popup
 * Hover-based popup với nghĩa Tiếng Việt (MyMemory API)
 */

// ─── State ───────────────────────────────────────────────────────────────────
let _currentPopupWord = null;
let _currentPopupPhonetic = null;
let _currentPopupDefinition = null;
let _currentPopupExample = null;
let _currentPopupVietnamese = null;
let _popupAudioUrl = null;
let _currentHoveredWord = null;   // từ đang hover, tránh gọi API trùng lặp
let _showPopupTimer = null;     // delay trước khi hiện popup (tránh flash khi di nhanh)
let _hidePopupTimer = null;     // grace period trước khi ẩn popup

// ─── Render article ──────────────────────────────────────────────────────────
function renderArticleDetail() {
    const article = AppState.selectedArticle;
    if (!article) return;

    const titleEl = document.getElementById('detail-article-title');
    const categoryTag = document.getElementById('detail-category-tag');
    const difficultyEl = document.getElementById('detail-difficulty');
    const readTimeEl = document.getElementById('detail-read-time');

    if (titleEl) titleEl.textContent = article.title || 'Untitled';

    const tags = Array.isArray(article.tags)
        ? article.tags
        : (article.tags ? article.tags.split(',').map(t => t.trim()) : []);
    if (categoryTag) categoryTag.textContent = tags.length > 0 ? tags[0] : 'General';

    if (difficultyEl) {
        const d = article.difficulty || 'Beginner';
        difficultyEl.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    }

    if (readTimeEl && article.content) {
        const wordCount = article.content.split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        readTimeEl.textContent = `${minutes} min read`;
        const wordsReadEl = document.getElementById('detail-words-read');
        if (wordsReadEl) wordsReadEl.textContent = `0 / ${wordCount.toLocaleString()}`;
    }

    const heroEl = document.getElementById('detail-article-image');
    if (heroEl) {
        const imageUrl = article.image_url || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1200&q=80';
        heroEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = article.title || '';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:relative;z-index:1;';
        img.onerror = () => { img.src = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1200&q=80'; };
        heroEl.appendChild(img);
    }

    const bodyEl = document.getElementById('detail-article-body');
    if (bodyEl && article.content) {
        bodyEl.innerHTML = processTextForLookup(article.content);
    }

    const keywordsEl = document.getElementById('detail-keywords');
    if (keywordsEl) {
        keywordsEl.innerHTML = tags.length > 0
            ? tags.map(t => `<span class="keyword-chip">${escapeHtml(t)}</span>`).join('')
            : '<span class="keyword-chip">General</span>';
    }

    const bookmarkBtn = document.getElementById('detail-bookmark-btn');
    if (bookmarkBtn) {
        const isBookmarked = AppState.bookmarkedArticles.includes(article.id);
        const icon = bookmarkBtn.querySelector('i');
        if (isBookmarked) {
            bookmarkBtn.classList.add('active');
            if (icon) icon.className = 'fas fa-bookmark';
        } else {
            bookmarkBtn.classList.remove('active');
            if (icon) icon.className = 'far fa-bookmark';
        }
    }

    setupReadingProgress();
}

// ─── Reading progress ─────────────────────────────────────────────────────────
function setupReadingProgress() {
    const bodyEl = document.getElementById('detail-article-body');
    const progressEl = document.getElementById('detail-progress');
    const wordsReadEl = document.getElementById('detail-words-read');
    if (!bodyEl || !progressEl) return;

    const article = AppState.selectedArticle;
    const totalWords = article && article.content ? article.content.split(/\s+/).length : 0;

    const handleScroll = () => {
        const rect = bodyEl.getBoundingClientRect();
        const totalHeight = bodyEl.scrollHeight;
        const viewportH = window.innerHeight;
        const scrolled = Math.max(0, -rect.top + viewportH * 0.3);
        const pct = Math.min(100, Math.round((scrolled / totalHeight) * 100));
        progressEl.textContent = `${pct}%`;
        if (wordsReadEl) {
            const wordsRead = Math.round((pct / 100) * totalWords);
            wordsReadEl.textContent = `${wordsRead.toLocaleString()} / ${totalWords.toLocaleString()}`;
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
}

// ─── Process text → clickable words ──────────────────────────────────────────
function processTextForLookup(text) {
    if (!text) return '';
    return text.split(/\n+/).map(p => {
        if (!p.trim()) return '';
        const processed = p.split(/(\s+)/).map(word => {
            if (/^\s+$/.test(word)) return word;
            const cleanWord = word.replace(/[^a-zA-Z]/g, '');
            if (!cleanWord) return word;
            return `<span class="lookup-word" data-word="${cleanWord}">${word}</span>`;
        }).join('');
        return `<p>${processed}</p>`;
    }).join('');
}

// ─── Position popup near the hovered element ─────────────────────────────────
function positionPopupNearElement(el) {
    const popup = document.getElementById('vocab-popup');
    if (!popup) return;

    const rect = el.getBoundingClientRect();
    const popupW = 340;           // matches CSS min-width
    const popupH = popup.offsetHeight || 300;
    const margin = 12;            // gap between word and popup edge
    const pad = 12;            // minimum clearance from viewport edges

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // ── Horizontal: center popup under the word, clamp to viewport ──
    let left = rect.left + rect.width / 2 - popupW / 2;
    left = Math.max(pad, Math.min(left, vw - popupW - pad));

    // ── Vertical: prefer below; flip above when below has less space ──
    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    let top;
    if (spaceBelow >= popupH || spaceBelow >= spaceAbove) {
        top = rect.bottom + margin;       // show below
    } else {
        top = rect.top - popupH - margin; // show above
    }
    top = Math.max(pad, Math.min(top, vh - popupH - pad));

    // Suppress CSS transition during reposition so there's no slide/jitter
    // when called a 2nd time after API data loads and changes popup height.
    popup.style.transition = 'none';
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;

    // Re-enable transition on next paint, then reveal via .show
    requestAnimationFrame(() => {
        popup.style.transition = '';
        popup.classList.add('show');
    });
}

// ─── Attach events ────────────────────────────────────────────────────────────
function attachArticleDetailEvents() {
    renderArticleDetail();



    // Back button
    const backBtn = document.getElementById('detail-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => animateTransition('articles'));
    }

    // Logo click -> articles
    const logoBtn = document.getElementById('detail-logo-home');
    if (logoBtn) {
        logoBtn.addEventListener('click', () => animateTransition('articles'));
    }

    // Bookmark toggle
    const bookmarkBtn = document.getElementById('detail-bookmark-btn');
    if (bookmarkBtn && AppState.selectedArticle) {
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const articleId = AppState.selectedArticle.id;
            const index = AppState.bookmarkedArticles.indexOf(articleId);
            const icon = bookmarkBtn.querySelector('i');
            if (index > -1) {
                AppState.bookmarkedArticles.splice(index, 1);
                bookmarkBtn.classList.remove('active');
                if (icon) icon.className = 'far fa-bookmark';
            } else {
                AppState.bookmarkedArticles.push(articleId);
                bookmarkBtn.classList.add('active');
                if (icon) icon.className = 'fas fa-bookmark';
            }
            localStorage.setItem('learnup_bookmarks', JSON.stringify(AppState.bookmarkedArticles));
        });
    }

    // Take quiz
    const quizBtn = document.getElementById('detail-take-quiz-btn');
    if (quizBtn) {
        quizBtn.addEventListener('click', () => animateTransition('quiz'));
    }

    // ── HOVER-BASED word lookup ────────────────────────────────────────────────
    // Show popup after a short delay so fast cursor passes don't trigger it.
    // A grace period before hiding lets the user move the cursor into the popup.
    document.querySelectorAll('.lookup-word').forEach(wordEl => {
        wordEl.addEventListener('mouseenter', () => {
            const word = wordEl.dataset.word;
            if (!word) return;

            // Cancel any pending hide
            clearTimeout(_hidePopupTimer);

            // Schedule show after 300 ms
            _showPopupTimer = setTimeout(() => {
                positionPopupNearElement(wordEl);
                if (word !== _currentHoveredWord) {
                    _currentHoveredWord = word;
                    lookupWord(word, wordEl);
                }
            }, 300);
        });

        wordEl.addEventListener('mouseleave', () => {
            // Cancel a pending show so it doesn't open after cursor left
            clearTimeout(_showPopupTimer);

            // Give the user 200 ms to move into the popup before hiding
            _hidePopupTimer = setTimeout(() => {
                closeVocabPopup();
                _currentHoveredWord = null;
            }, 200);
        });
    });

    // Keep popup visible while the cursor is inside it
    const popup = document.getElementById('vocab-popup');
    if (popup) {
        popup.addEventListener('mouseenter', () => {
            clearTimeout(_hidePopupTimer);
        });
        popup.addEventListener('mouseleave', () => {
            _hidePopupTimer = setTimeout(() => {
                closeVocabPopup();
                _currentHoveredWord = null;
            }, 200);
        });
    }

    // Save to Dictionary button
    const saveBtn = document.getElementById('add-to-vocab-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => saveCurrentWordToDictionary());
    }
}

function closeVocabPopup() {
    clearTimeout(_showPopupTimer);
    clearTimeout(_hidePopupTimer);
    _currentHoveredWord = null;
    const popup = document.getElementById('vocab-popup');
    if (popup) popup.classList.remove('show');
}

// ─── Lookup word: English dictionary + Vietnamese translation ─────────────────
async function lookupWord(word, sourceEl) {
    const popup = document.getElementById('vocab-popup');
    const wordEl = document.getElementById('popup-word');
    const phoneticEl = document.getElementById('popup-phonetic');
    const definitionEl = document.getElementById('popup-definition');
    const exampleEl = document.getElementById('popup-example');
    const vietnameseEl = document.getElementById('popup-vietnamese');
    const saveBtn = document.getElementById('add-to-vocab-btn');

    if (!popup) return;

    // Reset state
    _currentPopupWord = word;
    _currentPopupPhonetic = null;
    _currentPopupDefinition = null;
    _currentPopupExample = null;
    _currentPopupVietnamese = null;
    _popupAudioUrl = null;

    if (wordEl) wordEl.textContent = word;
    if (phoneticEl) phoneticEl.textContent = '…';
    if (definitionEl) definitionEl.textContent = 'Looking up…';
    if (exampleEl) exampleEl.textContent = '';
    if (vietnameseEl) vietnameseEl.textContent = 'Đang dịch…';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.background = '#94a3b8';
        saveBtn.style.cursor = 'not-allowed';
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading…';
    }

    // Show popup positioned at the hovered word
    if (sourceEl) positionPopupNearElement(sourceEl);  // also adds .show

    // ── Fetch English definition ───────────────────────────────────────────────
    const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);

    // ── Fetch Vietnamese translation (MyMemory free API) ─────────────────────
    const viPromise = fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);

    // Run both in parallel
    const [dictData, viData] = await Promise.all([dictPromise, viPromise]);

    // Guard: user may have moved away before responses arrived
    if (_currentHoveredWord !== word) return;

    // ── Fill English data ─────────────────────────────────────────────────────
    if (dictData && Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0];
        const phonetic = entry.phonetics?.find(p => p.text)?.text || '';
        const meaning = entry.meanings?.[0];
        const definition = meaning?.definitions?.[0]?.definition || 'No definition found.';
        const example = meaning?.definitions?.[0]?.example || '';

        _currentPopupPhonetic = phonetic;
        _currentPopupDefinition = definition;
        _currentPopupExample = example;

        if (phoneticEl) phoneticEl.textContent = phonetic || '';
        if (definitionEl) definitionEl.textContent = definition;
        if (exampleEl) exampleEl.textContent = example ? `"${example}"` : '';

        _popupAudioUrl = entry.phonetics?.find(p => p.audio)?.audio || null;
        const audioBtn = document.getElementById('popup-audio-btn');
        if (audioBtn) {
            audioBtn.style.opacity = _popupAudioUrl ? '1' : '0.35';
            audioBtn.onclick = _popupAudioUrl
                ? () => new Audio(_popupAudioUrl).play().catch(() => { })
                : null;
        }
    } else {
        if (phoneticEl) phoneticEl.textContent = '';
        if (definitionEl) definitionEl.textContent = 'Không tìm thấy trong từ điển.';
        if (exampleEl) exampleEl.textContent = '';
    }

    // ── Fill Vietnamese data ──────────────────────────────────────────────────
    if (viData && viData.responseStatus === 200) {
        const viText = viData.responseData?.translatedText || '';
        _currentPopupVietnamese = viText;
        if (vietnameseEl) vietnameseEl.textContent = viText || '(không có)';
    } else {
        if (vietnameseEl) vietnameseEl.textContent = '(không dịch được)';
    }

    // ── Enable save button only if definition was found ──────────────────────
    if (saveBtn) {
        if (_currentPopupDefinition && _currentPopupDefinition !== 'No definition found.' && _currentPopupDefinition !== 'Không tìm thấy trong từ điển.') {
            saveBtn.disabled = false;
            saveBtn.style.background = '';
            saveBtn.style.cursor = '';
            saveBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Save to Dictionary';
        } else {
            saveBtn.disabled = true;
            saveBtn.style.background = '#94a3b8';
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Save to Dictionary';
        }
    }

    // Re-position after content loaded (height may have changed)
    if (sourceEl && _currentHoveredWord === word) positionPopupNearElement(sourceEl);
}

// ─── Save word to DB ──────────────────────────────────────────────────────────
async function saveCurrentWordToDictionary() {
    if (!_currentPopupWord) return;

    const saveBtn = document.getElementById('add-to-vocab-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    }

    const articleId = AppState.selectedArticle?.id || null;

    try {
        await apiFetch('/api/vocabulary', {
            method: 'POST',
            body: JSON.stringify({
                word: _currentPopupWord,
                article_id: articleId,
                phonetic: _currentPopupPhonetic || '',
                definition: _currentPopupDefinition || '',
                example: _currentPopupExample || '',
                vietnamese: _currentPopupVietnamese || '',
            }),
        });

        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            saveBtn.style.background = '#22c55e';
        }
        showToast(`"${_currentPopupWord}" đã lưu vào từ điển!`, 'success');
        clearTimeout(_showPopupTimer);
        clearTimeout(_hidePopupTimer);
        setTimeout(() => closeVocabPopup(), 1500);

    } catch (err) {
        const alreadySaved = err.message && err.message.toLowerCase().includes('already');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.background = alreadySaved ? '#94a3b8' : '';
            saveBtn.innerHTML = alreadySaved
                ? '<i class="fa-solid fa-bookmark"></i> Đã lưu rồi'
                : '<i class="fa-regular fa-bookmark"></i> Save to Dictionary';
        }
        showToast(
            alreadySaved
                ? `"${_currentPopupWord}" đã có trong từ điển của bạn.`
                : (err.message || 'Lưu thất bại'),
            alreadySaved ? 'info' : 'error'
        );
    }
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const existing = document.getElementById('article-toast');
    if (existing) existing.remove();

    const colors = { success: '#22c55e', error: '#ef4444', info: '#64748b' };
    const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-info-circle' };

    const toast = document.createElement('div');
    toast.id = 'article-toast';
    toast.style.cssText = `
        position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
        background:${colors[type]};color:#fff;
        padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;
        z-index:99999;display:flex;align-items:center;gap:8px;
        box-shadow:0 4px 24px rgba(0,0,0,.18);
        animation:toastIn .25s ease;
    `;
    toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity .3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
