/**
 * Auth Utilities
 * Token storage, kiểm tra đăng nhập, logout
 */

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function isLoggedIn() {
    const token = getToken();
    if (!token) return false;
    // Check if token is expired (basic JWT decode)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            removeToken(); // Token expired, clean up
            return false;
        }
        return true;
    } catch (e) {
        removeToken(); // Invalid token, clean up
        return false;
    }
}

function saveUser(user) {
    AppState.user = user;
    localStorage.setItem('user', JSON.stringify(user));
}

function loadUser() {
    try {
        const saved = localStorage.getItem('user');
        if (saved) {
            AppState.user = JSON.parse(saved);
        }
    } catch (e) {
        // ignore
    }
}

function logout() {
    removeToken();
    AppState.user = null;
    AppState.currentView = 'landing';
    renderApp();
}

/**
 * Get display name of current user
 */
function getUserDisplayName() {
    if (AppState.user && AppState.user.name) return AppState.user.name;
    if (AppState.user && AppState.user.email) return AppState.user.email.split('@')[0];
    return 'User';
}
