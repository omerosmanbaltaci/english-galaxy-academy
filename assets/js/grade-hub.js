/* ==========================================================================
   English Galaxy Academy - Grade Hub Generator Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initGradeHub();
});

function initGradeHub() {
    const body = document.body;
    const currentGrade = body.getAttribute('data-grade');
    const currentLevel = body.getAttribute('data-level');
    
    const container = document.getElementById('grade-hub-container');
    if (!container || !currentGrade || !window.Taxonomy) return;

    const gradeInfo = window.Taxonomy.grades[currentGrade];
    const gradeUnits = window.Taxonomy.units[currentGrade];

    if (!gradeInfo) {
        container.innerHTML = `<p style="color: var(--error);">Error: Grade metadata not found in taxonomy.</p>`;
        return;
    }

    // Set page title dynamically
    document.title = `${gradeInfo.name} English Curriculum & Resources | English Galaxy Academy`;

    // 1. Build Header & Breadcrumbs
    const levelPages = {
        'primary': { name: 'Primary School', url: '../primary.html', icon: '<div class="nav-icon" style="width: 40px; height: 40px; margin-right: 16px; border-radius: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 2h8"></path><circle cx="12" cy="11" r="3"></circle></svg></div>' },
        'middle-school': { name: 'Middle School', url: '../middle-school.html', icon: '<div class="nav-icon" style="width: 40px; height: 40px; margin-right: 16px; border-radius: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></div>' },
        'high-school': { name: 'High School', url: '../high-school.html', icon: '<div class="nav-icon" style="width: 40px; height: 40px; margin-right: 16px; border-radius: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div>' }
    };
    const levelInfo = levelPages[currentLevel] || { name: 'Home', url: '../index.html', icon: '' };

    let headerHTML = `
        <div style="margin-bottom: var(--space-xl); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-md);">
            <ul class="breadcrumbs">
                <li class="breadcrumb-item"><a href="../index.html">Home</a></li>
                <li class="breadcrumb-separator">></li>
                <li class="breadcrumb-item"><a href="${levelInfo.url}">${levelInfo.name}</a></li>
                <li class="breadcrumb-separator">></li>
                <li class="breadcrumb-item active">${gradeInfo.name}</li>
            </ul>
            <h1 style="display: flex; align-items: center;">${levelInfo.icon} ${gradeInfo.name} English Portal</h1>
            <p style="font-size: 1.15rem; color: var(--text-muted);">Access MEB English curriculum units, lesson notes, vocabulary flashcards, printable worksheets, and quizzes for ${gradeInfo.name}.</p>
        </div>
    `;

    // 2. Setup Layout Grid (Sidebar Navigation + Main Area)
    let layoutHTML = `
        <div class="sidebar-layout">
            <!-- Unit Navigation Sidebar -->
            <aside class="sidebar">
                <h3 class="sidebar-title">Curriculum Units</h3>
                <ul class="sidebar-menu" id="unit-menu-list">
                    ${gradeUnits.map(unit => `
                        <li>
                            <a href="#${unit.code}" class="sidebar-item-link" data-unit="${unit.code}">
                                📖 ${unit.code.toUpperCase().replace('-', ' ')}: ${unit.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </aside>

            <!-- Resources Panel -->
            <div class="main-content" id="grade-resources-panel">
                <h2 style="margin-bottom: var(--space-md);">Curriculum Resources</h2>
                <div id="units-sections-container">
                    <p style="color: var(--text-muted);">Loading resources...</p>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = headerHTML + layoutHTML;

    // 3. Fetch resources and group by unit
    fetch('/api/lessons')
        .then(res => res.json())
        .then(data => {
            // Filter resources belonging to this grade
            const gradeResources = data.filter(item => item.grade === currentGrade);
            
            const sectionsContainer = document.getElementById('units-sections-container');
            let sectionsHTML = '';

            // Render each Unit section
            gradeUnits.forEach((unit, idx) => {
                const unitResources = gradeResources.filter(item => item.unit === unit.code);
                
                let resourcesListHTML = '';
                if (unitResources.length === 0) {
                    resourcesListHTML = `
                        <div style="background-color: var(--bg-surface); padding: var(--space-md); border-radius: var(--radius-md); border: 1px dashed var(--border-color); text-align: center; color: var(--text-muted);">
                            📭 No resources uploaded yet for this unit. We are updating content regularly!
                        </div>
                    `;
                } else {
                    resourcesListHTML = `
                        <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
                            ${unitResources.map(item => `
                                <div class="card">
                                    <div class="card-content">
                                        <div class="card-tags">
                                            <span class="badge" style="background-color: var(--primary);">${item.resourceType || item.resource_type}</span>
                                            ${item.difficulty ? `<span class="badge" style="background-color: var(--success);">${item.difficulty}</span>` : ''}
                                        </div>
                                        <h3 class="card-title" style="font-size: 1.1rem; margin-top: var(--space-xs);">${item.title}</h3>
                                        <p class="card-desc" style="font-size: 0.85rem;">${item.description}</p>
                                        
                                        ${item.tags ? `
                                            <div class="card-tags" style="margin-bottom: var(--space-md);">
                                                ${item.tags.slice(0, 3).map(t => `<span class="tag">#${t}</span>`).join('')}
                                            </div>
                                        ` : ''}

                                        <a href="../viewer.html?id=${item.id}" class="btn btn-secondary" style="margin-top: auto; width: 100%; min-height: 36px; padding: 6px 12px; font-size: 0.85rem;">
                                            Open Material
                                        </a>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                sectionsHTML += `
                    <section id="${unit.code}" style="margin-bottom: var(--space-xxl); ${idx > 0 ? 'border-top: 1px solid var(--border-color); padding-top: var(--space-xl);' : ''}">
                        <h3 style="font-size: 1.35rem; margin-bottom: var(--space-xs); display: flex; align-items: center; gap: var(--space-sm);">
                            <span style="background-color: var(--primary); color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem;">
                                ${idx + 1}
                            </span>
                            ${unit.code.toUpperCase().replace('-', ' ')}: ${unit.name}
                        </h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: var(--space-md);">Curriculum outcomes practice and interactive activities for ${unit.name}.</p>
                        ${resourcesListHTML}
                        <div style="margin-top: var(--space-md); text-align: right;">
                            <a href="../unit.html?grade=${currentGrade}&unit=${unit.code}" class="btn btn-accent" style="font-size: 0.9rem; padding: 8px 20px; gap: 6px;">
                                📚 View Unit Resources ➔
                            </a>
                        </div>
                    </section>
                `;
            });

            sectionsContainer.innerHTML = sectionsHTML;

            // Setup scrolling sidebar highlights
            setupScrollSpy();
        })
        .catch(err => {
            console.error('Error fetching resources for grade portal:', err);
            document.getElementById('units-sections-container').innerHTML = `
                <p style="color: var(--error);">Failed to load resources. Verify content/search-index.json exists.</p>
            `;
        });
}

function setupScrollSpy() {
    const menuLinks = document.querySelectorAll('#unit-menu-list a');
    const sections = document.querySelectorAll('#units-sections-container section');

    if (menuLinks.length === 0 || sections.length === 0) return;

    // Add click handler to scroll smoothly
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSec = document.querySelector(targetId);
            if (targetSec) {
                window.scrollTo({
                    top: targetSec.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple scroll spy listener
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        sections.forEach(sec => {
            const top = window.scrollY;
            const offset = sec.offsetTop - 120;
            const height = sec.offsetHeight;
            if (top >= offset && top < offset + height) {
                currentSectionId = sec.getAttribute('id');
            }
        });

        menuLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-unit') === currentSectionId) {
                link.classList.add('active');
            }
        });
    });
}
