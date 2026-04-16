import confetti from 'canvas-confetti';

let lastFiredAt = 0;

/**
 * Fire a celebratory burst. Throttled to once every 800ms so rapid
 * state changes (e.g. multiple toasts during a settlement pass) don't
 * stack into an overwhelming shower.
 */
export function celebrate(options?: { intensity?: 'small' | 'big' }) {
  const now = Date.now();
  if (now - lastFiredAt < 800) return;
  lastFiredAt = now;

  const big = options?.intensity === 'big';
  const colors = ['#eab308', '#f59e0b', '#fde047', '#fbbf24', '#ffffff'];

  confetti({
    particleCount: big ? 140 : 80,
    spread: big ? 90 : 70,
    startVelocity: big ? 55 : 45,
    origin: { y: 0.7 },
    colors,
    scalar: big ? 1.1 : 1,
  });

  if (big) {
    // Second staggered burst for contest wins
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    }, 180);
  }
}
