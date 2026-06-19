/* exam-generator.js */

let state = {
    examType: 'written', // written, listening, speaking
    grade: '',
    unit: '',
    selectedOutcomes: [], // Array of outcome objects {code, description}
    generatedQuestions: [] // Array of question objects
};

document.addEventListener('DOMContentLoaded', () => {
    // Check if Taxonomy is ready
    if (!window.Taxonomy || !window.Taxonomy.grades) {
        console.error("Taxonomy not loaded.");
        return;
    }
    initExamGenerator();
    renderSavedExams();
});

function initExamGenerator() {
    const gradeSelect = document.getElementById('select-grade');
    gradeSelect.innerHTML = '<option value="">-- Choose Grade --</option>';
    
    // Sort grades by number
    const grades = Object.keys(window.Taxonomy.grades).sort((a, b) => {
        let numA = parseInt(a.replace('grade-', '')) || 0;
        let numB = parseInt(b.replace('grade-', '')) || 0;
        return numA - numB;
    });

    grades.forEach(g => {
        let opt = document.createElement('option');
        opt.value = g;
        // Format name nicely
        opt.textContent = `Grade ${g.replace('grade-', '')}`;
        gradeSelect.appendChild(opt);
    });
}

function switchTab(tabName) {
    document.getElementById('tab-generate').classList.remove('active');
    document.getElementById('tab-saved').classList.remove('active');
    document.getElementById('view-generate').style.display = 'none';
    document.getElementById('view-saved').style.display = 'none';

    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`view-${tabName}`).style.display = 'block';

    if (tabName === 'saved') {
        renderSavedExams();
    }
}

function setExamType(type) {
    state.examType = type;
    document.getElementById('subtab-written').classList.remove('active');
    document.getElementById('subtab-listening').classList.remove('active');
    document.getElementById('subtab-speaking').classList.remove('active');
    document.getElementById(`subtab-${type}`).classList.add('active');
    loadOutcomes(); // Reload outcomes when tab changes to filter by skill
}

function loadUnits() {
    const gradeVal = document.getElementById('select-grade').value;
    state.grade = gradeVal;
    state.unit = '';
    
    const unitSelect = document.getElementById('select-unit');
    unitSelect.innerHTML = '<option value="">-- Choose Unit --</option>';
    
    const selectOutcome = document.getElementById('select-outcome');
    const btnAdd = document.getElementById('btn-add-outcome');
    
    selectOutcome.innerHTML = '<option value="">-- Choose Unit First --</option>';
    selectOutcome.disabled = true;
    btnAdd.disabled = true;
    
    if (!gradeVal) {
        unitSelect.disabled = true;
        return;
    }

    unitSelect.disabled = false;
    const gradeData = window.Taxonomy.units[gradeVal] || [];
    
    gradeData.forEach(u => {
        let opt = document.createElement('option');
        opt.value = u.code;
        opt.textContent = `${u.code.toUpperCase()} - ${u.name}`;
        unitSelect.appendChild(opt);
    });
}

function loadOutcomes() {
    const unitVal = document.getElementById('select-unit').value;
    state.unit = unitVal;
    
    const selectOutcome = document.getElementById('select-outcome');
    const btnAdd = document.getElementById('btn-add-outcome');
    
    if (!unitVal) {
        selectOutcome.innerHTML = '<option value="">-- Choose Unit First --</option>';
        selectOutcome.disabled = true;
        btnAdd.disabled = true;
        return;
    }

    const gradeData = window.Taxonomy.units[state.grade] || [];
    const unitData = gradeData.find(u => u.code === unitVal);
    
    selectOutcome.innerHTML = '';
    
    if (!unitData || !unitData.outcomes || unitData.outcomes.length === 0) {
        selectOutcome.innerHTML = '<option value="">No outcomes found for this unit.</option>';
        selectOutcome.disabled = true;
        btnAdd.disabled = true;
        return;
    }

    let filteredOutcomes = unitData.outcomes.filter(out => {
        if (state.examType === 'written') {
            return out.skill === 'reading' || out.skill === 'writing' || out.skill === 'other';
        } else if (state.examType === 'listening') {
            return out.skill === 'listening';
        } else if (state.examType === 'speaking') {
            return out.skill === 'speaking';
        }
        return true;
    });

    if (filteredOutcomes.length === 0) {
        selectOutcome.innerHTML = `<option value="">No ${state.examType} outcomes found in this unit.</option>`;
        selectOutcome.disabled = true;
        btnAdd.disabled = true;
        return;
    }

    selectOutcome.disabled = false;
    btnAdd.disabled = false;
    selectOutcome.innerHTML = '<option value="">-- Choose Outcome --</option>';
    
    window._currentFilteredOutcomes = filteredOutcomes;

    filteredOutcomes.forEach(out => {
        let opt = document.createElement('option');
        opt.value = out.code;
        
        // Make the skill clear in the dropdown
        let skillLabel = '';
        if (out.skill === 'reading') skillLabel = '[Reading] ';
        else if (out.skill === 'writing') skillLabel = '[Writing] ';
        else if (out.skill === 'listening') skillLabel = '[Listening] ';
        else if (out.skill === 'speaking') skillLabel = '[Speaking] ';
        
        opt.textContent = `${skillLabel}${out.code}: ${out.description.substring(0, 90)}...`;
        selectOutcome.appendChild(opt);
    });
}

function addOutcomeFromDropdown() {
    const select = document.getElementById('select-outcome');
    const code = select.value;
    if (!code) return;
    
    const out = window._currentFilteredOutcomes.find(o => o.code === code);
    if (!out) return;
    
    const exists = state.selectedOutcomes.some(o => o.code === code);
    if (!exists) {
        state.selectedOutcomes.push({ code: out.code, description: out.description });
        renderBasket();
    }
    
    select.value = '';
}

function toggleOutcome(code, description) {
    const idx = state.selectedOutcomes.findIndex(o => o.code === code);
    if (idx > -1) {
        state.selectedOutcomes.splice(idx, 1);
    } else {
        state.selectedOutcomes.push({ code, description });
    }
    renderBasket();
}

function removeOutcome(code) {
    const idx = state.selectedOutcomes.findIndex(o => o.code === code);
    if (idx > -1) {
        state.selectedOutcomes.splice(idx, 1);
    }
    renderBasket();
}

function renderBasket() {
    const basketList = document.getElementById('basket-list');
    const btnGenerate = document.getElementById('btn-generate-exam');
    
    if (state.selectedOutcomes.length === 0) {
        basketList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0;">No outcomes selected yet.</p>';
        btnGenerate.style.display = 'none';
        return;
    }
    
    basketList.innerHTML = '';
    state.selectedOutcomes.forEach(out => {
        let div = document.createElement('div');
        div.className = 'basket-item';
        div.innerHTML = `
            <span><strong>${out.code}</strong>: ${out.description.substring(0, 70)}...</span>
            <button class="remove-btn" onclick="removeOutcome('${out.code}')">✕</button>
        `;
        basketList.appendChild(div);
    });
    
    btnGenerate.style.display = 'block';
}

function generateExam() {
    state.generatedQuestions = [];
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';
    
    let typeName = state.examType === 'written' ? 'Written Question' : state.examType === 'listening' ? 'Listening Task' : 'Speaking Prompt';

    state.selectedOutcomes.forEach((out, i) => {
        let qText = `Sample ${typeName} for ${out.code}: Assess the student's ability to "${out.description}". Please write an appropriate response.`;
        let aText = `Sample Answer Key for Q${i+1}: The student successfully demonstrates the outcome by completing the task with expected accuracy.`;
        
        state.generatedQuestions.push({
            id: i + 1,
            outcomeCode: out.code,
            question: qText,
            answer: aText
        });
        
        let qCard = document.createElement('div');
        qCard.className = 'question-card';
        qCard.innerHTML = `
            <div class="q-outcome-code">${out.code}</div>
            <p style="margin-bottom: 0;"><strong>Q${i+1}:</strong> ${qText}</p>
        `;
        questionsList.appendChild(qCard);
    });
    
    document.getElementById('generated-area').style.display = 'block';
    
    // Scroll to generated area
    document.getElementById('generated-area').scrollIntoView({ behavior: 'smooth' });
}

function buildHtmlTemplate(title, bodyContent) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
        h1 { border-bottom: 2px solid #2563eb; padding-bottom: 10px; color: #1e293b; }
        .question { margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .outcome { font-size: 12px; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${bodyContent}
    <div class="footer">Generated by English Galaxy Academy Exam Generator</div>
</body>
</html>`;
}

function downloadZip() {
    if (typeof JSZip === 'undefined') {
        alert("JSZip library is not loaded. Cannot generate ZIP.");
        return;
    }
    
    let zip = new JSZip();
    let gradeLabel = state.grade.replace('-', '_');
    let examTitle = `English_Galaxy_${state.examType.toUpperCase()}_Exam_${gradeLabel}`;
    
    let examBody = state.generatedQuestions.map(q => `
        <div class="question">
            <div class="outcome">${q.outcomeCode}</div>
            <p><strong>Question ${q.id}:</strong> ${q.question}</p>
            <br><br><br> <!-- Space for student to write -->
        </div>
    `).join('');
    
    let answerBody = state.generatedQuestions.map(q => `
        <div class="question">
            <div class="outcome">${q.outcomeCode}</div>
            <p><strong>Answer ${q.id}:</strong> ${q.answer}</p>
        </div>
    `).join('');
    
    let displayTitle = `Grade ${state.grade.replace('grade-', '')} - ${state.examType.charAt(0).toUpperCase() + state.examType.slice(1)} Exam`;

    zip.file("exam_paper.html", buildHtmlTemplate(`${displayTitle} - Student Paper`, examBody));
    zip.file("answer_key.html", buildHtmlTemplate(`${displayTitle} - Answer Key`, answerBody));
    
    zip.generateAsync({type:"blob"}).then(function(content) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${examTitle}.zip`;
        link.click();
    });
}function saveExam() {
    if (state.generatedQuestions.length === 0) return;
    
    let nameInput = document.getElementById('exam-name-input').value.trim();
    if (!nameInput) {
        nameInput = `Grade ${state.grade.replace('grade-', '')} - Unit ${state.unit.toUpperCase()} Exam`;
    }
    
    const examData = {
        id: 'exam_' + Date.now(),
        name: nameInput,
        date: new Date().toLocaleDateString(),
        type: state.examType,
        grade: state.grade,
        unit: state.unit,
        outcomesCount: state.selectedOutcomes.length,
        questions: state.generatedQuestions
    };
    
    let saved = JSON.parse(localStorage.getItem('savedExams') || '[]');
    saved.push(examData);
    localStorage.setItem('savedExams', JSON.stringify(saved));
    
    alert('Exam saved to your profile successfully!');
    document.getElementById('exam-name-input').value = '';
    renderSavedExams();
    switchTab('saved'); // Auto switch to saved tab
}

function renderSavedExams() {
    const tbody = document.getElementById('saved-exams-list');
    let saved = JSON.parse(localStorage.getItem('savedExams') || '[]');
    
    if (saved.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 16px; color: var(--text-muted);">You haven't saved any exams yet.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    
    // Sort descending by ID (newest first)
    saved.sort((a, b) => b.id.localeCompare(a.id));
    
    saved.forEach(exam => {
        let tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        let typeName = exam.type === 'written' ? 'Written' : exam.type === 'listening' ? 'Listening' : 'Speaking';
        let gradeName = `Grade ${exam.grade.replace('grade-', '')}`;
        let examName = exam.name || `Unit ${exam.unit.toUpperCase()} Exam`;
        
        tr.innerHTML = `
            <td style="padding: 16px;">${typeName}</td>
            <td style="padding: 16px;">${gradeName}</td>
            <td style="padding: 16px; font-weight: 500;">${examName}</td>
            <td style="padding: 16px;">${exam.date}</td>
            <td style="padding: 16px;">
                <button class="btn btn-outline" style="min-height: 32px; padding: 4px 10px; font-size: 0.85rem; margin-right: 4px;" onclick="previewSavedExam('${exam.id}')">👁️ Preview</button>
                <button class="btn btn-primary" style="min-height: 32px; padding: 4px 10px; font-size: 0.85rem; margin-right: 4px;" onclick="redownloadExam('${exam.id}')">📥 Download</button>
                <button class="btn btn-outline" style="min-height: 32px; padding: 4px 10px; font-size: 0.85rem; border-color: var(--error); color: var(--error);" onclick="deleteSavedExam('${exam.id}')" title="Delete">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function previewSavedExam(examId) {
    let saved = JSON.parse(localStorage.getItem('savedExams') || '[]');
    let exam = saved.find(e => e.id === examId);
    if (!exam) return;
    
    const previewContent = document.getElementById('preview-content');
    const previewTitle = document.getElementById('preview-title');
    
    previewTitle.textContent = exam.name || `Exam Preview`;
    
    let html = exam.questions.map(q => `
        <div style="margin-bottom: var(--space-md); padding: var(--space-md); border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-surface);">
            <div style="font-size: 0.8rem; color: var(--primary); font-weight: bold; margin-bottom: var(--space-xs);">${q.outcomeCode}</div>
            <p style="margin: 0;"><strong>Question ${q.id}:</strong> ${q.question}</p>
        </div>
    `).join('');
    
    previewContent.innerHTML = html;
    document.getElementById('preview-modal').showModal();
}

function redownloadExam(examId) {
    let saved = JSON.parse(localStorage.getItem('savedExams') || '[]');
    let exam = saved.find(e => e.id === examId);
    if (!exam) return;
    
    // Temporarily overwrite state to use existing downloadZip logic
    let oldState = JSON.parse(JSON.stringify(state));
    state.examType = exam.type;
    state.grade = exam.grade;
    state.generatedQuestions = exam.questions;
    
    downloadZip();
    
    // Restore state
    state = oldState;
}

function deleteSavedExam(examId) {
    if (!confirm('Are you sure you want to delete this saved exam?')) return;
    
    let saved = JSON.parse(localStorage.getItem('savedExams') || '[]');
    saved = saved.filter(e => e.id !== examId);
    localStorage.setItem('savedExams', JSON.stringify(saved));
    renderSavedExams();
}
