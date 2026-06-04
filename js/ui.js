/**
 * ui.js — T 數獨 · UI & Animation Layer
 * Three.js particle background, board rendering, emoji rain, leaderboard
 */

const UI = (() => {

  /* ═══════════════════════════════════════════════════════
     THREE.JS PARTICLE BACKGROUND
  ═══════════════════════════════════════════════════════ */
  let threeScene, threeCamera, threeRenderer, particles, particleMat;

  function initThreeBackground() {
    const canvas = document.getElementById('bgCanvas');
    if (!window.THREE) return;

    threeScene    = new THREE.Scene();
    threeCamera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    threeCamera.position.z = 50;

    threeRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.setClearColor(0x000000, 0);

    // Particles
    const count = 180;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 140;
      pos[i*3+1] = (Math.random() - 0.5) * 100;
      pos[i*3+2] = (Math.random() - 0.5) * 60;
      sizes[i]   = Math.random() * 1.5 + 0.3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    particleMat = new THREE.PointsMaterial({
      color: 0xc9a84c,
      size: 0.5,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    });

    particles = new THREE.Points(geo, particleMat);
    threeScene.add(particles);

    // Subtle grid lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.04 });
    for (let i = -5; i <= 5; i++) {
      const hGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-70, i * 10, -30),
        new THREE.Vector3(70,  i * 10, -30),
      ]);
      const vGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 14, -50, -30),
        new THREE.Vector3(i * 14,  50, -30),
      ]);
      threeScene.add(new THREE.Line(hGeo, gridMat));
      threeScene.add(new THREE.Line(vGeo, gridMat));
    }

    animateThree();

    window.addEventListener('resize', () => {
      threeCamera.aspect = window.innerWidth / window.innerHeight;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  let threeFrame = 0;
  function animateThree() {
    requestAnimationFrame(animateThree);
    threeFrame += 0.003;
    if (particles) {
      particles.rotation.y = threeFrame * 0.15;
      particles.rotation.x = Math.sin(threeFrame * 0.3) * 0.05;
      // Subtle breathing opacity
      particleMat.opacity = 0.35 + Math.sin(threeFrame * 0.8) * 0.1;
    }
    threeRenderer?.render(threeScene, threeCamera);
  }

  function updateParticleColor(dark) {
    if (particleMat) {
      particleMat.color.setHex(dark ? 0xc9a84c : 0x8a5e10);
    }
  }

  /* ═══════════════════════════════════════════════════════
     BOARD RENDERING
  ═══════════════════════════════════════════════════════ */
  function renderBoard(state) {
    const { puzzle, userBoard, notes, selected, errors } = state;
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        buildCell(cell, r, c, state);
        boardEl.appendChild(cell);
      }
    }
  }

  function buildCell(cell, r, c, state) {
    const { puzzle, userBoard, notes, selected, errors } = state;
    const val     = userBoard[r][c];
    const isGiven = puzzle[r][c] !== 0;
    const errKey  = `${r},${c}`;
    const classes = ['cell'];

    if (isGiven) classes.push('given');
    else if (val !== 0) classes.push('user-input');
    if (errors.has(errKey)) classes.push('error');

    if (selected) {
      const [sr, sc] = selected;
      if (sr === r && sc === c) {
        classes.push('selected');
      } else {
        const sameBox = Math.floor(sr/3)===Math.floor(r/3) && Math.floor(sc/3)===Math.floor(c/3);
        if (sr===r || sc===c || sameBox) classes.push('related');
        const selVal = userBoard[sr][sc];
        if (selVal !== 0 && selVal === val) classes.push('same-num');
      }
    }

    cell.className = classes.join(' ');
    cell.innerHTML = '';

    if (val !== 0) {
      cell.textContent = val;
    } else if (!isGiven && notes[r][c].size > 0) {
      const grid = document.createElement('div');
      grid.className = 'notes';
      for (let n = 1; n <= 9; n++) {
        const nd = document.createElement('div');
        nd.className = 'note-digit' + (notes[r][c].has(n) ? ' active' : '');
        nd.textContent = notes[r][c].has(n) ? n : '';
        grid.appendChild(nd);
      }
      cell.appendChild(grid);
    }
  }

  function refreshCell(r, c, state, keepFlash = false) {
    const cell = getCellEl(r, c);
    if (!cell) return;
    const flashCorrect = keepFlash && cell.classList.contains('flash-correct');
    const flashError   = keepFlash && cell.classList.contains('flash-error');
    buildCell(cell, r, c, state);
    if (flashCorrect) cell.classList.add('flash-correct');
    if (flashError)   cell.classList.add('flash-error');
  }

  function refreshAllCells(state) {
    document.querySelectorAll('.cell').forEach(cell => {
      buildCell(cell, +cell.dataset.row, +cell.dataset.col, state);
    });
  }

  function getCellEl(r, c) {
    return document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  }

  /* ── Flash animation on cell ── */
  function flashCell(r, c, type) {
    const cell = getCellEl(r, c);
    if (!cell) return;
    cell.classList.remove('flash-correct', 'flash-error', 'flip-in');
    void cell.offsetWidth;
    cell.classList.add(type);
    cell.addEventListener('animationend', () => {
      cell.classList.remove(type);
    }, { once: true });
  }

  /* ── Numpad ripple ── */
  function rippleNumBtn(n) {
    const btn = document.querySelector(`.num-btn[data-n="${n}"]`);
    if (!btn) return;
    btn.classList.remove('ripple');
    void btn.offsetWidth;
    btn.classList.add('ripple');
    btn.addEventListener('animationend', () => btn.classList.remove('ripple'), { once: true });
  }

  /* ═══════════════════════════════════════════════════════
     STATUS & DISPLAY
  ═══════════════════════════════════════════════════════ */
  function updateStatus(errors, mistakeTotal) {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    const mis = document.getElementById('mistakeCount');
    if (errors.size > 0) {
      dot.className = 'status-dot err';
      txt.textContent = `${errors.size} 個錯誤`;
    } else {
      dot.className = 'status-dot ok';
      txt.textContent = '棋盤正確';
    }
    mis.textContent = mistakeTotal > 0 ? `共 ${mistakeTotal} 次錯誤` : '';
  }

  /* ═══════════════════════════════════════════════════════
     TIMER
  ═══════════════════════════════════════════════════════ */
  function setTimerDisplay(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${m}:${s}`;
  }

  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ═══════════════════════════════════════════════════════
     HINT POPUP
  ═══════════════════════════════════════════════════════ */
  let hintTimer = null;
  function showHintPopup(text) {
    const popup = document.getElementById('hintPopup');
    document.getElementById('hintText').textContent = text;
    popup.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => popup.classList.remove('show'), 3500);
  }

  /* ═══════════════════════════════════════════════════════
     MODALS
  ═══════════════════════════════════════════════════════ */
  function showModal(id)  { document.getElementById(id).classList.add('show'); }
  function hideModal(id)  { document.getElementById(id).classList.remove('show'); }

  /* ═══════════════════════════════════════════════════════
     WIN SCREEN
  ═══════════════════════════════════════════════════════ */
  function showWin(timerSec, msg, isRecord) {
    document.getElementById('winTime').textContent = formatTime(timerSec);
    document.getElementById('winMsg').textContent  = msg;
    document.getElementById('winRecord').textContent = isRecord ? '🎖 新紀錄！' : '';
    showModal('winOverlay');
    launchEmojiRain();
  }

  /* ── Emoji rain (2 seconds) ── */
  const WIN_EMOJIS = ['🎉','🎊','⭐','✨','🏆','🎯','💫','🌟','🎈','🥳','🎶','💎'];
  function launchEmojiRain() {
    const count = 65;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'emoji-piece';
        const fallDur = (1.0 + Math.random() * 1.0).toFixed(2);
        el.textContent = WIN_EMOJIS[Math.floor(Math.random() * WIN_EMOJIS.length)];
        el.style.cssText = `
          left: ${Math.random() * 100}vw;
          top: -40px;
          font-size: ${1.3 + Math.random() * 1.4}rem;
          animation-duration: ${fallDur}s;
          animation-delay: ${(Math.random() * 0.8).toFixed(2)}s;
        `;
        document.body.appendChild(el);
        // Remove after max 2 seconds
        setTimeout(() => el.remove(), 2200);
      }, Math.random() * 300);
    }
  }

  /* ═══════════════════════════════════════════════════════
     LEADERBOARD
  ═══════════════════════════════════════════════════════ */
  function renderLeaderboard(records) {
    const el = document.getElementById('leaderboard');
    if (!records || records.length === 0) {
      el.innerHTML = '<div class="lb-empty">尚無紀錄</div>';
      return;
    }
    const diffLabel = { easy: '簡單', medium: '中等', hard: '困難' };
    el.innerHTML = records.slice(0, 5).map((rec, i) => `
      <div class="lb-row">
        <span class="lb-rank">${['🥇','🥈','🥉','4','5'][i]}</span>
        <span class="lb-diff">${diffLabel[rec.diff] || rec.diff}</span>
        <span class="lb-time">${formatTime(rec.time)}</span>
      </div>
    `).join('');
  }

  /* ═══════════════════════════════════════════════════════
     SOLVE ANIMATION
  ═══════════════════════════════════════════════════════ */
  function animateSolve(steps, onStep, onDone) {
    // Show badge
    const board = document.getElementById('board');
    const badge = document.createElement('div');
    badge.className = 'solving-badge';
    badge.textContent = '解題中…';
    document.querySelector('.board-container').appendChild(badge);

    let i = 0;
    const speed = Math.max(18, Math.floor(800 / steps.length));
    const interval = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(interval);
        badge.remove();
        onDone();
        return;
      }
      const step = steps[i++];
      onStep(step);
      flashCell(step.r, step.c, 'flip-in');
    }, speed);
  }

  /* ═══════════════════════════════════════════════════════
     THEME
  ═══════════════════════════════════════════════════════ */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const label = document.getElementById('themeLabel');
    label.textContent = t === 'dark' ? '🌙' : '☀️';
    updateParticleColor(t === 'dark');
    try { localStorage.setItem('t_sudoku_theme', t); } catch(e) {}
  }

  function getTheme() {
    try { return localStorage.getItem('t_sudoku_theme') || 'dark'; } catch(e) { return 'dark'; }
  }

  /* ═══════════════════════════════════════════════════════
     SPLASH
  ═══════════════════════════════════════════════════════ */
  function hideSplash(cb) {
    const splash = document.getElementById('splash');
    const app    = document.getElementById('app');
    setTimeout(() => {
      splash.classList.add('fade-out');
      app.classList.remove('hidden');
      setTimeout(() => { splash.style.display = 'none'; cb && cb(); }, 600);
    }, 1900);
  }

  return {
    initThreeBackground,
    renderBoard,
    refreshCell,
    refreshAllCells,
    getCellEl,
    flashCell,
    rippleNumBtn,
    updateStatus,
    setTimerDisplay,
    formatTime,
    showHintPopup,
    showModal,
    hideModal,
    showWin,
    launchEmojiRain,
    renderLeaderboard,
    animateSolve,
    setTheme,
    getTheme,
    hideSplash,
  };
})();
