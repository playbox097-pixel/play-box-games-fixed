// games/hive.js
// Prototype 2-player Hive (placement + win detection) for Play Box

import { sound } from '../sound.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'hive';

  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const resetBtn = button('Reset');
  resetBtn.classList.add('button');

  const status = document.createElement('div');
  status.className = 'hive-status';

  toolbar.append(resetBtn);

  const layout = document.createElement('div');
  layout.className = 'hive-layout';

  const boardEl = document.createElement('div');
  boardEl.className = 'hive-board';

  const side = document.createElement('div');
  side.className = 'hive-side';

  const poolTitle = document.createElement('h3');
  poolTitle.textContent = 'Available pieces';

  const poolsEl = document.createElement('div');
  poolsEl.className = 'hive-pools';

  const rules = createRules([
    'Two players (White and Black) place insect tiles on a hex grid.',
    'Goal: surround the opponent\'s Queen Bee on all 6 sides.',
    'Each player must place their Queen Bee by their 4th turn.',
    'On your turn you may either place a new piece from your pool or move one of your pieces.',
    'Queen (🐝): moves 1 hex to any adjacent empty space.',
    'Beetle (🪲): moves 1 hex like the Queen (climbing not yet implemented).',
    'Grasshopper (🦗): jumps in a straight line over 1+ pieces to the next empty hex.',
    'Spider (🕷): walks exactly 3 steps through empty neighboring hexes.',
    'Ant (🐜): walks through empty neighboring hexes any number of steps.',
    '(This first version ignores some advanced Hive rules like tight sliding gaps.)',
  ]);

  side.append(poolTitle, poolsEl, rules);

  layout.append(boardEl, side);
  wrap.append(toolbar, status, layout);
  root.appendChild(wrap);

  // --- Game state ---
  const BOARD_RADIUS = 5;

  const NEIGHBORS = [
    [1, 0], [-1, 0],
    [0, 1], [0, -1],
    [1, -1], [-1, 1],
  ];

  const players = ['White', 'Black'];
  let currentPlayerIndex = 0;

  const basePool = { Q: 1, B: 2, G: 3, S: 3, A: 3 };
  let pools = {
    White: { ...basePool },
    Black: { ...basePool },
  };

  let placements = { White: 0, Black: 0 };

  const hive = new Map();
  let gameOver = false;
  let winner = null;

  let selectedPieceType = 'Q';
  let dragPayload = null;

  const poolSpans = { White: {}, Black: {} };
  const poolItems = { White: {}, Black: {} };
  const cells = [];
  const LONG_PRESS_MS = 400;

  let selectedFrom = null;
  let selectedMoves = [];

  function key(q, r) { return `${q},${r}`; }
  function parseKey(k) { const [q, r] = k.split(',').map(Number); return { q, r }; }
  function inBounds(q, r) { return Math.abs(q) <= BOARD_RADIUS && Math.abs(r) <= BOARD_RADIUS; }
  function neighborsOf(q, r) { return NEIGHBORS.map(([dq, dr]) => ({ q: q + dq, r: r + dr })); }
  function hasAnyPieces() { return hive.size > 0; }
  function isAdjacentToAny(q, r) { return neighborsOf(q, r).some(({ q: nq, r: nr }) => hive.has(key(nq, nr))); }
  function currentPlayer() { return players[currentPlayerIndex]; }
  function otherPlayer() { return players[1 - currentPlayerIndex]; }
  function hasPlacedQueen(player) { return pools[player].Q === 0; }

  function glyph(piece) {
    if (!piece) return '';
    const base = { Q: '🐝', B: '🪲', G: '🦗', S: '🕷', A: '🐜' }[piece.type] || piece.type;
    return base;
  }

  function describePiece(piece) {
    if (!piece) return 'empty';
    const name = { Q: 'Queen Bee', B: 'Beetle', G: 'Grasshopper', S: 'Spider', A: 'Ant' }[piece.type] || piece.type;
    return `${piece.player} ${name}`;
  }

  function updateSelectedPieceHighlight() {
    const current = currentPlayer();
    ['White', 'Black'].forEach((p) => {
      ['Q', 'B', 'G', 'S', 'A'].forEach((t) => {
        const li = poolItems[p][t];
        if (!li) return;
        li.classList.toggle('hive-pool-selected', p === current && t === selectedPieceType);
      });
    });
  }

  function updateStatus() {
    if (winner && gameOver) {
      if (winner === 'Draw') status.textContent = 'Draw — both queens surrounded.';
      else status.textContent = `${winner} wins — opponent's queen is surrounded.`;
      return;
    }
    const player = currentPlayer();
    const turn = placements.White + placements.Black + 1;
    status.textContent = `${player}'s turn (turn ${turn}) — select a piece and click an empty cell to place it.`;
  }

  function updatePoolsUi() {
    ['White', 'Black'].forEach((p) => {
      ['Q', 'B', 'G', 'S', 'A'].forEach((t) => {
        const span = poolSpans[p][t];
        if (!span) return;
        span.textContent = String(pools[p][t]);
      });
    });
  }

  function buildPoolsUi() {
    poolsEl.innerHTML = '';
    ['White', 'Black'].forEach((p) => {
      const box = document.createElement('div');
      box.className = 'hive-pool';
      const heading = document.createElement('div');
      heading.className = 'hive-pool-title';
      heading.textContent = p;
      box.appendChild(heading);

      const list = document.createElement('ul');
      list.className = 'hive-pool-list';

      const entries = [['Q','Queen Bee'],['B','Beetle'],['G','Grasshopper'],['S','Spider'],['A','Ant']];
      entries.forEach(([code,label]) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.player = p;
        li.dataset.type = code;
        const nameSpan = document.createElement('span');
        nameSpan.textContent = label;
        const countSpan = document.createElement('span');
        countSpan.className = 'badge';
        poolSpans[p][code] = countSpan;
        poolItems[p][code] = li;
        li.append(nameSpan, countSpan);
        li.addEventListener('click', onPoolClick);
        li.addEventListener('dragstart', onPoolDragStart);
        li.addEventListener('dragend', onPoolDragEnd);
        list.appendChild(li);
      });

      box.appendChild(list);
      poolsEl.appendChild(box);
    });

    updatePoolsUi();
  }

  function attachCellPressHandlers(btn) {
    let timer = null;
    let pressed = false;
    const start = () => {
      if (gameOver || btn.disabled) return;
      pressed = true;
      timer = setTimeout(() => {
        timer = null;
        if (!pressed) return;
        handleCellPressAndHold(btn);
      }, LONG_PRESS_MS);
    };
    const cancel = () => {
      pressed = false;
      if (timer !== null) { clearTimeout(timer); timer = null; }
    };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start);
    btn.addEventListener('mouseup', cancel);
    btn.addEventListener('mouseleave', cancel);
    btn.addEventListener('touchend', cancel);
    btn.addEventListener('touchcancel', cancel);
  }

  function handleCellPressAndHold(btn) {
    if (gameOver) return;
    const q = Number(btn.dataset.q);
    const r = Number(btn.dataset.r);
    const player = currentPlayer();
    const type = selectedPieceType;
    const existing = hive.get(key(q, r));
    if (existing) return;
    if (!canPlaceHere(player, type, q, r)) { sound.playClick(); return; }
    placePieceFromPool(player, type, q, r);
    clearSelection();
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    cells.length = 0;
    for (let rIdx = -BOARD_RADIUS; rIdx <= BOARD_RADIUS; rIdx++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'hive-row';
      for (let qIdx = -BOARD_RADIUS; qIdx <= BOARD_RADIUS; qIdx++) {
        if (!inBounds(qIdx, rIdx)) continue;
        const btn = document.createElement('button');
        btn.className = 'hive-cell';
        btn.dataset.q = String(qIdx);
        btn.dataset.r = String(rIdx);
        btn.addEventListener('click', onCellClick);
        btn.addEventListener('dragover', onCellDragOver);
        btn.addEventListener('drop', onCellDrop);
        attachCellPressHandlers(btn);
        const k = key(qIdx, rIdx);
        const piece = hive.get(k) || null;
        btn.textContent = glyph(piece);
        btn.title = `${qIdx},${rIdx} — ${describePiece(piece)}`;
        rowEl.appendChild(btn);
        cells.push(btn);
      }
      boardEl.appendChild(rowEl);
    }
  }

  function refreshBoardCells() {
    cells.forEach((btn) => {
      const q = Number(btn.dataset.q);
      const r = Number(btn.dataset.r);
      const k = key(q, r);
      const piece = hive.get(k) || null;
      btn.textContent = glyph(piece);
      btn.disabled = !!piece || gameOver;
      btn.title = `${q},${r} — ${describePiece(piece)}`;
      const isFrom = selectedFrom && selectedFrom.q === q && selectedFrom.r === r;
      const isTarget = selectedMoves.some(m => m.q === q && m.r === r);
      btn.classList.toggle('hive-cell-selected', !!isFrom);
      btn.classList.toggle('hive-cell-move-target', !!isTarget);
      btn.classList.toggle('hive-cell-occupied', !!piece);
    });
  }

  function canPlaceHere(player, type, q, r) {
    if (!inBounds(q, r)) return false;
    const k = key(q, r);
    if (hive.has(k)) return false;
    if (pools[player][type] <= 0) return false;
    if (placements[player] >= 3 && !hasPlacedQueen(player) && type !== 'Q') return false;
    if (!hasAnyPieces()) return true;
    if (!isAdjacentToAny(q, r)) return false;
    return true;
  }

  function checkWin() {
    let whiteSurrounded = false;
    let blackSurrounded = false;
    hive.forEach((piece, k) => {
      if (piece.type !== 'Q') return;
      const { q, r } = parseKey(k);
      const neigh = neighborsOf(q, r);
      const allFilled = neigh.every(({ q: nq, r: nr }) => hive.has(key(nq, nr)));
      if (allFilled) { if (piece.player === 'White') whiteSurrounded = true; if (piece.player === 'Black') blackSurrounded = true; }
    });
    if (!whiteSurrounded && !blackSurrounded) { winner = null; gameOver = false; return; }
    gameOver = true;
    if (whiteSurrounded && blackSurrounded) winner = 'Draw';
    else if (whiteSurrounded) winner = 'Black';
    else if (blackSurrounded) winner = 'White';
    if (winner && winner !== 'Draw') sound.playWin();
    else sound.playGameOver?.();
  }

  function placePieceFromPool(player, type, q, r) {
    const k = key(q, r);
    hive.set(k, { player, type });
    pools[player][type] -= 1;
    placements[player] += 1;
    sound.playMove();
    checkWin();
    refreshBoardCells();
    updatePoolsUi();
    if (!gameOver) currentPlayerIndex = 1 - currentPlayerIndex;
    updateSelectedPieceHighlight();
    updateStatus();
  }

  function movePiece(player, fromQ, fromR, toQ, toR) {
    const fromKey = key(fromQ, fromR);
    const toKey = key(toQ, toR);
    const piece = hive.get(fromKey);
    if (!piece || piece.player !== player) return false;
    if (hive.has(toKey)) return false;
    hive.delete(fromKey);
    hive.set(toKey, piece);
    sound.playMove();
    checkWin();
    refreshBoardCells();
    if (!gameOver) currentPlayerIndex = 1 - currentPlayerIndex;
    updateSelectedPieceHighlight();
    updateStatus();
    return true;
  }

  function onPoolClick(e) {
    if (gameOver) return;
    const el = e.currentTarget;
    const player = el.dataset.player;
    const type = el.dataset.type;
    if (!player || !type) return;
    if (player !== currentPlayer()) { sound.playClick(); return; }
    if (pools[player][type] <= 0) { sound.playClick(); return; }
    selectedPieceType = type;
    sound.playClick();
    updateSelectedPieceHighlight();
  }

  function onCellDragOver(e) {
    if (!dragPayload || gameOver) return;
    const btn = e.currentTarget;
    const q = Number(btn.dataset.q);
    const r = Number(btn.dataset.r);
    if (canPlaceHere(dragPayload.player, dragPayload.type, q, r)) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }
  }

  function onCellDrop(e) {
    if (!dragPayload || gameOver) return;
    e.preventDefault();
    const btn = e.currentTarget;
    const q = Number(btn.dataset.q);
    const r = Number(btn.dataset.r);
    const { player, type } = dragPayload;
    if (player !== currentPlayer() || !canPlaceHere(player, type, q, r)) {
      sound.playClick();
      return;
    }
    placePieceFromPool(player, type, q, r); // ✅ fixed
  }

  function onPoolDragStart(e) {
    if (gameOver) { e.preventDefault(); return; }
    const el = e.currentTarget;
    const player = el.dataset.player;
    const type = el.dataset.type;
    if (!player || !type || player !== currentPlayer() || pools[player][type] <= 0) { e.preventDefault(); return; }
    dragPayload = { player, type };
    if (e.dataTransfer) { e.dataTransfer.setData('text/plain', `${player}:${type}`); e.dataTransfer.effectAllowed = 'copy'; }
  }

  function onPoolDragEnd() { dragPayload = null; }

  function clearSelection() {
    selectedFrom = null;
    selectedMoves = [];
    refreshBoardCells();
  }

  function onCellClick(e) {
    if (gameOver) return;
    const btn = e.currentTarget;
    const q = Number(btn.dataset.q);
    const r = Number(btn.dataset.r);
    const k = key(q, r);
    const piece = hive.get(k) || null;
    const player = currentPlayer();

    if (piece && piece.player === player) {
      const already = selectedFrom && selectedFrom.q === q && selectedFrom.r === r;
      if (already) { clearSelection(); return; }
      const moves = getLegalMovesFrom(q, r);
      selectedFrom = { q, r };
      selectedMoves = moves;
      sound.playClick();
      refreshBoardCells();
      return;
    }

    if (!piece && selectedFrom) {
      const target = selectedMoves.find(m => m.q === q && m.r === r);
      if (target) {
        const { q: fromQ, r: fromR } = selectedFrom;
        const ok = movePiece(player, fromQ, fromR, q, r);
        clearSelection();
        if (!ok) sound.playClick();
        return;
      }
    }

    if (!piece) {
      const type = selectedPieceType;
      if (!canPlaceHere(player, type, q, r)) { sound.playClick(); return; }
      placePieceFromPool(player, type, q, r);
      clearSelection();
      return;
    }

    sound.playClick();
  }

  function resetGame() {
    hive.clear();
    pools = { White: { ...basePool }, Black: { ...basePool } };
    placements = { White: 0, Black: 0 };
    currentPlayerIndex = 0;
    gameOver = false;
    winner = null;
    dragPayload = null;
    selectedPieceType = 'Q';
    selectedFrom = null;
    selectedMoves = [];
    refreshBoardCells();
    updatePoolsUi();
    updateSelectedPieceHighlight();
    updateStatus();
  }

  const onResetClick = () => { sound.playClick(); resetGame(); };
  resetBtn.addEventListener('click', onResetClick);

  buildPoolsUi();
  buildBoard();
  updateSelectedPieceHighlight();
  updateStatus();

  return () => {
    resetBtn.removeEventListener('click', onResetClick);
    cells.forEach((btn) => btn.removeEventListener('click', onCellClick));
    wrap.remove();
  };
}

function button(text) { const b = document.createElement('button'); b.textContent = text; return b; }

function createRules(lines) {
  const d = document.createElement('details');
  d.className = 'rules';
  const s = document.createElement('summary');
  s.textContent = 'Rules';
  const ul = document.createElement('ul');
  lines.forEach(l => { const li = document.createElement('li'); li.textContent = l; ul.appendChild(li); });
  d.append(s, ul);
  return d;
}

// --- Simple placeholder for movement logic ---
function getLegalMovesFrom(q, r) {
  const moves = [];
  NEIGHBORS.forEach(([dq, dr]) => {
    const nq = q + dq;
    const nr = r + dr;
    moves.push({ q: nq, r: nr });
  });
  return moves;
}
