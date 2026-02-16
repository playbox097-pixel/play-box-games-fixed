import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const MinecraftGame = () => {
  const mountRef = useRef(null);
  const [blockType, setBlockType] = useState('grass');
  
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 0, 120);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    
    // Materials
    const materials = {
      grass: new THREE.MeshLambertMaterial({ color: 0x4CAF50 }),
      dirt: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
      stone: new THREE.MeshLambertMaterial({ color: 0x696969 }),
      wood: new THREE.MeshLambertMaterial({ color: 0xA0522D }),
      sand: new THREE.MeshLambertMaterial({ color: 0xF4A460 })
    };
    
    // World data
    const blocks = new Map();
    const blockSize = 1;
    const worldSize = 15;
    
    // Create initial terrain
    for (let x = -worldSize; x <= worldSize; x++) {
      for (let z = -worldSize; z <= worldSize; z++) {
        const distance = Math.sqrt(x * x + z * z);
        const height = Math.floor(Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2 + 2);
        
        for (let y = 0; y <= height; y++) {
          let type = 'stone';
          if (y === height) type = 'grass';
          else if (y >= height - 1) type = 'dirt';
          
          addBlock(x, y, z, type);
        }
      }
    }
    
    function addBlock(x, y, z, type) {
      const key = `${x},${y},${z}`;
      if (blocks.has(key)) return;
      
      const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
      const mesh = new THREE.Mesh(geometry, materials[type]);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { x, y, z, type };
      scene.add(mesh);
      blocks.set(key, mesh);
    }
    
    function removeBlock(x, y, z) {
      const key = `${x},${y},${z}`;
      const block = blocks.get(key);
      if (block) {
        scene.remove(block);
        block.geometry.dispose();
        blocks.delete(key);
      }
    }
    
    // Raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.far = 10;
    
    // Camera controls
    let pitch = -0.3;
    let yaw = 0;
    const moveSpeed = 0.2;
    const lookSpeed = 0.002;
    
    const keys = {};
    const moveVector = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    const onKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
    };
    
    const onKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    let isPointerLocked = false;
    
    const onPointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
    };
    
    const onMouseMove = (e) => {
      if (!isPointerLocked) return;
      
      yaw -= e.movementX * lookSpeed;
      pitch -= e.movementY * lookSpeed;
      pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
    };
    
    const onClick = () => {
      if (!isPointerLocked) {
        renderer.domElement.requestPointerLock();
      }
    };
    
    const onMouseDown = (e) => {
      if (!isPointerLocked) return;
      
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(Array.from(blocks.values()));
      
      if (intersects.length > 0) {
        const block = intersects[0].object;
        const { x, y, z } = block.userData;
        
        if (e.button === 0) {
          // Left click - break
          removeBlock(x, y, z);
        } else if (e.button === 2) {
          // Right click - place
          const normal = intersects[0].face.normal;
          const newX = Math.round(x + normal.x);
          const newY = Math.round(y + normal.y);
          const newZ = Math.round(z + normal.z);
          
          // Don't place block where player is
          const dist = camera.position.distanceTo(new THREE.Vector3(newX, newY, newZ));
          if (dist > 1.5) {
            addBlock(newX, newY, newZ, blockType);
          }
        }
      }
    };
    
    const onContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);
    
    // Animation
    let animationId;
    
    function animate() {
      animationId = requestAnimationFrame(animate);
      
      // Update camera rotation
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
      
      // Calculate movement
      moveVector.set(0, 0, 0);
      
      forward.set(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      
      right.set(1, 0, 0);
      right.applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();
      
      if (keys['w']) moveVector.add(forward);
      if (keys['s']) moveVector.sub(forward);
      if (keys['a']) moveVector.sub(right);
      if (keys['d']) moveVector.add(right);
      
      if (moveVector.length() > 0) {
        moveVector.normalize();
        camera.position.add(moveVector.multiplyScalar(moveSpeed));
      }
      
      if (keys[' ']) camera.position.y += moveSpeed;
      if (keys['shift']) camera.position.y -= moveSpeed;
      
      // Keep player above ground
      if (camera.position.y < 1) camera.position.y = 1;
      
      renderer.render(scene, camera);
    }
    
    animate();
    
    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      
      blocks.forEach(block => {
        scene.remove(block);
        block.geometry.dispose();
      });
      blocks.clear();
      
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [blockType]);
  
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Controls UI */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        userSelect: 'none',
        maxWidth: '250px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#4CAF50' }}>
          Minecraft Clone
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Controls:</div>
          <div style={{ lineHeight: '1.6', fontSize: '13px' }}>
            • <strong>Click</strong> to start<br/>
            • <strong>WASD</strong> - Move<br/>
            • <strong>Mouse</strong> - Look<br/>
            • <strong>Space</strong> - Fly up<br/>
            • <strong>Shift</strong> - Fly down<br/>
            • <strong>Left Click</strong> - Break<br/>
            • <strong>Right Click</strong> - Place<br/>
            • <strong>ESC</strong> - Exit
          </div>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Block Type:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {['grass', 'dirt', 'stone', 'wood', 'sand'].map(type => (
              <button
                key={type}
                onClick={() => setBlockType(type)}
                style={{
                  padding: '10px',
                  background: blockType === type ? '#4CAF50' : '#444',
                  color: 'white',
                  border: blockType === type ? '2px solid #66BB6A' : '2px solid #666',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  fontWeight: blockType === type ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (blockType !== type) e.target.style.background = '#555';
                }}
                onMouseLeave={(e) => {
                  if (blockType !== type) e.target.style.background = '#444';
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }}>
        <div style={{
          width: '20px',
          height: '2px',
          background: 'white',
          position: 'absolute',
          left: '-10px',
          top: '-1px',
          boxShadow: '0 0 2px black'
        }} />
        <div style={{
          width: '2px',
          height: '20px',
          background: 'white',
          position: 'absolute',
          left: '-1px',
          top: '-10px',
          boxShadow: '0 0 2px black'
        }} />
      </div>
    </div>
  );
};

export default MinecraftGame;