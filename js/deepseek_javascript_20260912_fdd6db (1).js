/* ============================================================
   SL Sakura — nextlevel.js
   Mock tests, grammar, kanji, vocabulary, listening, reading,
   lesson plans, badges — both admin CRUD and user render.
   ============================================================ */

/* ---------- MOCK TESTS ---------- */
function loadMockTestsAdmin(){
  db.ref("mockTests").once("value").then(snap => {
    const data = snap.val() || {};
    state.mockTests = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderMockTestAdminList();
  }).catch(() => {});
}

function renderMockTestAdminList(){
  const c = $("adminMockTestList"); if(!c) return;
  c.innerHTML = state.mockTests.length
    ? state.mockTests.map(t => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(t.title||"Mock Test")}</div>
            <div class="mt-1 text-[10px] text-gray-400">${t.level||"N5"} • ${(t.questions||[]).length} questions</div>
          </div>
          <button onclick="deleteMockTest('${t.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No mock tests yet</div>`;
}

function toggleMockTestForm(){
  const f = $("mockTestFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addMockQuestionField(){
  const list = $("mockQuestionsList");
  const count = list.children.length + 1;
  const div = document.createElement("div");
  div.className = "mock-question-item glass rounded-2xl p-3";
  div.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-bold text-rose-200">Question ${count}</span>
      <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-300 text-xs"><i class="fa-solid fa-times"></i></button>
    </div>
    <input class="mock-question-text admin-input mb-2" placeholder="Question" />
    <div class="grid grid-cols-2 gap-2">
      <input class="mock-option-0 admin-input" placeholder="Option 1" />
      <input class="mock-option-1 admin-input" placeholder="Option 2" />
      <input class="mock-option-2 admin-input" placeholder="Option 3" />
      <input class="mock-option-3 admin-input" placeholder="Option 4" />
    </div>
    <select class="mock-correct admin-input mt-2">
      <option value="0">Correct: Option 1</option>
      <option value="1">Correct: Option 2</option>
      <option value="2">Correct: Option 3</option>
      <option value="3">Correct: Option 4</option>
    </select>`;
  list.appendChild(div);
}

function getMockTestQuestions(){
  const out = [];
  document.querySelectorAll(".mock-question-item").forEach(container => {
    const q = container.querySelector(".mock-question-text")?.value.trim();
    const opts = [
      container.querySelector(".mock-option-0")?.value.trim(),
      container.querySelector(".mock-option-1")?.value.trim(),
      container.querySelector(".mock-option-2")?.value.trim(),
      container.querySelector(".mock-option-3")?.value.trim()
    ].filter(Boolean);
    const correct = parseInt(container.querySelector(".mock-correct")?.value || 0);
    if(q && opts.length === 4) out.push({question:q, options:opts, correct});
  });
  return out;
}

function addMockTest(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("mockTestTitle").value.trim();
  const level = $("mockTestLevel").value || "N5";
  const questions = getMockTestQuestions();
  if(!title){ showToast("Title required", true); return; }
  if(questions.length < 3){ showToast("At least 3 questions required", true); return; }
  db.ref("mockTests").push({ title, level, questions, createdAt: Date.now() })
    .then(() => {
      showToast("✅ Mock test added!");
      $("mockTestTitle").value = ""; $("mockQuestionsList").innerHTML = "";
      loadMockTestsAdmin();
      $("mockTestFormContainer").classList.add("hidden");
    }).catch(() => showToast("❌ Error adding mock test", true));
}

function deleteMockTest(id){
  if(!state.adminLoggedIn || !confirm("Delete this mock test?")) return;
  db.ref("mockTests/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadMockTestsAdmin(); });
}

function cancelEditMockTest(){ $("mockTestFormContainer")?.classList.add("hidden"); }

/* ---------- MOCK TEST USER VIEW ---------- */
function openMockTest(level){
  const m = $("mockTestModal");
  m.classList.remove("hidden"); m.classList.add("flex");

  db.ref("mockTests").orderByChild("level").equalTo(level || "N5").once("value").then(snap => {
    const data = snap.val() || {};
    const tests = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    const c = $("mockTestContainer");
    if(!tests.length){
      c.innerHTML = `<div class="text-center text-gray-400 py-8">No mock tests for ${escapeHtml(level)} yet.</div>`;
      return;
    }
    const t = tests[0];
    let idx = 0, score = 0;
    const render = () => {
      if(idx >= t.questions.length){
        c.innerHTML = `
          <div class="text-center py-6">
            <div class="text-5xl">🎯</div>
            <h3 class="mt-3 text-2xl font-black text-white">Score: ${score}/${t.questions.length}</h3>
            <button onclick="closeMockTest()" class="rose-btn mt-5">Close</button>
          </div>`;
        return;
      }
      const q = t.questions[idx];
      c.innerHTML = `
        <div class="text-xs text-gray-400 mb-2">Question ${idx+1} / ${t.questions.length}</div>
        <h3 class="text-lg font-black text-white mb-4">${escapeHtml(q.question)}</h3>
        <div class="space-y-2">
          ${q.options.map((o, i) => `<button class="quiz-option" data-i="${i}">${String.fromCharCode(65+i)}. ${escapeHtml(o)}</button>`).join("")}
        </div>`;
      c.querySelectorAll("[data-i]").forEach(b => b.onclick = () => {
        if(Number(b.dataset.i) === q.correct){ score++; b.classList.add("correct"); }
        else{ b.classList.add("wrong"); }
        setTimeout(() => { idx++; render(); }, 600);
      });
    };
    render();
  }).catch(() => {
    $("mockTestContainer").innerHTML = `<div class="text-center text-red-300 py-8">Could not load mock tests.</div>`;
  });
}

function closeMockTest(){
  const m = $("mockTestModal");
  m.classList.add("hidden"); m.classList.remove("flex");
}

/* ---------- GRAMMAR ---------- */
function loadGrammarAdmin(){
  db.ref("grammar").once("value").then(snap => {
    const data = snap.val() || {};
    state.grammar = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderGrammarAdminList();
  }).catch(() => {});
}

function renderGrammarAdminList(){
  const c = $("adminGrammarList"); if(!c) return;
  c.innerHTML = state.grammar.length
    ? state.grammar.map(g => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(g.title)}</div>
            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(g.level||"N5")}</div>
          </div>
          <button onclick="deleteGrammarPoint('${g.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No grammar points yet</div>`;
}

function toggleGrammarForm(){
  const f = $("grammarFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addGrammarPoint(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("grammarTitle").value.trim();
  const explanation = $("grammarExplanation").value.trim();
  if(!title || !explanation){ showToast("Title and explanation required", true); return; }
  db.ref("grammar").push({
    title, explanation,
    level: $("grammarLevel").value.trim() || "N5",
    example: $("grammarExample").value.trim(),
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Grammar added!");
    ["grammarTitle","grammarLevel","grammarExplanation","grammarExample"].forEach(id => $(id).value = "");
    loadGrammarAdmin();
    $("grammarFormContainer").classList.add("hidden");
  }).catch(() => showToast("❌ Error adding grammar", true));
}

function deleteGrammarPoint(id){
  if(!state.adminLoggedIn || !confirm("Delete this grammar point?")) return;
  db.ref("grammar/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadGrammarAdmin(); });
}

function openGrammarGuide(){ const s = $("grammarSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); renderGrammar(); }
function closeGrammarGuide(){ $("grammarSection").classList.add("hidden"); }

function renderGrammar(){
  const c = $("grammarGrid"); if(!c) return;
  c.innerHTML = state.grammar.length
    ? state.grammar.map(g => `
      <div class="grammar-card">
        <div class="text-rose-400 font-bold text-sm">${escapeHtml(g.level||"N5")}</div>
        <h3 class="text-lg font-bold mt-2 text-white">${escapeHtml(g.title)}</h3>
        <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(g.explanation)}</p>
        ${g.example ? `<p class="text-xs text-rose-100/40 mt-2">例: ${escapeHtml(g.example)}</p>` : ""}
      </div>`).join("")
    : `<div class="col-span-full text-center text-gray-400 py-8">No grammar points yet</div>`;
}

/* ---------- KANJI ---------- */
function loadKanjiAdmin(){
  db.ref("kanji").once("value").then(snap => {
    const data = snap.val() || {};
    state.kanji = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderKanjiAdminList();
  }).catch(() => {});
}

function renderKanjiAdminList(){
  const c = $("adminKanjiList"); if(!c) return;
  c.innerHTML = state.kanji.length
    ? state.kanji.map(k => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(k.kanji)} - ${escapeHtml(k.meaning)}</div>
            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(k.reading)} • ${escapeHtml(k.level||"N5")}</div>
          </div>
          <button onclick="deleteKanji('${k.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No kanji yet</div>`;
}

function toggleKanjiForm(){
  const f = $("kanjiFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addKanji(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const kanji = $("kanjiChar").value.trim();
  const meaning = $("kanjiMeaning").value.trim();
  const reading = $("kanjiReading").value.trim();
  if(!kanji || !meaning || !reading){ showToast("Kanji, meaning, reading required", true); return; }
  db.ref("kanji").push({ kanji, meaning, reading, level: $("kanjiLevel").value.trim() || "N5", createdAt: Date.now() })
    .then(() => {
      showToast("✅ Kanji added!");
      ["kanjiChar","kanjiMeaning","kanjiReading","kanjiLevel"].forEach(id => $(id).value = "");
      loadKanjiAdmin();
      $("kanjiFormContainer").classList.add("hidden");
    }).catch(() => showToast("❌ Error adding kanji", true));
}

function deleteKanji(id){
  if(!state.adminLoggedIn || !confirm("Delete this kanji?")) return;
  db.ref("kanji/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadKanjiAdmin(); });
}

function openKanjiDictionary(){ const s = $("kanjiSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); renderKanji(); }
function closeKanjiDictionary(){ $("kanjiSection").classList.add("hidden"); }

function renderKanji(){
  const c = $("kanjiGrid"); if(!c) return;
  c.innerHTML = state.kanji.length
    ? state.kanji.map(k => `
      <div class="kanji-card">
        <div class="kanji-char">${escapeHtml(k.kanji)}</div>
        <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.reading)}</div>
        <div class="text-sm font-bold mt-2 text-white">${escapeHtml(k.meaning)}</div>
        <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.level||"N5")}</div>
      </div>`).join("")
    : `<div class="col-span-full text-center text-gray-400 py-8">No kanji available yet</div>`;
}

function filterKanji(){
  const search = ($("kanjiSearch")?.value || "").toLowerCase();
  const c = $("kanjiGrid"); if(!c) return;
  const filtered = state.kanji.filter(k =>
    (k.kanji||"").includes(search) ||
    (k.meaning||"").toLowerCase().includes(search) ||
    (k.reading||"").toLowerCase().includes(search)
  );
  c.innerHTML = filtered.length
    ? filtered.map(k => `
      <div class="kanji-card">
        <div class="kanji-char">${escapeHtml(k.kanji)}</div>
        <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.reading)}</div>
        <div class="text-sm font-bold mt-2 text-white">${escapeHtml(k.meaning)}</div>
        <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.level||"N5")}</div>
      </div>`).join("")
    : `<div class="col-span-full text-center text-gray-400 py-8">No kanji matching "${escapeHtml(search)}"</div>`;
}

/* ---------- VOCABULARY ---------- */
function loadVocabularyAdmin(){
  db.ref("vocabulary").once("value").then(snap => {
    const data = snap.val() || {};
    state.vocabulary = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderVocabularyAdminList();
  }).catch(() => {});
}

function renderVocabularyAdminList(){
  const c = $("adminVocabList"); if(!c) return;
  c.innerHTML = state.vocabulary.length
    ? state.vocabulary.map(w => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(w.japanese)} - ${escapeHtml(w.meaning)}</div>
            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(w.reading)} • ${escapeHtml(w.level||"N5")}</div>
          </div>
          <button onclick="deleteVocabularyWord('${w.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No vocabulary yet</div>`;
}

function toggleVocabForm(){
  const f = $("vocabFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addVocabularyWord(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const japanese = $("vocabJapanese").value.trim();
  const reading = $("vocabReading").value.trim();
  const meaning = $("vocabMeaning").value.trim();
  if(!japanese || !reading || !meaning){ showToast("Japanese, reading, meaning required", true); return; }
  db.ref("vocabulary").push({
    japanese, reading, meaning,
    example: $("vocabExample").value.trim(),
    level: $("vocabLevel").value || "N5",
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Vocabulary added!");
    ["vocabJapanese","vocabReading","vocabMeaning","vocabExample"].forEach(id => $(id).value = "");
    loadVocabularyAdmin();
    $("vocabFormContainer").classList.add("hidden");
  }).catch(() => showToast("❌ Error adding vocab", true));
}

function deleteVocabularyWord(id){
  if(!state.adminLoggedIn || !confirm("Delete this word?")) return;
  db.ref("vocabulary/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadVocabularyAdmin(); });
}

/* ---------- VOCABULARY USER ---------- */
function openVocabulary(level){
  const m = $("vocabularyModal");
  m.classList.remove("hidden"); m.classList.add("flex");
  db.ref("vocabulary").orderByChild("level").equalTo(level || "N5").once("value").then(snap => {
    const data = snap.val() || {};
    const words = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    const c = $("vocabularyContainer");
    c.innerHTML = words.length
      ? `<div class="grid gap-3 sm:grid-cols-2">${words.map(w => `
          <div class="vocab-card">
            <div class="text-3xl font-black text-rose-400">${escapeHtml(w.japanese)}</div>
            <div class="text-xs text-gray-400 mt-1">${escapeHtml(w.reading)}</div>
            <div class="text-lg font-bold mt-2 text-white">${escapeHtml(w.meaning)}</div>
            ${w.example ? `<div class="text-xs text-gray-400 mt-2">${escapeHtml(w.example)}</div>` : ""}
          </div>`).join("")}</div>`
      : `<div class="text-center text-gray-400 py-8">No vocabulary for ${escapeHtml(level)} yet.</div>`;
  }).catch(() => {
    $("vocabularyContainer").innerHTML = `<div class="text-center text-red-300 py-8">Could not load vocabulary.</div>`;
  });
}

function closeVocabulary(){
  const m = $("vocabularyModal");
  m.classList.add("hidden"); m.classList.remove("flex");
}

/* ---------- LISTENING ---------- */
function loadListeningAdmin(){
  db.ref("listening").once("value").then(snap => {
    const data = snap.val() || {};
    state.listening = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderListeningAdminList();
  }).catch(() => {});
}

function renderListeningAdminList(){
  const c = $("adminListeningList"); if(!c) return;
  c.innerHTML = state.listening.length
    ? state.listening.map(l => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(l.title)}</div>
            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(l.level||"N5")}</div>
          </div>
          <button onclick="deleteListening('${l.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No listening exercises yet</div>`;
}

function toggleListeningForm(){
  const f = $("listeningFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addListening(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("listeningTitle").value.trim();
  const audioUrl = $("listeningAudioUrl").value.trim();
  if(!title || !audioUrl){ showToast("Title and audio URL required", true); return; }
  db.ref("listening").push({
    title, audioUrl,
    level: $("listeningLevel").value.trim() || "N5",
    transcript: $("listeningTranscript").value.trim(),
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Listening added!");
    ["listeningTitle","listeningAudioUrl","listeningLevel","listeningTranscript"].forEach(id => $(id).value = "");
    loadListeningAdmin();
    $("listeningFormContainer").classList.add("hidden");
  }).catch(() => showToast("❌ Error adding listening", true));
}

function deleteListening(id){
  if(!state.adminLoggedIn || !confirm("Delete this exercise?")) return;
  db.ref("listening/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadListeningAdmin(); });
}

function openListeningPractice(){ const s = $("listeningSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); renderListening(); }
function closeListeningPractice(){ $("listeningSection").classList.add("hidden"); }

function renderListening(){
  const c = $("listeningGrid"); if(!c) return;
  c.innerHTML = state.listening.length
    ? state.listening.map(l => `
      <div class="glass rounded-2xl p-4 border border-rose-500/10 hover:border-rose-500/30 transition">
        <div class="text-rose-400 font-bold text-sm">${escapeHtml(l.level||"N5")}</div>
        <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(l.title)}</h3>
        <audio controls src="${safeUrl(l.audioUrl)}" class="w-full mt-3"></audio>
        ${l.transcript ? `<details class="mt-2"><summary class="text-xs text-gray-400 cursor-pointer">Show Transcript</summary><p class="text-xs text-gray-400 mt-1">${escapeHtml(l.transcript)}</p></details>` : ""}
      </div>`).join("")
    : `<div class="col-span-full text-center text-gray-400 py-8">No listening exercises yet</div>`;
}

/* ---------- READING ---------- */
function loadReadingAdmin(){
  db.ref("reading").once("value").then(snap => {
    const data = snap.val() || {};
    state.reading = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderReadingAdminList();
  }).catch(() => {});
}

function renderReadingAdminList(){
  const c = $("adminReadingList"); if(!c) return;
  c.innerHTML = state.reading.length
    ? state.reading.map(r => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(r.title)}</div>
            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(r.level||"N5")}</div>
          </div>
          <button onclick="deleteReading('${r.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No reading exercises yet</div>`;
}

function toggleReadingForm(){
  const f = $("readingFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addReading(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("readingTitle").value.trim();
  const content = $("readingContent").value.trim();
  if(!title || !content){ showToast("Title and content required", true); return; }
  db.ref("reading").push({
    title, content,
    level: $("readingLevel").value.trim() || "N5",
    translation: $("readingTranslation").value.trim(),
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Reading added!");
    ["readingTitle","readingLevel","readingContent","readingTranslation"].forEach(id => $(id).value = "");
    loadReadingAdmin();
    $("readingFormContainer").classList.add("hidden");
  }).catch(() => showToast("❌ Error adding reading", true));
}

function deleteReading(id){
  if(!state.adminLoggedIn || !confirm("Delete this reading?")) return;
  db.ref("reading/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadReadingAdmin(); });
}

function openReadingPractice(){ const s = $("readingSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); renderReading(); }
function closeReadingPractice(){ $("readingSection").classList.add("hidden"); }

function renderReading(){
  const c = $("readingGrid"); if(!c) return;
  c.innerHTML = state.reading.length
    ? state.reading.map(r => `
      <div class="glass rounded-2xl p-4 border border-rose-500/10 hover:border-rose-500/30 transition">
        <div class="text-rose-400 font-bold text-sm">${escapeHtml(r.level||"N5")}</div>
        <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(r.title)}</h3>
        <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(r.content)}</p>
        ${r.translation ? `<details class="mt-2"><summary class="text-xs text-gray-400 cursor-pointer">Show Translation</summary><p class="text-xs text-gray-400 mt-1">${escapeHtml(r.translation)}</p></details>` : ""}
      </div>`).join("")
    : `<div class="col-span-full text-center text-gray-400 py-8">No reading exercises yet</div>`;
}

/* ---------- LESSON PLANS ---------- */
function loadLessonPlansAdmin(){
  db.ref("lessonPlans").once("value").then(snap => {
    const data = snap.val() || {};
    state.lessonPlans = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderLessonPlanAdminList();
  }).catch(() => {});
}

function renderLessonPlanAdminList(){
  const c = $("adminLessonPlanList"); if(!c) return;
  c.innerHTML = state.lessonPlans.length
    ? state.lessonPlans.map(lp => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(lp.title)}</div>
            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(lp.level||"N5")} • ${escapeHtml(lp.duration||"")}</div>
          </div>
          <button onclick="deleteLessonPlan('${lp.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No lesson plans yet</div>`;
}

function toggleLessonPlanForm(){
  const f = $("lessonPlanFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addLessonPlan(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("lessonPlanTitle").value.trim();
  const description = $("lessonPlanDescription").value.trim();
  if(!title || !description){ showToast("Title and description required", true); return; }
  db.ref("lessonPlans").push({
    title, description,
    level: $("lessonPlanLevel").value.trim() || "N5",
    duration: $("lessonPlanDuration").value.trim(),
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Lesson plan added!");
    ["lessonPlanTitle","lessonPlanLevel","lessonPlanDescription","lessonPlanDuration"].forEach(id => $(id).value = "");
    loadLessonPlansAdmin();
    $("lessonPlanFormContainer").classList.add("hidden");
  }).catch(() => showToast("❌ Error adding lesson plan", true));
}

function deleteLessonPlan(id){
  if(!state.adminLoggedIn || !confirm("Delete this lesson plan?")) return;
  db.ref("lessonPlans/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadLessonPlansAdmin(); });
}

function openLessonPlans(){ const s = $("lessonPlansSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); renderLessonPlans(); }
function closeLessonPlans(){ $("lessonPlansSection").classList.add("hidden"); }

function renderLessonPlans(){
  const c = $("lessonPlansGrid"); if(!c) return;
  c.innerHTML = state.lessonPlans.length
    ? state.lessonPlans.map(lp => `
      <div class="glass rounded-2xl p-4 border border-rose-500/10 hover:border-rose-500/30 transition">
        <div class="text-rose-400 font-bold text-sm">${escapeHtml(lp.level||"N5")} • ${escapeHtml(lp.duration||"")}</div>
        <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(lp.title)}</h3>
        <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(lp.description)}</p>
      </div>`).join("")
    : `<div class="col-span-full text-center text-gray-400 py-8">No lesson plans yet</div>`;
}

/* ---------- BADGES ---------- */
function loadBadgesAdmin(){
  db.ref("badges").once("value").then(snap => {
    const data = snap.val() || {};
    state.badges = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderBadgeAdminList();
  }).catch(() => {});
}

function renderBadgeAdminList(){
  const c = $("adminBadgeList"); if(!c) return;
  c.innerHTML = state.badges.length
    ? state.badges.map(b => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(b.name)} ${escapeHtml(b.icon||"")}</div>
            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(b.tier||"bronze")} • ${escapeHtml(b.requirement||"")}</div>
          </div>
          <button onclick="deleteBadge('${b.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No badges yet</div>`;
}

function toggleBadgeForm(){
  const f = $("badgeFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addBadge(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const name = $("badgeName").value.trim();
  const requirement = $("badgeRequirement").value.trim();
  if(!name || !requirement){ showToast("Name and requirement required", true); return; }
  db.ref("badges").push({
    name, requirement,
    icon: $("badgeIcon").value.trim() || "🏆",
    tier: $("badgeTier").value || "bronze",
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ Badge added!");
    ["badgeName","badgeIcon","badgeRequirement"].forEach(id => $(id).value = "");
    loadBadgesAdmin();
    $("badgeFormContainer").classList.add("hidden");
  }).catch(() => showToast("❌ Error adding badge", true));
}

function deleteBadge(id){
  if(!state.adminLoggedIn || !confirm("Delete this badge?")) return;
  db.ref("badges/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadBadgesAdmin(); });
}

function openBadges(){ const s = $("badgesSection"); s.classList.remove("hidden"); s.scrollIntoView({behavior:"smooth"}); renderBadges(); }
function closeBadges(){ $("badgesSection").classList.add("hidden"); }

function renderBadges(){
  const c = $("badgesGrid"); if(!c) return;
  c.innerHTML = state.badges.length
    ? state.badges.map(b => `
      <div class="badge-item ${b.tier||"bronze"}">
        ${escapeHtml(b.icon||"🏆")} ${escapeHtml(b.name)}
      </div>`).join("")
    : `<div class="col-span-full text-center text-gray-400 py-8">No badges yet. Complete milestones to earn badges!</div>`;
}

/* ---------- USERS ADMIN ---------- */
function loadUsersAdmin(){
  db.ref("users").once("value").then(snap => {
    const data = snap.val() || {};
    const container = $("adminUsersList");
    if(!container) return;
    const search = ($("userSearch")?.value || "").toLowerCase();
    const filtered = Object.entries(data)
      .filter(([uid, d]) => {
        const em = (d.email || "").toLowerCase();
        const nm = (d.displayName || "").toLowerCase();
        return em.includes(search) || nm.includes(search);
      })
      .slice(0, 50);

    container.innerHTML = filtered.length
      ? filtered.map(([uid, d]) => `
        <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate text-white">${escapeHtml(d.displayName || d.email || "User")}</div>
              <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(d.email||"")} • 🔥 ${(d.streak&&d.streak.count)||0} days • role: ${escapeHtml(d.role||"student")}</div>
            </div>
            <button onclick="deleteUser('${uid}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("")
      : `<div class="text-xs text-gray-400">No users found</div>`;
  }).catch(() => {});
}

function filterUsers(){ loadUsersAdmin(); }

function deleteUser(uid){
  if(!state.adminLoggedIn || !confirm("Delete this user record? (Does not delete their login)")) return;
  db.ref("users/" + uid).remove().then(() => { showToast("🗑️ User record deleted"); loadUsersAdmin(); });
}