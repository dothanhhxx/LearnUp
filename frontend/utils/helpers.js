/**
 * Helper Utilities
 * Format date, truncate text, và các hàm tiện ích dùng chung
 */

/**
 * Rút gọn text
 * @param {string} text - Chuỗi cần rút gọn
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string}
 */
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Format ngày tháng
 * @param {string} dateStr - Chuỗi ngày
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Escape HTML để tránh XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
