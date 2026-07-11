import confetti from 'canvas-confetti';

export function celebrate(origin = { x: 0.5, y: 0.6 }) {
  confetti({ particleCount: 120, spread: 80, origin, zIndex: 9999 });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, zIndex: 9999 }), 200);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, zIndex: 9999 }), 200);
}

export function celebrateBig() {
  const end = Date.now() + 2000;
  const interval = setInterval(() => {
    if (Date.now() > end) { clearInterval(interval); return; }
    confetti({ particleCount: 30, spread: 120, origin: { y: 0.5 }, zIndex: 9999 });
  }, 150);
}
