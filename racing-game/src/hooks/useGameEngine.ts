import { useCallback, useEffect, useRef, useState } from 'react';
import { useSoundEffects } from './useSoundEffects';

// --- Interface Definitions ---
export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'spark' | 'smoke' | 'fire' | 'debris';
  rotation: number;
  rotationSpeed: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  speed: number;
  vx: number; // Vận tốc ngang để đạn bay xòe
}

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'star';
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  speed: number;
  health: number;
  maxHealth: number;
  color: string;
  size: number;
  shape: 'triangle' | 'square' | 'circle';
  hit: boolean;
}

export interface Explosion {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  level: number;
  stars: number;
  gameOver: boolean;
  victory: boolean;
  screenShake: boolean;
  isPoweredUp: boolean; // Trạng thái "Hóa Chaos"
}

// --- Constants ---
const COLORS = {
  spark: ['#FFD700', '#FFA500', '#FF6B00', '#FFFF00', '#FF4500'],
  fire: ['#FF4500', '#FF6B00', '#FF8C00', '#FFA500', '#FFD700'],
  smoke: ['#666666', '#888888', '#AAAAAA', '#CCCCCC', '#999999'],
  debris: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#8B0000'],
};
const ENEMY_COLORS = ['#FF4757', '#FF6B81', '#A55EEA', '#FFA502', '#2ED573', '#1E90FF'];

let particleId = 0;
let bulletId = 0;
let enemyId = 0;
let explosionId = 0;
let powerUpId = 0;

export const useGameEngine = () => {
  const { playSound } = useSoundEffects();

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    level: 1,
    stars: 0,
    gameOver: false,
    victory: false,
    screenShake: false,
    isPoweredUp: false,
  });

  const [playerX, setPlayerX] = useState(300);
  const [playerColor, setPlayerColor] = useState('#00D4FF');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const powerUpTimerRef = useRef<number>(0); // Timer đếm ngược 15s

  const createParticles = useCallback((x: number, y: number, count: number, type: Particle['type'], baseColor?: string) => {
    const newParticles: Particle[] = [];
    const colorSet = COLORS[type];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 8;
      const life = 30 + Math.random() * 40;
      newParticles.push({
        id: particleId++, x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'fire' ? 2 : 0),
        size: type === 'smoke' ? 8 + Math.random() * 12 : 3 + Math.random() * 6,
        color: baseColor || colorSet[Math.floor(Math.random() * colorSet.length)],
        life, maxLife: life, type,
        rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 20,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const createExplosion = useCallback((x: number, y: number, big = false, isPlayer = false) => {
    if (isPlayer) playSound('gameOver');
    else playSound('explosion');

    createParticles(x, y, big ? 30 : 15, 'spark');
    createParticles(x, y, big ? 20 : 10, 'fire');
    createParticles(x, y, big ? 15 : 8, 'smoke');
    createParticles(x, y, big ? 12 : 6, 'debris');

    setExplosions(prev => [...prev, {
      id: explosionId++, x, y, radius: 0, maxRadius: big ? 80 : 50, life: 20,
    }]);

    if (big) {
      setGameState(prev => ({ ...prev, screenShake: true }));
      setTimeout(() => setGameState(prev => ({ ...prev, screenShake: false })), 300);
    }
  }, [createParticles, playSound]);

  const spawnEnemy = useCallback(() => {
    const shapes: Enemy['shape'][] = ['triangle', 'square', 'circle'];
    setEnemies(prev => [...prev, {
      id: enemyId++,
      x: 50 + Math.random() * 500,
      y: -50,
      speed: 2 + gameState.level * 0.5 + Math.random() * 2,
      health: 2, maxHealth: 2,
      color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
      size: 25 + Math.random() * 15,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      hit: false,
    }]);
  }, [gameState.level]);

  // Spawn vật phẩm ngôi sao
  const spawnPowerUp = useCallback(() => {
    setPowerUps(prev => [...prev, {
      id: powerUpId++,
      x: 50 + Math.random() * 500,
      y: -50,
      size: 20,
      type: 'star'
    }]);
  }, []);

  // UPDATE: Hàm bắn súng (7 tia)
  const shoot = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    playSound('shoot');

    // Tạo ID cơ sở cho loạt đạn này
    let currentBulletId = Date.now(); 

    // LOGIC ĐẠN CHÙM KHI POWER UP (7 TIA)
    if (gameState.isPoweredUp) {
      const newBullets: Bullet[] = [];
      
      // Chạy từ -3 đến 3 để tạo 7 viên: -30, -20, -10, 0, 10, 20, 30 độ
      for (let i = -3; i <= 3; i++) {
        const angleInRadians = (i * 10) * (Math.PI / 180);
        newBullets.push({
          id: currentBulletId + i, // Đảm bảo ID không trùng
          x: playerX,
          y: 520,
          speed: 15, // Tốc độ 15 là vừa đẹp (45 sẽ quá nhanh khó thấy hiệu ứng xòe)
          vx: Math.sin(angleInRadians) * 15, // Độ xòe ngang
        });
      }
      setBullets(prev => [...prev, ...newBullets]);
    } else {
      // Bắn thường 1 viên
      setBullets(prev => [...prev, {
        id: currentBulletId,
        x: playerX,
        y: 520,
        speed: 40,
        vx: 0, // Bay thẳng
      }]);
    }
  }, [gameState.isPlaying, gameState.isPaused, gameState.isPoweredUp, playerX, playSound]);

  const movePlayer = useCallback((direction: 'left' | 'right') => {
    if (!gameState.isPlaying || gameState.isPaused) return;
    setPlayerX(prev => {
      const newX = direction === 'left' ? prev - 25 : prev + 25;
      return Math.max(40, Math.min(560, newX));
    });
  }, [gameState.isPlaying, gameState.isPaused]);

  const startGame = useCallback(() => {
    setGameState({
      isPlaying: true, isPaused: false, score: 0, level: 1, stars: 0,
      gameOver: false, victory: false, screenShake: false, 
      isPoweredUp: false
    });
    powerUpTimerRef.current = 0;
    setPlayerX(300);
    setParticles([]); setBullets([]); setEnemies([]); setExplosions([]); setPowerUps([]);

    for (let i = 0; i < 4; i++) setTimeout(() => spawnEnemy(), i * 500);
  }, [spawnEnemy]);

  const togglePause = useCallback(() => {
    if (!gameState.isPlaying) return;
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, [gameState.isPlaying]);

  const restartGame = useCallback(() => startGame(), [startGame]);
  
  const changePlayerColor = useCallback((color: string) => {
    if (!gameState.isPlaying) setPlayerColor(color);
  }, [gameState.isPlaying]);

  // --- GAME LOOP ---
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.gameOver || gameState.victory) return;

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastTimeRef.current < 16) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      lastTimeRef.current = timestamp;

      // 1. Đếm ngược thời gian PowerUp
      if (gameState.isPoweredUp) {
        powerUpTimerRef.current -= 16; 
        if (powerUpTimerRef.current <= 0) {
          setGameState(prev => ({ ...prev, isPoweredUp: false }));
        }
      }

      // 2. Update Particles & Explosions
      setParticles(prev => prev.map(p => ({
        ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + (p.type === 'smoke' ? -0.1 : 0.15),
        vx: p.vx * 0.98, life: p.life - 1, size: p.size * (p.type === 'smoke' ? 1.02 : 0.97),
        rotation: p.rotation + p.rotationSpeed,
      })).filter(p => p.life > 0 && p.size > 0.5));

      setExplosions(prev => prev.map(e => ({
        ...e, radius: e.radius + (e.maxRadius - e.radius) * 0.2, life: e.life - 1,
      })).filter(e => e.life > 0));

      // 3. Update PowerUps (Rơi xuống)
      setPowerUps(prev => prev.map(p => ({ ...p, y: p.y + 3 })).filter(p => p.y < 700));

      // 4. Update Bullets (Di chuyển bao gồm cả vx)
      setBullets(prev => prev
        .map(b => ({ ...b, y: b.y - b.speed, x: b.x + b.vx }))
        .filter(b => b.y > -20 && b.x > 0 && b.x < 600)
      );

      // 5. Update Enemies & Bullet Collision
      setEnemies(prev => {
        const updated = prev.map(e => ({ ...e, y: e.y + e.speed, hit: false }));
        setBullets(bullets => {
          const remainingBullets = [...bullets];
          updated.forEach(enemy => {
            const hitBulletIndex = remainingBullets.findIndex(b =>
              Math.abs(b.x - enemy.x) < enemy.size && Math.abs(b.y - enemy.y) < enemy.size
            );
            if (hitBulletIndex !== -1) {
              remainingBullets.splice(hitBulletIndex, 1);
              enemy.health -= 1;
              enemy.hit = true;
              if (enemy.health <= 0) {
                createExplosion(enemy.x, enemy.y, true, false);
                setGameState(prev => {
                  const newScore = prev.score + 10;
                  const newLevel = Math.floor(newScore / 50) + 1;
                  return { ...prev, score: newScore, level: newLevel };
                });
              } else {
                playSound('hit');
                createParticles(enemy.x, enemy.y, 5, 'spark', enemy.color);
              }
            }
          });
          return remainingBullets;
        });
        return updated.filter(e => e.health > 0 && e.y < 700);
      });

      // 6. Check Player Collision vs Enemies
      const playerTop = 550 - 25; const playerBottom = 550 + 20;
      const playerLeft = playerX - 18; const playerRight = playerX + 18;

      setEnemies(prev => {
        const playerHit = prev.some(e => {
           const dist = Math.sqrt(Math.pow(e.x - playerX, 2) + Math.pow(e.y - 550, 2));
           return dist < (e.size/2 + 20);
        });
        if (playerHit) {
          createExplosion(playerX, 550, true, true);
          playSound('gameOver'); // Gọi tiếng Crash to
          setGameState(prev => ({ ...prev, gameOver: true, screenShake: true }));
          setTimeout(() => setGameState(prev => ({ ...prev, screenShake: false })), 500);
        }
        return prev;
      });

      // 7. Check Player Collision vs PowerUps
      setPowerUps(prev => {
        const remainingPowerUps = [...prev];
        const hitIndex = remainingPowerUps.findIndex(p => 
          Math.sqrt(Math.pow(p.x - playerX, 2) + Math.pow(p.y - 550, 2)) < (p.size + 20)
        );

        if (hitIndex !== -1) {
          // Ăn PowerUp
          playSound('powerUp');
          createParticles(remainingPowerUps[hitIndex].x, remainingPowerUps[hitIndex].y, 20, 'spark', '#FFFF00');
          remainingPowerUps.splice(hitIndex, 1);
          
          // Kích hoạt PowerUp 15s
          powerUpTimerRef.current = 60000;
          setGameState(prev => ({ ...prev, isPoweredUp: true }));
        }
        return remainingPowerUps;
      });

      // Spawn Enemies
      if (Math.random() < 0.02 + gameState.level * 0.005) spawnEnemy();

      // Spawn PowerUp (Tỉ lệ 0.1%)
      if (Math.random() < 0.001) spawnPowerUp();

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameState.isPlaying, gameState.isPaused, gameState.gameOver, gameState.victory, gameState.level, gameState.isPoweredUp, playerX, createExplosion, createParticles, spawnEnemy, spawnPowerUp, playSound]);

  return {
    gameState, playerX, playerColor, particles, bullets, enemies, explosions, powerUps,
    shoot, movePlayer, startGame, togglePause, restartGame, changePlayerColor,
  };
};