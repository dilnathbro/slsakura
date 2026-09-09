(function(){
  'use strict';
  const DEFAULT_MEMBER_CONFIG={
    enabled:{favorites:true,progress:true,streak:true,leaderboard:true,badges:true,ratings:true,comments:true,dailyEmail:true,learningPath:true,collections:true,dailyChallenge:true,advancedFilters:true,aiAssistant:true,studyPlanner:true,downloads:true},
    roadmap:['Beginner','N5','N4','N3','N2','N1'],
    dailyChallenge:{kanji:'日',reading:'にち / ひ',meaning:'day / sun',vocabulary:'勉強 (べんきょう)',vocabularyMeaning:'study',grammarQuestion:'Choose the natural particle: 日本___行きます。',grammarAnswer:'に'},
    labels:{favorites:'Favorites',progress:'Progress',streak:'Streak',leaderboard:'Leaderboard',badges:'Badges',ratings:'Ratings',comments:'Comments',dailyEmail:'Daily Email',learningPath:'Personalized Learning Path',collections:'Resource Collections',dailyChallenge:'Daily Japanese Challenge',advancedFilters:'Advanced Resource Filters',aiAssistant:'Japanese Study Assistant',studyPlanner:'Study Planner',downloads:'Download Center'}
  };
  let memberConfig=JSON.parse(JSON.stringify(DEFAULT_MEMBER_CONFIG));
  let memberConfigLoaded=false;
  const featureDefs=[
    ['favorites','❤️','Favorites','Save your favorite resources'],
    ['progress','📊','Progress','Track your learning progress'],
    ['streak','🔥','Streak','Build your daily study streak'],
    ['leaderboard','🏆','Leaderboard','Compete and learn'],
    ['badges','🎖️','Badges','Unlock achievements'],
    ['ratings','⭐','Ratings','Rate useful resources'],
    ['comments','💬','Comments','Discuss and learn together'],
    ['dailyEmail','📧','Daily Email','Set your daily learning email'],
    ['learningPath','🎯','Personalized Learning Path','Beginner → N1 roadmap'],
    ['collections','📚','Resource Collections','Favorites, later & completed'],
    ['dailyChallenge','🧠','Daily Japanese Challenge','Kanji, vocabulary & grammar'],
    ['advancedFilters','🔍','Advanced Resource Filters','Find the right resource faster'],
    ['aiAssistant','🤖','Japanese Study Assistant','Grammar, kanji & vocabulary help'],
    ['studyPlanner','📅','Study Planner','Tasks, goals & exam countdown'],
    ['downloads','📥','Download Center','Your saved downloads']
  ];
  function deepMerge(base,extra){const out=JSON.parse(JSON.stringify(base));Object.keys(extra||{}).forEach(k=>{if(extra[k]&&typeof extra[k]==='object'&&!Array.isArray(extra[k]))out[k]=deepMerge(out[k]||{},extra[k]);else out[k]=extra[k];});return out;}
  function isMember(){return !!(window.auth&&auth.currentUser);}
  function toastMsg(m){if(typeof window.showToast==='function')showToast(m,true);else if(typeof window.toast==='function')toast(m);}
  function requireMember(){if(isMember())return true;toastMsg('Please login to unlock this feature.');if(typeof window.openLoginModal==='function')openLoginModal();return false;}
  window.requireMemberFeature=requireMember;
  async function loadMemberFeatureConfig(force=false){
    if(memberConfigLoaded&&!force)return memberConfig;
    try{
      const cache=JSON.parse(localStorage.getItem('slSakuraMemberConfig')||'null');
      if(cache&&cache.data&&Date.now()-cache.time<10*60*1000&&!force){memberConfig=deepMerge(DEFAULT_MEMBER_CONFIG,cache.data);memberConfigLoaded=true;return memberConfig;}
      if(window.db){const snap=await db.ref('siteConfig/memberFeatures').once('value');if(snap.exists())memberConfig=deepMerge(DEFAULT_MEMBER_CONFIG,snap.val());}
      localStorage.setItem('slSakuraMemberConfig',JSON.stringify({time:Date.now(),data:memberConfig}));
    }catch(e){}
    memberConfigLoaded=true;return memberConfig;
  }
  window.loadMemberFeatureConfig=loadMemberFeatureConfig;
  function openMemberSimpleFeature(title,body){
    if(typeof window.xModal==='function')xModal('memberSimpleFeature',title,'<div class="slx-card"><p class="text-sm leading-6">'+escText(body)+'</p><p class="slx-muted mt-3">This member feature is available only while you are logged in.</p></div>');
    else alert(title+'\n\n'+body);
  }
  function memberStore(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}}
  function saveMemberStore(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}}
  function memberModal(title,html,id){if(typeof window.xModal==='function')return xModal(id||'memberFeatureModal',title,html);alert(title);}
  function openRatingsFeature(){
    const d=memberStore('slRatings',{rating:0,notes:[]});
    memberModal('⭐ Ratings','<div class="slx-card"><b>Rate your learning experience</b><div class="mt-4 flex gap-2 text-3xl" id="ratingStars">'+[1,2,3,4,5].map(n=>'<button data-rate="'+n+'" class="bg-transparent border-0 cursor-pointer">'+(n<=d.rating?'⭐':'☆')+'</button>').join('')+'</div><textarea id="ratingNote" class="slx-input mt-4" rows="3" placeholder="Optional feedback"></textarea><button id="saveRating" class="rose-btn mt-3">Save rating</button></div>','memberRatings');
    document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{d.rating=+b.dataset.rate;document.querySelectorAll('[data-rate]').forEach(x=>x.textContent=+x.dataset.rate<=d.rating?'⭐':'☆');});
    document.getElementById('saveRating').onclick=()=>{const note=document.getElementById('ratingNote').value.trim();if(note)d.notes.push({text:note,time:Date.now()});saveMemberStore('slRatings',d);toastMsg('Rating saved.');};
  }
  function openCommentsFeature(){
    const d=memberStore('slComments',[]);
    memberModal('💬 Comments','<div class="slx-card"><textarea id="memberCommentText" class="slx-input" rows="3" placeholder="Write your study question or comment..."></textarea><button id="postMemberComment" class="rose-btn mt-3">Post comment</button></div><div id="memberCommentsList" class="slx-list mt-4"></div>','memberComments');
    const render=()=>{const box=document.getElementById('memberCommentsList');if(!box)return;box.innerHTML=d.length?d.slice().reverse().map(x=>'<div class="slx-card"><div class="text-sm">'+escText(x.text)+'</div><div class="slx-muted mt-2">'+new Date(x.time).toLocaleString()+'</div></div>').join(''):'<div class="slx-muted">No comments yet.</div>';};render();
    document.getElementById('postMemberComment').onclick=()=>{const text=document.getElementById('memberCommentText').value.trim();if(!text)return;d.push({text,time:Date.now()});saveMemberStore('slComments',d);document.getElementById('memberCommentText').value='';render();toastMsg('Comment saved.');};
  }
  function openDailyEmailFeature(){
    const d=memberStore('slDailyEmail',{enabled:false,time:'08:00'});
    memberModal('📧 Daily Email','<div class="slx-card"><label class="slx-row"><span><b>Enable daily study reminder</b><div class="slx-muted">Your preference is saved on this device.</div></span><input id="dailyEmailEnabled" type="checkbox" '+(d.enabled?'checked':'')+'></label><label class="block mt-4 text-sm font-bold">Preferred reminder time<input id="dailyEmailTime" type="time" class="slx-input mt-2" value="'+escText(d.time||'08:00')+'"></label><button id="saveDailyEmail" class="rose-btn mt-4">Save reminder settings</button></div>','memberDailyEmail');
    document.getElementById('saveDailyEmail').onclick=()=>{d.enabled=document.getElementById('dailyEmailEnabled').checked;d.time=document.getElementById('dailyEmailTime').value;saveMemberStore('slDailyEmail',d);toastMsg('Daily reminder settings saved.');};
  }
  function openFallbackFeature(title,body){openMemberSimpleFeature(title,body);}
  function featureAction(key){
    if(!requireMember())return;
    if(key==='favorites'){if(typeof window.openFavorites==='function')return openFavorites();return openCollections();}
    if(key==='progress'){if(typeof window.openStudyProgress==='function')return openStudyProgress();return openFallbackFeature('📊 Progress','Your learning progress dashboard will show completed activities and study milestones.');}
    if(key==='streak')return openDailyChallenge();
    if(key==='leaderboard'){if(typeof window.openLeaderboard==='function')return openLeaderboard();return openFallbackFeature('🏆 Leaderboard','Compare study activity and achievements with other learners.');}
    if(key==='badges'){if(typeof window.openBadges==='function')return openBadges();return openFallbackFeature('🎖️ Badges','Earn badges by completing learning milestones and challenges.');}
    if(key==='ratings')return openRatingsFeature();
    if(key==='comments')return openCommentsFeature();
    if(key==='dailyEmail')return openDailyEmailFeature();
    if(key==='learningPath')return openLearningPath();
    if(key==='collections')return openCollections();
    if(key==='dailyChallenge')return openDailyChallenge();
    if(key==='advancedFilters'){const f=document.getElementById('slAdvancedFilters');if(f){f.scrollIntoView({behavior:'smooth',block:'center'});f.querySelector('select,input,button')?.focus({preventScroll:true});}else openFallbackFeature('🔍 Advanced Resource Filters','Use JLPT level, resource type, free or paid, media type and popularity to find resources faster.');return;}
    if(key==='aiAssistant'){if(typeof window.toggleChatbot==='function')return toggleChatbot();return openFallbackFeature('🤖 Japanese Study Assistant','Ask about Japanese grammar, particles, kanji, vocabulary and sentence meaning.');}
    if(key==='studyPlanner')return openStudyPlanner();
    if(key==='downloads')return openDownloadCenter();
  }
  function renderMemberFeatureHub(){
    const dash=document.getElementById('userDashboard');
    if(!dash)return;
    let hub=document.getElementById('memberFeatureHub');
    if(!hub){hub=document.createElement('section');hub.id='memberFeatureHub';const stats=dash.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4.gap-2');if(stats)dash.insertBefore(hub,stats);else dash.appendChild(hub);}
    const enabled=memberConfig.enabled||{};
    const cards=featureDefs.filter(([k])=>enabled[k]!==false).map(([k,icon,title,sub])=>`<button class="member-feature-card" data-member-feature="${k}"><div class="member-feature-icon">${icon}</div><div class="member-feature-title">${escText(memberConfig.labels?.[k]||title)}</div><div class="member-feature-sub">${sub}</div></button>`).join('');
    hub.innerHTML=`<div class="flex items-center justify-between gap-3 mb-3"><div><div class="text-sm font-black text-white">🌸 Your Learning Hub</div><div class="text-xs text-gray-400">All member features are now unlocked for your account</div></div><span class="text-xs text-rose-300 font-bold">MEMBER</span></div><div class="member-feature-grid">${cards||'<div class="text-sm text-gray-400">Member features are currently disabled.</div>'}</div>`;
    hub.querySelectorAll('[data-member-feature]').forEach(b=>b.addEventListener('click',()=>featureAction(b.dataset.memberFeature),{passive:true}));
  }
  function escText(v){const d=document.createElement('div');d.textContent=String(v||'');return d.innerHTML;}
  function syncMemberUI(){
    const filters=document.getElementById('slAdvancedFilters');
    if(filters)filters.style.display=(isMember()&&memberConfig.enabled?.advancedFilters!==false)?'flex':'none';
    const dock=document.getElementById('slFeatureDock');
    if(dock)dock.style.display=isMember()?'block':'none';
    if(isMember())renderMemberFeatureHub();
    else document.getElementById('memberFeatureHub')?.remove();
  }
  window.syncMemberUI=syncMemberUI;
  // Preserve existing feature functions, then add a login gate.
  function gate(name){const original=window[name];if(typeof original!=='function'||original.__memberGated)return;const wrapped=function(){if(!requireMember())return;return original.apply(this,arguments);};wrapped.__memberGated=true;window[name]=wrapped;}
  ['openCollections','openDailyChallenge','openStudyPlanner','openDownloadCenter'].forEach(gate);
  // Custom editable roadmap that uses the admin-controlled list.
  window.openLearningPath=function(){
    if(!requireMember())return;
    const levels=(memberConfig.roadmap&&memberConfig.roadmap.length?memberConfig.roadmap:DEFAULT_MEMBER_CONFIG.roadmap);
    const user=auth.currentUser,uid=user.uid,ref=db.ref('users/'+uid+'/learningPath');
    if(typeof window.xModal!=='function'){toastMsg('Learning path is loading. Please try again.');return;}
    xModal('memberLearningPath','🎯 '+(memberConfig.labels?.learningPath||'Personalized Learning Path'),'<div id="memberPathBody" class="slx-list"><div class="slx-muted">Loading your progress…</div></div>');
    ref.once('value').then(s=>{const data=s.val()||{completed:{}};const done=data.completed||{};const html=levels.map((level,i)=>{const complete=!!done[level];return '<button class="slx-row w-full text-left" data-path-level="'+escText(level)+'"><div class="flex items-center gap-3"><span class="text-xl">'+(complete?'✅':'🎯')+'</span><div><b>'+escText(level)+'</b><div class="slx-muted">'+(i===0?'Starting point':i===levels.length-1?'Final milestone':'Next Japanese learning milestone')+'</div></div></div><span>'+ (complete?'Completed':'Mark complete')+'</span></button>';}).join('');
      const box=document.getElementById('memberPathBody');if(!box)return;box.innerHTML=html;box.querySelectorAll('[data-path-level]').forEach(b=>b.onclick=()=>{const level=b.dataset.pathLevel;const next=!done[level];ref.child('completed/'+level).set(next).then(()=>openLearningPath());});
    }).catch(()=>{const box=document.getElementById('memberPathBody');if(box)box.textContent='Could not load your progress.';});
  };
  // Editable admin challenge content, still keeping the original lightweight modal.
  window.openDailyChallenge=function(){
    if(!requireMember())return;
    const c=memberConfig.dailyChallenge||DEFAULT_MEMBER_CONFIG.dailyChallenge;
    const date=new Date().toISOString().slice(0,10),key='slSakuraDailyChallenge';let state={streak:0,last:'',done:{}};try{state=JSON.parse(localStorage.getItem(key)||'{}');}catch(e){};state.done=state.done||{};
    const done=!!state.done[date];
    if(typeof window.xModal!=='function')return;
    xModal('memberDailyChallenge','🧠 '+(memberConfig.labels?.dailyChallenge||'Daily Japanese Challenge'),'<div class="slx-grid slx-grid-3"><div class="slx-card text-center"><div class="text-5xl">'+escText(c.kanji||'日')+'</div><b class="block mt-2">Kanji</b><div class="slx-muted">'+escText(c.reading||'')+' • '+escText(c.meaning||'')+'</div></div><div class="slx-card"><b>Vocabulary</b><p class="mt-2 text-lg">'+escText(c.vocabulary||'勉強')+'</p><div class="slx-muted">'+escText(c.vocabularyMeaning||'study')+'</div></div><div class="slx-card"><b>Grammar check</b><p class="mt-2 text-sm">'+escText(c.grammarQuestion||'')+'</p><input id="memberChallengeAnswer" class="slx-input mt-3" placeholder="Your answer"><div id="memberChallengeResult" class="mt-2 text-sm"></div></div></div><div class="slx-card mt-4 flex items-center justify-between gap-3"><span>🔥 Streak: <b id="memberChallengeStreak">'+(state.streak||0)+'</b></span><button id="memberFinishChallenge" class="rose-btn" '+(done?'disabled':'')+'>'+ (done?'Completed today':'Complete challenge')+'</button></div>');
    const finish=document.getElementById('memberFinishChallenge');if(!finish)return;finish.onclick=()=>{const answer=(document.getElementById('memberChallengeAnswer')?.value||'').trim();const result=document.getElementById('memberChallengeResult');if((c.grammarAnswer||'').trim()&&answer!==c.grammarAnswer.trim()){if(result)result.textContent='Check the grammar answer and try again.';return;}if(!state.done[date]){const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);state.streak=state.last===yesterday?(state.streak||0)+1:1;state.last=date;state.done[date]=true;localStorage.setItem(key,JSON.stringify(state));}finish.disabled=true;finish.textContent='Completed today';document.getElementById('memberChallengeStreak').textContent=state.streak||1;if(result)result.textContent='Correct! Great job!';};
  };
  // Keep the public AI Chatbot usable for everyone. The member-only Japanese Study Assistant
  // is still gated by featureAction(), while the main chatbot button remains available.
  // Replace unsupported/blank Font Awesome icon with a guaranteed emoji launcher.
  function fixDockIcon(){const launcher=document.getElementById('slFeatureLauncher');if(launcher)launcher.innerHTML='<span class="member-launcher-icon" aria-hidden="true">🌸</span>';}
  // Admin controls for visibility, labels, roadmap and daily challenge.
  window.openMemberFeatureManager=async function(){
    if(!window.state?.adminLoggedIn){toastMsg('Admin login required.');return;}
    await loadMemberFeatureConfig(true);
    const enabled=memberConfig.enabled||{};
    const toggles=featureDefs.map(([k,icon,title])=>'<label class="slx-row"><span>'+icon+' <b>'+escText(title)+'</b></span><input type="checkbox" data-feature-toggle="'+k+'" '+(enabled[k]!==false?'checked':'')+'></label>').join('');
    xModal('memberFeatureManager','⚙️ Member Features Control','<div class="slx-card"><b>Feature visibility</b><div class="slx-list mt-3">'+toggles+'</div></div><div class="slx-card mt-4"><b>Learning path</b><textarea id="cfgRoadmap" class="slx-input mt-3" rows="3" placeholder="One level per line">'+escText((memberConfig.roadmap||[]).join('\n'))+'</textarea></div><div class="slx-card mt-4"><b>Daily Challenge Content</b><div class="grid gap-2 md:grid-cols-2 mt-3"><input id="cfgKanji" class="slx-input" placeholder="Kanji" value="'+escText(memberConfig.dailyChallenge?.kanji||'')+'"><input id="cfgReading" class="slx-input" placeholder="Reading" value="'+escText(memberConfig.dailyChallenge?.reading||'')+'"><input id="cfgMeaning" class="slx-input" placeholder="Meaning" value="'+escText(memberConfig.dailyChallenge?.meaning||'')+'"><input id="cfgVocab" class="slx-input" placeholder="Vocabulary" value="'+escText(memberConfig.dailyChallenge?.vocabulary||'')+'"><input id="cfgVocabMeaning" class="slx-input" placeholder="Vocabulary meaning" value="'+escText(memberConfig.dailyChallenge?.vocabularyMeaning||'')+'"><input id="cfgAnswer" class="slx-input" placeholder="Correct grammar answer" value="'+escText(memberConfig.dailyChallenge?.grammarAnswer||'')+'"><textarea id="cfgGrammarQuestion" class="slx-input md:col-span-2" rows="3" placeholder="Grammar question">'+escText(memberConfig.dailyChallenge?.grammarQuestion||'')+'</textarea></div></div><button id="saveMemberFeatureConfig" class="rose-btn mt-4 w-full">Save all member feature settings</button>');
    document.getElementById('saveMemberFeatureConfig').onclick=async()=>{const next=JSON.parse(JSON.stringify(memberConfig));next.enabled=next.enabled||{};document.querySelectorAll('[data-feature-toggle]').forEach(x=>next.enabled[x.dataset.featureToggle]=x.checked);next.roadmap=document.getElementById('cfgRoadmap').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean).slice(0,12);next.dailyChallenge={kanji:document.getElementById('cfgKanji').value.trim(),reading:document.getElementById('cfgReading').value.trim(),meaning:document.getElementById('cfgMeaning').value.trim(),vocabulary:document.getElementById('cfgVocab').value.trim(),vocabularyMeaning:document.getElementById('cfgVocabMeaning').value.trim(),grammarAnswer:document.getElementById('cfgAnswer').value.trim(),grammarQuestion:document.getElementById('cfgGrammarQuestion').value.trim()};
      try{await db.ref('siteConfig/memberFeatures').set(next);memberConfig=deepMerge(DEFAULT_MEMBER_CONFIG,next);memberConfigLoaded=true;localStorage.setItem('slSakuraMemberConfig',JSON.stringify({time:Date.now(),data:memberConfig}));renderMemberFeatureHub();syncMemberUI();toastMsg('Member feature settings saved.');}catch(e){toastMsg('Could not save settings. Check Firebase permissions.');}
    };
  };
  // Extend existing Next-Gen admin console with a central control for these features.
  const originalAdmin=window.openNextGenAdmin;
  if(typeof originalAdmin==='function')window.openNextGenAdmin=function(){
    if(!window.state?.adminLoggedIn){toastMsg('Admin login required.');return;}
    xModal('nextGenAdminModal','🚀 Next-Gen Admin Console','<div class="grid gap-3 md:grid-cols-2"><button class="slx-card text-left" onclick="openMemberFeatureManager()">⚙️ <b>Member Features Control</b><div class="slx-muted">Control visibility, roadmap and daily challenge</div></button><button class="slx-card text-left" onclick="openRealAdminAnalytics()">📊 <b>Real Analytics</b><div class="slx-muted">Users, online users, resources and downloads</div></button><button class="slx-card text-left" onclick="openApprovalWorkflow()">📝 <b>Approval Workflow</b><div class="slx-muted">Draft → Review → Published</div></button><button class="slx-card text-left" onclick="openAnnouncementManager()">📢 <b>Announcements</b><div class="slx-muted">Important notices and exam updates</div></button><button class="slx-card text-left" onclick="openRecycleBin()">🗑 <b>Recycle Bin</b><div class="slx-muted">Restore deleted resources</div></button><button class="slx-card text-left" onclick="openRoleManager()">🔐 <b>Role System</b><div class="slx-muted">Super Admin, Admin, Moderator, Editor</div></button><button class="slx-card text-left" onclick="openAdminMessageInbox()">💬 <b>Message Center</b><div class="slx-muted">Unread, reply, archive and search</div></button></div>');
  };
  // Make resource collection action buttons login-only too.
  const originalEnhance=window.enhanceCards;
  document.addEventListener('click',e=>{const b=e.target.closest?.('.slx-card-actions button');if(b&&!isMember()){e.preventDefault();e.stopImmediatePropagation();requireMember();}},true);
  // Initial UI sync. Auth changes are handled by the central auth listener above.
  document.addEventListener('DOMContentLoaded',()=>{fixDockIcon();syncMemberUI();},{once:true});
  // Fix an already-mounted dock immediately.
  fixDockIcon();
})();
