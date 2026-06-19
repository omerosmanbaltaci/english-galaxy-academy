const fs = require('fs');

const fixMap = {
    'independent-learning.html': [
        { regex: /<span style="font-size: 2rem; margin-bottom: var\(--space-xs\);">.*?<\/span>\s*<h3 class="pathway-title" data-i18n="footer_a1">/g, replace: '<span style=\"font-size: 2rem; margin-bottom: var(--space-xs);\">🌱</span>\n                        <h3 class=\"pathway-title\" data-i18n=\"footer_a1\">' },
        { regex: /<span style="font-size: 2rem; margin-bottom: var\(--space-xs\);">.*?<\/span>\s*<h3 class="pathway-title" data-i18n="footer_a2">/g, replace: '<span style=\"font-size: 2rem; margin-bottom: var(--space-xs);\">🌿</span>\n                        <h3 class=\"pathway-title\" data-i18n=\"footer_a2\">' },
        { regex: /<span style="font-size: 2rem; margin-bottom: var\(--space-xs\);">.*?<\/span>\s*<h3 class="pathway-title" data-i18n="footer_b1">/g, replace: '<span style=\"font-size: 2rem; margin-bottom: var(--space-xs);\">🌳</span>\n                        <h3 class=\"pathway-title\" data-i18n=\"footer_b1\">' },
        { regex: /<span style="font-size: 2rem; margin-bottom: var\(--space-xs\);">.*?<\/span>\s*<h3 class="pathway-title" data-i18n="footer_b2">/g, replace: '<span style=\"font-size: 2rem; margin-bottom: var(--space-xs);\">🌲</span>\n                        <h3 class=\"pathway-title\" data-i18n=\"footer_b2\">' },
        { regex: /<span style="font-size: 2rem; margin-bottom: var\(--space-xs\);">.*?<\/span>\s*<h3 class="pathway-title">C1/g, replace: '<span style=\"font-size: 2rem; margin-bottom: var(--space-xs);\">🦉</span>\n                        <h3 class=\"pathway-title\">C1' }
    ],
    'unit.html': [
        { regex: /<span style="font-size: 3rem; animation: float 2s ease-in-out infinite; display: inline-block;">.*?<\/span>/g, replace: '<span style=\"font-size: 3rem; animation: float 2s ease-in-out infinite; display: inline-block;\">📖</span>' },
        { regex: /data-i18n="unit_resources">.*? Teaching/g, replace: 'data-i18n=\"unit_resources\">📚 Teaching' },
        { regex: /data-i18n="unit_info">.*? Unit/g, replace: 'data-i18n=\"unit_info\">📋 Unit' },
        { regex: /data-i18n="unit_vocab">.*? Target/g, replace: 'data-i18n=\"unit_vocab\">📌 Target' },
        { regex: /<h3 class="unit-card-title">.*? Quick/g, replace: '<h3 class=\"unit-card-title\">🧭 Quick' },
        { regex: /<h2 style="margin-bottom: var\(--space-lg\);">.*? Speaking/g, replace: '<h2 style=\"margin-bottom: var(--space-lg);\">🎙️ Speaking' },
        { regex: /<button class="mic-btn" id="btn-mic" onclick="toggleRecording\(\)">.*?<\/button>/g, replace: '<button class=\"mic-btn\" id=\"btn-mic\" onclick=\"toggleRecording()\">🎤</button>' }
    ],
    'exam-generator.html': [
        { regex: /data-i18n="exam_written">.*? Written/g, replace: 'data-i18n=\"exam_written\">📝 Written' },
        { regex: /data-i18n="exam_listening">.*? Listening/g, replace: 'data-i18n=\"exam_listening\">🎧 Listening' },
        { regex: /data-i18n="exam_speaking">.*? Speaking/g, replace: 'data-i18n=\"exam_speaking\">💬 Speaking' },
        { regex: /onclick="downloadZip\(\)">.*? Create/g, replace: 'onclick=\"downloadZip()\">📥 Create' },
        { regex: /onclick="saveExam\(\)">.*? Save/g, replace: 'onclick=\"saveExam()\">💾 Save' }
    ],
    'search.html': [
        { regex: /<span class="search-icon-embedded">.*?<\/span>/g, replace: '<span class=\"search-icon-embedded\">🔍</span>' },
        { regex: /.*? Clear All Filters/g, replace: '🧹 Clear All Filters' }
    ],
    'blog.html': [
        { regex: /<div style="font-size: 3\.5rem; user-select: none; padding-left: var\(--space-sm\);">.*?<\/div>/g, replace: '<div style=\"font-size: 3.5rem; user-select: none; padding-left: var(--space-sm);\">📰</div>' }
    ],
    'index.html': [
        { regex: /<span>\$\{item\.pdfAvailable \? \'.*? PDF\' : \'\'\}<\/span>/g, replace: '<span>${item.pdfAvailable ? \'📄 PDF\' : \'\'}</span>' }
    ]
};

for (const [file, fixes] of Object.entries(fixMap)) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        for (const fix of fixes) {
            content = content.replace(fix.regex, fix.replace);
        }
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed ' + file);
    } catch(err) {
        console.error('Error on ' + file, err);
    }
}
