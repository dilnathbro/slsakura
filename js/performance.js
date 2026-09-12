/* ============================================================
   SL Sakura — performance.js
   Progress bar, search debounce, lazy images, keyboard shortcuts.
   ============================================================ */

/* ---------- Progress bar ---------- */
window.addEventListener("scroll", () => {
  const top = window.scrollY;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = h > 0 ? (top / h) * 100 : 0;
  const bar = document.getElementById("progressBar");
  if(bar) bar.style.width = pct + "%";
}, {passive:true});

/* ---------- Search (debounced) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("resourceSearch");
  if(!search) return;
  let t;
  search.addEventListener("input", function(){
    const v = this.value;
    clearTimeout(t);
    t = setTimeout(() => {
      state.searchQuery = v;
      state.visibleCount = 12;
      renderResources();
    }, 300);
  });
});

/* ---------- Lazy image observer ---------- */
function lazyLoadImages(){
  const images = document.querySelectorAll('img[loading="lazy"]');
  if(!("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        const img = e.target;
        if(img.dataset.src) img.src = img.dataset.src;
        obs.unobserve(img);
      }
    });
  }, {rootMargin:"100px"});
  images.forEach(img => obs.observe(img));
}

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener("keydown", e => {
  const mod = e.ctrlKey || e.metaKey;
  if(mod && e.key === "k"){ e.preventDefault(); openSearch(); return; }
  if(mod && e.key === "h"){ e.preventDefault(); goHome(); return; }
  if(mod && e.key === "f"){ e.preventDefault(); if(window.openFlashcards) openFlashcards(); return; }
  if(mod && e.key === "l"){ e.preventDefault(); openLeaderboard(); return; }
  if(mod && e.key === "b"){ e.preventDefault(); toggleChatbot(); return; }
  if(e.key === "Escape"){
    ["contactModal","adminLoginModal","quizModal","flashcardModal","mockTestModal","vocabularyModal","leaderboardModal","progressModal"].forEach(id => {
      const el = document.getElementById(id);
      if(el && !el.classList.contains("hidden")){
        el.classList.add("hidden"); el.classList.remove("flex");
      }
    });
    if(!document.getElementById("chatbotModal").classList.contains("hidden")) toggleChatbot();
    if(!document.getElementById("forumSection").classList.contains("hidden")) closeForum();
    if(!document.getElementById("blogSection").classList.contains("hidden")) closeBlog();
    if(!document.getElementById("spacedRepetitionSection").classList.contains("hidden")) closeSpacedRepetition();
    closeMenu();
  }
});
