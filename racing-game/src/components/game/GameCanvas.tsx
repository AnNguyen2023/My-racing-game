import React, { useEffect, useRef } from 'react';
import { Particle, Bullet, Enemy, Explosion, PowerUp } from '@/hooks/useGameEngine';

interface GameCanvasProps {
  playerX: number;
  playerColor: string;
  particles: Particle[];
  bullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  powerUps: PowerUp[];
  isPlaying: boolean;
  gameOver: boolean;
  screenShake: boolean;
  isPoweredUp: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerX,
  playerColor,
  particles,
  bullets,
  enemies,
  explosions,
  powerUps,
  isPlaying,
  gameOver,
  screenShake,
  isPoweredUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- 1. RUNG LẮC MÀN HÌNH ---
    const shakeX = (screenShake || gameOver) ? (Math.random() - 0.5) * 10 : 0;
    const shakeY = (screenShake || gameOver) ? (Math.random() - 0.5) * 10 : 0;

    // Clear màn hình và áp dụng rung
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(shakeX, shakeY);

    // --- 2. VẼ BỐI CẢNH ---
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 20]);
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 600);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(30, 600);
    ctx.moveTo(570, 0);
    ctx.lineTo(570, 600);
    ctx.stroke();

    ctx.fillStyle = '#1a5f1a';
    for (let y = 20; y < 600; y += 60) {
      ctx.beginPath();
      ctx.arc(10, y, 15, 0, Math.PI * 2);
      ctx.arc(590, y, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 3. BẬT HIỆU ỨNG PHÁT SÁNG (LIGHTER) ---
    ctx.globalCompositeOperation = 'lighter';

    // === VẼ POWER UP (NGÔI SAO LẤP LÁNH) ===
    // (Đã trả lại code vẽ ngôi sao 5 cánh)
    powerUps.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const blink = 0.5 + Math.sin(Date.now() / 100) * 0.5;
      
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FFFF00';
      ctx.fillStyle = `rgba(255, 255, 0, ${blink})`;

      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * p.size,
                   Math.sin((18 + i * 72) * Math.PI / 180) * p.size);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (p.size / 2),
                   Math.sin((54 + i * 72) * Math.PI / 180) * (p.size / 2));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Vẽ vụ nổ (Explosions) - Full Gradient
    explosions.forEach(exp => {
      const alpha = exp.life / 20;
      const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius * 1.5);
      gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
      gradient.addColorStop(0.2, `rgba(255, 150, 50, ${alpha})`);
      gradient.addColorStop(0.6, `rgba(255, 50, 50, ${alpha * 0.8})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Tâm trắng
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Vẽ hạt (Particles)
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.type === 'fire') {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(255, 200, 50, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.globalCompositeOperation = 'source-over'; // Khói đè lên
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        gradient.addColorStop(0, `rgba(100, 100, 100, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(50, 50, 50, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; // Bật lại lighter
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    });

    // Vẽ đạn (Bullets) - Có Glow
    bullets.forEach(b => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#FFD700';
      ctx.fillStyle = '#FFFFE0';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 4, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // --- 4. TẮT LIGHTER ĐỂ VẼ OBJECT RẮN ---
    ctx.globalCompositeOperation = 'source-over';

    // Vẽ Enemy
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      if (enemy.hit) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;
      }

      if (enemy.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(0, enemy.size);
        ctx.lineTo(-enemy.size * 0.8, -enemy.size * 0.5);
        ctx.lineTo(enemy.size * 0.8, -enemy.size * 0.5);
        ctx.fill();
      } else if (enemy.shape === 'square') {
        ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Thanh máu
      const barWidth = enemy.size * 1.2;
      const barHeight = 4;
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-barWidth / 2, -enemy.size - 10, barWidth, barHeight);
      ctx.fillStyle = healthPercent > 0.5 ? '#2ED573' : '#FF4757';
      ctx.fillRect(-barWidth / 2, -enemy.size - 10, barWidth * healthPercent, barHeight);

      ctx.restore();
    });

    // Vẽ Player
    if (isPlaying && !gameOver) {
      ctx.save();
      ctx.translate(playerX, 550);

      if (isPoweredUp) {
        const shake = (Math.random() - 0.5) * 2;
        ctx.translate(shake, shake);
        ctx.scale(1.3, 1.3); // To hơn
        ctx.shadowBlur = 40; // Glow mạnh hơn
        ctx.shadowColor = '#FFFF00';
      } else {
        ctx.shadowBlur = 20;
        ctx.shadowColor = playerColor;
      }

      ctx.fillStyle = playerColor;
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(-18, 20);
      ctx.lineTo(18, 20);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, -5, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Súng
      if (isPoweredUp) {
        ctx.fillStyle = '#FFD700'; 
        ctx.fillRect(-6, -40, 12, 20); // Súng chính to
        ctx.fillRect(-22, 0, 6, 15);   // Súng phụ trái
        ctx.fillRect(16, 0, 6, 15);    // Súng phụ phải
      } else {
        ctx.fillStyle = '#888888';
        ctx.fillRect(-4, -35, 8, 15);
      }

      ctx.restore();
    }
  }, [playerX, playerColor, particles, bullets, enemies, explosions, powerUps, isPlaying, gameOver, screenShake, isPoweredUp]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className="rounded-lg shadow-2xl"
      style={{ background: 'linear-gradient(180deg, #0a0a12 0%, #05050a 100%)' }}
    />
  );
};