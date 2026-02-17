// Pixel Pet Arena - Battle with cute pixel pets!
// Choose your pet, battle mode, and arena to fight!

import { sound } from '../sound.js';
import { getHighScore, updateHighScore } from '../highScores.js';

export async function mount(container) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;
  canvas.style.display = 'block';
  canvas.style.margin = '20px auto';
  canvas.style.borderRadius = '12px';
  canvas.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
  container.appendChild(canvas);

  const HS_KEY = 'pixel-pet-arena';
  let bestScore = getHighScore(HS_KEY) || 0;

  let gameRunning = false;
  let gameStarted = false;
  let score = 0;
  let round = 1;
  let playerHP = 100;
  let enemyHP = 100;
  let maxHP = 100;
  let playerEnergy = 3;
  let maxEnergy = 3;
  let selectedMove = null;
  let battleLog = [];
  let showingResult = false;
  let attackAnimation = null;
  let miniGameActive = false;
  let miniGameType = null;

  // Mini-game state
  let memoryCards = [];
  let memoryFlipped = [];
  let memoryMatched = [];
  let memoryFirstCard = null;
  let memorySecondCard = null;
  let memoryLocked = false;
  
  let cardMatchCards = [];
  let cardMatchSelected = null;
  let cardMatchTarget = null;
  
  let cpsClicks = 0;
  let cpsStartTime = 0;
  let cpsTimeLeft = 5;

  // Pet types with different stats and moves
  const petTypes = [
    {
      name: 'Firepup',
      emoji: '🔥🐶',
      color: '#ff6b6b',
      type: 'fire',
      moves: [
        { name: 'Flame Bite', damage: 20, energy: 1, emoji: '🔥' },
        { name: 'Fire Ball', damage: 35, energy: 2, emoji: '⚡' },
        { name: 'Inferno', damage: 50, energy: 3, emoji: '💥' },
      ]
    },
    {
      name: 'Aquakitty',
      emoji: '💧🐱',
      color: '#4dabf7',
      type: 'water',
      moves: [
        { name: 'Water Splash', damage: 18, energy: 1, emoji: '💧' },
        { name: 'Bubble Beam', damage: 32, energy: 2, emoji: '🫧' },
        { name: 'Tsunami', damage: 48, energy: 3, emoji: '🌊' },
      ]
    },
    {
      name: 'Thunderbird',
      emoji: '⚡🐦',
      color: '#ffd43b',
      type: 'wind',
      moves: [
        { name: 'Thunder Peck', damage: 22, energy: 1, emoji: '⚡' },
        { name: 'Lightning Strike', damage: 38, energy: 2, emoji: '⚡' },
        { name: 'Storm Rage', damage: 55, energy: 3, emoji: '⛈️' },
      ]
    },
    {
      name: 'Earthbear',
      emoji: '🌿🐻',
      color: '#51cf66',
      type: 'earth',
      moves: [
        { name: 'Leaf Swipe', damage: 16, energy: 1, emoji: '🍃' },
        { name: 'Rock Throw', damage: 30, energy: 2, emoji: '🪨' },
        { name: 'Earthquake', damage: 45, energy: 3, emoji: '💥' },
      ]
    },
    {
      name: 'Plasmafox',
      emoji: '⚡🦊',
      color: '#e879f9',
      type: 'plasma',
      moves: [
        { name: 'Plasma Bolt', damage: 24, energy: 1, emoji: '⚡' },
        { name: 'Energy Blast', damage: 40, energy: 2, emoji: '💫' },
        { name: 'Fusion Beam', damage: 60, energy: 3, emoji: '✨' },
      ]
    },
    {
      name: 'Rainbow Burst',
      emoji: '🌈✨',
      color: '#ff0080',
      type: 'rainbow',
      premium: true,
      cost: 2000,
      moves: [
        { name: 'Rainbow Ray', damage: 1000000, energy: 1, emoji: '🌈' },
        { name: 'Prismatic Beam', damage: 1000000, energy: 2, emoji: '✨' },
        { name: 'Spectrum Blast', damage: 1000000, energy: 3, emoji: '💥' },
      ]
    }
  ];

  // Battle modes
  const battleModes = [
    {
      id: 'quick',
      name: 'Quick Battle',
      emoji: '⚡',
      description: 'Fast-paced 1v1 battle',
      energyRegen: 1
    },
    {
      id: 'endurance',
      name: 'Endurance',
      emoji: '💪',
      description: 'Longer battles, more HP',
      energyRegen: 1,
      maxHP: 150
    },
    {
      id: 'chaos',
      name: 'Chaos Mode',
      emoji: '💥',
      description: 'Random damage multipliers!',
      energyRegen: 2,
      chaosMode: true
    }
  ];

  // Battle maps with type benefits
  const battleMaps = [
    {
      id: 'volcano',
      name: 'Volcano Arena',
      emoji: '🌋',
      background: 'linear-gradient(180deg, #ff6b6b 0%, #c92a2a 100%)',
      benefit: 'fire',
      bonusMultiplier: 1.3,
      description: '+30% damage for Fire types'
    },
    {
      id: 'ocean',
      name: 'Ocean Depths',
      emoji: '🌊',
      background: 'linear-gradient(180deg, #4dabf7 0%, #1864ab 100%)',
      benefit: 'water',
      bonusMultiplier: 1.3,
      description: '+30% damage for Water types'
    },
    {
      id: 'forest',
      name: 'Ancient Forest',
      emoji: '🌲',
      background: 'linear-gradient(180deg, #51cf66 0%, #2f9e44 100%)',
      benefit: 'earth',
      bonusMultiplier: 1.3,
      description: '+30% damage for Earth types'
    },
    {
      id: 'sky',
      name: 'Sky Castle',
      emoji: '☁️',
      background: 'linear-gradient(180deg, #74c0fc 0%, #4c6ef5 100%)',
      benefit: 'wind',
      bonusMultiplier: 1.3,
      description: '+30% damage for Wind types'
    },
    {
      id: 'void',
      name: 'Void Dimension',
      emoji: '🌌',
      background: 'linear-gradient(180deg, #e879f9 0%, #9333ea 100%)',
      benefit: 'plasma',
      bonusMultiplier: 1.3,
      description: '+30% damage for Plasma types'
    }
  ];

  let playerPet = null;
  let enemyPet = null;
  let selectedMode = battleModes[0];
  let selectedMap = battleMaps[0];
  let selectionPhase = 'pet'; // 'pet', 'mode', 'map', 'battle'

  // Tutorial system
  const TUTORIAL_KEY = 'pixel-pet-arena-tutorial-completed';
  const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY) === 'true';
  let tutorialActive = false;
  let tutorialOverlay = null;

  function showTutorial() {
    tutorialActive = true;
    tutorialOverlay = document.createElement('div');
    tutorialOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const tutorialBox = document.createElement('div');
    tutorialBox.style.cssText = `
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.98), rgba(118, 75, 162, 0.98));
      padding: 40px;
      border-radius: 20px;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.1);
    `;

    const tutorialSteps = [
      {
        title: '🐾 Welcome to Pixel Pet Arena!',
        text: 'Battle with adorable pixel pets in strategic turn-based combat. Let me show you how to play!'
      },
      {
        title: '🎯 Choose Your Pet',
        text: 'Start by selecting your favorite pet! Each has different types (Fire, Water, Earth, Wind, Plasma) with unique moves and damage.'
      },
      {
        title: '⚔️ Battle Modes',
        text: 'Pick a battle mode:<br>⚡ Quick Battle - Standard fights<br>💪 Endurance - More HP<br>💥 Chaos - Random damage!'
      },
      {
        title: '🗺️ Arena Selection',
        text: 'Choose your arena! Each map gives +30% damage bonus to matching pet types. Pick strategically!'
      },
      {
        title: '⚡ Energy System',
        text: 'You have 3 energy. Moves cost 1-3 energy. Energy regenerates +1 per turn. Choose moves wisely!'
      },
      {
        title: '🎮 Mini-Games',
        text: 'Low on energy? Play mini-games to recharge!<br>🧠 Memory Match (+2 energy)<br>🎯 Card Match (+1 energy)<br>⚡ CPS Test (+3 energy)'
      },
      {
        title: '🏆 Win 5 Games!',
        text: 'Defeat 5 enemies in a row to win and earn 100 Playbux! Use revives if you lose, or restart to try again.'
      },
      {
        title: '🌈 Premium Pet',
        text: 'Rainbow Burst pet available for 2000 PB! Deals 1M damage but only gives 50 PB reward. A powerful shortcut!'
      },
      {
        title: '✨ Ready to Battle!',
        text: 'You\'re all set! Choose your pet, pick your arena, and fight your way to victory. Good luck, trainer! 🎮'
      }
    ];

    let currentStep = 0;

    function updateTutorial() {
      const step = tutorialSteps[currentStep];
      tutorialBox.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 20px;">${step.title.split(' ')[0]}</div>
        <h2 style="color: white; margin: 0 0 20px 0; font-size: 32px;">
          ${step.title.substring(step.title.indexOf(' ') + 1)}
        </h2>
        <p style="color: rgba(255,255,255,0.9); font-size: 18px; line-height: 1.6; margin: 20px 0;">
          ${step.text}
        </p>
        <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
          ${currentStep > 0 ? `
            <button id="tutorial-back" style="
              background: rgba(134, 142, 150, 0.8);
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: bold;
            ">← Back</button>
          ` : ''}
          ${currentStep < tutorialSteps.length - 1 ? `
            <button id="tutorial-next" style="
              background: linear-gradient(135deg, #51cf66, #37b24d);
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: bold;
            ">Next →</button>
          ` : `
            <button id="tutorial-done" style="
              background: linear-gradient(135deg, #ffd43b, #fab005);
              color: #333;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: bold;
            ">Let's Play! 🎮</button>
          `}
          <button id="tutorial-skip" style="
            background: rgba(255, 107, 107, 0.8);
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
          ">Skip</button>
        </div>
        <div style="margin-top: 20px; color: rgba(255,255,255,0.6); font-size: 14px;">
          Step ${currentStep + 1} of ${tutorialSteps.length}
        </div>
      `;

      if (currentStep > 0) {
        document.getElementById('tutorial-back').onclick = () => {
          currentStep--;
          updateTutorial();
          sound.playClick();
        };
      }

      if (currentStep < tutorialSteps.length - 1) {
        document.getElementById('tutorial-next').onclick = () => {
          currentStep++;
          updateTutorial();
          sound.playClick();
        };
      } else {
        document.getElementById('tutorial-done').onclick = () => {
          localStorage.setItem(TUTORIAL_KEY, 'true');
          container.removeChild(tutorialOverlay);
          tutorialActive = false;
          tutorialOverlay = null;
          sound.playScore();
        };
      }

      document.getElementById('tutorial-skip').onclick = () => {
        localStorage.setItem(TUTORIAL_KEY, 'true');
        container.removeChild(tutorialOverlay);
        tutorialActive = false;
        tutorialOverlay = null;
        sound.playClick();
      };
    }

    tutorialBox.innerHTML = '';
    tutorialOverlay.appendChild(tutorialBox);
    container.appendChild(tutorialOverlay);
    updateTutorial();
  }

  // Show tutorial for first-time players
  if (!hasCompletedTutorial) {
    setTimeout(() => showTutorial(), 500);
  }

  // Initialize game
  function startBattle() {
    if (!gameStarted) {
      // First time starting - reset everything
      gameStarted = true;
      round = 1;
      score = 0;
    }
    
    gameRunning = true;
    maxHP = selectedMode.maxHP || 100;
    playerHP = maxHP;
    enemyHP = maxHP;
    playerEnergy = maxEnergy;
    selectedMove = null;
    battleLog = [];
    showingResult = false;
    attackAnimation = null;
    
    // Random enemy pet (different from player)
    do {
      enemyPet = petTypes[Math.floor(Math.random() * petTypes.length)];
    } while (enemyPet.name === playerPet.name);
    
    addLog(`🎮 Battle ${round}! ${playerPet.name} vs ${enemyPet.name}!`);
    
    // Update canvas background to selected map
    canvas.style.background = selectedMap.background;
  }

  function addLog(message) {
    battleLog.unshift(message);
    if (battleLog.length > 5) battleLog.pop();
  }

  function startMiniGame(type) {
    miniGameActive = true;
    miniGameType = type;
    sound.playClick();
    
    if (type === 'memory') {
      // Initialize memory game - 4x3 grid
      const symbols = ['🔥', '💧', '⚡', '🌿', '⭐', '💎'];
      const deck = [...symbols, ...symbols];
      memoryCards = deck.sort(() => Math.random() - 0.5);
      memoryFlipped = Array(12).fill(false);
      memoryMatched = Array(12).fill(false);
      memoryFirstCard = null;
      memorySecondCard = null;
      memoryLocked = false;
    } else if (type === 'cardmatch') {
      // Initialize card match - find the matching card
      const symbols = ['🔥', '💧', '⚡', '🌿', '⭐', '💎', '🎯', '🎪'];
      cardMatchCards = [];
      for (let i = 0; i < 6; i++) {
        cardMatchCards.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      cardMatchTarget = cardMatchCards[Math.floor(Math.random() * 6)];
      cardMatchSelected = null;
    } else if (type === 'cps') {
      // Initialize CPS test
      cpsClicks = 0;
      cpsStartTime = Date.now();
      cpsTimeLeft = 5;
    }
  }

  function completeMiniGame(success) {
    if (success) {
      const energyGain = miniGameType === 'memory' ? 2 : miniGameType === 'cps' ? 3 : 1;
      playerEnergy = Math.min(playerEnergy + energyGain, maxEnergy);
      addLog(`🎮 Mini-game complete! +${energyGain} energy!`);
      sound.playWin();
    } else {
      addLog('❌ Mini-game failed!');
      sound.playClick();
    }
    miniGameActive = false;
    miniGameType = null;
  }

  function handleMemoryClick(cardIndex) {
    if (memoryLocked || memoryFlipped[cardIndex] || memoryMatched[cardIndex]) return;
    
    memoryFlipped[cardIndex] = true;
    sound.playClick();
    
    if (memoryFirstCard === null) {
      memoryFirstCard = cardIndex;
    } else {
      memorySecondCard = cardIndex;
      memoryLocked = true;
      
      setTimeout(() => {
        if (memoryCards[memoryFirstCard] === memoryCards[memorySecondCard]) {
          // Match!
          memoryMatched[memoryFirstCard] = true;
          memoryMatched[memorySecondCard] = true;
          sound.playScore();
          
          // Check if all matched
          if (memoryMatched.every(m => m)) {
            setTimeout(() => completeMiniGame(true), 500);
          }
        } else {
          // No match
          memoryFlipped[memoryFirstCard] = false;
          memoryFlipped[memorySecondCard] = false;
        }
        
        memoryFirstCard = null;
        memorySecondCard = null;
        memoryLocked = false;
      }, 600);
    }
  }

  function handleCardMatchClick(cardIndex) {
    if (cardMatchCards[cardIndex] === cardMatchTarget) {
      completeMiniGame(true);
    } else {
      completeMiniGame(false);
    }
  }

  function handleCPSClick() {
    cpsClicks++;
    sound.playClick();
    
    const elapsed = (Date.now() - cpsStartTime) / 1000;
    cpsTimeLeft = Math.max(0, 5 - elapsed);
    
    if (elapsed >= 5) {
      // Calculate CPS
      const cps = cpsClicks / 5;
      if (cps >= 5) {
        completeMiniGame(true);
      } else {
        completeMiniGame(false);
      }
    }
  }

  function selectMove(moveIndex) {
    if (!gameRunning || showingResult) return;
    
    const move = playerPet.moves[moveIndex];
    if (playerEnergy < move.energy) {
      addLog('⚠️ Not enough energy!');
      sound.playClick();
      return;
    }

    selectedMove = move;
    executeRound();
  }

  function executeRound() {
    if (!selectedMove) return;
    
    showingResult = true;
    gameRunning = false;
    
    // Player attacks with animation
    playerEnergy -= selectedMove.energy;
    let playerDamage = selectedMove.damage + Math.floor(Math.random() * 10);
    
    // Apply map bonus
    if (selectedMap.benefit === playerPet.type) {
      playerDamage = Math.floor(playerDamage * selectedMap.bonusMultiplier);
      addLog(`💫 Map Bonus! +${Math.floor((selectedMap.bonusMultiplier - 1) * 100)}%`);
    }
    
    // Apply chaos mode
    if (selectedMode.chaosMode) {
      const chaosMultiplier = 0.5 + Math.random() * 1.0;
      playerDamage = Math.floor(playerDamage * chaosMultiplier);
    }
    
    // Attack animation
    attackAnimation = {
      type: 'player',
      emoji: selectedMove.emoji,
      x: 200,
      y: 250,
      targetX: 600,
      targetY: 250,
      progress: 0
    };
    
    enemyHP -= playerDamage;
    addLog(`${playerPet.emoji} ${selectedMove.name}! -${playerDamage} HP`);
    sound.playScore();
    
    setTimeout(() => {
      attackAnimation = null;
      
      if (enemyHP <= 0) {
        // Player wins
        winRound();
        return;
      }
      
      // Enemy attacks with animation
      const availableMoves = enemyPet.moves.filter(m => m.energy <= playerEnergy);
      const enemyMove = availableMoves.length > 0 
        ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
        : enemyPet.moves[0];
      
      let enemyDamage = enemyMove.damage + Math.floor(Math.random() * 10);
      
      // Apply map bonus for enemy
      if (selectedMap.benefit === enemyPet.type) {
        enemyDamage = Math.floor(enemyDamage * selectedMap.bonusMultiplier);
      }
      
      // Apply chaos mode
      if (selectedMode.chaosMode) {
        const chaosMultiplier = 0.5 + Math.random() * 1.0;
        enemyDamage = Math.floor(enemyDamage * chaosMultiplier);
      }
      
      attackAnimation = {
        type: 'enemy',
        emoji: enemyMove.emoji,
        x: 600,
        y: 250,
        targetX: 200,
        targetY: 250,
        progress: 0
      };
      
      playerHP -= enemyDamage;
      addLog(`${enemyPet.emoji} ${enemyMove.name}! -${enemyDamage} HP`);
      sound.playClick();
      
      setTimeout(() => {
        attackAnimation = null;
        
        if (playerHP <= 0) {
          // Player loses
          endGame();
        } else {
          // Continue battle
          const energyRegen = selectedMode.energyRegen || 1;
          playerEnergy = Math.min(playerEnergy + energyRegen, maxEnergy);
          selectedMove = null;
          showingResult = false;
          gameRunning = true;
        }
      }, 800);
    }, 800);
  }

  function winRound() {
    score += 100 * round;
    round++;
    addLog(`🎉 Victory! +${100 * (round - 1)} points!`);
    sound.playWin();
    
    // Check if reached round 5 (game won) - changed from 10 to 5 for easier testing
    if (round > 5) {
      winGame();
      return;
    }
    
    setTimeout(() => {
      startBattle();
    }, 2000);
  }

  function winGame() {
    gameRunning = false;
    sound.playWin();
    
    // Award playbux based on pet used
    const playbuxReward = playerPet.premium ? 50 : 100;
    if (window.playBoxAddPlaybux) {
      window.playBoxAddPlaybux(playbuxReward);
    }
    
    if (score > bestScore) {
      bestScore = score;
      updateHighScore(HS_KEY, score);
    }

    // Create win screen
    const winScreen = document.createElement('div');
    winScreen.id = 'pixel-pet-win';
    winScreen.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(81, 207, 102, 0.98), rgba(55, 178, 77, 0.98));
      padding: 40px 60px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.1);
      text-align: center;
      z-index: 1000;
      min-width: 400px;
      backdrop-filter: blur(10px);
    `;

    winScreen.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 20px; animation: bounce 0.6s ease;">🏆</div>
      <h2 style="color: white; margin: 0 0 10px 0; font-size: 42px; text-shadow: 2px 2px 8px rgba(0,0,0,0.3);">
        Victory!
      </h2>
      <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 15px 0;">
        Your ${playerPet.name} is the champion!
      </p>
      ${playerPet.premium ? `
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 5px 0; font-style: italic;">
          Premium pet used - reduced reward
        </p>
      ` : ''}
      <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <div style="color: white; font-size: 24px; margin: 10px 0;">
          <span style="opacity: 0.8;">Rounds Won:</span> <strong>${round - 1}</strong>
        </div>
        <div style="color: white; font-size: 24px; margin: 10px 0;">
          <span style="opacity: 0.8;">Final Score:</span> <strong>${score}</strong>
        </div>
        <div style="color: #ffd43b; font-size: 28px; margin: 15px 0; animation: pulse 1s infinite;">
          💰 <strong>+${playbuxReward} Playbux!</strong>
        </div>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
        <button id="play-again-btn" style="
          background: linear-gradient(135deg, #4dabf7, #228be6);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(77, 171, 247, 0.4);
          transition: all 0.3s;
        ">
          🔄 Play Again
        </button>
        <button id="hub-btn-win" style="
          background: linear-gradient(135deg, #868e96, #495057);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(134, 142, 150, 0.4);
          transition: all 0.3s;
        ">
          🏠 Hub
        </button>
      </div>
    `;

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      #pixel-pet-win button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }
      #pixel-pet-win button:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    container.appendChild(winScreen);

    // Scroll to win screen
    setTimeout(() => {
      winScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    document.getElementById('play-again-btn').onclick = () => {
      sound.playClick();
      container.removeChild(winScreen);
      document.head.removeChild(style);
      selectionPhase = 'pet';
      gameStarted = false;
      playerPet = null;
      enemyPet = null;
      
      setTimeout(() => {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };

    document.getElementById('hub-btn-win').onclick = () => {
      sound.playClick();
      window.location.hash = '';
    };
  }

  function endGame() {
    gameRunning = false;
    sound.playGameOver();
    
    if (score > bestScore) {
      bestScore = score;
      updateHighScore(HS_KEY, score);
    }

    // Create game over screen
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'pixel-pet-game-over';
    gameOverScreen.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.98), rgba(118, 75, 162, 0.98));
      padding: 40px 60px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.1);
      text-align: center;
      z-index: 1000;
      min-width: 400px;
      backdrop-filter: blur(10px);
    `;

    const revivesAvailable = window.playBoxGetRevives ? window.playBoxGetRevives() : 0;

    gameOverScreen.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 20px; animation: bounce 0.6s ease;">💔</div>
      <h2 style="color: white; margin: 0 0 10px 0; font-size: 42px; text-shadow: 2px 2px 8px rgba(0,0,0,0.3);">
        Defeated!
      </h2>
      <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 15px 0;">
        Your ${playerPet.name} was defeated by ${enemyPet.name}!
      </p>
      <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <div style="color: white; font-size: 24px; margin: 10px 0;">
          <span style="opacity: 0.8;">Round:</span> <strong>${round}</strong>
        </div>
        <div style="color: white; font-size: 24px; margin: 10px 0;">
          <span style="opacity: 0.8;">Score:</span> <strong>${score}</strong>
        </div>
        <div style="color: #ffd43b; font-size: 24px; margin: 10px 0;">
          <span style="opacity: 0.8;">Best:</span> <strong>${bestScore}</strong>
        </div>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px; flex-wrap: wrap;">
        <button id="revive-btn" style="
          background: linear-gradient(135deg, #51cf66, #37b24d);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(81, 207, 102, 0.4);
          transition: all 0.3s;
        ">
          ❤️ Revive (${revivesAvailable})
        </button>
        <button id="restart-btn" style="
          background: linear-gradient(135deg, #4dabf7, #228be6);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(77, 171, 247, 0.4);
          transition: all 0.3s;
        ">
          🔄 Restart
        </button>
        <button id="hub-btn" style="
          background: linear-gradient(135deg, #868e96, #495057);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(134, 142, 150, 0.4);
          transition: all 0.3s;
        ">
          🏠 Hub
        </button>
      </div>
    `;

    // Add hover effects
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      #pixel-pet-game-over button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }
      #pixel-pet-game-over button:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    container.appendChild(gameOverScreen);

    // Scroll to game over panel
    setTimeout(() => {
      gameOverScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    const reviveBtn = document.getElementById('revive-btn');
    const restartBtn = document.getElementById('restart-btn');
    const hubBtn = document.getElementById('hub-btn');

    // Check revives
    const hasRevives = revivesAvailable > 0;
    if (!hasRevives) {
      reviveBtn.disabled = true;
      reviveBtn.style.opacity = '0.5';
      reviveBtn.style.cursor = 'not-allowed';
      reviveBtn.textContent = '❤️ No Revives';
    }

    reviveBtn.onclick = () => {
      if (!hasRevives) return;
      
      if (window.playBoxUseRevive) {
        window.playBoxUseRevive();
      }
      
      sound.playScore();
      container.removeChild(gameOverScreen);
      document.head.removeChild(style);
      
      // Revive with half HP
      playerHP = Math.floor(maxHP / 2);
      enemyHP = maxHP;
      gameRunning = true;
      showingResult = false;
      selectedMove = null;
      
      // Scroll down to game
      setTimeout(() => {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };

    restartBtn.onclick = () => {
      sound.playClick();
      container.removeChild(gameOverScreen);
      document.head.removeChild(style);
      selectionPhase = 'pet';
      gameStarted = false;
      playerPet = null;
      enemyPet = null;
      
      // Scroll down to game
      setTimeout(() => {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };

    hubBtn.onclick = () => {
      sound.playClick();
      window.location.hash = '';
    };
  }


  function drawSelectionScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (selectionPhase === 'pet') {
      // Choose Your Pet
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🐾 Choose Your Pet', canvas.width / 2, 80);
      
      // Tutorial button
      const tutorialBtnX = canvas.width - 140;
      const tutorialBtnY = 20;
      const tutorialBtnWidth = 120;
      const tutorialBtnHeight = 40;
      
      ctx.fillStyle = 'rgba(81, 207, 102, 0.8)';
      ctx.fillRect(tutorialBtnX, tutorialBtnY, tutorialBtnWidth, tutorialBtnHeight);
      ctx.strokeStyle = '#51cf66';
      ctx.lineWidth = 2;
      ctx.strokeRect(tutorialBtnX, tutorialBtnY, tutorialBtnWidth, tutorialBtnHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('🎓 Tutorial', tutorialBtnX + tutorialBtnWidth / 2, tutorialBtnY + 26);

      // Draw pets in a grid
      const cols = 3;
      const rows = Math.ceil(petTypes.length / cols);
      const boxWidth = 200;
      const boxHeight = 180;
      const startX = (canvas.width - (cols * boxWidth + (cols - 1) * 20)) / 2;
      const startY = 140;

      petTypes.forEach((pet, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxWidth + 20);
        const y = startY + row * (boxHeight + 20);

        // Check if premium pet is unlocked
        const isLocked = pet.premium && (!localStorage.getItem('rainbow-burst-unlocked'));
        
        // Draw pet box
        ctx.fillStyle = pet.color;
        ctx.globalAlpha = isLocked ? 0.1 : 0.3;
        ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = pet.color;
        ctx.lineWidth = pet.premium ? 4 : 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        if (isLocked) {
          // Draw locked overlay
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(x, y, boxWidth, boxHeight);
          
          // Lock icon
          ctx.font = '48px Arial';
          ctx.fillText('🔒', x + boxWidth / 2, y + 60);
          
          // Cost
          ctx.fillStyle = '#ffd43b';
          ctx.font = 'bold 18px Arial';
          ctx.fillText('2000 PB', x + boxWidth / 2, y + 100);
          
          ctx.fillStyle = 'white';
          ctx.font = '14px Arial';
          ctx.fillText('Click to unlock', x + boxWidth / 2, y + 125);
          
          // Premium badge
          ctx.fillStyle = '#ff0080';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('PREMIUM', x + boxWidth / 2, y + 145);
        } else {
          // Draw pet emoji
          ctx.font = pet.premium ? '56px Arial' : '64px Arial';
          ctx.fillText(pet.emoji, x + boxWidth / 2, y + 80);

          // Draw pet name
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px Arial';
          ctx.fillText(pet.name, x + boxWidth / 2, y + 120);

          // Draw type
          ctx.font = '16px Arial';
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText(pet.type.toUpperCase(), x + boxWidth / 2, y + 145);
          
          // Premium badge
          if (pet.premium) {
            ctx.fillStyle = '#ff0080';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('⭐ PREMIUM ⭐', x + boxWidth / 2, y + 165);
          }
        }
      });

    } else if (selectionPhase === 'mode') {
      // Choose Battle Mode
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️ Choose Battle Mode', canvas.width / 2, 80);

      const boxWidth = 220;
      const boxHeight = 160;
      const startX = (canvas.width - (battleModes.length * boxWidth + (battleModes.length - 1) * 30)) / 2;
      const startY = 180;

      battleModes.forEach((mode, i) => {
        const x = startX + i * (boxWidth + 30);
        const y = startY;

        // Draw mode box
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.fillRect(x, y, boxWidth, boxHeight);

        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Draw emoji
        ctx.font = '48px Arial';
        ctx.fillText(mode.emoji, x + boxWidth / 2, y + 60);

        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(mode.name, x + boxWidth / 2, y + 100);

        // Draw description
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const lines = mode.description.split(' ');
        ctx.fillText(lines.slice(0, 2).join(' '), x + boxWidth / 2, y + 125);
        if (lines.length > 2) {
          ctx.fillText(lines.slice(2).join(' '), x + boxWidth / 2, y + 145);
        }
      });

    } else if (selectionPhase === 'map') {
      // Choose Map
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🗺️ Choose Your Arena', canvas.width / 2, 80);

      const boxWidth = 180;
      const boxHeight = 160;
      const cols = 3;
      const rows = Math.ceil(battleMaps.length / cols);
      const startX = (canvas.width - (cols * boxWidth + (cols - 1) * 20)) / 2;
      const startY = 140;

      battleMaps.forEach((map, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxWidth + 20);
        const y = startY + row * (boxHeight + 20);

        // Draw map box with gradient preview
        const gradient = ctx.createLinearGradient(x, y, x, y + boxHeight);
        gradient.addColorStop(0, map.background.match(/#[0-9a-f]{6}/gi)[0]);
        gradient.addColorStop(1, map.background.match(/#[0-9a-f]{6}/gi)[1]);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = map.background.match(/#[0-9a-f]{6}/gi)[0];
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Draw map emoji
        ctx.font = '48px Arial';
        ctx.fillText(map.emoji, x + boxWidth / 2, y + 60);

        // Draw map name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(map.name, x + boxWidth / 2, y + 95);

        // Draw benefit
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffd43b';
        ctx.fillText(map.description, x + boxWidth / 2, y + 115);
      });
    }
  }

  function drawMiniGame() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (miniGameType === 'memory') {
      // Memory Game
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🧠 Memory Match!', canvas.width / 2, 60);
      
      ctx.font = '18px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Match all pairs to gain +2 energy!', canvas.width / 2, 95);
      
      // Draw 4x3 grid
      const cols = 4;
      const rows = 3;
      const cardWidth = 80;
      const cardHeight = 100;
      const startX = (canvas.width - (cols * cardWidth + (cols - 1) * 15)) / 2;
      const startY = 130;
      
      memoryCards.forEach((symbol, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (cardWidth + 15);
        const y = startY + row * (cardHeight + 15);
        
        if (memoryMatched[i]) {
          // Matched - show green
          ctx.fillStyle = 'rgba(81, 207, 102, 0.3)';
          ctx.fillRect(x, y, cardWidth, cardHeight);
          ctx.strokeStyle = '#51cf66';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, cardWidth, cardHeight);
          
          ctx.font = '40px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText(symbol, x + cardWidth / 2, y + cardHeight / 2 + 15);
        } else if (memoryFlipped[i]) {
          // Flipped - show card
          ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
          ctx.fillRect(x, y, cardWidth, cardHeight);
          ctx.strokeStyle = '#667eea';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, cardWidth, cardHeight);
          
          ctx.font = '40px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText(symbol, x + cardWidth / 2, y + cardHeight / 2 + 15);
        } else {
          // Face down
          ctx.fillStyle = 'rgba(134, 142, 150, 0.8)';
          ctx.fillRect(x, y, cardWidth, cardHeight);
          ctx.strokeStyle = '#868e96';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, cardWidth, cardHeight);
          
          ctx.font = '40px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText('?', x + cardWidth / 2, y + cardHeight / 2 + 15);
        }
      });
      
    } else if (miniGameType === 'cardmatch') {
      // Card Match Game
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 Find The Match!', canvas.width / 2, 60);
      
      ctx.font = '24px Arial';
      ctx.fillStyle = '#ffd43b';
      ctx.fillText(`Find: ${cardMatchTarget}`, canvas.width / 2, 110);
      
      ctx.font = '18px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Click the matching card to gain +1 energy!', canvas.width / 2, 145);
      
      // Draw cards in a row
      const cardWidth = 100;
      const cardHeight = 130;
      const startX = (canvas.width - (6 * cardWidth + 5 * 20)) / 2;
      const startY = 200;
      
      cardMatchCards.forEach((symbol, i) => {
        const x = startX + i * (cardWidth + 20);
        const y = startY;
        
        ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
        ctx.fillRect(x, y, cardWidth, cardHeight);
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, cardWidth, cardHeight);
        
        ctx.font = '50px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(symbol, x + cardWidth / 2, y + cardHeight / 2 + 20);
      });
      
    } else if (miniGameType === 'cps') {
      // CPS Test
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ Click Speed Test!', canvas.width / 2, 60);
      
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Click 25+ times in 5 seconds to gain +3 energy!', canvas.width / 2, 100);
      
      // Time left
      const elapsed = (Date.now() - cpsStartTime) / 1000;
      const timeLeft = Math.max(0, 5 - elapsed);
      
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = timeLeft > 2 ? '#51cf66' : '#ff6b6b';
      ctx.fillText(timeLeft.toFixed(1) + 's', canvas.width / 2, 180);
      
      // Clicks
      ctx.font = 'bold 72px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(cpsClicks, canvas.width / 2, 280);
      
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('clicks', canvas.width / 2, 310);
      
      // Click area
      ctx.fillStyle = 'rgba(102, 126, 234, 0.6)';
      ctx.fillRect(250, 350, 300, 150);
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 4;
      ctx.strokeRect(250, 350, 300, 150);
      
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText('CLICK HERE!', canvas.width / 2, 440);
      
      // CPS display
      if (elapsed > 0) {
        const cps = (cpsClicks / elapsed).toFixed(1);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ffd43b';
        ctx.fillText(`${cps} CPS (need 5.0)`, canvas.width / 2, 530);
      }
      
      // Auto-end when time is up
      if (elapsed >= 5 && miniGameActive) {
        const cps = cpsClicks / 5;
        if (cps >= 5) {
          completeMiniGame(true);
        } else {
          completeMiniGame(false);
        }
      }
    }
    
    // Cancel button
    ctx.fillStyle = 'rgba(255, 107, 107, 0.8)';
    ctx.fillRect(canvas.width / 2 - 60, 550, 120, 40);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 60, 550, 120, 40);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('❌ Cancel', canvas.width / 2, 575);
  }

  function draw() {
    if (!gameStarted) {
      drawSelectionScreen();
      return;
    }

    if (miniGameActive) {
      drawMiniGame();
      return;
    }

    // Clear canvas
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw arena floor with shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 365, canvas.width, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 370, canvas.width, 230);

    // Draw pets with shadow and bounce
    const time = Date.now() / 1000;
    const playerBounce = Math.sin(time * 2) * 5;
    const enemyBounce = Math.sin(time * 2 + Math.PI) * 5;
    
    // Player pet shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(200, 340, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Player pet
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = playerPet.color;
    ctx.shadowBlur = 20;
    ctx.fillText(playerPet.emoji, 200, 300 + playerBounce);
    ctx.shadowBlur = 0;
    
    // Enemy pet shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(600, 340, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Enemy pet
    ctx.shadowColor = enemyPet.color;
    ctx.shadowBlur = 20;
    ctx.fillText(enemyPet.emoji, 600, 300 + enemyBounce);
    ctx.shadowBlur = 0;

    // Draw HP bars (moved down slightly for new scoreboard)
    // Player HP
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(100, 170, 200, 30);
    
    // HP gradient
    const playerHPGradient = ctx.createLinearGradient(100, 170, 300, 170);
    if (playerHP > maxHP * 0.6) {
      playerHPGradient.addColorStop(0, '#51cf66');
      playerHPGradient.addColorStop(1, '#37b24d');
    } else if (playerHP > maxHP * 0.3) {
      playerHPGradient.addColorStop(0, '#ffd43b');
      playerHPGradient.addColorStop(1, '#fab005');
    } else {
      playerHPGradient.addColorStop(0, '#ff6b6b');
      playerHPGradient.addColorStop(1, '#fa5252');
    }
    ctx.fillStyle = playerHPGradient;
    ctx.fillRect(100, 170, (playerHP / maxHP) * 200, 30);
    
    // HP shine effect
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(100, 170, (playerHP / maxHP) * 200, 10);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 170, 200, 30);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${playerPet.name}`, 100, 160);
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, playerHP)}/${maxHP}`, 200, 190);
    ctx.shadowBlur = 0;

    // Enemy HP
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(500, 170, 200, 30);
    
    // HP gradient
    const enemyHPGradient = ctx.createLinearGradient(500, 170, 700, 170);
    if (enemyHP > maxHP * 0.6) {
      enemyHPGradient.addColorStop(0, '#51cf66');
      enemyHPGradient.addColorStop(1, '#37b24d');
    } else if (enemyHP > maxHP * 0.3) {
      enemyHPGradient.addColorStop(0, '#ffd43b');
      enemyHPGradient.addColorStop(1, '#fab005');
    } else {
      enemyHPGradient.addColorStop(0, '#ff6b6b');
      enemyHPGradient.addColorStop(1, '#fa5252');
    }
    ctx.fillStyle = enemyHPGradient;
    ctx.fillRect(500, 170, (enemyHP / maxHP) * 200, 30);
    
    // HP shine effect
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(500, 170, (enemyHP / maxHP) * 200, 10);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(500, 170, 200, 30);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${enemyPet.name}`, 700, 160);
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, enemyHP)}/${maxHP}`, 600, 190);
    ctx.shadowBlur = 0;

    // Draw energy with glow
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 5;
    ctx.fillText(`⚡ Energy: ${playerEnergy}/${maxEnergy}`, 200, 220);
    ctx.shadowBlur = 0;

    // Draw scoreboard panel
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(canvas.width / 2 - 150, 20, 300, 110);
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width / 2 - 150, 20, 300, 110);
    
    // Goal
    ctx.fillStyle = '#ffd43b';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 WIN 5 GAMES! 🏆', canvas.width / 2, 45);
    
    // Progress bar
    const progressWidth = 240;
    const progressX = canvas.width / 2 - 120;
    const progressY = 55;
    const progress = Math.min(round - 1, 5) / 5;
    
    // Progress bar background
    ctx.fillStyle = 'rgba(100,100,100,0.5)';
    ctx.fillRect(progressX, progressY, progressWidth, 20);
    
    // Progress bar fill
    const gradient = ctx.createLinearGradient(progressX, progressY, progressX + progressWidth, progressY);
    gradient.addColorStop(0, '#51cf66');
    gradient.addColorStop(1, '#ffd43b');
    ctx.fillStyle = gradient;
    ctx.fillRect(progressX, progressY, progressWidth * progress, 20);
    
    // Progress bar border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(progressX, progressY, progressWidth, 20);
    
    // Wins counter
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`${Math.max(0, round - 1)}/5 Wins`, canvas.width / 2, 92);
    
    // Score
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffd43b';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, 115);

    // Draw map name below scoreboard
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${selectedMap.emoji} ${selectedMap.name}`, canvas.width / 2, 145);

    // Draw move buttons
    if (!showingResult) {
      const buttonY = 420;
      const buttonSpacing = 180;
      const startX = 110;

      playerPet.moves.forEach((move, i) => {
        const x = startX + i * buttonSpacing;
        const canAfford = playerEnergy >= move.energy;

        // Button shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + 3, buttonY + 3, 160, 70);

        // Button background with gradient
        if (canAfford) {
          const gradient = ctx.createLinearGradient(x, buttonY, x, buttonY + 70);
          gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)');
          gradient.addColorStop(1, 'rgba(118, 75, 162, 0.9)');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        }
        ctx.fillRect(x, buttonY, 160, 70);
        
        // Button shine
        if (canAfford) {
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(x, buttonY, 160, 20);
        }
        
        ctx.strokeStyle = canAfford ? '#667eea' : '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, buttonY, 160, 70);

        // Move name
        ctx.fillStyle = canAfford ? 'white' : '#999';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText(move.name, x + 80, buttonY + 25);

        // Damage and energy
        ctx.font = '14px Arial';
        ctx.fillText(`${move.emoji} ${move.damage} DMG`, x + 80, buttonY + 45);
        ctx.fillText(`⚡ ${move.energy}`, x + 80, buttonY + 62);
        ctx.shadowBlur = 0;
      });
      
      // Mini-game buttons with enhanced styling
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText('⚡ Recharge Energy:', canvas.width / 2, 510);
      ctx.shadowBlur = 0;
      
      const miniGameY = 525;
      const miniGameWidth = 130;
      const miniGameSpacing = 20;
      const miniGamesStartX = (canvas.width - (3 * miniGameWidth + 2 * miniGameSpacing)) / 2;
      
      const miniGames = [
        { type: 'memory', emoji: '🧠', name: 'Memory', color: '#667eea' },
        { type: 'cardmatch', emoji: '🎯', name: 'Match', color: '#51cf66' },
        { type: 'cps', emoji: '⚡', name: 'CPS', color: '#ffd43b' }
      ];
      
      miniGames.forEach((game, i) => {
        const x = miniGamesStartX + i * (miniGameWidth + miniGameSpacing);
        
        // Button shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x + 2, miniGameY + 2, miniGameWidth, 55);
        
        // Button gradient
        const gradient = ctx.createLinearGradient(x, miniGameY, x, miniGameY + 55);
        gradient.addColorStop(0, game.color);
        gradient.addColorStop(1, game.color + 'aa');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, miniGameY, miniGameWidth, 55);
        ctx.globalAlpha = 1;
        
        // Shine effect
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x, miniGameY, miniGameWidth, 15);
        
        ctx.strokeStyle = game.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, miniGameY, miniGameWidth, 55);
        
        ctx.font = '24px Arial';
        ctx.fillStyle = 'white';
        ctx.shadowColor = game.color;
        ctx.shadowBlur = 5;
        ctx.fillText(game.emoji, x + miniGameWidth / 2, miniGameY + 30);
        ctx.shadowBlur = 0;
        
        ctx.font = 'bold 14px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText(game.name, x + miniGameWidth / 2, miniGameY + 50);
        ctx.shadowBlur = 0;
      });
    }

    // Draw battle log (moved up a bit for mini-game buttons)
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(20, 380, 760, 30);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    battleLog.slice(0, 2).forEach((log, i) => {
      ctx.globalAlpha = 1 - (i * 0.3);
      ctx.fillText(log, 30, 398 + i * 16);
    });
    ctx.globalAlpha = 1;

    // Draw attack animation with enhanced effects
    if (attackAnimation) {
      attackAnimation.progress += 0.05;
      const progress = Math.min(attackAnimation.progress, 1);
      const x = attackAnimation.x + (attackAnimation.targetX - attackAnimation.x) * progress;
      const y = attackAnimation.y + (attackAnimation.targetY - attackAnimation.y) * progress - Math.sin(progress * Math.PI) * 50;

      // Glow effect
      ctx.shadowColor = attackAnimation.type === 'player' ? playerPet.color : enemyPet.color;
      ctx.shadowBlur = 30;
      
      // Rotation
      const rotation = progress * Math.PI * 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1 - progress * 0.5;
      ctx.fillStyle = 'white';
      ctx.fillText(attackAnimation.emoji, 0, 0);
      
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
      // Trail effect
      for (let i = 0; i < 3; i++) {
        const trailProgress = Math.max(0, progress - i * 0.1);
        const trailX = attackAnimation.x + (attackAnimation.targetX - attackAnimation.x) * trailProgress;
        const trailY = attackAnimation.y + (attackAnimation.targetY - attackAnimation.y) * trailProgress - Math.sin(trailProgress * Math.PI) * 50;
        
        ctx.globalAlpha = 0.3 * (1 - progress) * (1 - i * 0.3);
        ctx.font = '36px Arial';
        ctx.fillStyle = attackAnimation.type === 'player' ? playerPet.color : enemyPet.color;
        ctx.fillText(attackAnimation.emoji, trailX, trailY);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Mouse click handler
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (miniGameActive) {
      if (miniGameType === 'memory') {
        // Check memory card clicks
        const cols = 4;
        const rows = 3;
        const cardWidth = 80;
        const cardHeight = 100;
        const startX = (canvas.width - (cols * cardWidth + (cols - 1) * 15)) / 2;
        const startY = 130;
        
        memoryCards.forEach((symbol, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cardX = startX + col * (cardWidth + 15);
          const cardY = startY + row * (cardHeight + 15);
          
          if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
            handleMemoryClick(i);
          }
        });
      } else if (miniGameType === 'cardmatch') {
        // Check card match clicks
        const cardWidth = 100;
        const cardHeight = 130;
        const startX = (canvas.width - (6 * cardWidth + 5 * 20)) / 2;
        const startY = 200;
        
        cardMatchCards.forEach((symbol, i) => {
          const cardX = startX + i * (cardWidth + 20);
          const cardY = startY;
          
          if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
            handleCardMatchClick(i);
          }
        });
      } else if (miniGameType === 'cps') {
        // Check CPS click area
        if (x >= 250 && x <= 550 && y >= 350 && y <= 500) {
          handleCPSClick();
        }
      }
      
      // Check cancel button
      if (x >= canvas.width / 2 - 60 && x <= canvas.width / 2 + 60 && y >= 550 && y <= 590) {
        miniGameActive = false;
        miniGameType = null;
        sound.playClick();
      }
      
      return;
    }

    if (!gameStarted) {
      if (selectionPhase === 'pet') {
        // Check tutorial button click
        const tutorialBtnX = canvas.width - 140;
        const tutorialBtnY = 20;
        const tutorialBtnWidth = 120;
        const tutorialBtnHeight = 40;
        
        if (x >= tutorialBtnX && x <= tutorialBtnX + tutorialBtnWidth && 
            y >= tutorialBtnY && y <= tutorialBtnY + tutorialBtnHeight) {
          showTutorial();
          return;
        }
        
        // Check pet selection
        const cols = 3;
        const boxWidth = 200;
        const boxHeight = 180;
        const startX = (canvas.width - (cols * boxWidth + (cols - 1) * 20)) / 2;
        const startY = 140;

        petTypes.forEach((pet, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const petX = startX + col * (boxWidth + 20);
          const petY = startY + row * (boxHeight + 20);

          if (x >= petX && x <= petX + boxWidth && y >= petY && y <= petY + boxHeight) {
            // Check if premium and locked
            if (pet.premium && !localStorage.getItem('rainbow-burst-unlocked')) {
              // Try to unlock
              const currentPlaybux = window.playBoxGetPlaybux ? window.playBoxGetPlaybux() : 0;
              if (currentPlaybux >= pet.cost) {
                if (confirm(`Unlock ${pet.name} for ${pet.cost} Playbux?\n\n⚠️ Note: Using this pet gives only 50 PB reward instead of 100 PB!`)) {
                  if (window.playBoxSpendPlaybux && window.playBoxSpendPlaybux(pet.cost)) {
                    localStorage.setItem('rainbow-burst-unlocked', 'true');
                    sound.playWin();
                    alert(`${pet.name} unlocked! 🌈✨`);
                  }
                }
              } else {
                sound.playClick();
                alert(`Not enough Playbux! Need ${pet.cost} PB (You have ${currentPlaybux} PB)`);
              }
            } else {
              // Select pet
              playerPet = pet;
              selectionPhase = 'mode';
              sound.playClick();
            }
          }
        });
      } else if (selectionPhase === 'mode') {
        // Check mode selection
        const boxWidth = 220;
        const boxHeight = 160;
        const startX = (canvas.width - (battleModes.length * boxWidth + (battleModes.length - 1) * 30)) / 2;
        const startY = 180;

        battleModes.forEach((mode, i) => {
          const modeX = startX + i * (boxWidth + 30);
          const modeY = startY;

          if (x >= modeX && x <= modeX + boxWidth && y >= modeY && y <= modeY + boxHeight) {
            selectedMode = mode;
            selectionPhase = 'map';
            sound.playClick();
          }
        });
      } else if (selectionPhase === 'map') {
        // Check map selection
        const boxWidth = 180;
        const boxHeight = 160;
        const cols = 3;
        const startX = (canvas.width - (cols * boxWidth + (cols - 1) * 20)) / 2;
        const startY = 140;

        battleMaps.forEach((map, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const mapX = startX + col * (boxWidth + 20);
          const mapY = startY + row * (boxHeight + 20);

          if (x >= mapX && x <= mapX + boxWidth && y >= mapY && y <= mapY + boxHeight) {
            selectedMap = map;
            sound.playClick();
            startBattle();
          }
        });
      }
      return;
    }

    if (showingResult) return;

    // Check move button clicks
    const buttonY = 420;
    const buttonSpacing = 180;
    const startX = 110;

    playerPet.moves.forEach((move, i) => {
      const btnX = startX + i * buttonSpacing;
      if (x >= btnX && x <= btnX + 160 && y >= buttonY && y <= buttonY + 70) {
        selectMove(i);
      }
    });
    
    // Check mini-game button clicks
    const miniGameY = 525;
    const miniGameWidth = 130;
    const miniGameSpacing = 20;
    const miniGamesStartX = (canvas.width - (3 * miniGameWidth + 2 * miniGameSpacing)) / 2;
    
    const miniGames = ['memory', 'cardmatch', 'cps'];
    miniGames.forEach((game, i) => {
      const btnX = miniGamesStartX + i * (miniGameWidth + miniGameSpacing);
      if (x >= btnX && x <= btnX + miniGameWidth && y >= miniGameY && y <= miniGameY + 55) {
        startMiniGame(game);
      }
    });
  });

  // Game loop
  const gameLoop = setInterval(() => {
    draw();
  }, 1000 / 60);

  // Cleanup
  return () => {
    clearInterval(gameLoop);
    canvas.remove();
  };
}
