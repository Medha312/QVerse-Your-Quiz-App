// Simple Quiz App - HTML/CSS/JS only
// Domains: Sports, History, Geography, Geopolitics, Science & Tech, Literature & Entertainment
// Difficulties: Beginner (5), Intermediate (10), Advanced (15)

(function () {
  const DIFFICULTY_DEFAULT_COUNT = {
    Beginner: 5,
    Intermediate: 10,
    Advanced: 15,
  };

  const QUESTION_SECONDS = 15;

  const domainToFile = {
    sports: 'public/data/sports.json',
    history: 'public/data/history.json',
    geography: 'public/data/geography.json',
    geopolitics: 'public/data/geopolitics.json',
    sciencetech: 'public/data/sciencetech.json',
    literatureentertainment: 'public/data/literatureentertainment.json',
  };

  // State
  const state = {
    domain: 'sports',
    difficulty: 'Beginner',
    count: 5,
    showTimer: true,
    questions: [],
    index: 0,
    answers: [], // { chosenIndex, correctIndex, isCorrect, timeTaken }
    remainingSeconds: 30,
    timerId: null,
    startedAt: 0,
    finishedAt: 0,
  };

  // Elements
  const $setup = document.getElementById('view-domain');
  const $viewDomain = document.getElementById('view-domain');
  const $viewDifficulty = document.getElementById('view-difficulty');
  const $viewPlay = document.getElementById('view-play');
  const $viewReady = document.getElementById('view-ready');
  const $quiz = document.getElementById('view-quiz');
  const $results = document.getElementById('view-results');
  const $review = document.getElementById('view-review');

  const $domainChips = document.getElementById('domain-chips');
  const $difficultyChips = document.getElementById('difficulty-chips');
  const $toDifficultyBtn = document.getElementById('to-difficulty-btn');
  const $toPlayBtn = document.getElementById('to-play-btn');
  const $playStartBtn = document.getElementById('play-start-btn');
  const $backDomainBtn = document.getElementById('back-domain-btn');
  const $backDifficultyBtn = document.getElementById('back-difficulty-btn');
  const $readyCount = document.getElementById('ready-count');

  const $progress = document.getElementById('progress');
  const $progressFill = document.getElementById('progress-fill');
  const $timer = document.getElementById('timer');
  const $timerText = document.getElementById('timer-text');
  const $questionText = document.getElementById('question-text');
  const $options = document.getElementById('options');
  const $feedback = document.getElementById('feedback');
  const $prevBtn = document.getElementById('prev-btn');
  const $nextBtn = document.getElementById('next-btn');

  const $score = document.getElementById('score');
  const $accuracy = document.getElementById('accuracy');
  const $time = document.getElementById('time');
  const $accuracyBar = document.getElementById('accuracy-bar');
  const $resultQuote = document.getElementById('result-quote');
  const $confettiCanvas = document.getElementById('confetti-canvas');
  const $reviewBtn = document.getElementById('review-btn');
  const $restartBtn = document.getElementById('restart-btn');
  const $homeBtn = document.getElementById('home-btn');
  const $reviewHomeBtn = document.getElementById('review-home-btn');
  const $reviewList = document.getElementById('review-list');

  // Utils
  function shuffleInPlace(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function switchView(id) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function setDefaultCount() {
    // With chips, no manual count control; count inferred at start
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (!state.showTimer) return;
    state.remainingSeconds = QUESTION_SECONDS;
    if ($timerText) $timerText.textContent = String(state.remainingSeconds);
    $timer.classList.remove('hidden');
    const start = Date.now();
    state.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remain = clamp(QUESTION_SECONDS - elapsed, 0, QUESTION_SECONDS);
      state.remainingSeconds = remain;
      if ($timerText) $timerText.textContent = String(remain);
      const circumference = 2 * Math.PI * 18; // r=18
      const dashoffset = circumference * (1 - remain / QUESTION_SECONDS);
      const fg = document.querySelector('.timer-fg');
      if (fg) fg.style.strokeDashoffset = String(dashoffset);
      if (remain <= 0) {
        stopTimer();
        // If no answer chosen yet, mark as incorrect and advance
        const current = state.answers[state.index];
        if (!current || current.chosenIndex == null) {
          recordAnswer(-1); // no answer selected
          goNext();
        }
      }
    }, 250);
  }

  async function loadQuestions(domain, difficulty, count) {
    const file = domainToFile[domain];
    if (!file) throw new Error('Unknown domain');
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load questions');
    const data = await res.json();
    const filtered = data.questions.filter(q => q.difficulty === difficulty);
    shuffleInPlace(filtered);
    return filtered.slice(0, count);
  }

  function renderQuestion() {
    const q = state.questions[state.index];
    $progress.textContent = `Question ${state.index + 1}/${state.questions.length}`;
    if ($progressFill) {
      const pct = Math.round((state.index) / state.questions.length * 100);
      $progressFill.style.width = `${pct}%`;
    }
    $questionText.textContent = q.question;
    $options.innerHTML = '';
    $feedback.textContent = '';

    const recorded = state.answers[state.index];

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.textContent = opt;
      btn.addEventListener('click', () => onChoose(idx));
      // If answered, lock styling
      if (recorded) {
        btn.disabled = true;
        if (idx === recorded.correctIndex) btn.classList.add('correct');
        if (recorded.chosenIndex === idx && !recorded.isCorrect) btn.classList.add('incorrect');
      }
      $options.appendChild(btn);
    });

    $prevBtn.disabled = state.index === 0;
    $nextBtn.textContent = state.index === state.questions.length - 1 ? 'Finish' : 'Next';

    if (state.showTimer) startTimer(); else $timer.classList.add('hidden');
  }

  function onChoose(chosenIndex) {
    recordAnswer(chosenIndex);
    // update UI feedback
    const recorded = state.answers[state.index];
    const optionButtons = Array.from($options.children);
    optionButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === recorded.correctIndex) btn.classList.add('correct');
      if (idx === recorded.chosenIndex && !recorded.isCorrect) btn.classList.add('incorrect');
      if (idx === recorded.chosenIndex) btn.classList.add(recorded.isCorrect ? 'flash' : 'flash');
    });
    $feedback.textContent = recorded.isCorrect ? 'Correct!' : 'Incorrect';
    stopTimer();
  }

  function recordAnswer(chosenIndex) {
    const q = state.questions[state.index];
    const correctIndex = q.correctIndex;
    const isCorrect = chosenIndex === correctIndex;
    const timeTaken = state.showTimer ? QUESTION_SECONDS - state.remainingSeconds : 0;

    state.answers[state.index] = {
      chosenIndex,
      correctIndex,
      isCorrect,
      timeTaken,
    };
  }

  function goPrev() {
    stopTimer();
    if (state.index > 0) {
      state.index -= 1;
      renderQuestion();
    }
  }

  function goNext() {
    stopTimer();
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      if ($progressFill) $progressFill.style.width = '100%';
      finishQuiz();
    }
  }

  function startQuiz() {
    state.index = 0;
    state.answers = [];
    state.startedAt = Date.now();
    state.finishedAt = 0;
    document.body.classList.add('theme-quiz');
    switchView('view-quiz');
    renderQuestion();
  }

  function finishQuiz() {
    state.finishedAt = Date.now();
    const total = state.questions.length;
    const correct = state.answers.filter(a => a && a.isCorrect).length;
    const durationSec = Math.round((state.finishedAt - state.startedAt) / 1000);

    $score.textContent = `${correct} / ${total}`;
    $accuracy.textContent = `${Math.round((correct / total) * 100)}%`;
    $time.textContent = `${durationSec}s`;
    const pct = Math.round((correct / total) * 100);
    if ($accuracyBar) $accuracyBar.style.width = `${pct}%`;

    // Quotes by tier
    let quote = 'Great job!';
    let tierClass = 'good';
    if (pct === 100) { quote = 'Legend! Flawless victory!'; tierClass = 'perfect'; }
    else if (pct >= 80) { quote = 'Awesome! Keep the streak!'; tierClass = 'great'; }
    else if (pct >= 50) { quote = 'Nice! Level up with a new category!'; tierClass = 'good'; }
    else { quote = 'Learn more and keep trying!'; tierClass = 'try'; }
    if ($resultQuote) {
      $resultQuote.className = `result-quote ${tierClass}`;
      $resultQuote.textContent = quote;
    }

    switchView('view-results');
    document.body.classList.remove('theme-quiz');

    // Confetti on perfect score
    if (pct === 100 && $confettiCanvas) {
      runConfetti($confettiCanvas, 1200);
    }
  }

  // Simple confetti (canvas)
  function runConfetti(canvas, durationMs) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const colors = ['#f472b6', '#8b5cf6', '#22d3ee', '#f59e0b', '#10b981'];
    const pieces = Array.from({ length: 180 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H,
      r: 4 + Math.random() * 6,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
    }));
    let start = performance.now();
    let stopRequested = false;
    function stop() {
      stopRequested = true;
    }
    // stop when user clicks any main action
    const stopHandlers = [
      document.getElementById('review-btn'),
      document.getElementById('restart-btn'),
      document.getElementById('home-btn'),
    ];
    stopHandlers.forEach(el => el && el.addEventListener('click', stop, { once: true }));
    function frame(ts) {
      const elapsed = ts - start;
      ctx.clearRect(0, 0, W, H);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
      });
      if (!stopRequested) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, W, H);
        canvas.width = 0; canvas.height = 0;
      }
    }
    requestAnimationFrame(frame);
  }

  function renderReview() {
    $reviewList.innerHTML = '';
    state.questions.forEach((q, i) => {
      const a = state.answers[i];
      const item = document.createElement('div');
      item.className = 'review-item';
      const chosen = a && a.chosenIndex != null ? q.options[a.chosenIndex] : 'No answer';
      const correct = q.options[q.correctIndex];
      item.innerHTML = `
        <div class="review-q">Q${i + 1}. ${q.question}</div>
        <div class="review-a">Your answer: ${chosen}</div>
        <div class="review-a">Correct answer: ${correct}</div>
        ${q.explanation ? `<div class="review-a">Explanation: ${q.explanation}</div>` : ''}
      `;
      $reviewList.appendChild(item);
    });
  }

  // Event wiring
  // Chip selection handlers
  function selectChip(grid, chipEl) {
    Array.from(grid.querySelectorAll('.chip')).forEach(c => c.classList.remove('selected'));
    chipEl.classList.add('selected');
  }

  $domainChips.addEventListener('click', (e) => {
    const target = e.target.closest('.chip');
    if (!target) return;
    selectChip($domainChips, target);
    state.domain = target.dataset.domain;
    $toDifficultyBtn.disabled = false;
  });

  $difficultyChips.addEventListener('click', (e) => {
    const target = e.target.closest('.chip');
    if (!target) return;
    selectChip($difficultyChips, target);
    state.difficulty = target.dataset.difficulty;
    $toPlayBtn.disabled = false;
  });
  $playStartBtn.addEventListener('click', async () => {
    try {
      state.showTimer = true; // always on as requested
      state.count = DIFFICULTY_DEFAULT_COUNT[state.difficulty] || 5;
      // Show ready screen countdown then load/start
      switchView('view-ready');
      let c = 3;
      if ($readyCount) $readyCount.textContent = String(c);
      const readyInt = setInterval(async () => {
        c -= 1;
        if (c > 0) {
          if ($readyCount) $readyCount.textContent = String(c);
        } else {
          clearInterval(readyInt);
          const questions = await loadQuestions(state.domain, state.difficulty, state.count);
          if (questions.length === 0) {
            alert('No questions available for this selection.');
            switchView('view-difficulty');
            return;
          }
          if (questions.length < state.count) {
            alert(`Only ${questions.length} questions available. Starting with those.`);
          }
          state.questions = questions;
          startQuiz();
        }
      }, 800);
    } catch (err) {
      console.error(err);
      alert('Failed to load questions. Check console and data files.');
    }
  });

  $prevBtn.addEventListener('click', goPrev);
  $nextBtn.addEventListener('click', () => {
    // If not answered yet, require an answer or allow skip?
    const recorded = state.answers[state.index];
    if (!recorded) {
      if (!confirm('No answer selected. Skip this question?')) return;
      recordAnswer(-1);
    }
    goNext();
  });

  $reviewBtn.addEventListener('click', () => {
    switchView('view-review');
    renderReview();
  });

  $restartBtn.addEventListener('click', () => {
    // restart with same settings
    switchView('view-domain');
  });
  $homeBtn.addEventListener('click', () => switchView('view-domain'));
  $reviewHomeBtn.addEventListener('click', () => switchView('view-domain'));

  // Navigation between setup screens
  $toDifficultyBtn.addEventListener('click', () => switchView('view-difficulty'));
  $backDomainBtn.addEventListener('click', () => switchView('view-domain'));
  $toPlayBtn.addEventListener('click', () => switchView('view-play'));
  $backDifficultyBtn.addEventListener('click', () => switchView('view-difficulty'));

  // Initialize defaults
  state.showTimer = true;
})();


