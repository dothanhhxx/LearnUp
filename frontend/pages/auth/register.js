/**
 * Register Page — Logic đăng ký
 * Extracted from app.js attachRegisterEvents()
 */

function attachRegisterEvents() {
    const registerForm = document.getElementById('register-form');
    const goToLogin = document.getElementById('go-to-login');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameEl = document.getElementById('reg-name');
            const emailEl = document.getElementById('reg-email');
            const passwordEl = document.getElementById('reg-password');
            const confirmEl = document.getElementById('reg-confirm');
            
            const errorBox = document.getElementById('register-error-box');
            const errorText = document.getElementById('register-error-text');
            const confirmErrorEl = document.getElementById('reg-confirm-error');

            if (errorBox) errorBox.style.display = 'none';
            if (confirmErrorEl) confirmErrorEl.style.display = 'none';

            // Reset borders
            [nameEl, emailEl, passwordEl, confirmEl].forEach(el => {
                if(el) el.style.borderColor = '#cbd5e1'; 
            });

            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            const password = passwordEl.value;
            const confirm = confirmEl.value;

            let hasError = false;

            if (!name) { nameEl.style.borderColor = 'red'; hasError = true; }
            if (!email) { emailEl.style.borderColor = 'red'; hasError = true; }
            if (!password || password.length < 8) { passwordEl.style.borderColor = 'red'; hasError = true; }
            if (!confirm || password !== confirm) { 
                confirmEl.style.borderColor = 'red'; 
                if (confirmErrorEl && password !== confirm) confirmErrorEl.style.display = 'block';
                hasError = true; 
            }

            if (hasError) return;

            try {
                await registerAPI({ name, email, password });
                alert('Registration successful! Please login.');
                animateTransition('login');
            } catch (error) {
                if (errorBox && errorText) {
                    errorText.textContent = 'Email already registered.';
                    errorBox.style.display = 'flex';
                }
            }
        });
    }

    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            animateTransition('login');
        });
    }

    // Real-time confirm password validation
    const regConfirm = document.getElementById('reg-confirm');
    const regPassword = document.getElementById('reg-password');
    if (regConfirm && regPassword) {
        regConfirm.addEventListener('input', () => {
            const errorEl = document.getElementById('reg-confirm-error');
            if (errorEl) {
                errorEl.style.display = regConfirm.value !== regPassword.value ? 'block' : 'none';
            }
        });
    }
}
