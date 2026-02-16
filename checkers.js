import { sound } from '../sound.js';

const SIZE = 8;
const TUTORIAL_KEY = 'checkers-tutorial-completed';

// Each square is either null or { color: 'w' | 'b', king: boolean }

export function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'chess'; // reuse nice chess layout styling

  // --- Toolbar ---
  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const tutorialBtn = button('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.style.backgroundColor = '#10b981';

  const newBtn = button('New game');
  const undoBtn = button('Undo');
  const hintBtn = button('Hint');
  const flipBtn = button('Flip board');
  const modeBadge = badge('You vs AI');

  tutorialBtn.classList.add('button');
  newBtn.classList.add('button');
  undoBtn.classList.add('button');
  hintBtn.classList.add('button');
  flipBtn.classList.add('button');

  toolbar.append(tutorialBtn, newBtn, undoBtn, hintBtn, flipBtn, modeBadge);

  // --- Main layout: board + side panel ---
  const layout = document.createElement('div');
  layout.className = 'chess-layout';

  const boardWrap = document.createElement('div');
  boardWrap.className = 'chess-board-wrap';

  const boardEl = document.createElement('div');
  boardEl.className = 'chess-board';

  const sidePanel = document.createElement('div');
  sidePanel.className = 'chess-side';

  const status = document.createElement('div');
  status.className = 'chess-status';
  status.textContent = 'Blue (You) to move';

  // Nice Playbux reward banner shown when the human wins
  const rewardPanel = document.createElement('div');
  rewardPanel.className = 'playbux-panel';
  rewardPanel.style.display = 'none';
  const rewardText = document.createElement('p');
  rewardText.className = 'playbux-text';
  rewardText.textContent = '';
  rewardPanel.appendChild(rewardText);

  // Difficulty buttons
  const diffRow = document.createElement('div');
  diffRow.className = 'chess-settings-row';
  const diffLabel = document.createElement('span');
  diffLabel.className = 'chess-diff-label';
  diffLabel.textContent = 'Difficulty:';
  const easyBtn = button('Easy');
  const medBtn = button('Med');
  const hardBtn = button('Hard');
  easyBtn.classList.add('button');
  medBtn.classList.add('button');
  hardBtn.classList.add('button');
  diffRow.append(diffLabel, easyBtn, medBtn, hardBtn);

  // Mode row (You vs AI / AI vs AI) + pause
  const modeRow = document.createElement('div');
  modeRow.className = 'chess-settings-row';
  const modeLabel = document.createElement('span');
  modeLabel.className = 'chess-mode-label';
  modeLabel.textContent = 'Mode:';
  const youVsAiBtn = button('You vs AI');
  const twoPBtn = button('2 Player');
  const aiVsAiBtn = button('AI vs AI');
  const pauseBtn = button('Pause');
  youVsAiBtn.classList.add('button');
  twoPBtn.classList.add('button');
  aiVsAiBtn.classList.add('button');
  pauseBtn.classList.add('button');
  modeRow.append(modeLabel, youVsAiBtn, twoPBtn, aiVsAiBtn, pauseBtn);

  // Hint info
  const hintInfo = document.createElement('span');
  hintInfo.className = 'chess-hint-info';
  hintInfo.textContent = '';

  const hintRow = document.createElement('div');
  hintRow.className = 'chess-settings-row';
  hintRow.append(hintInfo);

  // Simple rules summary
  const rules = createRules([
    'Goal: capture all enemy pieces or leave them with no legal moves.',
    'Blue moves first and plays upward, red plays downward.',
    'Men move diagonally forward one square, kings move diagonally in any direction.',
    'Capture by jumping over an adjacent enemy piece onto an empty square.',
    'If a capture is available, you must capture.',
  ]);

  // Advantage graph (blue vs red line)
  const graphBox = document.createElement('div');
  graphBox.className = 'ttt-graph';
  const graphTitle = document.createElement('div');
  graphTitle.className = 'ttt-graph-title';
  graphTitle.textContent = 'Who is winning? (Blue vs Red pieces)';
  const graphCanvas = document.createElement('canvas');
  graphCanvas.width = 320;
  graphCanvas.height = 140;
  graphBox.append(graphTitle, graphCanvas);

  sidePanel.append(status, rewardPanel, modeRow, diffRow, hintRow, graphBox, rules);

  boardWrap.append(boardEl);
  layout.append(boardWrap, sidePanel);
  wrap.append(toolbar, layout);
  root.appendChild(wrap);

  // --- Game state ---
  let gameStarted = false; // Track if game has been started
  let board = createInitialBoard();
  let currentPlayer = 'w'; // 'w' (blue / "white") or 'b' (red / "black")
  let selected = null; // { r, c, moves: Move[] } | null
  let lastMove = null; // { from: {r,c}, to: {r,c} } | null
  let difficulty = 'easy';
  let mode = 'you-vs-ai'; // 'you-vs-ai' | 'two-player' | 'ai-vs-ai'
  let paused = false;
  let aiTimeoutId = null;
  let hintsLeft = 0;
  let gameOver = false;

  // --- Start Screen ---
  const startOverlay = document.createElement('div');
  startOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.95), rgba(160, 82, 45, 0.95));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: 'Arial', sans-serif;
  `;

  const startModal = document.createElement('div');
  startModal.style.cssText = `
    background: linear-gradient(135deg, #8B4513, #D2691E);
    border: 4px solid #000;
    border-radius: 20px;
    padding: 40px;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    color: white;
  `;

  const startTitle = document.createElement('h1');
  startTitle.textContent = '♟️ CHECKERS ♟️';
  startTitle.style.cssText = `
    font-size: 48px;
    margin: 0 0 20px 0;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.7);
  `;

  const startInstructions = document.createElement('div');
  startInstructions.innerHTML = `
    <p style="font-size: 18px; margin: 15px 0; line-height: 1.6;">
      <strong>🎯 Goal:</strong> Capture all enemy pieces or block their moves!
    </p>
    <p style="font-size: 16px; margin: 10px 0; line-height: 1.6;">
      <strong>🔵 Blue pieces</strong> move first (upward)<br>
      <strong>🔴 Red pieces</strong> move second (downward)
    </p>
    <p style="font-size: 16px; margin: 10px 0; line-height: 1.6;">
      <strong>👑 Kings</strong> can move in any diagonal direction
    </p>
    <p style="font-size: 16px; margin: 10px 0; line-height: 1.6;">
      <strong>⚡ Captures are mandatory</strong> when available
    </p>
  `;

  const startButton = document.createElement('button');
  startButton.textContent = 'START GAME';
  startButton.style.cssText = `
    font-size: 24px;
    padding: 15px 40px;
    margin-top: 20px;
    background: linear-gradient(135deg, #000, #333);
    color: white;
    border: 3px solid white;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    transition: all 0.3s;
  `;

  const hubStartButton = document.createElement('button');
  hubStartButton.textContent = '🏠 BACK TO HUB';
  hubStartButton.style.cssText = `
    font-size: 20px;
    padding: 12px 30px;
    margin-top: 15px;
    background: transparent;
    color: white;
    border: 3px solid white;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    transition: all 0.3s;
  `;

  startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'scale(1.1)';
    startButton.style.boxShadow = '0 0 20px rgba(255,255,255,0.5)';
  });

  startButton.addEventListener('mouseleave', () => {
    startButton.style.transform = 'scale(1)';
    startButton.style.boxShadow = 'none';
  });

  hubStartButton.addEventListener('mouseenter', () => {
    hubStartButton.style.background = 'rgba(255,255,255,0.2)';
    hubStartButton.style.transform = 'scale(1.05)';
  });

  hubStartButton.addEventListener('mouseleave', () => {
    hubStartButton.style.background = 'transparent';
    hubStartButton.style.transform = 'scale(1)';
  });

  startButton.addEventListener('click', () => {
    sound.playClick();
    gameStarted = true;
    startOverlay.remove();
    setTimeout(() => {
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  hubStartButton.addEventListener('click', () => {
    sound.playClick();
    startOverlay.remove();
    location.hash = '#/';
  });

  startModal.append(startTitle, startInstructions, startButton, hubStartButton);
  startOverlay.appendChild(startModal);
  document.body.appendChild(startOverlay);

  // --- Tutorial System ---
  function showTutorial() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    const box = document.createElement('div');
    box.style.backgroundColor = '#1f2937';
    box.style.border = '2px solid #10b981';
    box.style.borderRadius = '12px';
    box.style.padding = '30px';
    box.style.maxWidth = '500px';
    box.style.width = '100%';
    box.style.color = '#fff';
    box.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';

    const title = document.createElement('h2');
    title.style.margin = '0 0 15px 0';
    title.style.color = '#10b981';
    title.style.fontSize = '24px';

    const content = document.createElement('p');
    content.style.margin = '0 0 20px 0';
    content.style.fontSize = '16px';
    content.style.lineHeight = '1.5';

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '10px';
    btnRow.style.justifyContent = 'space-between';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.className = 'button';
    backBtn.style.flex = '1';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.className = 'button primary';
    nextBtn.style.flex = '1';

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.className = 'button';

    btnRow.append(backBtn, skipBtn, nextBtn);
    box.append(title, content, btnRow);
    overlay.appendChild(box);

    const steps = [
      {
        title: '♟️ Welcome to Checkers!',
        text: 'A classic strategy game! Capture all enemy pieces or block them from moving to win. Think ahead and plan your moves carefully!'
      },
      {
        title: '🎮 Basic Movement',
        text: 'Men (regular pieces) move diagonally forward one square. Only dark squares are used in checkers. Click a piece to see valid moves!'
      },
      {
        title: '⚡ Capturing',
        text: 'Jump over an adjacent enemy piece onto an empty square to capture it. If you can capture, you MUST capture - no choice!'
      },
      {
        title: '🔗 Multi-Jumps',
        text: 'After capturing, if another capture is available with the same piece, you must continue jumping! Chain multiple captures together.'
      },
      {
        title: '👑 Kings',
        text: 'When a piece reaches the opposite end of the board, it becomes a King! Kings can move diagonally in ANY direction, not just forward.'
      },
      {
        title: '🎯 Winning',
        text: 'Win by capturing all enemy pieces OR by blocking them so they have no legal moves. Use strategy to corner your opponent!'
      },
      {
        title: '🤖 Game Modes',
        text: 'Play against AI (Easy/Med/Hard), against a friend (2 Player), or watch AI vs AI! Choose your mode in the settings panel.'
      },
      {
        title: '💡 Tips',
        text: 'Control the center, protect your back row to prevent enemy kings, and use the Hint button if you\'re stuck!'
      }
    ];

    let currentStep = 0;

    function render() {
      const step = steps[currentStep];
      title.textContent = step.title;
      content.textContent = step.text;

      backBtn.style.display = currentStep === 0 ? 'none' : 'block';
      nextBtn.textContent = currentStep === steps.length - 1 ? 'Done' : 'Next';
    }

    backBtn.onclick = () => {
      if (currentStep > 0) {
        currentStep--;
        render();
      }
    };

    nextBtn.onclick = () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        render();
      } else {
        localStorage.setItem(TUTORIAL_KEY, 'true');
        document.body.removeChild(overlay);
        setTimeout(() => {
          wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    skipBtn.onclick = () => {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      document.body.removeChild(overlay);
      setTimeout(() => {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    render();
    document.body.appendChild(overlay);
  }

  /** @typedef {{from:{r:number,c:number}, to:{r:number,c:number}, capture?:boolean, captured?:{r:number,c:number}}} Move */

  /** History of states for undo */
  const history = [];
  /** Advantage points for graph: { blue: number, red: number } */
  const advantageHistory = [];

  let southColor = 'w'; // which color is shown at bottom; toggled by Flip button

  const squares = []; // DOM buttons representing squares

  // --- Helpers ---
  function button(text) {
    const b = document.createElement('button');
    b.textContent = text;
    return b;
  }

  function badge(text) {
    const s = document.createElement('span');
    s.className = 'badge';
    s.textContent = text;
    return s;
  }

  function createRules(lines) {
    const d = document.createElement('details');
    d.className = 'rules';
    const s = document.createElement('summary');
    s.textContent = 'Rules';
    const ul = document.createElement('ul');
    lines.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    d.append(s, ul);
    return d;
  }

  function createInitialBoard() {
    const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    // Red (b) at the top rows 0..2 on dark squares
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < SIZE; c++) {
        if ((r + c) % 2 === 1) {
          b[r][c] = { color: 'b', king: false };
        }
      }
    }
    // Blue (w) at the bottom rows 5..7 on dark squares
    for (let r = SIZE - 3; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if ((r + c) % 2 === 1) {
          b[r][c] = { color: 'w', king: false };
        }
      }
    }
    return b;
  }

  function cloneBoard(src) {
    return src.map(row => row.map(cell => (cell ? { color: cell.color, king: cell.king } : null)));
  }

  function pushHistory() {
    history.push({
      board: cloneBoard(board),
      currentPlayer,
      lastMove: lastMove ? { from: { ...lastMove.from }, to: { ...lastMove.to } } : null,
      gameOver,
    });
  }

  function restoreState(state) {
    board = cloneBoard(state.board);
    currentPlayer = state.currentPlayer;
    lastMove = state.lastMove ? { from: { ...state.lastMove.from }, to: { ...state.lastMove.to } } : null;
    gameOver = state.gameOver;
  }

  function pieceGlyph(cell) {
    if (!cell) return '';
    if (cell.color === 'w') return cell.king ? '🔷' : '🔵';
    return cell.king ? '🔶' : '🔴';
  }

  function countPieces() {
    let blue = 0;
    let red = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r][c];
        if (!cell) continue;
        if (cell.color === 'w') blue++;
        else red++;
      }
    }
    return { blue, red };
  }

  function updateAdvantageHistory() {
    const { blue, red } = countPieces();
    advantageHistory.push({ blue, red });
    redrawGraph();
  }

  function redrawGraph() {
    const ctx = graphCanvas.getContext('2d');
    if (!ctx) return;
    const w = graphCanvas.width;
    const h = graphCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!advantageHistory.length) return;

    const maxSteps = Math.max(advantageHistory.length - 1, 1);
    let maxPieces = 0;
    advantageHistory.forEach(p => {
      if (p.blue > maxPieces) maxPieces = p.blue;
      if (p.red > maxPieces) maxPieces = p.red;
    });
    if (maxPieces === 0) maxPieces = 1;

    const pad = 10;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + innerH / 2);
    ctx.lineTo(pad + innerW, pad + innerH / 2);
    ctx.stroke();

    function drawLine(colorKey, stroke) {
      ctx.beginPath();
      advantageHistory.forEach((p, i) => {
        const x = pad + (innerW * i) / maxSteps;
        const value = colorKey === 'blue' ? p.blue : p.red;
        const y = pad + innerH - (innerH * value) / maxPieces;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // red line: "black" / red side, blue line: "white" / blue side
    drawLine('red', '#ef4444');
    drawLine('blue', '#3b82f6');
  }

  function inBounds(r, c) {
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  }

  function dirsFor(cell) {
    if (!cell) return [];
    if (cell.king) return [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];
    if (cell.color === 'w') {
      return [
        { dr: -1, dc: -1 },
        { dr: -1, dc: 1 },
      ];
    }
    return [
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];
  }

  /** @returns {Move[]} */
  function generateMovesFor(color) {
    const simple = [];
    const captures = [];

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r][c];
        if (!cell || cell.color !== color) continue;
        const dirs = dirsFor(cell);
        for (const { dr, dc } of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          const jr = r + 2 * dr;
          const jc = c + 2 * dc;

          if (inBounds(nr, nc) && !board[nr][nc]) {
            // simple move (only if no captures exist anywhere)
            simple.push({ from: { r, c }, to: { r: nr, c: nc } });
          }

          if (
            inBounds(jr, jc) &&
            board[nr] &&
            board[nr][nc] &&
            board[nr][nc].color !== color &&
            !board[jr][jc]
          ) {
            captures.push({
              from: { r, c },
              to: { r: jr, c: jc },
              capture: true,
              captured: { r: nr, c: nc },
            });
          }
        }
      }
    }

    // If any capture is available, you must capture.
    return captures.length ? captures : simple;
  }

  function generateCurrentMoves() {
    return generateMovesFor(currentPlayer);
  }

  function applyMoveInternal(move) {
    const fromCell = board[move.from.r][move.from.c];
    board[move.from.r][move.from.c] = null;
    board[move.to.r][move.to.c] = fromCell;

    if (move.capture && move.captured) {
      board[move.captured.r][move.captured.c] = null;
    }

    // Promotion to king
    if (fromCell) {
      if (fromCell.color === 'w' && move.to.r === 0) fromCell.king = true;
      if (fromCell.color === 'b' && move.to.r === SIZE - 1) fromCell.king = true;
    }

    lastMove = { from: { ...move.from }, to: { ...move.to } };
    currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
  }

  function clearSelectionHighlights() {
    squares.forEach(sq => {
      sq.classList.remove('selected', 'move-target', 'last-move', 'best-move');
    });
  }

  function applyLastMoveHighlight() {
    if (!lastMove) return;
    squares.forEach((sq) => {
      const r = Number(sq.dataset.row);
      const c = Number(sq.dataset.col);
      if (
        (r === lastMove.from.r && c === lastMove.from.c) ||
        (r === lastMove.to.r && c === lastMove.to.c)
      ) {
        sq.classList.add('last-move');
      }
    });
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    squares.length = 0;

    const rowOrder = southColor === 'w' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const colOrder = southColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    for (const r of rowOrder) {
      for (const c of colOrder) {
        const btn = document.createElement('button');
        btn.className = 'chess-square';
        const displayRow = rowOrder.indexOf(r);
        const displayCol = colOrder.indexOf(c);
        if ((displayRow + displayCol) % 2 === 0) btn.classList.add('light');
        else btn.classList.add('dark');

        const cell = board[r][c];
        const pieceSpan = document.createElement('span');
        pieceSpan.className = 'chess-piece';
        pieceSpan.textContent = pieceGlyph(cell);
        btn.appendChild(pieceSpan);

        btn.dataset.row = String(r);
        btn.dataset.col = String(c);
        btn.addEventListener('click', onSquareClick);

        squares.push(btn);
        boardEl.appendChild(btn);
      }
    }

    applyLastMoveHighlight();
  }

  function updateStatus() {
    if (gameOver) return;
    let text;
    if (mode === 'two-player') {
      text = currentPlayer === 'w' ? 'Blue to move' : 'Red to move';
    } else if (mode === 'you-vs-ai') {
      const colorName = currentPlayer === 'w' ? 'Blue (You)' : 'Red AI';
      text = `${colorName} to move`;
    } else {
      // ai-vs-ai
      text = currentPlayer === 'w' ? 'Blue AI to move' : 'Red AI to move';
    }
    if (paused) {
      text += ' (paused)';
    }
    status.textContent = text;
  }

  function updateHintInfo() {
    const perDiff = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1;
    hintInfo.textContent = `Hints left: ${hintsLeft}/${perDiff}`;
  }

  function updateDifficultyButtons() {
    easyBtn.classList.toggle('chess-chip-active', difficulty === 'easy');
    medBtn.classList.toggle('chess-chip-active', difficulty === 'medium');
    hardBtn.classList.toggle('chess-chip-active', difficulty === 'hard');
  }

  function updateModeButtons() {
    youVsAiBtn.classList.toggle('chess-chip-active', mode === 'you-vs-ai');
    twoPBtn.classList.toggle('chess-chip-active', mode === 'two-player');
    aiVsAiBtn.classList.toggle('chess-chip-active', mode === 'ai-vs-ai');
    if (mode === 'you-vs-ai') modeBadge.textContent = 'You vs AI';
    else if (mode === 'two-player') modeBadge.textContent = '2 Player';
    else modeBadge.textContent = 'AI vs AI';
  }

  function updatePauseButton() {
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  }

  function endGame(winnerColor) {
    gameOver = true;
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    const winnerName = winnerColor === 'w' ? 'Blue' : 'Red';
    status.textContent = `${winnerName} wins!`;

    // Hide any previous reward banner by default
    rewardPanel.style.display = 'none';
    rewardText.textContent = '';

    // Award Playbux only when human (blue) wins in You vs AI mode
    if (mode === 'you-vs-ai' && winnerColor === 'w' && window.playBoxAwardWin) {
      let amount = 0;
      if (difficulty === 'easy') amount = 10;
      else if (difficulty === 'medium') amount = 50;
      else amount = 100; // hard or anything else

      try {
        window.playBoxAwardWin(difficulty);
      } catch {}

      // Show a nice banner so the player sees their reward
      rewardText.textContent = `🎉 You won ${amount} Playbux!`;
      rewardPanel.style.display = '';
    }
  }

  function checkGameOver() {
    const moves = generateCurrentMoves();
    const { blue, red } = countPieces();
    if (blue === 0) {
      endGame('b');
      return true;
    }
    if (red === 0) {
      endGame('w');
      return true;
    }
    if (!moves.length) {
      // Side to move has no legal moves => opponent wins
      const winner = currentPlayer === 'w' ? 'b' : 'w';
      endGame(winner);
      return true;
    }
    return false;
  }

  function movesFrom(r, c) {
    return generateCurrentMoves().filter(m => m.from.r === r && m.from.c === c);
  }

  function onSquareClick(e) {
    const btn = e.currentTarget;
    const r = Number(btn.dataset.row);
    const c = Number(btn.dataset.col);
    const cell = board[r][c];

    if (!gameStarted || paused || gameOver) return;

    // In You vs AI mode, only allow clicks when it's Blue's turn.
    if (mode === 'you-vs-ai' && currentPlayer !== 'w') return;

    const isCurrentSide = !!cell && cell.color === currentPlayer;

    if (selected && selected.r === r && selected.c === c) {
      clearSelectionHighlights();
      selected = null;
      return;
    }

    if (selected && !isCurrentSide) {
      const move = selected.moves.find(m => m.to.r === r && m.to.c === c);
      if (move) {
        handleMove(move, false);
        return;
      }
    }

    if (!cell || !isCurrentSide) {
      clearSelectionHighlights();
      selected = null;
      return;
    }

    const moves = movesFrom(r, c);
    selected = { r, c, moves };

    clearSelectionHighlights();
    btn.classList.add('selected');
    moves.forEach(m => {
      const targetBtn = findSquareButton(m.to.r, m.to.c);
      if (targetBtn) targetBtn.classList.add('move-target');
    });
    sound.playClick();
  }

  function findSquareButton(r, c) {
    return squares.find(sq => Number(sq.dataset.row) === r && Number(sq.dataset.col) === c) || null;
  }

  function handleMove(move, isAi) {
    if (gameOver) return;
    pushHistory();
    applyMoveInternal(move);
    renderBoard();
    updateAdvantageHistory();
    clearSelectionHighlights();
    selected = null;
    sound.playMove ? sound.playMove() : sound.playClick();

    if (checkGameOver()) return;

    updateStatus();
    if (!isAi) {
      scheduleAiIfNeeded();
    } else if (mode === 'ai-vs-ai') {
      scheduleAiIfNeeded();
    }
  }

  function scoreMoveHeuristic(move, sideColor) {
    // Prefer captures and promotions for the sideColor.
    let score = 0;
    if (move.capture) score += 5;
    const fromCell = board[move.from.r][move.from.c];
    if (fromCell) {
      if (fromCell.color === 'w' && move.to.r === 0 && !fromCell.king) score += 3;
      if (fromCell.color === 'b' && move.to.r === SIZE - 1 && !fromCell.king) score += 3;
    }
    // Small random noise so the AI doesn't play the same move every time.
    score += Math.random();
    return score;
  }

  function pickAiMove() {
    const moves = generateCurrentMoves();
    if (!moves.length) return null;
    const scored = moves.map(m => ({ move: m, score: scoreMoveHeuristic(m, currentPlayer) }));
    scored.sort((a, b) => b.score - a.score);

    if (difficulty === 'hard') {
      return scored[0].move;
    }
    if (difficulty === 'medium') {
      const best = scored[0].score;
      const candidates = scored.filter(s => s.score >= best - 2);
      const pool = candidates.length ? candidates : [scored[0]];
      return pool[Math.floor(Math.random() * pool.length)].move;
    }
    // easy: often pick worse moves
    const n = scored.length;
    if (n <= 2) return scored[Math.floor(Math.random() * n)].move;
    const r = Math.random();
    let idx;
    if (r < 0.5) {
      // 50%: pick from the bottom half
      const start = Math.floor(n / 2);
      idx = start + Math.floor(Math.random() * (n - start));
    } else {
      // 50%: pick anywhere
      idx = Math.floor(Math.random() * n);
    }
    return scored[Math.min(n - 1, Math.max(0, idx))].move;
  }

  function scheduleAiIfNeeded() {
    if (!gameStarted || paused || gameOver) return;
    if (aiTimeoutId) return;

    const isAiTurn =
      (mode === 'you-vs-ai' && currentPlayer === 'b') ||
      (mode === 'ai-vs-ai');
    if (!isAiTurn) return;

    const moves = generateCurrentMoves();
    if (!moves.length) return;

    aiTimeoutId = setTimeout(() => {
      aiTimeoutId = null;
      const move = pickAiMove();
      if (!move) {
        checkGameOver();
        return;
      }
      handleMove(move, true);
    }, mode === 'ai-vs-ai' ? 280 : 320);

    status.textContent =
      mode === 'ai-vs-ai'
        ? (currentPlayer === 'w' ? 'Blue AI is thinking...' : 'Red AI is thinking...')
        : 'Red AI is thinking...';
  }

  function onNewGame() {
    sound.playClick();
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    gameOver = false;
    board = createInitialBoard();
    currentPlayer = 'w';
    lastMove = null;
    selected = null;
    history.length = 0;
    advantageHistory.length = 0;
    hintsLeft = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1;
    renderBoard();
    updateAdvantageHistory();
    updateStatus();
    updateHintInfo();
    if (mode === 'ai-vs-ai') {
      scheduleAiIfNeeded();
    }
  }

  function onUndo() {
    sound.playClick();
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    if (!history.length) return;

    // In You vs AI mode, undo the last two plies when possible (AI + human)
    const steps = mode === 'you-vs-ai' && history.length >= 2 ? 2 : 1;
    for (let i = 0; i < steps; i++) {
      const prev = history.pop();
      if (!prev) break;
      restoreState(prev);
      if (advantageHistory.length) advantageHistory.pop();
    }
    renderBoard();
    redrawGraph();
    updateStatus();
  }

  function onFlip() {
    sound.playClick();
    southColor = southColor === 'w' ? 'b' : 'w';
    renderBoard();
  }

  function onHint() {
    sound.playClick();
    if (paused || gameOver) return;
    if (mode === 'you-vs-ai' && currentPlayer !== 'w') {
      alert('Wait for your turn to use a hint.');
      return;
    }
    if (hintsLeft <= 0) {
      alert('No hints left for this game.');
      return;
    }
    const moves = generateCurrentMoves();
    if (!moves.length) {
      alert('No legal moves available.');
      return;
    }

    // Reuse the AI scorer but always play as "hard" for hints.
    const scored = moves.map(m => ({ move: m, score: scoreMoveHeuristic(m, currentPlayer) }));
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0]?.move;
    if (!best) {
      alert('No hint available.');
      return;
    }

    clearSelectionHighlights();
    const fromBtn = findSquareButton(best.from.r, best.from.c);
    const toBtn = findSquareButton(best.to.r, best.to.c);
    if (fromBtn) fromBtn.classList.add('best-move');
    if (toBtn) toBtn.classList.add('best-move');

    hintsLeft -= 1;
    updateHintInfo();
  }

  function onModeYouVsAi() {
    sound.playClick();
    mode = 'you-vs-ai';
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    paused = false;
    updateModeButtons();
    updatePauseButton();
    // Restart game when switching modes
    onNewGame();
  }

  function onModeTwoPlayer() {
    sound.playClick();
    mode = 'two-player';
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    paused = false;
    updateModeButtons();
    updatePauseButton();
    // Restart game when switching modes
    onNewGame();
  }

  function onModeAiVsAi() {
    sound.playClick();
    mode = 'ai-vs-ai';
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    paused = false;
    updateModeButtons();
    updatePauseButton();
    // Restart game when switching modes (AI vs AI will auto-start after new game)
    onNewGame();
  }

  function onPauseClick() {
    sound.playClick();
    paused = !paused;
    if (paused && aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    updatePauseButton();
    updateStatus();
    if (!paused) {
      scheduleAiIfNeeded();
    }
  }

  // --- Wire up buttons ---
  newBtn.addEventListener('click', onNewGame);
  undoBtn.addEventListener('click', onUndo);
  flipBtn.addEventListener('click', onFlip);
  hintBtn.addEventListener('click', onHint);
  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    setTimeout(() => {
      document.body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    setTimeout(() => {
      showTutorial();
    }, 300);
  });
  youVsAiBtn.addEventListener('click', onModeYouVsAi);
  twoPBtn.addEventListener('click', onModeTwoPlayer);
  aiVsAiBtn.addEventListener('click', onModeAiVsAi);
  pauseBtn.addEventListener('click', onPauseClick);

  easyBtn.addEventListener('click', () => {
    sound.playClick();
    difficulty = 'easy';
    hintsLeft = 5;
    updateDifficultyButtons();
    updateHintInfo();
  });
  medBtn.addEventListener('click', () => {
    sound.playClick();
    difficulty = 'medium';
    hintsLeft = 3;
    updateDifficultyButtons();
    updateHintInfo();
  });
  hardBtn.addEventListener('click', () => {
    sound.playClick();
    difficulty = 'hard';
    hintsLeft = 1;
    updateDifficultyButtons();
    updateHintInfo();
  });

  // --- Initial setup ---
  hintsLeft = 5; // default for easy
  updateDifficultyButtons();
  updateModeButtons();
  updatePauseButton();
  renderBoard();
  updateAdvantageHistory();
  updateStatus();
  updateHintInfo();

  // Add hub button to toolbar
  const hubToolbarBtn = document.createElement('button');
  hubToolbarBtn.type = 'button';
  hubToolbarBtn.className = 'button';
  hubToolbarBtn.textContent = '🏠 Hub';
  hubToolbarBtn.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  `;
  hubToolbarBtn.addEventListener('mouseenter', () => {
    hubToolbarBtn.style.transform = 'scale(1.05)';
  });
  hubToolbarBtn.addEventListener('mouseleave', () => {
    hubToolbarBtn.style.transform = 'scale(1)';
  });
  hubToolbarBtn.addEventListener('click', () => {
    sound.playClick();
    location.hash = '#/';
  });
  toolbar.appendChild(hubToolbarBtn);

  // Show tutorial for first-time players
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(() => {
      showTutorial();
    }, 500);
  }

  // --- Cleanup ---
  return () => {
    if (aiTimeoutId) clearTimeout(aiTimeoutId);
    newBtn.removeEventListener('click', onNewGame);
    undoBtn.removeEventListener('click', onUndo);
    flipBtn.removeEventListener('click', onFlip);
    hintBtn.removeEventListener('click', onHint);
    youVsAiBtn.removeEventListener('click', onModeYouVsAi);
    twoPBtn.removeEventListener('click', onModeTwoPlayer);
    aiVsAiBtn.removeEventListener('click', onModeAiVsAi);
    pauseBtn.removeEventListener('click', onPauseClick);
    easyBtn.replaceWith(easyBtn.cloneNode(true));
    medBtn.replaceWith(medBtn.cloneNode(true));
    hardBtn.replaceWith(hardBtn.cloneNode(true));
    squares.forEach(sq => sq.removeEventListener('click', onSquareClick));
    wrap.remove();
  };
}
