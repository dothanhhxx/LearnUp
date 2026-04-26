/**
 * Pagination Component — Phân trang tái sử dụng
 */

/**
 * Render phân trang
 * @param {number} totalItems - Tổng số item
 * @param {number} currentPage - Trang hiện tại
 * @param {number} itemsPerPage - Số item mỗi trang
 * @param {function} onPageChange - Callback khi chuyển trang
 * @returns {string} HTML string
 */
function renderPagination(totalItems, currentPage, itemsPerPage, onPageChange) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return '';

    let html = '<div class="pagination">';

    // Prev button
    html += `<button class="icon-btn" ${currentPage === 1 ? 'disabled' : ''} 
             onclick="${onPageChange}(${currentPage - 1})">
             <i class="fas fa-chevron-left"></i></button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                     onclick="${onPageChange}(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span class="ellipsis">...</span>';
        }
    }

    // Next button
    html += `<button class="icon-btn" ${currentPage === totalPages ? 'disabled' : ''} 
             onclick="${onPageChange}(${currentPage + 1})">
             <i class="fas fa-chevron-right"></i></button>`;

    html += '</div>';
    return html;
}
