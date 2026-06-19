const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'assets/js/content-loader.js',
    'assets/js/grade-hub.js',
    'assets/js/search.js',
    'assets/js/unit-hub.js',
    'blog.html',
    'high-school.html',
    'independent-learning.html',
    'index.html',
    'middle-school.html',
    'primary.html',
    'resources.html'
];

let updatedCount = 0;

filesToUpdate.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;
        
        // Replace fetch URLs
        content = content.replace(/fetch\('content\/search-index\.json'\)/g, "fetch('http://localhost:3000/api/lessons')");
        content = content.replace(/fetch\('\.\.\/content\/search-index\.json'\)/g, "fetch('http://localhost:3000/api/lessons')");
        
        // Replace property names
        content = content.replace(/item\.contentType/g, "item.resourceType");
        content = content.replace(/item\.src/g, "item.id");
        
        // Replace viewer.html link query parameters
        content = content.replace(/viewer\.html\?src=\$\{item\.id\}/g, "viewer.html?id=${item.id}");
        
        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            updatedCount++;
        }
    }
});

console.log('Successfully updated ' + updatedCount + ' files.');
