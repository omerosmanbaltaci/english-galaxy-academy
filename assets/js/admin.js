// Admin Panel JavaScript Logic

const API_URL = '/api';
let editingLessonId = null;
let currentLessonPdfs = { student: null, teacher: null };
let ADMIN_TOKEN = localStorage.getItem('adminToken') || null;

document.addEventListener('DOMContentLoaded', () => {
    const layout = document.getElementById('admin-layout-wrapper');
    const overlay = document.getElementById('admin-login-overlay');
    
    if (ADMIN_TOKEN === 'mock_admin_token') {
        overlay.style.display = 'none';
        layout.style.display = 'flex';
        loadLessons();
        loadTeachers();
    } else {
        overlay.style.display = 'flex';
        layout.style.display = 'none';
    }

    // Handle Interactive UI logic
    const lTypeSelect = document.getElementById('l-type');
    const lGradeSelect = document.getElementById('l-grade');
    const lUnitSelect = document.getElementById('l-unit');
    
    if (lGradeSelect && lUnitSelect) {
        lGradeSelect.addEventListener('change', () => {
            const gradeId = lGradeSelect.value;
            const units = window.Taxonomy && window.Taxonomy.units[gradeId] ? window.Taxonomy.units[gradeId] : [];
            
            lUnitSelect.innerHTML = '';
            if (units.length === 0) {
                lUnitSelect.innerHTML = '<option value="unit-1">Unit 1 (Default)</option>';
            } else {
                units.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.code;
                    // Format: Unit 1: Name
                    const unitNum = u.code.replace('unit-', '');
                    opt.textContent = `Unit ${unitNum}: ${u.name}`;
                    lUnitSelect.appendChild(opt);
                });
            }
        });
        
        // Trigger once to populate initial unit list for whatever grade is selected by default
        setTimeout(() => lGradeSelect.dispatchEvent(new Event('change')), 100);
    }
    const interactiveBuilderAdmin = document.getElementById('interactive-builder-admin');
    const adminQuestionsContainer = document.getElementById('admin-questions-container');
    const adminAddQuestionBtn = document.getElementById('admin-add-question-btn');
    
    if (lTypeSelect) {
        lTypeSelect.addEventListener('change', () => {
            if (lTypeSelect.value === 'Interactive Reading') {
                interactiveBuilderAdmin.style.display = 'block';
            } else {
                interactiveBuilderAdmin.style.display = 'none';
            }
        });
    }

    if (adminAddQuestionBtn) {
        adminAddQuestionBtn.addEventListener('click', () => {
            const qDiv = document.createElement('div');
            qDiv.style.border = '1px solid var(--border-color)';
            qDiv.style.padding = 'var(--space-sm)';
            qDiv.style.borderRadius = 'var(--radius-sm)';
            qDiv.style.background = 'var(--bg-main)';
            qDiv.style.position = 'relative';
            
            qDiv.innerHTML = `
                <button type="button" onclick="this.parentElement.remove()" style="position:absolute; top:8px; right:8px; background:none; border:none; color:var(--error); cursor:pointer;">&times;</button>
                <label style="font-weight:600; font-size:0.85rem;">Question Type</label>
                <select class="admin-q-type" style="width:100%; padding:6px; margin-bottom:8px;" onchange="
                    const mcOpts = this.parentElement.querySelector('.mc-options');
                    const ansInput = this.parentElement.querySelector('.admin-q-answer');
                    if (this.value === 'mc') {
                        mcOpts.style.display = 'block';
                        ansInput.placeholder = 'Correct Answer (e.g. A)';
                    } else {
                        mcOpts.style.display = 'none';
                        ansInput.placeholder = 'e.g. True / False / The word for the blank';
                    }
                ">
                    <option value="tf">True / False</option>
                    <option value="fill">Fill in the Blank</option>
                    <option value="mc">Multiple Choice</option>
                </select>
                
                <label style="font-weight:600; font-size:0.85rem;">Question Text</label>
                <input type="text" class="admin-q-text" placeholder="e.g. Ali is a doctor. (For fill-in-blank use ____ for blank)" style="width:100%; padding:6px; margin-bottom:8px;" required>
                
                <div class="mc-options" style="display:none; margin-bottom:8px;">
                    <label style="font-weight:600; font-size:0.85rem;">Options</label>
                    <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">A)</span> <input type="text" class="mc-opt-a" style="flex:1; padding:4px;"></div>
                    <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">B)</span> <input type="text" class="mc-opt-b" style="flex:1; padding:4px;"></div>
                    <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">C)</span> <input type="text" class="mc-opt-c" style="flex:1; padding:4px;"></div>
                    <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">D)</span> <input type="text" class="mc-opt-d" style="flex:1; padding:4px;"></div>
                </div>

                <label style="font-weight:600; font-size:0.85rem;">Correct Answer(s)</label>
                <input type="text" class="admin-q-answer" placeholder="e.g. True / False / The word for the blank" style="width:100%; padding:6px;" required>
            `;
            adminQuestionsContainer.appendChild(qDiv);
        });
    }

    // Handle Lesson Form Submission
    const lessonForm = document.getElementById('lesson-form');
    if (lessonForm) {
        lessonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Handle Document Upload first
            const fileInput = document.getElementById('l-file');
            const audience = document.getElementById('l-audience').value;
            let fileUrl = null;

            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                    const uploadRes = await fetch(`${API_URL}/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (uploadRes.ok) fileUrl = uploadData.url;
                    else throw new Error('Upload failed');
                } catch (err) {
                    alert('Error uploading document.');
                    return;
                }
            }

            let pdfStudent = currentLessonPdfs.student;
            let pdfTeacher = currentLessonPdfs.teacher;

            if (fileUrl) {
                if (audience === 'student' || audience === 'both') pdfStudent = fileUrl;
                if (audience === 'teacher' || audience === 'both') pdfTeacher = fileUrl;
            }

            // Override with External PDF Link if provided
            const extPdfUrl = document.getElementById('l-pdf-url').value;
            if (extPdfUrl && extPdfUrl.trim() !== '') {
                if (audience === 'student' || audience === 'both') pdfStudent = extPdfUrl.trim();
                if (audience === 'teacher' || audience === 'both') pdfTeacher = extPdfUrl.trim();
            }

            let interactiveData = null;
            const resourceType = document.getElementById('l-type').value;
            if (resourceType === 'Interactive Reading') {
                const qBlocks = document.getElementById('admin-questions-container').children;
                const questions = [];
                for(let i=0; i<qBlocks.length; i++) {
                    const type = qBlocks[i].querySelector('.admin-q-type').value;
                    const qText = qBlocks[i].querySelector('.admin-q-text').value;
                    const answer = qBlocks[i].querySelector('.admin-q-answer').value;
                    let options = null;
                    if (type === 'mc') {
                        options = [
                            qBlocks[i].querySelector('.mc-opt-a').value,
                            qBlocks[i].querySelector('.mc-opt-b').value,
                            qBlocks[i].querySelector('.mc-opt-c').value,
                            qBlocks[i].querySelector('.mc-opt-d').value
                        ];
                    }
                    questions.push({ type, question: qText, answer, options });
                }
                interactiveData = JSON.stringify(questions);
            }

            const payload = {
                title: document.getElementById('l-title').value,
                description: document.getElementById('l-desc').value,
                grade: document.getElementById('l-grade').value,
                unit: document.getElementById('l-unit').value,
                resourceType: resourceType,
                contentBody: document.getElementById('l-body').value,
                pdfStudent: pdfStudent,
                pdfTeacher: pdfTeacher,
                videoUrl: document.getElementById('l-video-url').value || null,
                interactiveData: interactiveData
            };

            try {
                const method = editingLessonId ? 'PUT' : 'POST';
                const endpoint = editingLessonId ? `${API_URL}/lessons/${editingLessonId}` : `${API_URL}/lessons`;

                const res = await fetch(endpoint, {
                    method: method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ADMIN_TOKEN}`
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    alert(editingLessonId ? 'Lesson successfully updated!' : 'Lesson successfully published to database!');
                    cancelEdit(); // Resets form and state
                    loadLessons();
                    switchTab('dashboard');
                } else {
                    alert('Error saving lesson.');
                }
            } catch (error) {
                console.error(error);
                alert('Connection error. Is the server running?');
            }
        });
    }

    // Handle File Upload
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('media-file');
            if (!fileInput.files[0]) return;

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            try {
                const res = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    document.getElementById('upload-result').innerHTML = `
                        File uploaded successfully!<br>
                        URL: <code style="background:var(--bg-main); padding:4px;">${data.url}</code>
                    `;
                    fileInput.value = '';
                    loadMediaGallery(); // Refresh the gallery
                }
            } catch (err) {
                alert('Upload failed.');
            }
        });
    }
});

// Load lessons into dashboard table
async function loadLessons() {
    const tbody = document.getElementById('admin-lessons-list');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/lessons`);
        const lessons = await res.json();

        if (lessons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No lessons found in database.</td></tr>';
            return;
        }

        tbody.innerHTML = lessons.map(l => `
            <tr>
                <td><strong>${l.title}</strong></td>
                <td><span class="badge" style="background:var(--primary); font-size:0.7rem;">${l.grade}</span> <span class="badge" style="background:var(--accent); font-size:0.7rem;">${l.unit}</span></td>
                <td>${l.resourceType}</td>
                <td>${new Date(l.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-outline" style="padding:4px 8px; font-size:0.8rem; border-color:var(--primary); color:var(--primary); margin-right: 4px;" onclick="editLesson('${l.id}')">Edit</button>
                    <button class="btn btn-outline" style="padding:4px 8px; font-size:0.8rem; border-color:var(--error); color:var(--error);" onclick="deleteLesson('${l.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--error);">Failed to connect to database server.</td></tr>';
    }
}

async function editLesson(id) {
    try {
        const res = await fetch(`${API_URL}/lessons/${id}`);
        const lesson = await res.json();
        
        editingLessonId = lesson.id;
        currentLessonPdfs.student = lesson.pdfStudent;
        currentLessonPdfs.teacher = lesson.pdfTeacher;

        document.getElementById('l-title').value = lesson.title;
        document.getElementById('l-desc').value = lesson.description || '';
        document.getElementById('l-grade').value = lesson.grade;
        document.getElementById('l-unit').value = lesson.unit;
        document.getElementById('l-type').value = lesson.resourceType;
        document.getElementById('l-body').value = lesson.contentBody;
        document.getElementById('l-video-url').value = lesson.videoUrl || '';
        document.getElementById('l-pdf-url').value = lesson.pdfStudent || lesson.pdfTeacher || '';
        
        // Handle Interactive Reading data
        const interactiveBuilderAdmin = document.getElementById('interactive-builder-admin');
        const adminQuestionsContainer = document.getElementById('admin-questions-container');
        adminQuestionsContainer.innerHTML = ''; // clear existing
        
        if (lesson.resourceType === 'Interactive Reading') {
            interactiveBuilderAdmin.style.display = 'block';
            let iData = lesson.interactiveData;
            if (typeof iData === 'string') {
                try { iData = JSON.parse(iData); } catch(e) {}
            }
            if (iData && Array.isArray(iData)) {
                iData.forEach(q => {
                    const qDiv = document.createElement('div');
                    qDiv.style.border = '1px solid var(--border-color)';
                    qDiv.style.padding = 'var(--space-sm)';
                    qDiv.style.borderRadius = 'var(--radius-sm)';
                    qDiv.style.background = 'var(--bg-main)';
                    qDiv.style.position = 'relative';
                    
                    const isMc = q.type === 'mc';
                    const optA = isMc && q.options ? q.options[0] : '';
                    const optB = isMc && q.options ? q.options[1] : '';
                    const optC = isMc && q.options ? q.options[2] : '';
                    const optD = isMc && q.options ? q.options[3] : '';

                    qDiv.innerHTML = `
                        <button type="button" onclick="this.parentElement.remove()" style="position:absolute; top:8px; right:8px; background:none; border:none; color:var(--error); cursor:pointer;">&times;</button>
                        <label style="font-weight:600; font-size:0.85rem;">Question Type</label>
                        <select class="admin-q-type" style="width:100%; padding:6px; margin-bottom:8px;" onchange="
                            const mcOpts = this.parentElement.querySelector('.mc-options');
                            const ansInput = this.parentElement.querySelector('.admin-q-answer');
                            if (this.value === 'mc') {
                                mcOpts.style.display = 'block';
                                ansInput.placeholder = 'Correct Answer (e.g. A)';
                            } else {
                                mcOpts.style.display = 'none';
                                ansInput.placeholder = 'e.g. True / False / The word for the blank';
                            }
                        ">
                            <option value="tf" ${q.type === 'tf' ? 'selected' : ''}>True / False</option>
                            <option value="fill" ${q.type === 'fill' ? 'selected' : ''}>Fill in the Blank</option>
                            <option value="mc" ${isMc ? 'selected' : ''}>Multiple Choice</option>
                        </select>
                        
                        <label style="font-weight:600; font-size:0.85rem;">Question Text</label>
                        <input type="text" class="admin-q-text" value="${q.question.replace(/"/g, '&quot;')}" placeholder="e.g. Ali is a doctor. (For fill-in-blank use ____ for blank)" style="width:100%; padding:6px; margin-bottom:8px;" required>
                        
                        <div class="mc-options" style="display:${isMc ? 'block' : 'none'}; margin-bottom:8px;">
                            <label style="font-weight:600; font-size:0.85rem;">Options</label>
                            <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">A)</span> <input type="text" class="mc-opt-a" value="${optA.replace(/"/g, '&quot;')}" style="flex:1; padding:4px;"></div>
                            <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">B)</span> <input type="text" class="mc-opt-b" value="${optB.replace(/"/g, '&quot;')}" style="flex:1; padding:4px;"></div>
                            <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">C)</span> <input type="text" class="mc-opt-c" value="${optC.replace(/"/g, '&quot;')}" style="flex:1; padding:4px;"></div>
                            <div style="display:flex; gap:4px; margin-bottom:4px;"><span style="width:20px; font-weight:bold;">D)</span> <input type="text" class="mc-opt-d" value="${optD.replace(/"/g, '&quot;')}" style="flex:1; padding:4px;"></div>
                        </div>

                        <label style="font-weight:600; font-size:0.85rem;">Correct Answer(s)</label>
                        <input type="text" class="admin-q-answer" value="${q.answer.replace(/"/g, '&quot;')}" placeholder="${isMc ? 'Correct Answer (e.g. A)' : 'e.g. True / False / The word for the blank'}" style="width:100%; padding:6px;" required>
                    `;
                    adminQuestionsContainer.appendChild(qDiv);
                });
            }
        } else {
            interactiveBuilderAdmin.style.display = 'none';
        }
        
        // Update UI logic
        document.getElementById('editor-title').innerText = 'Edit Lesson';
        document.getElementById('submit-lesson-btn').innerText = '🔄 Update Lesson';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';

        switchTab('content-editor');
    } catch (err) {
        alert('Failed to load lesson for editing.');
    }
}

function cancelEdit() {
    editingLessonId = null;
    currentLessonPdfs = { student: null, teacher: null };
    document.getElementById('lesson-form').reset();
    document.getElementById('admin-questions-container').innerHTML = '';
    document.getElementById('interactive-builder-admin').style.display = 'none';
    
    document.getElementById('editor-title').innerText = 'Create New Lesson';
    document.getElementById('submit-lesson-btn').innerText = '🚀 Publish Lesson to Database';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

async function deleteLesson(id) {
    if(!confirm('Are you sure you want to delete this lesson?')) return;
    try {
        await fetch(`${API_URL}/lessons/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        loadLessons();
    } catch (err) {
        alert('Failed to delete.');
    }
}

// -- Teacher Approvals Logic --
async function loadTeachers() {
    const tbody = document.getElementById('admin-teachers-list');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No teachers registered yet.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td><strong>${u.fullName}</strong></td>
                <td>${u.school || '-'}</td>
                <td>${u.email}</td>
                <td><span class="badge" style="background:${u.status === 'APPROVED' ? 'var(--success)' : 'var(--warning)'}; font-size:0.7rem;">${u.status}</span></td>
                <td>
                    ${u.status === 'PENDING' ? `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.8rem; border-color:var(--success); color:var(--success);" onclick="approveTeacher('${u.id}')">Approve</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--error);">Failed to load teachers.</td></tr>';
    }
}

async function approveTeacher(id) {
    if(!confirm('Approve this teacher account?')) return;
    try {
        await fetch(`${API_URL}/admin/users/${id}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        loadTeachers();
    } catch (err) {
        alert('Failed to approve teacher.');
    }
}

// Tab switcher
function switchTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById('tab-' + tabId).style.display = 'block';
    
    document.querySelectorAll('.admin-nav a').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    if (tabId === 'teacher-approvals') loadTeachers();
    if (tabId === 'media-manager') loadMediaGallery();
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// --- AUTHENTICATION LOGIC ---
function checkAdminLogin() {
    const pwd = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('login-error');
    
    // For this prototype, we'll use a hardcoded password "patron123"
    if (pwd === 'patron123') {
        errorDiv.style.display = 'none';
        localStorage.setItem('adminToken', 'mock_admin_token');
        ADMIN_TOKEN = 'mock_admin_token';
        
        document.getElementById('admin-login-overlay').style.display = 'none';
        document.getElementById('admin-layout-wrapper').style.display = 'flex';
        
        loadLessons();
        loadTeachers();
    } else {
        errorDiv.style.display = 'block';
    }
}

function logoutAdmin() {
    localStorage.removeItem('adminToken');
    ADMIN_TOKEN = null;
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-layout-wrapper').style.display = 'none';
    document.getElementById('admin-login-overlay').style.display = 'flex';
}

// --- MEDIA GALLERY ---
async function loadMediaGallery() {
    const gallery = document.getElementById('media-gallery');
    if (!gallery) return;
    gallery.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; padding: 2rem;">Loading media from Cloudinary...</div>';

    try {
        const res = await fetch(API_URL + '/admin/media', {
            headers: { 'Authorization': 'Bearer ' + ADMIN_TOKEN }
        });
        const resources = await res.json();
        
        if (!res.ok) throw new Error('Failed to load media');
        
        if (resources.length === 0) {
            gallery.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; padding: 2rem;">No media files uploaded yet.</div>';
            return;
        }

        gallery.innerHTML = resources.map(file => {
            const isImage = file.format === 'jpg' || file.format === 'png' || file.format === 'gif' || file.format === 'webp';
            const icon = isImage ? \<img src="\" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:8px;">\ 
                                 : \<div style="height:120px; background:var(--bg-main); border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:8px;"><i data-lucide="file" style="width:48px; height:48px; color:var(--primary);"></i></div>\;
            
            return \
                <div class="admin-card" style="padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        \
                        <div style="font-size:0.85rem; word-break:break-all; margin-bottom:8px; color:var(--text-color);">
                            <strong>\</strong><br>
                            <span style="color:var(--text-muted);">\ KB</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-outline" style="flex:1; padding:6px; font-size:0.8rem;" onclick="navigator.clipboard.writeText('\'); alert('URL Copied!')">Copy URL</button>
                        <button class="btn" style="background:#ef4444; color:white; padding:6px;" onclick="deleteMedia('\')"><i data-lucide="trash-2" style="width:16px;"></i></button>
                    </div>
                </div>
            \;
        }).join('');
        lucide.createIcons();
    } catch (err) {
        gallery.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; padding: 2rem; color: #ef4444;">Error loading media. Ensure Cloudinary keys are set in .env.</div>';
    }
}

async function deleteMedia(publicId) {
    if (!confirm('Are you sure you want to permanently delete this file? This will break any lessons using this URL.')) return;
    
    try {
        const res = await fetch(API_URL + '/admin/media?public_id=' + encodeURIComponent(publicId), {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + ADMIN_TOKEN }
        });
        
        if (res.ok) {
            loadMediaGallery();
        } else {
            alert('Failed to delete file.');
        }
    } catch (err) {
        alert('Connection error.');
    }
}
