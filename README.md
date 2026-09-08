# SL Sakura Modular Version

## Upload to GitHub
Upload the contents of this folder while keeping the folder structure unchanged:

- index.html
- css/main.css
- js/*.js

## Important
This conversion keeps the original JavaScript execution order to reduce the risk of breaking existing inline button handlers and Firebase code.

## Editing
- Design/styles: `css/main.css`
- Main site logic: `js/core.js`
- Existing feature logic: `js/features.js`
- Member features: `js/member-features.js`
- Next-level features: `js/nextlevel.js`
- Performance/extra patches: `js/performance.js` and `js/extras.js`

Do not rename files unless you also update the corresponding paths in `index.html`.
