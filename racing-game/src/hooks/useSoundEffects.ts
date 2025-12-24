import { useCallback, useEffect, useRef } from 'react';

// Import file từ folder sounds (đảm bảo file nằm trong src/hooks/sounds/)
import shootSound from './sounds/shoot.mp3';
import explosionSound from './sounds/explosion.mp3';
import crashSound from './sounds/crash.mp3';

export type SoundType = 'shoot' | 'explosion' | 'crash' | 'gameOver' | 'victory' | 'hit' | 'powerUp';

export const useSoundEffects = () => {
  // Lưu trữ bản gốc của âm thanh (Base Audio Elements)
  const soundsRef = useRef<Record<string, HTMLAudioElement>>({});

  // 1. Preload toàn bộ âm thanh ngay khi game load
  useEffect(() => {
    const loadAudio = (src: string) => {
      const audio = new Audio(src);
      audio.preload = 'auto'; // Bắt buộc tải trước
      audio.load();
      return audio;
    };

    soundsRef.current = {
      shoot: loadAudio(shootSound),
      explosion: loadAudio(explosionSound),
      crash: loadAudio(crashSound),
    };
  }, []);

  const playSound = useCallback((type: SoundType) => {
    let baseAudio: HTMLAudioElement | undefined;
    let volume = 1.0;
    let playbackRate = 1.0;

    // 2. Chọn file gốc và cấu hình âm lượng/tốc độ
    switch (type) {
      case 'shoot':
        baseAudio = soundsRef.current.shoot;
        volume = 0.3; 
        break;
      case 'hit':
        baseAudio = soundsRef.current.crash; // Dùng tiếng va chạm nhỏ
        volume = 0.3; 
        break;
      case 'explosion':
        baseAudio = soundsRef.current.explosion;
        volume = 0.6; 
        break;
      case 'crash':     
      case 'gameOver':  
        baseAudio = soundsRef.current.crash;
        volume = 1.0;   
        break;
      case 'victory':
        baseAudio = soundsRef.current.shoot;
        volume = 0.5;
        // Giả lập tiếng victory bằng cách chỉnh tiếng shoot (hoặc bạn thay bằng file victory.mp3)
        playbackRate = 1.5; 
        break;
      case 'powerUp':
        baseAudio = soundsRef.current.shoot;
        volume = 0.8;
        // Tiếng PowerUp cao vút
        playbackRate = 2.0; 
        break;
      default:
        baseAudio = soundsRef.current.shoot;
    }

    if (baseAudio) {
      // 3. KỸ THUẬT CLONE NODE: Tạo bản sao để phát chồng âm thanh
      const clone = baseAudio.cloneNode(true) as HTMLAudioElement;
      clone.volume = volume;
      clone.playbackRate = playbackRate;
      
      clone.play().catch(e => {
        // Bỏ qua lỗi nếu người dùng chưa tương tác (Autoplay policy)
      });

      // Xóa bản sao sau khi phát xong để giải phóng bộ nhớ
      clone.onended = () => {
        clone.remove();
      };
    }
  }, []);

  return { playSound };
};