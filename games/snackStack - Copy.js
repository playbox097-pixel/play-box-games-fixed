// Snack Stack 3000 - 2D falling snack stacking puzzle with 3D tower mode
// Hit "tower upgrade" to switch to 3D view with rotating camera and hazards!

// Helper to load Three.js
function loadThreeJS() {
  return new Promise((resolve, reject) => {
    if (window.THREE && window.THREE.OrbitControls) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    script.onload = () => {
      // Load OrbitControls (wait a bit for THREE to be ready)
      setTimeout(() => {
        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js';
        script2.onload = () => {
          resolve();
        };
        script2.onerror = (err) => {
          console.error('Failed to load OrbitControls:', err);
          reject(err);
        };
        document.head.appendChild(script2);
      }, 100);
    };
    script.onerror = (err) => {
      console.error('Failed to load Three.js:', err);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

export async function mount(container) {
  // Load Three.js dynamically via script tags
  await loadThreeJS();
  
  const THREE = window.THREE;
  const OrbitControls = THREE.OrbitControls;
  
  let gameMode = '2d'; // '2d' or '3d'
  let gameRunning = true;
  let score = 0;
  let comboMultiplier = 1;
  let lives = 3;
  let upgradeCharge = 0;
  const UPGRADE_THRESHOLD = 10;

  // 2D Canvas Setup
  const canvas2d = document.createElement('canvas');
  const ctx = canvas2d.getContext('2d');
  canvas2d.width = 400;
  canvas2d.height = 600;
  canvas2d.style.display = 'block';
  canvas2d.style.margin = '0 auto';
  canvas2d.style.background = '#ffe4b3';
  canvas2d.style.border = '4px solid #8b4513';
  canvas2d.style.borderRadius = '8px';
  container.appendChild(canvas2d);

  // 3D Scene Setup
  const canvas3d = document.createElement('canvas');
  canvas3d.style.display = 'none';`f`
  canvas3d.style.margin = '0 auto';
  canvas3d.style.border = '4px solid #4169e1';
  canvas3d.style.borderRadius = '8px';
  container.appendChild(canvas3d);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  renderer.setSize(600, 600);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(10, 15, 10);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas3d);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Ground platform
  const groundGeo = new THREE.CylinderGeometry(5, 5, 0.5, 32);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.25;
  ground.receiveShadow = true;
  scene.add(ground);

  // 2D Game State
  const snacks = [
    { emoji: '🍕', color: '#ff6b35', name: 'Pizza' },
    { emoji: '🍔', color: '#ffb347', name: 'Burger' },
    { emoji: '🌮', color: '#ffd93d', name: 'Taco' },
    { emoji: '🍰', color: '#ff69b4', name: 'Cake' },
    { emoji: '🍩', color: '#ff1493', name: 'Donut' },
    { emoji: '🍪', color: '#d2691e', name: 'Cookie' }
  ];

  let currentSnack = null;
  let stack2d = [];
  let particles2d = [];

  // 3D Game State
  let stack3d = [];
  let hazards3d = [];
  let fallingSnack3d = null;
  let snackVelocity = 0;

  // Keys
  const keys = { a: false, d: false, ArrowLeft: false, ArrowRight: false, s: false, ArrowDown: false };

  function handleKeyDown(e) {
    if (e.key in keys) {
      keys[e.key] = true;
      e.preventDefault();
    }
    if (e.key === ' ' && gameMode === '2d') {
      dropSnack();
      e.preventDefault();
    }
    if (e.key === ' ' && gameMode === '3d' && fallingSnack3d) {
      dropSnack3d();
      e.preventDefault();
    }
  }

  function handleKeyUp(e) {
    if (e.key in keys) {
      keys[e.key] = false;
      e.preventDefault();
    }
  }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // 2D Functions
  function spawnSnack2d() {
    const snack = snacks[Math.floor(Math.random() * snacks.length)];
    currentSnack = {
      ...snack,
      x: canvas2d.width / 2,
      y: 50,
      width: 60,
      height: 40,
      speed: 3
    };
  }

  function dropSnack() {
    if (!currentSnack) return;
    
    // Check if landed on stack or ground
    let landed = false;
    const snackBottom = canvas2d.height - 100;
    
    if (stack2d.length === 0) {
      // First snack
      currentSnack.y = snackBottom;
      stack2d.push({ ...currentSnack });
      landed = true;
    } else {
      // Check collision with stack
      const topSnack = stack2d[stack2d.length - 1];
      const overlap = Math.abs(currentSnack.x - topSnack.x);
      
      if (overlap < currentSnack.width * 0.6) {
        // Good stack!
        currentSnack.y = topSnack.y - currentSnack.height;
        stack2d.push({ ...currentSnack });
        landed = true;
        score += 10 * comboMultiplier;
        comboMultiplier += 0.5;
        upgradeCharge++;
        createParticles2d(currentSnack.x, currentSnack.y, currentSnack.color);
        
        // Check for tower upgrade
        if (upgradeCharge >= UPGRADE_THRESHOLD) {
          setTimeout(() => switchTo3D(), 500);
        }
      } else {
        // Missed!
        lives--;
        comboMultiplier = 1;
        createParticles2d(currentSnack.x, canvas2d.height - 80, '#ff0000');
        
        if (lives <= 0) {
          gameRunning = false;
          endGame();
          return;
        }
      }
    }
    
    if (landed && window.parent && window.parent.postMessage) {
      window.parent.postMessage({ type: 'game-result', result: 'win' }, '*');
    }
    
    currentSnack = null;
    setTimeout(() => spawnSnack2d(), 500);
  }

  function createParticles2d(x, y, color) {
    for (let i = 0; i < 10; i++) {
      particles2d.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 5 + 2,
        color,
        life: 1
      });
    }
  }

  function updateParticles2d() {
    particles2d = particles2d.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
      return p.life > 0;
    });
  }

  function draw2D() {
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas2d.height);
    grad.addColorStop(0, '#ffe4b3');
    grad.addColorStop(1, '#ffd480');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);

    // Ground
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, canvas2d.height - 100, canvas2d.width, 100);

    // Stack
    stack2d.forEach(snack => {
      ctx.fillStyle = snack.color;
      ctx.fillRect(snack.x - snack.width / 2, snack.y, snack.width, snack.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(snack.x - snack.width / 2, snack.y, snack.width, snack.height);
      
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(snack.emoji, snack.x, snack.y + 30);
    });

    // Current snack
    if (currentSnack) {
      // Move with keys
      if (keys.a || keys.ArrowLeft) currentSnack.x -= currentSnack.speed;
      if (keys.d || keys.ArrowRight) currentSnack.x += currentSnack.speed;
      if (keys.s || keys.ArrowDown) currentSnack.speed = 8;
      else currentSnack.speed = 3;
      
      currentSnack.x = Math.max(30, Math.min(canvas2d.width - 30, currentSnack.x));
      
      ctx.fillStyle = currentSnack.color;
      ctx.fillRect(currentSnack.x - currentSnack.width / 2, currentSnack.y, currentSnack.width, currentSnack.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(currentSnack.x - currentSnack.width / 2, currentSnack.y, currentSnack.width, currentSnack.height);
      
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(currentSnack.emoji, currentSnack.x, currentSnack.y + 30);
    }

    // Particles
    particles2d.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // UI
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, 10, 60);
    ctx.fillText(`Combo: x${comboMultiplier.toFixed(1)}`, 10, 90);
    
    // Upgrade bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, canvas2d.height - 30, 200, 20);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, canvas2d.height - 30, (upgradeCharge / UPGRADE_THRESHOLD) * 200, 20);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, canvas2d.height - 30, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TOWER UPGRADE', 110, canvas2d.height - 16);

    // Instructions
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';
    ctx.fillText('A/D or ←/→ to move | SPACE to drop', canvas2d.width / 2, canvas2d.height - 50);
  }

  // 3D Functions
  function switchTo3D() {
    gameMode = '3d';
    canvas2d.style.display = 'none';
    canvas3d.style.display = 'block';
    
    // Convert 2D stack to 3D
    stack2d.forEach((snack, i) => {
      const geo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
      const mat = new THREE.MeshStandardMaterial({ color: snack.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = i * 0.5;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      stack3d.push({ mesh, emoji: snack.emoji });
    });
    
    upgradeCharge = 0;
    spawnSnack3d();
    spawnHazard3d();
  }

  function spawnSnack3d() {
    if (fallingSnack3d) return;
    
    const snack = snacks[Math.floor(Math.random() * snacks.length)];
    const geo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    const mat = new THREE.MeshStandardMaterial({ color: snack.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 20, 0);
    mesh.castShadow = true;
    scene.add(mesh);
    
    fallingSnack3d = { mesh, emoji: snack.emoji, vx: 0, vz: 0 };
    snackVelocity = 0;
  }

  function spawnHazard3d() {
    if (!gameRunning || gameMode !== '3d') return;
    
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 8,
      20,
      (Math.random() - 0.5) * 8
    );
    scene.add(mesh);
    
    hazards3d.push({ mesh, vy: -0.1 });
    
    // Spawn next hazard
    setTimeout(() => spawnHazard3d(), 2000 + Math.random() * 3000);
  }

  function dropSnack3d() {
    if (!fallingSnack3d) return;
    snackVelocity = -0.5;
  }

  function update3D() {
    if (!fallingSnack3d) return;

    // Move snack with keys
    if (keys.a || keys.ArrowLeft) fallingSnack3d.vx = -0.15;
    else if (keys.d || keys.ArrowRight) fallingSnack3d.vx = 0.15;
    else fallingSnack3d.vx *= 0.9;

    if (keys.s || keys.ArrowDown) snackVelocity -= 0.02;
    
    fallingSnack3d.mesh.position.x += fallingSnack3d.vx;
    fallingSnack3d.mesh.position.z += fallingSnack3d.vz;
    
    snackVelocity -= 0.01; // Gravity
    fallingSnack3d.mesh.position.y += snackVelocity;

    // Keep in bounds
    const bound = 4;
    fallingSnack3d.mesh.position.x = Math.max(-bound, Math.min(bound, fallingSnack3d.mesh.position.x));
    fallingSnack3d.mesh.position.z = Math.max(-bound, Math.min(bound, fallingSnack3d.mesh.position.z));

    // Check landing
    const targetY = stack3d.length * 0.5;
    if (fallingSnack3d.mesh.position.y <= targetY) {
      fallingSnack3d.mesh.position.y = targetY;
      stack3d.push(fallingSnack3d);
      fallingSnack3d = null;
      score += 15 * comboMultiplier;
      comboMultiplier += 0.5;
      
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage({ type: 'game-result', result: 'win' }, '*');
      }
      
      setTimeout(() => spawnSnack3d(), 800);
    }

    // Update hazards
    hazards3d = hazards3d.filter(hazard => {
      hazard.mesh.position.y += hazard.vy;
      hazard.vy -= 0.005; // Accelerate
      
      // Check collision with stack
      for (let i = stack3d.length - 1; i >= 0; i--) {
        const snack = stack3d[i];
        const dist = hazard.mesh.position.distanceTo(snack.mesh.position);
        if (dist < 1) {
          // Hit! Remove top snack
          scene.remove(snack.mesh);
          stack3d.splice(i, 1);
          scene.remove(hazard.mesh);
          lives--;
          comboMultiplier = 1;
          
          if (lives <= 0) {
            gameRunning = false;
            endGame();
          }
          return false;
        }
      }
      
      // Remove if hit ground
      if (hazard.mesh.position.y < 0) {
        scene.remove(hazard.mesh);
        return false;
      }
      
      return true;
    });

    controls.update();
  }

  function draw3D() {
    renderer.render(scene, camera);
    
    // Overlay UI
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas2d.width, 120);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, 10, 60);
    ctx.fillText(`Combo: x${comboMultiplier.toFixed(1)}`, 10, 90);
    ctx.fillText(`🏗️ 3D TOWER MODE`, 200, 30);
    
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A/D: Move | S: Fast drop | SPACE: Drop', canvas2d.width / 2, 110);
  }

  function endGame() {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.background = 'rgba(0,0,0,0.9)';
    overlay.style.color = '#fff';
    overlay.style.padding = '40px';
    overlay.style.borderRadius = '16px';
    overlay.style.textAlign = 'center';
    overlay.style.zIndex = '1000';
    overlay.innerHTML = `
      <h2 style="font-size: 36px; margin: 0 0 20px 0;">Game Over!</h2>
      <p style="font-size: 24px; margin: 10px 0;">Final Score: ${score}</p>
      <p style="font-size: 18px; margin: 10px 0;">Stack Height: ${stack2d.length + stack3d.length}</p>
      <p style="font-size: 16px; margin-top: 20px; color: #aaa;">Refresh to play again</p>
    `;
    container.style.position = 'relative';
    container.appendChild(overlay);

    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({ type: 'game-end' }, '*');
    }
  }

  // Game Loop
  spawnSnack2d();

  function gameLoop() {
    if (!gameRunning) return;

    if (gameMode === '2d') {
      updateParticles2d();
      draw2D();
    } else {
      update3D();
      draw3D();
    }

    requestAnimationFrame(gameLoop);
  }

  gameLoop();

  // Cleanup
  return () => {
    gameRunning = false;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    if (canvas2d.parentNode) canvas2d.parentNode.removeChild(canvas2d);
    if (canvas3d.parentNode) canvas3d.parentNode.removeChild(canvas3d);
    controls.dispose();
    renderer.dispose();
  };
}
