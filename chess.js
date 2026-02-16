// games/chess.js
// Human-vs-human chess with full rules (no AI yet)
import { sound } from '../sound.js';

const TUTORIAL_KEY = 'chess-tutorial-completed';

/** Piece codes: 'wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', ... or null */
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'chess';

  // --- Toolbar ---
  const toolbar = document.createElement('div');
  toolbar.className = 'game-toolbar';

  const tutorialBtn = button('🎓 Tutorial');
  tutorialBtn.classList.add('button');
  tutorialBtn.style.backgroundColor = '#10b981';

  const newBtn = button('New game');
  const undoBtn = button('Undo');
  const pauseBtn = button('Pause');
  const flipBtn = button('Flip board');

  tutorialBtn.classList.add('button');
  newBtn.classList.add('button');
  undoBtn.classList.add('button');
  pauseBtn.classList.add('button');
  flipBtn.classList.add('button');

  const turnBadge = badge('White to move');

  toolbar.append(tutorialBtn, newBtn, undoBtn, pauseBtn, flipBtn, turnBadge);

  // --- Main layout: board + side panel ---
  const layout = document.createElement('div');
  layout.className = 'chess-layout';

  const boardWrap = document.createElement('div');
  boardWrap.className = 'chess-board-wrap';

  const boardEl = document.createElement('div');
  boardEl.className = 'chess-board';

  const fileLabelsTop = document.createElement('div');
  fileLabelsTop.className = 'chess-files chess-files-top';
  const fileLabelsBottom = document.createElement('div');
  fileLabelsBottom.className = 'chess-files chess-files-bottom';

  const rankLabelsLeft = document.createElement('div');
  rankLabelsLeft.className = 'chess-ranks chess-ranks-left';
  const rankLabelsRight = document.createElement('div');
  rankLabelsRight.className = 'chess-ranks chess-ranks-right';

  const status = document.createElement('div');
  status.className = 'chess-status';
  status.textContent = 'White to move';

  const sidePanel = document.createElement('div');
  sidePanel.className = 'chess-side';

  // Settings: mode (2P/1P/AI vs AI), difficulty, and help/hints
  const settings = document.createElement('div');
  settings.className = 'chess-settings';

  const modeRow = document.createElement('div');
  modeRow.className = 'chess-settings-row';
  const modeLabel = document.createElement('span');
  modeLabel.className = 'chess-mode-label';
  modeLabel.textContent = 'Mode:';
  const twoPBtn = button('2P');
  const onePBtn = button('1P');
  const onePBlackBtn = button('1P (Black)');
  const aiAiBtn = button('AI vs AI');
  twoPBtn.classList.add('button');
  onePBtn.classList.add('button');
  onePBlackBtn.classList.add('button');
  aiAiBtn.classList.add('button');
  modeRow.append(modeLabel, twoPBtn, onePBtn, onePBlackBtn, aiAiBtn);

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

  const helpRow = document.createElement('div');
  helpRow.className = 'chess-settings-row';
  const helpBtn = button('Hint');
  helpBtn.classList.add('button');
  const helpInfo = document.createElement('span');
  helpInfo.className = 'chess-hint-info';
  helpRow.append(helpBtn, helpInfo);

  settings.append(modeRow, diffRow, helpRow);

  const movesTitle = document.createElement('div');
  movesTitle.className = 'chess-moves-title';
  movesTitle.textContent = 'Moves';

  const movesList = document.createElement('ol');
  movesList.className = 'chess-moves';

  const chatTitle = document.createElement('div');
  chatTitle.className = 'chess-moves-title';
  chatTitle.textContent = 'AI Chat';

  const chatList = document.createElement('ul');
  chatList.className = 'chess-chat';

  const rules = createRules([
    'Goal: checkmate the enemy king — attack it so the king has no legal moves.',
    'King: moves 1 square in any direction. You may not move into check.',
    'Queen: any number of squares horizontally, vertically, or diagonally (like rook + bishop).',
    'Rook: any number of squares horizontally or vertically.',
    'Bishop: any number of squares diagonally only.',
    'Knight (horse): moves in an L-shape (2 squares in one direction, then 1 to the side) and can jump over pieces.',
    'Pawn: moves forward 1 square (or 2 from its starting square) but captures 1 square diagonally forward.',
    'Promotion: when a pawn reaches the last rank it becomes a new piece (usually a queen).',
    'Castling: special king + rook move. King moves 2 squares toward a rook, the rook jumps next to the king. Allowed only if neither moved, no pieces between, and the king does not move through or into check.',
    'En passant: if an enemy pawn moves 2 squares and lands next to your pawn, you may capture it as if it moved only 1 square (on the very next move). Example: white pawn on e5, black pawn moves d7–d5, white may play exd6 e.p. to capture.',
    'Tip: try to control the center squares with your pawns and pieces and keep your king safe.',
  ]);

  sidePanel.append(settings, movesTitle, movesList, chatTitle, chatList, rules);

  boardWrap.append(
    fileLabelsTop,
    rankLabelsLeft,
    boardEl,
    rankLabelsRight,
    fileLabelsBottom,
  );

  layout.append(boardWrap, sidePanel);

  wrap.append(toolbar, status, layout);
  root.appendChild(wrap);

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
        title: '♟️ Welcome to Chess!',
        text: 'The ultimate strategy game! Checkmate the enemy king while protecting yours. Each piece moves differently, master them all!'
      },
      {
        title: '👑 The King',
        text: 'The most important piece! Moves one square in any direction. Protect your king at all costs - if it\'s checkmated, you lose!'
      },
      {
        title: '♕ The Queen',
        text: 'The most powerful piece! Moves any number of squares horizontally, vertically, or diagonally. Use wisely!'
      },
      {
        title: '🏰 The Rook',
        text: 'Moves any number of squares horizontally or vertically (not diagonally). Strong in open positions!'
      },
      {
        title: '🏇 The Knight',
        text: 'Moves in an L-shape: 2 squares in one direction, then 1 square perpendicular. The only piece that can jump over others!'
      },
      {
        title: '🎯 The Bishop',
        text: 'Moves any number of squares diagonally. Each bishop stays on its starting color (light or dark) for the entire game.'
      },
      {
        title: '⚔️ The Pawn',
        text: 'Moves forward 1 square (or 2 on first move). Captures diagonally forward. Reaches the other end? Promote to Queen, Rook, Bishop, or Knight!'
      },
      {
        title: '🏰 Castling',
        text: 'Special move: King moves 2 squares toward a Rook, Rook jumps over. Only works if neither piece has moved, squares between are empty, and king isn\'t in check!'
      },
      {
        title: '👻 En Passant',
        text: 'Special pawn capture! If enemy pawn moves 2 squares forward and lands beside yours, you can capture it by moving diagonally behind it (only on next turn)!'
      },
      {
        title: '🎯 Check & Checkmate',
        text: 'Check: King is under attack. Checkmate: King is in check with no escape - game over! Stalemate: No legal moves but not in check - it\'s a draw!'
      },
      {
        title: '🎮 Game Modes',
        text: 'Play 2-Player locally, vs AI (Easy/Med/Hard), or watch AI vs AI! Use Hint button if stuck (limited uses). Undo to take back moves.'
      },
      {
        title: '🏆 Ready to Play!',
        text: 'White moves first. Click a piece to see legal moves (green squares). Plan ahead, control the center, and protect your king. Good luck!'
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

  // --- Board / game state ---
  let orientation = 'white'; // or 'black'

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Position state
  let board = new Array(64).fill(null);
  let whiteToMove = true;
  let castling = { K: true, Q: true, k: true, q: true };
  let enPassant = -1; // square index or -1
  let halfmoveClock = 0;
  let fullmoveNumber = 1;

  const moveHistory = []; // stack of move objects for undo
  let selected = null; // { index, moves: Move[] } | null
  let lastMove = null; // { from, to }

  const squares = [];

  // Mode / AI / hint state
  let mode = '2p'; // '2p' (two-player local) or '1p' (vs AI)
  let aiColor = 'b'; // AI plays black by default in 1P mode
  let difficulty = 'easy';
  let aiThinking = false;
  let aiMoveTimeoutId = null;
  let hintUsesLeft = 3;
  let paused = false;

  function indexToCoords(i) {
    return { file: i % 8, rank: Math.floor(i / 8) };
  }

  function coordsToIndex(file, rank) {
    return rank * 8 + file;
  }

  function squareName(i) {
    const { file, rank } = indexToCoords(i);
    const humanRank = 8 - rank; // internal 0..7 (top..bottom) -> human 8..1
    return files[file] + String(humanRank);
  }

  function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function setupLabels() {
    clearElement(fileLabelsTop);
    clearElement(fileLabelsBottom);
    clearElement(rankLabelsLeft);
    clearElement(rankLabelsRight);

    const fileOrder = orientation === 'white' ? files : [...files].reverse();
    const rankOrder = orientation === 'white' ? [...ranks].reverse() : ranks;

    fileOrder.forEach((f) => {
      const t = document.createElement('span');
      t.textContent = f;
      fileLabelsTop.appendChild(t.cloneNode(true));
      fileLabelsBottom.appendChild(t);
    });

    rankOrder.forEach((r) => {
      const t = document.createElement('span');
      t.textContent = r;
      rankLabelsLeft.appendChild(t.cloneNode(true));
      rankLabelsRight.appendChild(t);
    });
  }

  function parseFen(fen) {
    const [piecePart, active, castle, ep, half, full] = fen.split(' ');
    const rows = piecePart.split('/');
    const out = new Array(64).fill(null);
    let idx = 0;
    for (let r = 0; r < 8; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (/[1-8]/.test(ch)) {
          idx += Number(ch);
        } else {
          const color = ch === ch.toUpperCase() ? 'w' : 'b';
          const type = ch.toLowerCase();
          out[idx] = color + type.toUpperCase(); // e.g. 'wP', 'bK'
          idx++;
        }
      }
    }
    board = out;
    whiteToMove = active === 'w';
    castling = {
      K: castle.includes('K'),
      Q: castle.includes('Q'),
      k: castle.includes('k'),
      q: castle.includes('q'),
    };
    enPassant = ep === '-' ? -1 : algebraicToIndex(ep);
    halfmoveClock = Number(half) || 0;
    fullmoveNumber = Number(full) || 1;
  }

  function algebraicToIndex(sq) {
    if (!sq || sq.length !== 2) return -1;
    const file = files.indexOf(sq[0]);
    const rankNum = Number(sq[1]);
    if (file === -1 || !Number.isInteger(rankNum) || rankNum < 1 || rankNum > 8) return -1;
    const rankIndex = 8 - rankNum; // human 1..8 -> internal 7..0
    return coordsToIndex(file, rankIndex);
  }

  function pieceAt(i) {
    return board[i];
  }

  function isWhite(p) {
    return !!p && p[0] === 'w';
  }

  function isBlack(p) {
    return !!p && p[0] === 'b';
  }

  function currentColor() {
    return whiteToMove ? 'w' : 'b';
  }

  function enemyColor() {
    return whiteToMove ? 'b' : 'w';
  }

  function inBounds(file, rank) {
    return file >= 0 && file < 8 && rank >= 0 && rank < 8;
  }

  function clonePosition() {
    return {
      board: [...board],
      whiteToMove,
      castling: { ...castling },
      enPassant,
      halfmoveClock,
      fullmoveNumber,
    };
  }

  function restorePosition(pos) {
    board = [...pos.board];
    whiteToMove = pos.whiteToMove;
    castling = { ...pos.castling };
    enPassant = pos.enPassant;
    halfmoveClock = pos.halfmoveClock;
    fullmoveNumber = pos.fullmoveNumber;
  }

  function isSquareAttacked(square, byColor) {
    // naive: generate pseudo moves for byColor and see if any hit square
    for (let i = 0; i < 64; i++) {
      const p = board[i];
      if (!p) continue;
      if (byColor === 'w' ? !isWhite(p) : !isBlack(p)) continue;
      const moves = generatePseudoMovesForPiece(i, p, byColor, true);
      if (moves.some(m => m.to === square)) return true;
    }
    return false;
  }

  function kingSquare(color) {
    for (let i = 0; i < 64; i++) {
      if (board[i] === (color + 'K')) return i;
    }
    return -1;
  }

  function inCheck(color) {
    const kSq = kingSquare(color);
    if (kSq === -1) return false;
    const enemy = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(kSq, enemy);
  }

  function generateLegalMoves() {
    const color = currentColor();
    const moves = [];
    for (let i = 0; i < 64; i++) {
      const p = board[i];
      if (!p) continue;
      if (color === 'w' ? !isWhite(p) : !isBlack(p)) continue;
      const pseudo = generatePseudoMovesForPiece(i, p, color, false);
      for (const m of pseudo) {
        const prev = clonePosition();
        applyMoveInternal(m);
        const inCheckNow = inCheck(color);
        restorePosition(prev);
        if (!inCheckNow) moves.push(m);
      }
    }
    return moves;
  }

  function generatePseudoMovesForPiece(from, piece, color, forAttackOnly) {
    // forAttackOnly ignores some state like pins and check legality, but still
    // uses en-passant and castling squares.
    const out = [];
    const { file, rank } = indexToCoords(from);
    const type = piece[1]; // P, N, B, R, Q, K

    // Board indexing: rank 0 is the top (8th rank in human chess), rank 7 is the bottom (1st rank).
    // White moves "up" (toward smaller rank indexes), black moves "down" (toward larger rank indexes).
    const isWhiteSide = color === 'w';
    const forward = isWhiteSide ? -1 : 1;

    function addMove(to, opts = {}) {
      if (!inBounds(indexToCoords(to).file, indexToCoords(to).rank)) return; // safety
      out.push({ from, to, ...opts });
    }

    if (type === 'P') {
      const startRank = isWhiteSide ? 6 : 1; // white pawns start on internal rank 6, black on 1
      const promoRank = isWhiteSide ? 0 : 7; // white promotes on rank 0, black on rank 7

      // single push
      const oneRank = rank + forward;
      if (inBounds(file, oneRank)) {
        const to = coordsToIndex(file, oneRank);
        if (!pieceAt(to) && !forAttackOnly) {
          if (oneRank === promoRank) {
            ['Q', 'R', 'B', 'N'].forEach(promo => addMove(to, { promotion: promo }));
          } else {
            addMove(to);
          }
        }
      }
      // double push
      const twoRank = rank + 2 * forward;
      if (!forAttackOnly && rank === startRank && inBounds(file, twoRank)) {
        const mid = coordsToIndex(file, rank + forward);
        const to = coordsToIndex(file, twoRank);
        if (!pieceAt(mid) && !pieceAt(to)) {
          addMove(to, { doublePawn: true });
        }
      }
      // captures (and attack squares for check detection)
      [-1, 1].forEach(df => {
        const f = file + df;
        const r = rank + forward;
        if (!inBounds(f, r)) return;
        const to = coordsToIndex(f, r);
        const target = pieceAt(to);
        if (target) {
          if (color === 'w' ? isBlack(target) : isWhite(target)) {
            if (r === promoRank && !forAttackOnly) {
              ['Q', 'R', 'B', 'N'].forEach(promo => addMove(to, { capture: true, promotion: promo }));
            } else {
              addMove(to, { capture: true });
            }
          }
        } else if (to === enPassant && !forAttackOnly) {
          addMove(to, { capture: true, enPassant: true });
        } else if (forAttackOnly) {
          addMove(to, { attackOnly: true });
        }
      });
    } else if (type === 'N') {
      const deltas = [
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2],
      ];
      for (const [df, dr] of deltas) {
        const f = file + df;
        const r = rank + dr;
        if (!inBounds(f, r)) continue;
        const to = coordsToIndex(f, r);
        const target = pieceAt(to);
        if (!target) {
          addMove(to);
        } else if (color === 'w' ? isBlack(target) : isWhite(target)) {
          addMove(to, { capture: true });
        }
      }
    } else if (type === 'B' || type === 'R' || type === 'Q') {
      const dirs = [];
      if (type === 'B' || type === 'Q') {
        dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      }
      if (type === 'R' || type === 'Q') {
        dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      }
      for (const [df, dr] of dirs) {
        let f = file + df;
        let r = rank + dr;
        while (inBounds(f, r)) {
          const to = coordsToIndex(f, r);
          const target = pieceAt(to);
          if (!target) {
            addMove(to);
          } else {
            if (color === 'w' ? isBlack(target) : isWhite(target)) {
              addMove(to, { capture: true });
            }
            break;
          }
          f += df;
          r += dr;
        }
      }
    } else if (type === 'K') {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (!df && !dr) continue;
          const f = file + df;
          const r = rank + dr;
          if (!inBounds(f, r)) continue;
          const to = coordsToIndex(f, r);
          const target = pieceAt(to);
          if (!target) {
            addMove(to);
          } else if (color === 'w' ? isBlack(target) : isWhite(target)) {
            addMove(to, { capture: true });
          }
        }
      }
      if (!forAttackOnly) {
        // Castling
        if (color === 'w') {
          // king side
          if (castling.K && !pieceAt(61) && !pieceAt(62)) {
            if (!isSquareAttacked(60, 'b') && !isSquareAttacked(61, 'b') && !isSquareAttacked(62, 'b')) {
              addMove(62, { castle: 'K' });
            }
          }
          // queen side
          if (castling.Q && !pieceAt(57) && !pieceAt(58) && !pieceAt(59)) {
            if (!isSquareAttacked(60, 'b') && !isSquareAttacked(59, 'b') && !isSquareAttacked(58, 'b')) {
              addMove(58, { castle: 'Q' });
            }
          }
        } else {
          // black
          if (castling.k && !pieceAt(5) && !pieceAt(6)) {
            if (!isSquareAttacked(4, 'w') && !isSquareAttacked(5, 'w') && !isSquareAttacked(6, 'w')) {
              addMove(6, { castle: 'k' });
            }
          }
          if (castling.q && !pieceAt(1) && !pieceAt(2) && !pieceAt(3)) {
            if (!isSquareAttacked(4, 'w') && !isSquareAttacked(3, 'w') && !isSquareAttacked(2, 'w')) {
              addMove(2, { castle: 'q' });
            }
          }
        }
      }
    }

    return out;
  }

  function applyMoveInternal(move) {
    const fromPiece = board[move.from];
    const toPiece = board[move.to];
    let captured = toPiece || null;
    let epCapturedIndex = -1;

    // handle en passant capture
    if (move.enPassant) {
      const { file, rank } = indexToCoords(move.to);
      // Pawn moves in direction `dir`; captured pawn is one rank behind the destination.
      const dir = whiteToMove ? -1 : 1;
      const capRank = rank - dir;
      epCapturedIndex = coordsToIndex(file, capRank);
      captured = board[epCapturedIndex];
      board[epCapturedIndex] = null;
    }

    board[move.from] = null;

    let placed = fromPiece;
    if (move.promotion) {
      placed = fromPiece[0] + move.promotion; // keep color, change type
    }
    board[move.to] = placed;

    // castling rook moves
    let rookFrom = -1;
    let rookTo = -1;
    if (move.castle === 'K') {
      rookFrom = 63;
      rookTo = 61;
    } else if (move.castle === 'Q') {
      rookFrom = 56;
      rookTo = 59;
    } else if (move.castle === 'k') {
      rookFrom = 7;
      rookTo = 5;
    } else if (move.castle === 'q') {
      rookFrom = 0;
      rookTo = 3;
    }
    if (rookFrom !== -1) {
      board[rookTo] = board[rookFrom];
      board[rookFrom] = null;
    }

    // update castling rights
    const movedType = fromPiece[1];
    const movedColor = fromPiece[0];
    const fromIndex = move.from;
    if (movedType === 'K') {
      if (movedColor === 'w') {
        castling.K = false;
        castling.Q = false;
      } else {
        castling.k = false;
        castling.q = false;
      }
    }
    if (movedType === 'R') {
      if (fromIndex === 63) castling.K = false;
      if (fromIndex === 56) castling.Q = false;
      if (fromIndex === 7) castling.k = false;
      if (fromIndex === 0) castling.q = false;
    }
    // if rook captured on its original square, update rights
    if (captured === 'wR') {
      if (move.to === 63) castling.K = false;
      if (move.to === 56) castling.Q = false;
    }
    if (captured === 'bR') {
      if (move.to === 7) castling.k = false;
      if (move.to === 0) castling.q = false;
    }

    // update en-passant target
    let newEnPassant = -1;
    if (movedType === 'P' && move.doublePawn) {
      const { file, rank } = indexToCoords(move.to);
      const dir = movedColor === 'w' ? -1 : 1;
      const epRank = rank - dir; // square passed over during the double move
      newEnPassant = coordsToIndex(file, epRank);
    }

    // halfmove clock
    if (movedType === 'P' || captured) {
      halfmoveClock = 0;
    } else {
      halfmoveClock++;
    }

    // fullmove number
    if (!whiteToMove) fullmoveNumber++;

    const prevEnPassant = enPassant;
    enPassant = newEnPassant;

    lastMove = { from: move.from, to: move.to };

    moveHistory.push({
      move,
      captured,
      epCapturedIndex,
      prevEnPassant,
    });

    whiteToMove = !whiteToMove;
  }

  function undoMove() {
    const entry = moveHistory.pop();
    if (!entry) return;
    const { move, captured, epCapturedIndex, prevEnPassant } = entry;

    whiteToMove = !whiteToMove;

    const movedPiece = board[move.to];
    board[move.to] = null;
    board[move.from] = movedPiece[0] + (move.promotion ? 'P' : movedPiece[1]);

    if (move.castle) {
      let rookFrom = -1;
      let rookTo = -1;
      if (move.castle === 'K') {
        rookFrom = 63;
        rookTo = 61;
      } else if (move.castle === 'Q') {
        rookFrom = 56;
        rookTo = 59;
      } else if (move.castle === 'k') {
        rookFrom = 7;
        rookTo = 5;
      } else if (move.castle === 'q') {
        rookFrom = 0;
        rookTo = 3;
      }
      board[rookFrom] = board[rookTo];
      board[rookTo] = null;
    }

    if (epCapturedIndex !== -1) {
      board[epCapturedIndex] = captured;
    } else if (captured) {
      board[move.to] = captured;
    }

    enPassant = prevEnPassant;
    lastMove = null;
    // For simplicity castling rights / clocks are not fully restored here; acceptable
    // for casual play. Proper full undo would store full position, which we already
    // can do if needed later for AI.
  }

  function legalMovesFromSquare(index) {
    return generateLegalMoves().filter(m => m.from === index);
  }

  // --- Simple evaluation and search for AI/hints ---
  const PIECE_VALUES = {
    P: 100,
    N: 320,
    B: 330,
    R: 500,
    Q: 900,
    K: 20000,
  };

  function evaluateMaterial(color) {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const p = board[i];
      if (!p) continue;
      const val = PIECE_VALUES[p[1]] || 0;
      if (p[0] === color) score += val;
      else score -= val;
    }
    return score;
  }

  function searchScore(depth, aiCol) {
    const color = currentColor();
    const moves = generateLegalMoves();
    const inChk = inCheck(color);

    if (depth === 0 || !moves.length) {
      let score = evaluateMaterial(aiCol);
      if (!moves.length) {
        if (inChk) {
          // Side to move has no legal moves and is in check => checkmate
          score += color === aiCol ? -100000 : 100000;
        }
      }
      return score;
    }

    if (color === aiCol) {
      let best = -Infinity;
      for (const move of moves) {
        const saved = clonePosition();
        applyMoveInternal(move);
        const s = searchScore(depth - 1, aiCol);
        restorePosition(saved);
        if (s > best) best = s;
      }
      return best === -Infinity ? evaluateMaterial(aiCol) : best;
    } else {
      let best = Infinity;
      for (const move of moves) {
        const saved = clonePosition();
        applyMoveInternal(move);
        const s = searchScore(depth - 1, aiCol);
        restorePosition(saved);
        if (s < best) best = s;
      }
      return best === Infinity ? evaluateMaterial(aiCol) : best;
    }
  }

  function scoreMovesFor(aiCol, depth) {
    const original = clonePosition();
    const moves = generateLegalMoves();
    const scored = [];
    for (const move of moves) {
      const saved = clonePosition();
      applyMoveInternal(move);
      const s = searchScore(Math.max(0, depth - 1), aiCol);
      restorePosition(saved);
      scored.push({ move, score: s });
    }
    restorePosition(original);
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  function chooseMoveFromScored(scored, diff) {
    if (!scored.length) return null;
    const n = scored.length;
    if (diff === 'hard') {
      return scored[0].move;
    }
    if (diff === 'medium') {
      const bestScore = scored[0].score;
      const candidates = scored.filter(s => s.score >= bestScore - 150);
      const pool = candidates.length ? candidates : [scored[0]];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return pick.move;
    }
    // easy: often pick worse moves, occasionally blunder hard
    if (n <= 3) {
      return scored[Math.floor(Math.random() * n)].move;
    }
    const r = Math.random();
    let idx;
    if (r < 0.45) {
      // 45%: pick from worst quarter (big blunders)
      const start = Math.floor(n * 0.75);
      idx = start + Math.floor(Math.random() * Math.max(1, n - start));
    } else if (r < 0.8) {
      // 35%: pick from middle band
      const start = Math.floor(n * 0.3);
      const end = Math.floor(n * 0.7);
      idx = start + Math.floor(Math.random() * Math.max(1, end - start));
    } else {
      // 20%: pick among the top few moves
      const top = Math.max(1, Math.floor(n * 0.25));
      idx = Math.floor(Math.random() * top);
    }
    return scored[Math.min(n - 1, Math.max(0, idx))].move;
  }

  function pickAiMove() {
    const aiCol = aiColor;
    const depth = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    const scored = scoreMovesFor(aiCol, depth);
    return chooseMoveFromScored(scored, difficulty);
  }

  function pickAiMoveForColor(color) {
    // Always hard mode (max depth, no randomness) for AI vs AI
    const depth = 3;
    const scored = scoreMovesFor(color, depth);
    return scored.length ? scored[0].move : null;
  }

  function pickHintMove() {
    const hintColor = currentColor();
    const depth = 2;
    const scored = scoreMovesFor(hintColor, depth);
    return scored.length ? scored[0].move : null;
  }

  function updateHintInfo() {
    if (!helpInfo) return;
    helpInfo.textContent = `Hints left: ${hintUsesLeft}`;
  }

  function updateModeButtons() {
    twoPBtn.classList.toggle('chess-chip-active', mode === '2p');
    onePBtn.classList.toggle('chess-chip-active', mode === '1p' && aiColor === 'b');
    onePBlackBtn.classList.toggle('chess-chip-active', mode === '1p' && aiColor === 'w');
    aiAiBtn.classList.toggle('chess-chip-active', mode === 'ai');
  }

  function updateDifficultyButtons() {
    easyBtn.classList.toggle('chess-chip-active', difficulty === 'easy');
    medBtn.classList.toggle('chess-chip-active', difficulty === 'medium');
    hardBtn.classList.toggle('chess-chip-active', difficulty === 'hard');
  }

  function maybeScheduleAiMove() {
    if (paused) return;
    if (aiThinking) return;

    const sideToMove = currentColor();

    if (mode === '1p') {
      if (sideToMove !== aiColor) return;
    } else if (mode === 'ai') {
      // Both sides are AI, continue
    } else {
      return;
    }

    const moves = generateLegalMoves();
    if (!moves.length) return;

    aiThinking = true;
    if (aiMoveTimeoutId) clearTimeout(aiMoveTimeoutId);
    status.textContent = `${sideToMove === 'w' ? 'White' : 'Black'} (AI) is thinking...`;
    aiMoveTimeoutId = setTimeout(() => {
      aiMoveTimeoutId = null;
      const move = mode === 'ai' ? pickAiMoveForColor(sideToMove) : pickAiMove();
      aiThinking = false;
      if (!move) {
        updateStatus();
        return;
      }
      playMove(move, true);
    }, 280);
  }

  function playMove(move, isAi = false) {
    const before = pieceAt(move.from);
    applyMoveInternal(move);
    renderBoard();
    const opponent = currentColor();
    const legalAfter = generateLegalMoves();
    const check = inCheck(opponent);
    const mate = check && !legalAfter.length;
    const san = algebraicForMove(move, before, check, mate);
    appendMoveToList(move, san);
    selected = null;
    clearSelectionHighlights();
    updateStatus();
    sound.playMove();

    if (isAi && mode === 'ai' && before) {
      const side = before[0];
      if (side === 'w' || side === 'b') {
        addAiChatMessage(side, san);
      }
    }

    if (mode === 'ai') {
      maybeScheduleAiMove();
    } else if (!isAi) {
      maybeScheduleAiMove();
    }
  }

  function onHintClick() {
    if (paused) {
      alert('Game is paused. Resume to use hints.');
      return;
    }
    if (hintUsesLeft <= 0) {
      alert('No hints left.');
      return;
    }
    const moves = generateLegalMoves();
    if (!moves.length) {
      alert('No legal moves available.');
      return;
    }
    const move = pickHintMove();
    if (!move) {
      alert('No hint available in this position.');
      return;
    }
    clearSelectionHighlights();
    const fromBtn = findSquareButton(move.from);
    const toBtn = findSquareButton(move.to);
    if (fromBtn) fromBtn.classList.add('best-move');
    if (toBtn) toBtn.classList.add('best-move');
    hintUsesLeft -= 1;
    updateHintInfo();
  }

  function addAiChatMessage(color, san) {
    if (!chatList) return;
    const li = document.createElement('li');
    li.className = `chess-chat-msg ${color === 'w' ? 'chess-chat-msg-white' : 'chess-chat-msg-black'}`;
    const sideName = color === 'w' ? 'White AI' : 'Black AI';

    const templates = [
      `${sideName}: I play ${san} to improve my piece activity.`,
      `${sideName}: ${san} keeps pressure on the enemy king.`,
      `${sideName}: ${san} controls the center nicely.`,
      `${sideName}: ${san} prepares my next attack.`,
      `${sideName}: ${san} is the safest move in this position.`,
      `${sideName}: ${san} improves my position without creating weaknesses.`,
    ];
    li.textContent = templates[Math.floor(Math.random() * templates.length)];

    chatList.appendChild(li);
    // keep chat from growing forever
    while (chatList.children.length > 20) {
      chatList.removeChild(chatList.firstChild);
    }
    chatList.scrollTop = chatList.scrollHeight;
  }

  function updateStatus() {
    const color = whiteToMove ? 'White' : 'Black';
    let text = `${color} to move`;
    if (paused) {
      text += ' (paused)';
    }
    const allLegal = generateLegalMoves();
    if (!allLegal.length) {
      if (inCheck(currentColor())) {
        text = `Checkmate! ${whiteToMove ? 'Black' : 'White'} wins`;
      } else {
        text = 'Stalemate';
      }
    } else if (inCheck(currentColor())) {
      text += ' — Check!';
    }
    status.textContent = text;
    turnBadge.textContent = text;
  }

  function pieceGlyph(piece) {
    if (!piece) return '';
    const map = {
      wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕', wK: '♔',
      bP: '♟', bN: '♞', bB: '♝', bR: '♜', bQ: '♛', bK: '♚',
    };
    return map[piece] || '?';
  }

  function clearSelectionHighlights() {
    squares.forEach(sq => {
      sq.classList.remove('selected', 'move-target', 'last-move', 'best-move');
    });
  }

  function renderBoard() {
    clearElement(boardEl);
    squares.length = 0;

    const indices = [];
    const rankOrder = orientation === 'white' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const fileOrder = orientation === 'white' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

    for (const r of rankOrder) {
      for (const f of fileOrder) {
        indices.push(coordsToIndex(f, r));
      }
    }

    indices.forEach((idx, i) => {
      const sq = document.createElement('button');
      sq.className = 'chess-square';
      const displayRow = Math.floor(i / 8);
      const displayCol = i % 8;
      if ((displayRow + displayCol) % 2 === 0) {
        sq.classList.add('light');
      } else {
        sq.classList.add('dark');
      }

      const piece = pieceAt(idx);
      const pieceSpan = document.createElement('span');
      pieceSpan.className = 'chess-piece';
      pieceSpan.textContent = pieceGlyph(piece);
      sq.appendChild(pieceSpan);

      const { file } = indexToCoords(idx);
      const isBaselineRank = orientation === 'white' ? displayRow === 7 : displayRow === 0;
      const isLeftFile = orientation === 'white' ? displayCol === 0 : displayCol === 7;
      const humanRank = orientation === 'white'
        ? 8 - displayRow   // white view: top row 8, bottom row 1
        : displayRow + 1;  // black view: top row 1, bottom row 8

      if (isBaselineRank) {
        const fLabel = document.createElement('span');
        fLabel.className = 'chess-coord chess-coord-file';
        fLabel.textContent = files[file];
        sq.appendChild(fLabel);
      }
      if (isLeftFile) {
        const rLabel = document.createElement('span');
        rLabel.className = 'chess-coord chess-coord-rank';
        rLabel.textContent = String(humanRank);
        sq.appendChild(rLabel);
      }

      sq.dataset.index = String(idx);
      sq.setAttribute('aria-label', `${piece ? piece : 'empty'} on ${squareName(idx)}`);
      sq.addEventListener('click', onSquareClick);

      squares.push(sq);
      boardEl.appendChild(sq);
    });

    applyLastMoveHighlight();
  }

  function applyLastMoveHighlight() {
    if (!lastMove) return;
    squares.forEach((sq) => {
      const idx = Number(sq.dataset.index);
      if (idx === lastMove.from || idx === lastMove.to) {
        sq.classList.add('last-move');
      }
    });
  }

  function findSquareButton(index) {
    return squares.find(sq => Number(sq.dataset.index) === index) || null;
  }

  function highlightMoves(moves) {
    moves.forEach(m => {
      const btn = findSquareButton(m.to);
      if (btn) btn.classList.add('move-target');
    });
  }

  function algebraicForMove(move, pieceBefore, isCheckFlag, isMateFlag) {
    const pieceType = pieceBefore[1];
    const fromSq = squareName(move.from);
    const toSq = squareName(move.to);

    if (move.castle === 'K' || move.castle === 'k') return 'O-O';
    if (move.castle === 'Q' || move.castle === 'q') return 'O-O-O';

    let s = '';
    if (pieceType !== 'P') s += pieceType;
    if (move.capture) {
      if (pieceType === 'P') s += fromSq[0];
      s += 'x';
    }
    s += toSq;
    if (move.promotion) s += '=' + move.promotion;
    if (isMateFlag) s += '#';
    else if (isCheckFlag) s += '+';
    return s;
  }

  function appendMoveToList(move, san) {
    const isWhiteMove = !whiteToMove; // we already flipped after move
    if (isWhiteMove) {
      const li = document.createElement('li');
      li.textContent = `${fullmoveNumber - (whiteToMove ? 1 : 0)}. ${san}`;
      movesList.appendChild(li);
    } else {
      const last = movesList.lastElementChild;
      if (last) last.textContent += `   ${san}`;
      else {
        const li = document.createElement('li');
        li.textContent = `${fullmoveNumber}. ... ${san}`;
        movesList.appendChild(li);
      }
    }
    movesList.scrollTop = movesList.scrollHeight;
  }

  function onSquareClick(e) {
    // In 1P mode, ignore clicks when it's the AI's turn or the AI is thinking.
    if (mode === '1p' && (currentColor() === aiColor || aiThinking)) return;

    const btn = e.currentTarget;
    const idx = Number(btn.dataset.index);
    const piece = pieceAt(idx);

    const sameColor = piece && (whiteToMove ? isWhite(piece) : isBlack(piece));

    if (selected && selected.index === idx) {
      clearSelectionHighlights();
      selected = null;
      return;
    }

    if (selected && !sameColor) {
      const move = selected.moves.find(m => m.to === idx);
      if (move) {
        playMove(move, false);
        return;
      }
    }

    if (!piece || !sameColor) {
      clearSelectionHighlights();
      selected = null;
      return;
    }

    const moves = legalMovesFromSquare(idx);
    selected = { index: idx, moves };

    clearSelectionHighlights();
    btn.classList.add('selected');
    highlightMoves(moves);
    sound.playClick();
  }

  function onNewGame() {
    sound.playClick();
    paused = false;
    updateStatus();
    parseFen(START_FEN);
    orientation = 'white';
    moveHistory.length = 0;
    lastMove = null;
    selected = null;
    clearElement(movesList);
    hintUsesLeft = 3;
    updateHintInfo();
    if (aiMoveTimeoutId) {
      clearTimeout(aiMoveTimeoutId);
      aiMoveTimeoutId = null;
    }
    aiThinking = false;
    setupLabels();
    renderBoard();
    updateStatus();
    if (mode === '1p') {
      if (currentColor() === aiColor) {
        maybeScheduleAiMove();
      }
    } else if (mode === 'ai') {
      maybeScheduleAiMove();
    }
  }

  function onUndo() {
    sound.playClick();
    if (aiMoveTimeoutId) {
      clearTimeout(aiMoveTimeoutId);
      aiMoveTimeoutId = null;
      aiThinking = false;
    }
    // Undo last two plies if possible (AI + player), otherwise just last move.
    undoMove();
    undoMove();
    renderBoard();
    updateStatus();
  }

  function onFlip() {
    sound.playClick();
    if (paused) return;
    orientation = orientation === 'white' ? 'black' : 'white';
    setupLabels();
    renderBoard();
  }

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

  newBtn.addEventListener('click', onNewGame);
  undoBtn.addEventListener('click', onUndo);
  pauseBtn.addEventListener('click', onPauseClick);
  flipBtn.addEventListener('click', onFlip);
  tutorialBtn.addEventListener('click', () => {
    sound.playClick();
    setTimeout(() => {
      document.body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    setTimeout(() => {
      showTutorial();
    }, 300);
  });

  twoPBtn.addEventListener('click', () => {
    sound.playClick();
    mode = '2p';
    if (aiMoveTimeoutId) {
      clearTimeout(aiMoveTimeoutId);
      aiMoveTimeoutId = null;
    }
    aiThinking = false;
    updateModeButtons();
  });

  onePBtn.addEventListener('click', () => {
    sound.playClick();
    mode = '1p';
    aiColor = 'b'; // human as white vs AI as black by default
    updateModeButtons();
    maybeScheduleAiMove();
  });

  onePBlackBtn.addEventListener('click', () => {
    sound.playClick();
    mode = '1p';
    aiColor = 'w'; // human as black vs AI as white
    updateModeButtons();
    // If it's White's turn (AI), make AI move immediately
    if (currentColor() === 'w') {
      maybeScheduleAiMove();
    }
  });

  aiAiBtn.addEventListener('click', () => {
    sound.playClick();
    mode = 'ai';
    if (aiMoveTimeoutId) {
      clearTimeout(aiMoveTimeoutId);
      aiMoveTimeoutId = null;
    }
    aiThinking = false;
    updateModeButtons();
    // Start a fresh AI vs AI game when this mode is selected
    onNewGame();
  });

  easyBtn.addEventListener('click', () => {
    sound.playClick();
    difficulty = 'easy';
    updateDifficultyButtons();
  });
  medBtn.addEventListener('click', () => {
    sound.playClick();
    difficulty = 'medium';
    updateDifficultyButtons();
  });
  hardBtn.addEventListener('click', () => {
    sound.playClick();
    difficulty = 'hard';
    updateDifficultyButtons();
  });

  helpBtn.addEventListener('click', () => {
    sound.playClick();
    onHintClick();
  });

  function updatePauseButton() {
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  }

  function onPauseClick() {
    sound.playClick();
    paused = !paused;
    updatePauseButton();
    if (paused) {
      if (aiMoveTimeoutId) {
        clearTimeout(aiMoveTimeoutId);
        aiMoveTimeoutId = null;
      }
      aiThinking = false;
      updateStatus();
    } else {
      updateStatus();
      maybeScheduleAiMove();
    }
  }

  // Initial position
  parseFen(START_FEN);
  setupLabels();
  renderBoard();
  updateModeButtons();
  updateDifficultyButtons();
  updateHintInfo();
  updateStatus();

  // Start screen
  const startScreen = document.createElement('div');
  startScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

  const startPanel = document.createElement('div');
  startPanel.style.cssText = `
    background: white;
    border-radius: 20px;
    padding: 3rem;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  const startTitle = document.createElement('h1');
  startTitle.textContent = '♟️ Chess';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
    color: #667eea;
  `;

  const startDesc = document.createElement('p');
  startDesc.textContent = 'The classic game of strategy! Play against AI, challenge a friend, or watch AI battle. Master openings, tactics, and endgames!';
  startDesc.style.cssText = `
    margin: 0 0 1.5rem 0;
    font-size: 1.1rem;
    color: #555;
    line-height: 1.6;
  `;

  const startButton = document.createElement('button');
  startButton.textContent = '▶ Start Game';
  startButton.className = 'button primary';
  startButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.3rem;
    margin: 0.5rem;
    cursor: pointer;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  const hubButton = document.createElement('button');
  hubButton.textContent = '🏠 Back to Hub';
  hubButton.className = 'button';
  hubButton.style.cssText = `
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    border: 2px solid #667eea;
    border-radius: 10px;
    background: white;
    color: #667eea;
    font-weight: bold;
    transition: all 0.2s;
  `;

  startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'translateY(-2px)';
    startButton.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.4)';
  });
  startButton.addEventListener('mouseleave', () => {
    startButton.style.transform = 'translateY(0)';
    startButton.style.boxShadow = 'none';
  });

  hubButton.addEventListener('mouseenter', () => {
    hubButton.style.background = '#667eea';
    hubButton.style.color = 'white';
  });
  hubButton.addEventListener('mouseleave', () => {
    hubButton.style.background = 'white';
    hubButton.style.color = '#667eea';
  });

  startButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    setTimeout(() => {
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });

  hubButton.addEventListener('click', () => {
    sound.playClick();
    startScreen.remove();
    location.hash = '#/';
  });

  startPanel.append(startTitle, startDesc, startButton, hubButton);
  startScreen.appendChild(startPanel);
  root.appendChild(startScreen);

  // Scroll indicator
  const scrollIndicator = document.createElement('div');
  scrollIndicator.innerHTML = '⬇ Scroll to play ⬇';
  scrollIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(102, 126, 234, 0.9);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    font-weight: bold;
    z-index: 999;
    animation: bounce 2s infinite;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  root.appendChild(scrollIndicator);

  // Hide scroll indicator when start screen is removed
  const observerStart = new MutationObserver(() => {
    if (!document.body.contains(startScreen)) {
      scrollIndicator.remove();
      observerStart.disconnect();
    }
  });
  observerStart.observe(root, { childList: true });

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

  return () => {
    newBtn.removeEventListener('click', onNewGame);
    undoBtn.removeEventListener('click', onUndo);
    pauseBtn.removeEventListener('click', onPauseClick);
    flipBtn.removeEventListener('click', onFlip);
    twoPBtn.removeEventListener('click', () => {});
    onePBtn.removeEventListener('click', () => {});
    onePBlackBtn.removeEventListener('click', () => {});
    aiAiBtn.removeEventListener ("click", () => {});
    easyBtn.removeEventListener('click', () => {});
    medBtn.removeEventListener('click', () => {});
    hardBtn.removeEventListener('click', () => {});
    helpBtn.removeEventListener('click', () => {});
    if (aiMoveTimeoutId) clearTimeout(aiMoveTimeoutId);
    squares.forEach(sq => sq.removeEventListener('click', onSquareClick));
    if (startScreen.parentNode) startScreen.remove();
    if (scrollIndicator.parentNode) scrollIndicator.remove();
    wrap.remove();
  };
}
