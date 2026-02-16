// games/ticTacToeAi.js
import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'ttt';

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const pauseBtn = btn('Pause');
  pauseBtn.classList.add('button');

  const modeBtn = btn('Play vs AI');
  modeBtn.classList.add('button');

  const resetBtn = btn('Reset game');
  resetBtn.classList.add('button');

  const sideLabel = document.createElement('span');
  sideLabel.className = 'badge';

  const sideXBtn = btn('Be X');
  const sideOBtn = btn('Be O');
  sideXBtn.classList.add('button');
  sideOBtn.classList.add('button');

  const scoreEl = badge('Games: 0 | X: 0 | O: 0 | Draws: 0');
  const streakEl = badge('Current streak: -');
  const bestEl = badge('Best streak: 0');

  const sideWrap = document.createElement('div');
  sideWrap.style.display = 'flex';
  sideWrap.style.gap = '4px';
  sideWrap.style.alignItems = 'center';
  sideWrap.append(sideLabel, sideXBtn, sideOBtn);

  // Betting panel (for AI vs AI spectator mode)
  const betPanel = document.createElement('div');
  betPanel.className = 'ttt-bet';
  const betLabel = document.createElement('span');
  betLabel.textContent = "1P Playbux bet:";
  const bet1PBtn = btn('1P Bet');
  const betSideXBtn = btn('Bet X');
  const betSideOBtn = btn('Bet O');
  const betInfo = document.createElement('span');
  betInfo.className = 'ttt-bet-info';
  betPanel.append(betLabel, bet1PBtn, betSideXBtn, betSideOBtn, betInfo);

  // Per-game fullscreen button (targets just this game area)
  if (window.playBoxCreateFullscreenButton) {
    const fsBtn = window.playBoxCreateFullscreenButton(wrap);
    if (fsBtn) toolbar.appendChild(fsBtn);
  }

  toolbar.append(pauseBtn, modeBtn, resetBtn, sideWrap, scoreEl, streakEl, bestEl);

  const status = document.createElement('div');
  status.className = 'ttt-status';

  const grid = document.createElement('div');
  grid.className = 'ttt-grid';

  const graphWrap = document.createElement('div');
  graphWrap.className = 'ttt-graph';
  const graphTitle = document.createElement('div');
  graphTitle.className = 'ttt-graph-title';
  graphTitle.textContent = 'AI win streak & performance';
  const graphCanvas = document.createElement('canvas');
  graphCanvas.width = 420;
  graphCanvas.height = 140;
  graphWrap.append(graphTitle, graphCanvas);

  const rulesEl = createRules([
    'Two AIs take turns playing Tic-Tac-Toe automatically.',
    'X always moves first, then O.',
    'Watch the scoreboard to see which AI builds the longest win streak.',
    'Use Pause to stop the simulation and Resume to continue.',
  ]);

  wrap.append(toolbar, betPanel, rulesEl, status, grid, graphWrap);
  root.appendChild(wrap);

  // Board setup
  const cells = Array.from({ length: 9 }, (_, i) => {
    const c = { el: cell(), val: '' };
    c.el.addEventListener('click', () => handleCellClick(i));
    grid.appendChild(c.el);
    return c;
  });

  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  // Score + streak state
  const HS_KEY = 'tic-tac-toe-ai';
  let bestStreak = getHighScore(HS_KEY) || 0;
  let games = 0;
  let winsX = 0;
  let winsO = 0;
  let draws = 0;
  let currentWinner = null; // 'X' | 'O' | null
  let currentStreak = 0;
  let playerSide = 'X';

  // Betting state (1P Playbux only)
  let betMode = 'none'; // 'none' | '1p'
  let betChoice1P = null; // 'X' | 'O' | null
  let betStake1P = 0; // Playbux stake for 1P bets

  const history = [];
  const MAX_HISTORY_POINTS = 120;
  let smoothedXRate = 0;
  let smoothedORate = 0;

  function renderPlayerSide() {
    sideLabel.textContent = `You are: ${playerSide} (X always moves first)`;
  }

  function drawGraph() {
    if (!graphCanvas || !history.length) return;
    const ctx = graphCanvas.getContext('2d');
    if (!ctx) return;
    const w = graphCanvas.width;
    const h = graphCanvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(32, 10);
    const innerW = w - 42;
    const innerH = h - 26;

    // axes
    ctx.strokeStyle = 'rgba(148,163,184,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, innerH);
    ctx.lineTo(innerW, innerH);
    ctx.stroke();

    // X win-rate line (red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((p, i) => {
      const x = (i / Math.max(1, history.length - 1)) * innerW;
      const y = innerH - p.xRate * innerH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // O win-rate line (blue)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((p, i) => {
      const x = (i / Math.max(1, history.length - 1)) * innerW;
      const y = innerH - p.oRate * innerH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.font = '10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('X win rate', 0, innerH + 12);
    ctx.fillText('O win rate', 80, innerH + 12);

    ctx.restore();
  }

  function recordHistory() {
    if (!games) return;
    const rawX = games ? winsX / games : 0;
    const rawO = games ? winsO / games : 0;
    if (!history.length) {
      smoothedXRate = rawX;
      smoothedORate = rawO;
    } else {
      const alpha = 1 / Math.sqrt(games); // big jumps early, smaller later
      smoothedXRate = smoothedXRate + alpha * (rawX - smoothedXRate);
      smoothedORate = smoothedORate + alpha * (rawO - smoothedORate);
    }
    history.push({
      game: games,
      xRate: smoothedXRate,
      oRate: smoothedORate,
    });
    if (history.length > MAX_HISTORY_POINTS) history.shift();
    drawGraph();
  }

  function renderScores() {
    scoreEl.textContent = `Games: ${games} | X: ${winsX} | O: ${winsO} | Draws: ${draws}`;
    if (currentWinner && currentStreak > 0) {
      streakEl.textContent = `Current streak: ${currentWinner} × ${currentStreak}`;
    } else {
      streakEl.textContent = 'Current streak: -';
    }
    bestEl.textContent = `Best streak: ${bestStreak}`;
  }

  function renderBetInfo() {
    if (!betInfo) return;
    if (betMode === '1p') {
      const side = betChoice1P || 'None';
      const stake = betStake1P || 0;
      const pb = typeof window !== 'undefined' && typeof window.playBoxGetPlaybux === 'function'
        ? window.playBoxGetPlaybux()
        : 0;
      betInfo.textContent = `Mode: 1P · Bet: ${side} · Stake: ${stake} PB · Wallet: ${pb} PB`;
    } else {
      betInfo.textContent = 'Playbux betting off — click 1P Bet to start';
    }
  }

  bestEl.textContent = `Best streak: ${bestStreak}`;

  // Simulation state
  let board = Array(9).fill('');
  let turn = 'X';
  let running = true;
  let timer = null;
  let mode = 'auto'; // 'auto' | 'player'
  let gameOver = false;
  let usedWorstMoveThisGame = false;
  const MOVE_DELAY = 3000; // ms between moves (AI "thinking" time)
  const ROUND_DELAY = 900; // pause between games in auto mode

  function cell() {
    const b = document.createElement('button');
    b.className = 'ttt-cell';
    b.setAttribute('aria-label', 'cell');
    b.disabled = true; // AI-only game; user cannot click
    return b;
  }

  function btn(text) {
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

  function createRules(items) {
    const d = document.createElement('details');
    d.className = 'rules';
    const s = document.createElement('summary');
    s.textContent = 'Rules';
    const ul = document.createElement('ul');
    items.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    d.append(s, ul);
    return d;
  }

  function setAllDisabled(disabled) {
    cells.forEach(c => {
      c.el.disabled = disabled;
    });
  }

  function refreshPlayerBoardDisabled() {
    cells.forEach(c => {
      c.el.disabled = !!c.val || gameOver;
    });
  }

  function getAiSide() {
    return playerSide === 'X' ? 'O' : 'X';
  }

  function resetBoard() {
    board = Array(9).fill('');
    cells.forEach(c => {
      c.val = '';
      c.el.textContent = '';
    });
    turn = 'X';
    gameOver = false;
    usedWorstMoveThisGame = false;
    if (mode === 'auto') {
      setAllDisabled(true);
      status.textContent = "AI X is thinking...";
    } else {
      refreshPlayerBoardDisabled();
      if (playerSide === 'X') {
        status.textContent = `Your turn (${playerSide})`;
      } else {
        status.textContent = `AI's turn (${getAiSide()})`;
      }
    }
  }

  function isBadGame() {
    // Use overall game counter + 1 (the game that's about to be played)
    // Every 2nd game in player mode becomes a "bad" game where AI makes one worst move.
    const upcoming = games + 1;
    return mode === 'player' && (upcoming % 2 === 0);
  }

  function maybeStartAiAsXIfNeeded() {
    if (mode !== 'player') return;
    if (playerSide !== 'O') return;
    status.textContent = `AI is thinking as X...`;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      let idx;
      if (isBadGame() && !usedWorstMoveThisGame) {
        idx = chooseWorstMove('X');
        usedWorstMoveThisGame = true;
      } else {
        idx = chooseMove('X');
      }
      if (idx !== -1) placeMark(idx, 'X');
      turn = playerSide;
      refreshPlayerBoardDisabled();
      status.textContent = `Your turn (${playerSide})`;
    }, MOVE_DELAY);
  }

  function checkWinner() {
    for (const line of wins) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  function isBoardFull() {
    return board.every(v => v);
  }

  function availableIndices(b = board) {
    const out = [];
    for (let i = 0; i < b.length; i++) {
      if (!b[i]) out.push(i);
    }
    return out;
  }

  function winnerFor(b) {
    for (const line of wins) {
      const [a, bIdx, cIdx] = line;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[cIdx]) {
        return b[a];
      }
    }
    return null;
  }

  function isFullBoard(b) {
    return b.every(v => v);
  }

  function minimax(b, current, me) {
    const winner = winnerFor(b);
    if (winner || isFullBoard(b)) {
      if (winner === me) return { score: 1, index: -1 };
      if (winner && winner !== me) return { score: -1, index: -1 };
      return { score: 0, index: -1 };
    }

    const empties = availableIndices(b);
    let bestScore = current === me ? -Infinity : Infinity;
    let bestIndex = empties[0] ?? -1;

    for (const idx of empties) {
      b[idx] = current;
      const next = current === 'X' ? 'O' : 'X';
      const result = minimax(b, next, me);
      b[idx] = '';
      if (current === me) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestIndex = idx;
        }
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestIndex = idx;
        }
      }
    }

    return { score: bestScore, index: bestIndex };
  }

  const SLOPPY_AUTO = 0.8;    // AI vs AI: mostly random, winners are very random, fewer draws
  const SLOPPY_PLAYER = 0.45; // vs player: very sloppy, often makes mistakes

  function chooseWorstMove(player) {
    const empties = availableIndices();
    if (!empties.length) return -1;
    const copy = [...board];
    let worstScore = Infinity;
    let worstIndex = empties[0];
    for (const idx of empties) {
      copy[idx] = player;
      const next = player === 'X' ? 'O' : 'X';
      const result = minimax(copy, next, player);
      copy[idx] = '';
      if (result.score < worstScore) {
        worstScore = result.score;
        worstIndex = idx;
      }
    }
    return worstIndex;
  }

  function chooseMove(player) {
    const empties = availableIndices();
    if (!empties.length) return -1;

    const chance = mode === 'auto' ? SLOPPY_AUTO : SLOPPY_PLAYER;
    if (Math.random() < chance) {
      // Dumb move: pick a random empty cell, ignoring perfect search
      return empties[Math.floor(Math.random() * empties.length)];
    }

    // Smart move: full minimax search for best outcome
    const copy = [...board];
    const { index } = minimax(copy, player, player);
    return index == null ? -1 : index;
  }

  function step() {
    timer = null;
    if (!running) return;

    const idx = chooseMove(turn);
    if (idx === -1) {
      // Board full or something went wrong, treat as draw
      finishRound(null);
      return;
    }

    board[idx] = turn;
    cells[idx].val = turn;
    cells[idx].el.textContent = turn;
    sound.playMove();

    const winner = checkWinner();
    const full = isBoardFull();

    if (winner || full) {
      finishRound(winner);
      return;
    }

    turn = turn === 'X' ? 'O' : 'X';
    status.textContent = `AI ${turn} is thinking...`;
    scheduleNextStep(MOVE_DELAY);
  }

  function scheduleNextStep(delay) {
    if (!running) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(step, delay);
  }

  function applyResult(winner) {
    if (winner === 'X') {
      winsX += 1;
    } else if (winner === 'O') {
      winsO += 1;
    } else {
      draws += 1;
    }

    // Streak logic: only count non-draw wins
    if (winner === 'X' || winner === 'O') {
      if (currentWinner === winner) {
        currentStreak += 1;
      } else {
        currentWinner = winner;
        currentStreak = 1;
      }
      if (currentStreak > bestStreak) {
        bestStreak = updateHighScore(HS_KEY, currentStreak);
      }
    } else {
      currentWinner = null;
      currentStreak = 0;
    }

    renderScores();
    recordHistory();
  }

  function settleAutoBets(winner) {
    if (!winner) {
      // Draw: refund 1P stake if there was one
      if (betMode === '1p' && betChoice1P && betStake1P > 0 && window.playBoxAddPlaybux) {
        try { window.playBoxAddPlaybux(betStake1P); } catch {}
        betStake1P = 0;
        renderBetInfo();
      }
      return;
    }
    if (betMode === '1p' && betChoice1P && betStake1P > 0) {
      if (typeof window !== 'undefined' && typeof window.playBoxAddPlaybux === 'function') {
        try {
          if (betChoice1P === winner) {
            // Win: pay back 2x stake (net +stake since stake was already removed)
            window.playBoxAddPlaybux(betStake1P * 2);
          }
        } catch {}
      }
      // On loss, stake is already gone. Clear bet either way.
      betStake1P = 0;
      renderBetInfo();
    }
    renderBetInfo();
  }

  function finishRound(winner) {
    games += 1;

    applyResult(winner);
    if (mode === 'auto') settleAutoBets(winner);

    if (winner === 'X') {
      status.textContent = `Game ${games}: X wins!`;
      sound.playWin();
    } else if (winner === 'O') {
      status.textContent = `Game ${games}: O wins!`;
      sound.playWin();
    } else {
      status.textContent = `Game ${games}: Draw!`;
      sound.playGameOver();
    }

    // Start next game after a short pause
    if (running) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        resetBoard();
        scheduleNextStep(MOVE_DELAY);
      }, ROUND_DELAY);
    }
  }

  function placeMark(idx, mark) {
    board[idx] = mark;
    cells[idx].val = mark;
    cells[idx].el.textContent = mark;
    sound.playMove();
  }

  function endPlayerGame(winner) {
    if (gameOver) return;
    gameOver = true;
    games += 1;
    applyResult(winner);

    if (winner === playerSide) {
      status.textContent = `You win as ${playerSide}!`;
      sound.playWin();
    } else if (winner === getAiSide()) {
      status.textContent = `AI wins as ${getAiSide()}.`;
      sound.playGameOver();
    } else {
      status.textContent = 'Draw!';
      sound.playGameOver();
    }

    refreshPlayerBoardDisabled();
  }

  function handleCellClick(i) {
    if (mode !== 'player') return;
    if (gameOver) return;
    if (board[i]) return;
    if (turn !== playerSide) return; // not your turn yet

    placeMark(i, playerSide);

    let winner = checkWinner();
    let full = isBoardFull();
    if (winner || full) {
      endPlayerGame(winner);
      return;
    }

    // AI move with perfect search
    turn = getAiSide();
    refreshPlayerBoardDisabled();
    status.textContent = `AI is thinking as ${turn}...`;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      let idx;
      if (isBadGame() && !usedWorstMoveThisGame) {
        idx = chooseWorstMove(turn);
        usedWorstMoveThisGame = true;
      } else {
        idx = chooseMove(turn);
      }
      if (idx === -1) {
        endPlayerGame(null);
        return;
      }
      placeMark(idx, turn);
      winner = checkWinner();
      full = isBoardFull();
      if (winner || full) {
        endPlayerGame(winner);
        return;
      }
      turn = playerSide;
      refreshPlayerBoardDisabled();
      status.textContent = `Your turn (${playerSide})`;
    }, MOVE_DELAY);
  }

  const onPauseClick = () => {
    if (mode !== 'auto') {
      sound.playClick();
      return; // pause only affects auto mode
    }
    sound.playClick();
    running = !running;
    if (!running) {
      pauseBtn.textContent = 'Resume';
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      status.textContent += ' (paused)';
    } else {
      pauseBtn.textContent = 'Pause';
      if (!timer) {
        // If game already finished, start a new round
        if (checkWinner() || isBoardFull()) {
          resetBoard();
        }
        scheduleNextStep(MOVE_DELAY);
      }
    }
  };

  pauseBtn.addEventListener('click', onPauseClick);

  const onSideXClick = () => {
    sound.playClick();
    playerSide = 'X';
    renderPlayerSide();
  };
  const onSideOClick = () => {
    sound.playClick();
    playerSide = 'O';
    renderPlayerSide();
  };

  sideXBtn.addEventListener('click', onSideXClick);
  sideOBtn.addEventListener('click', onSideOClick);

  const onBet1PClick = () => {
    sound.playClick();
    betMode = '1p';
    betChoice1P = null;
    betStake1P = 0;
    renderBetInfo();
  };
  function startNewAutoGameForBet() {
    if (mode !== 'auto') return;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    gameOver = false;
    running = true;
    resetBoard();
    scheduleNextStep(MOVE_DELAY);
  }

  const onBetSideXClick = () => {
    sound.playClick();
    if (mode !== 'auto') return; // betting only in Watch AIs mode
    if (betMode === '1p') {
      if (!window.playBoxGetPlaybux || !window.playBoxSpendPlaybux) {
        alert('Playbux betting is not available right now.');
        return;
      }
      const wallet = window.playBoxGetPlaybux();
      let raw = prompt('How many Playbux do you want to bet on X?');
      if (raw == null) return;
      let stake = Math.max(0, Math.floor(Number(raw) || 0));
      if (!stake) {
        alert('Enter a positive Playbux amount.');
        return;
      }
      if (stake > wallet) {
        alert('You do not have enough Playbux for that bet.');
        return;
      }
      const ok = window.playBoxSpendPlaybux(stake);
      if (!ok) {
        alert('Failed to place bet (not enough Playbux).');
        return;
      }
      betChoice1P = 'X';
      betStake1P = stake;
    }
    renderBetInfo();
    // Any bet on a side must start a brand new AI-vs-AI game so you can't bet mid-game
    startNewAutoGameForBet();
  };
  const onBetSideOClick = () => {
    sound.playClick();
    if (mode !== 'auto') return;
    if (betMode === '1p') {
      if (!window.playBoxGetPlaybux || !window.playBoxSpendPlaybux) {
        alert('Playbux betting is not available right now.');
        return;
      }
      const wallet = window.playBoxGetPlaybux();
      let raw = prompt('How many Playbux do you want to bet on O?');
      if (raw == null) return;
      let stake = Math.max(0, Math.floor(Number(raw) || 0));
      if (!stake) {
        alert('Enter a positive Playbux amount.');
        return;
      }
      if (stake > wallet) {
        alert('You do not have enough Playbux for that bet.');
        return;
      }
      const ok = window.playBoxSpendPlaybux(stake);
      if (!ok) {
        alert('Failed to place bet (not enough Playbux).');
        return;
      }
      betChoice1P = 'O';
      betStake1P = stake;
    }
    renderBetInfo();
    // Any bet on a side must start a brand new AI-vs-AI game so you can't bet mid-game
    startNewAutoGameForBet();
  };

  bet1PBtn.addEventListener('click', onBet1PClick);
  betSideXBtn.addEventListener('click', onBetSideXClick);
  betSideOBtn.addEventListener('click', onBetSideOClick);

  const onResetClick = () => {
    sound.playClick();
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    gameOver = false;
    // If a 1P bet was active, just leave it for the next auto game
    resetBoard();
    if (mode === 'player') {
      maybeStartAiAsXIfNeeded();
    } else {
      running = true;
      scheduleNextStep(MOVE_DELAY);
    }
  };

  resetBtn.addEventListener('click', onResetClick);

  const onModeClick = () => {
    sound.playClick();
    if (mode === 'auto') {
      // Switch to player vs AI mode
      if (betMode === '1p' && betChoice1P && betStake1P > 0 && window.playBoxAddPlaybux) {
        // Refund unresolved 1P bet when leaving auto mode
        try { window.playBoxAddPlaybux(betStake1P); } catch {}
        betStake1P = 0;
        renderBetInfo();
      }
      mode = 'player';
      running = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      modeBtn.textContent = 'Watch AIs';
      resetBoard();
      maybeStartAiAsXIfNeeded();
    } else {
      // Switch back to auto AI vs AI mode
      mode = 'auto';
      gameOver = false;
      modeBtn.textContent = 'Play vs AI';
      resetBoard();
      running = true;
      scheduleNextStep(MOVE_DELAY);
    }
  };

  modeBtn.addEventListener('click', onModeClick);

  // Start screen
  const startScreen = document.createElement('div');
  startScreen.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    ">
      <div style="
        text-align: center;
        max-width: 500px;
        padding: 2rem;
        background: rgba(30, 41, 59, 0.8);
        border-radius: 20px;
        border: 2px solid #8b5cf6;
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;">
          🤖
        </div>
        <h1 style="
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        ">Tic Tac Toe AI</h1>
        <p style="color: #94a3b8; margin-bottom: 2rem; font-size: 1.1rem;">
          Watch AI battle or play yourself
        </p>
        
        <div style="
          background: rgba(15, 23, 42, 0.6);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
          border: 1px solid rgba(139, 92, 246, 0.2);
        ">
          <h3 style="color: #8b5cf6; margin-bottom: 1rem; font-size: 1.2rem;">🎮 Modes</h3>
          <ul style="color: #cbd5e1; list-style: none; padding: 0; line-height: 1.8;">
            <li>👤 Play against AI</li>
            <li>🤖 Watch AI vs AI</li>
            <li>📊 Track win streaks</li>
            <li>⚡ Multiple difficulty levels</li>
          </ul>
        </div>

        <div style="
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        ">
          <div style="
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid #8b5cf6;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            text-align: center;
            flex: 1;
          ">
            <div style="color: #8b5cf6; font-weight: bold; font-size: 1.5rem;">${bestStreak}</div>
            <div style="color: #64748b; font-size: 0.85rem;">Best Streak</div>
          </div>
        </div>

        <button class="ttt-ai-start-btn" type="button" style="
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulse 2s infinite;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(139, 92, 246, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
          🎮 Start Game
        </button>

        <button class="ttt-ai-hub-btn" type="button" style="
          width: 100%;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          margin-top: 0.75rem;
          background: rgba(239, 68, 68, 0.3);
          border: 1px solid #ef4444;
          border-radius: 8px;
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(239, 68, 68, 0.5)'; this.style.borderColor='#f87171'" onmouseout="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'">
          🏠 Back to Hub
        </button>
      </div>
    </div>
  `;
  root.appendChild(startScreen);

  const tttAiStartBtn = startScreen.querySelector('.ttt-ai-start-btn');
  const tttAiHubBtn = startScreen.querySelector('.ttt-ai-hub-btn');

  tttAiStartBtn.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    setTimeout(() => {
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  tttAiHubBtn.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    location.hash = '#/';
  });

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

  // Initial render + start simulation (auto mode)
  renderPlayerSide();
  renderScores();
  renderBetInfo();
  resetBoard();
  scheduleNextStep(MOVE_DELAY);

  return () => {
    if (timer) clearTimeout(timer);
    pauseBtn.removeEventListener('click', onPauseClick);
    sideXBtn.removeEventListener('click', onSideXClick);
    sideOBtn.removeEventListener('click', onSideOClick);
    bet1PBtn.removeEventListener('click', onBet1PClick);
    betSideXBtn.removeEventListener('click', onBetSideXClick);
    betSideOBtn.removeEventListener('click', onBetSideOClick);
    resetBtn.removeEventListener('click', onResetClick);
    modeBtn.removeEventListener('click', onModeClick);
    if (startScreen.parentNode) startScreen.remove();
    if (scrollIndicator.parentNode) scrollIndicator.remove();
    wrap.remove();
  };
}
