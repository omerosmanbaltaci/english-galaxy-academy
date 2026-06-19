/* ==========================================================================
   English Galaxy Academy - Standardized Markdown Content Fetcher & Renderer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initContentLoader();
});

function initContentLoader() {
    const urlParams = new URLSearchParams(window.location.search);
    const contentSrc = urlParams.get('src');
    const contentId = urlParams.get('id');
    
    const container = document.getElementById('viewer-content');
    const headerContainer = document.getElementById('viewer-header-wrapper');
    const breadcrumbContainer = document.getElementById('breadcrumbs-list');

    if (!contentSrc && !contentId) {
        renderEmptyState(container, 'No Content Source Specified', 'Please choose a lesson or worksheet from the menus to start learning.');
        return;
    }

    if (contentId) {
        // Show Skeleton Loader while fetching
        container.innerHTML = `
            <div class="markdown-body">
                <div class="skeleton" style="width: 60%; height: 40px; margin-bottom: 20px;"></div>
                <div class="skeleton" style="width: 100%; height: 20px; margin-bottom: 10px;"></div>
                <div class="skeleton" style="width: 90%; height: 20px; margin-bottom: 10px;"></div>
                <div class="skeleton" style="width: 95%; height: 20px; margin-bottom: 20px;"></div>
                <div class="skeleton" style="width: 40%; height: 200px; border-radius: 8px;"></div>
            </div>
        `;

        // Fetch from API
        fetch(`/api/lessons/${contentId}`)
            .then(res => {
                if (!res.ok) throw new Error('Lesson not found in database');
                return res.json();
            })
            .then(data => {
                const meta = {
                    title: data.title,
                    description: data.description,
                    grade: data.grade,
                    unit: data.unit,
                    resource_type: data.resourceType,
                    difficulty: data.difficulty,
                    skills: data.skills,
                    learning_outcomes: data.learningOutcomes,
                    vocabulary: data.vocabulary,
                    tags: data.tags,
                    author: data.author,
                    pdf: {
                        student: data.pdfStudent,
                        teacher: data.pdfTeacher,
                        answer_key: data.pdfAnswerKey
                    },
                    audio: data.audioUrl,
                    video: data.videoUrl
                };

                renderMetadata(headerContainer, breadcrumbContainer, meta, `content/${data.grade}/${data.unit}`);
                
                if (window.marked) {
                    container.innerHTML = `<div class="markdown-body">${window.marked.parse(data.contentBody || '')}</div>`;
                } else {
                    container.innerHTML = `<div class="markdown-body" style="white-space: pre-wrap;">${data.contentBody || ''}</div>`;
                }

                if (data.interactiveData && Array.isArray(data.interactiveData) && data.interactiveData.length > 0) {
                    renderInteractiveExercises(container, data.interactiveData);
                }

                renderMediaPlayers(container, meta);
                renderDownloadPanel(container, meta);

                // EXAM FOCUS MODE for Interactive Reading
                if (data.resourceType === 'Interactive Reading') {
                    document.body.classList.add('exam-focus-mode');
                    const style = document.createElement('style');
                    style.innerHTML = `
                        body.exam-focus-mode {
                            background: rgba(15, 23, 42, 0.95);
                            padding: var(--space-xl) 0;
                        }
                        body.exam-focus-mode #header-wrapper,
                        body.exam-focus-mode #footer-wrapper,
                        body.exam-focus-mode #breadcrumbs-list,
                        body.exam-focus-mode #viewer-header-wrapper,
                        body.exam-focus-mode #related-resources-wrapper {
                            display: none !important;
                        }
                        body.exam-focus-mode .main-content {
                            background: var(--bg-main);
                            max-width: 800px;
                            margin: 0 auto;
                            padding: var(--space-xl);
                            border-radius: var(--radius-lg);
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                            position: relative;
                            z-index: 100;
                        }
                        body.exam-focus-mode .sidebar-layout {
                            display: block;
                        }
                        .exam-close-btn {
                            position: absolute;
                            top: 16px;
                            right: 16px;
                            background: var(--error);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            font-size: 1.2rem;
                            line-height: 1;
                            z-index: 101;
                            transition: background 0.2s;
                        }
                        .exam-close-btn:hover {
                            background: #b91c1c;
                        }
                    `;
                    document.head.appendChild(style);

                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'exam-close-btn';
                    closeBtn.innerHTML = '&times;';
                    closeBtn.title = 'Sınav Modundan Çık (Geri Dön)';
                    closeBtn.onclick = () => window.history.back();
                    document.querySelector('.main-content').appendChild(closeBtn);
                }
                
                // Highlight JS Initialization (if any code blocks)
                if (window.hljs) {
                    document.querySelectorAll('pre code').forEach((block) => {
                        window.hljs.highlightElement(block);
                    });
                }
                
                if (window.applyTranslations) window.applyTranslations();
            })
            .catch(err => {
                console.error(err);
                renderEmptyState(container, 'Content Delivery Error', 'The requested resource could not be loaded from our servers.');
            });

    } else if (contentSrc) {
        // Load Markdown file (Legacy behavior)
        fetch(contentSrc)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load content file: ${contentSrc}`);
                }
                return response.text();
            })
            .then(text => {
                const { attributes, body } = parseYAMLFrontMatter(text);
                
                // Render title, SEO elements, metadata
                renderMetadata(headerContainer, breadcrumbContainer, attributes, contentSrc);
                
                // Compile markdown body using marked
                if (window.marked) {
                    container.innerHTML = `<div class="markdown-body">${window.marked.parse(body)}</div>`;
                } else {
                    container.innerHTML = `<div class="markdown-body" style="white-space: pre-wrap;">${body}</div>`;
                    console.warn('marked.js not loaded. Falling back to plain text.');
                }

                // Render Multimedia components (Audio & Video)
                renderMediaPlayers(container, attributes);

                // Render PDF Drawer & Extras (Student, Teacher, Answer Key)
                renderDownloadPanel(container, attributes);

                // Fetch and render related content suggestions
                renderRelatedContent(attributes, contentSrc);
            })
            .catch(err => {
                console.error(err);
                renderEmptyState(container, 'Content File Not Found', `The requested file could not be loaded. Please verify that the path is correct: <br><code>${contentSrc}</code>`);
            });
    }
}

// Custom frontmatter parser supporting bullet lists and objects
function parseYAMLFrontMatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
        return { attributes: {}, body: text };
    }
    const fm = match[1];
    const body = text.slice(match[0].length);
    const attributes = {};
    
    const lines = fm.split(/\r?\n/);
    let currentParent = null;
    
    lines.forEach(line => {
        const isIndented = line.startsWith('  ') || line.startsWith('\t');
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        
        if (isIndented && currentParent) {
            const idx = trimmed.indexOf(':');
            if (idx !== -1) {
                const subKey = trimmed.slice(0, idx).trim();
                let subVal = trimmed.slice(idx + 1).trim();
                if ((subVal.startsWith('"') && subVal.endsWith('"')) || (subVal.startsWith("'") && subVal.endsWith("'"))) {
                    subVal = subVal.slice(1, -1);
                }
                if (!attributes[currentParent]) attributes[currentParent] = {};
                attributes[currentParent][subKey] = subVal;
            } else if (trimmed.startsWith('-')) {
                const subVal = trimmed.slice(1).trim().replace(/^['"]|['"]$/g, '');
                if (!attributes[currentParent]) attributes[currentParent] = [];
                if (Array.isArray(attributes[currentParent])) {
                    attributes[currentParent].push(subVal);
                }
            }
        } else {
            currentParent = null;
            const idx = line.indexOf(':');
            if (idx !== -1) {
                const key = line.slice(0, idx).trim();
                let val = line.slice(idx + 1).trim();
                
                if (val === '') {
                    currentParent = key;
                } else {
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    if (val.startsWith('[') && val.endsWith(']')) {
                        val = val.slice(1, -1).split(',').map(item => item.trim().replace(/^['"]|['"]$/g, ''));
                    }
                    attributes[key] = val;
                }
            }
        }
    });
    
    return { attributes, body };
}

// Render dynamic breadcrumbs and page metadata
function renderMetadata(headerEl, breadcrumbEl, meta, srcPath) {
    const title = meta.title || 'Untitled Resource';
    document.title = `${title} | English Galaxy Academy`;

    // Dynamic Breadcrumbs construction
    const pathParts = srcPath.replace('content/', '').replace('.md', '').split('/');
    let breadcrumbHTML = `<li class="breadcrumb-item"><a href="index.html">Home</a></li>`;
    
    let currentLink = '';
    pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        const cleanName = part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        if (isLast) {
            breadcrumbHTML += `
                <li class="breadcrumb-separator">></li>
                <li class="breadcrumb-item active">${meta.title || cleanName}</li>
            `;
        } else {
            let targetPage = 'index.html';
            if (part === 'primary') targetPage = 'primary.html';
            else if (part === 'middle-school') targetPage = 'middle-school.html';
            else if (part === 'high-school') targetPage = 'high-school.html';
            else if (part === 'independent-learning') targetPage = 'independent-learning.html';
            else if (part === 'resources') targetPage = 'resources.html';
            else if (part === 'blog') targetPage = 'blog.html';
            else targetPage = `search.html?level=${pathParts[0]}&grade=${part}`;
            
            breadcrumbHTML += `
                <li class="breadcrumb-separator">></li>
                <li class="breadcrumb-item"><a href="${targetPage}">${cleanName}</a></li>
            `;
        }
    });
    breadcrumbEl.innerHTML = breadcrumbHTML;

    // Standardize mapping for resource_type
    const resourceType = meta.resource_type || meta.contentType || 'resource';

    // Renders meta structure
    headerEl.innerHTML = `
        <h1 style="margin-bottom: var(--space-xs);">${title}</h1>
        <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: var(--space-md);">${meta.description || ''}</p>
        
        <div class="viewer-meta-grid">
            ${meta.grade ? `<span class="badge" style="background-color: var(--primary);">${meta.grade.replace('-', ' ')}</span>` : ''}
            ${meta.unit ? `<span class="badge" style="background-color: var(--accent);">${meta.unit.replace('-', ' ')}</span>` : ''}
            <span class="badge" style="background-color: var(--success);">${resourceType}</span>
            ${meta.difficulty ? `<div class="viewer-meta-item"><i data-lucide="bar-chart" style="width:14px; margin-right:4px;"></i> CEFR Level: <strong>${meta.difficulty}</strong></div>` : ''}
            ${meta.estimatedReadingTime ? `<div class="viewer-meta-item"><i data-lucide="clock" style="width:14px; margin-right:4px;"></i> Reading Time: <strong>${meta.estimatedReadingTime}</strong></div>` : ''}
            ${meta.author ? `<div class="viewer-meta-item"><i data-lucide="pen-tool" style="width:14px; margin-right:4px;"></i> Author: <strong>${meta.author}</strong></div>` : ''}
            ${meta.version ? `<div class="viewer-meta-item"><i data-lucide="tag" style="width:14px; margin-right:4px;"></i> Version: <strong>${meta.version}</strong></div>` : ''}
        </div>

        <!-- Skills list mapping -->
        ${meta.skills && meta.skills.length > 0 ? `
            <div style="margin-top: var(--space-md); display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); display:flex; align-items:center;"><i data-lucide="target" style="width:14px; margin-right:4px;"></i> Focus Skills:</span>
                ${meta.skills.map(s => `<span class="badge" style="background-color: #64748b; font-size: 0.7rem; text-transform: uppercase;">${s}</span>`).join(' ')}
            </div>
        ` : ''}

        <!-- Learning outcomes mapping -->
        ${meta.learningOutcomes && meta.learningOutcomes.length > 0 ? `
            <div style="margin-top: var(--space-sm); font-size: 0.85rem; border-left: 3px solid var(--secondary); padding-left: var(--space-sm);">
                <span style="font-weight: 600; color: var(--text-muted); display: flex; align-items: center; margin-bottom: 2px;"><i data-lucide="graduation-cap" style="width:14px; margin-right:4px;"></i> MEB Learning Outcomes:</span>
                <ul style="list-style: none; margin-bottom: 0; padding-left: 0;">
                    ${meta.learning_outcomes.map(out => {
                        const parts = out.split(':');
                        if (parts.length > 1 && parts[0].trim().match(/^E\d+\.\d+\.LO\d+$/)) {
                            return `<li style="margin-bottom: 4px; color: var(--text-muted);"><strong>${parts[0].trim()}</strong>:${parts.slice(1).join(':')}</li>`;
                        }
                        return `<li style="margin-bottom: 2px; color: var(--text-muted);">${out}</li>`;
                    }).join('')}
                </ul>
            </div>
        ` : ''}

        <!-- Vocabulary mapping -->
        ${meta.vocabulary && meta.vocabulary.length > 0 ? `
            <div style="margin-top: var(--space-md); display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); display:flex; align-items:center;"><i data-lucide="key" style="width:14px; margin-right:4px;"></i> Target Words:</span>
                ${meta.vocabulary.map(v => `<span class="tag" style="background-color: var(--bg-surface); border-color: var(--border-color);">${v}</span>`).join(' ')}
            </div>
        ` : ''}
    `;
}

function renderMediaPlayers(container, meta) {
    // 1. Audio player
    if (meta.audioUrl) {
        const audioDiv = document.createElement('div');
        audioDiv.className = 'audio-player-container';
        audioDiv.style.cssText = 'margin: var(--space-lg) 0; padding: var(--space-md); border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-surface);';
        audioDiv.innerHTML = `
            <label style="font-weight: 700; font-family: var(--font-primary); display: flex; align-items: center; gap: var(--space-xs); margin-bottom: var(--space-sm); font-size: 0.95rem;">
                <i data-lucide="volume-2" style="width:18px;"></i> Listening Resource Player
            </label>
            <audio controls style="width: 100%; outline: none;">
                <source src="${meta.audioUrl}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
        `;
        container.insertBefore(audioDiv, container.firstChild);
    }

    // 2. Video player
    const videoSource = meta.videoUrl || meta.video;
    if (videoSource) {
        const videoDiv = document.createElement('div');
        videoDiv.className = 'video-player-container';
        videoDiv.style.cssText = 'margin: var(--space-lg) 0; padding: var(--space-md); border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-surface);';
        
        let isYouTube = videoSource.includes('youtube.com') || videoSource.includes('youtu.be');
        let embedHtml = '';
        
        if (isYouTube) {
            let videoId = '';
            try {
                if (videoSource.includes('youtu.be/')) {
                    videoId = videoSource.split('youtu.be/')[1].split('?')[0];
                } else if (videoSource.includes('watch?v=')) {
                    videoId = new URL(videoSource).searchParams.get('v');
                } else if (videoSource.includes('embed/')) {
                    videoId = videoSource.split('embed/')[1].split('?')[0];
                }
            } catch(e) { console.error("Could not parse YouTube URL", e); }
            
            embedHtml = `
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
                    <iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0; border-radius: var(--radius-sm);" allowfullscreen></iframe>
                </div>
            `;
        } else {
            embedHtml = `
                <video controls style="width: 100%; border-radius: var(--radius-sm); outline: none; background-color: #000;">
                    <source src="${videoSource}" type="video/mp4">
                    Your browser does not support the video element.
                </video>
            `;
        }

        videoDiv.innerHTML = `
            <label style="font-weight: 700; font-family: var(--font-primary); display: flex; align-items: center; gap: var(--space-xs); margin-bottom: var(--space-sm); font-size: 0.95rem;">
                <i data-lucide="video" style="width:18px;"></i> ${isYouTube ? 'YouTube Video Lesson' : 'Video Lesson Player'}
            </label>
            ${embedHtml}
        `;
        container.insertBefore(videoDiv, container.firstChild);
    }
}

// PDF download drawer rendering (supporting Student, Teacher, and Answer Key PDFs)
function renderDownloadPanel(container, meta) {
    const pdf = meta.pdf || {};
    
    // Check if any PDF link is present
    if (pdf.student || pdf.teacher || pdf.answer_key || meta.pdfUrl) {
        const div = document.createElement('div');
        div.className = 'pdf-download-panel';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'stretch';
        div.style.gap = 'var(--space-md)';

        // Helper to generate buttons for a given file URL and label
        const getActionButtons = (url, label, btnClass) => `
            <div style="display: flex; gap: var(--space-xs); margin-bottom: var(--space-xs);">
                <button class="btn ${btnClass}" style="flex: 1; padding: 6px 10px; font-size: 0.85rem;" onclick="openDocumentPreview('${url}', '${label}')"><i data-lucide="eye" style="width:14px; margin-right:4px;"></i> Önizleme</button>
                <a href="${url}" download class="btn btn-outline" style="padding: 6px 10px; font-size: 0.85rem; border-color: ${btnClass === 'btn-primary' ? 'var(--primary)' : 'var(--text-main)'};"><i data-lucide="download" style="width:14px; margin-right:4px;"></i> İndir</a>
            </div>
        `;

        let buttonsHTML = '';
        if (pdf.student) {
            buttonsHTML += `
                <div>
                    <h5 style="margin-bottom: 4px; font-size: 0.9rem;">Student Material</h5>
                    ${getActionButtons(pdf.student, 'Student Material', 'btn-primary')}
                </div>
            `;
        }
        if (pdf.teacher) {
            buttonsHTML += `
                <div>
                    <h5 style="margin-bottom: 4px; font-size: 0.9rem;">Teacher Material</h5>
                    ${getActionButtons(pdf.teacher, 'Teacher Material', 'btn-accent')}
                </div>
            `;
        }
        if (pdf.answer_key) {
            buttonsHTML += `
                <div>
                    <h5 style="margin-bottom: 4px; font-size: 0.9rem;">Answer Key</h5>
                    ${getActionButtons(pdf.answer_key, 'Answer Key', 'btn-outline')}
                </div>
            `;
        }

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap;">
                <span class="pdf-icon"><i data-lucide="file-text" style="width:32px; height:32px; color:var(--primary);"></i></span>
                <div style="flex-grow: 1;">
                    <h4 style="margin-bottom: var(--space-xs);">Attached Documents</h4>
                    <p style="margin-bottom: 0; font-size: 0.9rem; color: var(--text-muted);">Preview or download the attached lesson materials.</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-md); margin-top: var(--space-sm);">
                ${buttonsHTML}
            </div>
        `;
        container.appendChild(div);
    }
}

// Global function to open document preview modal
window.openDocumentPreview = function(url, title) {
    if (!url) return;
    
    let isPdf = url.toLowerCase().endsWith('.pdf');
    let viewerUrl = url;
    
    if (url.includes('drive.google.com')) {
        // Force the Google Drive URL to preview mode
        viewerUrl = url.replace(/\/view.*$/, '/preview');
    } else if (!isPdf && url.startsWith('http')) {
        // Attempt Google Docs viewer for Word/Excel if it has an absolute HTTP URL
        viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}`;
    } else if (!isPdf && !url.startsWith('http')) {
        // If it's a local word doc, warn the user
        alert("Word/Excel files require an internet connection and a live public URL to be previewed. Falling back to local download.");
        window.location.href = url;
        return;
    }

    // Open in a new tab
    window.open(viewerUrl, '_blank');
};

// Related content suggestions engine
function renderRelatedContent(meta, currentSrc) {
    const section = document.getElementById('related-resources-wrapper');
    if (!section) return;

    fetch('/api/lessons')
        .then(res => res.json())
        .then(data => {
            const matches = data.filter(item => {
                if (item.id === currentSrc) return false;
                
                let score = 0;
                if (item.grade && item.grade === meta.grade) score += 3;
                if (item.unit && item.unit === meta.unit) score += 4;
                
                const itemType = item.resource_type || item.resourceType;
                const metaType = meta.resource_type || meta.contentType;
                if (itemType && itemType === metaType) score += 1;
                
                if (item.tags && meta.tags) {
                    const sharedTags = item.tags.filter(t => meta.tags.includes(t));
                    score += sharedTags.length * 2;
                }
                
                item.matchScore = score;
                return score > 0;
            });

            // Sort by relevance score
            matches.sort((a, b) => b.matchScore - a.matchScore);
            
            const recommendations = matches.slice(0, 3);
            
            if (recommendations.length === 0) {
                section.style.display = 'none';
                return;
            }

            let cardsHTML = '';
            recommendations.forEach(item => {
                const itemType = item.resource_type || item.resourceType;
                cardsHTML += `
                    <div class="card">
                        <div class="card-content">
                            <div class="card-tags">
                                <span class="badge" style="background-color: var(--primary); font-size: 0.65rem;">${itemType}</span>
                                ${item.grade ? `<span class="badge" style="background-color: var(--accent); font-size: 0.65rem;">${item.grade.replace('-', ' ')}</span>` : ''}
                            </div>
                            <h4 class="card-title" style="font-size: 1.05rem; margin-bottom: var(--space-xs);">${item.title}</h4>
                            <p class="card-desc" style="font-size: 0.85rem; margin-bottom: var(--space-md);">${item.description}</p>
                            <a href="viewer.html?id=${item.id}" class="btn btn-secondary" style="min-height: 36px; font-size: 0.85rem; width: 100%; padding: 6px 12px; margin-top: auto;">
                                View Resource
                            </a>
                        </div>
                    </div>
                `;
            });

            section.innerHTML = `
                <h3 style="margin-bottom: var(--space-md); border-top: 1px solid var(--border-color); padding-top: var(--space-lg);">Related Learning Resources</h3>
                <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
                    ${cardsHTML}
                </div>
            `;
        })
        .catch(err => {
            console.error('Error fetching search index for recommendations:', err);
            section.style.display = 'none';
        });
}

function renderEmptyState(el, title, desc) {
    el.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: var(--space-sm);">⚠️</div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-desc">${desc}</p>
            <a href="search.html" class="btn btn-primary">🔍 Browse All Content</a>
        </div>
    `;
}

/* ==========================================================================
   Interactive Reading Module Renderer
   ========================================================================== */
function renderInteractiveExercises(container, interactiveData) {
    if (!interactiveData || interactiveData.length === 0) return;
    
    // Create interactive section
    const section = document.createElement('div');
    section.className = 'interactive-section';
    section.style.marginTop = 'var(--space-xl)';
    section.style.padding = 'var(--space-md)';
    section.style.background = 'var(--bg-surface)';
    section.style.border = '2px solid var(--border-color)';
    section.style.borderRadius = 'var(--radius-md)';
    
    section.innerHTML = `<h3 style="margin-bottom: var(--space-md); color: var(--primary); display:flex; align-items:center; gap:8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 
        Interactive Exercises
    </h3>`;
    
    const form = document.createElement('form');
    form.id = 'interactive-form';
    
    interactiveData.forEach((q, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.style.marginBottom = 'var(--space-md)';
        qBlock.style.padding = 'var(--space-sm)';
        qBlock.style.borderBottom = '1px solid var(--border-color)';
        
        let qHtml = `<p style="font-weight: 600; margin-bottom: 8px;">${index + 1}. ${q.question}</p>`;
        
        if (q.type === 'tf') {
            qHtml += `
                <div style="display:flex; gap:16px;">
                    <label style="cursor:pointer;"><input type="radio" name="q_${index}" value="True" required> True</label>
                    <label style="cursor:pointer;"><input type="radio" name="q_${index}" value="False" required> False</label>
                </div>
            `;
        } else if (q.type === 'mc' && q.options) {
            qHtml += `<div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">`;
            const letters = ['A', 'B', 'C', 'D'];
            q.options.forEach((opt, optIndex) => {
                if (opt.trim() !== '') {
                    qHtml += `<label style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);"><input type="radio" name="q_${index}" value="${letters[optIndex]}" required> <span><strong>${letters[optIndex]})</strong> ${opt}</span></label>`;
                }
            });
            qHtml += `</div>`;
        } else {
            qHtml += `<input type="text" name="q_${index}" placeholder="Type your answer..." required style="padding: 10px; width: 100%; max-width: 400px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main);">`;
        }
        
        qHtml += `<input type="hidden" class="correct-answer" value="${q.answer}">`;
        
        qBlock.innerHTML = qHtml;
        form.appendChild(qBlock);
    });
    
    form.innerHTML += `
        <div style="margin-top: var(--space-md);">
            <button type="submit" class="btn btn-primary" style="width: 100%; padding:12px; font-size:1.1rem;">Check Answers</button>
        </div>
        <div id="interactive-results" style="margin-top: var(--space-md); font-weight: bold; text-align: center; font-size: 1.3rem;"></div>
    `;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let score = 0;
        const blocks = form.querySelectorAll('.question-block');
        
        blocks.forEach((block, index) => {
            const correctAnswer = block.querySelector('.correct-answer').value.toLowerCase().trim();
            const q = interactiveData[index];
            let userAnswer = '';
            
            if (q.type === 'tf' || q.type === 'mc') {
                const checked = block.querySelector(`input[name="q_${index}"]:checked`);
                if (checked) userAnswer = checked.value.toLowerCase().trim();
            } else {
                const input = block.querySelector(`input[name="q_${index}"]`);
                if (input) userAnswer = input.value.toLowerCase().trim();
            }
            
            // Allow comma-separated multiple valid answers
            const validAnswers = correctAnswer.split(',').map(s => s.trim());
            const isCorrect = validAnswers.includes(userAnswer);
            
            if (isCorrect) {
                score++;
                block.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
                block.style.borderLeft = '4px solid var(--success)';
                let feedback = block.querySelector('.feedback');
                if(feedback) feedback.remove();
            } else {
                block.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                block.style.borderLeft = '4px solid var(--error)';
                
                let feedback = block.querySelector('.feedback');
                if (!feedback) {
                    feedback = document.createElement('p');
                    feedback.className = 'feedback';
                    feedback.style.color = 'var(--error)';
                    feedback.style.marginTop = '8px';
                    feedback.style.fontSize = '0.95rem';
                    block.appendChild(feedback);
                }
                feedback.innerHTML = `Incorrect. Correct answer: <strong>${q.answer}</strong>`;
            }
        });
        
        const resultsDiv = document.getElementById('interactive-results');
        const percentage = Math.round((score / interactiveData.length) * 100);
        
        let modalConfig = {
            color: 'var(--success)',
            bg: 'rgba(16, 185, 129, 0.1)',
            icon: '🏆',
            title: 'Excellent! Well Done!',
            desc: 'Bütün soruları doğru cevapladın. Harika bir iş çıkardın!'
        };
        
        if (percentage < 100 && percentage >= 50) {
            modalConfig = {
                color: '#3b82f6',
                bg: 'rgba(59, 130, 246, 0.1)',
                icon: '🌟',
                title: 'Good Job!',
                desc: `Sadece birkaç hatan var (${score}/${interactiveData.length}). Onları da inceleyerek mükemmel olabilirsin!`
            };
        } else if (percentage < 50) {
            modalConfig = {
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.1)',
                icon: '💡',
                title: 'Keep Going!',
                desc: `Bu konu biraz daha pratik gerektiriyor (${score}/${interactiveData.length}). Gözden geçirip tekrar deneyelim!`
            };
        }
        
        resultsDiv.innerHTML = `
            <div style="background: ${modalConfig.bg}; border: 2px solid ${modalConfig.color}; border-radius: var(--radius-lg); padding: var(--space-xl); text-align: center; margin-top: var(--space-lg); animation: slideUp 0.4s ease-out;">
                <div style="font-size: 4rem; margin-bottom: var(--space-sm);">${modalConfig.icon}</div>
                <h3 style="color: ${modalConfig.color}; font-size: 1.8rem; margin-bottom: var(--space-xs);">${modalConfig.title}</h3>
                <p style="font-size: 1.1rem; color: var(--text-main); margin-bottom: var(--space-md);">${modalConfig.desc}</p>
                <div style="display: flex; gap: var(--space-sm); justify-content: center; margin-top: var(--space-md);">
                    ${percentage < 100 ? `<button type="button" class="btn btn-outline" style="border-color: ${modalConfig.color}; color: ${modalConfig.color}; font-weight: bold;" onclick="resetInteractiveForm()">🔄 Try Again (Tekrar Dene)</button>` : ''}
                </div>
            </div>
        `;
        
        if (percentage === 100 && window.confetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
        }
        
        window.resetInteractiveForm = function() {
            form.reset();
            resultsDiv.innerHTML = '';
            blocks.forEach(block => {
                block.style.backgroundColor = 'var(--bg-main)';
                block.style.borderLeft = '1px solid var(--border-color)';
                const feedback = block.querySelector('.feedback');
                if (feedback) feedback.remove();
            });
            window.scrollTo({ top: form.offsetTop - 50, behavior: 'smooth' });
        };
    });
    
    section.appendChild(form);
    container.appendChild(section);
}
