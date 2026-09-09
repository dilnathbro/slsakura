/* SL Sakura stability repair: restores missing quiz/flashcard functions,
   keeps member features visible after login, and syncs user profiles. */
(function(){
  'use strict';
  const esc = v => { const d=document.createElement('div'); d.textContent=String(v ?? ''); return d.innerHTML; };
  const byId = id => document.getElementById(id);
  const toast = (m,err=false) => typeof window.showToast==='function' ? window.showToast(m,err) : console.log(m);
  const showModal = id => { const el=byId(id); if(!el) return false; el.classList.remove('hidden'); el.classList.add('flex'); return true; };
  const hideModal = id => { const el=byId(id); if(!el) return; el.classList.add('hidden'); el.classList.remove('flex'); };
  const getDb = () => window.db || (typeof db!=='undefined'?db:null);
  const getState = () => window.state || (typeof state!=='undefined'?state:null);

  function syncUserProfile(user){
    const database=getDb();
    if(!user || !database) return;
    const ref=database.ref('users/'+user.uid);
    ref.once('value').then(s=>{
      const old=s.val()||{};
      return ref.update({
        email:user.email||old.email||'',
        displayName:user.displayName||old.displayName||'',
        photoURL:user.photoURL||old.photoURL||'',
        createdAt:old.createdAt||Date.now(),
        lastLoginAt:Date.now(),
        role:old.role||'student'
      });
    }).catch(e=>console.warn('User profile sync failed',e));
  }

  const previewMap={
    'Favorites':'openFavorites','Progress':'openStudyProgress','Streak':'openDailyChallenge','Leaderboard':'openLeaderboard','Badges':'openBadges',
    'Ratings':'openRatingsFeature','Comments':'openCommentsFeature','Daily Email':'openDailyEmailFeature','Personalized Learning Path':'openLearningPath',
    'Resource Collections':'openCollections','Daily Japanese Challenge':'openDailyChallenge','Advanced Resource Filters':'openAdvancedFilters',
    'Japanese Study Assistant':'toggleChatbot','Study Planner':'openStudyPlanner','Download Center':'openDownloadCenter'
  };
  function runPreviewFeature(name){
    if(!window.auth?.currentUser){ if(typeof window.openLoginModal==='function') window.openLoginModal(); return; }
    if(name==='Advanced Resource Filters'){
      const f=byId('slAdvancedFilters'); if(f){f.scrollIntoView({behavior:'smooth',block:'center'});return;}
    }
    const fn=previewMap[name];
    if(fn && typeof window[fn]==='function') return window[fn]();
    toast(name+' is ready for your account.');
  }
  function syncMemberPreview(){
    const root=byId('loginFeatures'); if(!root) return;
    const logged=!!window.auth?.currentUser;
    root.classList.remove('hidden');
    const heading=root.querySelector('.text-sm.font-bold.text-white');
    const sub=root.querySelector('.text-xs.text-gray-400');
    if(heading) heading.textContent=logged?'✨ Member Features Unlocked!':'🔐 Login to Unlock More Features!';
    if(sub) sub.textContent=logged?'All available learning tools are unlocked for your account.':'Get personalized learning experience';
    root.querySelectorAll('.grid button').forEach(btn=>{
      const title=btn.querySelector('.text-\\[10px\\]')?.textContent?.trim();
      if(!title) return;
      btn.onclick=()=>runPreviewFeature(title);
      btn.setAttribute('aria-label',title);
      btn.classList.toggle('member-feature-unlocked',logged);
    });
    const note=root.querySelector('.mt-3.text-center.text-\\[9px\\]');
    if(note) note.textContent=logged?'✨ Tap any feature to open it.':'🔒 Login to unlock all member features';
  }

  // ---------- Quiz ----------
  function normalizeQuiz(id,v){
    const raw=v||{};
    const options=Array.isArray(raw.options)?raw.options:[raw.option1,raw.option2,raw.option3,raw.option4].filter(x=>x!==undefined&&x!==null&&x!=='');
    let correct=raw.correctIndex;
    if(correct===undefined) correct=raw.correct;
    if(typeof correct==='string' && /^\d+$/.test(correct)) correct=Number(correct);
    if(typeof correct==='string' && correct.length===1 && /[A-D]/i.test(correct)) correct=correct.toUpperCase().charCodeAt(0)-65;
    if(typeof correct!=='number') correct=0;
    return {id,question:raw.question||raw.title||'Untitled question',options,correctIndex:Math.max(0,Math.min(options.length-1,correct)),createdAt:raw.createdAt||0};
  }
  async function ensureQuizzes(){
    const st=getState(), database=getDb(); if(!st||!database) return [];
    try{const snap=await database.ref('quizzes').once('value');st.quizzes=Object.entries(snap.val()||{}).map(([id,v])=>normalizeQuiz(id,v));return st.quizzes;}catch(e){console.error(e);return st.quizzes||[];}
  }
  window.loadQuizzes=ensureQuizzes;
  window.openQuiz=async function(){
    showModal('quizModal');
    const box=byId('quizContainer'); if(!box) return;
    box.innerHTML='<div class="text-sm text-gray-400 p-4 text-center">Loading quiz...</div>';
    const list=await ensureQuizzes();
    if(!list.length){box.innerHTML='<div class="text-center text-gray-400 p-6">No quiz questions available yet.</div>';return;}
    let i=0,score=0;
    function render(){
      const q=list[i];
      box.innerHTML=`<div class="text-xs text-rose-300 mb-2">Question ${i+1} of ${list.length}</div><h3 class="text-lg font-black text-white mb-4">${esc(q.question)}</h3><div class="space-y-2">${q.options.map((o,n)=>`<button class="w-full text-left rounded-2xl border border-rose-500/15 bg-white/5 p-3 hover:bg-rose-500/10 transition" data-q-option="${n}">${esc(o)}</button>`).join('')}</div><div class="mt-4 text-xs text-gray-400">Score: ${score}</div>`;
      box.querySelectorAll('[data-q-option]').forEach(b=>b.onclick=()=>{
        const n=Number(b.dataset.qOption); if(n===q.correctIndex) score++;
        b.parentElement.querySelectorAll('button').forEach((x,idx)=>{x.disabled=true;x.classList.add(idx===q.correctIndex?'border-green-400':'opacity-60');});
        setTimeout(()=>{i++; if(i<list.length) render(); else box.innerHTML=`<div class="text-center p-6"><div class="text-5xl">🏆</div><h3 class="mt-3 text-xl font-black text-white">Quiz complete!</h3><p class="mt-2 text-gray-400">You scored ${score} / ${list.length}</p><button class="rose-btn mt-4 px-5 py-2" onclick="openQuiz()">Try Again</button></div>`;},500);
      });
    } render();
  };
  window.closeQuiz=()=>hideModal('quizModal');

  // ---------- Flashcards ----------
  function normalizeCard(id,v){const x=v||{};return {id,front:x.front||x.question||x.word||'',back:x.back||x.answer||x.meaning||'',category:x.category||'General',createdAt:x.createdAt||0};}
  async function ensureFlashcards(){const st=getState(),database=getDb();if(!st||!database)return[];try{const snap=await database.ref('flashcards').once('value');st.flashcards=Object.entries(snap.val()||{}).map(([id,v])=>normalizeCard(id,v));return st.flashcards;}catch(e){console.error(e);return st.flashcards||[];}}
  window.loadFlashcards=ensureFlashcards;
  window.openFlashcards=async function(){showModal('flashcardModal');const box=byId('flashcardContainer');if(!box)return;box.innerHTML='<div class="text-center text-gray-400 p-5">Loading flashcards...</div>';const list=await ensureFlashcards();if(!list.length){box.innerHTML='<div class="text-center text-gray-400 p-6">No flashcards available yet.</div>';return;}let i=0,flipped=false;function render(){const c=list[i];box.innerHTML=`<div class="text-center text-xs text-rose-300 mb-3">Card ${i+1} of ${list.length}</div><button id="flashcardFace" class="w-full min-h-48 rounded-3xl border border-rose-500/20 bg-white/5 p-6 text-center"><div class="text-xs text-gray-400 mb-3">${flipped?'ANSWER':'TAP TO FLIP'}</div><div class="text-2xl font-black text-white">${esc(flipped?c.back:c.front)}</div><div class="mt-4 text-xs text-gray-500">${esc(c.category)}</div></button><div class="mt-4 flex justify-between gap-2"><button id="flashPrev" class="action-btn">← Previous</button><button id="flashNext" class="rose-btn">Next →</button></div>`;byId('flashcardFace').onclick=()=>{flipped=!flipped;render();};byId('flashPrev').onclick=()=>{i=(i-1+list.length)%list.length;flipped=false;render();};byId('flashNext').onclick=()=>{i=(i+1)%list.length;flipped=false;render();};}render();};
  window.closeFlashcards=()=>hideModal('flashcardModal');

  // ---------- Admin CRUD for missing Quiz/Flashcard functions ----------
  const adminOk=()=>!!getState()?.adminLoggedIn;
  function formVal(id){return byId(id)?.value?.trim()||'';}
  window.toggleQuizForm=()=>byId('quizFormContainer')?.classList.toggle('hidden');
  window.cancelEditQuiz=()=>{getState().editingQuizId=null;byId('quizFormContainer')?.classList.add('hidden');};
  window.addQuizQuestion=async function(){if(!adminOk())return toast('Admin login required',true);const q=formVal('quizQuestion');const options=[formVal('quizOption1'),formVal('quizOption2'),formVal('quizOption3'),formVal('quizOption4')];if(!q||options.some(x=>!x))return toast('Fill the question and all four options',true);await getDb().ref('quizzes').push({question:q,options,correctIndex:Number(byId('quizCorrect')?.value||0),createdAt:Date.now()});toast('Quiz question added');await ensureQuizzes();window.loadAdminQuizzes?.();};
  window.updateQuizQuestion=async function(){const id=getState()?.editingQuizId;if(!id)return window.addQuizQuestion();if(!adminOk())return;const q=formVal('quizQuestion');const options=[formVal('quizOption1'),formVal('quizOption2'),formVal('quizOption3'),formVal('quizOption4')];await getDb().ref('quizzes/'+id).update({question:q,options,correctIndex:Number(byId('quizCorrect')?.value||0),updatedAt:Date.now()});getState().editingQuizId=null;await ensureQuizzes();window.loadAdminQuizzes?.();toast('Quiz updated');};
  window.editQuizQuestion=async function(id){await ensureQuizzes();const q=getState().quizzes.find(x=>x.id===id);if(!q)return;getState().editingQuizId=id;['quizQuestion','quizOption1','quizOption2','quizOption3','quizOption4'].forEach((k,n)=>{const e=byId(k);if(e)e.value=n===0?q.question:q.options[n-1]||'';});if(byId('quizCorrect'))byId('quizCorrect').value=q.correctIndex;byId('quizFormContainer')?.classList.remove('hidden');};
  window.deleteQuizQuestion=async id=>{if(!adminOk()||!confirm('Delete this quiz question?'))return;await getDb().ref('quizzes/'+id).remove();await ensureQuizzes();window.loadAdminQuizzes?.();};
  window.loadAdminQuizzes=async function(){const c=byId('adminQuizList');if(!c)return;const list=await ensureQuizzes();c.innerHTML=list.length?list.map(q=>`<div class="rounded-xl bg-white/5 p-3 text-sm"><div class="font-bold text-white">${esc(q.question)}</div><div class="mt-2 flex gap-2"><button onclick="editQuizQuestion('${q.id}')" class="action-btn">Edit</button><button onclick="deleteQuizQuestion('${q.id}')" class="action-btn">Delete</button></div></div>`).join(''):'<div class="text-xs text-gray-400">No quiz questions</div>';};

  window.toggleFlashcardForm=()=>byId('flashcardFormContainer')?.classList.toggle('hidden');
  window.cancelEditFlashcard=()=>{getState().editingFlashcardId=null;byId('flashcardFormContainer')?.classList.add('hidden');};
  window.addFlashcard=async function(){if(!adminOk())return toast('Admin login required',true);const front=formVal('flashcardFront'),back=formVal('flashcardBack'),category=byId('flashcardCategory')?.value||'General';if(!front||!back)return toast('Fill both sides of the flashcard',true);await getDb().ref('flashcards').push({front,back,category,createdAt:Date.now()});toast('Flashcard added');await ensureFlashcards();window.loadAdminFlashcards?.();};
  window.updateFlashcard=async function(){const id=getState()?.editingFlashcardId;if(!id)return window.addFlashcard();if(!adminOk())return;await getDb().ref('flashcards/'+id).update({front:formVal('flashcardFront'),back:formVal('flashcardBack'),category:byId('flashcardCategory')?.value||'General',updatedAt:Date.now()});getState().editingFlashcardId=null;await ensureFlashcards();window.loadAdminFlashcards?.();toast('Flashcard updated');};
  window.editFlashcard=async function(id){await ensureFlashcards();const c=getState().flashcards.find(x=>x.id===id);if(!c)return;getState().editingFlashcardId=id;byId('flashcardFront').value=c.front;byId('flashcardBack').value=c.back;if(byId('flashcardCategory'))byId('flashcardCategory').value=c.category;byId('flashcardFormContainer')?.classList.remove('hidden');};
  window.deleteFlashcard=async id=>{if(!adminOk()||!confirm('Delete this flashcard?'))return;await getDb().ref('flashcards/'+id).remove();await ensureFlashcards();window.loadAdminFlashcards?.();};
  window.loadAdminFlashcards=async function(){const c=byId('adminFlashcardList');if(!c)return;const list=await ensureFlashcards();c.innerHTML=list.length?list.map(x=>`<div class="rounded-xl bg-white/5 p-3 text-sm"><div class="font-bold text-white">${esc(x.front)}</div><div class="text-gray-400">${esc(x.back)}</div><div class="mt-2 flex gap-2"><button onclick="editFlashcard('${x.id}')" class="action-btn">Edit</button><button onclick="deleteFlashcard('${x.id}')" class="action-btn">Delete</button></div></div>`).join(''):'<div class="text-xs text-gray-400">No flashcards</div>';};

  // Use the repaired admin list functions whenever the existing panel opens.
  document.addEventListener('DOMContentLoaded',()=>{
    syncMemberPreview();
    const authObj=window.auth;
    if(authObj?.onAuthStateChanged){authObj.onAuthStateChanged(user=>{if(user)syncUserProfile(user);syncMemberPreview();});}
    // Load public learning content without waiting for the admin panel.
    ensureQuizzes(); ensureFlashcards();
  },{once:true});
})();

/* ============================================================
   RESOURCE RECOVERY PATCH
   Keeps all resources in memory, shows 12 first, then Load More.
   This avoids the broken Firebase cursor/startAfter pagination path.
   ============================================================ */
(function () {
  'use strict';

  let resourceRecoveryBusy = false;
  let resourceRecoveryAttempts = 0;

  async function recoverResources() {
    if (resourceRecoveryBusy) return;
    const database = window.db;
    const st = window.state;
    if (!database || !st) return;

    resourceRecoveryBusy = true;
    const loading = document.getElementById('resourceLoading');
    const grid = document.getElementById('resourceGrid');
    const loadWrap = document.getElementById('loadMoreWrap');

    try {
      if (loading) loading.classList.remove('hidden');

      const snapshot = await database.ref('resources').once('value');
      const raw = snapshot.val() || {};
      const items = Object.entries(raw).map(([id, value]) => ({ id, ...(value || {}) }));

      // Keep a stable newest-first source list.
      items.sort((a, b) => {
        const av = Number(a.createdAt || a.updatedAt || 0);
        const bv = Number(b.createdAt || b.updatedAt || 0);
        return bv - av;
      });

      st.resources = items;
      st.visibleCount = 12;
      st.searchQuery = '';
      st.selectedMain = st.selectedMain || 'ALL';
      st.selectedSub = st.selectedSub || 'All';

      // Prevent the old remote cursor code from claiming resources are finished.
      if (typeof pagination !== 'undefined') {
        pagination.lastKey = null;
        pagination.hasMore = items.length > 12;
        pagination.loadedCount = items.length;
        pagination.isLoading = false;
      }

      if (typeof renderMainTabs === 'function') renderMainTabs();
      if (typeof renderSubTabs === 'function') renderSubTabs();
      if (typeof renderResources === 'function') renderResources();
      if (typeof renderAdminLists === 'function') renderAdminLists();
      if (typeof updateAnalytics === 'function') updateAnalytics();

      // Explicitly restore the Load More UI if there are more than 12.
      if (loadWrap) {
        if (items.length > 12) {
          loadWrap.classList.remove('hidden');
          loadWrap.classList.add('flex');
        }
      }

      console.log(`📚 Resource recovery loaded ${items.length} resources`);
    } catch (error) {
      console.error('Resource recovery failed:', error);
      if (grid && (!st.resources || st.resources.length === 0)) {
        grid.innerHTML = `<div class="glass col-span-full rounded-3xl p-6 text-center"><div class="text-xl font-black text-white">Resources could not load</div><div class="mt-2 text-xs text-gray-400">Please refresh the page. If this continues, check Firebase Realtime Database rules.</div><button class="rose-btn mt-4 px-5 py-2" onclick="window.SLReloadResources()">Retry</button></div>`;
      }
    } finally {
      resourceRecoveryBusy = false;
      if (loading) loading.classList.add('hidden');
    }
  }

  window.SLReloadResources = recoverResources;

  // Replace the page's resource refresh entry point with the stable loader.
  window.loadAllData = function () {
    recoverResources();

    // Keep the other independent data sections working.
    const database = window.db;
    const st = window.state;
    if (!database || !st) return;

    database.ref('news').once('value').then(s => {
      st.news = Object.entries(s.val() || {}).map(([id, v]) => ({ id, ...(v || {}) }));
      if (typeof renderNews === 'function') renderNews();
    }).catch(e => console.warn('News load failed:', e));

    database.ref('advertisements').once('value').then(s => {
      st.advertisements = Object.entries(s.val() || {}).map(([id, v]) => ({ id, ...(v || {}) }));
      if (typeof renderAds === 'function') renderAds();
    }).catch(e => console.warn('Advertisements load failed:', e));
  };

  // Override Load More so it always reveals locally loaded resources.
  window.loadMoreResources = function () {
    const st = window.state;
    if (!st) return;
    const total = typeof getFilteredResources === 'function' ? getFilteredResources().length : st.resources.length;
    st.visibleCount = Math.min((Number(st.visibleCount) || 12) + 12, total);
    if (typeof renderResources === 'function') renderResources();
  };

  function bootRecovery() {
    setTimeout(recoverResources, 500);
    setTimeout(() => {
      const st = window.state;
      if ((!st || !Array.isArray(st.resources) || st.resources.length === 0) && resourceRecoveryAttempts < 3) {
        resourceRecoveryAttempts++;
        recoverResources();
      }
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootRecovery, { once: true });
  } else {
    bootRecovery();
  }
})();
