/**
 * Header Component — Navigation event handlers
 */

function attachHeaderEvents() {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            if (view) {
                animateTransition(view);
            }
        });
    });

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === AppState.currentView) {
            link.classList.add('active');
        }
    });

    // User menu
    const userMenuBtn = document.getElementById('user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', () => {
            animateTransition('user-dashboard');
        });
    }

    // Update user name in header
    const headerUserName = document.getElementById('header-user-name');
    if (headerUserName && AppState.user) {
        headerUserName.textContent = AppState.user.name || 'User';
    }
}
