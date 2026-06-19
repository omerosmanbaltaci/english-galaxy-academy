let currentQuestionIndex = 0;
let score = 0;

const mockQuestions = [
    { q: "What is the correct meaning of this unit's key concept?", options: ["Option A", "Option B", "Option C"], correct: 0 },
    { q: "Choose the correct spelling:", options: ["Wendsday", "Wednesday", "Wensday"], correct: 1 },
    { q: "Which one matches the learning outcome?", options: ["Incorrect", "Correct Answer", "Wrong"], correct: 1 }
];

function openUnitQuiz() {
    document.getElementById('quiz-modal').style.display = 'flex';
    currentQuestionIndex = 0;
    score = 0;
    renderQuestion();
}

function closeUnitQuiz() {
    document.getElementById('quiz-modal').style.display = 'none';
}

function renderQuestion() {
    if (currentQuestionIndex >= mockQuestions.length) {
        document.getElementById('quiz-content').innerHTML = `
            <div style="text-align: center;">
                <h2>Quiz Completed! 🎉</h2>
                <p style="font-size: 1.2rem; margin: 1rem 0;">Your score: <strong>${score} / ${mockQuestions.length}</strong></p>
                <button class="btn btn-primary" onclick="closeUnitQuiz()" style="margin-top: 1rem;">Back to Unit</button>
            </div>
        `;
        return;
    }

    const q = mockQuestions[currentQuestionIndex];
    let optionsHtml = '';
    q.options.forEach((opt, idx) => {
        optionsHtml += `<button class="quiz-option-btn" onclick="checkAnswer(${idx})">${opt}</button>`;
    });

    document.getElementById('quiz-content').innerHTML = `
        <h3 style="margin-bottom: 1rem;">Question ${currentQuestionIndex + 1} of ${mockQuestions.length}</h3>
        <p style="font-size: 1.2rem; margin-bottom: 1.5rem;">${q.q}</p>
        <div class="quiz-options">
            ${optionsHtml}
        </div>
    `;
}

function checkAnswer(selectedIndex) {
    const q = mockQuestions[currentQuestionIndex];
    if (selectedIndex === q.correct) {
        score++;
    }
    currentQuestionIndex++;
    renderQuestion();
}
