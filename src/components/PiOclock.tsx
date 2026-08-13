import { useEffect, useRef } from "react";

/** Silent easter egg: 15:14 local, or Ctrl/Cmd+E. Not documented on-screen. */
export function PiOclock() {
  const lastFire = useRef(0);

  useEffect(() => {
    const fire = () => {
      const now = Date.now();
      if (now - lastFire.current < 4000) return;
      lastFire.current = now;
      celebrate();
    };

    const tick = () => {
      const d = new Date();
      if (d.getHours() === 15 && d.getMinutes() === 14 && d.getSeconds() < 2) fire();
    };

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        fire();
      }
    };

    const id = window.setInterval(tick, 1000);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}

function celebrate() {
  beep();
  burstConfetti();
}

function beep() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t0 = ctx.currentTime + i * 0.12;
    osc.start(t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
    osc.stop(t0 + 0.36);
  });
}

/** Visual-only confetti (no audio). Safe to call from quiz etc. */
export function burstConfetti() {
  const canvas = document.createElement("canvas");
  canvas.className = "pi-confetti";
  canvas.width = window.innerWidth * Math.min(devicePixelRatio, 2);
  canvas.height = window.innerHeight * Math.min(devicePixelRatio, 2);
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  const scale = canvas.width / window.innerWidth;
  const bits = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height,
    r: 3 + Math.random() * 5,
    vx: -2 + Math.random() * 4,
    vy: 3 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: -0.2 + Math.random() * 0.4,
    color: ["#e2b714", "#ff4d6d", "#01cdfe", "#05ffa1", "#fff"][Math.floor(Math.random() * 5)]!,
  }));
  let frames = 0;
  const loop = () => {
    frames += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of bits) {
      b.x += b.vx * scale;
      b.y += b.vy * scale;
      b.rot += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r);
      ctx.restore();
    }
    if (frames < 180) requestAnimationFrame(loop);
    else canvas.remove();
  };
  requestAnimationFrame(loop);
}
