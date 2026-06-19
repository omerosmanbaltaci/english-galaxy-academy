/* ==========================================================================
   English Galaxy Academy - Curriculum Import Architecture
   ==========================================================================
   Provides structural interfaces, data models, and parser class skeletons
   for importing curriculum data from external sources (MEB spreadsheets,
   Word documents, Excel files, CSV exports, and JSON payloads).

   These are BLUEPRINTS only — the actual file parsing implementations
   will be added in Phase 5 (Admin Dashboard & Content Pipeline).
   ========================================================================== */

/* --------------------------------------------------------------------------
   DATA MODELS
   --------------------------------------------------------------------------
   Standard shapes for imported curriculum records.
   -------------------------------------------------------------------------- */

/**
 * @typedef {Object} ImportedOutcome
 * @property {string} code        - Outcome code (e.g., "E5.3.LO1")
 * @property {string} description - Human-readable description
 * @property {string} grade       - Grade identifier (e.g., "grade-5")
 * @property {string} unit        - Unit code (e.g., "unit-3")
 * @property {string[]} skills    - Target skills (e.g., ["reading", "writing"])
 */

/**
 * @typedef {Object} ImportedUnit
 * @property {string} code        - Unit code (e.g., "unit-3")
 * @property {string} name        - Unit name (e.g., "Games and Hobbies")
 * @property {number} order       - Display order (1-based)
 * @property {ImportedOutcome[]} outcomes
 * @property {string[]} vocabulary
 */

/**
 * @typedef {Object} ImportedGrade
 * @property {string} id          - Grade identifier (e.g., "grade-5")
 * @property {string} name        - Display name (e.g., "Grade 5")
 * @property {string} level       - School level (primary, middle-school, high-school)
 * @property {ImportedUnit[]} units
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success    - Whether the import completed without errors
 * @property {number} totalRecords - Number of records processed
 * @property {number} imported    - Number of records successfully imported
 * @property {number} skipped     - Number of records skipped (duplicates, invalid)
 * @property {string[]} errors    - List of error messages
 * @property {string[]} warnings  - List of warning messages
 * @property {string} timestamp   - ISO timestamp of the import operation
 */

/* --------------------------------------------------------------------------
   1. CURRICULUM IMPORT MANAGER
   --------------------------------------------------------------------------
   Central coordinator for all import operations.
   Handles validation, duplicate detection, and registry updates.
   -------------------------------------------------------------------------- */
class CurriculumImportManager {
    constructor(registry) {
        this.registry = registry;
        this.parsers = {};
        this.importHistory = [];
        this.validationRules = this._initValidationRules();
    }

    /* Register a parser for a specific file format */
    registerParser(format, parserInstance) {
        this.parsers[format.toLowerCase()] = parserInstance;
        return this;
    }

    /* Get registered parser by format */
    getParser(format) {
        return this.parsers[format.toLowerCase()] || null;
    }

    /* Execute an import operation */
    async importCurriculum(format, rawData, options = {}) {
        const parser = this.getParser(format);
        if (!parser) {
            return this._createResult(false, 0, 0, 0,
                [`No parser registered for format: ${format}`], []);
        }

        try {
            // Step 1: Parse raw data into standard structure
            const parsed = await parser.parse(rawData, options);

            // Step 2: Validate parsed data
            const validation = this.validate(parsed);
            if (!validation.valid) {
                return this._createResult(false, parsed.length || 0, 0, 0,
                    validation.errors, validation.warnings);
            }

            // Step 3: Check for duplicates
            const { unique, duplicates } = this._detectDuplicates(parsed);

            // Step 4: Merge into registry
            const imported = this._mergeIntoRegistry(unique, options);

            // Step 5: Record history
            const result = this._createResult(
                true,
                parsed.length || 0,
                imported,
                duplicates.length,
                [],
                duplicates.length > 0
                    ? [`${duplicates.length} duplicate records skipped.`]
                    : []
            );

            this.importHistory.push(result);
            return result;

        } catch (error) {
            return this._createResult(false, 0, 0, 0,
                [`Import failed: ${error.message}`], []);
        }
    }

    /* Validate parsed curriculum data */
    validate(data) {
        const errors = [];
        const warnings = [];

        if (!data || (Array.isArray(data) && data.length === 0)) {
            errors.push('No data to validate.');
            return { valid: false, errors, warnings };
        }

        const items = Array.isArray(data) ? data : [data];

        items.forEach((item, idx) => {
            this.validationRules.forEach(rule => {
                const result = rule.check(item, idx);
                if (!result.pass) {
                    if (rule.severity === 'error') errors.push(result.message);
                    else warnings.push(result.message);
                }
            });
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /* Detect duplicate outcomes */
    _detectDuplicates(data) {
        const seen = new Set();
        const unique = [];
        const duplicates = [];

        const items = Array.isArray(data) ? data : [data];

        items.forEach(item => {
            const key = item.code || `${item.grade}-${item.unit}-${item.name}`;
            if (seen.has(key)) {
                duplicates.push(item);
            } else {
                seen.add(key);
                unique.push(item);
            }
        });

        return { unique, duplicates };
    }

    /* Merge successfully parsed data into the Registry */
    _mergeIntoRegistry(curriculumId, dataObj) {
        if (!window.CurriculumEngine) return false;

        let gradesObj = dataObj.data;

        // If data is a flat array, reshape it to the nested hierarchy the Registry expects
        if (Array.isArray(dataObj.data)) {
            gradesObj = this._reshapeToHierarchy(dataObj.data);
        }

        if (dataObj.type === 'grades' || dataObj.type === 'outcomes') {
            window.CurriculumEngine.registry.mergeGrades(curriculumId, gradesObj);
            console.log(`[Import] Merged ${Object.keys(gradesObj).length} grades into ${curriculumId}`);
            return true;
        }

        return false;
    }

    /* Convert flat records array into nested grade->unit->outcome structure */
    _reshapeToHierarchy(flatRecords) {
        const hierarchy = {};
        
        flatRecords.forEach(record => {
            if (!record.grade || !record.unit) return;

            if (!hierarchy[record.grade]) {
                hierarchy[record.grade] = [];
            }
            
            let unit = hierarchy[record.grade].find(u => u.code === record.unit);
            if (!unit) {
                unit = {
                    code: record.unit,
                    name: record.name || record.unit,
                    outcomes: [],
                    vocabulary: []
                };
                hierarchy[record.grade].push(unit);
            }
            
            if (record.code) {
                unit.outcomes.push({
                    code: record.code,
                    description: record.description || `Outcome ${record.code}`,
                    skills: record.skills || []
                });
            }
        });
        
        return hierarchy;
    }

    /* Create a standardized ImportResult */
    _createResult(success, totalRecords, imported, skipped, errors, warnings) {
        return {
            success,
            totalRecords,
            imported,
            skipped,
            errors: errors || [],
            warnings: warnings || [],
            timestamp: new Date().toISOString()
        };
    }

    /* Initialize validation rules */
    _initValidationRules() {
        return [
            {
                name: 'outcome-code-format',
                severity: 'error',
                check: (item, idx) => {
                    if (item.code && !/^E\d+\.\d+\.LO\d+$/.test(item.code)) {
                        return {
                            pass: false,
                            message: `Row ${idx + 1}: Invalid outcome code format "${item.code}". Expected pattern: E{grade}.{unit}.LO{num}`
                        };
                    }
                    return { pass: true };
                }
            },
            {
                name: 'required-fields',
                severity: 'error',
                check: (item, idx) => {
                    if (!item.grade || !item.unit || !item.code) {
                        return {
                            pass: false,
                            message: `Row ${idx + 1}: Missing minimum identifying fields (grade, unit, and code are required).`
                        };
                    }
                    return { pass: true };
                }
            },
            {
                name: 'grade-range',
                severity: 'warning',
                check: (item, idx) => {
                    if (item.grade) {
                        const num = parseInt(item.grade.replace('grade-', ''));
                        if (isNaN(num) || num < 1 || num > 12) {
                            return {
                                pass: false,
                                message: `Row ${idx + 1}: Grade "${item.grade}" is outside the expected range (1-12).`
                            };
                        }
                    }
                    return { pass: true };
                }
            },
            {
                name: 'description-present',
                severity: 'warning',
                check: (item, idx) => {
                    if (item.code && !item.description) {
                        return {
                            pass: false,
                            message: `Row ${idx + 1}: Outcome "${item.code}" is missing a description.`
                        };
                    }
                    return { pass: true };
                }
            }
        ];
    }
}

/* --------------------------------------------------------------------------
   2. PARSER BASE CLASS
   --------------------------------------------------------------------------
   Abstract base class that all format-specific parsers extend.
   -------------------------------------------------------------------------- */
class CurriculumParser {
    constructor(format) {
        this.format = format;
        this.supportedExtensions = [];
    }

    /**
     * Parse raw input data into a standardized array of curriculum records.
     * @param {*} rawData - The raw file content (string, ArrayBuffer, etc.)
     * @param {Object} options - Parser-specific options (sheet name, delimiter, etc.)
     * @returns {Promise<Array>} Array of parsed curriculum records
     */
    async parse(rawData, options = {}) {
        throw new Error(`parse() must be implemented by ${this.format} parser.`);
    }

    /**
     * Validate that the raw data is in the expected format.
     * @param {*} rawData - The raw file content
     * @returns {boolean} True if the data is in a valid format
     */
    validateFormat(rawData) {
        throw new Error(`validateFormat() must be implemented by ${this.format} parser.`);
    }

    /**
     * Map raw column/field names to standardized field names.
     * @param {Object} columnMap - Mapping of source columns to target fields
     */
    setColumnMapping(columnMap) {
        this.columnMap = columnMap;
    }
}

/* --------------------------------------------------------------------------
   3. WORD DOCUMENT PARSER (Skeleton)
   --------------------------------------------------------------------------
   Parses .docx files containing curriculum tables/lists.
   Requires a library like mammoth.js for DOCX → HTML conversion.
   -------------------------------------------------------------------------- */
class WordCurriculumParser extends CurriculumParser {
    constructor() {
        super('word');
        this.supportedExtensions = ['.docx', '.doc'];
    }

    async parse(rawData, options = {}) {
        // BLUEPRINT: Implementation will use mammoth.js or similar
        // Step 1: Convert DOCX to HTML
        // Step 2: Extract tables from HTML
        // Step 3: Map table rows to ImportedOutcome objects
        // Step 4: Return standardized array
        console.warn('[WordCurriculumParser] Skeleton only — implementation pending Phase 5.');
        return [];
    }

    validateFormat(rawData) {
        // Check DOCX magic bytes (PK header for ZIP archive)
        if (rawData instanceof ArrayBuffer) {
            const bytes = new Uint8Array(rawData.slice(0, 4));
            return bytes[0] === 0x50 && bytes[1] === 0x4B;
        }
        return false;
    }
}

/* --------------------------------------------------------------------------
   4. EXCEL PARSER (Skeleton)
   --------------------------------------------------------------------------
   Parses .xlsx / .xls files containing curriculum spreadsheets.
   Requires a library like SheetJS (xlsx) for parsing.
   -------------------------------------------------------------------------- */
class ExcelCurriculumParser extends CurriculumParser {
    constructor() {
        super('excel');
        this.supportedExtensions = ['.xlsx', '.xls'];
        this.defaultColumnMap = {
            'A': 'grade',
            'B': 'unit',
            'C': 'code',
            'D': 'description',
            'E': 'skills',
            'F': 'vocabulary'
        };
    }

    async parse(rawData, options = {}) {
        // BLUEPRINT: Implementation will use SheetJS
        // Step 1: Read workbook from ArrayBuffer
        // Step 2: Select target sheet (options.sheetName || first sheet)
        // Step 3: Convert sheet to JSON rows
        // Step 4: Apply column mapping
        // Step 5: Return standardized array
        console.warn('[ExcelCurriculumParser] Skeleton only — implementation pending Phase 5.');
        return [];
    }

    validateFormat(rawData) {
        if (rawData instanceof ArrayBuffer) {
            const bytes = new Uint8Array(rawData.slice(0, 4));
            // XLSX uses PK (ZIP) header
            return bytes[0] === 0x50 && bytes[1] === 0x4B;
        }
        return false;
    }
}

/* --------------------------------------------------------------------------
   5. CSV PARSER (Skeleton)
   --------------------------------------------------------------------------
   Parses .csv files containing curriculum data.
   No external dependencies needed — uses native string parsing.
   -------------------------------------------------------------------------- */
class CSVCurriculumParser extends CurriculumParser {
    constructor() {
        super('csv');
        this.supportedExtensions = ['.csv', '.tsv'];
    }

    async parse(rawData, options = {}) {
        // BLUEPRINT: Will parse CSV text natively
        // Step 1: Detect delimiter (comma, semicolon, tab)
        // Step 2: Split into rows, extract header row
        // Step 3: Map each data row to ImportedOutcome using header columns
        // Step 4: Return standardized array

        if (typeof rawData !== 'string') {
            console.warn('[CSVCurriculumParser] Expected string input.');
            return [];
        }

        const delimiter = options.delimiter || this._detectDelimiter(rawData);
        const lines = rawData.split(/\r?\n/).filter(line => line.trim());

        if (lines.length < 2) return [];

        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        const records = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.trim());
            const record = {};
            headers.forEach((h, idx) => {
                record[h] = cols[idx] || '';
            });

            // Map to standardized format
            records.push({
                code: record.code || record.outcome_code || '',
                description: record.description || record.outcome || '',
                grade: record.grade || '',
                unit: record.unit || '',
                skills: (record.skills || '').split(',').map(s => s.trim()).filter(Boolean),
                name: record.name || record.unit_name || ''
            });
        }

        return records;
    }

    _detectDelimiter(text) {
        const firstLine = text.split(/\r?\n/)[0] || '';
        if (firstLine.includes('\t')) return '\t';
        if (firstLine.includes(';')) return ';';
        return ',';
    }

    validateFormat(rawData) {
        return typeof rawData === 'string' && rawData.includes(',');
    }
}

/* --------------------------------------------------------------------------
   6. JSON PARSER (Skeleton)
   --------------------------------------------------------------------------
   Parses .json files containing structured curriculum exports.
   -------------------------------------------------------------------------- */
class JSONCurriculumParser extends CurriculumParser {
    constructor() {
        super('json');
        this.supportedExtensions = ['.json'];
    }

    async parse(rawData, options = {}) {
        // BLUEPRINT: Will parse JSON directly
        // Step 1: Parse JSON string
        // Step 2: Validate top-level structure
        // Step 3: Flatten nested grade → unit → outcome structure into records
        // Step 4: Return standardized array

        try {
            const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            if (Array.isArray(data)) {
                return data.map(item => ({
                    code: item.code || '',
                    description: item.description || '',
                    grade: item.grade || '',
                    unit: item.unit || '',
                    skills: item.skills || [],
                    name: item.name || ''
                }));
            }

            // If data is a hierarchical object (grades → units → outcomes)
            if (data.grades) {
                const records = [];
                for (const [gradeId, units] of Object.entries(data.grades)) {
                    (units || []).forEach(unit => {
                        (unit.outcomes || []).forEach(outcome => {
                            records.push({
                                code: outcome.code || '',
                                description: outcome.description || '',
                                grade: gradeId,
                                unit: unit.code || '',
                                skills: outcome.skills || [],
                                name: unit.name || ''
                            });
                        });
                    });
                }
                return records;
            }

            return [];
        } catch (e) {
            console.error('[JSONCurriculumParser] Parse error:', e.message);
            return [];
        }
    }

    validateFormat(rawData) {
        try {
            JSON.parse(typeof rawData === 'string' ? rawData : JSON.stringify(rawData));
            return true;
        } catch {
            return false;
        }
    }
}

/* --------------------------------------------------------------------------
   EXPORTS & GLOBAL BINDINGS
   -------------------------------------------------------------------------- */
if (typeof window !== 'undefined') {
    window.CurriculumImporter = {
        Manager: CurriculumImportManager,
        Parsers: {
            Word: WordCurriculumParser,
            Excel: ExcelCurriculumParser,
            CSV: CSVCurriculumParser,
            JSON: JSONCurriculumParser
        }
    };
}

if (typeof module !== 'undefined') {
    module.exports = {
        CurriculumImportManager,
        CurriculumParser,
        WordCurriculumParser,
        ExcelCurriculumParser,
        CSVCurriculumParser,
        JSONCurriculumParser
    };
}
