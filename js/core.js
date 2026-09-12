/* ============================================================
   SL Sakura — core.js
   Firebase, state, helpers, theme, auth, streak, resources,
   viewer, media, ads, news, analytics skeleton.
   ============================================================ */

/* ---------- Firebase ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyDG4imqIshK4-vhzGZt7eek1oAgjdJF550",
  authDomain: "sl-sakura.firebaseapp.com",
  projectId: "sl-sakura",
  storageBucket: "sl-sakura.firebasestorage.app",
  messagingSenderId: "163142157440",
  appId: "1:163142157440:web:b81c4dc806a77336a49265",
  measurementId: "G-GRTPY0T1KH",
  databaseURL: "https://sl-sakura-default-rtdb.asia-southeast1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

/* ---------- Admin whitelist (fallback if role not in DB) ---------- */
const ADMIN_EMAILS = [
  "dilnathbudmina39@gmail.com"
];

/* ---------- Global state ---------- */
const state = {
  resources: [],
  news: [],
  advertisements: [],
  selectedMain: "ALL",
  selectedSub: "All",
  searchQuery: "",
  selectedResource: null,
  countdownTimer: null,
  adminLoggedIn: false,
  adminRole: null,
  coffeeUrl: "",
  visibleCount: 12,
  resourceSort: "newest",
  pdfDoc: null,
  pdfPageNum: 1,
  pdfScale: 1.0,
  pdfTotalPages: 0,
  pdfRendering: false,
  currentResourceId: null,
  selectedResources: new Set(),
  editingResourceId: null,
  adminTab: "resources",
  viewTracked: new Set(),
  favorites: [],
  shareUrl: "",
  shareTitle: "",
  quizzes: [],
  flashcards: [],
  streak: 0,
  lastStreakDate: null,
  editingQuizId: null,
  editingFlashcardId: null,
  leaderboard: [],
  mockTests: [],
  vocabulary: [],
  grammar: [],
  kanji: [],
  listening: [],
  reading: [],
  lessonPlans: [],
  badges: [],
  forumPosts: [],
  blogPosts: [],
  reviewItems: []
};

/* ---------- Pagination state ---------- */
const pagination = {
  lastKey: null,
  hasMore: true,
  isLoading: false,
  pageSize: 12,
  loadedCount: 0
};

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);

function escapeHtml(v){
  if(v == null) return "";
  return String(v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function safeUrl(url){
  if(!url) return "#";
  try{
    const u = new URL(url, location.href);
    if(u.protocol === "https:" || u.protocol === "http:") return u.href;
  }catch(e){}
  return "#";
}

function showToast(msg, err = false){
  const t = $("toast"); if(!t) return;
  t.textContent = msg;
  t.style.borderColor = err ? "rgba(239,68,68,.4)" : "rgba(244,63,94,.20)";
  t.style.background  = err ? "rgba(30,5,10,.95)" : "#160509";
  t.classList.remove("hidden");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.add("hidden"), 3000);
}

function showLoading(id){ const e = $(id); if(e) e.classList.remove("hidden"); }
function hideLoading(id){ const e = $(id); if(e) e.classList.add("hidden"); }

function isGoogleDriveUrl(u){ return u && u.includes("drive.google.com"); }
function isYouTubeUrl(u){ return u && (u.includes("youtube.com") || u.includes("youtu.be")); }

function getGoogleDriveFileId(url){
  if(!url) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([^\/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?export=view&id=([^&]+)/,
    /drive\.google\.com\/uc\?export=download&id=([^&]+)/,
    /\/d\/([^\/]+)\//,
    /id=([^&]+)/
  ];
  for(const p of patterns){ const m = url.match(p); if(m) return m[1]; }
  return null;
}

function getGoogleDriveDirectUrl(url){
  const id = getGoogleDriveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

function getYouTubeId(url){
  if(!url) return null;
  try{
    const p = new URL(url);
    const h = p.hostname.replace("www.","").toLowerCase();
    if(h === "youtube.com" || h === "m.youtube.com"){
      const v = p.searchParams.get("v");
      if(v) return v;
      if(p.pathname.startsWith("/embed/") || p.pathname.startsWith("/shorts/")){
        return p.pathname.split("/")[2]?.split("?")[0] || null;
      }
    }
    if(h === "youtu.be") return p.pathname.substring(1).split("/")[0] || null;
  }catch(e){}
  return null;
}

function getCurrentShareUrl(){
  const id = state.currentResourceId;
  if(id) return window.location.origin + window.location.pathname + "?resource=" + id;
  return window.location.href;
}

function getCurrentShareTitle(){
  const r = state.selectedResource;
  if(r) return "SL Sakura - " + r.title;
  return "SL Sakura 🌸 - Japanese Language Resources";
}

/* Safe UUID */
function safeUUID(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,10);
}

/* ---------- Theme ---------- */
function applyTheme(t){
  if(t === "light"){
    document.documentElement.setAttribute("data-theme","light");
    const i = $("themeToggleIcon"); if(i) i.className = "fa-solid fa-moon";
  }else{
    document.documentElement.removeAttribute("data-theme");
    const i = $("themeToggleIcon"); if(i) i.className = "fa-solid fa-sun";
  }
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const next = cur === "light" ? "dark" : "light";
  applyTheme(next);
  try{ localStorage.setItem("slSakuraTheme", next); }catch(e){}
}
function initTheme(){
  try{ applyTheme(localStorage.getItem("slSakuraTheme") || "dark"); }
  catch(e){ applyTheme("dark"); }
}

/* ---------- Sakura ---------- */
function createSakura(){
  const layer = $("sakuraLayer"); if(!layer || layer.dataset.ready === "1") return;
  layer.dataset.ready = "1";
  const count = window.innerWidth <= 768 ? 8 : 14;
  const frag = document.createDocumentFragment();
  for(let i=0; i<count; i++){
    const p = document.createElement("div");
    p.className = "sakura";
    p.textContent = "🌸";
    p.style.left = Math.random()*100 + "%";
    p.style.fontSize = (8 + Math.random()*12) + "px";
    p.style.animationDuration = (10 + Math.random()*12) + "s";
    p.style.animationDelay = Math.random()*8 + "s";
    p.style.opacity = 0.35 + Math.random()*0.35;
    frag.appendChild(p);
  }
  layer.appendChild(frag);
}

/* ---------- Menu / contact ---------- */
function openMenu(){ $("sideMenu").classList.remove("drawer-hidden"); $("menuOverlay").classList.remove("hidden"); }
function closeMenu(){ $("sideMenu").classList.add("drawer-hidden"); $("menuOverlay").classList.add("hidden"); }
function menuSearch(){ closeMenu(); openSearch(); }
function menuResources(){ closeMenu(); $("resourcesSection").scrollIntoView({behavior:"smooth"}); }
function menuNews(){ closeMenu(); $("newsSection").scrollIntoView({behavior:"smooth"}); }

function openContact(){ const m = $("contactModal"); m.classList.remove("hidden"); m.classList.add("flex"); }
function closeContact(){ const m = $("contactModal"); m.classList.add("hidden"); m.classList.remove("flex"); }

/* ---------- Auth ---------- */
function toggleUserMenu(){ $("userMenu").classList.toggle("hidden"); }

function openLoginModal(){
  $("userMenu").classList.add("hidden");
  const m = $("loginModal"); m.classList.remove("hidden"); m.classList.add("flex");
}
function closeLoginModal(){
  const m = $("loginModal"); m.classList.add("hidden"); m.classList.remove("flex");
}

function loginUser(){
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  if(!email || !password){ showToast("Enter email and password", true); return; }
  auth.signInWithEmailAndPassword(email, password)
    .then(() => { closeLoginModal(); showToast("Welcome back! 🌸"); })
    .catch(e => showToast(e.message, true));
}

function signupUser(){
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  if(!email || !password){ showToast("Enter email and password", true); return; }
  if(password.length < 6){ showToast("Password must be at least 6 characters", true); return; }
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => { closeLoginModal(); showToast("Account created! Welcome 🌸"); })
    .catch(e => showToast(e.message, true));
}

function googleLogin(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => { closeLoginModal(); showToast("Welcome! 🌸"); })
    .catch(e => showToast(e.message, true));
}

function logoutUser(){
  auth.signOut().then(() => { showToast("Logged out"); $("userMenu").classList.add("hidden"); });
}

/* ---------- Admin auth (SECURE) ---------- */
async function resolveAdminRole(user){
  if(!user) return null;
  // Fallback: email whitelist
  if(ADMIN_EMAILS.includes((user.email || "").toLowerCase())) return "super_admin";
  try{
    const snap = await db.ref("users/" + user.uid + "/role").once("value");
    const role = snap.val();
    if(role && ["super_admin","admin","moderator","editor"].includes(role)) return role;
  }catch(e){}
  return null;
}

/* ---------- Single auth state handler ---------- */
let _authBootstrapped = false;
auth.onAuthStateChanged(async user => {
  // Update UI
  updateUserUI(user);
  updateLoginFeatures(user);

  // Resolve admin role
  if(user){
    state.adminRole = await resolveAdminRole(user);
    state.adminLoggedIn = !!state.adminRole;
    if(state.adminRole){
      const btn = $("adminAccessBtn"); if(btn) btn.classList.remove("hidden");
    }else{
      const btn = $("adminAccessBtn"); if(btn) btn.classList.add("hidden");
    }
  }else{
    state.adminRole = null;
    state.adminLoggedIn = false;
    const panel = $("adminPanel"); if(panel) panel.classList.add("hidden");
    const btn = $("adminAccessBtn"); if(btn) btn.classList.add("hidden");
  }

  // First load
  if(!_authBootstrapped){
    _authBootstrapped = true;
    loadResourcesPaginated(false);
    loadNewsAndAds();
    handleUrlParams();
    if(window.loadLiveQuizGame) window.loadLiveQuizGame();
    if(window.loadAdsterraSettings) window.loadAdsterraSettings();
  }
});

function updateUserUI(user){
  const info = $("userInfo");
  const loginBtn = $("loginBtn");
  const logoutBtn = $("logoutBtn");
  const userIcon = $("userIcon");
  if(!info) return;

  if(user){
    info.innerHTML =
      `<div class="font-bold text-white">${escapeHtml(user.displayName || user.email || "User")}</div>
       <div class="text-xs text-gray-400">${escapeHtml(user.email || "")}</div>`;
    if(loginBtn) loginBtn.classList.add("hidden");
    if(logoutBtn) logoutBtn.classList.remove("hidden");
    if(userIcon) userIcon.className = "fa-solid fa-user-check";
    updateStreak();
    loadFavorites();
    updateUserDashboard();
  }else{
    info.innerHTML =
      `<div class="font-bold text-white" data-lang="guest">Guest</div>
       <div class="text-xs text-gray-400" data-lang="notLoggedIn">Not logged in</div>`;
    if(loginBtn) loginBtn.classList.remove("hidden");
    if(logoutBtn) logoutBtn.classList.add("hidden");
    if(userIcon) userIcon.className = "fa-solid fa-user";
    const s = $("streakDisplay"); if(s) s.classList.add("hidden");
  }
}

function updateLoginFeatures(user){
  const loginFeatures = $("loginFeatures");
  const userDashboard = $("userDashboard");
  if(user){
    if(loginFeatures) loginFeatures.classList.add("hidden");
    if(userDashboard) userDashboard.classList.remove("hidden");
    updateUserDashboard();
  }else{
    if(loginFeatures) loginFeatures.classList.remove("hidden");
    if(userDashboard) userDashboard.classList.add("hidden");
  }
}

function updateUserDashboard(){
  const user = auth.currentUser; if(!user) return;
  const nameEl = $("userDisplayName"), emailEl = $("userEmail");
  if(nameEl) nameEl.textContent = user.displayName || user.email || "User";
  if(emailEl) emailEl.textContent = user.email || "";

  db.ref("users/" + user.uid).once("value").then(snap => {
    const data = snap.val() || {};
    const set = (id, v) => { const el = $(id); if(el) el.textContent = v; };
    set("userStreak", (data.streak && data.streak.count) || 0);
    set("userFavorites", (data.favorites || []).length);
    set("userViewed", data.viewedCount || 0);
    set("userBadges", (data.badges || []).length);
  }).catch(() => {});
}

/* ---------- Streak (writes only once per day) ---------- */
function updateStreak(){
  const user = auth.currentUser;
  if(!user){ const s = $("streakDisplay"); if(s) s.classList.add("hidden"); return; }
  const userRef = db.ref("users/" + user.uid + "/streak");
  userRef.once("value").then(snap => {
    const data = snap.val() || {};
    const today = new Date().toDateString();
    const lastDate = data.lastDate || "";
    let streak = data.count || 0;
    if(lastDate === today){ /* no change */ }
    else if(lastDate === new Date(Date.now() - 86400000).toDateString()) streak++;
    else streak = 1;

    // Only write if changed
    if(lastDate !== today){
      userRef.set({ count: streak, lastDate: today, updatedAt: Date.now() }).catch(() => {});
    }
    state.streak = streak;
    state.lastStreakDate = today;

    const display = $("streakDisplay"), count = $("streakCount");
    if(display) display.classList.remove("hidden");
    if(count) count.textContent = streak;
    updateStreakAnalytics();
  }).catch(() => {});
}

function updateStreakAnalytics(){
  const c = $("streakAnalyticsCount"); if(c) c.textContent = state.streak || 0;
  const dots = $("streakDots"); if(!dots) return;
  const streak = state.streak || 0;
  const maxDots = Math.min(streak, 30);
  let html = "";
  for(let i=0; i<maxDots; i++){
    const isToday = i === maxDots - 1;
    html += `<span class="streak-dot active ${isToday ? "today" : ""}"></span>`;
  }
  if(streak > 30) html += `<span class="text-xs text-rose-100/30">+${streak-30} more</span>`;
  dots.innerHTML = html || '<span class="text-xs text-rose-100/30">Start your streak today! 🔥</span>';
}

/* ---------- Leaderboard (fetches once, not on every page load) ---------- */
let _leaderboardLoaded = false;
function updateLeaderboard(force = false){
  if(_leaderboardLoaded && !force) return;
  db.ref("users").once("value").then(snapshot => {
    const users = snapshot.val() || {};
    const list = [];
    for(const [uid, data] of Object.entries(users)){
      if(data && data.streak){
        list.push({
          uid,
          name: data.displayName || data.email || "User",
          streak: data.streak.count || 0
        });
      }
    }
    list.sort((a,b) => b.streak - a.streak);
    state.leaderboard = list.slice(0, 50);
    _leaderboardLoaded = true;
    renderLeaderboard();
  }).catch(() => {});
}

function openLeaderboard(){
  const m = $("leaderboardModal"); m.classList.remove("hidden"); m.classList.add("flex");
  updateLeaderboard(true);
  renderLeaderboard();
}
function closeLeaderboard(){
  const m = $("leaderboardModal"); m.classList.add("hidden"); m.classList.remove("flex");
}
function renderLeaderboard(){
  const container = $("leaderboardContainer"); if(!container) return;
  if(!state.leaderboard.length){
    container.innerHTML = `
      <div class="text-center p-8">
        <div class="text-4xl mb-4">🏆</div>
        <h3 class="text-xl font-black text-white">No leaderboard data yet</h3>
        <p class="text-gray-400 mt-2">Start studying and build your streak to appear here!</p>
      </div>`;
    return;
  }
  const currentUser = auth.currentUser;
  container.innerHTML = `
    <div class="space-y-2">
      ${state.leaderboard.map((u, i) => {
        const cls = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
        const isMe = currentUser && u.uid === currentUser.uid;
        return `
          <div class="leaderboard-item ${isMe ? "border-rose-500/30 bg-rose-500/5" : ""}">
            <span class="rank ${cls}">${i+1}</span>
            <div class="flex-1">
              <div class="font-bold text-sm text-white">${escapeHtml(u.name)} ${isMe ? "👈" : ""}</div>
              <div class="text-xs text-gray-400">🔥 ${u.streak} day streak</div>
            </div>
            <div class="text-rose-400 font-bold">${u.streak}</div>
          </div>`;
      }).join("")}
    </div>
    <div class="mt-4 glass rounded-2xl p-3 text-center">
      <span class="text-sm text-gray-400">${currentUser ? "Your streak: 🔥 " + (state.streak||0) + " days" : "Login to join the leaderboard!"}</span>
    </div>`;
}

/* ---------- Favorites ---------- */
function loadFavorites(){
  const user = auth.currentUser; if(!user) return;
  db.ref("users/" + user.uid + "/favorites").once("value").then(snap => {
    state.favorites = snap.val() || [];
  }).catch(() => {});
}
function openFavorites(){
  $("userMenu").classList.add("hidden");
  if(!auth.currentUser){ showToast("Please login to view favorites", true); openLoginModal(); return; }
  showToast("❤️ " + state.favorites.length + " favorites");
  renderResources();
}

/* ---------- Share ---------- */
function openShareWindow(url){ window.open(url, "_blank", "width=600,height=400,scrollbars=yes"); }
function shareOnFacebook(){ openShareWindow("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(getCurrentShareUrl())); }
function shareOnTwitter(){ openShareWindow("https://twitter.com/intent/tweet?text=" + encodeURIComponent(getCurrentShareTitle()) + "&url=" + encodeURIComponent(getCurrentShareUrl())); }
function shareOnWhatsApp(){ openShareWindow("https://wa.me/?text=" + encodeURIComponent(getCurrentShareTitle() + "\n" + getCurrentShareUrl())); }
function shareOnLinkedIn(){ openShareWindow("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(getCurrentShareUrl())); }
function shareOnTelegram(){ openShareWindow("https://t.me/share/url?url=" + encodeURIComponent(getCurrentShareUrl()) + "&text=" + encodeURIComponent(getCurrentShareTitle())); }
function shareViaEmail(){ openShareWindow("mailto:?subject=" + encodeURIComponent(getCurrentShareTitle()) + "&body=" + encodeURIComponent("Check this out: " + getCurrentShareUrl())); }
function copyCurrentLink(){
  const url = getCurrentShareUrl();
  if(navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast("✅ Link copied!")).catch(() => fallbackCopy(url));
  else fallbackCopy(url);
}
function fallbackCopy(text){
  const inp = document.createElement("input"); inp.value = text;
  document.body.appendChild(inp); inp.select(); document.execCommand("copy");
  document.body.removeChild(inp); showToast("✅ Link copied!");
}

function scrollToTop(){ window.scrollTo({top:0, behavior:"smooth"}); }
function openSearch(){
  $("searchSection").scrollIntoView({behavior:"smooth", block:"center"});
  setTimeout(() => $("resourceSearch") && $("resourceSearch").focus(), 500);
}

/* ---------- Categories ---------- */
const categorySubs = {
  N5:["All","Grammar","Kanji","Vocabulary","Choukai","Past Papers"],
  N4:["All","Grammar","Kanji","Vocabulary","Choukai","Past Papers"],
  N3:["All","Grammar","Kanji","Vocabulary","Choukai","Past Papers"],
  N2:["All","Grammar","Kanji","Vocabulary","Choukai","Past Papers"],
  N1:["All","Grammar","Kanji","Vocabulary","Choukai","Past Papers"],
  SSW:["All","Food Service","Nursing Care","Agriculture","Hospitality/Hotel"],
  CLASSES:["All","Lecturer Wise Filter","Grammar Tutorials","Live Class Recordings","Exam Preparation"],
  "SURVIVAL GUIDE":["All","Visa & CoE","Part-Time Jobs (Arubaito)","Bank & SIM Cards","Garbage & Rules"]
};
const mainCategories = ["ALL","N5","N4","N3","N2","N1","SSW","CLASSES","SURVIVAL GUIDE"];

/* ---------- Tabs ---------- */
function renderMainTabs(){
  const icons = {
    "ALL":"fa-solid fa-layer-group","N5":"fa-solid fa-1","N4":"fa-solid fa-2","N3":"fa-solid fa-3",
    "N2":"fa-solid fa-4","N1":"fa-solid fa-5","SSW":"fa-solid fa-briefcase",
    "CLASSES":"fa-solid fa-chalkboard-user","SURVIVAL GUIDE":"fa-solid fa-compass"
  };
  const el = $("mainTabs"); if(!el) return;
  el.innerHTML = mainCategories.map(c => {
    const a = state.selectedMain === c ? "tab-active" : "";
    const cnt = c === "ALL" ? state.resources.length : state.resources.filter(r => r.mainCategory === c).length;
    const icon = icons[c] || "fa-solid fa-tag";
    return `<button onclick="selectMain('${c}')" class="shrink-0 rounded-xl border border-rose-500/15 bg-white/5 px-4 py-2 text-xs font-black text-rose-100/70 ${a}">
      <i class="${icon} mr-1"></i> ${c} <span class="text-rose-100/40">(${cnt})</span></button>`;
  }).join("");
}
function selectMain(c){ state.selectedMain = c; state.selectedSub = "All"; state.visibleCount = 12; renderMainTabs(); renderSubTabs(); renderResources(); }

function renderSubTabs(){
  const el = $("subTabs"); if(!el) return;
  if(state.selectedMain === "ALL"){ el.innerHTML = ""; return; }
  const subs = categorySubs[state.selectedMain] || ["All"];
  const icons = {
    "All":"fa-solid fa-list","Grammar":"fa-solid fa-book-open","Kanji":"fa-solid fa-pen",
    "Vocabulary":"fa-solid fa-language","Choukai":"fa-solid fa-headphones","Past Papers":"fa-solid fa-file-pdf",
    "Food Service":"fa-solid fa-utensils","Nursing Care":"fa-solid fa-heart-pulse","Agriculture":"fa-solid fa-seedling",
    "Hospitality/Hotel":"fa-solid fa-hotel","Lecturer Wise Filter":"fa-solid fa-user-tie",
    "Grammar Tutorials":"fa-solid fa-chalkboard","Live Class Recordings":"fa-solid fa-video",
    "Exam Preparation":"fa-solid fa-graduation-cap","Visa & CoE":"fa-solid fa-passport",
    "Part-Time Jobs (Arubaito)":"fa-solid fa-briefcase","Bank & SIM Cards":"fa-solid fa-credit-card",
    "Garbage & Rules":"fa-solid fa-trash"
  };
  el.innerHTML = subs.map(s => {
    const a = state.selectedSub === s ? "tab-active" : "";
    const cnt = s === "All"
      ? state.resources.filter(r => r.mainCategory === state.selectedMain).length
      : state.resources.filter(r => r.mainCategory === state.selectedMain && r.subCategory === s).length;
    const icon = icons[s] || "fa-solid fa-tag";
    return `<button onclick="selectSub('${escapeHtml(s)}')" class="rounded-full border border-rose-500/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-rose-100/60 ${a}">
      <i class="${icon} mr-1"></i> ${escapeHtml(s)} <span class="text-rose-100/40">(${cnt})</span></button>`;
  }).join("");
}
function selectSub(s){ state.selectedSub = s; state.visibleCount = 12; renderSubTabs(); renderResources(); }

/* ---------- Resources: single load path with pagination ---------- */
function loadResourcesPaginated(append = false){
  if(pagination.isLoading) return;
  if(!append){
    pagination.lastKey = null;
    pagination.hasMore = true;
    pagination.loadedCount = 0;
    state.resources = [];
    state.visibleCount = 12;
  }
  if(!pagination.hasMore && append){
    showToast("✅ All resources loaded");
    const btn = $("loadMoreBtn");
    if(btn){ btn.disabled = true; btn.innerHTML = "✅ All loaded"; }
    return;
  }

  pagination.isLoading = true;
  showLoading("resourceLoading");

  const btn = $("loadMoreBtn");
  if(btn){ btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading...'; }

  // Order descending by createdAt (newest first)
  let query = db.ref("resources").orderByChild("createdAt").limitToLast(pagination.pageSize + 1);
  if(pagination.lastKey){
    // When going forward we must use endAt for descending order
    query = db.ref("resources").orderByChild("createdAt").endBefore(pagination.lastKey).limitToLast(pagination.pageSize + 1);
  }

  query.once("value").then(snap => {
    const data = snap.val() || {};
    const entries = Object.entries(data);
    const hasMore = entries.length > pagination.pageSize;
    const items = hasMore ? entries.slice(entries.length - pagination.pageSize) : entries;

    if(items.length){
      // Save the earliest createdAt we've loaded so far (for the next endBefore)
      pagination.lastKey = items[0][1].createdAt || 0;
    }

    pagination.hasMore = hasMore;
    const newRes = items.map(([id, value]) => ({ id, ...value }));

    // Sort descending to display
    newRes.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

    state.resources = append ? [...state.resources, ...newRes] : newRes;
    pagination.loadedCount = state.resources.length;
    pagination.isLoading = false;
    hideLoading("resourceLoading");

    if(btn) btn.disabled = false;
    renderMainTabs(); renderSubTabs(); renderResources();
    if(state.adminLoggedIn) renderAdminLists();
    updateAnalytics();

    if(!pagination.hasMore){
      if(btn){ btn.innerHTML = "✅ All loaded"; btn.disabled = true; }
    }
  }).catch(err => {
    console.error("Pagination error:", err);
    pagination.isLoading = false;
    hideLoading("resourceLoading");
    if(btn){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i> Retry'; }
    showToast("❌ Failed to load resources", true);
  });
}

function loadMoreResources(){
  if(pagination.isLoading) return;
  if(!pagination.hasMore){
    showToast("✅ All resources loaded");
    const btn = $("loadMoreBtn");
    if(btn){ btn.disabled = true; btn.innerHTML = "✅ All loaded"; }
    return;
  }
  state.visibleCount += 12;
  loadResourcesPaginated(true);
}

/* ---------- Filtering / sorting ---------- */
function getFilteredResources(){
  const q = state.searchQuery.trim().toLowerCase();
  const filtered = state.resources.filter(r => {
    const m = state.selectedMain === "ALL" || r.mainCategory === state.selectedMain;
    const sub = state.selectedSub === "All" || r.subCategory === state.selectedSub;
    const txt = [r.title, r.lecturer, r.mainCategory, r.subCategory, r.description].filter(Boolean).join(" ").toLowerCase();
    const search = !q || txt.includes(q);
    return m && sub && search;
  });
  return filtered.sort((a,b) => {
    if(state.resourceSort === "popular") return (b.viewCount||0) - (a.viewCount||0);
    if(state.resourceSort === "title") return String(a.title||"").localeCompare(String(b.title||""));
    return (b.createdAt||b.updatedAt||0) - (a.createdAt||a.updatedAt||0);
  });
}
function changeResourceSort(v){ state.resourceSort = v || "newest"; state.visibleCount = 12; renderResources(); }

/* ---------- Render resources ---------- */
function renderResources(){
  const full = getFilteredResources();
  const list = full.slice(0, state.visibleCount);

  const countText = $("resourceCountText");
  if(countText) countText.textContent = `${full.length} resources`;

  if(!full.length && !pagination.isLoading){
    $("resourceGrid").innerHTML = `
      <div class="glass col-span-full rounded-3xl p-8 text-center">
        <div class="text-4xl mb-3">📚</div>
        <div class="mt-3 font-black text-xl text-white">No resources available yet</div>
        <div class="mt-2 text-sm text-gray-400">Try another category or search term.</div>
        <button onclick="loadResourcesPaginated(false)" class="rose-btn mt-4 px-6 py-2 text-sm"><i class="fa-solid fa-rotate mr-2"></i> Refresh</button>
      </div>`;
    $("loadMoreWrap").classList.add("hidden");
    renderAds();
    return;
  }

  const iconMap = { pdf:"fa-regular fa-file-pdf", audio:"fa-solid fa-music", video:"fa-solid fa-video", youtube:"fa-brands fa-youtube" };
  let html = "";
  for(const r of list){
    const isClass = r.mainCategory === "CLASSES";
    const thumb = r.thumbnailUrl ? safeUrl(r.thumbnailUrl) : "";
    const hasThumb = thumb && thumb !== "#";
    const isSelected = state.selectedResources.has(r.id);
    const icon = iconMap[r.mediaType] || "fa-regular fa-file";
    const adminBulk = state.adminLoggedIn
      ? `<div class="absolute top-3 left-3 z-10 flex gap-1"><input type="checkbox" class="bulk-checkbox" ${isSelected ? "checked":""} onchange="toggleBulk('${r.id}')" /></div>`
      : "";
    const thumbHtml = hasThumb
      ? `<div class="resource-thumb-wrap"><img src="${thumb}" alt="${escapeHtml(r.title||"Resource")}" loading="lazy" onerror="this.parentElement.outerHTML='<div class=\\'resource-thumb-placeholder\\'><i class=\\'${icon}\\'></i></div>'"></div>`
      : `<div class="resource-thumb-placeholder"><i class="${icon}"></i></div>`;

    html += `
      <div class="resource-card">
        ${adminBulk}
        <span class="media-badge"><i class="${icon}"></i></span>
        ${thumbHtml}
        <div class="p-4">
          <h3 class="font-black leading-6 break-words text-white">${escapeHtml(r.title || "Untitled")}</h3>
          <div class="mt-1 text-xs text-gray-400">${escapeHtml(r.subCategory || "All")}</div>
          ${r.description ? `<p class="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">${escapeHtml(r.description)}</p>` : ""}
          ${r.lecturer ? `<div class="mt-2 text-sm font-bold text-rose-100/75">👨‍🏫 ${escapeHtml(r.lecturer)}</div>` : ""}
          <div class="mt-2 flex items-center justify-between gap-3 text-xs text-rose-100/40">
            <span><i class="fa-regular fa-eye mr-1"></i>${r.viewCount||0} views</span>
          </div>
          ${isClass ? `<a href="https://wa.me/${(r.lecturerContact||"94789995159").replace(/^0/,"94")}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center rounded-xl bg-green-500/10 px-3 py-1.5 text-[11px] font-bold text-green-300 hover:bg-green-500/20 transition"><i class="fa-brands fa-whatsapp mr-1"></i>${escapeHtml(r.lecturerContact||"0789995159")}</a>` : ""}
          <button onclick="openResource('${r.id}')" class="rose-btn mt-3 w-full rounded-2xl px-4 py-2.5 text-sm font-black text-white"><i class="fa-solid fa-eye mr-2"></i> View Resource</button>
        </div>
      </div>`;
  }
  $("resourceGrid").innerHTML = html;

  const shown = Math.min(state.visibleCount, full.length);
  const remaining = full.length - shown;
  const statusEl = $("loadMoreStatus");
  if(statusEl){
    if(remaining > 0) statusEl.textContent = `Showing ${shown} of ${full.length} resources • ${remaining} remaining`;
    else statusEl.textContent = `✅ All ${full.length} resources loaded`;
  }

  const wrap = $("loadMoreWrap"), btn = $("loadMoreBtn");
  if(remaining > 0 && pagination.hasMore){
    wrap.classList.remove("hidden"); wrap.classList.add("flex");
    btn.innerHTML = `<i class="fa-solid fa-plus mr-2"></i> Load ${Math.min(12, remaining)} More`;
    btn.disabled = false;
  }else if(remaining === 0 || !pagination.hasMore){
    wrap.classList.add("hidden"); wrap.classList.remove("flex");
  }
  renderAds();
}

/* ---------- Bulk select ---------- */
function toggleBulk(id){ state.selectedResources.has(id) ? state.selectedResources.delete(id) : state.selectedResources.add(id); renderResources(); }
function selectAllResources(){ getFilteredResources().forEach(r => state.selectedResources.add(r.id)); renderResources(); }
function clearBulkSelection(){ state.selectedResources.clear(); renderResources(); }
function bulkDelete(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  if(!state.selectedResources.size){ showToast("No resources selected", true); return; }
  if(!confirm(`Delete ${state.selectedResources.size} resources?`)) return;
  Promise.all([...state.selectedResources].map(id => db.ref("resources/" + id).remove()))
    .then(() => { showToast(`${state.selectedResources.size} resources deleted`); state.selectedResources.clear(); loadResourcesPaginated(false); if(state.adminLoggedIn) renderAdminLists(); })
    .catch(() => showToast("Error deleting", true));
}

/* ---------- Resource viewer ---------- */
function openResource(id){
  const r = state.resources.find(x => x.id === id);
  if(!r){ showToast("Resource not found", true); return; }
  state.selectedResource = r; state.currentResourceId = id;
  trackView(id);

  $("homePage").classList.add("hidden");
  $("viewerPage").classList.remove("hidden");
  $("viewerTitle").textContent = r.title || "Resource";
  $("viewerCategory").textContent = `${r.mainCategory||""} • ${r.subCategory||""}`;
  $("viewerLecturer").textContent = r.lecturer ? `Lecturer: ${r.lecturer}` : "";
  $("viewCountDisplay").textContent = r.viewCount || 0;

  const cb = $("viewerContactBtn");
  if(r.mainCategory === "CLASSES"){
    const num = r.lecturerContact || "0789995159";
    cb.href = `https://wa.me/${num.replace(/^0/,"94")}`;
    cb.innerHTML = `<i class="fa-brands fa-whatsapp mr-1"></i> ${escapeHtml(num)}`;
    cb.classList.remove("hidden");
  }else cb.classList.add("hidden");

  renderMedia(r);
  renderAds();
  startCountdown();
  window.scrollTo({top:0, behavior:"smooth"});
}
function goHome(){
  clearInterval(state.countdownTimer);
  state.selectedResource = null; state.currentResourceId = null;
  $("viewerPage").classList.add("hidden");
  $("homePage").classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
  if(window.location.search.includes("resource=")){
    const url = new URL(window.location);
    url.searchParams.delete("resource");
    history.replaceState(null, "", url);
  }
}
function trackView(id){
  if(state.viewTracked.has(id)) return;
  state.viewTracked.add(id);
  db.ref("resources/" + id).transaction(cur => {
    if(!cur) return { viewCount: 1 };
    cur.viewCount = (cur.viewCount||0) + 1;
    return cur;
  }).catch(() => {});
}
function trackDownload(){
  const r = state.selectedResource; if(!r) return;
  db.ref("resources/" + r.id).transaction(cur => {
    if(!cur) return { downloadCount: 1 };
    cur.downloadCount = (cur.downloadCount||0) + 1;
    return cur;
  }).catch(() => {});
}

function renderMedia(r){
  const box = $("viewerMedia");
  let url = r.previewUrl || "";
  $("viewerDownloadButton").classList.add("hidden");
  $("youtubeOnlyMessage").classList.add("hidden");
  $("downloadReadyMessage").classList.add("hidden");

  if(!url){
    box.innerHTML = `<div class="p-8 text-center"><div class="text-4xl">📚</div><div class="mt-3 font-bold text-white">No preview URL</div></div>`;
    return;
  }

  if(r.mediaType === "youtube" || isYouTubeUrl(url)){
    const vid = getYouTubeId(url);
    if(!vid){ box.innerHTML = `<div class="p-8 text-center"><div class="text-4xl">▶️</div><div class="mt-3 font-bold text-red-300">Invalid YouTube URL</div></div>`; return; }
    box.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>`;
    $("youtubeOnlyMessage").classList.remove("hidden");
    $("countdownBox").classList.add("hidden");
    return;
  }

  if(r.mediaType === "pdf" || isGoogleDriveUrl(url) || url.includes(".pdf")){
    const fid = getGoogleDriveFileId(url);
    if(fid){
      const embed  = `https://drive.google.com/file/d/${fid}/preview`;
      const direct = `https://drive.google.com/uc?export=download&id=${fid}`;
      r.downloadUrl = direct;
      box.innerHTML = `
        <div style="width:100%;height:380px;background:#f5f5f5;border-radius:12px;overflow:hidden;">
          <iframe src="${embed}" style="width:100%;height:100%;border:0;" allowfullscreen></iframe>
        </div>
        <div class="text-center text-xs text-gray-400 mt-2"><a href="${direct}" target="_blank" class="text-rose-400 underline hover:text-rose-300">Open directly</a></div>`;
      $("countdownBox").classList.remove("hidden");
      startCountdown();
      return;
    }
    box.innerHTML = `<div class="p-8 text-center text-red-300"><div class="text-4xl mb-2">⚠️</div><div>Invalid Google Drive URL</div></div>`;
    return;
  }

  if(r.mediaType === "audio"){
    box.innerHTML = `<div class="flex min-h-[320px] flex-col items-center justify-center gap-6 p-6"><div class="text-6xl">🎵</div><div class="text-sm font-bold text-rose-100/70">Audio Player</div><audio controls src="${safeUrl(url)}" style="width:90%;max-width:500px;"></audio></div>`;
    return;
  }
  if(r.mediaType === "video"){
    box.innerHTML = `<video controls playsinline src="${safeUrl(url)}" style="width:100%;height:100%;object-fit:contain;"></video>`;
    return;
  }
  box.innerHTML = `<div class="p-8 text-center"><div class="text-4xl">📄</div><div class="mt-3 text-white">Unsupported type: ${escapeHtml(r.mediaType||"")}</div></div>`;
}

/* ---------- Countdown ---------- */
function startCountdown(){
  clearInterval(state.countdownTimer);
  const r = state.selectedResource; if(!r) return;
  if(r.mediaType === "youtube" || isYouTubeUrl(r.previewUrl)){ $("countdownBox").classList.add("hidden"); return; }
  $("countdownBox").classList.remove("hidden");
  $("viewerDownloadButton").classList.add("hidden");
  $("downloadReadyMessage").classList.add("hidden");
  let sec = 8;
  $("countdown").textContent = sec;
  state.countdownTimer = setInterval(() => {
    sec--;
    if(sec > 0) $("countdown").textContent = sec;
    if(sec <= 0){
      clearInterval(state.countdownTimer);
      $("countdown").textContent = "✓";
      $("downloadReadyMessage").classList.remove("hidden");
      let dl = r.downloadUrl || r.previewUrl;
      if(dl && isGoogleDriveUrl(dl)) dl = getGoogleDriveDirectUrl(dl);
      if(dl && dl !== "#"){
        const btn = $("viewerDownloadButton");
        btn.href = safeUrl(dl);
        btn.classList.remove("hidden");
        btn.onclick = function(){ trackDownload(); };
      }else{
        $("downloadReadyMessage").textContent = "No download available.";
      }
    }
  }, 1000);
}

/* ---------- Ads ---------- */
function renderAds(){
  const placements = ["TOP","MIDDLE","VIEWER"];
  const containers = ["topAd728","middleAd728","viewerAdContainer"];
  const defaults = ["📢 Top Advertisement","📢 Middle Advertisement","📢 Viewer Advertisement"];
  placements.forEach((p, i) => {
    const ads = state.advertisements.filter(a => a.active !== false && a.placement === p);
    const el = $(containers[i]); if(!el) return;
    if(!ads.length){ el.innerHTML = `<div class="text-center text-rose-100/20 text-sm p-4">${defaults[i]}</div>`; return; }
    const ad = ads[0];
    el.innerHTML = `
      <a href="${safeUrl(ad.link)}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;width:100%;min-height:90px;background:rgba(255,255,255,.03);border-radius:12px;overflow:hidden;" class="hover:bg-white/5">
        <img src="${safeUrl(ad.imageUrl)}" alt="${escapeHtml(ad.title)}" style="width:100%;height:auto;max-height:90px;object-fit:contain;" loading="lazy">
        <span class="ad-label">Ad</span>
      </a>`;
  });
}

/* ---------- News + ads + settings loader ---------- */
function loadNewsAndAds(){
  showLoading("newsLoading");
  db.ref("news").once("value").then(s => {
    state.news = Object.entries(s.val() || {}).map(([id, v]) => ({ id, ...v }));
    hideLoading("newsLoading");
    renderNews();
    if(state.adminLoggedIn) renderAdminLists();
  }).catch(() => hideLoading("newsLoading"));

  db.ref("advertisements").once("value").then(s => {
    state.advertisements = Object.entries(s.val() || {}).map(([id, v]) => ({ id, ...v }));
    renderAds();
    if(state.adminLoggedIn) renderAdminLists();
  }).catch(() => {});

  db.ref("settings/buyMeACoffeeUrl").once("value").then(s => {
    state.coffeeUrl = s.val() || "";
    updateCoffeeUI();
    if(state.adminLoggedIn){ const el = $("coffeeUrl"); if(el) el.value = state.coffeeUrl; }
  }).catch(() => {});
}

function renderNews(){
  const list = [...state.news].sort((a,b) => (b.createdAt||0) - (a.createdAt||0)).slice(0, 6);
  const el = $("newsGrid"); if(!el) return;
  if(!list.length){
    el.innerHTML = `<div class="col-span-full rounded-2xl border border-rose-500/10 bg-black/10 p-5 text-center text-sm text-gray-400">Japan updates will appear here.</div>`;
    return;
  }
  el.innerHTML = list.map(n => {
    const hasLink = n.link && safeUrl(n.link) !== "#";
    return `
      <div class="rounded-2xl border border-rose-500/10 bg-black/20 p-4 hover:bg-white/5 transition">
        <span class="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black text-rose-300">${escapeHtml(n.category||"UPDATE")}</span>
        <h3 class="mt-3 font-black text-white">${escapeHtml(n.title)}</h3>
        <p class="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">${escapeHtml(n.description)}</p>
        ${hasLink ? `<a href="${safeUrl(n.link)}" target="_blank" class="mt-3 inline-flex rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition">Read More →</a>` : ""}
      </div>`;
  }).join("");
}

/* ---------- Coffee ---------- */
function updateCoffeeUI(){
  const u = safeUrl(state.coffeeUrl);
  const section = $("coffeeSection"), menuBtn = $("coffeeMenuBtn");
  if(!state.coffeeUrl || u === "#"){
    section && section.classList.add("hidden");
    menuBtn && menuBtn.classList.add("hidden");
    return;
  }
  const homeBtn = $("coffeeHomeBtn"); if(homeBtn) homeBtn.href = u;
  if(menuBtn) menuBtn.href = u;
  section && section.classList.remove("hidden");
  menuBtn && menuBtn.classList.remove("hidden");
}
function saveCoffeeUrl(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const u = $("coffeeUrl").value.trim();
  if(!u){ showToast("Enter URL", true); return; }
  const s = safeUrl(u);
  if(s === "#"){ showToast("Invalid URL", true); return; }
  db.ref("settings/buyMeACoffeeUrl").set(s).then(() => { showToast("✅ Coffee link saved"); loadNewsAndAds(); });
}
function removeCoffeeUrl(){
  if(!state.adminLoggedIn || !confirm("Remove coffee link?")) return;
  db.ref("settings/buyMeACoffeeUrl").remove().then(() => { $("coffeeUrl").value = ""; showToast("Removed"); loadNewsAndAds(); });
}

/* ---------- Analytics ---------- */
function updateAnalytics(){
  const total = state.resources.length;
  const views = state.resources.reduce((s,r) => s + (r.viewCount||0), 0);
  const downloads = state.resources.reduce((s,r) => s + (r.downloadCount||0), 0);
  const setTxt = (id, val) => { const el = $(id); if(el) el.textContent = val; };
  setTxt("totalResources", total);
  setTxt("totalViews", views);
  setTxt("totalDownloads", downloads);
  updateStreakAnalytics();
  db.ref("users").once("value").then(snap => {
    const users = snap.val() || {};
    setTxt("totalUsers", Object.keys(users).length || 0);
  }).catch(() => {});
  const top = [...state.resources].sort((a,b) => (b.viewCount||0) - (a.viewCount||0)).slice(0, 5);
  const topEl = $("topResourcesList");
  if(topEl){
    topEl.innerHTML = top.length
      ? top.map((r, i) => `
        <div class="flex items-center justify-between text-sm border-b border-rose-500/5 py-1">
          <span class="text-white">${i+1}. ${escapeHtml(r.title)}</span>
          <span class="text-rose-400">${r.viewCount||0} views</span>
        </div>`).join("")
      : `<div class="text-gray-400 text-sm">No data yet</div>`;
  }
}

/* ---------- URL params ---------- */
function handleUrlParams(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("resource");
  if(id){
    const r = state.resources.find(x => x.id === id);
    if(r) setTimeout(() => openResource(id), 400);
  }
}
