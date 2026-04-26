/**
 * SPA Router
 * Quản lý chuyển trang với animation transition
 */

/**
 * Chuyển view với hiệu ứng fade + scale
 * @param {string} nextView - Tên view cần chuyển tới
 */
function animateTransition(nextView) {
    const activeView = document.querySelector('.main-wrapper') 
        || document.querySelector('.auth-card') 
        || document.querySelector('.articles-layout')
        || document.querySelector('.dash-layout');
    
    if (activeView) {
        activeView.style.opacity = '0';
        activeView.style.transform = 'scale(0.98)';
        activeView.style.transition = 'all 0.2s ease-out';
    }

    setTimeout(() => {
        AppState.currentView = nextView;
        renderApp();

        const newActive = document.querySelector('.main-wrapper') 
            || document.querySelector('.auth-card') 
            || document.querySelector('.articles-layout')
            || document.querySelector('.dash-layout');
        
        if (newActive) {
            newActive.style.opacity = '0';
            newActive.style.transform = 'scale(0.98)';
            newActive.style.transition = 'none';

            setTimeout(() => {
                newActive.style.transition = 'all 0.2s ease-in';
                newActive.style.opacity = '1';
                newActive.style.transform = 'scale(1)';
            }, 10);
        }
    }, 200);
}
