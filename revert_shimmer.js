const fs = require('fs');
let css = fs.readFileSync('client/src/app/globals.css', 'utf8');

// Revert Shimmer Tokens to the original sophisticated metallic spec
css = css.replace('--shimmer-dark: #616161;', '--shimmer-dark: #7d7d7d;');
css = css.replace('--shimmer-peak: #ffffff;', '--shimmer-peak: #e4e4e4;');

fs.writeFileSync('client/src/app/globals.css', css);
