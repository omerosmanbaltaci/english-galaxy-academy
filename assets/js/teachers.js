// Teachers Portal JS Logic

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Login Form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errDiv = document.getElementById('login-error');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                checkAuth(); // Refresh UI
            } else {
                errDiv.innerText = data.error || 'Login failed.';
            }
        } catch (err) {
            errDiv.innerText = 'Network error.';
        }
    });

    // Register Form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const fullName = document.getElementById('reg-name').value;
        const school = document.getElementById('reg-school').value;
        const msgDiv = document.getElementById('reg-msg');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName, school })
            });
            const data = await res.json();
            
            if (res.ok) {
                msgDiv.style.color = 'var(--success)';
                msgDiv.innerText = 'Registration successful! You can now log in.';
                document.getElementById('register-form').reset();
            } else {
                msgDiv.style.color = 'var(--error)';
                msgDiv.innerText = data.error || 'Registration failed.';
            }
        } catch (err) {
            msgDiv.style.color = 'var(--error)';
            msgDiv.innerText = 'Network error.';
        }
    });

    // Upload Form Logic removed. Uploads are strictly handled via admin dashboard now.

});

async function checkAuth() {
    const token = localStorage.getItem('token');
    const authView = document.getElementById('auth-view');
    const pendingView = document.getElementById('pending-view');
    const dashboardView = document.getElementById('dashboard-view');

    if (!token) {
        authView.style.display = 'block';
        pendingView.style.display = 'none';
        dashboardView.style.display = 'none';
        return;
    }

    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            logout();
            return;
        }

        const user = await res.json();

        authView.style.display = 'none';

        if (user.status === 'PENDING') {
            pendingView.style.display = 'block';
            dashboardView.style.display = 'none';
        } else if (user.status === 'APPROVED' || user.role === 'ADMIN') {
            pendingView.style.display = 'none';
            dashboardView.style.display = 'block';
            const welcomeStr = (typeof currentLang !== 'undefined' && currentLang === 'tr') ? `Hoş Geldiniz, ${user.fullName}` : `Welcome, ${user.fullName}`;
            document.getElementById('teacher-welcome').innerText = welcomeStr;
            
            // Show upload section only to ADMIN
            const uploadSection = document.getElementById('admin-upload-section');
            if (uploadSection) {
                uploadSection.style.display = (user.role === 'ADMIN') ? 'block' : 'none';
            }

            loadTeacherResources();
        }

    } catch (err) {
        console.error(err);
        logout();
    }
}

function logout() {
    localStorage.removeItem('token');
    location.reload();
}

async function loadTeacherResources() {
    const grid = document.getElementById('teacher-resources-grid');
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch('/api/lessons', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // Filter explicitly for things with pdfTeacher
        const teacherItems = data.filter(item => item.pdfTeacher);

        if (teacherItems.length === 0) {
            grid.innerHTML = '<p data-i18n="teacher_no_resources">No teacher resources found.</p>';
            if (window.applyTranslations) window.applyTranslations();
            return;
        }

        grid.innerHTML = teacherItems.map(item => `
            <div class="card">
                <div class="card-content">
                    <div class="card-tags">
                        <span class="badge" style="background-color: var(--accent);">${item.grade} | ${item.unit}</span>
                        <span class="badge" style="background-color: var(--primary);">${item.resourceType}</span>
                    </div>
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-desc">${item.description || '<span data-i18n="teacher_no_desc">No description provided.</span>'}</p>
                    <a href="viewer.html?id=${item.id}" class="btn btn-secondary" style="margin-top: auto; width: 100%;" data-i18n="teacher_open_resource">Open Teacher Resource</a>
                </div>
            </div>
        `).join('');
        if (window.applyTranslations) window.applyTranslations();

    } catch (err) {
        grid.innerHTML = '<p style="color:var(--error);" data-i18n="teacher_load_failed">Failed to load resources.</p>';
        if (window.applyTranslations) window.applyTranslations();
    }
}
