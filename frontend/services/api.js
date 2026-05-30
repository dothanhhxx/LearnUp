/**
 * API Service — Base URL & Fetch Wrapper
 */
// Đã cập nhật link Render thật sau khi deploy thành công

const API_BASE_URL =
    (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8001'
        : 'https://learnup-backend-3fev.onrender.com';

/**
 * Fetch wrapper với error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - fetch options
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            redirect: 'follow',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            throw new Error(
                errorData.detail || `HTTP Error ${response.status}`
            );
        }

        return await response.json();

    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
    }
}