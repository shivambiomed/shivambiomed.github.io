/* MLT Knowledge Arena - app.js
 * Application logic extracted from the original index.html.
 * The code below intentionally keeps the original global/classic-script behavior.
 */
const navButtons=[...document.querySelectorAll('[data-view]')];
const views=[...document.querySelectorAll('.view')];
const noteDetail=document.getElementById('noteDetail');
const subjectGrid=document.getElementById('subjectGrid');
let currentAppStage='home';
let lastAppView='home';
function updateGlobalBack(){
  const backBtn=document.getElementById('globalBackBtn');
  if(!backBtn)return;
  const canGoBack=currentAppStage!=='home';
  backBtn.classList.toggle('show',canGoBack);
  backBtn.onclick=()=>{
    if(currentAppStage==='quiz-result'){
      try{resetQuizToHome();}catch(e){}
      showView('quiz',false);
      history.replaceState({view:'quiz',stage:'quiz-home'},'', '#quiz');
      currentAppStage='quiz-home';
      lastAppView='quiz';
      updateGlobalBack();
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    if(history.length>1){ history.back(); }
    else { showView('home',false); }
  };
}
function renderSingleSetupFromHistory(){
  const chooser=document.getElementById('quizModeChooser');
  const single=document.getElementById('singleSetup');
  const host=document.getElementById('hostControlPanel');
  const join=document.getElementById('joinPanel');
  const card=document.getElementById('quizCard');
  const stats=document.getElementById('quizStats');
  if(chooser)chooser.style.display='none';
  if(single)single.style.display='block';
  if(host)host.style.display='none';
  if(join)join.style.display='none';
  if(card)card.style.display='none';
  if(stats)stats.style.display='none';
  setQuizScreenMode('');
  document.body.classList.remove('quiz-running');
  currentAppStage='single-setup';
  lastAppView='quiz';
  updateGlobalBack();
}
function renderQuizHomeFromHistory(){
  showQuizModeChooser();
  lastAppView='quiz';
  currentAppStage='quiz-home';
  updateGlobalBack();
}
function renderQuizLiveFromHistory(){
  const card=document.getElementById('quizCard');
  if(card)card.style.display='block';
  const chooser=document.getElementById('quizModeChooser');
  if(chooser)chooser.style.display='none';
  const single=document.getElementById('singleSetup');
  if(single)single.style.display='none';
  setQuizScreenMode('player');
  currentAppStage='quiz-live'; window.dispatchEvent(new Event('quiz-stage-change'));
  lastAppView='quiz';
  updateGlobalBack();
  if(quizQuestions.length)startSingleQuestion();
}
function resetQuizToHome(){
  try{clearTimeout(questionTimer)}catch(e){}
  try{stopQuizKeepAlive()}catch(e){}
  try{stopWaitingSound()}catch(e){}
  try{releaseQuizWakeLock()}catch(e){}
  try{if(hostPeer){hostPeer.destroy();hostPeer=null}}catch(e){}
  try{if(window.quizConn){window.quizConn.close();window.quizConn=null}}catch(e){}
  hostConnections=[];
  hostMode=false;
  localRole='';
  localPlayerId=null;
  roomCode='';
  session=null;
  selectedQuizSubject='all';
  selectedQuestionCount=50;
  quizQuestions=[];
  quizIndex=0;
  questionLocked=false;
  players=[];
  try{lockQuiz(false)}catch(e){document.documentElement.classList.remove('quiz-fullscreen');document.body.style.overflow='';}
  document.body.classList.remove('quiz-running');
  restoreQuizHomeFromHostLobby();
  showQuizModeChooser();
  showView('quiz',false);
  window.scrollTo({top:0,behavior:'auto'});
  const card=document.getElementById('quizCard');
  if(card){card.innerHTML='';card.style.display='none';}
  const ranking=document.getElementById('rankingPanel');
  if(ranking)ranking.style.display='none';
  const stats=document.getElementById('quizStats');
  if(stats)stats.style.display='none';
  const hostStats=document.getElementById('hostStatsPanel');
  if(hostStats)hostStats.style.display='none';
  setJoinStatus('');
  setRoomStatus('');
  currentAppStage='quiz-home';
  lastAppView='quiz';
  window.dispatchEvent(new Event('quiz-stage-change'));
  // Explicitly restore the site header after leaving an active quiz.
  document.body.classList.remove('quiz-active');
  if(typeof window.setQuizHeaderHidden==='function') window.setQuizHeaderHidden(false);
  updateGlobalBack();
  // Run once more after the view has finished updating so the header cannot remain hidden.
  setTimeout(function(){
    document.body.classList.remove('quiz-active');
    if(typeof window.setQuizHeaderHidden==='function') window.setQuizHeaderHidden(false);
  },50);
}

function showView(viewId,updateHistory=true){const target=document.getElementById(viewId);if(!target)return;const notesView=document.getElementById('notes');if(viewId==='notes' && !noteDetail?.classList.contains('active'))notesView?.classList.remove('note-open');lastAppView=viewId;if(viewId!=='quiz')document.body.classList.remove('quiz-running');views.forEach(v=>{v.classList.remove('active','page-animate');});void target.offsetWidth;target.classList.add('active','page-animate');const homeHighlights=document.getElementById('homeHighlights');if(homeHighlights)homeHighlights.classList.remove('active');const mltOfferings=document.getElementById('mltOfferings');if(mltOfferings)mltOfferings.classList.remove('active');navButtons.forEach(b=>b.classList.toggle('active',b.dataset.view===viewId));if(viewId!=='notes')closeNote(false);if(updateHistory){const url=viewId==='home'?location.pathname+location.search:'#'+viewId;history.pushState({view:viewId,stage:viewId},'',url);}currentAppStage=viewId==='notes'&&noteDetail?.classList.contains('active')?'note-detail':viewId;updateGlobalBack();window.scrollTo({top:0,behavior:'smooth'})}
function renderTopicDiagram(diagram){
  if(!Array.isArray(diagram)||!diagram.length)return '';
  return `<div class="topic-diagram" role="img" aria-label="Topic flow diagram">${diagram.map((item,i)=>item==='↓'||item==='→'?`<span class="diagram-arrow">${esc(item)}</span>`:`<span class="diagram-node">${esc(item)}</span>`).join('')}</div>`;
}
function openNote(subject,updateHistory=true){
  const note=notes[subject]; if(!note)return;
  showView('notes',false);
  document.getElementById('notes')?.classList.add('note-open');
  const topicCount=note.topics?.length||0;
  const emptyMessage=topicCount===0?`<div class="empty-subject-message"><div class="empty-subject-icon">📚</div><h4>No notes added yet</h4><p>This subject is currently empty. Detailed topic-wise notes will appear here when added.</p></div>`:'';
  noteDetail.innerHTML=`<div class="note-detail-head"><button class="note-back-btn" type="button" id="noteBackBtn">← Back to Subjects</button><div class="eyebrow">${esc(note.title)}</div><h3>${esc(note.title)} — Detailed Study Notes</h3><p class="lead">${esc(note.summary)}</p></div>${emptyMessage}<div class="note-topic-list">${note.topics.map((topic,i)=>`<article class="note-topic-card note-topic-expanded" style="--note-index:${i}"><div class="note-topic-num">${i+1}</div><h4>${esc(topic.title)}</h4><div class="note-section-label">1. Definition / Simple explanation</div><p class="note-long-text">${esc(topic.definition||topic.simple)}</p><div class="note-section-label">2. Types / Classification</div><p class="note-detail-text">${esc(topic.types||'Classify the main forms or categories related to this topic and compare their defining features.')}</p><div class="note-section-label">3. Structure / Components</div><p class="note-detail-text">${esc(topic.structure||'Identify the main structures or components and explain what each contributes to the topic.')}</p><div class="note-section-label">4. Functions / Roles</div><p class="note-detail-text">${esc(topic.functions||'State the major functions and explain how they support normal laboratory or body function.')}</p><div class="note-section-label">5. Detailed explanation</div><p class="note-detail-text">${esc(topic.expanded)}</p>${renderTopicDiagram(topic.diagram)}<div class="note-section-label">6. Step-by-step</div><p class="note-detail-text note-steps">${esc(topic.stepByStep||topic.steps)}</p><div class="note-section-label">7. Laboratory significance</div><p class="note-detail-text">${esc(topic.labConnection)}</p><div class="note-section-label">8. Clinical significance</div><p class="note-detail-text">${esc(topic.clinicalSignificance||'Connect the topic with patient context, specimen quality, laboratory findings and interpretation.')}</p><div class="note-section-label">9. Key exam points</div><ul class="note-key-points">${(topic.examPoints||topic.keyPoints||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="note-section-label">10. Common mistakes & cautions</div><p class="note-caution">${esc(topic.commonMistakes)}</p><div class="note-section-label">11. Quick memory framework</div><p class="note-detail-text">${esc(topic.mnemonic||'Definition → types → structure → functions → steps → laboratory significance → clinical significance.')}</p><div class="note-section-label">12. Revision method</div><p class="note-detail-text">${esc(topic.revision)}</p></article>`).join('')}</div>`;
noteDetail.classList.add('active'); currentAppStage='note-detail'; updateGlobalBack();
  if(updateHistory)history.pushState({view:'notes',subject,stage:'note-detail'},'',`#notes/${encodeURIComponent(subject)}`);
  const backBtn=document.getElementById('noteBackBtn');
  if(backBtn){
    backBtn.addEventListener('click',()=>{
      closeNote(false);
      currentAppStage='notes';
      updateGlobalBack();
      history.pushState({view:'notes',stage:'notes'},'', '#notes');
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }
  setTimeout(()=>noteDetail.scrollIntoView({behavior:'smooth',block:'start'}),20);
}
function closeNote(updateHistory=true){const wasActive=noteDetail.classList.contains('active');noteDetail.classList.remove('active');document.getElementById('notes')?.classList.remove('note-open');noteDetail.innerHTML='';if(updateHistory&&wasActive)history.pushState({view:'notes',stage:'notes'},'', '#notes');if(lastAppView==='notes'){currentAppStage='notes';updateGlobalBack()}}
navButtons.forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-view-jump]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewJump)));

subjectGrid.addEventListener('click',e=>{const b=e.target.closest('[data-subject]');if(b)openNote(b.dataset.subject)});
window.addEventListener('popstate',e=>{
  const state=e.state||{}; const hash=location.hash.replace(/^#/,'');
  if(currentAppStage==='quiz-live' && !session?.completed){
    history.pushState({view:'quiz',stage:'quiz-live'},'', '#quiz-live');
    showLeaveQuizModal();
    return;
  }
  // After the quiz is finished, browser Back must skip the last question screen
  // and return directly to Quiz Home.
  if((state.stage==='quiz-live'||hash==='quiz-live') && session?.completed){
    try{resetQuizToHome();}catch(err){renderQuizHomeFromHistory();}
    currentAppStage='quiz-home';
    lastAppView='quiz';
    history.replaceState({view:'quiz',stage:'quiz-home'},'', '#quiz');
    updateGlobalBack();
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  if(hash.startsWith('notes/')){const subject=decodeURIComponent(hash.slice(6));if(notes[subject]){showView('notes',false);openNote(subject,false);currentAppStage='note-detail';updateGlobalBack();return}}

  // Quiz history: Quiz Home -> Player Selection -> Setup -> Questions
  if(hash==='quiz'){
    renderQuizHomeFromHistory();
    return;
  }
  if(hash==='quiz-setup'){
    renderSingleSetupFromHistory();
    return;
  }
  if(hash==='quiz-live'){
    // Back navigation from an active question returns directly to Quiz Home.
    try{resetQuizToHome();}catch(err){renderQuizHomeFromHistory();}
    showView('quiz',false);
    currentAppStage='quiz-home';
    lastAppView='quiz';
    history.replaceState({view:'quiz',stage:'quiz-home'},'', '#quiz');
    updateGlobalBack();
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  if(hash==='quiz-result'){
    // Results are a terminal state. Back/Pass from results must go to Quiz Home,
    // never back into the last question.
    try{ resetQuizToHome(); }catch(e){ renderQuizHomeFromHistory(); }
    currentAppStage='quiz-home';
    lastAppView='quiz';
    history.replaceState({view:'quiz',stage:'quiz-home'},'', '#quiz');
    updateGlobalBack();
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  if(hash==='quiz-host'||hash==='quiz-player'){
    showView('quiz',false);
    currentAppStage=state.stage||hash.replace('quiz-','');
    updateGlobalBack();
    return;
  }
  const view=state.view||hash;
  if(['home','about','notes','quiz','contact'].includes(view)){showView(view,false);return}
  showView('home',false);
});
const noteSearch=document.getElementById('noteSearch');
noteSearch.addEventListener('input',()=>{const q=noteSearch.value.toLowerCase().trim();document.querySelectorAll('.subject-card').forEach(card=>{card.hidden=!card.textContent.toLowerCase().includes(q)})});

const QUIZ_TOTAL_UNIQUE=50000;
let QUIZ_GENERATED_ID=0;
const QUIZ_VARIANT_OPENERS=[
  'In an MLT revision exercise,',
  'During routine laboratory study,',
  'For a medical laboratory technology review,',
  'When revising this core concept,',
  'In a structured exam-preparation session,',
  'While reviewing foundational laboratory science,',
  'For a classroom-based MLT question,',
  'During a practical theory revision session,',
  'In a standard clinical-laboratory review,',
  'When checking core knowledge for an MLT assessment,',
  'As part of a focused laboratory-science review,'
];
const QUIZ_VARIANT_CONTEXTS=[
  'focus on the principal concept and identify the correct answer:',
  'focus on the defining feature and identify the correct answer:',
  'focus on the primary role or identification point and select the answer:',
  'use the core laboratory principle and select the answer:',
  'recall the key fact and select the answer:',
  'apply the basic concept and select the answer:',
  'identify the most appropriate answer from the choices:',
];
const QUIZ_VARIANT_STYLES=[q=>q];
function makeQuizVariant(seed,variant){
  // Keep the displayed question focused on the actual question. Do not add
  // revision instructions, exam-prep phrases, or extra context sentences.
  const q=String(seed.q||'').replace(/\s+/g,' ').trim();
  return {id:`q${++QUIZ_GENERATED_ID}`,subject:seed.subject,q,o:[...seed.o],a:seed.a,e:seed.e};
}
function buildQuestionBank(){
  const out=[];
  const subjects=[...new Set(quizSeedBank.map(x=>x.subject))];
  subjects.forEach((subject,subjectIndex)=>{
    const seeds=quizSeedBank.filter(x=>x.subject===subject);
    seeds.forEach(seed=>{
      // 500 wording variants per source item gives a large pool; the unique
      // selector below removes any accidental exact duplicates.
      for(let v=0;v<500;v++) out.push(makeQuizVariant(seed,v));
    });
  });
  return out.slice(0,QUIZ_TOTAL_UNIQUE);
}
const quizBank=[];
const QUESTION_DURATION=25000, MAX_BASE_POINTS=100, MAX_CARRY_POINTS=0;
const QUESTION_GENERATOR_API='https://green-union-dc89.shivamkumar911315.workers.dev/generate-questions';
const QUESTION_BANK_API='https://green-union-dc89.shivamkumar911315.workers.dev/questions';
let aiGeneratedBank=[];
let cloudQuestionLoadPromise=null;
let cloudQuestionSavePromise=Promise.resolve();
try{aiGeneratedBank=JSON.parse(localStorage.getItem('mltAIGeneratedQuestions')||'[]');if(!Array.isArray(aiGeneratedBank))aiGeneratedBank=[];}catch(e){aiGeneratedBank=[]}
let selectedQuestionCount=50, selectedQuizSubject='all';
let quizQuestions=[],quizIndex=0,hostPeer=null,roomCode='',hostMode=false,localPlayerId=null,localRole='',questionTimer=null,questionStartedAt=0,questionLocked=false;
let screenWakeLock=null, wakeLockRequested=false, keepAliveTimer=null;
let players=[];
let session=null;
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function cleanQuizQuestion(q){
  let text=String(q||'').replace(/\s+/g,' ').trim();
  text=text.replace(/^(?:In an MLT revision exercise|During routine laboratory study|For a medical laboratory technology review|When revising this core concept|In a structured exam-preparation session|While reviewing foundational laboratory science|For a classroom-based MLT question|During a practical theory revision session|In a standard clinical-laboratory review|When checking core knowledge for an MLT assessment|As part of a focused laboratory-science review),?\s*/i,'');
  text=text.replace(/^(?:focus on the principal concept and identify the correct answer|focus on the defining feature and identify the correct answer|focus on the primary role or identification point and select the answer|use the core laboratory principle and select the answer|recall the key fact and select the answer|apply the basic concept and select the answer|identify the most appropriate answer from the choices),?\s*/i,'');
  return text.trim();
}
function normalizeQuizQuestion(q){
  return cleanQuizQuestion(q).replace(/\s+/g,' ').trim().toLowerCase();
}
function getUniqueQuestionPool(subject){
  const raw=subject==='all'?aiGeneratedBank:aiGeneratedBank.filter(x=>x.subject===subject);
  const seen=new Set(), unique=[];
  for(const item of raw){
    const key=normalizeQuizQuestion(item.q);
    if(seen.has(key))continue;
    seen.add(key);unique.push(item);
  }
  return unique;
}
function getUniqueQuestionCount(subject){return getUniqueQuestionPool(subject).length}
function mergeAIQuestions(items){
  if(!Array.isArray(items)||!items.length)return 0;
  const existing=new Set(aiGeneratedBank.map(x=>normalizeQuizQuestion(x.q)));
  let added=0;
  items.forEach(x=>{
    const item={subject:String(x.subject||'Biochemistry'),difficulty:String(x.difficulty||'Medium'),q:String(x.q||x.question||'').trim(),o:Array.isArray(x.o)?x.o.map(String):(Array.isArray(x.options)?x.options.map(String):[]),a:Number(x.a??x.answerIndex),e:String(x.e??x.explanation??'')};
    const key=normalizeQuizQuestion(item.q);
    if(item.q&&item.o.length===4&&Number.isInteger(item.a)&&item.a>=0&&item.a<=3&&!existing.has(key)){
      aiGeneratedBank.push(item);existing.add(key);added++;
    }
  });
  if(added){try{localStorage.setItem('mltAIGeneratedQuestions',JSON.stringify(aiGeneratedBank));}catch(e){}}
  return added;
}
async function loadCloudAIQuestions(subject='all'){
  if(cloudQuestionLoadPromise)return cloudQuestionLoadPromise;
  cloudQuestionLoadPromise=(async()=>{
    try{
      const url=new URL(QUESTION_BANK_API);
      if(subject&&subject!=='all')url.searchParams.set('subject',subject);
      url.searchParams.set('limit','5000');
      const res=await fetch(url.toString(),{method:'GET',cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!Array.isArray(data.questions))return 0;
      return mergeAIQuestions(data.questions);
    }catch(e){return 0}
  })().finally(()=>{cloudQuestionLoadPromise=null;});
  return cloudQuestionLoadPromise;
}
function saveAIQuestionsToCloud(items){
  if(!Array.isArray(items)||!items.length)return cloudQuestionSavePromise;
  const payload=items.map(x=>({subject:x.subject||'Biochemistry',difficulty:x.difficulty||'Medium',question:x.q,options:x.o,answerIndex:x.a,explanation:x.e||''}));
  cloudQuestionSavePromise=cloudQuestionSavePromise.then(async()=>{
    try{
      await fetch(QUESTION_BANK_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questions:payload})});
    }catch(e){}
  });
  return cloudQuestionSavePromise;
}
function getUsedQuizQuestionKeys(subject){
  try{return new Set(JSON.parse(localStorage.getItem('mltUsedQuizQuestions:'+subject)||'[]'))}catch(e){return new Set()}
}
function saveUsedQuizQuestionKeys(subject,keys){
  try{localStorage.setItem('mltUsedQuizQuestions:'+subject,JSON.stringify([...keys]))}catch(e){}
}
function pickFreshQuizQuestions(pool,count,subject){
  const fresh=pool.filter(item=>!getUsedQuizQuestionKeys(subject).has(normalizeQuizQuestion(item.q)));
  // Once the available pool is exhausted, start a new generation cycle.
  const source=fresh.length>=count?fresh:pool;
  const chosen=shuffle(source).slice(0,Math.min(count,source.length));
  const used=getUsedQuizQuestionKeys(subject);
  if(source===pool) used.clear();
  chosen.forEach(item=>used.add(normalizeQuizQuestion(item.q)));
  saveUsedQuizQuestionKeys(subject,used);
  return chosen;
}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setQuizScreenMode(mode){
  const q=document.getElementById('quiz');
  if(!q)return;
  q.classList.remove('quiz-player-mode','quiz-host-live','quiz-live-now');
  document.body.classList.toggle('quiz-running',mode==='player'||mode==='host-live');
  if(mode==='player'){q.classList.add('quiz-player-mode','quiz-live-now');}
  if(mode==='host-live')q.classList.add('quiz-host-live','quiz-live-now');
}
function setJoinStatus(t){const e=document.getElementById('joinStatus');if(e)e.textContent=t}
function setRoomStatus(t){const e=document.getElementById('roomStatus');if(e)e.textContent=t}
function updateStats(){const total=players.reduce((n,p)=>n+(p.answered||0),0),correct=players.reduce((n,p)=>n+(p.correct||0),0);document.getElementById('statPlayers').textContent=players.filter(p=>p.connected).length;document.getElementById('statAnswered').textContent=total;document.getElementById('statAverage').textContent=total?Math.round(correct/total*100)+'%':'0%';renderRanking();renderHostStats()}
function getRankedPlayers(){
  return [...players].sort((a,b)=>(b.score||0)-(a.score||0)||(b.correct||0)-(a.correct||0)||a.name.localeCompare(b.name));
}
function getPlayerRank(id){
  const ranked=getRankedPlayers();
  const i=ranked.findIndex(p=>p.id===id);
  return i<0?null:i+1;
}
function renderRanking(){
  const panel=document.getElementById('rankingPanel'),list=document.getElementById('rankingList');
  if(!players.length){if(panel)panel.style.display='none';return}
  if(panel)panel.style.display='none';
}
function renderLiveRankInline(targetId='liveRankInline'){
  const el=document.getElementById(targetId);
  if(!el)return;
  const ranked=getRankedPlayers().slice(0,5);
  const me=localPlayerId;
  el.innerHTML='<div class="live-rank"><div class="live-rank-title">Live Rank · Top 5</div>'+
    (ranked.length?ranked.map((p,i)=>`<div class="live-rank-row ${p.id===me?'me':''}"><strong>#${i+1}</strong><span class="rank-avatar-mini">${esc(p.avatar||'🧑‍🔬')}</span><span class="rank-name">${esc(p.name)}${p.id===me?' · You':''}</span><span class="rank-score">${p.score||0}</span></div>`).join(''):'<p>No players yet.</p>')+
    '</div>';
}
function renderHostStats(){
  const panel=document.getElementById('hostStatsPanel'),out=document.getElementById('hostStats');
  if(!hostMode||!players.length){if(panel)panel.style.display='none';return}
  if(panel)panel.style.display='none';
}
function resetPlayers(){players.forEach(p=>{p.score=0;p.answered=0;p.correct=0;p.wrong=0;p.answeredThisQuestion=false;p.retryUsed=false})}
async function requestQuizWakeLock(){
  if(!('wakeLock' in navigator) || !hostMode) return;
  try{
    if(screenWakeLock && !screenWakeLock.released) return;
    screenWakeLock=await navigator.wakeLock.request('screen');
    wakeLockRequested=true;
    screenWakeLock.addEventListener('release',()=>{screenWakeLock=null;});
  }catch(e){ wakeLockRequested=false; }
}
async function releaseQuizWakeLock(){
  try{if(screenWakeLock){await screenWakeLock.release();}}catch(e){}
  screenWakeLock=null; wakeLockRequested=false;
}
function startQuizKeepAlive(){
  if(keepAliveTimer)clearInterval(keepAliveTimer);
  keepAliveTimer=setInterval(()=>{
    if(hostMode && session?.started && !session?.completed){
      requestQuizWakeLock();
      broadcast({type:'keepalive',serverTime:Date.now(),questionIndex:quizIndex,total:quizQuestions.length});
    }
  },5000);
}
function stopQuizKeepAlive(){if(keepAliveTimer){clearInterval(keepAliveTimer);keepAliveTimer=null;} releaseQuizWakeLock();}
function broadcast(msg){if(!hostPeer)return;hostConnections.forEach(c=>{try{if(c.open)c.send(msg)}catch(e){}})}
let hostConnections=[];
function broadcastState(){
  broadcast({type:'state',players,questionIndex:quizIndex,total:session?.total||quizQuestions.length||0,started:!!session?.started,finished:!!session?.completed,subject:session?.subject||'',timeLeft:Math.max(0,QUESTION_DURATION-(Date.now()-questionStartedAt))});
  updateStats();updateHostAnswerCounter();
  renderLiveRankInline();
}
function hideQuizHomeForHostLobby(){
  ['.quiz-home-orbit','.quiz-home-banner','.quiz-home-head','.quiz-head','#joinPanel','#subjectControls','#questionCountControls','#quizKeepAwake','#quizStats','#quizCard','#hostStatsPanel','#rankingPanel'].forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>el.classList.add('host-lobby-only-hidden'));
  });
}
function restoreQuizHomeFromHostLobby(){
  document.querySelectorAll('.host-lobby-only-hidden').forEach(el=>el.classList.remove('host-lobby-only-hidden'));
  ['.quiz-home-orbit','.quiz-home-banner','.quiz-home-head','.quiz-head','#joinPanel','#subjectControls','#questionCountControls','#quizKeepAwake','#quizCard','#quizStats','#hostStatsPanel','#rankingPanel','#quizModeChooser'].forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>el.classList.remove('host-lobby-only-hidden'));
  });
}
function showQuizModeChooser(){
  restoreQuizHomeFromHostLobby();
  const chooser=document.getElementById('quizModeChooser'); if(chooser)chooser.style.display='grid';
  const single=document.getElementById('singleSetup'); if(single)single.style.display='none';
  const host=document.getElementById('hostControlPanel'); if(host)host.style.display='none';
  const join=document.getElementById('joinPanel'); if(join)join.style.display='none';
  const sc=document.getElementById('subjectControls'); if(sc)sc.style.display='none';
  const qc=document.getElementById('questionCountControls'); if(qc)qc.style.display='none';
  const card=document.getElementById('quizCard'); if(card)card.style.display='none';
  const stats=document.getElementById('quizStats'); if(stats)stats.style.display='none';
  const keep=document.getElementById('quizKeepAwake'); if(keep)keep.classList.remove('show');
  setQuizScreenMode('');
  currentAppStage='quiz-home';
}
function openSinglePlayerSetup(){
  const chooser=document.getElementById('quizModeChooser'); if(chooser)chooser.style.display='none';
  const single=document.getElementById('singleSetup'); if(single)single.style.display='block';
  const host=document.getElementById('hostControlPanel'); if(host)host.style.display='none';
  const join=document.getElementById('joinPanel'); if(join)join.style.display='none';
  const card=document.getElementById('quizCard'); if(card)card.style.display='none';
  currentAppStage='single-setup';
}
function openMultiplePlayerSetup(){
  const chooser=document.getElementById('quizModeChooser'); if(chooser)chooser.style.display='none';
  const single=document.getElementById('singleSetup'); if(single)single.style.display='none';
  const host=document.getElementById('hostControlPanel'); if(host)host.style.display='block';
  const join=document.getElementById('joinPanel'); if(join)join.style.display='block';
  const card=document.getElementById('quizCard'); if(card)card.style.display='block';
  const entry=document.querySelector('#hostControlPanel .host-multiple-entry'); if(entry){entry.classList.remove('mode-entry-refresh');void entry.offsetWidth;entry.classList.add('mode-entry-refresh');}
  currentAppStage='multiple-home';
}

let aiGenStatusTimer=null;
function showAIGenerating(subject,difficulty,count,mode){
  const overlay=document.getElementById('aiGeneratingOverlay'); if(!overlay)return;
  const sub=document.getElementById('aiGenSubtitle'), status=document.getElementById('aiGenStatus');
  const messages=[
    `Building ${count} fresh ${difficulty} ${subject==='all'?'MLT':subject} questions`,
    'Checking the questions for clear answers',
    'Preparing options and explanations',
    mode==='multiple'?'Syncing the quiz set for every player':'Almost ready — starting your quiz'
  ];
  let i=0; if(sub)sub.textContent=`${mode==='multiple'?'Your multiplayer room':'Your quiz'} is getting a fresh AI-generated question set.`;
  if(status)status.textContent=messages[0];
  clearInterval(aiGenStatusTimer);
  aiGenStatusTimer=setInterval(()=>{i=(i+1)%messages.length;if(status)status.textContent=messages[i]},1500);
  overlay.classList.add('show');
  document.body.style.overflow='hidden';
}
function hideAIGenerating(){
  clearInterval(aiGenStatusTimer);aiGenStatusTimer=null;
  const overlay=document.getElementById('aiGeneratingOverlay'); if(overlay)overlay.classList.remove('show');
  document.body.style.overflow='';
}
async function generateAIQuestions(subject,difficulty,count){
  const target=Math.max(1,Math.min(1000,Number(count)||10));
  const subjectSelect=document.getElementById('singleQuizSubject')||document.getElementById('hostQuizSubject');
  const subjects=subject==='all'?[...new Set(subjectSelect?Array.from(subjectSelect.options).map(o=>o.value).filter(v=>v&&v!=='all'):['Biochemistry'])]:[subject];
  let needed=target;
  const newItems=[];
  let cursor=0;
  while(needed>0){
    const currentSubject=subjects[cursor%subjects.length];
    const batch=Math.min(20,needed);
    const res=await fetch(QUESTION_GENERATOR_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject:currentSubject,difficulty,count:batch,format:'single_select',language:'en'})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.detail||data.error||'AI question generation failed');
    const generated=Array.isArray(data.questions)?data.questions:[];
    generated.forEach(q=>{
      const item={subject:currentSubject,difficulty,q:String(q.question||'').trim(),o:Array.isArray(q.options)?q.options.map(String):[],a:Number(q.answerIndex),e:String(q.explanation||'')};
      if(item.q&&item.o.length===4&&Number.isInteger(item.a)&&item.a>=0&&item.a<=3)newItems.push(item);
    });
    if(!generated.length)throw new Error('AI returned no questions. Please try again.');
    needed-=batch;cursor++;
  }
  const existing=new Set(aiGeneratedBank.map(q=>normalizeQuizQuestion(q.q)));
  newItems.forEach(q=>{const key=normalizeQuizQuestion(q.q);if(!existing.has(key)){aiGeneratedBank.push(q);existing.add(key);}});
  try{localStorage.setItem('mltAIGeneratedQuestions',JSON.stringify(aiGeneratedBank));}catch(e){}
  saveAIQuestionsToCloud(newItems).catch(()=>{});
  return newItems;
}

async function generateOneAIQuestion(subject,difficulty,excludeKeys=new Set()){
  const subjectSelect=document.getElementById('singleQuizSubject')||document.getElementById('hostQuizSubject');
  const subjects=subject==='all'?[...new Set(subjectSelect?Array.from(subjectSelect.options).map(o=>o.value).filter(v=>v&&v!=='all'):['Biochemistry'])]:[subject];
  for(let attempt=0;attempt<4;attempt++){
    const currentSubject=subjects[Math.floor(Math.random()*subjects.length)];
    const res=await fetch(QUESTION_GENERATOR_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject:currentSubject,difficulty,count:1,format:'single_select',language:'en'})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.detail||data.error||'AI question generation failed');
    const generated=Array.isArray(data.questions)?data.questions:[];
    const q=generated[0];
    if(!q)continue;
    const item={subject:currentSubject,difficulty,q:String(q.question||'').trim(),o:Array.isArray(q.options)?q.options.map(String):[],a:Number(q.answerIndex),e:String(q.explanation||'')};
    const key=normalizeQuizQuestion(item.q);
    if(item.q&&item.o.length===4&&Number.isInteger(item.a)&&item.a>=0&&item.a<=3&&!excludeKeys.has(key)){
      const existing=new Set(aiGeneratedBank.map(x=>normalizeQuizQuestion(x.q)));
      if(!existing.has(key)){
        aiGeneratedBank.push(item);
        try{localStorage.setItem('mltAIGeneratedQuestions',JSON.stringify(aiGeneratedBank));}catch(e){}
        saveAIQuestionsToCloud([item]).catch(()=>{});
      }
      return item;
    }
  }
  throw new Error('AI could not create a fresh question. Please try again.');
}

let singleAIQueue=[];
let singleAIPrefetchPromise=null;
let singleAITargetCount=0;
let singleAIFinished=false;

async function prefetchSingleAIQuestions(subject,difficulty,minimum=10){
  if(singleAIFinished)return;
  if(singleAIPrefetchPromise)return singleAIPrefetchPromise;
  singleAIPrefetchPromise=(async()=>{
    const keys=new Set([...singleAIQueue,...quizQuestions].map(x=>normalizeQuizQuestion(x.q)));
    while(singleAIQueue.length<minimum && (quizQuestions.length+singleAIQueue.length)<singleAITargetCount){
      const item=await generateOneAIQuestion(subject,difficulty,keys);
      const key=normalizeQuizQuestion(item.q);
      keys.add(key);singleAIQueue.push(item);
    }
  })().finally(()=>{singleAIPrefetchPromise=null;});
  return singleAIPrefetchPromise;
}

function getCachedAIQuestionsForQuiz(subject,count){
  const pool=getUniqueQuestionPool(subject);
  if(!pool.length)return [];
  const usedKey='mltUsedQuizQuestions:'+(subject||'all');
  let used=[];
  try{used=JSON.parse(localStorage.getItem(usedKey)||'[]');if(!Array.isArray(used))used=[];}catch(e){used=[]}
  const usedSet=new Set(used);
  const fresh=pool.filter(x=>!usedSet.has(normalizeQuizQuestion(x.q)));
  const source=fresh.length>=count?fresh:pool;
  return shuffle(source.slice()).slice(0,count);
}

async function startSinglePlayer(){
  const subject=document.getElementById('singleQuizSubject')?.value||'all';
  const count=Number(document.getElementById('singleQuizQuestionCount')?.value||50);
  const difficulty=document.getElementById('singleQuizDifficulty')?.value||'Medium';
  const status=document.getElementById('singleSetupStatus');
  const btn=document.getElementById('startSinglePlayerBtn');
  const initialCount=Math.min(10,Math.max(1,count));
  if(btn){btn.disabled=true;btn.textContent='⏳ Creating 5 Questions…';}
  if(status)status.textContent=`Preparing the first ${initialCount} questions from your saved AI library…`;
  showAIGenerating(subject,difficulty,initialCount,'single');
  singleAIQueue=[];singleAIPrefetchPromise=null;singleAITargetCount=Math.max(1,count);singleAIFinished=false;
  try{
    await loadCloudAIQuestions(subject);
    let initial=getCachedAIQuestionsForQuiz(subject,initialCount);
    const missing=initialCount-initial.length;
    if(missing>0){
      if(status)status.textContent=`Creating ${missing} new AI question${missing===1?'':'s'}…`;
      const generated=await generateAIQuestions(subject,difficulty,missing);
      initial=initial.concat(generated||[]);
    }
    if(!initial.length)throw new Error('No saved or newly generated AI questions are available.');
    quizQuestions=initial.slice(0,initialCount);
  }catch(error){
    const fallback=getCachedAIQuestionsForQuiz(subject,initialCount);
    if(fallback.length){
      quizQuestions=fallback;
      if(status)status.textContent='Using saved AI questions — you can play without internet.';
    }else{
      hideAIGenerating();
      if(status)status.textContent=error.message||'AI question generation failed. Please try again.';
      if(btn){btn.disabled=false;btn.textContent='Start Single Player';}
      return;
    }
  }
  selectedQuizSubject=subject;selectedQuestionCount=count;
  quizIndex=0;questionLocked=false;
  hostMode=false;localRole='single';localPlayerId='single-player';
  players=[{id:'single-player',name:'You',avatar:'🧑‍🔬',score:0,answered:0,correct:0,wrong:0,connected:true,answeredThisQuestion:false,retryUsed:false}];
  session={started:true,completed:false,subject,total:count,unlimited:false,startedAt:new Date().toISOString()};
  const chooser=document.getElementById('quizModeChooser');if(chooser)chooser.style.display='none';
  const single=document.getElementById('singleSetup');if(single)single.style.display='none';
  const card=document.getElementById('quizCard');if(card)card.style.display='block';
  document.getElementById('quizStats').style.display='none';
  setQuizScreenMode('player');
  currentAppStage='quiz-live';
  // Hide the global website header immediately when the live quiz starts.
  document.body.classList.add('quiz-active');
  if(typeof window.setQuizHeaderHidden==='function') window.setQuizHeaderHidden(true);
  window.dispatchEvent(new Event('quiz-stage-change'));
  history.pushState({view:'quiz',stage:'quiz-live'},'', '#quiz-live');
  if(btn){btn.disabled=false;btn.textContent='Start Single Player';}
  hideAIGenerating();
  startSingleQuestion();
  // Prepare upcoming questions in the background while the player answers.
  prefetchSingleAIQuestions(subject,difficulty,10).catch(()=>{});
}
function showLeaveQuizModal(){
  let modal=document.getElementById('leaveQuizModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='leaveQuizModal';
    modal.className='leave-quiz-modal';
    modal.innerHTML='<div class="leave-quiz-dialog" role="dialog" aria-modal="true" aria-label="Quiz options"><button type="button" class="leave-quiz-choice" id="leaveQuizConfirm">Leave Quiz</button><button type="button" class="leave-quiz-choice" id="leaveQuizContinue">Continue Quiz</button></div>';
    document.body.appendChild(modal);
    document.getElementById('leaveQuizConfirm').addEventListener('click',()=>{hideLeaveQuizModal();resetQuizToHome();});
    document.getElementById('leaveQuizContinue').addEventListener('click',hideLeaveQuizModal);
  }
  modal.classList.add('show');
}
function hideLeaveQuizModal(){
  document.getElementById('leaveQuizModal')?.classList.remove('show');
}
function leaveQuizFromActiveQuestion(){
  if(currentAppStage==='quiz-live' && !session?.completed){showLeaveQuizModal();return true;}
  return false;
}

function startSingleQuestion(){
  clearTimeout(questionTimer);questionLocked=false;questionStartedAt=Date.now();
  const p=players[0];if(p){p.answeredThisQuestion=false;p.retryUsed=false;}
  ensureAudio();playQuestionSound();renderSingleQuestion();
  questionTimer=setTimeout(()=>endSingleQuestion(true),QUESTION_DURATION);
}
function renderSingleQuestion(){
  const card=document.getElementById('quizCard'),item=quizQuestions[quizIndex];if(!card||!item)return;
  const order=shuffle(item.o.map((label,i)=>({label,i})));
  card.innerHTML=`<div class="quiz-live-shell"><div class="quiz-score">SINGLE PLAYER · Question ${quizIndex+1} of ${quizQuestions.length}</div><div class="quiz-timer" id="singleTimer">25.0s</div><div class="quiz-progress"><span id="singleProgress" style="width:100%"></span></div><div class="quiz-q">${esc(cleanQuizQuestion(item.q))}</div><div class="quiz-options">${order.map(x=>`<button class="quiz-option" type="button" data-answer="${x.i}">${esc(x.label)}</button>`).join('')}</div><button class="quiz-leave-btn" id="quizLeaveBtn" type="button">Leave Quiz</button><div class="quiz-feedback" id="singleFeedback"></div></div>`;
  document.getElementById('quizLeaveBtn')?.addEventListener('click',showLeaveQuizModal);
  const localStart=questionStartedAt;
  const tick=()=>{const left=Math.max(0,QUESTION_DURATION-(Date.now()-localStart));const t=document.getElementById('singleTimer'),bar=document.getElementById('singleProgress');if(t){t.textContent=(left/1000).toFixed(1)+'s';t.classList.toggle('timer-warning',left<=5000&&left>3000);t.classList.toggle('timer-critical',left<=3000&&left>0)}if(bar)bar.style.width=(left/QUESTION_DURATION*100)+'%';if(left>0&&!questionLocked)requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
  card.querySelectorAll('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>{
    if(questionLocked)return;questionLocked=true;clearTimeout(questionTimer);btn.dataset.selected='true';card.querySelectorAll('.quiz-option').forEach(b=>b.disabled=true);
    const answer=Number(btn.dataset.answer),correct=answer===Number(item.a);const elapsed=Math.max(0,Date.now()-questionStartedAt);const ratio=Math.max(0,Math.min(1,(QUESTION_DURATION-elapsed)/QUESTION_DURATION));const points=correct?Math.ceil(MAX_BASE_POINTS*ratio):0;const p=players[0];if(p){p.answered++;p.answeredThisQuestion=true;if(correct){p.correct++;p.score+=points;}else p.wrong++;}
    const fb=document.getElementById('singleFeedback');if(fb){fb.textContent=correct?`Correct! +${points} points.`:`Wrong answer. 0 points.`;fb.classList.add('show');}
    if(correct){playCorrectSound();if(points)playPointsSound();}else playWrongSound();
    setTimeout(()=>endSingleQuestion(false),900);
  }));
}
async function endSingleQuestion(timedOut){
  if(session?.completed||currentAppStage!=='quiz-live')return;
  if(questionLocked&&timedOut)return;
  questionLocked=true;clearTimeout(questionTimer);
  if(timedOut){playTimeUpSound();const fb=document.getElementById('singleFeedback');if(fb){fb.textContent='Time up. No points.';fb.classList.add('show');}document.querySelectorAll('#quizCard .quiz-option').forEach(b=>b.disabled=true);}
  // The next question is normally already waiting in the background.
  if(quizIndex>=quizQuestions.length-1){
    if(quizQuestions.length>=singleAITargetCount){setTimeout(finishSinglePlayer,700);return;}
    const subject=selectedQuizSubject||'all';
    const difficulty=document.getElementById('singleQuizDifficulty')?.value||'Medium';
    if(singleAIQueue.length){
      quizQuestions.push(singleAIQueue.shift());
      prefetchSingleAIQuestions(subject,difficulty,10).catch(()=>{});
      setTimeout(()=>{quizIndex++;startSingleQuestion();},timedOut?700:250);
      return;
    }
    // Rare slow-network case: wait for only the NEXT question, not the whole quiz.
    const card=document.getElementById('quizCard');
    if(card){card.insertAdjacentHTML('beforeend','<div class="single-next-loading">✨ Preparing your next question…</div>');}
    try{
      const next=await generateOneAIQuestion(subject,difficulty,new Set(quizQuestions.map(x=>normalizeQuizQuestion(x.q))));
      document.querySelector('.single-next-loading')?.remove();
      quizQuestions.push(next);
      prefetchSingleAIQuestions(subject,difficulty,10).catch(()=>{});
      setTimeout(()=>{quizIndex++;startSingleQuestion();},250);
    }catch(e){
      document.querySelector('.single-next-loading')?.remove();
      finishSinglePlayer();
    }
    return;
  }
  setTimeout(()=>{quizIndex++;startSingleQuestion();},timedOut?700:250);
}
function finishSinglePlayer(){
  if(session?.completed)return;session.completed=true;session.finishedAt=new Date().toISOString();stopQuizKeepAlive();releaseQuizWakeLock();renderAnimatedFinalResults(players);currentAppStage='quiz-result';history.pushState({view:'quiz',stage:'quiz-result'},'', '#quiz-result');updateGlobalBack();
}

function createRoom(){
  if(hostPeer)return;
  openMultiplePlayerSetup();
  history.pushState({view:'quiz',stage:'host-room'},'', '#quiz-host');
  currentAppStage='host-room';updateGlobalBack();
  setQuizScreenMode('');
  hostMode=true;localRole='host';
  selectedQuizSubject='all';
  selectedQuestionCount=50;
  hideQuizHomeForHostLobby();
  const panel=document.getElementById('hostControlPanel');
  panel.style.display='block';
  const subjectSelect=document.getElementById('quizSubject');
  const subjectOptions=subjectSelect?Array.from(subjectSelect.options).map(o=>`<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join(''): '<option value="all">All Subjects</option>';
  panel.innerHTML=`
    <div class="host-lobby" id="hostLobby">
      <div id="hostSetupArea">
        <div class="eyebrow">HOST ROOM SETUP</div>
        <h4>Create New Room</h4>
        <p style="margin:0;opacity:.82">Choose the subject and number of questions for this room.</p>
        <div class="host-lobby-grid">
          <label class="host-lobby-item" style="display:block;cursor:pointer">
            <span>Subject</span>
            <select id="hostQuizSubject" class="quiz-select" style="width:100%;margin-top:8px;background:#fff;color:#12303a;border:0;opacity:1;-webkit-text-fill-color:#12303a">
              ${subjectOptions}
            </select>
          </label>
          <label class="host-lobby-item" style="display:block;cursor:pointer">
            <span>Number of Questions</span>
            <select id="hostQuizQuestionCount" class="quiz-select" style="width:100%;margin-top:8px;background:#fff;color:#12303a;border:0;opacity:1;-webkit-text-fill-color:#12303a">
              <option value="10">10 Questions</option>
              <option value="20">20 Questions</option>
              <option value="30">30 Questions</option>
              <option value="40">40 Questions</option>
              <option value="50" selected>50 Questions</option>
            </select>
          </label>
          <label class="host-lobby-item" style="display:block;cursor:pointer">
            <span>AI Difficulty</span>
            <select id="hostQuizDifficulty" class="quiz-select" style="width:100%;margin-top:8px;background:#fff;color:#12303a;border:0;opacity:1;-webkit-text-fill-color:#12303a">
              <option>Easy</option><option selected>Medium</option><option>Hard</option>
            </select>
          </label>
        </div>
        <div class="host-lobby-actions">
          <button class="quiz-btn" id="createNewRoomBtn" type="button">Create New Room</button>
          <button class="action-back-btn" id="hostLobbyBackBtn" type="button">← Back</button>
        </div>
      </div>
      <div class="host-generated" id="hostGeneratedArea">
        <div class="eyebrow" style="color:#bfe8e7">ROOM READY</div>
        <h4>Share This Room</h4>
        <div class="eyebrow" style="color:#bfe8e7;margin-top:14px">ROOM NUMBER</div>
        <div class="room-number" id="roomCodeDisplay">—</div>
        <div class="qr-wrap"><div id="roomQr"></div></div>
        <div class="room-status" id="roomStatus">Creating room…</div>
        <div class="host-lobby-actions">
          <button class="quiz-btn" id="hostStartBtn" type="button" style="display:none">Start Quiz</button>
          <button class="action-back-btn" id="hostGeneratedBackBtn" type="button">← Back</button>
        </div>
      </div>
    </div>`;
  document.getElementById('createNewRoomBtn').addEventListener('click',()=>{
    ensureAudio();playJoinSound();
    selectedQuizSubject=document.getElementById('hostQuizSubject')?.value||'all';
    selectedQuestionCount=Number(document.getElementById('hostQuizQuestionCount')?.value||50);
    const setup=document.getElementById('hostSetupArea');
    if(setup)setup.style.display='none';
    const generated=document.getElementById('hostGeneratedArea');
    if(generated)generated.style.display='block';
    generateHostRoom();
  });
  document.getElementById('hostLobbyBackBtn').addEventListener('click',()=>{
    resetQuizToHome();showView('quiz',false);history.replaceState({view:'quiz',stage:'quiz-home'},'', '#quiz');
  });
  document.getElementById('hostGeneratedBackBtn').addEventListener('click',()=>resetQuizToHome());
}

function generateHostRoom(){
  if(hostPeer)return;
  const generated=document.getElementById('hostGeneratedArea');
  if(generated)generated.style.display='block';
  roomCode=String(Math.floor(100000+Math.random()*900000));
  const display=document.getElementById('roomCodeDisplay');if(display)display.textContent=roomCode;
  setRoomStatus('Connecting host room…');
  const peerId='mlt'+roomCode;
  try{hostPeer=new Peer(peerId,{debug:1,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}})}
  catch(err){setRoomStatus('Could not start host networking. Reload the page and try again.');return}
  hostPeer.on('open',()=>{
    const base=location.href.split('#')[0].split('?')[0];
    const joinUrl=base+'?quizJoin='+roomCode+'#quiz';
    const qr=document.getElementById('roomQr');
    if(qr){qr.innerHTML='';if(window.QRCode)new QRCode(qr,{text:joinUrl,width:190,height:190});}
    const start=document.getElementById('hostStartBtn');if(start)start.style.display='inline-block';
    setRoomStatus('Room ready. Share the number or QR code with players.');
    requestQuizWakeLock();
  });
  hostPeer.on('connection',handleHostConnection);
  hostPeer.on('disconnected',()=>{setRoomStatus('Host connection to signaling server was lost. Reconnecting…');try{hostPeer.reconnect()}catch(e){}});
  hostPeer.on('error',e=>{
    const msg=e&&e.type==='unavailable-id'?'This room number is already in use. Please generate a new room.':
      e&&e.type==='peer-unavailable'?'Player could not find the room. Check the 6-digit number.':
      e&&e.type==='network'?'Network error. Check Wi-Fi/mobile data and try again.':
      'Host room error: '+(e&&e.type?e.type:'unknown');
    setRoomStatus(msg);
  });
}

function renderHostWaiting(){
  startWaitingSound();
  const card=document.getElementById('quizCard');
  if(!card)return;
  card.innerHTML=`<div class="quiz-waiting-screen">
    <div class="waiting-icon">⏳</div>
    <h3>Waiting for players</h3>
    <p>Room <strong>${esc(roomCode)}</strong> is ready.</p>
    <p>Players can join with the room number or QR code.</p>
    <div class="quiz-feedback show">The host will start the quiz when everyone is ready.</div>
  </div>`;
}
function handleHostConnection(conn){
  hostConnections.push(conn);
  conn.on('open',()=>{
    conn.on('data',data=>handleHostData(conn,data));
    conn.on('close',()=>{
      hostConnections=hostConnections.filter(c=>c!==conn);
      if(conn.playerId){
        const p=players.find(x=>x.id===conn.playerId);
        if(p)p.connected=false;
        broadcastState();
        setRoomStatus(players.filter(p=>p.connected).length+' player(s) connected.');
      }
    });
    conn.send({type:'hello',room:roomCode});
  });
}
function handleHostData(conn,data){
  if(!data||!data.type)return;
  if(data.type==='join'){
    if(data.role!=='player'){conn.send({type:'reject',message:'Only players can join this room.'});return}
    if(session?.started){conn.send({type:'reject',message:'The quiz has already started. Please join before the host starts.'});return}
    const cleanName=String(data.name||'Player').trim().slice(0,24);
    if(!cleanName){conn.send({type:'reject',message:'Enter a player name.'});return}
    if(players.some(p=>p.name.toLowerCase()===cleanName.toLowerCase())){conn.send({type:'reject',message:'That player name is already in use.'});return}
    const p={id:'p'+Date.now()+Math.random().toString(16).slice(2),name:cleanName,avatar:data.avatar||'🧑‍🔬',score:0,answered:0,correct:0,wrong:0,connected:true,answeredThisQuestion:false,retryUsed:false};
    players.push(p);conn.playerId=p.id;conn.role='player';
    conn.send({type:'joined',playerId:p.id,players,questionIndex:quizIndex,started:false,finished:false});
    broadcastState();setRoomStatus(players.filter(p=>p.connected).length+' player(s) connected.');
    return;
  }
  if(data.type==='answer'&&conn.role==='player'){
    const p=players.find(x=>x.id===conn.playerId),item=quizQuestions[quizIndex];
    if(!p||!item||p.answeredThisQuestion||!session?.started||questionLocked)return;
    p.answeredThisQuestion=true;p.answered++;
    const correct=Number(data.answer)===Number(item.a);
    const elapsed=Math.max(0,Date.now()-questionStartedAt);
    const remaining=Math.max(0,QUESTION_DURATION-elapsed);
    const ratio=Math.max(0,Math.min(1,remaining/QUESTION_DURATION));
    const basePoints=correct?Math.ceil(MAX_BASE_POINTS*ratio):0;
    const carryPoints=0;
    const points=basePoints;
    if(correct){p.score+=points;p.correct++;}else p.wrong++;
    conn.send({type:'answerResult',correct,points,basePoints,carryPoints,correctIndex:item.a,explanation:item.e||'',elapsed,remaining,retryAllowed:!correct&&!p.retryUsed});
    broadcastState();
  }
  if(data.type==='retryAnswer'&&conn.role==='player'){
    const p=players.find(x=>x.id===conn.playerId);
    if(!p||!session?.started||questionLocked||!p.answeredThisQuestion||p.retryUsed)return;
    if((p.wrong||0)>0)p.wrong--;
    if((p.answered||0)>0)p.answered--;
    p.answeredThisQuestion=false;
    p.retryUsed=true;
    conn.send({type:'answerRetry',questionIndex:quizIndex});
    broadcastState();
  }
}
async function startQuiz(){
  if(!hostMode){setJoinStatus('Only the host can start the quiz.');return}
  if(!players.some(p=>p.connected)){setRoomStatus('Waiting for at least one player to join.');return}
  const subject=hostMode&&selectedQuizSubject?selectedQuizSubject:(document.getElementById('quizSubject')?.value||'all');
  const countValue=hostMode?selectedQuestionCount:(document.getElementById('quizQuestionCount')?.value||'');
  selectedQuestionCount=countValue===''?'':Number(countValue);
  const difficulty=document.getElementById('hostQuizDifficulty')?.value||'Medium';
  const requestedCount=selectedQuestionCount===''?20:Number(selectedQuestionCount);
  const startBtn=document.getElementById('hostStartBtn');
  if(startBtn){startBtn.disabled=true;startBtn.textContent='⏳ Creating Quiz…';}
  setRoomStatus('Creating a fresh AI question set for everyone…');
  showAIGenerating(subject,difficulty,requestedCount,'multiple');
  try{await generateAIQuestions(subject,difficulty,requestedCount);}catch(error){hideAIGenerating();setRoomStatus(error.message||'AI question generation failed. Please try again.');if(startBtn){startBtn.disabled=false;startBtn.textContent='Start Quiz';}return;}
  let pool=getUniqueQuestionPool(subject);
  if(!pool.length){setRoomStatus('No AI questions were returned. Please try again.');if(startBtn){startBtn.disabled=false;startBtn.textContent='Start Quiz';}return}
  if(selectedQuestionCount===''){
    quizQuestions=pickFreshQuizQuestions(pool,pool.length,subject);
  }else{
    const actualCount=Math.min(Number(selectedQuestionCount),pool.length);
    quizQuestions=pickFreshQuizQuestions(pool,actualCount,subject);
    if(actualCount<Number(selectedQuestionCount))setRoomStatus(`${actualCount} unique questions are available for this subject. Repeated questions were removed.`);
  }
  if(!quizQuestions.length){setRoomStatus('No questions available for this subject.');return}
  quizIndex=0;resetPlayers();
  session={started:true,completed:false,subject,total:quizQuestions.length,unlimited:false,startedAt:new Date().toISOString()};
  document.getElementById('quizStats').style.display='grid';
  if(startBtn){startBtn.style.display='none';startBtn.disabled=false;startBtn.textContent='Start Quiz';}
  document.getElementById('joinPanel').style.display='none';
  const lobby=document.getElementById('hostLobby');if(lobby)lobby.classList.add('host-lobby-only-hidden');
  document.getElementById('subjectControls').style.display='none';
  document.getElementById('questionCountControls').style.display='none';
  setQuizScreenMode('host-live');
  currentAppStage='quiz-live';updateGlobalBack();
  history.pushState({view:'quiz',stage:'quiz-live'},'', '#quiz-live');
  requestQuizWakeLock();
  startQuizKeepAlive();
  startQuestion();
}
function startQuestion(){
  stopWaitingSound(); ensureAudio(); clearTimeout(questionTimer);questionLocked=false;
  players.forEach(p=>{p.answeredThisQuestion=false;p.retryUsed=p.retryUsed||false});
  questionStartedAt=Date.now();playQuestionSound();hostRenderQuestion();broadcastQuestion();broadcastState();
  questionTimer=setTimeout(endQuestion,QUESTION_DURATION);
}
function broadcastQuestion(){broadcast({type:'question',index:quizIndex,total:quizQuestions.length,item:quizQuestions[quizIndex],startedAt:questionStartedAt,duration:QUESTION_DURATION})}
function hostRenderQuestion(){
  const card=document.getElementById('quizCard'),item=quizQuestions[quizIndex];
  card.innerHTML=`<div class="quiz-live-shell">
    <div class="quiz-score">HOST · Question ${quizIndex+1} of ${quizQuestions.length}</div>
    <div class="quiz-timer" id="hostTimer">25.0s</div>
    <div class="quiz-progress"><span id="questionProgress" style="width:100%"></span></div>
    <div class="quiz-q">${esc(cleanQuizQuestion(item.q))}</div>
    <div class="quiz-options">${item.o.map((x,i)=>`<div class="quiz-option host-option">${String.fromCharCode(65+i)}. ${esc(x)}</div>`).join('')}</div>
    <div class="quiz-feedback show" id="hostAnswerCounter">Players connected: ${players.filter(p=>p.connected).length} · Answers: 0/${players.filter(p=>p.connected).length}</div>
    <div class="quiz-footer">
      <span class="quiz-score">100 points maximum · decreases smoothly over 25 seconds</span>
      <button class="quiz-btn host-skip-btn" id="hostSkipBtn" type="button">Skip Question</button>
    </div>
    <div id="liveRankInline"></div>
  </div>`;
  runHostTimer();renderLiveRankInline();
}
function runHostTimer(){
  const timer=document.getElementById('hostTimer'),bar=document.getElementById('questionProgress');
  const tick=()=>{
    const left=Math.max(0,QUESTION_DURATION-(Date.now()-questionStartedAt));
    if(timer){timer.textContent=(left/1000).toFixed(1)+'s';timer.classList.toggle('timer-warning',left<=5000&&left>3000);timer.classList.toggle('timer-critical',left<=3000&&left>0)}
    if(bar)bar.style.width=(left/QUESTION_DURATION*100)+'%';
    if(left>0)requestAnimationFrame(tick);else playTimeUpSound();
  };
  requestAnimationFrame(tick);
}
function updateHostAnswerCounter(){
  const fb=document.getElementById('hostAnswerCounter');
  if(fb)fb.textContent=`Players connected: ${players.filter(p=>p.connected).length} · Answers: ${players.filter(p=>p.answeredThisQuestion).length}/${players.filter(p=>p.connected).length}`;
}
function skipCurrentQuestion(){if(!hostMode||questionLocked)return;questionLocked=true;clearTimeout(questionTimer);playSkipSound();broadcast({type:'skip',index:quizIndex});if(quizIndex>=quizQuestions.length-1){finishQuiz();return}setTimeout(()=>{quizIndex++;startQuestion()},250)}
function endQuestion(){
  if(questionLocked)return;
  questionLocked=true;clearTimeout(questionTimer);
  broadcast({type:'reveal',index:quizIndex,correctIndex:quizQuestions[quizIndex].a,players});
  updateStats();
  if(quizIndex>=quizQuestions.length-1){finishQuiz();return}
  setTimeout(()=>{quizIndex++;startQuestion()},700);
}
function renderAnimatedFinalResults(rankedPlayers){
  const quiz=document.getElementById('quiz'),card=document.getElementById('quizCard');
  if(!card)return;
  quiz.classList.add('quiz-result-mode');
  const ranked=rankedPlayers&&rankedPlayers.length?rankedPlayers:getRankedPlayers();
  const top=ranked.slice(0,5);
  const winner=top[0];
  const confetti=Array.from({length:46},(_,i)=>`<i style="left:${(i*37)%101}%;--delay:${(i%12)*.13}s;--fall:${4+(i%5)*.7}s;--rot:${(i%2?'':'-')}${35+i*7}deg;background:hsl(${(i*47)%360} 85% 60%)"></i>`).join('');
  const stars=Array.from({length:14},(_,i)=>`<i style="left:${8+(i*71)%86}%;top:${10+(i*43)%72}%;animation-delay:${(i%7)*.18}s">✦</i>`).join('');
  const cards=top.map((p,i)=>{
    const rank=i+1;
    const accuracy=p.answered?Math.round((p.correct||0)/p.answered*100):0;
    return `<div class="final-rank-card rank-${rank}" data-rank="${rank}">
      <div class="final-rank-badge">#${rank}</div>
      <div class="final-rank-name"><span class="final-avatar">${esc(p.avatar||'🧑‍🔬')}</span><strong>${esc(p.name)}</strong><small>${p.correct||0} correct · ${p.answered||0} answered · ${accuracy}% accuracy</small></div>
      <div class="final-rank-score">${p.score||0}<small>points</small></div>
    </div>`;
  }).join('');
  card.innerHTML=`<div class="final-showcase" id="finalShowcase">
    <div class="final-confetti">${confetti}</div><div class="final-stars">${stars}</div>
    <div class="final-kicker">THE QUIZ IS COMPLETE</div>
    <div class="final-title">FINAL RESULTS</div>
    <div class="final-subtitle">Watch the leaderboard reveal — 5th place to 1st place</div>
    <div class="final-stage">
      <div class="final-announcement" id="finalAnnouncement">
        <div style="position:relative;z-index:2;display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;background:linear-gradient(135deg,#fff3b0,#ffd45c);border:1px solid rgba(255,180,20,.5);color:#8a5b00;font-size:11px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase;box-shadow:0 8px 24px rgba(255,181,30,.22)">🏆 CHAMPION</div>
        <div class="crown" style="position:relative;z-index:2">👑</div>
        <h4 style="position:relative;z-index:2">${winner?`🎉 ${esc(winner.name)} WINS!`:'Final Results'}</h4>
        <p style="position:relative;z-index:2">${winner?`${esc(winner.avatar||'🏆')} · ${winner.score||0} points · Rank #1 · ${winner.correct||0} correct`:'No players completed the quiz.'}</p>
        ${winner?`<div style="position:relative;z-index:2;margin-top:13px;padding:9px 15px;border-radius:999px;background:rgba(123,85,255,.08);border:1px solid rgba(123,85,255,.14);color:#6654a8;font-size:12px;font-weight:900">✨ Outstanding performance · Quiz Champion ✨</div>`:''}
      </div>
      ${cards}
    </div>
    <div class="final-progress" id="finalProgress">${top.length?'Preparing the reveal…':'No players completed the quiz.'}</div>
  </div>`;
  if(!top.length)return;

  const announcement=document.getElementById('finalAnnouncement');
  const progress=document.getElementById('finalProgress');
  const showcase=document.getElementById('finalShowcase');
  const cardEls=[...card.querySelectorAll('.final-rank-card')];
  let idx=cardEls.length-1;
  /* Clean wipe: let the old quiz disappear before the celebration appears. */
  setTimeout(()=>{
    if(showcase)showcase.classList.add('results-visible');
  },500);
  setTimeout(()=>{
    if(announcement)announcement.classList.add('active');
    if(progress)progress.textContent='🎊 Celebrate the champion! The leaderboard is coming next…';
    playFinishSound();
  },1200);
  const revealNext=()=>{
    if(idx<0){
      if(progress)progress.textContent='🏆 Congratulations!';
      setTimeout(()=>playPointsSound(),250);
      // Keep the final results on screen. The Back button now returns directly to Quiz Home.
      return;
    }
    const el=cardEls[idx], rank=Number(el.dataset.rank);
    el.style.zIndex=10+rank;
    el.classList.add('reveal');
    if(progress)progress.textContent=rank===1?'👑 WINNER · RANK #1':`Revealing rank #${rank}`;
    if(rank===1){playFinishSound();setTimeout(()=>playPointsSound(),350)}
    else playPointsSound();
    idx--;
    setTimeout(revealNext,1200);
  };
  setTimeout(revealNext,5200);
}
function renderFinalTopFive(targetId='finalTopFive',showAllMessage=true){
  renderAnimatedFinalResults(getRankedPlayers());
}
function finishQuiz(){
  const awakeNote=document.getElementById('quizKeepAwake');if(awakeNote)awakeNote.classList.remove('show');
  stopQuizKeepAlive();
  session.completed=true;session.finishedAt=new Date().toISOString();
  const ranked=getRankedPlayers(),topFive=ranked.slice(0,5);
  broadcast({type:'finished',players,topFive});
  renderAnimatedFinalResults(ranked);
  currentAppStage='quiz-result';
  history.pushState({view:'quiz',stage:'quiz-result'},'', '#quiz-result');
  updateGlobalBack();
  setRoomStatus('Quiz complete — final results revealing.');
}
function connectAsPlayer(){
  const input=document.getElementById('joinCode'),code=input.value.replace(/\D/g,'').slice(0,6);
  input.value=code;
  const name=document.getElementById('joinName').value.trim();
  if(code.length!==6){setJoinStatus('Enter the 6-digit room number.');input.focus();return}
  if(!name){setJoinStatus('Enter your player name.');document.getElementById('joinName').focus();return}
  if(hostMode){setJoinStatus('This page is already the host. Use another phone/browser for a player.');return}
  localRole='player';document.getElementById('quizStats').style.display='grid';
  document.getElementById('questionCountControls').style.display='none';
  document.getElementById('subjectControls').style.display='none';
  setJoinStatus('Connecting to host '+code+'…');
  let peer;
  try{peer=new Peer(undefined,{debug:1,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}})}
  catch(err){setJoinStatus('Could not start player networking. Reload the page and try again.');return}
  peer.on('open',()=>{
    setJoinStatus('Found player network. Connecting to room '+code+'…');
    const conn=peer.connect('mlt'+code,{reliable:true,serialization:'json'});
    window.quizConn=conn;
    conn.on('open',()=>{
      conn.send({type:'join',role:'player',name,avatar:document.getElementById('joinAvatar').value});
      setJoinStatus('Connected. Waiting for the host to start…');
    });
    conn.on('data',handleClientData);
    conn.on('close',()=>setJoinStatus('Disconnected from host.'));
    conn.on('error',e=>setJoinStatus('Player connection error: '+(e&&e.type?e.type:'unknown')+'. Check the room number.'));
  });
  peer.on('error',e=>{
    const msg=e&&e.type==='peer-unavailable'?'Room not found. Make sure the host is still on the page and the 6-digit number is correct.':
      e&&e.type==='network'?'Network error. Check Wi-Fi/mobile data and try again.':
      'Could not join room: '+(e&&e.type?e.type:'unknown');
    setJoinStatus(msg);
  });
}
function renderClientWaiting(){
  startWaitingSound(); currentAppStage='player-waiting';updateGlobalBack();
  setQuizScreenMode('player');
  const card=document.getElementById('quizCard');
  if(!card)return;
  card.innerHTML=`<div class="quiz-waiting-screen"><div class="waiting-icon">⏳</div><h3>Waiting for host</h3><p>You are connected to the quiz room.</p><p>The questions will appear when the host starts the quiz.</p><div class="quiz-feedback show">Please keep this page open.</div></div>`;
  const joinPanel=document.getElementById('joinPanel');if(joinPanel)joinPanel.style.display='none';
}
function handleClientData(data){
  if(data.type==='reject'){setJoinStatus(data.message);return}
  if(data.type==='joined'){
    localPlayerId=data.playerId;players=data.players||[];updateStats();history.pushState({view:'quiz',stage:'player-waiting'},'', '#quiz-player');renderClientWaiting();return
  }
  if(data.type==='state'){
    players=data.players||[];updateStats();
    if(data.finished)renderClientFinished();
    else if(data.started){setQuizScreenMode('player')}
    return
  }
  if(data.type==='question'){quizIndex=data.index;renderClientQuestion(data.item,data.total,data.startedAt);return}
  if(data.type==='answerResult'){
    const fb=document.getElementById('quizFeedback'),selected=document.querySelector('.quiz-option[data-selected="true"]');
    if(selected)selected.classList.add(data.correct?'correct':'wrong');
    if(data.correct){playCorrectSound();if(data.points)playPointsSound();if(fb){fb.textContent=`Correct! +${data.points} points (${data.basePoints} base + ${data.carryPoints} carry).`;fb.classList.add('show')}}
    else{playWrongSound();if(fb){fb.innerHTML='Wrong answer. 0 points.<br><button type="button" class="quiz-btn quiz-back-action show" id="retryAnswerBtn">↩ Back &amp; Try Again</button>';fb.classList.add('show');const retry=document.getElementById('retryAnswerBtn');if(retry&&data.retryAllowed){retry.addEventListener('click',()=>{retry.disabled=true;window.quizConn?.send({type:'retryAnswer'});});}else if(retry){retry.style.display='none';}}}
    document.querySelectorAll('.quiz-option').forEach(b=>b.disabled=true);return
  }
  if(data.type==='answerRetry'){
    const fb=document.getElementById('quizFeedback');
    document.querySelectorAll('.quiz-option').forEach(b=>{b.disabled=false;b.classList.remove('wrong','correct');b.removeAttribute('data-selected');});
    if(fb){fb.innerHTML='You can try this question once more.';fb.classList.add('show');}
    window.__quizLocalLocked=false;return;
  }
  if(data.type==='skip'){playSkipSound();const fb=document.getElementById('quizFeedback');if(fb){fb.textContent='Host skipped this question. Next question…';fb.classList.add('show')}document.querySelectorAll('.quiz-option').forEach(b=>b.disabled=true);return}
  if(data.type==='reveal'){
    document.querySelectorAll('.quiz-option').forEach(b=>b.disabled=true);
    const fb=document.getElementById('quizFeedback');
    if(fb){fb.textContent='Time up. Next question…';fb.classList.add('show')}
    return
  }
  if(data.type==='finished')renderClientFinished(data.topFive);
}
function renderClientQuestion(item,total,startedAt){
  stopWaitingSound(); ensureAudio(); playQuestionSound(); setQuizScreenMode('player');
  const card=document.getElementById('quizCard');
  const order=shuffle(item.o.map((label,i)=>({label,i})));
  card.innerHTML=`<div class="quiz-live-shell">
    <div class="quiz-score">PLAYER · Question ${quizIndex+1} of ${total}</div>
    <div class="quiz-timer" id="clientTimer">25.0s</div>
    <div class="quiz-progress"><span id="clientProgress" style="width:100%"></span></div>
    <div class="quiz-q">${esc(cleanQuizQuestion(item.q))}</div>
    <div class="quiz-options">${order.map(x=>`<button class="quiz-option" type="button" data-answer="${x.i}">${esc(x.label)}</button>`).join('')}</div>
    <div class="quiz-feedback" id="quizFeedback"></div>
    
    <div id="liveRankInline"></div>
  </div>`;
  renderLiveRankInline();
  const localStart=Number(startedAt)||Date.now();let locked=false;window.__quizLocalLocked=false;
  const tick=()=>{
    const left=Math.max(0,QUESTION_DURATION-(Date.now()-localStart));
    const t=document.getElementById('clientTimer'),bar=document.getElementById('clientProgress');
    if(t){t.textContent=(left/1000).toFixed(1)+'s';t.classList.toggle('timer-warning',left<=5000&&left>3000);t.classList.toggle('timer-critical',left<=3000&&left>0)}
    if(bar)bar.style.width=(left/QUESTION_DURATION*100)+'%';
    if(left>0&&!locked){const sec=Math.ceil(left/1000);if(sec<=3&&Math.abs(left-(sec*1000-70))<85)playCountdownSound(sec);requestAnimationFrame(tick);}else if(left<=0&&!locked){playTimeUpSound();document.querySelectorAll(".quiz-option").forEach(b=>b.disabled=true);}
    else if(left===0)document.querySelectorAll('.quiz-option').forEach(b=>b.disabled=true);
  };
  requestAnimationFrame(tick);
  card.querySelectorAll('.quiz-option').forEach(b=>b.addEventListener('click',()=>{
    if(window.__quizLocalLocked)return;locked=true;window.__quizLocalLocked=true;
    card.querySelectorAll('.quiz-option').forEach(x=>x.disabled=true);
    b.dataset.selected='true';ensureAudio();window.quizConn?.send({type:'answer',answer:Number(b.dataset.answer)});
  }));
}
function renderClientFinished(topFive){
  stopWaitingSound();ensureAudio();
  // Mark the player session complete so browser Back skips the last question/waiting screen.
  if(session){session.completed=true;session.finishedAt=new Date().toISOString();}
  const ranked=topFive&&topFive.length?topFive:getRankedPlayers().slice(0,5);
  renderAnimatedFinalResults(ranked);
  currentAppStage='quiz-result';
  history.pushState({view:'quiz',stage:'quiz-result'},'', '#quiz-result');
  updateGlobalBack();
}
/* Self-generated game sound effects: no external audio files required. */
let audioCtx=null, waitingSoundTimer=null, audioMaster=0.8;

function ensureAudio(){
  try{
    if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
  }catch(e){}
}

function env(g, when, attack, decay, peak){
  g.gain.cancelScheduledValues(when);
  g.gain.setValueAtTime(0.0001,when);
  g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*audioMaster),when+attack);
  g.gain.exponentialRampToValueAtTime(.0001,when+attack+decay);
}

function osc(freq,dur,type='sine',peak=.05,delay=0,slide=0){
  try{
    ensureAudio(); if(!audioCtx)return;
    const t=audioCtx.currentTime+delay;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);
    env(g,t,.008,Math.max(.02,dur-.008),peak);
    o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.03);
  }catch(e){}
}

function noise(dur=.08,peak=.025,delay=0,filterFreq=1800){
  try{
    ensureAudio(); if(!audioCtx)return;
    const t=audioCtx.currentTime+delay, n=audioCtx.createBufferSource();
    const b=audioCtx.createBuffer(1,audioCtx.sampleRate*dur,audioCtx.sampleRate);
    const data=b.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    n.buffer=b;
    const f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
    f.type='bandpass';f.frequency.value=filterFreq;f.Q.value=1.2;
    env(g,t,.004,dur-.004,peak);n.connect(f);f.connect(g);g.connect(audioCtx.destination);
    n.start(t);
  }catch(e){}
}

function playQuestionSound(){
  // Longer, polished question-start cue.
  osc(392,.18,'sine',.045,0);
  osc(523.25,.20,'sine',.055,.13);
  osc(659.25,.24,'triangle',.065,.27);
  osc(783.99,.32,'triangle',.07,.42);
  osc(1046.5,.42,'sine',.055,.60);
  noise(.12,.018,.18,2600);
}

function playCorrectSound(){
  // Longer success fanfare.
  osc(523.25,.18,'sine',.055,0);
  osc(659.25,.20,'sine',.06,.12);
  osc(783.99,.24,'triangle',.065,.25);
  osc(1046.5,.30,'triangle',.07,.40);
  osc(1318.51,.42,'sine',.055,.58);
  osc(1567.98,.50,'sine',.045,.76);
}

function playWrongSound(){
  // Longer, softer error cue without being harsh.
  osc(260,.22,'sawtooth',.04,0,-80);
  osc(190,.28,'sawtooth',.038,.14,-55);
  osc(135,.36,'triangle',.032,.32,-30);
  noise(.16,.018,.08,650);
}

function playCountdownSound(n){
  if(n===3) osc(600,.08,'square',.022);
  else if(n===2) osc(700,.08,'square',.026);
  else if(n===1){osc(900,.13,'square',.035);noise(.04,.01,.01,2600);}
}

function playTimeUpSound(){
  osc(520,.16,'square',.03,0);
  osc(390,.20,'square',.035,.14,-80);
  osc(280,.28,'triangle',.04,.34,-60);
  noise(.14,.02,.18,900);
}

function playPointsSound(){
  osc(660,.08,'triangle',.035);
  osc(880,.10,'triangle',.04,.07);
  osc(1100,.16,'triangle',.045,.14);
}

function playNextQuestionSound(){
  osc(392,.12,'sine',.03,0);
  osc(523.25,.15,'sine',.038,.10);
  osc(659.25,.20,'triangle',.045,.22);
  osc(783.99,.28,'sine',.04,.38);
}

function playSkipSound(){
  osc(740,.07,'square',.025);
  osc(494,.09,'square',.022,.07);
  noise(.08,.018,.02,.05);
}

function playHostStartSound(){
  osc(330,.08,'sine',.025);
  osc(495,.10,'sine',.035,.07);
  osc(660,.18,'sine',.045,.15);
}

function playJoinSound(){
  osc(500,.08,'triangle',.025);
  osc(750,.12,'triangle',.035,.08);
}

function playWaitingPulse(){
  osc(392,.14,'sine',.012);
  osc(523,.18,'sine',.010,.12);
}

function startWaitingSound(){
  ensureAudio(); stopWaitingSound();
  try{ waitingSoundTimer=setInterval(playWaitingPulse,3000); }catch(e){}
}

function stopWaitingSound(){
  if(waitingSoundTimer){clearInterval(waitingSoundTimer);waitingSoundTimer=null;}
}

function playFinishSound(){
  osc(523,.10,'sine',.035);
  osc(659,.10,'sine',.04,.09);
  osc(784,.12,'sine',.045,.18);
  osc(1046,.28,'triangle',.055,.28);
}

function initFromQr(){const code=new URLSearchParams(location.search).get('quizJoin');if(code){document.getElementById('joinCode').value=code.replace(/\D/g,'').slice(0,6);setJoinStatus('Room number loaded from QR. Enter your name and tap Join Quiz.');location.hash='quiz';}}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){
    if(hostMode && session?.started && !session?.completed){
      requestQuizWakeLock();
      try{if(hostPeer && hostPeer.disconnected)hostPeer.reconnect()}catch(e){}
      broadcast({type:'resume',serverTime:Date.now(),questionIndex:quizIndex,total:quizQuestions.length});
    }
  }
});
window.addEventListener('pageshow',()=>{
  if(hostMode && session?.started && !session?.completed){requestQuizWakeLock();try{if(hostPeer && hostPeer.disconnected)hostPeer.reconnect()}catch(e){}}
});
document.addEventListener('input',e=>{if(e.target.id==='joinCode')e.target.value=e.target.value.replace(/\D/g,'').slice(0,6)});
const qCount=document.getElementById('quizQuestionCount');
const qCountHint=document.getElementById('questionCountHint');
const qCountMeta=document.getElementById('quizCountMeta');
function updateQuestionCountUI(){
  if(!qCount)return;
  const v=qCount.value;
  const subject=document.getElementById('quizSubject')?.value||'all';
  const available=getUniqueQuestionCount(subject);
  if(qCountHint)qCountHint.textContent=`${v} questions requested · ${available} unique questions available in the 50,000-question bank (duplicates removed).`;
  if(qCountMeta)qCountMeta.textContent=`${v} questions`;
}
qCount?.addEventListener('change',updateQuestionCountUI);
document.getElementById('quizSubject')?.addEventListener('change',updateQuestionCountUI);
document.getElementById('singleQuizSubject')?.addEventListener('change',()=>{
  const el=document.getElementById('singleSetupStatus');
  const subject=document.getElementById('singleQuizSubject')?.value||'all';
  const available=getUniqueQuestionCount(subject);
  if(el)el.textContent=`${available} unique questions available for this selection in the 50,000-question bank. Repeated questions are automatically removed.`;
});
updateQuestionCountUI();
document.getElementById('singlePlayerModeBtn')?.addEventListener('click',()=>{
  openSinglePlayerSetup();
  history.pushState({view:'quiz',stage:'single-setup'},'', '#quiz-setup');
  currentAppStage='single-setup';
  lastAppView='quiz';
  updateGlobalBack();
});
document.getElementById('multiplePlayerModeBtn')?.addEventListener('click',()=>{
  openMultiplePlayerSetup();
  history.pushState({view:'quiz',stage:'multiple-home'},'', '#quiz-multiple');
  currentAppStage='multiple-home';
  lastAppView='quiz';
  updateGlobalBack();
});
document.getElementById('singleSetupBackBtn')?.addEventListener('click',()=>{
  if(history.length>1)history.back();else renderQuizHomeFromHistory();
});
document.addEventListener('click',e=>{
  if(e.target.id==='multipleModeBackBtn'){
    if(history.length>1)history.back();
    else renderQuizHomeFromHistory();
  }
});
document.getElementById('startSinglePlayerBtn')?.addEventListener('click',()=>{ensureAudio();startSinglePlayer();});
document.addEventListener('click',e=>{if(e.target.id==='createRoomBtn'){ensureAudio();playJoinSound();createRoom()}if(e.target.id==='hostStartBtn'){ensureAudio();playHostStartSound();startQuiz()}if(e.target.id==='joinPlayerBtn'){ensureAudio();playJoinSound();connectAsPlayer()}if(e.target.id==='hostSkipBtn')skipCurrentQuestion();});
showQuizModeChooser();
function initialView(){const requested=location.hash.replace('#','');if(requested.startsWith('notes/')){const subject=decodeURIComponent(requested.slice(6));if(notes[subject]){showView('notes',false);openNote(subject,false);return}}if(requested==='quiz-setup'){showView('quiz',false);renderSingleSetupFromHistory();return}if(requested==='quiz-live'&&quizQuestions.length){showView('quiz',false);renderQuizLiveFromHistory();return}showView(['about','notes','quiz','contact'].includes(requested)?requested:'home',false);if(requested==='quiz'){currentAppStage='quiz-home';updateGlobalBack()}}
initialView();if(!history.state||!history.state.view){const v=['about','notes','quiz','contact'].includes(location.hash.replace('#',''))?location.hash.replace('#',''):'home';history.replaceState({view:v,stage:v},'',v==='home'?location.pathname+location.search:'#'+v);}initFromQr();


/* ===== Original inline script 4 ===== */
(function initQuizAvatarPicker(){
  const source=document.getElementById('joinAvatar');
  const picker=document.getElementById('avatarPicker');
  if(!source||!picker)return;
  picker.querySelectorAll('.avatar-choice').forEach(btn=>{
    btn.addEventListener('click',()=>{
      source.value=btn.dataset.avatar;
      picker.querySelectorAll('.avatar-choice').forEach(x=>x.classList.toggle('active',x===btn));
      try{ensureAudio();playJoinSound()}catch(e){}
    });
  });
})();


/* ===== Original inline script 5 ===== */
(function(){
 function lockQuiz(on){document.documentElement.classList.toggle('quiz-fullscreen',!!on);document.body.style.overflow=on?'hidden':'';if(on)window.scrollTo(0,0)}
 window.setQuizFullscreen=lockQuiz;
 const obs=new MutationObserver(function(){const c=document.getElementById('quizCard');const v=c&&getComputedStyle(c).display!=='none';const live=(typeof currentAppStage!=='undefined'&&currentAppStage==='quiz-live');if(v&&live)lockQuiz(true)});
 obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
 window.addEventListener('popstate',()=>setTimeout(()=>{const c=document.getElementById('quizCard');lockQuiz(!!(c&&getComputedStyle(c).display!=='none'))},50));
})();


/* ===== Original inline script 6 ===== */
(function(){
  const drawer=document.getElementById('mltDrawer');
  const overlay=document.getElementById('mltDrawerOverlay');
  const openBtn=document.getElementById('mltMenuButton');
  const closeBtn=document.getElementById('mltDrawerClose');
  const body=document.body;
  if(!drawer||!overlay||!openBtn)return;

  function closeDrawer(){
    body.classList.remove('mlt-menu-open');
    openBtn.classList.remove('open');
    openBtn.setAttribute('aria-expanded','false');
    drawer.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');
  }
  function openDrawer(){
    body.classList.add('mlt-menu-open');
    openBtn.classList.add('open');
    openBtn.setAttribute('aria-expanded','true');
    drawer.setAttribute('aria-hidden','false');
    overlay.setAttribute('aria-hidden','false');
  }
  openBtn.addEventListener('click',()=>body.classList.contains('mlt-menu-open')?closeDrawer():openDrawer());
  closeBtn&&closeBtn.addEventListener('click',closeDrawer);
  overlay.addEventListener('click',closeDrawer);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

  drawer.querySelectorAll('[data-view-jump]').forEach(btn=>{
    btn.addEventListener('click',()=>setTimeout(closeDrawer,80));
  });

  drawer.querySelectorAll('[data-drawer-expand]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.getAttribute('data-drawer-expand');
      const panel=document.getElementById('drawer'+id.charAt(0).toUpperCase()+id.slice(1));
      if(!panel)return;
      const isOpen=panel.classList.toggle('open');
      btn.classList.toggle('expanded',isOpen);
      btn.setAttribute('aria-expanded',String(isOpen));
    });
  });
})();


/* ===== Original inline script 7 ===== */
document.querySelectorAll('.mlt-offering-action').forEach(function(btn){
  btn.addEventListener('click',function(){
    var target=btn.getAttribute('data-view-jump');
    if(target && typeof showView==='function') showView(target);
  });
});

(function(){
  // Header visibility is controlled by the actual quiz stage, not by the
  // #quiz section being active. The quiz home also uses #quiz.active.
  window.setQuizHeaderHidden = function(active){
    document.body.classList.toggle('quiz-active', !!active);
  };
})();

(function(){
  function syncQuizHeader(){
    var live = (typeof currentAppStage !== 'undefined' && currentAppStage === 'quiz-live');
    document.body.classList.toggle('quiz-active', live);
  }
  window.setQuizHeaderHidden = function(active){ document.body.classList.toggle('quiz-active', !!active); };
  syncQuizHeader();
  window.addEventListener('popstate', function(){ setTimeout(syncQuizHeader, 30); });
})();

(function(){
  function sync(){
    var live=(typeof currentAppStage!=='undefined' && currentAppStage==='quiz-live');
    document.body.classList.toggle('quiz-active',live);
  }
  window.addEventListener('quiz-stage-change',sync);
  window.addEventListener('pageshow',sync);
  sync();
})();
