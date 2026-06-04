/**
 * main.js — T 數獨 · Game Controller
 * State management, event handling, timer, storage, game loop
 */

/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */
let state = {
  solution:  [],
  puzzle:    [],
  userBoard: [],
  notes:     [],
  selected:  null,
  errors:    new Set(),
  notesMode: false,
  difficulty: 'easy',
  mistakeCount: 0,
  solved: false,
};

let timerSec = 0;
let timerInterval = null;

/* ═══════════════════════════════════════════════════════
   GAME INIT
═══════════════════════════════════════════════════════ */
function newGame(diff) {
  state.difficulty   = diff || state.difficulty;
  state.solution     = Engine.generateSolution();
  state.puzzle       = Engine.digHoles(state.solution, state.difficulty);
  state.userBoard    = Engine.cloneBoard(state.puzzle);
  state.notes        = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
  state.selected     = null;
  state.errors       = new Set();
  state.mistakeCount = 0;
  state.solved       = false;

  UI.renderBoard(state);
  resetTimer();
  startTimer();
  UI.updateStatus(state.errors, state.mistakeCount);
  saveToStorage();

  // Update difficulty buttons
  document.querySelectorAll('.diff-btn[data-diff]').forEach(b => {
    b.classList.toggle('active', b.dataset.diff === state.difficulty);
  });
  // Update timer diff label
  document.getElementById('timerDiff').textContent =
    { easy: '簡單', medium: '中等', hard: '困難' }[state.difficulty] || '';
}

/* ═══════════════════════════════════════════════════════
   INPUT
═══════════════════════════════════════════════════════ */
function inputNumber(n) {
  // Always play phone tone
  Audio.playKey(n);
  UI.rippleNumBtn(n);

  if (!state.selected) return;
  const [r, c] = state.selected;
  if (state.puzzle[r][c] !== 0) return; // given cell
  if (state.solved) return;

  if (state.notesMode && n !== 0) {
    if (state.userBoard[r][c] !== 0) return;
    if (state.notes[r][c].has(n)) state.notes[r][c].delete(n);
    else state.notes[r][c].add(n);
    UI.refreshAllCells(state);
    saveToStorage();
    return;
  }

  const prev = state.userBoard[r][c];
  state.userBoard[r][c] = n;
  if (n !== 0) state.notes[r][c].clear();

  const prevErrors = new Set(state.errors);
  state.errors = Engine.findErrors(state.puzzle, state.userBoard, state.solution);

  if (n !== 0) {
    const isErr = state.errors.has(`${r},${c}`);
    if (isErr) {
      if (!prevErrors.has(`${r},${c}`)) state.mistakeCount++;
      UI.flashCell(r, c, 'flash-error');
      Audio.playError();
    } else {
      UI.flashCell(r, c, 'flash-correct');
      Audio.playCorrect();
    }
  }

  UI.refreshAllCells(state);
  UI.updateStatus(state.errors, state.mistakeCount);
  saveToStorage();
  checkWin();
}

function selectCell(r, c) {
  state.selected = [r, c];
  UI.refreshAllCells(state);
}

/* ═══════════════════════════════════════════════════════
   WIN CHECK
═══════════════════════════════════════════════════════ */
function checkWin() {
  if (!Engine.isComplete(state.userBoard, state.errors)) return;
  setTimeout(() => {
    state.solved = true;
    stopTimer();
    Audio.playWin();
    const isRecord = saveRecord(state.difficulty, timerSec);
    UI.renderLeaderboard(getRecords());
    const msgs = ['太厲害了！完美完成！', '叻仔！無一個錯誤！', '出色嘅表現！', '完美！你係高手！'];
    UI.showWin(timerSec, msgs[Math.floor(Math.random() * msgs.length)], isRecord);
  }, 300);
}

/* ═══════════════════════════════════════════════════════
   HINT
═══════════════════════════════════════════════════════ */
function doHint() {
  Audio.playHint();
  if (!state.selected) {
    UI.showHintPopup('請先點選一個空格');
    return;
  }
  const [r, c] = state.selected;
  if (state.puzzle[r][c] !== 0) {
    UI.showHintPopup('呢格係題目已給嘅數字');
    return;
  }
  if (state.userBoard[r][c] === state.solution[r][c] && state.userBoard[r][c] !== 0) {
    UI.showHintPopup('呢格已經填對了 ✓');
    return;
  }
  const ans = state.solution[r][c];
  UI.showHintPopup(`第 ${r+1} 行・第 ${c+1} 列 → 答案係 ${ans}`);
  state.userBoard[r][c] = ans;
  state.notes[r][c].clear();
  state.errors = Engine.findErrors(state.puzzle, state.userBoard, state.solution);
  UI.refreshAllCells(state);
  UI.updateStatus(state.errors, state.mistakeCount);
  saveToStorage();
  checkWin();
}

/* ═══════════════════════════════════════════════════════
   SOLVE ANIMATION
═══════════════════════════════════════════════════════ */
function doSolveAnimation() {
  if (state.solved) return;
  stopTimer();
  const steps = Engine.getSolveSteps(state.puzzle, state.userBoard);
  if (steps.length === 0) {
    UI.showHintPopup('棋盤已完成！');
    return;
  }
  UI.animateSolve(
    steps,
    (step) => {
      state.userBoard[step.r][step.c] = step.n;
      state.notes[step.r][step.c].clear();
      UI.refreshCell(step.r, step.c, state);
    },
    () => {
      state.errors = new Set();
      state.solved = true;
      UI.refreshAllCells(state);
      UI.updateStatus(state.errors, state.mistakeCount);
      saveToStorage();
    }
  );
}

/* ═══════════════════════════════════════════════════════
   TIMER
═══════════════════════════════════════════════════════ */
function resetTimer() {
  stopTimer();
  timerSec = 0;
  UI.setTimerDisplay(0);
}
function startTimer() {
  timerInterval = setInterval(() => {
    timerSec++;
    UI.setTimerDisplay(timerSec);
  }, 1000);
}
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/* ═══════════════════════════════════════════════════════
   STORAGE — Game State
═══════════════════════════════════════════════════════ */
function saveToStorage() {
  try {
    localStorage.setItem('t_sudoku_v2', JSON.stringify({
      solution:     state.solution,
      puzzle:       state.puzzle,
      userBoard:    state.userBoard,
      notes:        state.notes.map(row => row.map(s => [...s])),
      difficulty:   state.difficulty,
      mistakeCount: state.mistakeCount,
      timerSec,
    }));
  } catch (e) {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('t_sudoku_v2');
    if (!raw) return false;
    const s = JSON.parse(raw);
    state.solution     = s.solution;
    state.puzzle       = s.puzzle;
    state.userBoard    = s.userBoard;
    state.notes        = s.notes.map(row => row.map(arr => new Set(arr)));
    state.difficulty   = s.difficulty;
    state.mistakeCount = s.mistakeCount || 0;
    state.errors       = Engine.findErrors(state.puzzle, state.userBoard, state.solution);
    timerSec           = s.timerSec || 0;
    document.getElementById('timerDiff').textContent =
      { easy: '簡單', medium: '中等', hard: '困難' }[state.difficulty] || '';
    return true;
  } catch (e) { return false; }
}

/* ═══════════════════════════════════════════════════════
   STORAGE — Leaderboard
═══════════════════════════════════════════════════════ */
function getRecords() {
  try {
    return JSON.parse(localStorage.getItem('t_sudoku_records') || '[]');
  } catch (e) { return []; }
}

function saveRecord(diff, time) {
  const records = getRecords();
  records.push({ diff, time });
  records.sort((a, b) => a.time - b.time);
  const top = records.slice(0, 10);
  try { localStorage.setItem('t_sudoku_records', JSON.stringify(top)); } catch(e) {}
  // Is it a new record for this difficulty?
  const prev = records.filter(r => r.diff === diff);
  return prev.length <= 1 || time <= prev[0].time;
}

/* ═══════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════ */
function initTheme() {
  UI.setTheme();
}

/* ═══════════════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════════════ */
function bindEvents() {

  // Board cell click
  document.getElementById('board').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) selectCell(+cell.dataset.row, +cell.dataset.col);
  });

  // Numpad
  document.getElementById('numpad').addEventListener('click', e => {
    const btn = e.target.closest('[data-n]');
    if (btn) inputNumber(+btn.dataset.n);
  });

  // Difficulty buttons
  document.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      Audio.playClick();
      newGame(btn.dataset.diff);
    });
  });

  // New game
  document.getElementById('newGameBtn').addEventListener('click', () => {
    Audio.playClick();
    newGame();
  });

  // Hint
  document.getElementById('hintBtn').addEventListener('click', doHint);

  // Solve animation
  document.getElementById('solveAnimBtn').addEventListener('click', () => {
    Audio.playClick();
    doSolveAnimation();
  });

  // Abandon
  document.getElementById('abandonBtn').addEventListener('click', () => {
    Audio.playClick();
    UI.showModal('abandonModal');
  });
  document.getElementById('abandonCancel').addEventListener('click', () => {
    Audio.playClick();
    UI.hideModal('abandonModal');
  });
  document.getElementById('abandonSeeAnswer').addEventListener('click', () => {
    UI.hideModal('abandonModal');
    stopTimer();
    state.solved = true;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        state.userBoard[r][c] = state.solution[r][c];
    state.errors = new Set();
    UI.refreshAllCells(state);
    UI.updateStatus(state.errors, state.mistakeCount);
    saveToStorage();
  });

  // Save
  document.getElementById('saveBtn').addEventListener('click', () => {
    Audio.playClick();
    saveToStorage();
    const btn = document.getElementById('saveBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="icon">✓</span>已儲存';
    setTimeout(() => btn.innerHTML = orig, 1500);
  });

  // Play again
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    Audio.playClick();
    UI.hideModal('winOverlay');
    newGame();
  });

  // Notes mode
  document.getElementById('normalMode').addEventListener('click', () => {
    Audio.playClick();
    state.notesMode = false;
    document.getElementById('normalMode').classList.add('active');
    document.getElementById('notesMode').classList.remove('active');
  });
  document.getElementById('notesMode').addEventListener('click', () => {
    Audio.playClick();
    state.notesMode = true;
    document.getElementById('notesMode').classList.add('active');
    document.getElementById('normalMode').classList.remove('active');
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '9') { inputNumber(+e.key); return; }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { inputNumber(0); return; }
    if (!state.selected) return;
    const [r, c] = state.selected;
    const moves = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dr, dc] = moves[e.key];
      selectCell(Math.max(0, Math.min(8, r+dr)), Math.max(0, Math.min(8, c+dc)));
    }
  });

  // Close modals on backdrop click
  ['abandonModal','winOverlay'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target === e.currentTarget) UI.hideModal(id);
    });
  });
}

/* ═══════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  UI.initThreeBackground();
  bindEvents();

  UI.hideSplash(() => {
    // Load saved game or start new
    if (loadFromStorage()) {
      UI.renderBoard(state);
      UI.refreshAllCells(state);
      UI.updateStatus(state.errors, state.mistakeCount);
      UI.setTimerDisplay(timerSec);
      startTimer();
      document.querySelectorAll('.diff-btn[data-diff]').forEach(b => {
        b.classList.toggle('active', b.dataset.diff === state.difficulty);
      });
    } else {
      newGame('easy');
    }
    UI.renderLeaderboard(getRecords());
  });
});
