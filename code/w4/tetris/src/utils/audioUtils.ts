let audioContext: AudioContext | null = null;
let isMuted = false;

/**
 * 获取或创建 AudioContext
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * 播放简单的音效
 */
function playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 0.3) {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  
  // 恢复 suspended 状态
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * 播放消除行音效
 */
export function playClearLines(lines: number) {
  const baseFreq = 300 + lines * 100;
  playTone(baseFreq, 0.1, 'square', 0.2);
  setTimeout(() => playTone(baseFreq * 1.25, 0.1, 'square', 0.2), 100);
  setTimeout(() => playTone(baseFreq * 1.5, 0.15, 'square', 0.2), 200);
}

/**
 * 播放方块落地音效
 */
export function playLand() {
  playTone(150, 0.1, 'triangle', 0.3);
}

/**
 * 播放移动音效
 */
export function playMove() {
  playTone(200, 0.05, 'sine', 0.1);
}

/**
 * 播放旋转音效
 */
export function playRotate() {
  playTone(250, 0.08, 'sine', 0.15);
}

/**
 * 播放游戏结束音效
 */
export function playGameOver() {
  playTone(200, 0.3, 'sawtooth', 0.3);
  setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.3), 200);
  setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.3), 400);
}

/**
 * 播放道具激活音效
 */
export function playItem() {
  playTone(600, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.2), 100);
}

/**
 * 切换静音状态
 */
export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

/**
 * 获取当前静音状态
 */
export function getIsMuted() {
  return isMuted;
}
