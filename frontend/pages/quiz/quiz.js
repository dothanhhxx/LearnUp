/**
 * Quiz Page — Dynamic vocabulary quiz from user's library
 */

// ─── Quiz State ──────────────────────────────────────────────────────────────
let _generatedQuizzes = [];   // array of generated quiz objects
let _quizIdCounter = 0;       // for unique quiz IDs

/**
 * Attach all quiz page events
 */
function attachQuizEvents() {
    // Navigation & Common UI
    const navLinks = {
        'nav-quiz-articles': 'articles',
        'nav-quiz-library': 'vocabulary',
        'nav-quiz-dashboard': 'user-dashboard',
        'quiz-to-articles': 'articles',
        'quiz-back-to-articles': 'articles',
        'result-finish-btn': 'articles',
    };

    Object.entries(navLinks).forEach(([id, view]) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                animateTransition(view);
            });
        }
    });

    // Create Quiz Buttons
    document.querySelectorAll('.quiz-create-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const count = parseInt(btn.dataset.count);
            createQuizFromLibrary(count);
        });
    });

    // Quiz Controls
    const nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', handleNextStep);
    }

    const exitBtn = document.getElementById('quiz-exit-btn');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            const modal = document.getElementById('quiz-exit-modal');
            if (modal) modal.classList.add('show');
        });
    }

    // Modal Actions
    const exitCancel = document.getElementById('quiz-exit-cancel');
    if (exitCancel) {
        exitCancel.addEventListener('click', () => {
            const modal = document.getElementById('quiz-exit-modal');
            if (modal) modal.classList.remove('show');
        });
    }

    const exitConfirm = document.getElementById('quiz-exit-confirm');
    if (exitConfirm) {
        exitConfirm.addEventListener('click', () => {
            const modal = document.getElementById('quiz-exit-modal');
            if (modal) modal.classList.remove('show');
            showQuizView('selection');
        });
    }

    const retryBtn = document.getElementById('result-retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (AppState.currentQuiz) {
                startQuiz(AppState.currentQuiz.id);
            }
        });
    }

    // Render existing quiz cards (if any from this session)
    renderQuizCards();
}

// ─── Create Quiz from Library ─────────────────────────────────────────────────

/**
 * Fetch user's vocabulary and generate a quiz with the specified word count
 */
async function createQuizFromLibrary(wordCount) {
    const errorEl = document.getElementById('quiz-create-error');

    // Hide previous error
    if (errorEl) errorEl.style.display = 'none';

    // Show loading on the clicked button
    const btn = document.querySelector(`.quiz-create-btn[data-count="${wordCount}"]`);
    const originalHTML = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading…';
    }

    try {
        const response = await fetchVocabularyAPI();

        if (!response.success || !response.data) {
            throw new Error('Failed to load vocabulary.');
        }

        // Filter words that have definitions
        const wordsWithDef = response.data.filter(v =>
            v.definition && v.definition.trim() &&
            v.definition !== 'No definition found.' &&
            v.definition !== 'Không tìm thấy trong từ điển.'
        );

        // Check if user has enough words
        if (wordsWithDef.length < wordCount) {
            if (errorEl) {
                errorEl.textContent = `You need at least ${wordCount} words with definitions in your library. Currently you have ${wordsWithDef.length} word${wordsWithDef.length !== 1 ? 's' : ''}.`;
                errorEl.style.display = 'block';
            }
            return;
        }

        // Randomly select words
        const selectedWords = shuffleArray([...wordsWithDef]).slice(0, wordCount);

        // Generate quiz questions
        const questions = selectedWords.map(wordObj => {
            const correctAnswer = wordObj.definition;

            // Pick 3 wrong answers from OTHER selected words (not the current one)
            const otherWords = selectedWords.filter(w => w.id !== wordObj.id);
            const wrongAnswers = shuffleArray(otherWords)
                .slice(0, 3)
                .map(w => w.definition);

            // If we somehow don't have 3 other words, pad with remaining library words
            if (wrongAnswers.length < 3) {
                const extraWords = wordsWithDef.filter(w =>
                    w.id !== wordObj.id && !wrongAnswers.includes(w.definition)
                );
                const needed = 3 - wrongAnswers.length;
                shuffleArray(extraWords).slice(0, needed).forEach(w => {
                    wrongAnswers.push(w.definition);
                });
            }

            // Combine and shuffle all options
            const allOptions = [correctAnswer, ...wrongAnswers];
            const shuffledOptions = shuffleArray(allOptions);
            const correctIndex = shuffledOptions.indexOf(correctAnswer);

            // Build explanation
            let explanation = `'${wordObj.word}' means ${wordObj.definition}.`;
            if (wordObj.example && wordObj.example.trim()) {
                explanation += ` Example: ${wordObj.example}`;
            }

            return {
                question: `What is the meaning of '${wordObj.word}'?`,
                options: shuffledOptions,
                correct: correctIndex,
                explanation: explanation
            };
        });

        // Create quiz object
        _quizIdCounter++;
        const quizId = `quiz_gen_${_quizIdCounter}_${Date.now()}`;
        const estimatedTime = Math.max(1, Math.ceil(wordCount * 0.5));

        const quiz = {
            id: quizId,
            title: `Vocabulary Quiz (${wordCount} words)`,
            category: 'Library',
            wordCount: wordCount,
            duration: `${estimatedTime} mins`,
            createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            questions: questions
        };

        _generatedQuizzes.unshift(quiz); // Add to top
        renderQuizCards();

        // Clear error
        if (errorEl) errorEl.style.display = 'none';

    } catch (err) {
        console.error('Create quiz error:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'Failed to create quiz. Please try again.';
            errorEl.style.display = 'block';
        }
    } finally {
        // Restore button
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
}

// ─── Render Quiz Cards ────────────────────────────────────────────────────────

/**
 * Render all generated quiz cards in the selection grid
 */
function renderQuizCards() {
    const container = document.getElementById('quiz-list-container');
    if (!container) return;

    if (_generatedQuizzes.length === 0) {
        container.innerHTML = `
            <div class="quiz-empty-state">
                <i class="fa-regular fa-clipboard" style="font-size: 40px; color: #cbd5e1; margin-bottom: 16px;"></i>
                <p style="font-size: 15px; color: #94a3b8; font-weight: 500;">No quizzes yet.</p>
                <p style="font-size: 13px; color: #cbd5e1;">Create your first quiz above!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = _generatedQuizzes.map(quiz => `
        <div class="quiz-card" data-quiz-id="${quiz.id}">
            <div class="quiz-card-top-actions">
                <button class="quiz-delete-btn" data-quiz-id="${quiz.id}" title="Delete quiz">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
            <span class="category-tag">${quiz.category}</span>
            <h3>${quiz.title}</h3>
            <p>${quiz.questions.length} multiple-choice questions from your library.</p>
            <div class="quiz-card-footer">
                <div class="quiz-card-meta">
                    <span><i class="fa-regular fa-clock"></i> ${quiz.duration}</span>
                    <span><i class="fa-solid fa-layer-group"></i> ${quiz.wordCount} words</span>
                </div>
                <i class="fa-solid fa-arrow-right" style="color: #3b82f6;"></i>
            </div>
        </div>
    `).join('');

    // Attach click events for starting quiz
    container.querySelectorAll('.quiz-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't start quiz if clicking delete button
            if (e.target.closest('.quiz-delete-btn')) return;
            const quizId = card.dataset.quizId;
            startQuiz(quizId);
        });
    });

    // Attach delete events
    container.querySelectorAll('.quiz-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteQuiz(btn.dataset.quizId);
        });
    });
}

/**
 * Delete a quiz card with animation
 */
function deleteQuiz(quizId) {
    const card = document.querySelector(`.quiz-card[data-quiz-id="${quizId}"]`);
    if (card) {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
    }

    setTimeout(() => {
        _generatedQuizzes = _generatedQuizzes.filter(q => q.id !== quizId);
        renderQuizCards();
    }, 300);
}

// ─── Quiz Gameplay ────────────────────────────────────────────────────────────

/**
 * Start a specific quiz
 */
function startQuiz(quizId) {
    const quiz = _generatedQuizzes.find(q => q.id === quizId);
    if (!quiz) return;

    AppState.currentQuiz = quiz;
    AppState.quizActiveQuestion = 0;
    AppState.quizScore = 0;

    showQuizView('active');
    renderQuestion();
}

/**
 * Render current question
 */
function renderQuestion() {
    const quiz = AppState.currentQuiz;
    const qIndex = AppState.quizActiveQuestion;
    const question = quiz.questions[qIndex];

    // Update UI
    document.getElementById('current-q-index').textContent = qIndex + 1;
    document.getElementById('total-q-count').textContent = quiz.questions.length;
    document.getElementById('quiz-question-text').textContent = question.question;

    // Progress Bar
    const progress = ((qIndex) / quiz.questions.length) * 100;
    document.getElementById('quiz-progress-fill').style.width = `${progress}%`;

    // Hide Explanation
    const explanationBox = document.getElementById('quiz-explanation-box');
    if (explanationBox) {
        explanationBox.classList.remove('show');
    }

    // Options
    const optionsList = document.getElementById('quiz-options-list');
    optionsList.innerHTML = '';

    question.options.forEach((opt, index) => {
        const div = document.createElement('div');
        div.className = 'quiz-option';
        div.innerHTML = `<span>${escapeHtmlQuiz(opt)}</span><i class="fa-regular fa-circle"></i>`;
        div.addEventListener('click', () => selectOption(div, index));
        optionsList.appendChild(div);
    });

    // Reset Button
    const nextBtn = document.getElementById('quiz-next-btn');
    nextBtn.textContent = 'Check Answer';
    nextBtn.disabled = true;
    nextBtn.dataset.state = 'check';
}

/**
 * Handle option selection
 */
function selectOption(el, index) {
    const nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn.dataset.state !== 'check') return;

    // Clear previous selection
    document.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
    
    el.classList.add('selected');
    AppState.selectedOptionIndex = index;
    nextBtn.disabled = false;
}

/**
 * Handle Check Answer / Next Question
 */
function handleNextStep() {
    const nextBtn = document.getElementById('quiz-next-btn');
    const quiz = AppState.currentQuiz;
    const question = quiz.questions[AppState.quizActiveQuestion];

    if (nextBtn.dataset.state === 'check') {
        // Validation logic
        const options = document.querySelectorAll('.quiz-option');
        const correctIndex = question.correct;
        const selectedIndex = AppState.selectedOptionIndex;

        options.forEach((opt, idx) => {
            opt.classList.remove('selected');
            if (idx === correctIndex) {
                opt.classList.add('correct');
                opt.querySelector('i').className = 'fa-solid fa-circle-check';
            } else if (idx === selectedIndex) {
                opt.classList.add('wrong');
                opt.querySelector('i').className = 'fa-solid fa-circle-xmark';
            }
        });

        // Show Explanation
        const explanationBox = document.getElementById('quiz-explanation-box');
        const explanationText = document.getElementById('quiz-explanation-text');
        if (explanationBox && explanationText) {
            explanationText.textContent = question.explanation;
            explanationBox.classList.add('show');
        }

        if (selectedIndex === correctIndex) {
            AppState.quizScore++;
        }

        nextBtn.textContent = AppState.quizActiveQuestion < quiz.questions.length - 1 ? 'Next Question' : 'Show Results';
        nextBtn.dataset.state = 'next';
    } else {
        // Move to next question or finish
        if (AppState.quizActiveQuestion < quiz.questions.length - 1) {
            AppState.quizActiveQuestion++;
            renderQuestion();
        } else {
            showResults();
        }
    }
}

/**
 * Show final results
 */
function showResults() {
    showQuizView('result');
    
    const quiz = AppState.currentQuiz;
    const scorePercent = Math.round((AppState.quizScore / quiz.questions.length) * 100);
    
    document.getElementById('result-score-val').textContent = `${scorePercent}%`;
    
    // Animate ring
    const ring = document.getElementById('result-score-ring');
    const circumference = 439.8; // 2 * pi * 70
    const offset = circumference - (scorePercent / 100) * circumference;
    
    setTimeout(() => {
        ring.style.strokeDashoffset = offset;
    }, 100);

    // Message
    const msgEl = document.getElementById('result-message');
    const subEl = document.getElementById('result-sub');

    if (scorePercent === 100) {
        msgEl.textContent = "Perfect Score! 🏆";
        subEl.textContent = "You have a complete mastery of this topic. Amazing work!";
    } else if (scorePercent >= 70) {
        msgEl.textContent = "Great Job! 🌟";
        subEl.textContent = "You've shown strong understanding. Keep it up!";
    } else {
        msgEl.textContent = "Good Effort! 💪";
        subEl.textContent = "Practice makes perfect. Why not try again?";
    }
}

/**
 * Helper to switch between quiz views
 */
function showQuizView(view) {
    const views = ['selection', 'active', 'result'];
    views.forEach(v => {
        const el = document.getElementById(`quiz-view-${v}`);
        if (el) el.style.display = (v === view) ? 'block' : 'none';
    });
}

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Simple HTML escape for quiz content
 */
function escapeHtmlQuiz(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
