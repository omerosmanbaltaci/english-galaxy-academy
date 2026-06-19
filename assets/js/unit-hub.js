/* ==========================================================================
   English Galaxy Academy - Unit Hub Controller
   ==========================================================================
   Reads ?grade=grade-X&unit=unit-Y query parameters and populates the
   unit.html layout with:
   - Dynamic breadcrumbs
   - Unit hero header
   - Learning outcomes (from CurriculumEngine)
   - Coverage progress bar
   - Resources grid (from search-index.json)
   - Vocabulary panel
   - Unit metadata sidebar
   - Quick navigation to adjacent units
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initUnitHub();
});

function initUnitHub() {
    const params = new URLSearchParams(window.location.search);
    const gradeId = params.get('grade');
    const unitCode = params.get('unit');

    if (!gradeId || !unitCode || !window.Taxonomy) {
        showError();
        return;
    }

    const gradeInfo = window.Taxonomy.grades[gradeId];
    const gradeUnits = window.Taxonomy.units[gradeId];

    if (!gradeInfo || !gradeUnits) {
        showError();
        return;
    }

    const unitInfo = gradeUnits.find(u => u.code === unitCode);
    if (!unitInfo) {
        showError();
        return;
    }

    const unitIndex = gradeUnits.indexOf(unitInfo);
    const gradeNum = parseInt(gradeId.replace('grade-', ''));

    // Update page title and SEO
    const pageTitle = `${unitCode.toUpperCase().replace('-', ' ')}: ${unitInfo.name} — ${gradeInfo.name} | English Galaxy Academy`;
    document.title = pageTitle;
    updateMeta('description', `Explore learning outcomes, vocabulary, and curriculum-aligned resources for ${unitInfo.name} in ${gradeInfo.name}. MEB English curriculum unit details.`);
    updateMeta('og:title', pageTitle);

    // Build breadcrumbs
    renderBreadcrumbs(gradeId, gradeInfo, unitInfo, unitCode);

    // Build hero section
    renderHero(gradeId, gradeInfo, unitInfo, unitCode, unitIndex);

    // Build metadata sidebar
    renderMetaSidebar(gradeId, gradeInfo, unitInfo, unitCode, unitIndex, gradeNum);

    // Build quick navigation
    renderQuickNav(gradeId, gradeUnits, unitIndex);

    // Fetch resources and build dynamic sections
    fetch('/api/lessons')
        .then(res => res.json())
        .then(data => {
            const unitResources = data.filter(item =>
                item.grade === gradeId && item.unit === unitCode
            );

            // Build outcomes (uses CurriculumEngine if available)
            renderOutcomes(gradeId, unitCode, unitResources, data);

            // Build coverage strip
            renderCoverageStrip(gradeId, unitCode, data);

            // Build resources grid
            renderResources(unitResources);

            // Build vocabulary
            renderVocabulary(gradeId, unitCode, unitResources);

            // Show content, hide loader
            document.getElementById('unit-hub-loading').style.display = 'none';
            document.getElementById('unit-hub-content').style.display = 'block';
            if (window.applyTranslations) window.applyTranslations();
        })
        .catch(err => {
            console.error('Unit Hub: Error loading resources', err);
            // Still show the page with outcomes even if search-index fails
            renderOutcomes(gradeId, unitCode, [], []);
            renderCoverageStrip(gradeId, unitCode, []);
            renderResources([]);
            renderVocabulary(gradeId, unitCode, []);
            document.getElementById('unit-hub-loading').style.display = 'none';
            document.getElementById('unit-hub-content').style.display = 'block';
            if (window.applyTranslations) window.applyTranslations();
        });
}

/* --------------------------------------------------------------------------
   ERROR STATE
   -------------------------------------------------------------------------- */
function showError() {
    document.getElementById('unit-hub-loading').style.display = 'none';
    document.getElementById('unit-hub-error').style.display = 'block';
}

/* --------------------------------------------------------------------------
   SEO HELPERS
   -------------------------------------------------------------------------- */
function updateMeta(name, content) {
    // Try property first (og:), then name
    let el = document.querySelector(`meta[property="${name}"]`) ||
             document.querySelector(`meta[name="${name}"]`);
    if (el) el.setAttribute('content', content);
}

/* --------------------------------------------------------------------------
   BREADCRUMBS
   -------------------------------------------------------------------------- */
function renderBreadcrumbs(gradeId, gradeInfo, unitInfo, unitCode) {
    const levelPages = {
        'primary': { name: 'Primary School', url: 'primary.html', folder: 'primary' },
        'middle-school': { name: 'Middle School', url: 'middle-school.html', folder: 'middle-school' },
        'high-school': { name: 'High School', url: 'high-school.html', folder: 'high-school' }
    };
    const levelInfo = levelPages[gradeInfo.level] || { name: 'Home', url: 'index.html', folder: '' };
    const gradeUrl = `${levelInfo.folder}/${gradeId}.html`;

    document.getElementById('unit-breadcrumbs').innerHTML = `
        <ul class="breadcrumbs">
            <li class="breadcrumb-item"><a href="index.html">Home</a></li>
            <li class="breadcrumb-separator">›</li>
            <li class="breadcrumb-item"><a href="${levelInfo.url}">${levelInfo.name}</a></li>
            <li class="breadcrumb-separator">›</li>
            <li class="breadcrumb-item"><a href="${gradeUrl}">${gradeInfo.name}</a></li>
            <li class="breadcrumb-separator">›</li>
            <li class="breadcrumb-item active">${unitCode.toUpperCase().replace('-', ' ')}: ${unitInfo.name}</li>
        </ul>
    `;
}

/* --------------------------------------------------------------------------
   HERO HEADER
   -------------------------------------------------------------------------- */
function renderHero(gradeId, gradeInfo, unitInfo, unitCode, unitIndex) {
    const unitNumber = unitIndex + 1;
    const levelEmojis = { 'primary': '🎒', 'middle-school': '🏫', 'high-school': '🎓' };
    const emoji = levelEmojis[gradeInfo.level] || '📚';

    document.getElementById('unit-hero-section').innerHTML = `
        <div class="unit-hero-inner">
            <div class="unit-hero-badge">
                <span class="unit-hero-badge-icon">${emoji}</span>
                <span class="unit-hero-badge-text">${gradeInfo.name}</span>
            </div>
            <h1 class="unit-hero-title">
                <span class="unit-hero-number">Unit ${unitNumber}</span>
                ${unitInfo.name}
            </h1>
            <p class="unit-hero-desc">
                Explore learning outcomes, teaching resources, and vocabulary for <strong>${unitInfo.name}</strong>
                in the ${gradeInfo.name} MEB English curriculum.
            </p>
            <div class="unit-hero-actions" style="margin-top: var(--space-md); display: flex; gap: var(--space-sm); flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="openSpeakingAssistant()">🎙️ Practice Speaking</button>
                <button class="btn btn-outline" onclick="openUnitQuiz()" style="background-color: var(--bg-surface);">✅ Take Unit Quiz</button>
            </div>
            <div class="unit-hero-stats" id="unit-hero-stats">
                <!-- Populated after resources load -->
            </div>
        </div>
    `;
}

/* --------------------------------------------------------------------------
   LEARNING OUTCOMES
   -------------------------------------------------------------------------- */
function renderOutcomes(gradeId, unitCode, unitResources, allResources) {
    const container = document.getElementById('unit-outcomes-list');
    if (!container) return;
    let outcomes = [];

    // Try CurriculumEngine first
    if (window.CurriculumEngine && window.CurriculumEngine.Mapper) {
        outcomes = window.CurriculumEngine.Mapper.mapResourcesToOutcomes(
            gradeId, unitCode, allResources, 'meb'
        );
    }

    if (outcomes.length === 0) {
        // Fallback: generate display-only outcomes from taxonomy
        const gradeNum = parseInt(gradeId.replace('grade-', ''));
        const unitNum = parseInt(unitCode.replace('unit-', ''));
        const count = gradeNum <= 4 ? 2 : (gradeNum <= 8 ? 3 : 4);

        for (let i = 1; i <= count; i++) {
            outcomes.push({
                code: `E${gradeNum}.${unitNum}.LO${i}`,
                description: getDefaultOutcomeDesc(gradeNum, i),
                covered: unitResources.length > 0,
                resourceCount: 0,
                skills: []
            });
        }
    }

    if (outcomes.length === 0) {
        container.innerHTML = `
            <div class="unit-empty-notice">
                <span>📋</span>
                <p>Learning outcomes will be populated when MEB curriculum data is imported.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="unit-outcomes-grid">';
    outcomes.forEach((outcome, idx) => {
        const statusClass = outcome.covered ? 'covered' : 'pending';
        const statusIcon = outcome.covered ? '✅' : '⏳';
        const statusText = outcome.covered ? 'Resources Available' : 'Pending Resources';

        html += `
            <div class="unit-outcome-item ${statusClass}">
                <div class="unit-outcome-header">
                    <span class="unit-outcome-code">${outcome.code}</span>
                    <span class="unit-outcome-status ${statusClass}">
                        ${statusIcon} ${statusText}
                    </span>
                </div>
                <p class="unit-outcome-desc">${outcome.description}</p>
                ${outcome.skills && outcome.skills.length > 0 ? `
                    <div class="unit-outcome-skills">
                        ${outcome.skills.map(s => `<span class="unit-skill-chip">${getSkillEmoji(s)} ${capitalize(s)}</span>`).join('')}
                    </div>
                ` : ''}
                ${outcome.resourceCount > 0 ? `
                    <div class="unit-outcome-footer">
                        <span class="unit-outcome-count">📦 ${outcome.resourceCount} resource${outcome.resourceCount > 1 ? 's' : ''} linked</span>
                    </div>
                ` : ''}
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function getDefaultOutcomeDesc(gradeNum, loNum) {
    if (gradeNum <= 4) {
        const descs = {
            1: 'Students will be able to recognize and use target vocabulary in context through visual and auditory activities.',
            2: 'Students will be able to follow simple instructions and respond appropriately in guided classroom interactions.'
        };
        return descs[loNum] || `Learning outcome ${loNum}.`;
    } else if (gradeNum <= 8) {
        const descs = {
            1: 'Students can identify and produce target language structures in both spoken and written form.',
            2: 'Students can participate in guided dialogues and discussions about the unit topic.',
            3: 'Students can demonstrate reading comprehension through structured activities and exercises.'
        };
        return descs[loNum] || `Learning outcome ${loNum}.`;
    } else {
        const descs = {
            1: 'Students can comprehend authentic spoken and written texts related to the unit theme.',
            2: 'Students can produce extended written and spoken responses using complex language structures.',
            3: 'Students can apply critical thinking skills to analyze and evaluate topic-related content.',
            4: 'Students can synthesize information from multiple sources to create original responses and presentations.'
        };
        return descs[loNum] || `Learning outcome ${loNum}.`;
    }
}

function getSkillEmoji(skill) {
    const map = {
        'listening': '👂', 'speaking': '🗣️', 'reading': '📖',
        'writing': '✍️', 'grammar': '📐', 'vocabulary': '📝'
    };
    return map[skill] || '📚';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* --------------------------------------------------------------------------
   COVERAGE STRIP
   -------------------------------------------------------------------------- */
function renderCoverageStrip(gradeId, unitCode, searchIndex) {
    const container = document.getElementById('unit-coverage-strip');
    let coverage = null;

    if (window.CurriculumEngine && window.CurriculumEngine.Coverage) {
        coverage = window.CurriculumEngine.Coverage.calculateUnitCoverage(
            gradeId, unitCode, searchIndex, 'meb'
        );
    }

    if (!coverage || coverage.totalOutcomes === 0) {
        container.innerHTML = `
            <div class="unit-coverage-bar-wrapper">
                <div class="unit-coverage-label">
                    <span>📊 Outcome Coverage</span>
                    <span class="unit-coverage-value">Calculating...</span>
                </div>
                <div class="unit-progress-track">
                    <div class="unit-progress-fill" style="width: 0%;"></div>
                </div>
            </div>
        `;
        return;
    }

    const pct = coverage.percentage;
    const colorClass = pct >= 75 ? 'high' : (pct >= 40 ? 'medium' : 'low');

    // Update hero stats too
    const heroStats = document.getElementById('unit-hero-stats');
    if (heroStats) {
        const unitResources = searchIndex.filter(r => r.grade === gradeId && r.unit === unitCode);
        const resourceTypes = new Set(unitResources.map(r => r.contentType || r.resource_type).filter(Boolean));
        heroStats.innerHTML = `
            <div class="unit-stat-item">
                <span class="unit-stat-value">${coverage.totalOutcomes}</span>
                <span class="unit-stat-label">Learning Outcomes</span>
            </div>
            <div class="unit-stat-item">
                <span class="unit-stat-value">${unitResources.length}</span>
                <span class="unit-stat-label">Resources</span>
            </div>
            <div class="unit-stat-item">
                <span class="unit-stat-value">${resourceTypes.size}</span>
                <span class="unit-stat-label">Resource Types</span>
            </div>
            <div class="unit-stat-item">
                <span class="unit-stat-value">${pct}%</span>
                <span class="unit-stat-label">Coverage</span>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="unit-coverage-bar-wrapper">
            <div class="unit-coverage-label">
                <span>📊 Outcome Coverage: ${coverage.coveredOutcomes}/${coverage.totalOutcomes} outcomes</span>
                <span class="unit-coverage-value ${colorClass}">${pct}%</span>
            </div>
            <div class="unit-progress-track">
                <div class="unit-progress-fill ${colorClass}" style="width: ${pct}%;"></div>
            </div>
        </div>
    `;
}

/* --------------------------------------------------------------------------
   RESOURCES GRID
   -------------------------------------------------------------------------- */
function renderResources(unitResources) {
    const container = document.getElementById('unit-resources-grid');
    const filtersContainer = document.getElementById('unit-resource-filters');

    if (unitResources.length === 0) {
        container.innerHTML = `
            <div class="unit-empty-notice">
                <span>📭</span>
                <p>No resources have been uploaded for this unit yet. We update content regularly — check back soon!</p>
            </div>
        `;
        filtersContainer.innerHTML = '';
        return;
    }

    // Build type filter chips
    const types = [...new Set(unitResources.map(r => r.contentType || r.resource_type).filter(Boolean))];
    let filterHTML = `<button class="unit-filter-chip active" data-filter="all">All (${unitResources.length})</button>`;
    types.forEach(type => {
        const count = unitResources.filter(r => (r.contentType || r.resource_type) === type).length;
        filterHTML += `<button class="unit-filter-chip" data-filter="${type}">${getTypeIcon(type)} ${formatType(type)} (${count})</button>`;
    });
    filtersContainer.innerHTML = filterHTML;

    // Build resource cards
    let cardsHTML = '<div class="unit-resources-list">';
    unitResources.forEach(item => {
        const type = item.resourceType || item.resource_type || 'resource';
        const diffBadge = item.difficulty ? `<span class="badge" style="background-color: var(--success);">${item.difficulty}</span>` : '';

        cardsHTML += `
            <div class="unit-resource-card" data-type="${type}">
                <div class="unit-resource-card-inner">
                    <div class="unit-resource-icon">${getTypeIcon(type)}</div>
                    <div class="unit-resource-info">
                        <div class="card-tags">
                            <span class="badge">${formatType(type)}</span>
                            ${diffBadge}
                        </div>
                        <h4 class="unit-resource-title">${item.title}</h4>
                        <p class="unit-resource-desc">${item.description || ''}</p>
                        ${item.skills ? `
                            <div class="unit-resource-skills">
                                ${(Array.isArray(item.skills) ? item.skills : []).slice(0, 4).map(s =>
                                    `<span class="unit-skill-chip small">${getSkillEmoji(s)} ${capitalize(s)}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <a href="viewer.html?id=${item.id}" class="btn btn-secondary unit-resource-btn">
                        Open Resource →
                    </a>
                </div>
            </div>
        `;
    });
    cardsHTML += '</div>';
    container.innerHTML = cardsHTML;

    // Setup filter interactions
    setupResourceFilters();
}

function getTypeIcon(type) {
    const icons = {
        'lesson': '📝', 'worksheet': '📄', 'flashcard': '🃏', 'flashcards': '🃏',
        'quiz': '❓', 'teacher-resource': '🧑‍🏫', 'game': '🎮',
        'reading': '📖', 'listening': '🎧', 'video': '🎬'
    };
    return icons[type] || '📚';
}

function formatType(type) {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function setupResourceFilters() {
    const chips = document.querySelectorAll('.unit-filter-chip');
    const cards = document.querySelectorAll('.unit-resource-card');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active chip
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const filter = chip.getAttribute('data-filter');
            cards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-type') === filter) {
                    card.style.display = '';
                    card.style.animation = 'fadeSlideUp 0.3s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* --------------------------------------------------------------------------
   VOCABULARY
   -------------------------------------------------------------------------- */
function renderVocabulary(gradeId, unitCode, unitResources) {
    const container = document.getElementById('unit-vocabulary-list');

    // Try CurriculumEngine vocabulary
    let vocabulary = [];
    if (window.CurriculumEngine && window.CurriculumEngine.Registry) {
        vocabulary = window.CurriculumEngine.Registry.getVocabulary('meb', gradeId, unitCode);
    }

    // Fallback: extract from resource metadata
    if (vocabulary.length === 0) {
        const vocabSets = unitResources
            .filter(r => r.vocabulary && Array.isArray(r.vocabulary))
            .flatMap(r => r.vocabulary);
        vocabulary = [...new Set(vocabSets)];
    }

    if (vocabulary.length === 0) {
        container.innerHTML = `
            <div class="unit-empty-notice small">
                <span>📝</span>
                <p>Vocabulary items will appear here when resources containing vocabulary metadata are uploaded.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="unit-vocab-grid">';
    vocabulary.forEach(word => {
        html += `<span class="unit-vocab-chip">${word}</span>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

/* --------------------------------------------------------------------------
   METADATA SIDEBAR
   -------------------------------------------------------------------------- */
function renderMetaSidebar(gradeId, gradeInfo, unitInfo, unitCode, unitIndex, gradeNum) {
    const container = document.getElementById('unit-meta-body');
    const unitNumber = unitIndex + 1;

    const levelNames = {
        'primary': 'Primary School (İlkokul)',
        'middle-school': 'Middle School (Ortaokul)',
        'high-school': 'High School (Lise)'
    };
    const levelName = levelNames[gradeInfo.level] || gradeInfo.level;

    // Determine CEFR level range
    const cefrMap = {
        1: 'Pre-A1', 2: 'Pre-A1', 3: 'A1', 4: 'A1',
        5: 'A1-A2', 6: 'A2', 7: 'A2-A2+', 8: 'A2+-B1',
        9: 'B1', 10: 'B1-B1+', 11: 'B1+-B2', 12: 'B2'
    };
    const cefrLevel = cefrMap[gradeNum] || 'A1';

    container.innerHTML = `
        <div class="unit-meta-list">
            <div class="unit-meta-row">
                <span class="unit-meta-label">📚 School Level</span>
                <span class="unit-meta-value">${levelName}</span>
            </div>
            <div class="unit-meta-row">
                <span class="unit-meta-label">🎓 Grade</span>
                <span class="unit-meta-value">${gradeInfo.name}</span>
            </div>
            <div class="unit-meta-row">
                <span class="unit-meta-label">📖 Unit</span>
                <span class="unit-meta-value">Unit ${unitNumber}: ${unitInfo.name}</span>
            </div>
            <div class="unit-meta-row">
                <span class="unit-meta-label">🌍 CEFR Level</span>
                <span class="unit-meta-value">${cefrLevel}</span>
            </div>
            <div class="unit-meta-row">
                <span class="unit-meta-label">📋 Curriculum</span>
                <span class="unit-meta-value">MEB 2024-2025</span>
            </div>
        </div>
    `;
}

/* --------------------------------------------------------------------------
   QUICK NAVIGATION (Previous / Next unit)
   -------------------------------------------------------------------------- */
function renderQuickNav(gradeId, gradeUnits, currentIndex) {
    const container = document.getElementById('unit-quick-nav-body');
    const prevUnit = currentIndex > 0 ? gradeUnits[currentIndex - 1] : null;
    const nextUnit = currentIndex < gradeUnits.length - 1 ? gradeUnits[currentIndex + 1] : null;

    let html = '<div class="unit-quick-nav-list">';

    if (prevUnit) {
        html += `
            <a href="unit.html?grade=${gradeId}&unit=${prevUnit.code}" class="unit-nav-link prev">
                <span class="unit-nav-arrow">← Previous</span>
                <span class="unit-nav-name">${prevUnit.code.toUpperCase().replace('-', ' ')}: ${prevUnit.name}</span>
            </a>
        `;
    }

    if (nextUnit) {
        html += `
            <a href="unit.html?grade=${gradeId}&unit=${nextUnit.code}" class="unit-nav-link next">
                <span class="unit-nav-arrow">Next →</span>
                <span class="unit-nav-name">${nextUnit.code.toUpperCase().replace('-', ' ')}: ${nextUnit.name}</span>
            </a>
        `;
    }

    // Back to grade hub link
    const gradeInfo = window.Taxonomy.grades[gradeId];
    const levelFolder = gradeInfo ? gradeInfo.level : 'primary';
    html += `
        <a href="${levelFolder}/${gradeId}.html" class="unit-nav-link back">
            <span class="unit-nav-arrow">↩ Back to Grade Hub</span>
            <span class="unit-nav-name">${gradeInfo ? gradeInfo.name : gradeId} Portal</span>
        </a>
    `;

    html += '</div>';
    container.innerHTML = html;
}
