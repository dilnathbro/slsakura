/* ============================================================
   SL Sakura — repair.js
   Fixes for missing functions. Loads LAST so it patches any
   holes left by other modules.
   ============================================================ */

/* ---------- QUIZ user view ---------- */
function openQuiz(){
  const m = document.getElementById("quizModal");
  if(!m) return;
  m.classList.remove("hidden");
  m.classList.add("flex");

  const c = document.getElementById("quizContainer");
  c.innerHTML = `<div class="text-center text-gray-400 py-8"><div class="spinner mx-auto mb-3"></div>Loading quiz...</div>`;

  db.ref("quizzes").once("value").then(snap => {
    const data = snap.val() || {};
    const quizzes = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    if(!quizzes.length){
      c.innerHTML = `<div class="text-center text-gray-400 py-8">No quiz questions yet.</div>`;
      return;
    }
    let i = 0, score = 0;
    const render = () => {
      if(i >= quizzes.length){
        c.innerHTML = `
          <div class="text-center py-6">
            <div class="text-5xl">🎉</div>
            <h3 class="mt-3 text-2xl font-black text-white">Score: ${score}/${quizzes.length}</h3>
            <button onclick="closeQuiz()" class="rose-btn mt-5">Close</button>
          </div>`;
        return;
      }
      const q = quizzes[i];
      const progress = Math.round((i / quizzes.length) * 100);
      c.innerHTML = `
        <div class="quiz-progress mb-3"><div class="quiz-progress-bar" style="width:${progress}%"></div></div>
        <div class="text-xs text-gray-400 mb-2">Question ${i+1} / ${quizzes.length}</div>
        <h3 class="text-lg font-black text-white mb-4">${escapeHtml(q.question)}</h3>
        <div class="space-y-2">
          ${q.options.map((o, n) => `<button class="quiz-option" data-n="${n}">${String.fromCharCode(65+n)}. ${escapeHtml(o)}</button>`).join("")}
        </div>`;
      c.querySelectorAll("[data-n]").forEach(b => b.onclick = () => {
        const n = Number(b.dataset.n);
        if(n === q.correct){ score++; b.classList.add("correct"); }
        else{
          b.classList.add("wrong");
          c.querySelectorAll("[data-n]")[q.correct]?.classList.add("correct");
        }
        c.querySelectorAll("[data-n]").forEach(x => x.disabled = true);
        setTimeout(() => { i++; render(); }, 800);
      });
    };
    render();
  }).catch(() => {
    c.innerHTML = `<div class="text-center text-red-300 py-8">Could not load quiz.</div>`;
  });
}

function closeQuiz(){
  const m = document.getElementById("quizModal");
  if(!m) return;
  m.classList.add("hidden");
  m.classList.remove("flex");
}

/* ---------- FLASHCARDS user view ---------- */
function openFlashcards(){
  const m = document.getElementById("flashcardModal");
  if(!m) return;
  m.classList.remove("hidden");
  m.classList.add("flex");

  const c = document.getElementById("flashcardContainer");
  c.innerHTML = `<div class="text-center text-gray-400 py-8"><div class="spinner mx-auto mb-3"></div>Loading flashcards...</div>`;

  db.ref("flashcards").once("value").then(snap => {
    const data = snap.val() || {};
    const cards = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    if(!cards.length){
      c.innerHTML = `<div class="text-center text-gray-400 py-8">No flashcards yet.</div>`;
      return;
    }
    let i = 0;
    const render = () => {
      const card = cards[i];
      c.innerHTML = `
        <div class="text-xs text-gray-400 mb-3 text-center">Card ${i+1} / ${cards.length}</div>
        <div class="flashcard mb-4" onclick="this.classList.toggle('flipped')">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div>
                <div class="text-xs text-rose-300 mb-2">${escapeHtml(card.category || "General")}</div>
                <div class="text-2xl font-black text-white">${escapeHtml(card.front)}</div>
                <div class="mt-3 text-xs text-gray-400">Tap to flip</div>
              </div>
            </div>
            <div class="flashcard-back">
              <div class="text-xl font-bold text-white">${escapeHtml(card.back)}</div>
            </div>
          </div>
        </div>
        <div class="flex justify-between gap-2">
          <button id="fcPrev" class="action-btn">← Previous</button>
          <button id="fcNext" class="rose-btn">Next →</button>
        </div>`;
      document.getElementById("fcPrev").onclick = () => { if(i > 0){ i--; render(); } };
      document.getElementById("fcNext").onclick = () => { if(i < cards.length - 1){ i++; render(); } else { i = 0; render(); } };
    };
    render();
  }).catch(() => {
    c.innerHTML = `<div class="text-center text-red-300 py-8">Could not load flashcards.</div>`;
  });
}

function closeFlashcards(){
  const m = document.getElementById("flashcardModal");
  if(!m) return;
  m.classList.add("hidden");
  m.classList.remove("flex");
}

/* ---------- STUDY PROGRESS ---------- */
function openStudyProgress(){
  const m = document.getElementById("progressModal");
  if(!m) return;
  m.classList.remove("hidden");
  m.classList.add("flex");

  const user = auth.currentUser;
  const c = document.getElementById("progressContainer");
  if(!user){
    c.innerHTML = `<div class="text-center text-gray-400 py-8">Please login to view your study progress.</div>`;
    return;
  }
  db.ref("users/" + user.uid).once("value").then(snap => {
    const data = snap.val() || {};
    const streak = (data.streak && data.streak.count) || 0;
    const favorites = (data.favorites || []).length;
    const viewed = data.viewedCount || 0;
    const badges = (data.badges || []).length;
    c.innerHTML = `
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="glass rounded-2xl p-4 text-center">
          <div class="text-3xl">🔥</div>
          <div class="text-2xl font-black text-rose-400 mt-2">${streak}</div>
          <div class="text-xs text-gray-400">Day Streak</div>
        </div>
        <div class="glass rounded-2xl p-4 text-center">
          <div class="text-3xl">❤️</div>
          <div class="text-2xl font-black text-rose-400 mt-2">${favorites}</div>
          <div class="text-xs text-gray-400">Favorites</div>
        </div>
        <div class="glass rounded-2xl p-4 text-center">
          <div class="text-3xl">📚</div>
          <div class="text-2xl font-black text-rose-400 mt-2">${viewed}</div>
          <div class="text-xs text-gray-400">Resources Viewed</div>
        </div>
        <div class="glass rounded-2xl p-4 text-center">
          <div class="text-3xl">🎖️</div>
          <div class="text-2xl font-black text-rose-400 mt-2">${badges}</div>
          <div class="text-xs text-gray-400">Badges Earned</div>
        </div>
      </div>
      <div class="mt-5 glass rounded-2xl p-4">
        <div class="text-sm font-bold text-white mb-2">Study Tip</div>
        <p class="text-sm text-gray-400">Consistency beats cramming. Study 15 minutes every day to see real progress. 🌸</p>
      </div>`;
  }).catch(() => {
    c.innerHTML = `<div class="text-center text-red-300 py-8">Could not load progress.</div>`;
  });
}

function closeProgress(){
  const m = document.getElementById("progressModal");
  if(!m) return;
  m.classList.add("hidden");
  m.classList.remove("flex");
}

/* ---------- Safety net: ensure every promised function exists ---------- */
(function ensureFunctions(){
  const stubs = {
    openFlashcards: () => {},
    closeFlashcards: () => {},
    openQuiz: () => {},
    closeQuiz: () => {},
    openMockTest: () => {},
    closeMockTest: () => {},
    openVocabulary: () => {},
    closeVocabulary: () => {},
    openStudyProgress: () => {},
    closeProgress: () => {},
    openLeaderboard: () => {},
    closeLeaderboard: () => {},
    openBadges: () => {},
    closeBadges: () => {},
    openForum: () => {},
    closeForum: () => {},
    openBlog: () => {},
    closeBlog: () => {},
    openSpacedRepetition: () => {},
    closeSpacedRepetition: () => {}
  };
  for(const [name, fallback] of Object.entries(stubs)){
    if(typeof window[name] !== "function"){
      console.warn("[repair.js] Missing function, installing fallback:", name);
      window[name] = fallback;
    }
  }
})();
