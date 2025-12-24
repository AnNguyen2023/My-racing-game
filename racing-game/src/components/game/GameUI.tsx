import React from 'react';
import { GameState } from '@/hooks/useGameEngine';

interface GameUIProps {
  gameState: GameState;
  onStart: () => void;
  onRestart: () => void;
  onColorChange: (color: string) => void;
}

const PLAYER_COLORS = [
  { color: '#FF4757', key: '1', name: 'Đỏ' },
  { color: '#FFA502', key: '2', name: 'Cam' },
  { color: '#FFD700', key: '3', name: 'Vàng' },
  { color: '#2ED573', key: '4', name: 'Xanh lá' },
  { color: '#00D4FF', key: '5', name: 'Xanh dương' },
  { color: '#A55EEA', key: '6', name: 'Tím' },
  { color: '#FF6B81', key: '7', name: 'Hồng' },
  { color: '#8B4513', key: '8', name: 'Nâu' },
  { color: '#FFFFFF', key: '9', name: 'Trắng' },
];

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  onStart,
  onRestart,
  onColorChange,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Score display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-6 py-3 neon-border">
          <p className="text-lg text-primary font-display">
            Điểm: <span className="text-accent font-bold">{gameState.score}</span>
            <span className="mx-3 text-muted-foreground">|</span>
            Level: <span className="text-secondary font-bold">{gameState.level}</span>
          </p>
          <p className="text-sm text-neon-yellow mt-1">
            {Array(gameState.stars).fill('⭐').join('')}
            {Array(10 - gameState.stars).fill('☆').join('')}
          </p>
        </div>
      </div>

      {/* Instructions - shown when not playing */}
      {!gameState.isPlaying && !gameState.gameOver && !gameState.victory && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 neon-border max-w-[180px]">
            <h3 className="text-primary font-display text-sm mb-3">HƯỚNG DẪN</h3>
            <ul className="text-xs text-foreground/80 space-y-2">
              <li className="flex items-center gap-2">
                <span className="bg-muted px-2 py-1 rounded text-primary font-mono">1-9</span>
                <span>Chọn màu xe</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-muted px-2 py-1 rounded text-primary font-mono">Enter</span>
                <span>Bắt đầu</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-muted px-2 py-1 rounded text-primary font-mono">Space</span>
                <span>Bắn súng 🔫</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-muted px-2 py-1 rounded text-primary font-mono">← →</span>
                <span>Lái xe</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-muted px-2 py-1 rounded text-primary font-mono">P</span>
                <span>Tạm dừng</span>
              </li>
            </ul>

            {/* Color picker */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Chọn màu xe:</p>
              <div className="grid grid-cols-3 gap-2">
                {PLAYER_COLORS.map(({ color, key }) => (
                  <button
                    key={key}
                    onClick={() => onColorChange(color)}
                    className="w-8 h-8 rounded-full border-2 border-border hover:border-primary transition-all hover:scale-110"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={onStart}
              className="mt-4 w-full bg-primary text-primary-foreground font-display py-2 rounded-lg hover:bg-primary/90 transition-all hover:scale-105 box-glow-cyan"
            >
              BẮT ĐẦU
            </button>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {gameState.isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm pointer-events-auto">
          <div className="text-center">
            <h2 className="text-4xl font-display text-accent text-glow-yellow animate-pulse-glow">
              TẠM DỪNG
            </h2>
            <p className="text-muted-foreground mt-2">Nhấn P để tiếp tục</p>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {gameState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-auto">
          <div className="text-center bg-card/90 p-8 rounded-xl neon-border">
            <h2 className="text-4xl font-display text-destructive mb-2 animate-pulse">
              GAME OVER
            </h2>
            <p className="text-xl text-foreground mb-2">
              Điểm số: <span className="text-accent font-bold">{gameState.score}</span>
            </p>
            <p className="text-muted-foreground mb-4">
              Level đạt được: {gameState.level}
            </p>
            <button
              onClick={onRestart}
              className="bg-destructive text-destructive-foreground font-display px-8 py-3 rounded-lg hover:bg-destructive/90 transition-all hover:scale-105"
            >
              CHƠI LẠI (R)
            </button>
          </div>
        </div>
      )}

      {/* Victory overlay */}
      {gameState.victory && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-auto">
          <div className="text-center bg-card/90 p-8 rounded-xl neon-border animate-float">
            <h2 className="text-3xl font-display text-accent text-glow-yellow mb-2">
              🏆 CHÚC MỪNG! 🏆
            </h2>
            <p className="text-2xl text-foreground mb-2">
              BẠN LÀ NHÀ VÔ ĐỊCH!
            </p>
            <p className="text-4xl mb-4">
              {Array(10).fill('⭐').join('')}
            </p>
            <p className="text-lg text-primary mb-4">
              Điểm cuối: <span className="text-accent font-bold">{gameState.score}</span>
            </p>
            <button
              onClick={onRestart}
              className="bg-accent text-accent-foreground font-display px-8 py-3 rounded-lg hover:bg-accent/90 transition-all hover:scale-105"
            >
              CHƠI LẠI (R)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
