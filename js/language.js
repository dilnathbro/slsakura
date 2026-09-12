/* ============================================================
   SL Sakura — language.js
   i18n strings, language selector, onboarding.
   ============================================================ */

const translations = {
  en: {
    guest: "Guest", notLoggedIn: "Not logged in", login: "Login", signup: "Sign Up",
    logout: "Logout", favorites: "Favorites", progress: "Progress", flashcards: "Flashcards",
    leaderboard: "Leaderboard", badges: "Badges", forum: "Forum", blog: "Blog",
    spacedrepetition: "Review", search: "Search Resources", resources: "Resources",
    news: "Japan Updates", contact: "Contact / Email", whatsapp: "WhatsApp Support",
    coffee: "Buy Me a Coffee", mocktest: "JLPT Mock Test", vocabulary: "Vocabulary",
    chatbot: "AI Chatbot", quiz: "Quiz", googleSignin: "Sign in with Google"
  },
  si: {
    guest: "අමුත්තා", notLoggedIn: "පිවිසී නැත", login: "පිවිසෙන්න", signup: "ලියාපදිංචි වන්න",
    logout: "ඉවත් වන්න", favorites: "ප්‍රියතම", progress: "ප්‍රගතිය", flashcards: "ෆ්ලෑෂ් කාඩ්",
    leaderboard: "නායක පුවරුව", badges: "ලාංඡන", forum: "සංවාද", blog: "බ්ලොග්",
    spacedrepetition: "සමාලෝචනය", search: "සම්පත් සොයන්න", resources: "සම්පත්",
    news: "ජපාන යාවත්කාලීන", contact: "සම්බන්ධ වන්න", whatsapp: "WhatsApp සහාය",
    coffee: "කෝපි එකක්", mocktest: "JLPT අභ්‍යාස පරීක්ෂණය", vocabulary: "වචන මාලාව",
    chatbot: "AI චැට්බොට්", quiz: "ප්‍රශ්නාවලිය", googleSignin: "Google සමඟ පිවිසෙන්න"
  },
  ja: {
    guest: "ゲスト", notLoggedIn: "ログインしていません", login: "ログイン", signup: "新規登録",
    logout: "ログアウト", favorites: "お気に入り", progress: "進捗", flashcards: "フラッシュカード",
    leaderboard: "ランキング", badges: "バッジ", forum: "フォーラム", blog: "ブログ",
    spacedrepetition: "復習", search: "リソースを検索", resources: "リソース",
    news: "日本ニュース", contact: "お問い合わせ", whatsapp: "WhatsAppサポート",
    coffee: "コーヒーをおごる", mocktest: "JLPT模擬試験", vocabulary: "語彙",
    chatbot: "AIチャットボット", quiz: "クイズ", googleSignin: "Googleでサインイン"
  }
};

function applyTranslations(lang){
  const t = translations[lang] || translations.en;
  document.querySelectorAll("[data-lang]").forEach(el => {
    const key = el.dataset.lang;
    if(t[key]) el.textContent = t[key];
  });
  document.documentElement.lang = lang;
}

function changeLanguage(lang){
  try{ localStorage.setItem("slSakuraLang", lang); }catch(e){}
  applyTranslations(lang);
}

function initLanguage(){
  let saved = "en";
  try{ saved = localStorage.getItem("slSakuraLang") || "en"; }catch(e){}
  const sel = document.getElementById("langSelector");
  if(sel) sel.value = saved;
  applyTranslations(saved);
}

/* ---------- Onboarding ---------- */
function closeOnboarding(){
  const o = document.getElementById("onboardingOverlay");
  if(o) o.classList.remove("active");
  try{ localStorage.setItem("slSakuraOnboarding", "done"); }catch(e){}
}

function checkOnboarding(){
  let done = null;
  try{ done = localStorage.getItem("slSakuraOnboarding"); }catch(e){}
  if(!done){
    setTimeout(() => {
      const o = document.getElementById("onboardingOverlay");
      if(o) o.classList.add("active");
    }, 1000);
  }
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initLanguage();
  checkOnboarding();
});
