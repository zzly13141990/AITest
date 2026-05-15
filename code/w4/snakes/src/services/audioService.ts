class AudioService {
  private audioContext: AudioContext | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private musicEnabled: boolean = true;
  private soundEnabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // 尝试初始化AudioContext（需要用户交互）
    document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
    document.addEventListener('keydown', this.initAudioContext.bind(this), { once: true });
  }

  private initAudioContext(): void {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    }
  }

  setConfig(musicEnabled: boolean, soundEnabled: boolean, volume: number = 0.5): void {
    this.musicEnabled = musicEnabled;
    this.soundEnabled = soundEnabled;
    this.volume = volume;

    if (!musicEnabled && this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  // 播放背景音乐
  playBackgroundMusic(): void {
    if (!this.musicEnabled) return;
    
    // 使用简单的合成音乐替代外部文件
    if (this.audioContext) {
      this.playSynthesizedMusic();
    }
  }

  private playSynthesizedMusic(): void {
    if (!this.audioContext) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // 简单的循环旋律
    const notes = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
    const duration = 0.4;
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.1 * this.volume, now + i * duration);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * duration + duration);
      
      osc.start(now + i * duration);
      osc.stop(now + i * duration + duration);
    });
  }

  pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  // 用Web Audio API播放音效
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.soundEnabled || !this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.3 * this.volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  // 吃普通食物音效
  playEatFood(): void {
    this.playTone(523.25, 0.1, 'sine'); // C5
  }

  // 吃毒药音效
  playEatPoison(): void {
    this.playTone(200, 0.3, 'sawtooth');
  }

  // 撞墙/死亡音效
  playDeath(): void {
    this.playTone(100, 0.5, 'square');
  }

  // 关卡切换音效
  playLevelUp(): void {
    this.playTone(880, 0.15, 'sine'); // A5
    setTimeout(() => this.playTone(1046.5, 0.15, 'sine'), 100); // C6
  }

  // 得分提示音效
  playScore(): void {
    this.playTone(659.25, 0.1, 'triangle'); // E5
  }

  // 成就解锁音效
  playAchievementUnlock(): void {
    this.playTone(784, 0.2, 'sine'); // G5
    setTimeout(() => this.playTone(988, 0.2, 'sine'), 100); // B5
    setTimeout(() => this.playTone(1175, 0.3, 'sine'), 200); // D6
  }
}

export const audioService = new AudioService();
