const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../content');
const OUTPUT_FILE = path.join(CONTENT_DIR, 'search-index.json');

// Helper to recursively walk a directory and return all markdown file paths
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });
  return results;
}

// Custom frontmatter parser to handle nested objects and array bullet lists
function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return { attributes: {}, body: content };
  }
  const fm = match[1];
  const body = content.slice(match[0].length);
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

function generateIndex() {
  console.log('Generating standardized search index...');
  
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  const files = walkDir(CONTENT_DIR);
  const indexData = [];

  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { attributes, body } = parseFrontMatter(content);
      
      const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
      
      const title = attributes.title || path.basename(filePath, '.md').replace(/-/g, ' ');
      const description = attributes.description || '';
      const grade = attributes.grade || '';
      const unit = attributes.unit || '';
      
      // Standardize level mapping
      let level = attributes.level || '';
      if (!level && grade) {
        // Fallback check against taxonomy folder name
        if (filePath.includes('/primary/')) level = 'primary';
        else if (filePath.includes('/middle-school/')) level = 'middle-school';
        else if (filePath.includes('/high-school/')) level = 'high-school';
        else if (filePath.includes('/independent-learning/')) level = 'independent-learning';
      }

      // Replaces contentType with resource_type but keeps fallback support
      const resource_type = attributes.resource_type || attributes.contentType || '';
      
      // Multi-value Arrays parsing
      const getArray = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') return val.split(',').map(item => item.trim());
        return [];
      };
      
      const skills = getArray(attributes.skills);
      const raw_outcomes = getArray(attributes.learning_outcomes);
      // Normalize to bare codes: "E1.2.LO1: Description" -> "E1.2.LO1"
      const learning_outcomes = raw_outcomes.map(lo => {
        const match = lo.match(/^(E\d+\.\d+\.LO\d+)/);
        return match ? match[1] : lo;
      });
      const vocabulary = getArray(attributes.vocabulary);
      const tags = getArray(attributes.tags);
      
      const difficulty = attributes.difficulty || '';
      const author = attributes.author || 'Galaxy Editor';
      const version = attributes.version || '1.0';
      const featured = attributes.featured === 'true' || attributes.featured === true;

      // Resource Management Support
      const pdf = attributes.pdf || {};
      const audio = attributes.audio || '';
      const video = attributes.video || '';
      
      // Helper check for pdf availability
      const pdfAvailable = !!(pdf.student || pdf.teacher || pdf.answer_key || attributes.pdfAvailable === 'true' || attributes.pdfAvailable === true);
      const audioAvailable = !!(audio || attributes.audioAvailable === 'true' || attributes.audioAvailable === true);
      
      indexData.push({
        title,
        description,
        grade,
        unit,
        level,
        resource_type,
        skills,
        learning_outcomes,
        vocabulary,
        tags,
        difficulty,
        author,
        version,
        featured,
        pdf,
        audio,
        video,
        pdfAvailable,
        audioAvailable,
        src: relativePath,
        bodySnippet: body.slice(0, 200).replace(/[\r\n#*`_-]/g, ' ').trim()
      });
      
      console.log(`Indexed: ${relativePath}`);
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
    }
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexData, null, 2), 'utf-8');
  console.log(`Successfully generated standardized search index at ${OUTPUT_FILE} with ${indexData.length} items.`);
}

generateIndex();
