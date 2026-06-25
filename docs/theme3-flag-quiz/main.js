// ===== グローバル変数 =====
let allQuizData = [];
let filteredQuiz = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let wrongList = [];
let selectedRegion = "all";
let selectedDifficulty = "all";

// ===== DOM要素 =====
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

// ===== 初期化 =====
async function init() {
  const res = await fetch("quiz.json");
  allQuizData = await res.json();

  setupFilterButtons();
  updateQuestionCount();

  document.getElementById("start-btn").addEventListener("click", startQuiz);
  document.getElementById("retry-btn").addEventListener("click", retryQuiz);
  document.getElementById("back-btn").addEventListener("click", backToTop);
  document.getElementById("home-btn").addEventListener("click", goHomeFromQuiz);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-ok").addEventListener("click", () => {
    closeModal();
    backToTop();
  });
  // 背景クリック / Escで閉じる
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// ===== フィルターボタンの設定 =====
function setupFilterButtons() {
  // 地域ボタン
  const regionBtns = document.querySelectorAll("#region-buttons .filter-btn");
  regionBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      regionBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedRegion = btn.dataset.value;
      updateQuestionCount();
    });
  });

  // 難易度ボタン
  const diffBtns = document.querySelectorAll("#difficulty-buttons .filter-btn");
  diffBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      diffBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedDifficulty = btn.dataset.value;
      updateQuestionCount();
    });
  });
}

// ===== 出題数の更新 =====
function updateQuestionCount() {
  const filtered = getFilteredQuiz();
  document.getElementById("count-number").textContent = filtered.length;
}

// ===== フィルター処理 =====
function getFilteredQuiz() {
  return allQuizData.filter(q => {
    const regionOk = selectedRegion === "all" || q.region === selectedRegion;
    const diffOk = selectedDifficulty === "all" || q.difficulty === Number(selectedDifficulty);
    return regionOk && diffOk;
  });
}

// ===== クイズ開始 =====
function startQuiz() {
  filteredQuiz = getFilteredQuiz();

  if (filteredQuiz.length === 0) {
    alert("この条件に合う問題がありません。条件を変えてみてください。");
    return;
  }

  // シャッフル（Fisher-Yates）
  for (let i = filteredQuiz.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filteredQuiz[i], filteredQuiz[j]] = [filteredQuiz[j], filteredQuiz[i]];
  }

  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  wrongList = [];

  document.getElementById("total-number").textContent = filteredQuiz.length;

  switchScreen(quizScreen);
  showQuestion();
}

// ===== 問題表示 =====
function showQuestion() {
  const q = filteredQuiz[currentIndex];

  // ヘッダー更新
  document.getElementById("current-number").textContent = currentIndex + 1;
  document.getElementById("score-correct").textContent = correctCount;
  document.getElementById("score-wrong").textContent = wrongCount;

  // プログレスバー
  const progress = (currentIndex / filteredQuiz.length) * 100;
  document.getElementById("progress-fill").style.width = progress + "%";

  // 国旗カード
  const flagCard = document.getElementById("flag-card");
  flagCard.style.animation = "none";
  flagCard.offsetHeight; // リフロー
  flagCard.style.animation = "card-appear 0.5s ease";

  document.getElementById("flag-image").src = q.image;
  document.getElementById("region-badge").textContent = q.region;

  const stars = "★".repeat(q.difficulty) + "☆".repeat(3 - q.difficulty);
  document.getElementById("difficulty-stars").textContent = stars;

  // 選択肢
  const choiceBtns = document.querySelectorAll(".choice-btn");
  choiceBtns.forEach((btn, i) => {
    btn.textContent = q.choices[i];
    btn.className = "choice-btn";
    btn.onclick = () => handleAnswer(i);
  });
}

// ===== 回答処理 =====
function handleAnswer(selectedIndex) {
  const q = filteredQuiz[currentIndex];
  const isCorrect = selectedIndex === q.correctIndex;
  const choiceBtns = document.querySelectorAll(".choice-btn");

  // ボタン状態更新
  choiceBtns.forEach((btn, i) => {
    btn.classList.add("disabled");
    if (i === q.correctIndex) {
      btn.classList.add(isCorrect ? "correct" : "show-correct");
    }
    if (i === selectedIndex && !isCorrect) {
      btn.classList.add("wrong");
    }
  });

  if (isCorrect) {
    correctCount++;
    showResultOverlay("○", "正解！", q.country, true);
    spawnConfetti();
  } else {
    wrongCount++;
    wrongList.push({
      image: q.image,
      country: q.country,
      yourAnswer: q.choices[selectedIndex]
    });
    showResultOverlay("×", "残念…", `正解は ${q.country}`, false);
  }

  // 次の問題へ（1.5秒後）
  setTimeout(() => {
    hideResultOverlay();
    currentIndex++;
    if (currentIndex < filteredQuiz.length) {
      showQuestion();
    } else {
      showResults();
    }
  }, 1500);
}

// ===== 正解・不正解オーバーレイ =====
function showResultOverlay(icon, text, answer, isCorrect) {
  const overlay = document.getElementById("result-overlay");
  const iconEl = document.getElementById("result-icon");
  iconEl.textContent = icon;
  iconEl.style.color = isCorrect ? "#5fc996" : "#f47080";
  document.getElementById("result-text").textContent = text;
  document.getElementById("result-text").style.color = isCorrect ? "#2ecc71" : "#e74c3c";
  document.getElementById("result-answer").textContent = answer;
  overlay.classList.add("show");
}

function hideResultOverlay() {
  document.getElementById("result-overlay").classList.remove("show");
}

// ===== キラキラエフェクト =====
function spawnConfetti() {
  const colors = ["#f1c40f", "#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#e67e22"];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = Math.random() * 100 + "vw";
    el.style.top = "-10px";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = (Math.random() * 8 + 5) + "px";
    el.style.height = (Math.random() * 8 + 5) + "px";
    el.style.animationDuration = (Math.random() * 1 + 1) + "s";
    el.style.animationDelay = (Math.random() * 0.5) + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

// ===== 結果表示 =====
function showResults() {
  const total = filteredQuiz.length;
  const pct = Math.round((correctCount / total) * 100);

  document.getElementById("final-correct").textContent = correctCount;
  document.getElementById("final-total").textContent = total;
  document.getElementById("score-percentage").textContent = pct + "%";

  // ランク判定
  let rank = "";
  if (pct === 100) rank = "パーフェクト！国旗マスター";
  else if (pct >= 80) rank = "凄い！国旗博士";
  else if (pct >= 60) rank = "なかなかやるね";
  else if (pct >= 40) rank = "もう少し！";
  else rank = "沢山覚えよう！";
  document.getElementById("score-rank").textContent = rank;

  // タイトル
  if (pct === 100) {
    document.getElementById("result-title").textContent = "完璧！";
  } else if (pct >= 80) {
    document.getElementById("result-title").textContent = "お見事！";
  } else {
    document.getElementById("result-title").textContent = "お疲れ様！";
  }

  // まちがえた問題リスト
  const wrongSection = document.getElementById("wrong-list-section");
  const wrongListEl = document.getElementById("wrong-list");
  wrongListEl.innerHTML = "";

  if (wrongList.length > 0) {
    wrongSection.style.display = "block";
    wrongList.forEach(w => {
      const item = document.createElement("div");
      item.className = "wrong-item";
      item.innerHTML = `
        <img src="${w.image}" alt="${w.country}">
        <div class="wrong-item-info">
          <div class="wrong-item-answer">正解: ${w.country}</div>
          <div class="wrong-item-yours">あなたの答え: ${w.yourAnswer}</div>
        </div>
      `;
      wrongListEl.appendChild(item);
    });
  } else {
    wrongSection.style.display = "none";
  }

  // プログレスバー100%
  document.getElementById("progress-fill").style.width = "100%";

  switchScreen(resultScreen);
}

// ===== リトライ =====
function retryQuiz() {
  startQuiz();
}

// ===== トップに戻る =====
function backToTop() {
  switchScreen(startScreen);
}

// ===== クイズ中にホームへ戻る（確認モーダル） =====
function goHomeFromQuiz() {
  openModal();
}

function openModal() {
  document.getElementById("modal-overlay").classList.add("show");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("show");
}

// ===== 画面切り替え =====
function switchScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
  window.scrollTo(0, 0);
}

// ===== 起動 =====
init();
