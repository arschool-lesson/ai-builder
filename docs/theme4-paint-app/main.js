// ===== 要素の取得 =====
const mainCanvas = document.getElementById('main-canvas');
const previewCanvas = document.getElementById('preview-canvas');
const canvasWrap = document.getElementById('canvas-wrap');
const ctx = mainCanvas.getContext('2d');
const pctx = previewCanvas.getContext('2d');

const sizeSlider = document.getElementById('size-slider');
const sizePreview = document.getElementById('size-preview');
const sizeValue = document.getElementById('size-value');
const customColor = document.getElementById('custom-color');
const fillShapeCheck = document.getElementById('fill-shape');
const cursorPos = document.getElementById('cursor-pos');
const canvasSizeEl = document.getElementById('canvas-size');

const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');

// ===== 状態管理 =====
let currentTool = 'pen';
let currentColor = '#1a1a2e';
let lineWidth = 4;
let isDrawing = false;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let strokePoints = [];   // ペンのスムージング用

// 履歴（undo / redo）
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// ===== キャンバスサイズ設定 =====
function resizeCanvas() {
  const area = document.querySelector('.canvas-area');
  const maxW = area.clientWidth - 32;
  const maxH = area.clientHeight - 48;

  const w = Math.min(maxW, 900);
  const h = Math.min(maxH, 640);

  // 現在の画像を保存
  let imageData = null;
  if (mainCanvas.width > 0 && mainCanvas.height > 0) {
    imageData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
  }

  mainCanvas.width = w;
  mainCanvas.height = h;
  previewCanvas.width = w;
  previewCanvas.height = h;

  // 白で塗りつぶし
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 保存していた画像を復元
  if (imageData) {
    ctx.putImageData(imageData, 0, 0);
  }

  canvasSizeEl.textContent = `${w} × ${h}`;
}

// ===== 履歴管理 =====
function saveState() {
  // 現在位置より先の履歴を削除
  history = history.slice(0, historyIndex + 1);
  // 新しい状態を保存
  history.push(mainCanvas.toDataURL());
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  historyIndex = history.length - 1;
  updateUndoRedoButtons();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreState(history[historyIndex]);
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreState(history[historyIndex]);
  }
}

function restoreState(dataURL) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.drawImage(img, 0, 0);
    updateUndoRedoButtons();
  };
  img.src = dataURL;
}

function updateUndoRedoButtons() {
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= history.length - 1;
}

// ===== マウス座標の取得 =====
function getPos(e) {
  const rect = mainCanvas.getBoundingClientRect();
  const scaleX = mainCanvas.width / rect.width;
  const scaleY = mainCanvas.height / rect.height;

  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

// ===== 描画 =====
function setupContext(context, tool) {
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (tool === 'eraser') {
    // 白で塗る方式（透明にすると塗りつぶしが誤動作するため）
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = '#ffffff';
    context.fillStyle = '#ffffff';
  } else {
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = currentColor;
    context.fillStyle = currentColor;
  }

  context.lineWidth = lineWidth;
}

// --- ペン / 消しゴム ---
function startPenDraw(pos) {
  setupContext(ctx, currentTool);
  lastX = pos.x;
  lastY = pos.y;
  strokePoints = [pos];

  if (currentTool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }
}

function penDraw(pos) {
  if (currentTool === 'eraser') {
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  } else {
    drawSmoothPen(pos);
  }
  lastX = pos.x;
  lastY = pos.y;
}

// --- ペン：中点ベジェ補間でなめらかな線 ---
function drawSmoothPen(pos) {
  strokePoints.push(pos);
  const n = strokePoints.length;

  if (n === 2) {
    // 最初の1区間は直線
    ctx.beginPath();
    ctx.moveTo(strokePoints[0].x, strokePoints[0].y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    return;
  }

  // 直前3点で二次ベジェ：中点から中点へ、制御点は真ん中の点
  const p0 = strokePoints[n - 3];
  const p1 = strokePoints[n - 2];
  const p2 = strokePoints[n - 1];
  const m1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const m2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  ctx.beginPath();
  ctx.moveTo(m1.x, m1.y);
  ctx.quadraticCurveTo(p1.x, p1.y, m2.x, m2.y);
  ctx.stroke();
}

// --- 図形プレビュー ---
function drawShapePreview(pos) {
  pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  setupContext(pctx, currentTool);
  pctx.setLineDash([6, 4]);

  const fill = fillShapeCheck.checked;

  if (currentTool === 'line') {
    pctx.beginPath();
    pctx.moveTo(startX, startY);
    pctx.lineTo(pos.x, pos.y);
    pctx.stroke();
  } else if (currentTool === 'rect') {
    const w = pos.x - startX;
    const h = pos.y - startY;
    if (fill) {
      pctx.fillRect(startX, startY, w, h);
    }
    pctx.strokeRect(startX, startY, w, h);
  } else if (currentTool === 'circle') {
    const rx = Math.abs(pos.x - startX) / 2;
    const ry = Math.abs(pos.y - startY) / 2;
    const cx = startX + (pos.x - startX) / 2;
    const cy = startY + (pos.y - startY) / 2;
    pctx.beginPath();
    pctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (fill) pctx.fill();
    pctx.stroke();
  }

  pctx.setLineDash([]);
}

// --- 図形を確定 ---
function commitShape(pos) {
  pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  setupContext(ctx, currentTool);

  const fill = fillShapeCheck.checked;

  if (currentTool === 'line') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  } else if (currentTool === 'rect') {
    const w = pos.x - startX;
    const h = pos.y - startY;
    if (fill) {
      ctx.fillRect(startX, startY, w, h);
    }
    ctx.strokeRect(startX, startY, w, h);
  } else if (currentTool === 'circle') {
    const rx = Math.abs(pos.x - startX) / 2;
    const ry = Math.abs(pos.y - startY) / 2;
    const cx = startX + (pos.x - startX) / 2;
    const cy = startY + (pos.y - startY) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (fill) ctx.fill();
    ctx.stroke();
  }
}

// --- ぬりつぶし（バケツ） ---
function floodFill(startX, startY) {
  const w = mainCanvas.width;
  const h = mainCanvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // 透明ピクセルを「白の上に置いた色」に変換して比較する
  // （消しゴムやアンチエイリアスの半透明でも正しく判定できる）
  function pixelColor(i) {
    const a = data[i + 3] / 255;
    return [
      data[i] * a + 255 * (1 - a),
      data[i + 1] * a + 255 * (1 - a),
      data[i + 2] * a + 255 * (1 - a)
    ];
  }

  // 開始ピクセルの色
  const idx = (Math.floor(startY) * w + Math.floor(startX)) * 4;
  const [targetR, targetG, targetB] = pixelColor(idx);

  // 塗る色をRGBに変換
  const fillRGB = hexToRGB(currentColor);

  // ほぼ同じ色なら何もしない
  if (Math.abs(targetR - fillRGB.r) < 4 &&
      Math.abs(targetG - fillRGB.g) < 4 &&
      Math.abs(targetB - fillRGB.b) < 4) {
    return;
  }

  const tolerance = 48;
  const stack = [[Math.floor(startX), Math.floor(startY)]];
  const visited = new Uint8Array(w * h);

  function matchColor(i) {
    const [r, g, b] = pixelColor(i);
    return Math.abs(r - targetR) <= tolerance &&
           Math.abs(g - targetG) <= tolerance &&
           Math.abs(b - targetB) <= tolerance;
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;

    const pixelIdx = y * w + x;
    if (visited[pixelIdx]) continue;

    const i = pixelIdx * 4;
    if (!matchColor(i)) continue;

    visited[pixelIdx] = 1;
    data[i] = fillRGB.r;
    data[i + 1] = fillRGB.g;
    data[i + 2] = fillRGB.b;
    data[i + 3] = 255;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// ===== イベントハンドラ =====
function onPointerDown(e) {
  e.preventDefault();
  const pos = getPos(e);
  isDrawing = true;
  startX = pos.x;
  startY = pos.y;

  if (currentTool === 'fill') {
    floodFill(pos.x, pos.y);
    saveState();
    isDrawing = false;
    return;
  }

  if (currentTool === 'pen' || currentTool === 'eraser') {
    startPenDraw(pos);
  }
}

function onPointerMove(e) {
  const pos = getPos(e);
  cursorPos.textContent = `x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`;

  if (!isDrawing) return;
  e.preventDefault();

  if (currentTool === 'pen' || currentTool === 'eraser') {
    penDraw(pos);
  } else {
    drawShapePreview(pos);
  }
}

function onPointerUp(e) {
  if (!isDrawing) return;
  isDrawing = false;

  if (currentTool === 'pen' || currentTool === 'eraser') {
    ctx.closePath();
  } else if (currentTool !== 'fill') {
    const pos = e.changedTouches ? getPos(e.changedTouches[0]) : getPos(e);
    commitShape(pos);
  }

  saveState();
}

// マウスイベント
mainCanvas.addEventListener('mousedown', onPointerDown);
mainCanvas.addEventListener('mousemove', onPointerMove);
mainCanvas.addEventListener('mouseup', onPointerUp);
mainCanvas.addEventListener('mouseleave', (e) => {
  if (isDrawing) onPointerUp(e);
});

// タッチイベント
mainCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
mainCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  onPointerMove(e);
}, { passive: false });
mainCanvas.addEventListener('touchend', (e) => {
  if (isDrawing) {
    isDrawing = false;
    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.closePath();
    } else if (currentTool !== 'fill') {
      const pos = getPos(e.changedTouches[0] || e);
      commitShape(pos);
    }
    saveState();
  }
});

// ===== ツール選択 =====
document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.tool-btn.active').classList.remove('active');
    btn.classList.add('active');
    currentTool = btn.dataset.tool;

    // カーソル変更
    if (currentTool === 'eraser') {
      canvasWrap.style.cursor = 'cell';
    } else if (currentTool === 'fill') {
      canvasWrap.style.cursor = 'crosshair';
    } else {
      canvasWrap.style.cursor = 'crosshair';
    }
  });
});

// ===== カラー選択 =====
document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelector('.color-swatch.active')?.classList.remove('active');
    swatch.classList.add('active');
    currentColor = swatch.dataset.color;
    customColor.value = currentColor;
    updateSizePreview();
  });
});

customColor.addEventListener('input', (e) => {
  currentColor = e.target.value;
  document.querySelector('.color-swatch.active')?.classList.remove('active');
  updateSizePreview();
});

// ===== サイズスライダー =====
sizeSlider.addEventListener('input', (e) => {
  lineWidth = parseInt(e.target.value);
  sizeValue.textContent = lineWidth + 'px';
  updateSizePreview();
});

function updateSizePreview() {
  const dotSize = Math.max(2, Math.min(lineWidth, 36));
  sizePreview.style.setProperty('--dot', dotSize + 'px');
  const dot = sizePreview.querySelector('::after') || sizePreview;
  sizePreview.innerHTML = '';
  const d = document.createElement('div');
  d.style.width = dotSize + 'px';
  d.style.height = dotSize + 'px';
  d.style.borderRadius = '50%';
  d.style.background = currentColor;
  sizePreview.appendChild(d);
}

// ===== ヘッダーボタン =====
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

clearBtn.addEventListener('click', () => {
  if (confirm('ぜんぶ消してもいいですか？')) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    saveState();
  }
});

saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'oekaki.png';
  link.href = mainCanvas.toDataURL('image/png');
  link.click();
});

// ===== キーボードショートカット =====
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveBtn.click();
  }
});

// ===== 初期化 =====
window.addEventListener('load', () => {
  resizeCanvas();
  saveState();       // 初期状態を履歴に保存
  updateSizePreview();
  updateUndoRedoButtons();
});

window.addEventListener('resize', resizeCanvas);
