/**
 * Forgot Password Page — 3-step OTP flow
 * Step 1: Enter email → send OTP
 * Step 2: Enter OTP → verify
 * Step 3: Enter new password → reset
 */

function attachForgotPasswordEvents() {
    // ── Navigation ─────────────────────────────────────────────────────────
    const goLogin = document.getElementById('forgot-go-login');
    if (goLogin) {
        goLogin.addEventListener('click', (e) => {
            e.preventDefault();
            animateTransition('login');
        });
    }

    const logo = document.getElementById('forgot-logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => animateTransition('landing'));
    }

    // ── State ───────────────────────────────────────────────────────────────
    let timerInterval = null;
    let verifiedEmail = '';

    // ── Helpers ─────────────────────────────────────────────────────────────
    function showStep(num) {
        ['fp-step-1', 'fp-step-2', 'fp-step-3', 'fp-step-success'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const target = num === 'success' ? 'fp-step-success' : `fp-step-${num}`;
        const el = document.getElementById(target);
        if (el) {
            el.style.display = '';
            // re-trigger animation
            el.style.animation = 'none';
            el.offsetHeight; // reflow
            el.style.animation = '';
        }
    }

    function showError(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
        el.style.display = 'flex';
    }

    function hideAlert(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    function showSuccess(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
        el.style.display = 'flex';
    }

    function setLoading(btnId, textId, loading, text) {
        const btn = document.getElementById(btnId);
        const txtEl = document.getElementById(textId);
        if (!btn || !txtEl) return;
        btn.disabled = loading;
        if (loading) {
            txtEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Please wait...';
        } else {
            txtEl.innerHTML = text;
        }
    }

    // ── Password strength ───────────────────────────────────────────────────
    function checkStrength(password, meterId, labelId) {
        const meter = document.getElementById(meterId);
        const label = document.getElementById(labelId);
        if (!meter || !label) return;

        meter.className = 'strength-meter';
        const spans = meter.querySelectorAll('span');
        spans.forEach(s => s.style.backgroundColor = '');

        if (!password) { label.textContent = ''; return; }

        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = ['', 'weak', 'medium', 'strong', 'very-strong'];
        const labels = ['', 'Weak', 'Medium', 'Strong', 'Very Strong'];
        const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#2563eb'];

        meter.classList.add(levels[score]);
        label.textContent = labels[score];
        label.style.color = colors[score];
    }

    // Password toggle helper
    function attachToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', () => {
            const inp = document.getElementById(inputId);
            if (!inp) return;
            const icon = btn.querySelector('i');
            if (inp.type === 'password') {
                inp.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                inp.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    // ── STEP 1: Send OTP ────────────────────────────────────────────────────
    const sendBtn = document.getElementById('fp-send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            hideAlert('fp-error-1');
            const email = document.getElementById('fp-email')?.value.trim();
            if (!email) {
                showError('fp-error-1', 'Please enter your email address.');
                return;
            }
            if (!/\S+@\S+\.\S+/.test(email)) {
                showError('fp-error-1', 'Please enter a valid email address.');
                return;
            }

            setLoading('fp-send-btn', 'fp-send-btn-text', true);
            try {
                const res = await apiFetch('/api/users/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email }),
                });
                verifiedEmail = email;
                const dispEl = document.getElementById('fp-email-display');
                if (dispEl) dispEl.textContent = email;

                showStep(2);
                _startOtpTimer(600);
                _initOtpInputs();

                // Dev mode: show OTP in console
                if (res.dev_otp) {
                    console.log(`[DEV] OTP: ${res.dev_otp}`);
                }
            } catch (err) {
                showError('fp-error-1',
                    err.message || 'Failed to send code. Please check your email and try again.');
            } finally {
                setLoading('fp-send-btn', 'fp-send-btn-text', false,
                    '<i class="fa-solid fa-paper-plane" style="margin-right:8px;"></i>Send Verification Code');
            }
        });

        // Enter key
        document.getElementById('fp-email')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendBtn.click();
        });
    }

    // ── OTP Input Behaviour ─────────────────────────────────────────────────
    function _initOtpInputs() {
        const boxes = document.querySelectorAll('.fp-otp-box');
        boxes.forEach((box, i) => {
            box.value = '';
            box.classList.remove('filled');

            box.addEventListener('input', (e) => {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val;
                if (val) {
                    box.classList.add('filled');
                    if (i < boxes.length - 1) boxes[i + 1].focus();
                } else {
                    box.classList.remove('filled');
                }
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) {
                    boxes[i - 1].focus();
                    boxes[i - 1].value = '';
                    boxes[i - 1].classList.remove('filled');
                }
                if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
                if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i + 1].focus();
            });

            // Handle paste
            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                pasted.split('').slice(0, boxes.length).forEach((ch, idx) => {
                    if (boxes[idx]) {
                        boxes[idx].value = ch;
                        boxes[idx].classList.add('filled');
                    }
                });
                const nextEmpty = [...boxes].findIndex(b => !b.value);
                if (nextEmpty >= 0) boxes[nextEmpty].focus();
                else boxes[boxes.length - 1].focus();
            });
        });
        if (boxes.length) boxes[0].focus();
    }

    function _getOtpValue() {
        return [...document.querySelectorAll('.fp-otp-box')].map(b => b.value).join('');
    }

    // ── Timer ───────────────────────────────────────────────────────────────
    function _startOtpTimer(seconds) {
        if (timerInterval) clearInterval(timerInterval);
        const timerEl = document.getElementById('fp-timer');
        const timerWrap = document.getElementById('fp-timer-wrap');
        let remaining = seconds;

        const update = () => {
            const m = String(Math.floor(remaining / 60)).padStart(2, '0');
            const s = String(remaining % 60).padStart(2, '0');
            if (timerEl) timerEl.textContent = `${m}:${s}`;
            if (remaining <= 60 && timerWrap) timerWrap.classList.add('expired');
            if (remaining <= 0) {
                clearInterval(timerInterval);
                if (timerEl) timerEl.textContent = 'Expired';
            }
            remaining--;
        };
        update();
        timerInterval = setInterval(update, 1000);
    }

    // ── STEP 2: Verify OTP ──────────────────────────────────────────────────
    const verifyBtn = document.getElementById('fp-verify-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            hideAlert('fp-error-2');
            hideAlert('fp-success-2');
            const otp = _getOtpValue();
            if (otp.length !== 6) {
                showError('fp-error-2', 'Please enter the complete 6-digit code.');
                return;
            }
            setLoading('fp-verify-btn', 'fp-verify-btn-text', true);
            try {
                await apiFetch('/api/users/verify-otp', {
                    method: 'POST',
                    body: JSON.stringify({ email: verifiedEmail, otp }),
                });
                clearInterval(timerInterval);
                showStep(3);
                attachToggle('fp-toggle-new', 'fp-new-pass');
                attachToggle('fp-toggle-confirm', 'fp-confirm-pass');

                document.getElementById('fp-new-pass')?.addEventListener('input', (e) => {
                    checkStrength(e.target.value, 'fp-strength-meter', 'fp-strength-label');
                    _checkMatch();
                });
                document.getElementById('fp-confirm-pass')?.addEventListener('input', _checkMatch);
            } catch (err) {
                showError('fp-error-2',
                    err.message || 'Invalid or expired code. Please try again.');
            } finally {
                setLoading('fp-verify-btn', 'fp-verify-btn-text', false,
                    '<i class="fa-solid fa-circle-check" style="margin-right:8px;"></i>Verify Code');
            }
        });
    }

    // Resend
    const resendBtn = document.getElementById('fp-resend');
    if (resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            hideAlert('fp-error-2');
            try {
                await apiFetch('/api/users/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email: verifiedEmail }),
                });
                showSuccess('fp-success-2', 'A new code has been sent to your email.');
                _startOtpTimer(600);
                _initOtpInputs();
                document.getElementById('fp-timer-wrap')?.classList.remove('expired');
            } catch (err) {
                showError('fp-error-2', err.message || 'Failed to resend. Please try again.');
            }
        });
    }

    // ── STEP 3 helpers ──────────────────────────────────────────────────────
    function _checkMatch() {
        const newPass = document.getElementById('fp-new-pass')?.value || '';
        const confirm = document.getElementById('fp-confirm-pass')?.value || '';
        const errEl = document.getElementById('fp-match-error');
        if (errEl) {
            errEl.style.display = (confirm && newPass !== confirm) ? 'flex' : 'none';
        }
    }

    // ── STEP 3: Reset Password ──────────────────────────────────────────────
    const resetBtn = document.getElementById('fp-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            hideAlert('fp-error-3');
            const newPass = document.getElementById('fp-new-pass')?.value || '';
            const confirm = document.getElementById('fp-confirm-pass')?.value || '';

            if (!newPass) {
                showError('fp-error-3', 'Please enter your new password.');
                return;
            }
            if (newPass.length < 8) {
                showError('fp-error-3', 'Password must be at least 8 characters long.');
                return;
            }
            if (newPass !== confirm) {
                showError('fp-error-3', 'Passwords do not match.');
                return;
            }

            setLoading('fp-reset-btn', 'fp-reset-btn-text', true);
            try {
                await apiFetch('/api/users/reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ email: verifiedEmail, new_password: newPass }),
                });
                showStep('success');
            } catch (err) {
                showError('fp-error-3', err.message || 'Failed to reset password. Please try again.');
            } finally {
                setLoading('fp-reset-btn', 'fp-reset-btn-text', false,
                    '<i class="fa-solid fa-key" style="margin-right:8px;"></i>Reset Password');
            }
        });
    }

    // ── Success → Login ─────────────────────────────────────────────────────
    const gotoLogin = document.getElementById('fp-goto-login');
    if (gotoLogin) {
        gotoLogin.addEventListener('click', () => animateTransition('login'));
    }
}
