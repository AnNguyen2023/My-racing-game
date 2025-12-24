import React, { useEffect } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';

const PLAYER_COLORS: Record<string, string> = {
  '1': '#FF4757',
  '2': '#FFA502',
  '3': '#FFD700',
  '4': '#2ED573',
  '5': '#00D4FF',
  '6': '#A55EEA',
  '7': '#FF6B81',
  '8': '#8B4513',
  '9': '#FFFFFF',
};

export const RacingGame: React.FC = () => {
  const {
    gameState,
    playerX,
    playerColor,
    particles,
    bullets,
    enemies,
    explosions,
    powerUps, // THÊM prop này
    shoot,
    movePlayer,
    startGame,
    togglePause,
    restartGame,
    changePlayerColor,
  } = useGameEngine();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          if (!gameState.isPlaying) startGame();
          break;
        case ' ':
          e.preventDefault();
          shoot();
          break;
        case 'ArrowLeft':
          movePlayer('left');
          break;
        case 'ArrowRight':
          movePlayer('right');
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
        case 'r':
        case 'R':
          if (gameState.gameOver || gameState.victory) restartGame();
          break;
        default:
          if (PLAYER_COLORS[e.key]) {
            changePlayerColor(PLAYER_COLORS[e.key]);
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, shoot, movePlayer, startGame, togglePause, restartGame, changePlayerColor]);

  return (
    <div className="relative">
      <div className={gameState.screenShake ? 'screen-shake' : ''}>
        <GameCanvas
          playerX={playerX}
          playerColor={playerColor}
          particles={particles}
          bullets={bullets}
          enemies={enemies}
          explosions={explosions}
          powerUps={powerUps} // Mới
          isPlaying={gameState.isPlaying}
          gameOver={gameState.gameOver}
          isPoweredUp={gameState.isPoweredUp} // Mới
        />
      </div>
      <GameUI
        gameState={gameState}
        onStart={startGame}
        onRestart={restartGame}
        onColorChange={changePlayerColor}
      />
    </div>
  );
};
