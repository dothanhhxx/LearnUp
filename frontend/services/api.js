/**
 * API Service — Base URL & Fetch Wrapper
 */
const API_BASE_URL = 'http://localhost:8001';

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
