/* ==========================================================================
   English Galaxy Academy - Global JavaScript (Theme, Navbar, Layout Injection)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Management (Light / Dark Mode)
    initTheme();

    // 2. Inject Shared Layouts (Header & Footer)
    injectHeader();
    injectFooter();

    // 3. Setup Navigation & Interactivity
    setupNavigation();

    // 4. Inject Lucide SVG Icons
    const lucideScript = document.createElement('script');
    lucideScript.src = 'https://unpkg.com/lucide@latest';
    lucideScript.onload = () => lucide.createIcons();
    document.body.appendChild(lucideScript);

    // 4.5 Initialize Scripts globally (i18n & Command Palette)
    const scriptsToLoad = [
        getPathPrefix() + 'assets/js/i18n.js'
    ];
    
    scriptsToLoad.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
            if (src.includes('i18n.js') && typeof applyTranslations === 'function') {
                applyTranslations();
            }
        };
        document.body.appendChild(s);
    });

    // 5. Initialize Micro-Interactions (Progress Bar, Scroll Animations, Back to Top)
    initMicroInteractions();

    // 6. Ultra Premium Features (PWA, Cursor, Spotlight, Transitions)
    initUltraPremiumFeatures();
});

// Helper to determine relative path prefix for subdirectory files
function getPathPrefix() {
    const pathname = window.location.pathname;
    // Checks if the file is located inside one of our subfolders
    if (pathname.includes('/primary/') || pathname.includes('/middle-school/') || pathname.includes('/high-school/')) {
        return '../';
    }
    return './';
}

// Theme Management Logic
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const currentTheme = localStorage.getItem('theme');
    
    // Check local storage or system preference
    if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
        updateThemeToggleIcon(true);
    } else {
        document.body.classList.remove('dark-theme');
        updateThemeToggleIcon(false);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeToggleIcon(isDark);
}

function updateThemeToggleIcon(isDark) {
    const iconSpan = document.querySelector('#theme-toggle-btn i');
    if (iconSpan) {
        iconSpan.innerHTML = isDark 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' 
            : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    }
}

// Inject Shared Header Navigation
function injectHeader() {
    const headerWrapper = document.getElementById('header-wrapper');
    if (!headerWrapper) return;

    const prefix = getPathPrefix();
    const pathname = window.location.pathname;
    const pageName = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';

    headerWrapper.innerHTML = `
        <!-- Drawer Overlay and Sidebar -->
        <div class="drawer-overlay" id="drawer-overlay"></div>
        <div class="sidebar-drawer" id="sidebar-drawer">
            <div class="drawer-header">
                <a href="${prefix}index.html" class="logo">
                    <img src="${prefix}assets/images/logo_small.png" alt="English Galaxy Academy Logo" style="height: 48px; width: auto; max-height: 100%;">
                </a>
            </div>
            <nav>
                <ul class="nav-menu" id="nav-menu">
                    <li><a href="${prefix}index.html" class="nav-link ${pageName === 'index.html' ? 'active' : ''}"><div class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div><span data-i18n="nav_home">Home</span></a></li>
                    <li class="nav-item-dropdown">
                        <a href="${prefix}primary.html" class="nav-link ${pageName === 'primary.html' || pathname.includes('/primary/') ? 'active' : ''}"><div class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 2h8"></path><circle cx="12" cy="11" r="3"></circle></svg></div><span data-i18n="nav_primary">Primary School</span></a>
                        <ul class="nav-submenu">
                            <li><a href="${prefix}primary/grade-2.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_2">Grade 2</span></a></li>
                            <li><a href="${prefix}primary/grade-3.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_3">Grade 3</span></a></li>
                            <li><a href="${prefix}primary/grade-4.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_4">Grade 4</span></a></li>
                        </ul>
                    </li>
                    <li class="nav-item-dropdown">
                        <a href="${prefix}middle-school.html" class="nav-link ${pageName === 'middle-school.html' || pathname.includes('/middle-school/') ? 'active' : ''}"><div class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></div><span data-i18n="nav_middle">Middle School</span></a>
                        <ul class="nav-submenu">
                            <li><a href="${prefix}middle-school/grade-5.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_5">Grade 5</span></a></li>
                            <li><a href="${prefix}middle-school/grade-6.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_6">Grade 6</span></a></li>
                            <li><a href="${prefix}middle-school/grade-7.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_7">Grade 7</span></a></li>
                            <li><a href="${prefix}middle-school/grade-8.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_8">Grade 8</span></a></li>
                        </ul>
                    </li>
                    <li class="nav-item-dropdown">
                        <a href="${prefix}high-school.html" class="nav-link ${pageName === 'high-school.html' || pathname.includes('/high-school/') ? 'active' : ''}"><div class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div><span data-i18n="nav_high">High School</span></a>
                        <ul class="nav-submenu">
                            <li><a href="${prefix}high-school/grade-9.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_9">Grade 9</span></a></li>
                            <li><a href="${prefix}high-school/grade-10.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_10">Grade 10</span></a></li>
                            <li><a href="${prefix}high-school/grade-11.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_11">Grade 11</span></a></li>
                            <li><a href="${prefix}high-school/grade-12.html" style="display:flex; align-items:center;"><div class="nav-icon-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg></div><span data-i18n="grade_12">Grade 12</span></a></li>
                        </ul>
                    </li>
                    <li><a href="${prefix}independent-learning.html" class="nav-link ${pageName === 'independent-learning.html' ? 'active' : ''}"><div class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg></div><span data-i18n="nav_independent">Independent Learning</span></a></li>
                </ul>
            </nav>
        </div>

        <header>
            <div class="header-container">
                <div style="display: flex; align-items: center;">
                    <button class="hamburger" id="hamburger-btn" aria-label="Open Navigation">☰</button>
                    <a href="${prefix}index.html" class="logo">
                        <img src="${prefix}assets/images/logo_small.png" alt="English Galaxy Academy Logo" style="height: 56px; width: auto; max-height: 100%;">
                    </a>
                </div>
                
                <div class="header-actions">
                    <div class="nav-search-container" id="nav-search-container">
                        <input type="text" class="nav-search-input" id="nav-search-input" placeholder="Search..." aria-label="Search" onkeypress="if(event.key === 'Enter') window.location.href = '${prefix}search.html?q=' + encodeURIComponent(this.value)">
                        <button class="nav-search-btn" id="nav-search-btn" aria-label="Toggle Search">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </button>
                    </div>
                    <div class="lang-toggle-pill" id="lang-toggle-btn" onclick="toggleLanguage()">
                        <div class="lang-toggle-indicator"></div>
                        <span class="lang-opt tr">TR</span>
                        <span class="lang-opt en">EN</span>
                    </div>
                    <a href="${prefix}teachers.html" class="btn btn-primary" style="min-height: 40px; padding: 0 16px; display: flex; align-items: center; gap: 8px; font-size: 0.9rem;" title="Teacher Portal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <span style="display: inline-block;" data-i18n="hero_btn_teacher">Teacher Portal</span>
                    </a>
                    <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle Theme">
                        <i><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></i>
                    </button>
                </div>
            </div>
        </header>
    `;
    
    // Bind click event to theme toggle button
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    initTheme(); // Re-sync icon

    // Setup expandable search bar logic
    const searchContainer = document.getElementById('nav-search-container');
    const searchInput = document.getElementById('nav-search-input');
    const searchBtn = document.getElementById('nav-search-btn');

    if (searchBtn && searchInput && searchContainer) {
        searchBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent document click
            if (searchContainer.classList.contains('expanded')) {
                // If it's expanded and input has value, search. Otherwise close.
                if (searchInput.value.trim() !== '') {
                    window.location.href = getPathPrefix() + 'search.html?q=' + encodeURIComponent(searchInput.value.trim());
                } else {
                    searchContainer.classList.remove('expanded');
                }
            } else {
                searchContainer.classList.add('expanded');
                searchInput.focus();
            }
        });

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target) && searchContainer.classList.contains('expanded')) {
                searchContainer.classList.remove('expanded');
            }
        });
    }
}

// Inject Shared Footer
function injectFooter() {
    const footerWrapper = document.getElementById('footer-wrapper');
    if (!footerWrapper) return;

    const prefix = getPathPrefix();

    footerWrapper.innerHTML = `
        <footer>
            <div class="container">
                <div class="footer-grid">
                    <div>
                        <a href="${prefix}index.html" class="logo" style="margin-bottom: var(--space-sm);">
                            <img src="${prefix}assets/images/logo_small.png" alt="English Galaxy Academy Logo" style="height: 48px; width: auto; max-height: 100%;">
                        </a>
                        <p class="footer-logo-desc" data-i18n="footer_desc">Comprehensive English learning platform supporting learners from primary school to advanced levels with MEB curriculum integration.</p>
                    </div>
                    <div>
                        <h4 class="footer-column-title" data-i18n="footer_school_sections">School Sections</h4>
                        <ul class="footer-links">
                            <li><a href="${prefix}primary.html" class="footer-link" data-i18n="footer_primary">Primary School (Grades 2-4)</a></li>
                            <li><a href="${prefix}middle-school.html" class="footer-link" data-i18n="footer_middle">Middle School (Grades 5-8)</a></li>
                            <li><a href="${prefix}high-school.html" class="footer-link" data-i18n="footer_high">High School (Grades 9-12)</a></li>
                            <li><a href="${prefix}teachers.html" class="footer-link" style="color: var(--accent);" data-i18n="hero_btn_teacher">Teacher Portal</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="footer-column-title" data-i18n="footer_general_english">General English</h4>
                        <ul class="footer-links">
                            <li><a href="${prefix}independent-learning.html" class="footer-link" data-i18n="footer_a1">A1 Beginner</a></li>
                            <li><a href="${prefix}independent-learning.html" class="footer-link" data-i18n="footer_a2">A2 Elementary</a></li>
                            <li><a href="${prefix}independent-learning.html" class="footer-link" data-i18n="footer_b1">B1 Intermediate</a></li>
                            <li><a href="${prefix}independent-learning.html" class="footer-link" data-i18n="footer_b2">B2 Upper-Intermediate</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="footer-column-title" data-i18n="footer_legal">Legal</h4>
                        <ul class="footer-links">
                            <li><a href="#" class="footer-link" data-i18n="footer_terms">Terms of Service</a></li>
                            <li><a href="#" class="footer-link" data-i18n="footer_privacy">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <p>&copy; 2026 English Galaxy Academy. <span data-i18n="footer_rights">All rights reserved.</span></p>
                    <p>Designed for MEB English Curriculum support</p>
                </div>
            </div>
        </footer>
    `;
}

// Setup Hamburger Menu & Dynamic Interactivity
function setupNavigation() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('close-drawer-btn');
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('sidebar-drawer');

    function toggleDrawer() {
        if (drawer) drawer.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleDrawer);
        hamburgerBtn.addEventListener('mouseenter', () => {
            if (drawer && !drawer.classList.contains('open')) {
                toggleDrawer();
            }
        });
    }
    
    if (drawer) {
        drawer.addEventListener('mouseleave', () => {
            if (drawer.classList.contains('open')) {
                toggleDrawer();
            }
        });
    }

    if (overlay) overlay.addEventListener('click', toggleDrawer);
}

// ==========================================================================
// Micro-Interactions Initialization
// ==========================================================================
function initMicroInteractions() {
    // 1. Inject UI Elements
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress-bar';
    document.body.appendChild(progressBar);

    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
    backToTopBtn.title = 'Back to Top';
    backToTopBtn.setAttribute('aria-label', 'Back to Top');
    document.body.appendChild(backToTopBtn);

    // 2. Add 'animate-on-scroll' class to key elements
    const elementsToAnimate = document.querySelectorAll('.card, .pathway-card, .section, .interactive-wrapper');
    elementsToAnimate.forEach(el => el.classList.add('animate-on-scroll'));

    // 3. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => scrollObserver.observe(el));

    // 4. Scroll Event Listeners (Progress Bar & Back to Top)
    window.addEventListener('scroll', () => {
        // Progress Bar Calculation
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
        
        if (progressBar) {
            progressBar.style.width = scrolled + '%';
        }

        // Back to Top Button Visibility
        if (scrollTop > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // 5. Back to Top Click Handler
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==========================================================================
// Ultra Premium Features
// ==========================================================================
function initUltraPremiumFeatures() {
    // 1. PWA Manifest Injection & Service Worker Registration
    const prefix = getPathPrefix();
    if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = prefix + 'manifest.json';
        document.head.appendChild(manifestLink);
    }
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(prefix + 'sw.js').catch(err => console.log('SW registration failed: ', err));
        });
    }

    // 3. Spotlight & Magnetic Effects
    document.querySelectorAll('.card, .pathway-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', x + 'px');
            card.style.setProperty('--mouse-y', y + 'px');
        });
    });

    // 4. Click Sparkles (Particles)
    document.addEventListener('click', e => {
        for(let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = e.clientX + 'px';
            sparkle.style.top = e.clientY + 'px';
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50 + 20;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            sparkle.style.setProperty('--tx', tx + 'px');
            sparkle.style.setProperty('--ty', ty + 'px');
            
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 600);
        }
    });

    // 5. Intercept links for View Transitions
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            // Only intercept local links that don't have target="_blank"
            if (href && !href.startsWith('http') && !href.startsWith('#') && link.target !== '_blank') {
                if (!document.startViewTransition) return; // Fallback to normal navigation
                
                e.preventDefault();
                document.startViewTransition(() => {
                    window.location.href = href;
                });
            }
        });
    });

    // 6. Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // 7. Animated Counters (Stats Strip)
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-target'));
                    const duration = 2000; // 2 seconds
                    const step = target / (duration / 16); // 60fps
                    let current = 0;

                    const updateCounter = () => {
                        current += step;
                        let displayValue = current < target ? Math.ceil(current) : target;
                        let textStr = displayValue.toLocaleString();
                        
                        if (current >= target && target >= 500) {
                            textStr += '+';
                        }
                        
                        if (entry.target.hasAttribute('data-percent')) {
                            const lang = localStorage.getItem('site_lang') || 'en';
                            if (lang === 'tr') {
                                textStr = '%' + textStr;
                            } else {
                                textStr = textStr + '%';
                            }
                        }
                        
                        entry.target.innerText = textStr;

                        if (current < target) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            // Already reached target
                        }
                    };
                    
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(el => statsObserver.observe(el));
    }
}
