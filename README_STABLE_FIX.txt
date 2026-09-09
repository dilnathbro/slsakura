SL Sakura Stable Fix

Replace these files in your current modular project:
- index.html
- js/core.js
- js/language.js

The included js/repair.js and js/nextlevel.js are unchanged compatibility copies.

Main fixes:
1. Restores initLanguage so core.js no longer stops at startup.
2. Loads Resources, News and Ads in one controlled Firebase request cycle.
3. Removes repeated startup retry loops that caused overlapping reads and lag.
4. Keeps all resources in memory and uses 12-at-a-time client-side Load More.
5. Search/filter no longer destroys the resource list by triggering broken cursor pagination.
6. Keeps member features visible after login through existing repair.js behavior.
7. Restricts admin UI to the configured admin UID.
8. Adds safer chatbot opening when elements are missing.

Upload the files with the same folder structure.
