/* ============================================================
   SL Sakura — features.js
   Admin CRUD: resources, news, ads, quiz, flashcards, backup,
   CSV import, subcategories, admin list rendering.
   ============================================================ */

/* ---------- Admin lists ---------- */
function renderAdminLists(){
  if(!state.adminLoggedIn) return;

  const search = ($("adminSearch")?.value || "").toLowerCase();
  const cat = $("adminCategoryFilter")?.value || "all";

  let resources = state.resources;
  if(search) resources = resources.filter(r => (r.title||"").toLowerCase().includes(search));
  if(cat !== "all") resources = resources.filter(r => r.mainCategory === cat);

  const rEl = $("adminResourcesList");
  if(rEl){
    rEl.innerHTML = resources.length
      ? resources.map(r => `
        <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate text-white">${escapeHtml(r.title||"Untitled")}</div>
              <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(r.mainCategory||"")} • ${escapeHtml(r.mediaType||"")} <span class="text-rose-100/30">(${r.viewCount||0} views)</span></div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button onclick="editResource('${r.id}')" class="rounded-lg bg-yellow-500/10 px-2 py-1 text-[10px] font-bold text-yellow-300 hover:bg-yellow-500/20"><i class="fa-solid fa-pen"></i></button>
              <button onclick="deleteResource('${r.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>`).join("")
      : `<div class="text-xs text-gray-400">No resources found</div>`;
  }

  const nEl = $("adminNewsList");
  if(nEl){
    nEl.innerHTML = state.news.length
      ? state.news.map(n => `
        <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate text-white">${escapeHtml(n.title)}</div>
              <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(n.category||"UPDATE")}</div>
            </div>
            <button onclick="deleteNews('${n.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("")
      : `<div class="text-xs text-gray-400">No news</div>`;
  }

  const aEl = $("adminAdsList");
  if(aEl){
    aEl.innerHTML = state.advertisements.length
      ? state.advertisements.map(a => `
        <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate text-white">${escapeHtml(a.title)}</div>
              <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(a.placement||"")}</div>
            </div>
            <button onclick="deleteAdvertisement('${a.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("")
      : `<div class="text-xs text-gray-400">No advertisements</div>`;
  }
}

function filterAdminResources(){ renderAdminLists(); }

/* ---------- Resource form ---------- */
function toggleResourceForm(){
  const f = $("resourceFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function updateAdminSubcats(){
  const main = $("resourceMainCategory").value;
  const list = categorySubs[main] || ["All"];
  $("resourceSubCategory").innerHTML = list.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
}

function updateDownloadField(){
  const type = $("resourceMediaType").value;
  const inp = $("resourceDownloadUrl");
  if(type === "youtube"){ inp.value = ""; inp.placeholder = "Not required for YouTube"; inp.disabled = true; inp.classList.add("opacity-40"); }
  else{ inp.placeholder = "Download URL (optional)"; inp.disabled = false; inp.classList.remove("opacity-40"); }
}

function getResourceFormData(){
  const title = $("resourceTitle").value.trim();
  const preview = $("resourcePreviewUrl").value.trim();
  if(!title || !preview){ showToast("Title and Preview URL required", true); return null; }
  return {
    title,
    mainCategory: $("resourceMainCategory").value,
    subCategory: $("resourceSubCategory").value,
    lecturer: $("resourceLecturer").value.trim(),
    lecturerContact: $("resourceLecturerContact").value.trim() || "0789995159",
    mediaType: $("resourceMediaType").value,
    previewUrl: preview,
    thumbnailUrl: $("resourceThumbnail").value.trim(),
    description: $("resourceDescription").value.trim(),
    downloadUrl: $("resourceDownloadUrl").value.trim(),
    updatedAt: Date.now()
  };
}

function clearResourceForm(){
  ["resourceTitle","resourceLecturer","resourceLecturerContact","resourcePreviewUrl","resourceThumbnail","resourceDescription","resourceDownloadUrl"].forEach(id => $(id).value = "");
  $("resourceMainCategory").value = "N5"; updateAdminSubcats();
  $("resourceSubCategory").value = "All";
  $("resourceMediaType").value = "pdf"; updateDownloadField();
}

function addResource(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const data = getResourceFormData(); if(!data) return;
  data.createdAt = Date.now();
  db.ref("resources").push(data)
    .then(() => { showToast("✅ Resource added"); clearResourceForm(); loadResourcesPaginated(false); toggleResourceForm(); })
    .catch(() => showToast("❌ Error adding resource", true));
}

function editResource(id){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const r = state.resources.find(x => x.id === id);
  if(!r){ showToast("Resource not found", true); return; }
  state.editingResourceId = id;
  $("resourceTitle").value = r.title || "";
  $("resourceMainCategory").value = r.mainCategory || "N5"; updateAdminSubcats();
  $("resourceSubCategory").value = r.subCategory || "All";
  $("resourceLecturer").value = r.lecturer || "";
  $("resourceLecturerContact").value = r.lecturerContact || "0789995159";
  $("resourceMediaType").value = r.mediaType || "pdf";
  $("resourcePreviewUrl").value = r.previewUrl || "";
  $("resourceThumbnail").value = r.thumbnailUrl || "";
  $("resourceDescription").value = r.description || "";
  $("resourceDownloadUrl").value = r.downloadUrl || "";
  updateDownloadField();
  $("addResourceBtn").classList.add("hidden");
  $("updateResourceBtn").classList.remove("hidden");
  $("cancelEditBtn").classList.remove("hidden");
  $("resourceFormContainer").classList.remove("hidden");
  $("resourceFormContainer").classList.add("editing-mode");
  $("resourceFormContainer").scrollIntoView({behavior:"smooth"});
  showToast("✏️ Editing: " + r.title);
}

function updateResource(){
  if(!state.adminLoggedIn || !state.editingResourceId){ showToast("No resource being edited", true); return; }
  const data = getResourceFormData(); if(!data) return;
  db.ref("resources/" + state.editingResourceId).update(data)
    .then(() => { showToast("✅ Resource updated"); cancelEditResource(); loadResourcesPaginated(false); })
    .catch(() => showToast("❌ Error updating resource", true));
}

function cancelEditResource(){
  state.editingResourceId = null;
  clearResourceForm();
  $("addResourceBtn").classList.remove("hidden");
  $("updateResourceBtn").classList.add("hidden");
  $("cancelEditBtn").classList.add("hidden");
  $("resourceFormContainer").classList.remove("editing-mode");
}

function deleteResource(id){
  if(!state.adminLoggedIn || !confirm("Delete this resource?")) return;
  db.ref("resources/" + id).remove()
    .then(() => { showToast("🗑️ Deleted"); loadResourcesPaginated(false); })
    .catch(() => showToast("Error deleting", true));
}

/* ---------- News CRUD ---------- */
function addNews(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("newsTitle").value.trim();
  const desc = $("newsDescription").value.trim();
  if(!title || !desc){ showToast("Title and description required", true); return; }
  db.ref("news").push({
    title,
    category: $("newsCategory").value,
    description: desc,
    link: $("newsLink").value.trim(),
    createdAt: Date.now()
  }).then(() => {
    showToast("✅ News published");
    $("newsTitle").value = ""; $("newsDescription").value = ""; $("newsLink").value = "";
    loadNewsAndAds();
  }).catch(() => showToast("❌ Error publishing", true));
}

function deleteNews(id){
  if(!state.adminLoggedIn || !confirm("Delete this news?")) return;
  db.ref("news/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadNewsAndAds(); });
}

/* ---------- Ads CRUD ---------- */
function addAdvertisement(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const title = $("adTitle").value.trim();
  const img = $("adImageUrl").value.trim();
  const link = $("adLink").value.trim();
  if(!title || !img || !link){ showToast("All fields required", true); return; }
  db.ref("advertisements").push({
    title, imageUrl: img, link,
    placement: $("adPlacement").value,
    active: true, createdAt: Date.now()
  }).then(() => {
    showToast("✅ Ad published");
    $("adTitle").value = ""; $("adImageUrl").value = ""; $("adLink").value = "";
    loadNewsAndAds();
  }).catch(() => showToast("❌ Error publishing ad", true));
}

function deleteAdvertisement(id){
  if(!state.adminLoggedIn || !confirm("Delete this ad?")) return;
  db.ref("advertisements/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadNewsAndAds(); });
}

/* ---------- Quiz CRUD ---------- */
function loadQuizzes(){
  db.ref("quizzes").once("value").then(snap => {
    const data = snap.val() || {};
    state.quizzes = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderQuizAdminList();
  }).catch(() => {});
}

function renderQuizAdminList(){
  const c = $("adminQuizList"); if(!c) return;
  c.innerHTML = state.quizzes.length
    ? state.quizzes.map(q => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(q.question||"")}</div>
            <div class="mt-1 text-[10px] text-gray-400">Answer: ${escapeHtml((q.options&&q.options[q.correct])||"")}</div>
          </div>
          <button onclick="deleteQuizQuestion('${q.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No quiz questions yet</div>`;
}

function toggleQuizForm(){
  const f = $("quizFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addQuizQuestion(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const q = $("quizQuestion").value.trim();
  const options = [$("quizOption1").value.trim(), $("quizOption2").value.trim(), $("quizOption3").value.trim(), $("quizOption4").value.trim()];
  if(!q || options.some(o => !o)){ showToast("Question and all 4 options required", true); return; }
  db.ref("quizzes").push({ question: q, options, correct: Number($("quizCorrect").value), createdAt: Date.now() })
    .then(() => {
      showToast("✅ Quiz question added");
      ["quizQuestion","quizOption1","quizOption2","quizOption3","quizOption4"].forEach(id => $(id).value = "");
      $("quizCorrect").value = "0";
      loadQuizzes();
      toggleQuizForm();
    }).catch(() => showToast("❌ Error adding question", true));
}

function deleteQuizQuestion(id){
  if(!state.adminLoggedIn || !confirm("Delete this question?")) return;
  db.ref("quizzes/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadQuizzes(); });
}

function cancelEditQuiz(){ /* placeholder */ }

/* ---------- Flashcards CRUD ---------- */
function loadFlashcards(){
  db.ref("flashcards").once("value").then(snap => {
    const data = snap.val() || {};
    state.flashcards = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    renderFlashcardAdminList();
  }).catch(() => {});
}

function renderFlashcardAdminList(){
  const c = $("adminFlashcardList"); if(!c) return;
  c.innerHTML = state.flashcards.length
    ? state.flashcards.map(f => `
      <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate text-white">${escapeHtml(f.front||"")}</div>
            <div class="mt-1 text-[10px] text-gray-400">→ ${escapeHtml(f.back||"")} • ${escapeHtml(f.category||"General")}</div>
          </div>
          <button onclick="deleteFlashcard('${f.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join("")
    : `<div class="text-xs text-gray-400">No flashcards yet</div>`;
}

function toggleFlashcardForm(){
  const f = $("flashcardFormContainer"); if(!f) return;
  f.classList.toggle("hidden");
  if(!f.classList.contains("hidden")) f.scrollIntoView({behavior:"smooth", block:"center"});
}

function addFlashcard(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const front = $("flashcardFront").value.trim();
  const back = $("flashcardBack").value.trim();
  if(!front || !back){ showToast("Front and back required", true); return; }
  db.ref("flashcards").push({ front, back, category: $("flashcardCategory").value, createdAt: Date.now() })
    .then(() => {
      showToast("✅ Flashcard added");
      $("flashcardFront").value = ""; $("flashcardBack").value = "";
      loadFlashcards(); toggleFlashcardForm();
    }).catch(() => showToast("❌ Error adding flashcard", true));
}

function deleteFlashcard(id){
  if(!state.adminLoggedIn || !confirm("Delete this flashcard?")) return;
  db.ref("flashcards/" + id).remove().then(() => { showToast("🗑️ Deleted"); loadFlashcards(); });
}

function cancelEditFlashcard(){ /* placeholder */ }
function updateFlashcard(){ /* TODO: implement edit mode */ }

/* ---------- Backup / Restore ---------- */
function exportData(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const data = {
    resources: state.resources, news: state.news, advertisements: state.advertisements,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `slsakura-backup-${Date.now()}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast("✅ Data exported!");
}

function importData(event){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const file = event.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const data = JSON.parse(e.target.result);
      if(!data.resources){ showToast("Invalid backup file", true); return; }
      if(!confirm(`Import ${data.resources.length} resources?`)) return;
      const promises = [];
      data.resources.forEach(r => { const {id, ...rest} = r; promises.push(db.ref("resources/" + id).set(rest)); });
      (data.news||[]).forEach(n => { const {id, ...rest} = n; promises.push(db.ref("news/" + id).set(rest)); });
      (data.advertisements||[]).forEach(a => { const {id, ...rest} = a; promises.push(db.ref("advertisements/" + id).set(rest)); });
      Promise.all(promises).then(() => {
        showToast("✅ Data imported!");
        loadResourcesPaginated(false); loadNewsAndAds();
      }).catch(() => showToast("Error importing", true));
    }catch(err){ showToast("Invalid JSON", true); }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function importCSV(event){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const file = event.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const lines = e.target.result.split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const resources = [];
    for(let i=1; i<lines.length; i++){
      const values = lines[i].split(",").map(v => v.trim());
      if(values.length < 2 || !values[0]) continue;
      const obj = {};
      headers.forEach((h, idx) => obj[h] = values[idx] || "");
      resources.push({
        title: obj.title || "Untitled",
        mainCategory: obj.category || "N5",
        subCategory: obj.subCategory || "All",
        lecturer: obj.lecturer || "",
        mediaType: obj.mediaType || "pdf",
        previewUrl: obj.previewUrl || "",
        description: obj.description || "",
        createdAt: Date.now()
      });
    }
    if(!resources.length){ showToast("No valid rows", true); return; }
    if(!confirm(`Import ${resources.length} resources?`)) return;
    Promise.all(resources.map(r => db.ref("resources").push(r)))
      .then(() => { showToast(`✅ Imported ${resources.length} resources`); loadResourcesPaginated(false); })
      .catch(() => showToast("Error importing CSV", true));
  };
  reader.readAsText(file);
  event.target.value = "";
}

/* ---------- Refresh All ---------- */
function refreshAllData(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  showToast("🔄 Refreshing...");
  loadResourcesPaginated(false);
  loadNewsAndAds();
  if(typeof loadQuizzes === "function") loadQuizzes();
  if(typeof loadFlashcards === "function") loadFlashcards();
  if(typeof updateLeaderboard === "function") updateLeaderboard(true);
}

/* ---------- Sitemap ---------- */
function generateSitemap(){
  if(!state.adminLoggedIn){ showToast("Admin login required", true); return; }
  const baseUrl = window.location.origin;
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `<url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
  state.resources.forEach(r => {
    xml += `<url><loc>${baseUrl}/?resource=${r.id}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
  });
  xml += "</urlset>";
  const blob = new Blob([xml], {type:"application/xml"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "sitemap.xml"; a.click();
  URL.revokeObjectURL(url);
  showToast("✅ Sitemap generated!");
}

/* ---------- Wire up form listeners on DOM ready ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const mc = $("resourceMainCategory"); if(mc) mc.addEventListener("change", updateAdminSubcats);
  const mt = $("resourceMediaType"); if(mt) mt.addEventListener("change", updateDownloadField);
  const ap = $("adminPassword"); if(ap) ap.addEventListener("keydown", e => { if(e.key === "Enter") loginAdmin(); });
});