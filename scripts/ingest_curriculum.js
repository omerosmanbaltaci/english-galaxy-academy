const xlsx = require(process.cwd() + '/node_modules/xlsx');
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(process.cwd(), 'yıllık planlar');
const taxonomyOutputPath = path.join(process.cwd(), 'assets', 'js', 'taxonomy.js');

const Taxonomy = {
    grades: {},
    units: {}
};

// Base grade definitions
const gradeDefinitions = {
    'grade-1': { name: 'Grade 1', level: 'primary' },
    'grade-2': { name: 'Grade 2', level: 'primary' },
    'grade-3': { name: 'Grade 3', level: 'primary' },
    'grade-4': { name: 'Grade 4', level: 'primary' },
    'grade-5': { name: 'Grade 5', level: 'middle-school' },
    'grade-6': { name: 'Grade 6', level: 'middle-school' },
    'grade-7': { name: 'Grade 7', level: 'middle-school' },
    'grade-8': { name: 'Grade 8', level: 'middle-school' },
    'grade-9': { name: 'Grade 9', level: 'high-school' },
    'grade-10': { name: 'Grade 10', level: 'high-school' },
    'grade-11': { name: 'Grade 11', level: 'high-school' },
    'grade-12': { name: 'Grade 12', level: 'high-school' }
};

// Initialize all grades
for (let i = 1; i <= 12; i++) {
    Taxonomy.grades[`grade-${i}`] = gradeDefinitions[`grade-${i}`];
    Taxonomy.units[`grade-${i}`] = [];
}

const getSkillFromCode = (code) => {
    const codeUpper = code.toUpperCase();
    if (codeUpper.includes('.L') || codeUpper.includes(' L')) return 'listening';
    if (codeUpper.includes('.R') || codeUpper.includes(' R')) return 'reading';
    if (codeUpper.includes('.W') || codeUpper.includes(' W')) return 'writing';
    if (codeUpper.includes('.S') || codeUpper.includes(' S')) return 'speaking';
    return 'other';
};

const extractOutcomes = (text) => {
    if (!text || typeof text !== 'string') return [];
    
    const lines = text.split(/\r?\n/);
    const outcomes = [];
    
    let currentCode = '';
    let currentDesc = '';

    // A regex to match MEB outcome codes like E6.1.L1, ENG.2.1.L2, etc.
    const codeRegex = /^([A-Z]+\.?\d+\.\d+\.[A-Z]+\d*\.?)\s*(.*)/i;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const match = trimmed.match(codeRegex);
        if (match) {
            // Push previous if exists
            if (currentCode) {
                outcomes.push({
                    code: currentCode.trim(),
                    description: currentDesc.trim(),
                    skill: getSkillFromCode(currentCode)
                });
            }
            currentCode = match[1];
            currentDesc = match[2];
        } else {
            // Append to current desc if it doesn't look like a code
            if (currentCode) {
                currentDesc += ' ' + trimmed;
            } else if (trimmed.length > 20 && (trimmed.toLowerCase().includes('students will') || trimmed.toLowerCase().includes('pupils can'))) {
                // Sometimes there's no clear code at the start, just the text
                // Let's create a generic code
                outcomes.push({
                    code: 'GENERIC',
                    description: trimmed,
                    skill: 'other'
                });
            }
        }
    });

    if (currentCode) {
        outcomes.push({
            code: currentCode.trim(),
            description: currentDesc.trim(),
            skill: getSkillFromCode(currentCode)
        });
    }

    return outcomes;
};

try {
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.xlsx'));
    
    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const workbook = xlsx.readFile(filePath);
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
            
            // Try to figure out the grade from sheet name or file name
            let gradeNum = null;
            const sheetMatch = sheetName.match(/(\d+)\.\s*[Ss]ınıf/i) || sheetName.match(/^(\d+)$/);
            if (sheetMatch) {
                gradeNum = sheetMatch[1];
            } else {
                const fileMatch = file.match(/(\d+)/);
                if (fileMatch) gradeNum = fileMatch[1];
            }

            if (!gradeNum || parseInt(gradeNum) < 1 || parseInt(gradeNum) > 12) {
                console.log(`Skipping sheet ${sheetName} in ${file} (could not determine valid grade)`);
                return;
            }

            const gradeKey = `grade-${gradeNum}`;
            let currentUnit = null;

            data.forEach((row, rowIndex) => {
                // Find unit cell
                let foundUnitCode = null;
                let foundUnitName = null;

                for (let i = 0; i < row.length; i++) {
                    const cell = String(row[i]).trim();
                    // Looks like "1 LIFE", "Theme 1: Music", "2 YUMMY BREAKFAST"
                    const unitMatch = cell.match(/^(?:Theme\s*)?(\d+)[\s:\-]+(.+)$/i);
                    if (unitMatch && cell.length < 50) {
                        foundUnitCode = `unit-${unitMatch[1]}`;
                        foundUnitName = unitMatch[2].trim();
                        break;
                    }
                }

                if (foundUnitCode) {
                    // Check if unit already exists in this grade
                    let existingUnit = Taxonomy.units[gradeKey].find(u => u.code === foundUnitCode);
                    if (!existingUnit) {
                        existingUnit = {
                            code: foundUnitCode,
                            name: foundUnitName,
                            outcomes: []
                        };
                        Taxonomy.units[gradeKey].push(existingUnit);
                    }
                    currentUnit = existingUnit;
                }

                // If we have a current unit, look for outcomes in this row
                if (currentUnit) {
                    for (let i = 0; i < row.length; i++) {
                        const cell = String(row[i]).trim();
                        if (cell.length > 20) { // Outcomes are usually long text
                            const extracted = extractOutcomes(cell);
                            extracted.forEach(newOutcome => {
                                // Avoid duplicates
                                if (!currentUnit.outcomes.some(o => o.code === newOutcome.code && o.description === newOutcome.description)) {
                                    currentUnit.outcomes.push(newOutcome);
                                }
                            });
                        }
                    }
                }
            });
        });
    });

    // Clean up generic codes or empty units
    Object.keys(Taxonomy.units).forEach(grade => {
        Taxonomy.units[grade] = Taxonomy.units[grade].filter(u => u.outcomes.length > 0);
        // Sort units numerically
        Taxonomy.units[grade].sort((a, b) => {
            const numA = parseInt(a.code.replace('unit-', ''));
            const numB = parseInt(b.code.replace('unit-', ''));
            return numA - numB;
        });
    });

    // Generate output
    const fileContent = `/* ==========================================================================
   English Galaxy Academy - MEB Curriculum Taxonomy
   Auto-generated from MEB Annual Plans
   ========================================================================== */

window.Taxonomy = ${JSON.stringify(Taxonomy, null, 4)};

// Helper methods for the application
window.Taxonomy.getUnitInfo = function(grade, unitCode) {
    if (!this.units[grade]) return null;
    return this.units[grade].find(u => u.code === unitCode);
};

window.Taxonomy.getOutcomesBySkill = function(grade, unitCode, skill) {
    const unit = this.getUnitInfo(grade, unitCode);
    if (!unit) return [];
    return unit.outcomes.filter(o => o.skill === skill);
};
`;

    fs.writeFileSync(taxonomyOutputPath, fileContent, 'utf8');
    console.log('✅ Successfully parsed MEB plans and generated assets/js/taxonomy.js');

} catch (err) {
    console.error('Failed to process Excel files:', err);
}
