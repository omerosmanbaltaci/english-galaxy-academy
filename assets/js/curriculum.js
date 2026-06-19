/* ==========================================================================
   English Galaxy Academy - Curriculum Engine Foundation
   ==========================================================================
   Provides:
   1. CurriculumRegistry  — Multi-curriculum support (MEB, Cambridge, Oxford, Independent)
   2. OutcomeMapper       — Links resources ↔ learning outcomes
   3. CoverageTracker     — Calculates coverage metrics by grade/unit/skill/global
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CURRICULUM REGISTRY
   --------------------------------------------------------------------------
   Central registry managing multiple supported curriculum frameworks.
   Each curriculum defines its own grade → unit → outcome hierarchy.
   -------------------------------------------------------------------------- */
class CurriculumRegistry {
    constructor() {
        this.curricula = {};
        this._initDefaults();
    }

    /* Register a new curriculum framework */
    register(id, config) {
        this.curricula[id] = {
            id,
            name: config.name || id,
            description: config.description || '',
            country: config.country || 'International',
            version: config.version || '1.0',
            grades: config.grades || {},
            active: config.active !== false,
            registeredAt: new Date().toISOString()
        };
        return this;
    }

    /* Retrieve a curriculum by ID */
    get(id) {
        return this.curricula[id] || null;
    }

    /* List all registered curricula */
    listAll() {
        return Object.values(this.curricula);
    }

    /* List only active curricula */
    listActive() {
        return this.listAll().filter(c => c.active);
    }

    /* Update an entire grade's units */
    updateGrade(curriculumId, gradeId, units) {
        const curriculum = this.get(curriculumId);
        if (curriculum) {
            curriculum.grades[gradeId] = units;
        }
        return this;
    }

    /* Add or update an outcome within a unit */
    addOutcome(curriculumId, gradeId, unitCode, outcome) {
        const curriculum = this.get(curriculumId);
        if (curriculum && curriculum.grades[gradeId]) {
            const unit = curriculum.grades[gradeId].find(u => u.code === unitCode);
            if (unit) {
                if (!unit.outcomes) unit.outcomes = [];
                const existingIdx = unit.outcomes.findIndex(o => o.code === outcome.code);
                if (existingIdx >= 0) {
                    unit.outcomes[existingIdx] = outcome;
                } else {
                    unit.outcomes.push(outcome);
                }
            }
        }
        return this;
    }

    /* Merge imported grades into an existing curriculum */
    mergeGrades(curriculumId, gradesObj) {
        for (const [gradeId, units] of Object.entries(gradesObj)) {
            this.updateGrade(curriculumId, gradeId, units);
        }
        return this;
    }

    /* Get curriculum outcomes for a specific grade + unit */
    getOutcomes(curriculumId, gradeId, unitCode) {
        const curriculum = this.get(curriculumId);
        if (!curriculum || !curriculum.grades[gradeId]) return [];
        const unit = curriculum.grades[gradeId].find(u => u.code === unitCode);
        return unit ? (unit.outcomes || []) : [];
    }

    /* Get vocabulary set for a specific grade + unit */
    getVocabulary(curriculumId, gradeId, unitCode) {
        const curriculum = this.get(curriculumId);
        if (!curriculum || !curriculum.grades[gradeId]) return [];
        const unit = curriculum.grades[gradeId].find(u => u.code === unitCode);
        return unit ? (unit.vocabulary || []) : [];
    }

    /* Get all units for a grade in a curriculum */
    getUnits(curriculumId, gradeId) {
        const curriculum = this.get(curriculumId);
        if (!curriculum || !curriculum.grades[gradeId]) return [];
        return curriculum.grades[gradeId];
    }

    /* Initialize default curriculum frameworks */
    _initDefaults() {
        // MEB (Turkish Ministry of National Education) — Primary framework
        // Populated from window.Taxonomy when available
        this.register('meb', {
            name: 'MEB İngilizce Müfredatı',
            description: 'Republic of Türkiye Ministry of National Education English Language Curriculum for Grades 1–12.',
            country: 'Türkiye',
            version: '2024-2025',
            grades: this._buildMEBGrades()
        });

        // Cambridge Assessment English — Future integration
        this.register('cambridge', {
            name: 'Cambridge English Curriculum',
            description: 'Cambridge Assessment English framework covering Young Learners (Starters, Movers, Flyers), KET, PET, FCE.',
            country: 'International',
            version: '2024',
            grades: {},
            active: false
        });

        // Oxford English — Future integration
        this.register('oxford', {
            name: 'Oxford English Programme',
            description: 'Oxford University Press English teaching framework for international schools.',
            country: 'International',
            version: '2024',
            grades: {},
            active: false
        });

        // Independent Learning Track — CEFR-aligned
        this.register('independent', {
            name: 'Independent Learning Track',
            description: 'Self-study curriculum following the Common European Framework of Reference (CEFR) levels A1–C1.',
            country: 'International',
            version: '1.0',
            grades: this._buildIndependentGrades()
        });
    }

    /* Build MEB grade structure from Taxonomy */
    _buildMEBGrades() {
        const grades = {};
        const taxonomy = (typeof window !== 'undefined' && window.Taxonomy) ? window.Taxonomy : null;
        if (!taxonomy) return grades;

        for (const [gradeId, gradeInfo] of Object.entries(taxonomy.grades)) {
            const units = (taxonomy.units[gradeId] || []).map((unit, idx) => ({
                code: unit.code,
                name: unit.name,
                order: idx + 1,
                outcomes: unit.outcomes || [],
                vocabulary: unit.vocabulary || [],
                skills: ['listening', 'speaking', 'reading', 'writing']
            }));
            grades[gradeId] = units;
        }
        return grades;
    }

    /* Build Independent Learning grades (CEFR levels) */
    _buildIndependentGrades() {
        return {
            'independent-a1': [
                { code: 'basics-1', name: 'Alphabet & Phonics', outcomes: [], vocabulary: [] },
                { code: 'basics-2', name: 'Greetings & Introductions', outcomes: [], vocabulary: [] },
                { code: 'basics-3', name: 'Numbers & Colors', outcomes: [], vocabulary: [] }
            ],
            'independent-a2': [
                { code: 'elem-1', name: 'Daily Routines', outcomes: [], vocabulary: [] },
                { code: 'elem-2', name: 'Shopping & Services', outcomes: [], vocabulary: [] },
                { code: 'elem-3', name: 'Travel & Directions', outcomes: [], vocabulary: [] }
            ],
            'independent-b1': [
                { code: 'inter-1', name: 'Work & Career', outcomes: [], vocabulary: [] },
                { code: 'inter-2', name: 'Health & Lifestyle', outcomes: [], vocabulary: [] },
                { code: 'inter-3', name: 'Media & Entertainment', outcomes: [], vocabulary: [] }
            ],
            'independent-b2': [
                { code: 'upper-1', name: 'Academic English', outcomes: [], vocabulary: [] },
                { code: 'upper-2', name: 'Business Communication', outcomes: [], vocabulary: [] },
                { code: 'upper-3', name: 'Critical Thinking & Debate', outcomes: [], vocabulary: [] }
            ],
            'independent-c1': [
                { code: 'adv-1', name: 'Advanced Composition', outcomes: [], vocabulary: [] },
                { code: 'adv-2', name: 'Literature & Analysis', outcomes: [], vocabulary: [] },
                { code: 'adv-3', name: 'Research & Presentation', outcomes: [], vocabulary: [] }
            ]
        };
    }
}

/* --------------------------------------------------------------------------
   2. OUTCOME MAPPER
   --------------------------------------------------------------------------
   Resolves relationships between learning outcomes and content resources.
   Uses search-index.json entries matched against outcome codes.
   -------------------------------------------------------------------------- */
class OutcomeMapper {
    constructor(registry) {
        this.registry = registry;
    }

    /* Map resources to outcomes for a specific grade + unit */
    mapResourcesToOutcomes(gradeId, unitCode, searchIndex, curriculumId = 'meb') {
        const outcomes = this.registry.getOutcomes(curriculumId, gradeId, unitCode);
        
        // Support O(1) lookup if searchIndex is a Map (CRT-9), else fallback to array filter
        const unitResources = Array.isArray(searchIndex) 
            ? searchIndex.filter(r => r.grade === gradeId && r.unit === unitCode)
            : (searchIndex.get(`${gradeId}_${unitCode}`) || []);

        return outcomes.map(outcome => {
            // Match resources whose learning_outcomes array contains this code
            const explicitMatches = unitResources.filter(r =>
                r.learning_outcomes &&
                Array.isArray(r.learning_outcomes) &&
                r.learning_outcomes.some(lo => lo === outcome.code || lo.startsWith(outcome.code + ':'))
            );

            // Fallback: if no explicit outcome tagging, assign by resource type heuristic
            const heuristicMatches = explicitMatches.length === 0
                ? unitResources.filter(r => this._heuristicMatch(r, outcome))
                : [];

            return {
                ...outcome,
                resources: explicitMatches.length > 0 ? explicitMatches : heuristicMatches,
                explicitCount: explicitMatches.length,
                heuristicCount: heuristicMatches.length,
                covered: (explicitMatches.length + heuristicMatches.length) > 0,
                isFullyCovered: explicitMatches.length > 0,
                isPartiallyCovered: explicitMatches.length === 0 && heuristicMatches.length > 0,
                resourceCount: explicitMatches.length + heuristicMatches.length
            };
        });
    }

    /* Heuristic: match resources to outcomes by skill overlap */
    _heuristicMatch(resource, outcome) {
        if (!resource.skills || !outcome.skills) return false;
        const rSkills = Array.isArray(resource.skills) ? resource.skills : [resource.skills];
        return outcome.skills.some(s => rSkills.includes(s));
    }

    /* Get all outcomes for a grade (all units) */
    getAllGradeOutcomes(gradeId, curriculumId = 'meb') {
        const units = this.registry.getUnits(curriculumId, gradeId);
        return units.map(unit => ({
            unit: unit.code,
            unitName: unit.name,
            outcomes: this.registry.getOutcomes(curriculumId, gradeId, unit.code)
        }));
    }
}

/* --------------------------------------------------------------------------
   3. COVERAGE TRACKER
   --------------------------------------------------------------------------
   Calculates coverage statistics measuring how many learning outcomes
   are backed by actual content resources.
   -------------------------------------------------------------------------- */
class CoverageTracker {
    constructor(registry, mapper) {
        this.registry = registry;
        this.mapper = mapper;
    }

    /* Calculate coverage for a specific grade */
    calculateGradeCoverage(gradeId, searchIndex, curriculumId = 'meb') {
        const units = this.registry.getUnits(curriculumId, gradeId);
        let totalOutcomes = 0;
        let explicitlyCovered = 0;
        let partiallyCovered = 0;
        const unitDetails = [];

        // Support pre-indexed map for performance
        let indexedResources = searchIndex;
        if (Array.isArray(searchIndex)) {
            indexedResources = new Map();
            searchIndex.filter(r => r.grade === gradeId).forEach(r => {
                const key = `${r.grade}_${r.unit}`;
                if (!indexedResources.has(key)) indexedResources.set(key, []);
                indexedResources.get(key).push(r);
            });
        }

        units.forEach(unit => {
            const mappedOutcomes = this.mapper.mapResourcesToOutcomes(
                gradeId, unit.code, indexedResources, curriculumId
            );
            const unitTotal = mappedOutcomes.length;
            const unitExplicit = mappedOutcomes.filter(o => o.isFullyCovered).length;
            const unitPartial = mappedOutcomes.filter(o => o.isPartiallyCovered).length;

            totalOutcomes += unitTotal;
            explicitlyCovered += unitExplicit;
            partiallyCovered += unitPartial;

            unitDetails.push({
                code: unit.code,
                name: unit.name,
                total: unitTotal,
                explicitlyCovered: unitExplicit,
                partiallyCovered: unitPartial,
                covered: unitExplicit + unitPartial, // Backwards compatibility
                percentage: unitTotal > 0 ? Math.round((unitExplicit / unitTotal) * 100) : 0,
                outcomes: mappedOutcomes
            });
        });

        return {
            gradeId,
            totalOutcomes,
            explicitlyCovered,
            partiallyCovered,
            coveredOutcomes: explicitlyCovered + partiallyCovered, // Backwards compatibility
            percentage: totalOutcomes > 0 ? Math.round((explicitlyCovered / totalOutcomes) * 100) : 0,
            units: unitDetails
        };
    }

    /* Calculate coverage for a specific unit */
    calculateUnitCoverage(gradeId, unitCode, searchIndex, curriculumId = 'meb') {
        const mappedOutcomes = this.mapper.mapResourcesToOutcomes(
            gradeId, unitCode, searchIndex, curriculumId
        );
        const total = mappedOutcomes.length;
        const explicit = mappedOutcomes.filter(o => o.isFullyCovered).length;
        const partial = mappedOutcomes.filter(o => o.isPartiallyCovered).length;

        return {
            gradeId,
            unitCode,
            totalOutcomes: total,
            explicitlyCovered: explicit,
            partiallyCovered: partial,
            coveredOutcomes: explicit + partial, // Backwards compatibility
            percentage: total > 0 ? Math.round((explicit / total) * 100) : 0,
            outcomes: mappedOutcomes
        };
    }

    /* Calculate coverage by skill type */
    calculateSkillCoverage(skillId, searchIndex) {
        const skillResources = searchIndex.filter(r => {
            if (!r.skills) return false;
            const skills = Array.isArray(r.skills) ? r.skills : [r.skills];
            return skills.includes(skillId);
        });

        const totalResources = searchIndex.length;
        const skillCount = skillResources.length;

        // Group by grade
        const gradeBreakdown = {};
        skillResources.forEach(r => {
            const g = r.grade || 'ungraded';
            if (!gradeBreakdown[g]) gradeBreakdown[g] = 0;
            gradeBreakdown[g]++;
        });

        return {
            skillId,
            skillName: this._getSkillName(skillId),
            totalResources: skillCount,
            percentage: totalResources > 0 ? Math.round((skillCount / totalResources) * 100) : 0,
            gradeBreakdown
        };
    }

    /* Calculate overall platform coverage */
    calculateGlobalCoverage(searchIndex, curriculumId = 'meb') {
        const taxonomy = (typeof window !== 'undefined' && window.Taxonomy) ? window.Taxonomy : null;
        if (!taxonomy) return { error: 'Taxonomy not loaded' };

        const gradeIds = Object.keys(taxonomy.grades);
        let globalTotal = 0;
        let globalExplicit = 0;
        let globalPartial = 0;
        const gradeReports = [];

        // Pre-index entire search array for O(1) lookups globally (CRT-9)
        const indexedResources = new Map();
        if (Array.isArray(searchIndex)) {
            searchIndex.forEach(r => {
                if (!r.grade || !r.unit) return;
                const key = `${r.grade}_${r.unit}`;
                if (!indexedResources.has(key)) indexedResources.set(key, []);
                indexedResources.get(key).push(r);
            });
        }

        gradeIds.forEach(gradeId => {
            const report = this.calculateGradeCoverage(gradeId, indexedResources, curriculumId);
            globalTotal += report.totalOutcomes;
            globalExplicit += report.explicitlyCovered;
            globalPartial += report.partiallyCovered;
            gradeReports.push(report);
        });

        // Skill coverage
        const skillIds = taxonomy.skills ? Object.keys(taxonomy.skills) : [];
        const skillReports = skillIds.map(s => this.calculateSkillCoverage(s, searchIndex));

        return {
            totalOutcomes: globalTotal,
            explicitlyCovered: globalExplicit,
            partiallyCovered: globalPartial,
            coveredOutcomes: globalExplicit + globalPartial, // Backwards compatibility
            percentage: globalTotal > 0 ? Math.round((globalExplicit / globalTotal) * 100) : 0,
            totalResources: Array.isArray(searchIndex) ? searchIndex.length : 0,
            grades: gradeReports,
            skills: skillReports,
            generatedAt: new Date().toISOString()
        };
    }

    /* Helper: resolve skill name from Taxonomy */
    _getSkillName(skillId) {
        const taxonomy = (typeof window !== 'undefined' && window.Taxonomy) ? window.Taxonomy : null;
        if (taxonomy && taxonomy.skills && taxonomy.skills[skillId]) {
            return taxonomy.skills[skillId];
        }
        return skillId.charAt(0).toUpperCase() + skillId.slice(1);
    }
}

/* --------------------------------------------------------------------------
   EXPORTS & GLOBAL BINDINGS
   -------------------------------------------------------------------------- */
const curriculumRegistry = new CurriculumRegistry();
const outcomeMapper = new OutcomeMapper(curriculumRegistry);
const coverageTracker = new CoverageTracker(curriculumRegistry, outcomeMapper);

if (typeof window !== 'undefined') {
    window.CurriculumEngine = {
        Registry: curriculumRegistry,
        Mapper: outcomeMapper,
        Coverage: coverageTracker
    };
}

if (typeof module !== 'undefined') {
    module.exports = { CurriculumRegistry, OutcomeMapper, CoverageTracker };
}
