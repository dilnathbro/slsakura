SL Sakura 🌸 - Japanese Language Resources
==========================================

FILE STRUCTURE
--------------
SL-Sakura/
├── index.html
├── css/
│   └── main.css
├── js/
│   ├── core.js              → Firebase, state, auth, resources, viewer, ads
│   ├── features.js          → Admin panel, CRUD, analytics, backup
│   ├── member-features.js   → Forum, blog, spaced repetition, chatbot
│   ├── nextlevel.js         → Mock tests, grammar, kanji, vocab, listening,
│   │                          reading, lesson plans, badges
│   ├── performance.js       → Lazy loading, progress bar, shortcuts, URL params
│   ├── extras.js            → Timer, dashboard, placement test, DM portal, cookies
│   ├── repair.js            → Critical bug fixes + missing functions
│   └── language.js          → i18n + onboarding
├── assets/
│   └── .gitkeep
└── README.txt

SETUP
-----
1. Extract the folder.
2. Open index.html in a browser OR deploy to any static host
   (Vercel, Netlify, GitHub Pages, Firebase Hosting).
3. Firebase Realtime Database must have rules allowing read/write
   for the paths used (see FIREBASE RULES below).

FIREBASE RULES (recommended)
----------------------------
{
  "rules": {
    "resources":       { ".read": true, ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() in ['admin','super_admin']" },
    "news":            { ".read": true, ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() in ['admin','super_admin']" },
    "advertisements":  { ".read": true, ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() in ['admin','super_admin']" },
    "settings":        { ".read": true, ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() in ['admin','super_admin']" },
    "users":           { ".read": "auth != null", ".write": "auth != null" },
    "forumPosts":      { ".read": true, ".write": "auth != null" },
    "blogPosts":       { ".read": true, ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() in ['admin','super_admin']" },
    "directMessages":  { ".read": true, ".write": true },
    "presence":        { ".read": true, ".write": true },
    "announcements":   { ".read": true, ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() in ['admin','super_admin']" }
  }
}

ADMIN SETUP
-----------
After creating your admin account, add this to Firebase DB:
  /users/{YOUR_UID}/role = "super_admin"

Then only that user can access the admin panel.

CONTACT
-------
📱 WhatsApp: 0789995159
📧 Email:    dilnathbudmina39@gmail.com

© 2026 SL Sakura 🌸
