// ===== DOM要素の取得 =====
const setupScreen = document.getElementById("setup-screen");
const resultScreen = document.getElementById("result-screen");

const colsInput = document.getElementById("cols");
const rowsInput = document.getElementById("rows");
const studentCountInput = document.getElementById("student-count");
const maxSeatsEl = document.getElementById("max-seats");
const studentLabelEl = document.getElementById("student-label");
const todayLabelEl = document.getElementById("today-label");

const shuffleBtn = document.getElementById("shuffle-btn");
const reshuffleBtn = document.getElementById("reshuffle-btn");
const backBtn = document.getElementById("back-btn");

const seatGrid = document.getElementById("seat-grid");
const resultMessage = document.querySelector(".result-message");

// ===== 状態管理 =====
let studentCount = 30;
let cols = 6;
let rows = 5;

// ===== 最大席数・生徒数ラベルの更新 =====
function updateInfo() {
  cols = Math.max(1, Math.min(10, parseInt(colsInput.value) || 1));
  rows = Math.max(1, Math.min(10, parseInt(rowsInput.value) || 1));
  studentCount = Math.max(1, parseInt(studentCountInput.value) || 1);

  const max = cols * rows;
  maxSeatsEl.textContent = max;
  studentLabelEl.textContent = studentCount;

  // 生徒数が席数を超えたら赤く表示
  if (studentCount > max) {
    studentCountInput.style.borderColor = "#e74c3c";
  } else {
    studentCountInput.style.borderColor = "";
  }
}

// ===== 黒板の日付を今日にする =====
function updateTodayLabel() {
  if (!todayLabelEl) return;

  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  todayLabelEl.textContent = `${month}月${date}日`;
}

// ===== 空席位置を後ろの両端から均等に決定 =====
function getEmptyPositions(rows, cols, emptyCount) {
  const empties = new Set();
  let remaining = emptyCount;

  // 最後の行から前に向かって処理
  for (let r = rows - 1; r >= 0 && remaining > 0; r--) {
    let left = 0;
    let right = cols - 1;
    let pickLeft = true;

    // この行の両端から交互に空席を配置
    while (left <= right && remaining > 0) {
      const pos = r * cols + (pickLeft ? left : right);
      empties.add(pos);
      remaining--;

      if (pickLeft) left++;
      else right--;
      pickLeft = !pickLeft;
    }
  }

  return empties;
}

// ===== 出席番号の配列を生成 =====
function createStudentNumbers(count) {
  const numbers = [];
  for (let i = 1; i <= count; i++) {
    numbers.push(i);
  }
  return numbers;
}

// ===== 配列シャッフル（Fisher-Yates） =====
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ===== 演出用ユーティリティ =====
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearEffects() {
  document.querySelectorAll(".countdown-pop, .complete-banner").forEach((el) => el.remove());

  if (resultMessage) {
    resultMessage.classList.remove("show");
  }
}

function showCountdown(number) {
  const countdown = document.createElement("div");
  countdown.className = "countdown-pop";
  countdown.textContent = number;
  countdown.setAttribute("aria-hidden", "true");
  resultScreen.appendChild(countdown);

  setTimeout(() => countdown.remove(), 760);
}

function showCompleteEffect() {
  const banner = document.createElement("div");
  banner.className = "complete-banner";
  banner.textContent = "席替え完了！";
  banner.setAttribute("aria-live", "polite");
  resultScreen.appendChild(banner);

  setTimeout(() => banner.remove(), 1800);

  if (resultMessage) {
    resultMessage.classList.add("show");
  }
}

// ===== シャッフル結果の座席配列を作る =====
function buildSeatLayout(shuffledNumbers) {
  const totalSeats = cols * rows;
  const emptyCount = totalSeats - shuffledNumbers.length;
  const empties = getEmptyPositions(rows, cols, emptyCount);

  // 座席配列: null=空席, 数字=出席番号
  const layout = new Array(totalSeats).fill(null);
  let numIdx = 0;
  for (let i = 0; i < totalSeats; i++) {
    if (!empties.has(i)) {
      layout[i] = shuffledNumbers[numIdx];
      numIdx++;
    }
  }
  return layout;
}

// ===== シャッフルアニメーション =====
async function animateShuffle(layout, callback) {
  const totalSeats = cols * rows;

  clearEffects();

  // まず全席を「？」の机カードにする
  seatGrid.innerHTML = "";
  seatGrid.classList.toggle("dense-seats", totalSeats >= 64);
  seatGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  seatGrid.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
  seatGrid.style.setProperty("--cols", cols);
  seatGrid.style.setProperty("--rows", rows);

  const seats = [];
  for (let i = 0; i < totalSeats; i++) {
    const seat = document.createElement("div");
    seat.classList.add("seat", "shuffling", "question-card");
    seat.textContent = "?";
    seatGrid.appendChild(seat);
    seats.push(seat);
  }

  await sleep(500);

  // 発表前に、見ている人が一緒に盛り上がれるカウントダウンを出す。
  for (const number of ["3", "2", "1"]) {
    showCountdown(number);
    await sleep(700);
  }

  revealSeats(seats, layout, callback);
}

// ===== 席カードを順番に公開 =====
function revealSeats(seats, layout, callback) {
  let maxDelay = 0;

  for (let r = 0; r < rows; r++) {
    const rowStart = r * cols;

    for (let c = 0; c < cols; c++) {
      const idx = rowStart + c;
      const seat = seats[idx];
      const delay = seats.length >= 64 ? r * 70 + c * 25 : r * 160 + c * 50;
      maxDelay = Math.max(maxDelay, delay);

      setTimeout(() => {
        seat.classList.remove("shuffling", "question-card");
        seat.classList.add(layout[idx] === null ? "empty" : "occupied", "flip-reveal");
        seat.textContent = layout[idx] === null ? "空席" : `${layout[idx]}番`;
      }, delay);
    }
  }

  setTimeout(() => {
    showCompleteEffect();
    if (callback) callback();
  }, maxDelay + 700);
}

// ===== 画面切り替え =====
function showScreen(screen) {
  setupScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

// ===== 席替え実行 =====
function doShuffle() {
  cols = Math.max(1, Math.min(10, parseInt(colsInput.value) || 1));
  rows = Math.max(1, Math.min(10, parseInt(rowsInput.value) || 1));
  studentCount = Math.max(1, parseInt(studentCountInput.value) || 1);
  const max = cols * rows;

  // バリデーション
  if (studentCount > max) {
    alert(`生徒数（${studentCount}人）が席数（${max}席）より多いです。\n生徒数を減らすか、座席数を増やしてください。`);
    return;
  }

  const numbers = createStudentNumbers(studentCount);
  const shuffledNumbers = shuffleArray(numbers);
  const layout = buildSeatLayout(shuffledNumbers);

  // 結果画面へ
  showScreen(resultScreen);

  // ボタンを一時無効化
  reshuffleBtn.disabled = true;
  backBtn.disabled = true;

  // アニメーション付きシャッフル
  animateShuffle(layout, () => {
    reshuffleBtn.disabled = false;
    backBtn.disabled = false;
  });
}

// ===== 再シャッフル =====
function doReshuffle() {
  const numbers = createStudentNumbers(studentCount);
  const shuffledNumbers = shuffleArray(numbers);
  const layout = buildSeatLayout(shuffledNumbers);

  reshuffleBtn.disabled = true;
  backBtn.disabled = true;

  animateShuffle(layout, () => {
    reshuffleBtn.disabled = false;
    backBtn.disabled = false;
  });
}

// ===== イベントリスナー =====
colsInput.addEventListener("input", updateInfo);
rowsInput.addEventListener("input", updateInfo);
studentCountInput.addEventListener("input", updateInfo);

shuffleBtn.addEventListener("click", doShuffle);
reshuffleBtn.addEventListener("click", doReshuffle);
backBtn.addEventListener("click", () => showScreen(setupScreen));

// ===== 初期化 =====
updateTodayLabel();
updateInfo();
