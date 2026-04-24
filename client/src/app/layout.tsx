import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VANTA — AI Code Intelligence",
  description: "AI-powered code review platform. Get instant line-by-line feedback, detect bugs, security vulnerabilities, and performance issues. Built for developers who ship.",
  keywords: ["code review", "AI", "code quality", "developer tools", "GitHub", "VANTA"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <div id="vanta-loader">
          <canvas id="loader-canvas"></canvas>
        </div>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          (function () {
            const loader = document.getElementById('vanta-loader');
            const cv = document.getElementById('loader-canvas');
            if (!loader || !cv) return;
            const ctx = cv.getContext('2d');
            const DPR = window.devicePixelRatio || 1;
            const W = window.innerWidth;
            const H = window.innerHeight;
            cv.width = W * DPR;
            cv.height = H * DPR;
            cv.style.width = W + 'px';
            cv.style.height = H + 'px';
            ctx.scale(DPR, DPR);

            function ease(t) {
              // A smoother cubic ease-in-out
              return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }
            function lerp(a, b, t) { return a + (b - a) * t; }

            const lh = H * 0.28;
            const lw = lh * 0.58;
            const gap = lw * 0.28;
            const totalW = 5 * lw + 4 * gap;
            const ox = W / 2 - totalW / 2;
            const oy = H / 2 - lh / 2 - 20;

            function L(i, segs) {
              const x = ox + i * (lw + gap);
              const y = oy;
              return segs.map(s => s.map(([px, py]) => [x + px * lw, y + py * lh]));
            }

            const strokes = [
              ...L(0, [[[0,0],[0.5,1]], [[1,0],[0.5,1]]]), // V (Top-left to bottom-center, Top-right to bottom-center)
              ...L(1, [[[0,1],[0.5,0]], [[1,1],[0.5,0]], [[0.18,0.56],[0.82,0.56]]]), // A
              ...L(2, [[[0,0],[0,1]], [[0,0],[1,1]], [[1,0],[1,1]]]), // N
              ...L(3, [[[0,0],[1,0]], [[0.5,0],[0.5,1]]]), // T
              ...L(4, [[[0,1],[0.5,0]], [[1,1],[0.5,0]], [[0.18,0.56],[0.82,0.56]]]), // A
            ];

            const SD = 650, GAP = 140; // Slower stroke drawing and wider gap between letters
            const strokeEnd = SD + (strokes.length - 1) * GAP;
            const starStart = strokeEnd + 400; // Wait a bit before stars
            const shootStart = starStart + 800; // Wait before shooting star
            const totalDuration = shootStart + 1400; // Longer fade out period

            const stars = Array.from({ length: 32 }, () => ({
              x: Math.random() * W,
              y: Math.random() * H * 0.85,
              r: Math.random() * 0.8 + 0.3,
              baseAlpha: Math.random() * 0.15 + 0.05,
              phase: Math.random() * Math.PI * 2,
              litAt: starStart + Math.random() * 700,
            }));

            let shoot = { fired: false, x: 0, y: 0, vx: 0, vy: 0, tail: [], life: 1 };

            function fireShoot() {
              shoot.fired = true;
              shoot.x = W * 0.08 + Math.random() * W * 0.15;
              shoot.y = H * 0.05 + Math.random() * H * 0.12;
              const spd = 3.5 + Math.random() * 1.5; // Slower shooting star
              shoot.vx = Math.cos(Math.PI / 6) * spd;
              shoot.vy = Math.sin(Math.PI / 6) * spd;
              shoot.tail = [];
              shoot.life = 1;
            }

            let start = null;

            function frame(ts) {
              if (!start) start = ts;
              const el = ts - start;

              ctx.clearRect(0, 0, W, H);
              ctx.fillStyle = '#060606';
              ctx.fillRect(0, 0, W, H);

              // Twinkling stars
              stars.forEach(s => {
                const lit = Math.max(0, Math.min(1, (el - s.litAt) / 500)); // Slower lit up
                const twinkle = lit * (0.5 + 0.5 * Math.sin(el * 0.002 + s.phase)); // Slower twinkle
                const a = s.baseAlpha + lit * 0.45 * twinkle;
                if (a <= 0) return;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r + lit * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = \`rgba(255,255,255,\${a})\`;
                ctx.fill();
              });

              // Letter strokes
              strokes.forEach((seg, i) => {
                const delay = i * GAP;
                const raw = Math.max(0, Math.min(1, (el - delay) / SD));
                const p = ease(raw);
                if (p <= 0) return;
                const [p0, p1] = seg;
                const ex = lerp(p0[0], p1[0], p);
                const ey = lerp(p0[1], p1[1], p);
                
                ctx.beginPath();
                ctx.moveTo(p0[0], p0[1]);
                ctx.lineTo(ex, ey);
                ctx.strokeStyle = 'rgba(255,255,255,0.78)';
                ctx.lineWidth = 1.6; // Slightly thicker for smoothness
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // Draw leading glow point while stroke is drawing
                if (raw > 0 && raw < 1) {
                  ctx.beginPath();
                  ctx.arc(ex, ey, 2.0, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(255,255,255,0.95)';
                  ctx.fill();
                  ctx.shadowBlur = 8;
                  ctx.shadowColor = 'rgba(255,255,255,0.6)';
                  ctx.shadowBlur = 0; // Reset
                }
              });

              // Shooting star
              if (el >= shootStart && !shoot.fired) fireShoot();
              if (shoot.fired && shoot.life > 0) {
                shoot.tail.push({ x: shoot.x, y: shoot.y, life: 1 });
                shoot.x += shoot.vx;
                shoot.y += shoot.vy;
                shoot.life -= 0.012; // Slower fade out
                shoot.tail.forEach(p => p.life -= 0.035); // Slower tail fade
                shoot.tail = shoot.tail.filter(p => p.life > 0);
                
                // Draw tail
                shoot.tail.forEach((p, i) => {
                  const frac = i / shoot.tail.length;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, 1.0 * p.life, 0, Math.PI * 2);
                  ctx.fillStyle = \`rgba(255,255,255,\${0.55 * p.life * frac})\`;
                  ctx.fill();
                });
                
                // Draw star head
                if (shoot.life > 0) {
                  ctx.beginPath();
                  ctx.arc(shoot.x, shoot.y, 1.8, 0, Math.PI * 2);
                  ctx.fillStyle = \`rgba(255,255,255,\${shoot.life})\`;
                  ctx.fill();
                }
              }

              if (el < totalDuration) {
                requestAnimationFrame(frame);
              } else {
                if (loader) {
                  loader.style.transition = 'opacity 1.2s ease';
                  loader.classList.add('fade-out');
                }
                setTimeout(() => { if (loader) loader.remove(); }, 1200);
              }
            }

            requestAnimationFrame(frame);
          })();
        ` }} />
      </body>
    </html>
  );
}
