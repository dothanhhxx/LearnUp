/**
 * Change Password Modal — for authenticated users
 * Triggered from the avatar dropdown menu.
 */

/**
 * Opens the Change Password modal.
 * Loads the template, attaches events, and appends to body.
 */
function openChangePasswordModal() {
    // Remove any existing modal
    document.getElementById('change-password-overlay')?.remove();

    const template = document.getElementById('change-password-modal-template');
    if (!template) {
        console.error('[ChangePassword] Modal template not found');
        return;
    }

    const content = template.content.cloneNode(true);
    document.body.appendChild(content);

    _attachChangePasswordEvents();
}

function _attachChangePasswordEvents() {
    // Close button
    const closeBtn = document.getElementById('cp-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', _closeChangePasswordModal);
    }

    // Close on overlay click (outside the modal)
    const overlay = document.getElementById('change-password-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) _closeChangePasswordModal();
        });
    }

    // Close on Escape key
    const onEscape = (e) => {
        if (e.key === 'Escape') {
            _closeChangePasswordModal();
            document.removeEventListener('keydown', onEscape);
        }
    };
    document.addEventListener('keydown', onEscape);

    // Password toggles
    _attachToggle('cp-toggle-current', 'cp-current');
    _attachToggle('cp-toggle-new', 'cp-new');
    _attachToggle('cp-toggle-confirm', 'cp-confirm');

    // Strength meter for new password
    document.getElementById('cp-new')?.addEventListener('input', (e) => {
        _cpCheckStrength(e.target.value);
        _cpCheckMatch();
    });

    // Match check
    document.getElementById('cp-confirm')?.addEventListener('input', _cpCheckMatch);

    // Submit
    const submitBtn = document.getElementById('cp-submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', _handleChangePasswordSubmit);
    }

    // Focus first field
    setTimeout(() => document.getElementById('cp-current')?.focus(), 100);
}

function _closeChangePasswordModal() {
    const overlay = document.getElementById('change-password-overlay');
    if (!overlay) return;
    overlay.style.animation = 'overlayIn 0.2s ease reverse';
    setTimeout(() => overlay.remove(), 200);
}

function _attachToggle(btnId, inputId) {
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

function _cpCheckStrength(password) {
    const meter = document.getElementById('cp-strength-meter');
    const label = document.getElementById('cp-strength-label');
    if (!meter || !label) return;

    meter.className = 'strength-meter';
    label.textContent = '';

    if (!password) return;

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

function _cpCheckMatch() {
    const newPass = document.getElementById('cp-new')?.value || '';
    const confirm = document.getElementById('cp-confirm')?.value || '';
    const errEl = document.getElementById('cp-match-error');
    if (errEl) {
        errEl.style.display = (confirm && newPass !== confirm) ? 'flex' : 'none';
    }
}

function _cpShowError(msg) {
    const el = document.getElementById('cp-error');
    if (!el) return;
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
    el.style.display = 'flex';
    document.getElementById('cp-success').style.display = 'none';
}

function _cpShowSuccess(msg) {
    const el = document.getElementById('cp-success');
    if (!el) return;
    el.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    el.style.display = 'flex';
    document.getElementById('cp-error').style.display = 'none';
}

async function _handleChangePasswordSubmit() {
    const currentPass = document.getElementById('cp-current')?.value || '';
    const newPass = document.getElementById('cp-new')?.value || '';
    const confirm = document.getElementById('cp-confirm')?.value || '';

    document.getElementById('cp-error').style.display = 'none';
    document.getElementById('cp-success').style.display = 'none';

    if (!currentPass) {
        _cpShowError('Please enter your current password.');
        return;
    }
    if (!newPass) {
        _cpShowError('Please enter a new password.');
        return;
    }
    if (newPass.length < 8) {
        _cpShowError('New password must be at least 8 characters long.');
        return;
    }
    if (newPass !== confirm) {
        _cpShowError('New passwords do not match.');
        return;
    }

    const submitBtn = document.getElementById('cp-submit-btn');
    const submitText = document.getElementById('cp-submit-text');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitText.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Updating...';
    }

    try {
        await apiFetch('/api/users/change-password', {
            method: 'POST',
            body: JSON.stringify({
                current_password: currentPass,
                new_password: newPass,
            }),
        });

        _cpShowSuccess('Password changed successfully! You can now use your new password.');

        // Clear fields
        ['cp-current', 'cp-new', 'cp-confirm'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('cp-strength-meter').className = 'strength-meter';
        document.getElementById('cp-strength-label').textContent = '';
        document.getElementById('cp-match-error').style.display = 'none';

        // Auto-close after 2.5s
        setTimeout(_closeChangePasswordModal, 2500);

    } catch (err) {
        _cpShowError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitText.innerHTML = '<i class="fa-solid fa-shield-halved" style="margin-right:8px;"></i>Update Password';
        }
    }
}
