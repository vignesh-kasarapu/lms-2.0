import confetti from 'canvas-confetti';

/** A short, tasteful confetti burst from the center of the screen — used for
 * moments worth celebrating (submitting leave, approving leave, onboarding). */
export function celebrate() {
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 45,
    origin: { y: 0.6 },
    zIndex: 9999,
    colors: ['#8b6dff', '#22d3ee', '#34d399', '#f59e0b'],
  });
}
