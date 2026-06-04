/**
 * engine.js — T 數獨 · Sudoku Logic Engine
 * Handles: board generation, hole digging, validation, solving
 */

const Engine = (() => {

  /* ── Helpers ── */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function cloneBoard(board) {
    return board.map(row => [...row]);
  }

  /* ── Validity check ── */
  function isValid(board, row, col, num) {
    // Row
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false;
    }
    // Column
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false;
    }
    // 3×3 box
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  /* ── Backtracking fill ── */
  function fillBoard(board, pos = 0) {
    if (pos === 81) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    if (board[row][col] !== 0) return fillBoard(board, pos + 1);
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const n of nums) {
      if (isValid(board, row, col, n)) {
        board[row][col] = n;
        if (fillBoard(board, pos + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  /* ── Generate complete solution ── */
  function generateSolution() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillBoard(board);
    return board;
  }

  /* ── Count solutions (capped at 2 for uniqueness check) ── */
  function countSolutions(board, limit = 2) {
    let count = 0;
    function solve(pos) {
      if (count >= limit) return;
      if (pos === 81) { count++; return; }
      const row = Math.floor(pos / 9);
      const col = pos % 9;
      if (board[row][col] !== 0) { solve(pos + 1); return; }
      for (let n = 1; n <= 9; n++) {
        if (isValid(board, row, col, n)) {
          board[row][col] = n;
          solve(pos + 1);
          board[row][col] = 0;
          if (count >= limit) return;
        }
      }
    }
    solve(0);
    return count;
  }

  /* ── Dig holes ── */
  const HOLE_COUNTS = { easy: 36, medium: 46, hard: 55 };

  function digHoles(solution, difficulty) {
    const target = HOLE_COUNTS[difficulty] || 36;
    const puzzle = cloneBoard(solution);
    const positions = shuffle([...Array(81).keys()]);
    let removed = 0;

    for (const pos of positions) {
      if (removed >= target) break;
      const r = Math.floor(pos / 9);
      const c = pos % 9;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      // For hard, ensure unique solution
      if (difficulty === 'hard') {
        const test = cloneBoard(puzzle);
        if (countSolutions(test) !== 1) {
          puzzle[r][c] = backup;
          continue;
        }
      }
      removed++;
    }
    return puzzle;
  }

  /* ── Solve board (for animate/hint) ── */
  function solve(board) {
    const b = cloneBoard(board);
    function go(pos) {
      if (pos === 81) return true;
      const r = Math.floor(pos / 9), c = pos % 9;
      if (b[r][c] !== 0) return go(pos + 1);
      for (let n = 1; n <= 9; n++) {
        if (isValid(b, r, c, n)) {
          b[r][c] = n;
          if (go(pos + 1)) return true;
          b[r][c] = 0;
        }
      }
      return false;
    }
    go(0);
    return b;
  }

  /* ── Get solve steps (for animation) ── */
  function getSolveSteps(puzzle, userBoard) {
    const steps = [];
    const b = cloneBoard(userBoard);
    function go(pos) {
      if (pos === 81) return true;
      const r = Math.floor(pos / 9), c = pos % 9;
      if (b[r][c] !== 0) return go(pos + 1);
      for (let n = 1; n <= 9; n++) {
        if (isValid(b, r, c, n)) {
          b[r][c] = n;
          steps.push({ r, c, n });
          if (go(pos + 1)) return true;
          b[r][c] = 0;
          steps.pop();
        }
      }
      return false;
    }
    go(0);
    return steps;
  }

  /* ── Validate user board (find errors) ── */
  function findErrors(puzzle, userBoard, solution) {
    const errors = new Set();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = userBoard[r][c];
        if (v === 0 || puzzle[r][c] !== 0) continue;
        if (v !== solution[r][c]) errors.add(`${r},${c}`);
      }
    }
    return errors;
  }

  /* ── Is board complete and correct ── */
  function isComplete(userBoard, errors) {
    if (errors.size > 0) return false;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (userBoard[r][c] === 0) return false;
    return true;
  }

  /* ── Find a hint cell (first empty wrong cell) ── */
  function getHintCell(puzzle, userBoard, solution) {
    // Prefer cells that are empty
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (puzzle[r][c] === 0 && userBoard[r][c] === 0)
          return { r, c, n: solution[r][c] };
    // Then wrong cells
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (puzzle[r][c] === 0 && userBoard[r][c] !== solution[r][c])
          return { r, c, n: solution[r][c] };
    return null;
  }

  return {
    generateSolution,
    digHoles,
    findErrors,
    isComplete,
    solve,
    getSolveSteps,
    getHintCell,
    cloneBoard,
  };
})();
