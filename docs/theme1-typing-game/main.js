// ===== かな → ローマ字マッピング（複数入力パターン対応） =====
const KANA_MAP = {
  // 基本
  "あ": ["a"], "い": ["i"], "う": ["u"], "え": ["e"], "お": ["o"],
  "か": ["ka"], "き": ["ki"], "く": ["ku"], "け": ["ke"], "こ": ["ko"],
  "さ": ["sa"], "し": ["shi", "si"], "す": ["su"], "せ": ["se"], "そ": ["so"],
  "た": ["ta"], "ち": ["chi", "ti"], "つ": ["tsu", "tu"], "て": ["te"], "と": ["to"],
  "な": ["na"], "に": ["ni"], "ぬ": ["nu"], "ね": ["ne"], "の": ["no"],
  "は": ["ha"], "ひ": ["hi"], "ふ": ["fu", "hu"], "へ": ["he"], "ほ": ["ho"],
  "ま": ["ma"], "み": ["mi"], "む": ["mu"], "め": ["me"], "も": ["mo"],
  "や": ["ya"], "ゆ": ["yu"], "よ": ["yo"],
  "ら": ["ra"], "り": ["ri"], "る": ["ru"], "れ": ["re"], "ろ": ["ro"],
  "わ": ["wa"], "を": ["wo"], "ん": ["nn", "n"],
  // 濁音
  "が": ["ga"], "ぎ": ["gi"], "ぐ": ["gu"], "げ": ["ge"], "ご": ["go"],
  "ざ": ["za"], "じ": ["ji", "zi"], "ず": ["zu"], "ぜ": ["ze"], "ぞ": ["zo"],
  "だ": ["da"], "ぢ": ["di"], "づ": ["du", "zu"], "で": ["de"], "ど": ["do"],
  "ば": ["ba"], "び": ["bi"], "ぶ": ["bu"], "べ": ["be"], "ぼ": ["bo"],
  "ぱ": ["pa"], "ぴ": ["pi"], "ぷ": ["pu"], "ぺ": ["pe"], "ぽ": ["po"],
  // 拗音
  "きゃ": ["kya"], "きゅ": ["kyu"], "きょ": ["kyo"],
  "しゃ": ["sha", "sya"], "しゅ": ["shu", "syu"], "しょ": ["sho", "syo"],
  "ちゃ": ["cha", "tya"], "ちゅ": ["chu", "tyu"], "ちょ": ["cho", "tyo"],
  "にゃ": ["nya"], "にゅ": ["nyu"], "にょ": ["nyo"],
  "ひゃ": ["hya"], "ひゅ": ["hyu"], "ひょ": ["hyo"],
  "みゃ": ["mya"], "みゅ": ["myu"], "みょ": ["myo"],
  "りゃ": ["rya"], "りゅ": ["ryu"], "りょ": ["ryo"],
  "ぎゃ": ["gya"], "ぎゅ": ["gyu"], "ぎょ": ["gyo"],
  "じゃ": ["ja", "zya"], "じゅ": ["ju", "zyu"], "じょ": ["jo", "zyo"],
  "びゃ": ["bya"], "びゅ": ["byu"], "びょ": ["byo"],
  "ぴゃ": ["pya"], "ぴゅ": ["pyu"], "ぴょ": ["pyo"],
  // カタカナ（よく使うもの）
  "ア": ["a"], "イ": ["i"], "ウ": ["u"], "エ": ["e"], "オ": ["o"],
  "カ": ["ka"], "キ": ["ki"], "ク": ["ku"], "ケ": ["ke"], "コ": ["ko"],
  "サ": ["sa"], "シ": ["shi", "si"], "ス": ["su"], "セ": ["se"], "ソ": ["so"],
  "タ": ["ta"], "チ": ["chi", "ti"], "ツ": ["tsu", "tu"], "テ": ["te"], "ト": ["to"],
  "ナ": ["na"], "ニ": ["ni"], "ヌ": ["nu"], "ネ": ["ne"], "ノ": ["no"],
  "ハ": ["ha"], "ヒ": ["hi"], "フ": ["fu", "hu"], "ヘ": ["he"], "ホ": ["ho"],
  "マ": ["ma"], "ミ": ["mi"], "ム": ["mu"], "メ": ["me"], "モ": ["mo"],
  "ヤ": ["ya"], "ユ": ["yu"], "ヨ": ["yo"],
  "ラ": ["ra"], "リ": ["ri"], "ル": ["ru"], "レ": ["re"], "ロ": ["ro"],
  "ワ": ["wa"], "ヲ": ["wo"], "ン": ["nn", "n"],
  "ガ": ["ga"], "ギ": ["gi"], "グ": ["gu"], "ゲ": ["ge"], "ゴ": ["go"],
  "ザ": ["za"], "ジ": ["ji", "zi"], "ズ": ["zu"], "ゼ": ["ze"], "ゾ": ["zo"],
  "ダ": ["da"], "デ": ["de"], "ド": ["do"],
  "バ": ["ba"], "ビ": ["bi"], "ブ": ["bu"], "ベ": ["be"], "ボ": ["bo"],
  "パ": ["pa"], "ピ": ["pi"], "プ": ["pu"], "ペ": ["pe"], "ポ": ["po"],
  // 伸ばし棒
  "ー": ["-"],
};

// ===== 日本語をかなチャンク（入力単位）に分解 =====
function parseKana(japanese) {
  const chunks = [];
  let i = 0;
  while (i < japanese.length) {
    // 促音（っ/ッ）: 次の文字の子音を重ねる
    if (i < japanese.length - 1 && (japanese[i] === "っ" || japanese[i] === "ッ")) {
      const nextChar = japanese[i + 1];
      // 拗音チェック（次の次の文字が小さいや/ゆ/よ）
      let nextChunk = "";
      if (i + 2 < japanese.length && "ゃゅょャュョ".includes(japanese[i + 2])) {
        nextChunk = japanese[i + 1] + japanese[i + 2];
        i += 3;
      } else {
        nextChunk = japanese[i + 1];
        i += 2;
      }
      const nextOptions = KANA_MAP[nextChunk] || [nextChunk];
      // 促音は次の子音を重ねる
      const options = nextOptions.map(r => r[0] + r);
      chunks.push({ kana: "っ" + nextChunk, options: options });
      continue;
    }

    // 拗音チェック（2文字セット）
    if (i + 1 < japanese.length) {
      const pair = japanese[i] + japanese[i + 1];
      if (KANA_MAP[pair]) {
        chunks.push({ kana: pair, options: KANA_MAP[pair] });
        i += 2;
        continue;
      }
    }

    // 通常の1文字
    const ch = japanese[i];
    if (KANA_MAP[ch]) {
      chunks.push({ kana: ch, options: KANA_MAP[ch] });
    } else {
      // マッピングにない文字はそのまま（英数字など）
      chunks.push({ kana: ch, options: [ch.toLowerCase()] });
    }
    i++;
  }
  return chunks;
}

// ===== 画面の要素を取得 =====
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");

const japaneseEl = document.getElementById("japanese");
const romajiEl = document.getElementById("romaji");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const timerBar = document.getElementById("timer-bar");
const feedbackEl = document.getElementById("feedback");
const finalScoreEl = document.getElementById("final-score");
const resultMessage = document.getElementById("result-message");

// ===== ゲームの設定 =====
const GAME_TIME = 60;

// ===== ゲームの状態 =====
let score = 0;
let timeLeft = GAME_TIME;
let timerInterval = null;
let currentWord = null;
let chunks = [];       // 現在の単語のかなチャンク配列
let chunkIndex = 0;    // 今どのチャンクを入力中か
let inputBuffer = "";  // 現在のチャンク内で入力済みの文字
let confirmedRomaji = "";  // 確定済みのローマ字（表示用）
let usedIndexes = [];

// ===== 効果音（Web Audio API） =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = frequency;
  gain.gain.value = 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playCorrectSound() {
  playSound(880, 0.1, "sine");
}

function playMissSound() {
  playSound(200, 0.15, "square");
}

function playWordCompleteSound() {
  playSound(660, 0.08, "sine");
  setTimeout(() => playSound(880, 0.08, "sine"), 60);
  setTimeout(() => playSound(1100, 0.12, "sine"), 120);
}

// ===== 画面切り替え =====
function showScreen(screen) {
  startScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

// ===== 単語をランダムに選ぶ =====
function getNextWord() {
  if (usedIndexes.length >= words.length) {
    usedIndexes = [];
  }
  let index;
  do {
    index = Math.floor(Math.random() * words.length);
  } while (usedIndexes.includes(index));
  usedIndexes.push(index);
  return words[index];
}

// ===== ローマ字表示を更新 =====
function updateRomajiDisplay() {
  let html = "";

  // 確定済み部分（タイプ済み）
  for (const ch of confirmedRomaji) {
    html += `<span class="typed">${ch}</span>`;
  }

  // 現在入力中のチャンク
  if (chunkIndex < chunks.length) {
    const chunk = chunks[chunkIndex];
    // 「ん」は状況に応じた表示オプションを使う
    let displayOption;
    if (isNWaiting(chunk)) {
      if (inputBuffer.length === 0) {
        displayOption = getNDisplayOption(chunkIndex);
      } else {
        // バッファが "n" の待機中 → 入力中の表示を合わせる
        displayOption = getNDisplayOption(chunkIndex);
      }
    } else {
      displayOption = getDisplayOption(chunk.options, inputBuffer);
    }

    for (let i = 0; i < displayOption.length; i++) {
      if (i < inputBuffer.length) {
        html += `<span class="typed">${displayOption[i]}</span>`;
      } else if (i === inputBuffer.length) {
        html += `<span class="current">${displayOption[i]}</span>`;
      } else {
        html += `<span class="remaining">${displayOption[i]}</span>`;
      }
    }
  }

  // 残りのチャンク
  for (let i = chunkIndex + 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    // 「ん」は状況に応じた表示オプションを使う
    let option;
    if (isNWaiting(chunk)) {
      option = getNDisplayOption(i);
    } else {
      option = chunk.options[0];
    }
    for (const ch of option) {
      html += `<span class="remaining">${ch}</span>`;
    }
  }

  romajiEl.innerHTML = html;
}

// 入力バッファにマッチするオプションの中で表示用に最適なものを返す
function getDisplayOption(options, buffer) {
  if (buffer.length === 0) return options[0];

  // バッファに前方一致するオプションを探す
  const matching = options.filter(opt => opt.startsWith(buffer));
  if (matching.length > 0) return matching[0];

  return options[0];
}

// 「ん」チャンクの表示用オプションを決定する
// 次のチャンクが n で始まらなければ "n"、始まるなら "nn" を返す
function getNDisplayOption(chunkIdx) {
  if (chunkIdx + 1 < chunks.length) {
    const next = chunks[chunkIdx + 1];
    if (!next.options.some(opt => opt.startsWith("n"))) {
      return "n";
    }
  }
  return "nn"; // 最後のチャンク or 次が n 始まり → nn 必須
}

// ===== 新しい単語を表示 =====
function showNewWord() {
  currentWord = getNextWord();
  chunks = parseKana(currentWord.japanese);
  chunkIndex = 0;
  inputBuffer = "";
  confirmedRomaji = "";

  japaneseEl.textContent = currentWord.japanese;
  updateRomajiDisplay();

  japaneseEl.classList.remove("pop");
  void japaneseEl.offsetWidth;
  japaneseEl.classList.add("pop");
}

// ===== フィードバック表示 =====
function showFeedback(text, type) {
  feedbackEl.textContent = text;
  feedbackEl.className = "feedback " + type;
  setTimeout(() => {
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
  }, 500);
}

// ===== タイマー更新 =====
function updateTimer() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  const percent = (timeLeft / GAME_TIME) * 100;
  timerBar.style.width = percent + "%";
  if (timeLeft <= 10) {
    timerBar.classList.add("warning");
  }
  if (timeLeft <= 0) {
    endGame();
  }
}


// ===== 「ん」待機中かどうかを判定 =====
function isNWaiting(chunk) {
  return chunk.options.includes("n") && chunk.options.includes("nn");
}

// ===== チャンク確定の共通処理 =====
function confirmChunk(romaji) {
  confirmedRomaji += romaji;
  inputBuffer = "";
  chunkIndex++;
  if (chunkIndex >= chunks.length) {
    score++;
    scoreEl.textContent = score;
    playWordCompleteSound();
    showFeedback("OK!", "correct");
    showNewWord();
    return true; // 単語完成
  }
  return false;
}

// ===== 次のチャンクに文字を送る =====
function forwardToNextChunk(typed) {
  if (chunkIndex >= chunks.length) {
    updateRomajiDisplay();
    return;
  }
  const nextChunk = chunks[chunkIndex];
  if (nextChunk.options.includes(typed)) {
    // 1文字で次チャンク完成
    if (!confirmChunk(typed)) {
      playCorrectSound();
      updateRomajiDisplay();
    }
  } else if (nextChunk.options.some(opt => opt.startsWith(typed))) {
    inputBuffer = typed;
    playCorrectSound();
    updateRomajiDisplay();
  } else {
    // 次のチャンクにもマッチしない → ミス
    updateRomajiDisplay();
    playMissSound();
    showFeedback("MISS", "miss");
    romajiEl.classList.remove("shake");
    void romajiEl.offsetWidth;
    romajiEl.classList.add("shake");
  }
}

// ===== キー入力の処理 =====
function handleKeyPress(e) {
  if (!currentWord || chunkIndex >= chunks.length) return;
  const typed = e.key;
  if (typed.length !== 1) return; // 特殊キーは無視

  const chunk = chunks[chunkIndex];
  const newBuffer = inputBuffer + typed;

  // === 「ん」特殊処理: バッファが "n" で待機中の場合 ===
  if (inputBuffer === "n" && isNWaiting(chunk)) {
    if (typed === "n") {
      // "nn" で ん を確定
      playCorrectSound();
      if (!confirmChunk("nn")) {
        updateRomajiDisplay();
      }
    } else {
      // "n" 単体で ん を確定し、今の文字を次のチャンクへ
      playCorrectSound();
      confirmChunk("n");
      forwardToNextChunk(typed);
    }
    return;
  }

  // 完全一致チェック: バッファがいずれかのオプションと一致 → チャンク確定
  if (chunk.options.includes(newBuffer)) {
    // 「ん」の "n" は確定せず待機（次の文字で nn か n か判定する）
    if (newBuffer === "n" && isNWaiting(chunk)) {
      inputBuffer = "n";
      playCorrectSound();
      updateRomajiDisplay();
      return;
    }

    playCorrectSound();
    if (!confirmChunk(newBuffer)) {
      updateRomajiDisplay();
    }
    return;
  }

  // 前方一致チェック: バッファがいずれかのオプションの先頭に一致 → 入力継続
  const hasMatch = chunk.options.some(opt => opt.startsWith(newBuffer));
  if (hasMatch) {
    inputBuffer = newBuffer;
    playCorrectSound();
    updateRomajiDisplay();
    return;
  }

  // どれにもマッチしない → ミス
  playMissSound();
  showFeedback("MISS", "miss");
  romajiEl.classList.remove("shake");
  void romajiEl.offsetWidth;
  romajiEl.classList.add("shake");
}

// ===== スコアカウントアップアニメーション =====
function animateScore(target) {
  const duration = 1200; // アニメーション時間（ミリ秒）
  const start = performance.now();

  finalScoreEl.textContent = "0";

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);

    // イーズアウト（最初速く、だんだんゆっくり）
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);

    finalScoreEl.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // アニメーション完了時にポップ演出
      finalScoreEl.classList.remove("pop");
      void finalScoreEl.offsetWidth;
      finalScoreEl.classList.add("pop");
    }
  }

  requestAnimationFrame(update);
}

// ===== リザルトメッセージ =====
function getResultMessage(score) {
  if (score >= 20) return "すばらしい！タイピングマスター！";
  if (score >= 15) return "すごい！かなりの腕前です！";
  if (score >= 10) return "いい感じ！もっと速くなれる！";
  if (score >= 5) return "がんばりました！練習あるのみ！";
  return "まずはゆっくり正確に打ってみよう！";
}

// ===== ゲーム開始 =====
function startGame() {
  score = 0;
  timeLeft = GAME_TIME;
  usedIndexes = [];

  scoreEl.textContent = "0";
  timerEl.textContent = GAME_TIME;
  timerBar.style.width = "100%";
  timerBar.classList.remove("warning");
  feedbackEl.textContent = "";

  showScreen(gameScreen);
  showNewWord();

  timerInterval = setInterval(updateTimer, 1000);
  document.addEventListener("keydown", handleKeyPress);
}

// ===== ゲーム終了 =====
function endGame() {
  clearInterval(timerInterval);
  document.removeEventListener("keydown", handleKeyPress);
  currentWord = null;

  resultMessage.textContent = getResultMessage(score);
  showScreen(resultScreen);
  animateScore(score);
}

// ===== イベント登録 =====
startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);
