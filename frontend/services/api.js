/**
 * API Service — Base URL & Fetch Wrapper
 */
// Đã cập nhật link Render thật sau khi deploy thành công
const PRODUCTION_API_URL = 'https://learnup-p91u.onrender.com';

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8001'
    : PRODUCTION_API_URL;

/**
 * Fetch wrapper với error handling
 * @param {string} endpoint - API endpoint (e.g. '/api/articles/')
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
            redirect: 'follow',  // Follow 307 redirects automatically
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP Error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
    }
}
