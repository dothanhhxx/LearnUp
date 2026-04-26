/**
 * Vocabulary Service — API calls cho từ vựng
 * Kết nối với backend API /api/vocabulary
 */

/**
 * Lấy danh sách từ vựng đã lưu của user hiện tại
 * @returns {Promise<object>} { success, data, total }
 */
async function fetchVocabularyAPI() {
    return apiFetch('/api/vocabulary');
}

/**
 * Lưu từ vựng mới
 * @param {object} wordData - { word, article_id, phonetic, definition, example }
 * @returns {Promise<object>}
 */
async function saveVocabularyAPI(wordData) {
    return apiFetch('/api/vocabulary', {
        method: 'POST',
        body: JSON.stringify(wordData),
    });
}

/**
 * Xóa từ vựng theo ID
 * @param {string} vocabId
 * @returns {Promise<object>}
 */
async function deleteVocabularyAPI(vocabId) {
    return apiFetch(`/api/vocabulary/${vocabId}`, {
        method: 'DELETE',
    });
}
