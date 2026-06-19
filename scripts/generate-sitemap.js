const fs = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, '../content/search-index.json');
const SITEMAP_FILE = path.join(__dirname, '../sitemap.xml');
const BASE_URL = 'https://english-galaxy-academy.vercel.app';

function generateSitemap() {
  console.log('Generating sitemap.xml from search index...');
  
  if (!fs.existsSync(INDEX_FILE)) {
    console.warn('search-index.json not found! Run index generation first.');
    return;
  }

  const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  
  // Base URLs that are always present
  const urls = [
    '/',
    '/primary',
    '/middle-school',
    '/high-school',
    '/independent-learning',
    '/teachers',
    '/search',
    '/blog'
  ];

  // Add dynamic lesson URLs
  indexData.forEach(item => {
    // For markdown files like content/primary/grade-1/lessons/unit-1-greetings.md
    if (item.path.includes('/lessons/') || item.path.includes('/blog/')) {
        let url = '';
        if (item.path.startsWith('content/blog/')) {
            url = `/viewer?id=${item.id}`;
        } else if (item.level && item.grade && item.unit) {
            url = `/unit?grade=${item.grade}&unit=${item.unit}`;
        } else {
            url = `/viewer?id=${item.id}`;
        }
        
        if (!urls.includes(url)) {
            urls.push(url);
        }
    }
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${BASE_URL}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(SITEMAP_FILE, sitemapXml, 'utf-8');
  console.log('sitemap.xml generated successfully!');
}

generateSitemap();
