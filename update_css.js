const fs = require('fs');
let content = fs.readFileSync('client/src/app/globals.css', 'utf8');

const vars = `/* ============================================
   SHIMMER TEXT TUNING VARIABLES
   ============================================
   --shimmer-base:  Base tone (darkest), matches normal text
   --shimmer-mid:   Mid tone for transition
   --shimmer-peak:  Peak highlight, below pure white so it doesn't overpower
   --shimmer-duration: Total duration of the animation loop
*/
:root {
  --shimmer-base: #7d7d7d;
  --shimmer-mid: #b4b4b4;
  --shimmer-peak: #e4e4e4;
  --shimmer-duration: 8s;
}`;

const css = `
/* Shimmer Text Effect */
.shimmer-text {
  /* Fallback color for unsupported browsers */
  color: var(--shimmer-base);
  
  /* The metallic gradient */
  background-image: linear-gradient(
    100deg,
    var(--shimmer-base) 0%,
    var(--shimmer-mid) 12.5%,
    var(--shimmer-peak) 25%,
    var(--shimmer-mid) 37.5%,
    var(--shimmer-base) 50%,
    var(--shimmer-base) 50%,
    var(--shimmer-mid) 62.5%,
    var(--shimmer-peak) 75%,
    var(--shimmer-mid) 87.5%,
    var(--shimmer-base) 100%
  );
  
  background-size: 200% 100%;
  background-position: 25% 0; /* Base position for prefers-reduced-motion */
  background-repeat: repeat-x;
  
  /* Apply clip */
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* Animation (starts paused, managed by JS) */
  animation: metallic-shimmer var(--shimmer-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
  animation-play-state: paused;
}

@keyframes metallic-shimmer {
  0% { background-position: 0% 0; }
  45% { background-position: 100% 0; }
  100% { background-position: 100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer-text {
    animation: none !important;
  }
}
`;

content = content.replace('/* ============================================', vars + '\n\n/* ============================================');
content = content + '\n\n' + css;

fs.writeFileSync('client/src/app/globals.css', content);
