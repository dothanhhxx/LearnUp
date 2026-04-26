/**
 * Auth Service — Login, Register API calls
 */

/**
 * Đăng nhập
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 */
async function loginAPI(email, password) {
    return apiFetch('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

/**
 * Đăng ký (placeholder - chưa có API backend)
 * @param {object} userData - { name, email, password }
 * @returns {Promise<object>}
 */
async function registerAPI(userData) {
    return apiFetch('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}
