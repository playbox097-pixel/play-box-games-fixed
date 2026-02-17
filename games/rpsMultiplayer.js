// games/rpsMultiplayer.js
import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(root) {
  const wrap = document.createElement('div');
  wrap.className = 'mp';

  const toolbar = document.createElement('div'); toolbar.className = 'game-toolbar';
  const status = document.createElement('span'); status.className = 'status';
  const score = document.createElement('span'); score.className = 'badge';
  const best = document.createElement('span'); best.className = 'badge';
  const nextBtn = button('Next Round'); nextBtn.classList.add('button');
  const resetBtn = button('Reset Match'); resetBtn.classList.add('button','danger');
  toolbar.append(status, score, best, nextBtn, resetBtn);

  const row = document.createElement('div'); row.className = 'row';

  // game logic mappings (declared before we create the player panels)
  const beats = { rock:'scissors', paper:'rock', scissors:'paper' };
  // Use widely-supported hand emojis so they render on more systems
  const icons = { rock:'✊', paper:'✋', scissors:'✌️' };

  const p1 = playerPanel('Player 1');
  const p2 = playerPanel('Player 2');
  row.append(p1.el, p2.el);

  const rulesEl = createRules([
    'Two players choose simultaneously on the same device.',
    'Rock beats Scissors, Scissors beats Paper, Paper beats Rock.',
    'After both lock in, the result is revealed.',
    'First to 5 points wins the match. Use Next Round or Reset Match as needed.'
  ]);

  wrap.append(toolbar, rulesEl, row);
  root.appendChild(wrap);

  let s1 = 0, s2 = 0;
  let c1 = null, c2 = null;
  let revealTimer = null;

  const HS_KEY = 'rps-multiplayer';
  let bestRound = getHighScore(HS_KEY);
  best.textContent = `Best round: ${bestRound}`;

  function button(t){ const b=document.createElement('button'); b.textContent=t; return b; }
  function createRules(items){
    const d = document.createElement('details'); d.className='rules';
    const s = document.createElement('summary'); s.textContent='Rules';
    const ul = document.createElement('ul');
    items.forEach(t => { const li=document.createElement('li'); li.textContent=t; ul.appendChild(li); });
    d.append(s, ul); return d;
  }

  function playerPanel(title){
    const el = document.createElement('div'); el.className = 'panel';
    const head = document.createElement('div'); head.className = 'title'; head.textContent = title;
    const ready = document.createElement('span'); ready.className = 'badge'; ready.textContent = 'Waiting…';
    const choices = document.createElement('div'); choices.className = 'choices';
    const btns = ['rock','paper','scissors'].map(id => {
      const b = document.createElement('button'); b.className = 'choice'; b.dataset.id = id; b.textContent = icons[id]; return b;
    });
    btns.forEach(b => choices.appendChild(b));
    el.append(head, ready, choices);
    return { el, head, ready, choices, btns: btns };
  }

  function setButtonsEnabled(panel, on){ panel.btns.forEach(b => b.disabled = !on); }

  function lockChoice(panel, which){
    panel.ready.textContent = 'Ready';
    setButtonsEnabled(panel, false);
  }

  function clearChoices(){
    c1 = c2 = null;
    p1.ready.textContent = 'Waiting…';
    p2.ready.textContent = 'Waiting…';
    setButtonsEnabled(p1, true);
    setButtonsEnabled(p2, true);
    status.textContent = 'Choose your moves';
  }

  function updateScore(){
    score.textContent = `Score: ${s1} - ${s2}`;
    const roundBest = Math.max(s1, s2);
    if (roundBest > bestRound) {
      bestRound = updateHighScore(HS_KEY, roundBest);
      best.textContent = `Best round: ${bestRound}`;
    }
  }

  function resolve(){
    // small reveal delay for drama
    status.textContent = 'Revealing…';
    revealTimer = setTimeout(() => {
      let msg;
      if (c1 === c2) msg = `Draw: ${icons[c1]} equals ${icons[c2]}`;
      else if (beats[c1] === c2) { s1++; msg = `Player 1 wins: ${icons[c1]} beats ${icons[c2]}`; sound.playScore(); }
      else { s2++; msg = `Player 2 wins: ${icons[c2]} beats ${icons[c1]}`; sound.playScore(); }
      updateScore();
      status.textContent = msg;

      if (s1 >= 5 || s2 >= 5) {
        status.textContent = s1 > s2 ? 'Player 1 won the match!' : 'Player 2 won the match!';
        sound.playWin();
        setButtonsEnabled(p1, false); setButtonsEnabled(p2, false);
      }
    }, 650);
  }

  function onChoice(player, e){
    const id = e.currentTarget.dataset.id;
    if (player === 1) { if (c1) return; c1 = id; lockChoice(p1, id); }
    else { if (c2) return; c2 = id; lockChoice(p2, id); }
    if (c1 && c2) resolve();
  }

  p1.btns.forEach(b => b.addEventListener('click', onChoice.bind(null,1)));
  p2.btns.forEach(b => b.addEventListener('click', onChoice.bind(null,2)));
  nextBtn.addEventListener('click', () => { if (revealTimer) { clearTimeout(revealTimer); revealTimer=null; } sound.playClick(); clearChoices(); });
  resetBtn.addEventListener('click', () => { if (revealTimer) { clearTimeout(revealTimer); revealTimer=null; } s1=0; s2=0; updateScore(); clearChoices(); sound.playClick(); });

  // init
  updateScore();
  status.textContent = 'Choose your moves';

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
  startTitle.textContent = '✊✋✌️ RPS Multiplayer';
  startTitle.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
    color: #667eea;
  `;

  const startDesc = document.createElement('p');
  startDesc.textContent = 'Local 2-player Rock Paper Scissors! Compete on the same device. First to 5 wins! Choose wisely and outsmart your opponent.';
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

  return () => {
    if (revealTimer) clearTimeout(revealTimer);
    p1.btns.forEach(b => b.removeEventListener('click', onChoice));
    p2.btns.forEach(b => b.removeEventListener('click', onChoice));
    nextBtn.replaceWith(nextBtn.cloneNode(true));
    resetBtn.replaceWith(resetBtn.cloneNode(true));
    if (startScreen.parentNode) startScreen.remove();
    if (scrollIndicator.parentNode) scrollIndicator.remove();
    wrap.remove();
  };
}
