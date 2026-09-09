(function(){
  const packState = {
    timer:null, remaining:25*60, running:false, sessionStart:0,
    charts:{},
    dmUnsub:null
  };
  const loadedScripts = {};
  function loadExternalScript(url, key){
    if (loadedScripts[key]) return loadedScripts[key];
    if ((key === 'chart' && window.Chart) || (key === 'pdf' && window.jspdf)) {
      return loadedScripts[key] = Promise.resolve();
    }
    loadedScripts[key] = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-sl-pack="'+key+'"]');
      if (existing) { existing.addEventListener('load', resolve, {once:true}); existing.addEventListener('error', reject, {once:true}); return; }
      const s = document.createElement('script');
      s.src = url; s.async = true; s.dataset.slPack = key;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    return loadedScripts[key];
  }

  function uid(){ return (window.auth && auth.currentUser) ? auth.currentUser.uid : 'guest_' + (localStorage.getItem('slSakuraGuestId') || (localStorage.setItem('slSakuraGuestId', crypto.randomUUID()), localStorage.getItem('slSakuraGuestId'))); }
  function esc(v){ const d=document.createElement('div'); d.textContent=String(v??''); return d.innerHTML; }
  function toast(m){ if(typeof showToast==='function') showToast(m); else alert(m); }
  window.slSakuraAdvanced = packState;

  // Google Analytics (works when the existing measurementId is configured)
  if (typeof firebaseConfig !== 'undefined' && firebaseConfig.measurementId && !document.querySelector('script[data-sl-ga]')) {
    const g=document.createElement('script'); g.async=true; g.dataset.slGa='1';
    g.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(firebaseConfig.measurementId);
    document.head.appendChild(g);
    window.dataLayer=window.dataLayer||[]; function gtag(){dataLayer.push(arguments)} window.gtag=gtag;
    gtag('js',new Date()); gtag('config',firebaseConfig.measurementId,{anonymize_ip:true});
  }

  // GDPR cookie consent
  function renderCookieBanner(){
    if(localStorage.getItem('slSakuraCookieConsent')) return;
    const d=document.createElement('div'); d.id='cookieBanner';
    d.className='fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-rose-500/25 bg-[#160509]/95 p-4 shadow-2xl backdrop-blur-xl';
    d.innerHTML='<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><b class="text-white">🍪 Cookie & Privacy</b><p class="mt-1 text-xs text-gray-300">We use essential storage for your learning progress and optional analytics to improve SL Sakura.</p></div><div class="flex gap-2"><button id="cookieReject" class="action-btn">Essential only</button><button id="cookieAccept" class="rose-btn">Accept</button></div></div>';
    document.body.appendChild(d);
    document.getElementById('cookieReject').onclick=()=>{localStorage.setItem('slSakuraCookieConsent','essential');d.remove();};
    document.getElementById('cookieAccept').onclick=()=>{localStorage.setItem('slSakuraCookieConsent','all');d.remove();};
  }

  // Modal helper
  function modal(id,title,body){
    document.getElementById(id)?.remove();
    const d=document.createElement('div'); d.id=id; d.className='fixed inset-0 z-[95] hidden modal-bg p-3 overflow-y-auto';
    d.innerHTML='<div class="mx-auto my-8 max-w-4xl rounded-3xl glass p-5 shadow-2xl"><div class="mb-5 flex items-center justify-between gap-4"><h2 class="text-xl font-black text-white">'+title+'</h2><button class="h-10 w-10 rounded-xl bg-white/5 text-white" onclick="document.getElementById(\''+id+'\').classList.add(\'hidden\')"><i class="fa-solid fa-xmark"></i></button></div>'+body+'</div>';
    document.body.appendChild(d); d.classList.remove('hidden'); return d;
  }

  // Study timer
  window.openStudyTimer=function(){
    const d=modal('studyTimerModal','🍅 Focus Timer',`
      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl bg-black/20 p-6 text-center"><div id="timerDisplay" class="text-6xl font-black text-rose-300">25:00</div><p class="mt-2 text-sm text-gray-400">Focus • Short Break • Long Break</p>
        <div class="mt-5 flex flex-wrap justify-center gap-2"><button class="quick-btn" onclick="setPomodoro(25)">25m Focus</button><button class="quick-btn" onclick="setPomodoro(5)">5m Break</button><button class="quick-btn" onclick="setPomodoro(15)">15m Break</button></div>
        <div class="mt-5 flex justify-center gap-3"><button class="rose-btn" id="timerStartBtn" onclick="togglePomodoro()">Start</button><button class="action-btn" onclick="resetPomodoro()">Reset</button></div></div>
        <div class="rounded-2xl bg-white/[.03] p-5"><h3 class="font-black text-white">Today's study stats</h3><div class="mt-4 text-3xl font-black text-rose-300" id="todayFocusMinutes">0 min</div><p class="text-xs text-gray-400">Completed focus minutes saved on this device.</p><button class="action-btn mt-4" onclick="generateStudyCertificate()">Generate Certificate</button></div>
      </div>`);
    updateTimerUI();
  };
  window.setPomodoro=function(min){ clearInterval(packState.timer); packState.running=false; packState.remaining=min*60; updateTimerUI(); };
  window.togglePomodoro=function(){
    if(packState.running){clearInterval(packState.timer);packState.running=false;updateTimerUI();return;}
    packState.running=true;
    packState.timer=setInterval(()=>{packState.remaining--; if(packState.remaining<=0){clearInterval(packState.timer);packState.running=false; packState.remaining=0; completeFocus(); try{new Notification('SL Sakura Timer',{body:'Session complete! Great work 🎉'});}catch(e){} } updateTimerUI();},1000); updateTimerUI();
  };
  window.resetPomodoro=function(){clearInterval(packState.timer);packState.running=false;packState.remaining=25*60;updateTimerUI();};
  function updateTimerUI(){const e=document.getElementById('timerDisplay'); if(e){let m=Math.floor(packState.remaining/60),s=packState.remaining%60;e.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');} const b=document.getElementById('timerStartBtn');if(b)b.textContent=packState.running?'Pause':'Start';}
  function completeFocus(){let x=Number(localStorage.getItem('slSakuraFocusMinutes')||0)+25;localStorage.setItem('slSakuraFocusMinutes',x);toast('🎉 Focus session completed!');}

  // Placement test
  const placementQuestions=[
    {q:'Choose the correct greeting for the morning.',a:['こんばんは','おはよう','ありがとう','さようなら'],c:1},
    {q:'What does 日本語 mean?',a:['Japan','Japanese language','Japanese person','School'],c:1},
    {q:'Choose the correct particle: わたし___学生です。',a:['を','は','に','で'],c:1},
    {q:'Which is a basic JLPT beginner level?',a:['N5','N1','N0','N10'],c:0},
    {q:'What is the meaning of 食べます?',a:['To drink','To eat','To go','To read'],c:1},
    {q:'Choose the polite form.',a:['行く','行きます','行った','行かない'],c:1}
  ];
  window.openPlacementTest=function(){
    let i=0,score=0;
    const d=modal('placementModal','📝 Japanese Placement Test','<div id="placementBox"></div>');
    function render(){const q=placementQuestions[i];document.getElementById('placementBox').innerHTML=`<div class="text-sm text-gray-400">Question ${i+1} / ${placementQuestions.length}</div><h3 class="my-4 text-lg font-black text-white">${q.q}</h3><div class="space-y-2">${q.a.map((x,n)=>`<button class="quiz-option" data-n="${n}">${String.fromCharCode(65+n)}. ${x}</button>`).join('')}</div>`;document.querySelectorAll('#placementBox [data-n]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.n)===q.c)score++;i++;i<placementQuestions.length?render():finish();});}
    function finish(){const pct=Math.round(score/placementQuestions.length*100);const level=pct>=85?'N2–N1 path':pct>=65?'N3 path':pct>=40?'N4 path':'N5 beginner path';localStorage.setItem('slSakuraPlacement',JSON.stringify({score,pct,level,date:new Date().toISOString()}));document.getElementById('placementBox').innerHTML=`<div class="text-center py-6"><div class="text-5xl">🎯</div><h3 class="mt-3 text-2xl font-black text-white">${level}</h3><p class="mt-2 text-gray-300">Score: ${score}/${placementQuestions.length} (${pct}%)</p><button class="rose-btn mt-5" onclick="document.getElementById('placementModal').classList.add('hidden')">Save Result</button></div>`;trackEvent('placement_complete',{score,pct,level});}
    render();
  };

  // Certificate PDF
  window.generateStudyCertificate=async function(){
    try{ await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','pdf'); }catch(e){ toast('Could not load the PDF generator. Please check your connection.'); return; }
    if(!window.jspdf){toast('PDF generator is unavailable.');return;}
    const name=(auth?.currentUser?.displayName)||localStorage.getItem('slSakuraLearnerName')||prompt('Enter your name for the certificate:','SL Sakura Learner')||'SL Sakura Learner';
    localStorage.setItem('slSakuraLearnerName',name);
    const {jsPDF}=window.jspdf; const doc=new jsPDF('landscape','mm','a4');
    doc.setFontSize(32);doc.text('SL Sakura',148,35,{align:'center'});
    doc.setFontSize(18);doc.text('Certificate of Study Achievement',148,55,{align:'center'});
    doc.setFontSize(14);doc.text('This certificate is proudly presented to',148,75,{align:'center'});
    doc.setFontSize(30);doc.text(name,148,98,{align:'center'});
    const mins=localStorage.getItem('slSakuraFocusMinutes')||0;
    doc.setFontSize(13);doc.text(`for completing ${mins} minutes of focused Japanese language study.`,148,120,{align:'center'});
    doc.setFontSize(11);doc.text('Date: '+new Date().toLocaleDateString(),148,145,{align:'center'});
    doc.save('SL-Sakura-Certificate.pdf');trackEvent('certificate_generated',{minutes:Number(mins)});
  };

  // Progress dashboard + charts
  window.openAdvancedDashboard=async function(){
    try{ await loadExternalScript('https://cdn.jsdelivr.net/npm/chart.js','chart'); }catch(e){ toast('Could not load charts. Please check your connection.'); return; }
    const d=modal('advancedDashboard','📊 Progress Dashboard',`<div class="grid gap-4 md:grid-cols-3"><div class="rounded-2xl bg-white/[.03] p-4"><div class="text-xs text-gray-400">Focus minutes</div><div id="dashFocus" class="text-3xl font-black text-rose-300">0</div></div><div class="rounded-2xl bg-white/[.03] p-4"><div class="text-xs text-gray-400">Resources viewed</div><div id="dashViews" class="text-3xl font-black text-rose-300">0</div></div><div class="rounded-2xl bg-white/[.03] p-4"><div class="text-xs text-gray-400">Placement</div><div id="dashPlacement" class="text-3xl font-black text-rose-300">—</div></div></div><div class="mt-5 grid gap-5 md:grid-cols-2"><div class="rounded-2xl bg-white/[.03] p-4"><canvas id="studyChart"></canvas></div><div class="rounded-2xl bg-white/[.03] p-4"><canvas id="activityChart"></canvas></div></div>`);
    const mins=Number(localStorage.getItem('slSakuraFocusMinutes')||0), views=Number(localStorage.getItem('slSakuraResourceViews')||0), placement=JSON.parse(localStorage.getItem('slSakuraPlacement')||'null');
    document.getElementById('dashFocus').textContent=mins;document.getElementById('dashViews').textContent=views;document.getElementById('dashPlacement').textContent=placement?placement.pct+'%':'—';
    if(packState.charts.study)packState.charts.study.destroy();if(packState.charts.activity)packState.charts.activity.destroy();
    packState.charts.study=new Chart(document.getElementById('studyChart'),{type:'doughnut',data:{labels:['Focus minutes','Remaining weekly goal'],datasets:[{data:[Math.min(mins,300),Math.max(0,300-Math.min(mins,300))]}]},options:{plugins:{title:{display:true,text:'Weekly study goal (300 min)'}}}});
    packState.charts.activity=new Chart(document.getElementById('activityChart'),{type:'bar',data:{labels:['Resources','Focus sessions','Placement'],datasets:[{label:'Activity',data:[views,Math.floor(mins/25),placement?placement.pct:0]}]},options:{plugins:{title:{display:true,text:'Learning activity'}}}});
  };

  // Push notifications: browser permission + scheduled study reminders
  window.enablePushNotifications=async function(){
    if(!('Notification'in window)){toast('This browser does not support notifications.');return;}
    const p=await Notification.requestPermission(); if(p==='granted'){localStorage.setItem('slSakuraNotifications','enabled');toast('🔔 Notifications enabled!');new Notification('SL Sakura',{body:'You will receive study reminders while this app is open.'});}
    else toast('Notification permission was not granted.');
  };
  setInterval(()=>{
    if(document.hidden) return;
    if(localStorage.getItem('slSakuraNotifications')==='enabled' && Notification.permission==='granted'){
      const last=Number(localStorage.getItem('slSakuraLastReminder')||0);
      if(Date.now()-last>2*60*60*1000){
        new Notification('SL Sakura 🌸',{body:'Time for a short Japanese study session!'});
        localStorage.setItem('slSakuraLastReminder',Date.now());
      }
    }
  },900000);

  // Direct message portal using Firebase Realtime Database
  window.openDirectMessagePortal=function(){
    const d=modal('dmPortal','💬 Message Admin',`<div class="grid gap-5 md:grid-cols-2"><div><p class="mb-3 text-sm text-gray-400">Send a private message directly to the SL Sakura admin.</p><input id="dmSubject" class="admin-input mb-3" placeholder="Subject"><textarea id="dmText" class="admin-input min-h-[150px]" placeholder="Write your message..."></textarea><button id="dmSendBtn" class="rose-btn mt-3 w-full">Send Message</button></div><div><h3 class="font-black text-white">Your conversation</h3><div id="dmThread" class="mt-3 max-h-[380px] space-y-2 overflow-y-auto"></div></div></div>`);
    const id=uid();const ref=db.ref('directMessages/'+id);
    document.getElementById('dmSendBtn').onclick=async()=>{const subject=document.getElementById('dmSubject').value.trim(),text=document.getElementById('dmText').value.trim();if(!text)return toast('Please write a message first.');await ref.push({subject,text,sender:id,createdAt:firebase.database.ServerValue.TIMESTAMP,read:false});document.getElementById('dmText').value='';toast('Message sent to admin!');trackEvent('direct_message_sent');};
    ref.orderByChild('createdAt').limitToLast(50).on('value',snap=>{const box=document.getElementById('dmThread');if(!box)return;const data=[];snap.forEach(x=>data.push(x.val()));box.innerHTML=data.length?data.map(m=>`<div class="rounded-xl bg-white/[.04] p-3 text-sm"><div class="font-bold text-rose-200">${esc(m.subject||'Message')}</div><div class="mt-1 text-gray-300">${esc(m.text||'')}</div><div class="mt-2 text-[10px] text-gray-500">${m.createdAt?new Date(m.createdAt).toLocaleString():'Sending...'}</div></div>`).join(''):'<p class="text-sm text-gray-500">No messages yet.</p>';box.scrollTop=box.scrollHeight;});
  };

  // Admin inbox
  window.openAdminMessageInbox=function(){
    if(!state?.adminLoggedIn)return toast('Admin login required.');
    const d=modal('adminInbox','📨 Admin Message Inbox','<div id="adminInboxList" class="space-y-3">Loading...</div>');
    db.ref('directMessages').once('value').then(snap=>{const rows=[];snap.forEach(user=>user.forEach(msg=>rows.push({id:user.key,key:msg.key,...msg.val()})));rows.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));document.getElementById('adminInboxList').innerHTML=rows.length?rows.map(m=>`<div class="rounded-xl border border-rose-500/10 p-4"><div class="text-xs text-gray-500">${esc(m.id)}</div><div class="font-bold text-rose-200">${esc(m.subject||'Message')}</div><p class="mt-1 text-sm text-gray-300">${esc(m.text||'')}</p></div>`).join(''):'No messages yet.';});
  };

  // Bulk tools: work with existing resource state and Firebase data
  window.openAdvancedBulkEdit=function(){
    if(!state?.adminLoggedIn)return toast('Admin login required.');
    const selected=[...(state.selectedResources||[])];
    modal('bulkEditModal','🛠 Bulk Edit',`<p class="text-sm text-gray-400">Selected resources: <b class="text-white">${selected.length}</b></p><select id="bulkCategory" class="admin-input mt-4"><option value="">Choose category</option><option>JLPT</option><option>Japanese Language</option><option>Classes</option><option>Exams</option></select><div class="mt-4 flex gap-2"><button class="rose-btn" onclick="applyAdvancedBulkEdit()">Apply Category</button><button class="action-btn" onclick="document.getElementById('bulkEditModal').classList.add('hidden')">Cancel</button></div>`);
  };
  window.applyAdvancedBulkEdit=async function(){const cat=document.getElementById('bulkCategory').value;const ids=[...(state.selectedResources||[])];if(!cat||!ids.length)return toast('Select resources and a category first.');await Promise.all(ids.map(id=>db.ref('resources/'+id).update({category:cat,updatedAt:firebase.database.ServerValue.TIMESTAMP})));toast(`Updated ${ids.length} resources.`);trackEvent('bulk_edit',{count:ids.length});};

  function trackEvent(name,params={}){try{window.gtag?.('event',name,params)}catch(e){}}

  // Advanced tools: one compact launcher so it never overlaps the main FAB stack.
  const tools=document.createElement('div');tools.id='advancedTools';
  tools.innerHTML=`
    <button id="advancedToolsLauncher" type="button" title="More learning tools" aria-label="Open more learning tools"><i class="fa-solid fa-layer-group"></i></button>
    <div id="advancedToolsMenu" aria-label="Learning tools">
      <button title="Progress dashboard" onclick="openAdvancedDashboard()" class="advanced-tool-btn">📊</button>
      <button title="Study timer" onclick="openStudyTimer()" class="advanced-tool-btn">🍅</button>
      <button title="Placement test" onclick="openPlacementTest()" class="advanced-tool-btn">📝</button>
      <button title="Message admin" onclick="openDirectMessagePortal()" class="advanced-tool-btn">💬</button>
      <button title="Enable notifications" onclick="enablePushNotifications()" class="advanced-tool-btn">🔔</button>
    </div>`;
  function mountAdvancedTools(){
    document.body.appendChild(tools);
    const launcher=document.getElementById('advancedToolsLauncher');
    launcher.onclick=()=>tools.classList.toggle('open');
    document.addEventListener('click',(ev)=>{
      if(!tools.contains(ev.target)) tools.classList.remove('open');
    },{passive:true});
    renderCookieBanner();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountAdvancedTools,{once:true});
  else mountAdvancedTools();
})();
