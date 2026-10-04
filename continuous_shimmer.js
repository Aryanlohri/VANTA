const fs = require('fs');

let css = fs.readFileSync('client/src/app/globals.css', 'utf8');

// 1. Change the duration from 8s to a faster continuous loop
css = css.replace('--shimmer-duration: 8s;', '--shimmer-duration: 4.5s;');

// 2. Change the easing and animation declaration
// If we want it to feel like it's moving *all the time* seamlessly, `linear` is best for a perfect infinite loop, 
// but ease-in-out can work if the offscreen gap is tight. Let's use linear so it just glides infinitely.
css = css.replace(
  'animation: metallic-shimmer var(--shimmer-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;',
  'animation: metallic-shimmer var(--shimmer-duration) linear infinite;'
);

// 3. Change the keyframes to sweep continuously without a pause
const oldKeyframes = `@keyframes metallic-shimmer {
    0% { background-position: 0% 0; }
    45% { background-position: 100% 0; }
    100% { background-position: 100% 0; }
  }`;

const newKeyframes = `@keyframes metallic-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }`;

css = css.replace(oldKeyframes, newKeyframes);

fs.writeFileSync('client/src/app/globals.css', css);
