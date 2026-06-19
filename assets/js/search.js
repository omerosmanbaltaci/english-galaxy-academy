/* ==========================================================================
   English Galaxy Academy - Instant Client-Side Faceted Search Engine
   ========================================================================== */

let searchIndex = [];
let debounceTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
});

function initSearch() {
    const searchInput = document.getElementById('search-input-field');
    const resultsContainer = document.getElementById('search-results-grid');
    const filterForm = document.getElementById('filter-form');

    if (!resultsContainer) return;

    // Load search index JSON
    fetch('/api/lessons')
        .then(response => {
            if (!response.ok) {
                throw new Error('Search index not generated yet.');
            }
            return response.json();
        })
        .then(data => {
            searchIndex = data;
            
            // Sync URL parameters with UI controls
            parseURLParamsToFilters();
            
            // Execute initial search
            executeSearch();

            // Bind real-time input event with slight debounce
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    clearTimeout(debounceTimeout);
                    debounceTimeout = setTimeout(executeSearch, 150);
                });
            }

            // Bind change events to all filter controls
            if (filterForm) {
                filterForm.addEventListener('change', executeSearch);
            }
        })
        .catch(err => {
            console.error('Failed to load search index:', err);
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3 class="empty-state-title">Search Index Not Ready</h3>
                    <p class="empty-state-desc">The search system is preparing index files. Please execute <code>npm run index</code> in your environment.</p>
                </div>
            `;
        });
}

function parseURLParamsToFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const level = urlParams.get('level');
    const grade = urlParams.get('grade');
    const contentType = urlParams.get('type');
    const difficulty = urlParams.get('difficulty');

    const searchInput = document.getElementById('search-input-field');
    if (query && searchInput) {
        searchInput.value = query;
    }

    // Tick checkboxes corresponding to URL parameters
    checkFilterCheckbox('level', level);
    checkFilterCheckbox('grade', grade);
    checkFilterCheckbox('type', contentType);
    checkFilterCheckbox('difficulty', difficulty);
}

function checkFilterCheckbox(name, value) {
    if (!value) return;
    const checkbox = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (checkbox) {
        checkbox.checked = true;
    }
}

function executeSearch() {
    const searchInput = document.getElementById('search-input-field');
    const resultsContainer = document.getElementById('search-results-grid');
    
    if (!resultsContainer) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Get checked values from checkboxes
    const selectedLevels = getCheckedValues('level');
    const selectedGrades = getCheckedValues('grade');
    const selectedTypes = getCheckedValues('type');
    const selectedDifficulties = getCheckedValues('difficulty');

    // Filter index data
    const filteredResults = searchIndex.filter(item => {
        const itemType = item.resource_type || item.resourceType || '';

        // 1. Text Query Match (Title, Description, Tags, Content Body)
        if (query) {
            const matchTitle = item.title.toLowerCase().includes(query);
            const matchDesc = item.description.toLowerCase().includes(query);
            const matchTags = item.tags.some(tag => tag.toLowerCase().includes(query));
            const matchSnippet = item.bodySnippet ? item.bodySnippet.toLowerCase().includes(query) : false;
            
            if (!matchTitle && !matchDesc && !matchTags && !matchSnippet) {
                return false;
            }
        }

        // 2. Faceted Level Filter
        if (selectedLevels.length > 0 && !selectedLevels.includes(item.level)) {
            return false;
        }

        // 3. Faceted Grade Filter
        if (selectedGrades.length > 0 && !selectedGrades.includes(item.grade)) {
            return false;
        }

        // 4. Faceted Content Type Filter
        if (selectedTypes.length > 0 && !selectedTypes.includes(itemType)) {
            return false;
        }

        // 5. Faceted Difficulty Filter
        if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(item.difficulty)) {
            return false;
        }

        return true;
    });

    renderResults(resultsContainer, filteredResults);
}

function getCheckedValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function renderResults(container, results) {
    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">🔍</div>
                <h3 class="empty-state-title" data-i18n="search_no_results_title">No Resources Found</h3>
                <p class="empty-state-desc" data-i18n="search_no_results_desc">Try adjusting your keyword query or removing some facet filters.</p>
            </div>
        `;
        if (window.applyTranslations) window.applyTranslations();
        return;
    }

    let cardsHTML = '';
    results.forEach(item => {
        const itemType = item.resource_type || item.resourceType || 'resource';
        cardsHTML += `
            <div class="card">
                <div class="card-content">
                    <div class="card-tags">
                        <span class="badge" style="background-color: var(--primary); font-size: 0.65rem;" data-i18n="badge_${itemType.replace('-', '_')}">${itemType}</span>
                        ${item.grade ? `<span class="badge" style="background-color: var(--accent); font-size: 0.65rem;" data-i18n="badge_${item.grade.replace('-', '_')}">${item.grade.replace('-', ' ')}</span>` : ''}
                        ${item.difficulty ? `<span class="badge" style="background-color: var(--success); font-size: 0.65rem;" data-i18n="badge_${item.difficulty.replace('-', '_')}">${item.difficulty}</span>` : ''}
                    </div>
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-desc">${item.description}</p>
                    
                    <div class="card-metadata">
                        <span>${item.pdfAvailable ? '📄 PDF Available' : '💻 Online Only'}</span>
                        <span>${item.audioAvailable ? '🔊 Audio' : ''}</span>
                    </div>

                    <a href="viewer.html?id=${item.id}" class="btn btn-primary" style="margin-top: var(--space-md); width: 100%; min-height: 38px; font-size: 0.9rem; padding: 8px 16px;" data-i18n="btn_enter">
                        Start Learning
                    </a>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHTML;
    if (window.applyTranslations) window.applyTranslations();
}
