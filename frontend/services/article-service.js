/**
 * Article Service — API calls cho bài viết
 */

/**
 * Lấy danh sách bài viết
 * @returns {Promise<Array>}
 */
async function fetchArticlesAPI() {
    const data = await apiFetch('/api/articles/');
    return data.data || [];
}

/**
 * Lấy chi tiết bài viết theo ID
 * @param {string} articleId
 * @returns {Promise<object>}
 */
async function fetchArticleDetailAPI(articleId) {
    return apiFetch(`/api/articles/${articleId}`);
}

/**
 * Lấy danh sách tags
 * @returns {Promise<Array>}
 */
async function fetchTagsAPI() {
    return apiFetch('/api/tags/');
}
