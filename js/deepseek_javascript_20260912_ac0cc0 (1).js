/* ============================================================
   SL Sakura — member-features.js
   Forum, blog, spaced repetition, chatbot.
   ============================================================ */

/* ---------- FORUM ---------- */
function loadForumPosts(){
  db.ref("forumPosts").once("value").then(snap => {
    const data = snap.val() || {};
    state.forumPosts = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderForumPosts();
    renderAdminForumList();
  }).catch(() => {});
}

function renderForumPosts(){
  const c = $("forumPosts"); if(!c) return;
  if(!state.forumPosts.length){
    c.innerHTML = `<div class="text-center text-gray-400 py-4">No discussions yet. Start one!</div>`;
    return;
  }
  const sorted = [...state.forumPosts].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  c.innerHTML = sorted.map(p => `
    <div class="forum-post">
      <div class="flex items-center justify-between">
        <div class="font-bold text-white">${escapeHtml(p.author||"Anonymous")}</div>
        <div class="post-meta">${new Date(p.createdAt||Date.now()).toLocaleDateString()}</div>
      </div>
      <div class="mt-1 text-sm text-gray-300">${escapeHtml(p.content)}</div>
    </div>`).join("");
}

function renderAdminForumList(){
  const c = $("adminForumList"); if(!c) return;
  if(!state.forumPosts.length){ c.innerHTML = `<div class="text-xs text-gray-400">No forum posts</div>`; return; }
  const sorted = [...state.forumPosts].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  c.innerHTML = sorted.map(p => `
    <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold truncate text-white">${escapeHtml(p.author||"Anonymous")}</div>
          <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(p.content)}</div>
        </div>
        <button onclick="deleteForumPost('${p.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join("");
}

function addForumPost(){
  const input = $("forumPostInput");
  const content = input.value.trim();
  if(!content){ showToast("Write something", true); return; }
  const user = auth.currentUser;
  db.ref("forumPosts").push({
    content,
    author: user ? (user.displayName || user.email || "User") : "Anonymous",
    userId: user ? user.uid : null,
    createdAt: Date.now()
  }).then(() => { input.value = ""; showToast("✅ Post added!"); loadForumPosts(); })
    .catch(() => showToast("❌ Error adding post", true));
}

function deleteForumPost(id){
  if(!state.adminLoggedIn || !confirm("Delete this post?")) return;
  db.ref("forumPosts/" + id).remove().then(() => { showToast("🗑️ Post deleted"); loadForumPosts(); });
}

function clearAllForumPosts(){
  if(!state.adminLoggedIn || !confirm("Delete ALL forum posts?")) return;
  db.ref("forumPosts").remove().then(() => { showToast("🗑️ All posts deleted"); loadForumPosts(); });
}

function openForum(){
  const s = $("forumSection"); if(!s) return;
  s.classList.remove("hidden");
  s.scrollIntoView({behavior:"smooth"});
  loadForumPosts();
}
function closeForum(){ $("forumSection").classList.add("hidden"); }

/* ---------- BLOG ---------- */
function loadBlogPosts(){
  db.ref("blogPosts").once("value").then(snap => {
    const data = snap.val() || {};
    state.blogPosts = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderBlogPosts();
    renderBlogAdminList();
  }).catch(() => {});
}

function renderBlogPosts(){
  const c = $("blogGrid"); if(!c) return;
  if(!state.blogPosts.length){
    c.innerHTML = `<div class="col-span-full text-center text-gray-400 py-8">No blog posts yet</div>`;
    return;
  }
  const sorted = [...state.blogPosts].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  c.innerHTML = sorted.map(p => `
    <div class="blog-card">
      ${p.image ? `<img src="${safeUrl(p.image)}" alt="${escapeHtml(p.title)}" class="blog-image" onerror="this.style.display='none'" />` : ""}
      <div class="text-rose-400 text-xs font-bold">${escapeHtml(p.category||"General")}</div>
      <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(p.title)}</h3>
      <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(p.content)}</p>
      <div class="text-xs text-gray-500 mt-2">${new Date(p.createdAt||Date.now()).toLocaleDateString()}</div>
    </div>`).join("");
}

function renderBlogAdminList(){
  const c = $("adminBlogList"); if(!c) return;
  if(!state.blogPosts.length){ c.innerHTML = `<div class="text-xs text-gray-400">No blog posts</div>`; return; }
  const sorted = [...state.blogPosts].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  c.innerHTML = sorted.map(p => `
    <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold truncate text-white">${escapeHtml(p.title)}</div>
          <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(p.category||"General")}</div>
        </div>
        <button onclick="deleteBlogPost('${p.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join("");
}

function toggleBlogForm(){
  const f = $("blogFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addBlogPost(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("blogTitle").value.trim();
  const content = $("blogContent").value.trim();
  if(!title || !content){ showToast("Title and content required", true); return; }
  db.ref("blogPosts").push({
    title, content,
    image: $("blogImage").value.trim(),
    category: $("blogCategory").value.trim() || "General",
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Blog post added!");
    ["blogTitle","blogImage","blogContent","blogCategory"].forEach(id => $(id).value = "");
    loadBlogPosts();
    $("blogFormContainer").classList.add("hidden");
  }).catch(() => showToast("❌ Error adding blog post", true));
}

function deleteBlogPost(id){
  if(!state.adminLoggedIn || !confirm("Delete this blog post?")) return;
  db.ref("blogPosts/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadBlogPosts(); });
}

function openBlog(){ const s = $("blogSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); loadBlogPosts(); }
function closeBlog(){ $("blogSection").classList.add("hidden"); }

/* ---------- SPACED REPETITION ---------- */
const reviewData = [
  { id:"1", word:"私", reading:"わたし", meaning:"I / me", level:"N5", nextReview:1 },
  { id:"2", word:"本", reading:"ほん", meaning:"book", level:"N5", nextReview:3 },
  { id:"3", word:"学校", reading:"がっこう", meaning:"school", level:"N5", nextReview:7 },
  { id:"4", word:"先生", reading:"せんせい", meaning:"teacher", level:"N5", nextReview:14 },
  { id:"5", word:"学生", reading:"がくせい", meaning:"student", level:"N5", nextReview:30 }
];

function loadReviewItems(){
  db.ref("reviewItems").once("value").then(snap => {
    const data = snap.val() || {};
    if(Object.keys(data).length > 0){
      state.reviewItems = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    }else{
      state.reviewItems = reviewData.map(item => ({...item}));
      const updates = {};
      state.reviewItems.forEach(item => {
        updates[item.id] = {word:item.word, reading:item.reading, meaning:item.meaning, level:item.level, nextReview:item.nextReview};
      });
      db.ref("reviewItems").set(updates);
    }
    renderReviewItems();
    renderAdminReviewList();
  }).catch(() => {
    state.reviewItems = reviewData.map(item => ({...item}));
    renderReviewItems();
  });
}

function renderReviewItems(){
  const c = $("reviewContainer"); if(!c) return;
  if(!state.reviewItems.length){
    c.innerHTML = `<div class="col-span-full text-center text-gray-400 py-8">No review items</div>`;
    return;
  }
  c.innerHTML = state.reviewItems.map(item => `
    <div class="review-card">
      <div class="text-3xl font-bold text-rose-400">${escapeHtml(item.word)}</div>
      <div class="text-xs text-gray-400">${escapeHtml(item.reading)}</div>
      <div class="text-lg font-bold mt-2 text-white">${escapeHtml(item.meaning)}</div>
      <div class="review-status">${escapeHtml(item.level||"N5")} • Review in ${item.nextReview||1} day(s)</div>
      <button onclick="markReviewed('${item.id}')" class="rose-btn mt-3 rounded-xl px-4 py-1.5 text-xs font-black">✅ Review</button>
    </div>`).join("");
}

function renderAdminReviewList(){
  const c = $("adminReviewList"); if(!c) return;
  if(!state.reviewItems.length){ c.innerHTML = `<div class="text-xs text-gray-400">No review items</div>`; return; }
  c.innerHTML = state.reviewItems.map(item => `
    <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold truncate text-white">${escapeHtml(item.word)} - ${escapeHtml(item.meaning)}</div>
          <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(item.level||"N5")} • ${item.nextReview||1} days</div>
        </div>
        <button onclick="deleteReviewItem('${item.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join("");
}

function markReviewed(id){
  const item = state.reviewItems.find(i => i.id === id); if(!item) return;
  const intervals = [1, 3, 7, 14, 30];
  const idx = intervals.indexOf(item.nextReview||1);
  const next = idx >= 0 && idx < intervals.length - 1 ? intervals[idx+1] : 30;
  db.ref("reviewItems/" + id).update({ nextReview: next, lastReviewed: Date.now() })
    .then(() => { showToast(`✅ "${item.word}" reviewed! Next in ${next} days`); loadReviewItems(); })
    .catch(() => showToast("❌ Error updating review", true));
}

function deleteReviewItem(id){
  if(!state.adminLoggedIn || !confirm("Delete this review item?")) return;
  db.ref("reviewItems/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadReviewItems(); });
}

function openSpacedRepetition(){ const s = $("spacedRepetitionSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); loadReviewItems(); }
function closeSpacedRepetition(){ $("spacedRepetitionSection").classList.add("hidden"); }

/* ---------- CHATBOT ---------- */
const chatbotResponses = {
  "hello": ["こんにちは！(Konnichiwa!) How can I help you learn Japanese today?"],
  "hi": ["こんにちは！How can I help you?"],
  "jlpt": ["JLPT has 5 levels: N5 (easiest) to N1 (hardest). Which level are you interested in?"],
  "n5": ["N5 is beginner — about 100 kanji and 800 vocab words."],
  "n4": ["N4 is elementary — about 300 kanji and 1500 vocab words."],
  "n3": ["N3 is intermediate — about 650 kanji and 3000 vocab words."],
  "n2": ["N2 is upper-intermediate — about 1000 kanji and 6000 vocab words."],
  "n1": ["N1 is advanced — about 2000 kanji and 10000 vocab words."],
  "study": ["Study tip: Practice 15 minutes daily. Consistency beats cramming! 📚"],
  "tips": ["1. Flashcards daily\n2. Watch Japanese shows\n3. Speak out loud\n4. Write a journal in Japanese"],
  "kanji": ["Kanji tip: Learn radicals first! Start with the 100 most common kanji."],
  "grammar": ["Grammar tip: Japanese is Subject-Object-Verb. Example: 私は本を読みます."],
  "vocabulary": ["Vocabulary tip: Use spaced repetition — review at 1, 3, 7, and 30 days."],
  "help": ["I can help with: JLPT info, study tips, culture, vocabulary, grammar, and resource recommendations."],
  "default": ["That's interesting! Ask me anything about Japanese learning.", "Let's focus on Japanese! What would you like to know?"]
};

function getChatbotResponse(message){
  const msg = String(message||"").toLowerCase().trim();
  if(/[ぁ-んァ-ヶ一-龯]/.test(message)) return "Japanese sentence tip: particles show the role of each word. は marks topic, を marks object, に direction/time, で place of action.";
  for(const [key, responses] of Object.entries(chatbotResponses)){
    if(msg.includes(key)) return responses[Math.floor(Math.random()*responses.length)];
  }
  if(msg.includes("?")) return "That's a great question! I'll do my best to help with Japanese! 🇯🇵";
  return chatbotResponses.default[Math.floor(Math.random()*chatbotResponses.default.length)];
}

function toggleChatbot(){
  const m = $("chatbotModal"); if(!m) return;
  m.classList.toggle("hidden");
  m.classList.toggle("flex");
  if(!m.classList.contains("hidden")) $("chatbotInput").focus();
}

function sendChatbotMessage(){
  const input = $("chatbotInput");
  const messages = $("chatbotMessages");
  const msg = input.value.trim(); if(!msg) return;

  messages.innerHTML += `
    <div class="flex justify-end mb-3">
      <div class="glass px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%] bg-rose-500/10 border border-rose-500/15 text-white">${escapeHtml(msg)}</div>
    </div>`;

  setTimeout(() => {
    const response = getChatbotResponse(msg);
    messages.innerHTML += `
      <div class="flex justify-start mb-3">
        <div class="glass px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] border border-rose-500/10">
          <span class="text-rose-400 text-xs font-bold">🌸 Sakura AI</span><br>
          <span class="text-white">${escapeHtml(response)}</span>
        </div>
      </div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 300);

  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}