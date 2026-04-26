/**
 * Vocab Popup Component — Popup tra từ khi click vào từ trong bài viết
 * Extracted from app.js vocabulary lookup logic
 */

/**
 * Hiển thị popup tra từ
 * @param {string} word - Từ cần tra
 * @param {HTMLElement} targetElement - Element được click
 */
async function showVocabPopup(word, targetElement) {
    // Xóa popup cũ nếu có
    const existingPopup = document.querySelector('.interactive-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.className = 'interactive-popup';
    popup.innerHTML = `
        <button class="popup-close"><i class="fas fa-times"></i></button>
        <div class="popup-header-row">
            <span class="popup-word">${escapeHtml(word)}</span>
            <button class="btn-audio" title="Play pronunciation">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
        <span class="popup-pronunciation">Loading...</span>
        <div class="popup-section">
            <span class="popup-label">DEFINITION</span>
            <p class="popup-text">Looking up...</p>
        </div>
        <div class="popup-action-row">
            <button class="btn-primary-solid flex-1" id="save-vocab-btn">
                <i class="fas fa-plus"></i> Save to Vocabulary
            </button>
            <button class="btn-icon-outline" title="Copy">
                <i class="fas fa-copy"></i>
            </button>
        </div>
        <div class="popup-footer center-footer">
            <span>POWERED BY FREE DICTIONARY API</span>
        </div>
    `;

    // Position popup
    document.body.appendChild(popup);
    const rect = targetElement.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 10}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    
    setTimeout(() => popup.classList.add('show'), 10);

    // Close button
    popup.querySelector('.popup-close').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 200);
    });

    // Fetch definition from Dictionary API
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (response.ok) {
            const data = await response.json();
            const entry = data[0];
            const phonetic = entry.phonetics?.find(p => p.text)?.text || '';
            const meaning = entry.meanings?.[0];
            const definition = meaning?.definitions?.[0]?.definition || 'No definition found';
            const example = meaning?.definitions?.[0]?.example || '';

            popup.querySelector('.popup-pronunciation').textContent = phonetic;
            popup.querySelector('.popup-text').textContent = definition;

            if (example) {
                const exampleSection = document.createElement('div');
                exampleSection.className = 'popup-section';
                exampleSection.innerHTML = `
                    <span class="popup-label light">EXAMPLE</span>
                    <p class="popup-text example">"${escapeHtml(example)}"</p>
                `;
                popup.querySelector('.popup-action-row').before(exampleSection);
            }

            // Audio
            const audioUrl = entry.phonetics?.find(p => p.audio)?.audio;
            if (audioUrl) {
                popup.querySelector('.btn-audio').addEventListener('click', () => {
                    new Audio(audioUrl).play();
                });
            }

            // Save to database
            const saveBtn = popup.querySelector('#save-vocab-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                    saveBtn.disabled = true;
                    try {
                        const articleId = targetElement.closest('.article-content')?.parentElement?.dataset?.articleId || null;
                        
                        // Using MyMemory to get Vietnamese translation
                        let vietnamese = '';
                        try {
                            const viResp = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`);
                            if (viResp.ok) {
                                const viData = await viResp.json();
                                if (viData.responseData?.translatedText) {
                                    vietnamese = viData.responseData.translatedText;
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to translate to vi:', e);
                        }

                        // Save to backend
                        await saveVocabularyAPI({
                            word: word,
                            phonetic: phonetic,
                            definition: definition,
                            example: example,
                            vietnamese: vietnamese,
                            article_id: articleId
                        });

                        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                        saveBtn.style.background = '#10b981'; // Green
                    } catch (err) {
                        console.error('Error saving vocab:', err);
                        saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
                        saveBtn.disabled = false;
                    }
                });
            }
        } else {
            popup.querySelector('.popup-text').textContent = 'Word not found in dictionary.';
        }
    } catch (error) {
        popup.querySelector('.popup-text').textContent = 'Error looking up word.';
    }

    // Click outside to close
    document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && e.target !== targetElement) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 200);
            document.removeEventListener('click', closePopup);
        }
    });
}
