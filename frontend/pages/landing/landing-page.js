/**
 * Landing Page — Event handler
 * Wires up navigation buttons to the SPA router
 */
function attachLandingEvents() {
    // "Log in" button → login view
    const loginBtns = document.querySelectorAll('.landing-page .btn-login');
    loginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            animateTransition('login');
        });
    });

    // "Start free" / "Get started for free" / "Create your free account" → register view
    const registerBtns = document.querySelectorAll(
        '.landing-page .nav-pill, .landing-page .btn-blue, .landing-page .btn-white'
    );
    registerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            animateTransition('register');
        });
    });

    // "See how it works" → smooth scroll to features section
    const ghostBtns = document.querySelectorAll('.landing-page .btn-ghost');
    ghostBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const featSection = document.querySelector('.landing-page .section-block');
            if (featSection) {
                featSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Topic pills — toggle active state
    const topics = document.querySelectorAll('.landing-page .topic:not(.other)');
    topics.forEach(topic => {
        topic.addEventListener('click', () => {
            topics.forEach(t => t.classList.remove('on'));
            topic.classList.add('on');
        });
    });
}
