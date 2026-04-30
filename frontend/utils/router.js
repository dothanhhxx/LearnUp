/**
 * SPA Router
 * Quản lý chuyển trang với animation transition
 */

/**
 * Chuyển view với hiệu ứng fade + scale
 * @param {string} nextView - Tên view cần chuyển tới
 */
function animateTransition(nextView) {
    const activeView = document.querySelector('.landing-page')
        || document.querySelector('.main-wrapper') 
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

        const newActive = document.querySelector('.landing-page')
            || document.querySelector('.main-wrapper') 
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

                // Clear transform after animation finishes.
                // IMPORTANT: any non-none transform on an ancestor creates a new
                // containing block for position:fixed children (e.g. vocab popup).
                // That breaks popup positioning when the page is scrolled because
                // the popup's top/left are then relative to the wrapper, not the
                // viewport. Removing the transform restores standard fixed behaviour.
                setTimeout(() => {
                    newActive.style.transform = '';
                    newActive.style.transition = '';
                }, 220); // animation duration (200ms) + small buffer
            }, 10);
        }
    }, 200);
}
