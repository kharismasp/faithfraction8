const $ = (id) => document.getElementById(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const state = {
  scene: 'prologue',
  teacherUnlock: false,
  hearts: 3,
  focus: 5,
  focusSecondChance: false,
  warmupDone: false,
  jumpDone: false,
  fractionDone: false,
  breakDone: false,
  reviewDone: false,
  geometryDone: false,
  exitDone: false,
  warmup: { facts: [], index: 0, current: null, repeatPhase: 0, hintUsed: false },
  jump: { index: 0, problems: [], engine: null },
  fraction: { stage: 0, mini: null, multiplier: null },
  repair: { stage: 0, helpUsed: false, wrongTimes: [] },
  geometry: { stage: 0, areaCount: 0, edgeCount: 0, compareStep: 0 },
  exit: { q1: false, q2: false, tracker: {} }
};

const sceneInfo = {
  prologue: ['Ready', 0], cover: ['Choose a room', 0],
  warmupIntro: ['Chapter 1 · Warm-up', 1], warmupLab: ['Chapter 1 · Warm-up', 1],
  jumpIntro: ['Chapter 2 · Jump Strategy', 2], jumpLesson: ['Chapter 2 · Jump Strategy', 2],
  fractionIntro: ['Chapter 3 · Equivalent Fractions', 3], fractionLesson: ['Chapter 3 · Equivalent Fractions', 3],
  stretchBreak: ['Stretch Break', 3], repairShop: ['Chapter 4 · Repair Shop', 4],
  geometryIntro: ['Chapter 5 · Geometry Dessert', 5], geometryLab: ['Chapter 5 · Geometry Dessert', 5],
  exitSnapshot: ['Exit Snapshot', 6], finale: ['Complete', 6]
};

const SELF_PRACTICE = new Set(['warmupLab', 'repairShop', 'geometryLab']);
const TEACHER_LED = new Set(['jumpLesson', 'fractionLesson']);

function setCat(message, cheer = false) {
  $('catBubble').textContent = message;
  if (cheer) {
    $('catGuide').classList.remove('cheer'); void $('catGuide').offsetWidth; $('catGuide').classList.add('cheer');
    setTimeout(() => $('catGuide').classList.remove('cheer'), 850);
  }
}

function showScene(id) {
  const target = typeof id === 'string' ? $(id) : id;
  if (!target) return;
  $$('#sceneRoot > .scene').forEach(s => { s.classList.toggle('active', s === target); s.classList.toggle('scene-hidden', s !== target); });
  state.scene = target.id;
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (target.dataset.cat) setCat(target.dataset.cat);
  $('topbar').classList.toggle('hidden-ui', target.id === 'prologue');
  $('catGuide').classList.toggle('hidden-ui', target.id === 'prologue' || target.id === 'stretchBreak');
  $('heartPanel').classList.toggle('hidden', !SELF_PRACTICE.has(target.id));
  $('focusPanel').classList.toggle('hidden', !TEACHER_LED.has(target.id));
  $('helperBookBtn').classList.toggle('hidden', !(state.warmupDone || state.teacherUnlock) || ['prologue','warmupIntro','warmupLab','jumpIntro','jumpLesson','cover','stretchBreak'].includes(target.id));
  updateProgress();
  updateCover();
  if (target.id === 'warmupLab') renderWarmup();
  if (target.id === 'jumpLesson') renderJumpProblem();
  if (target.id === 'fractionLesson') renderFractionStage();
  if (target.id === 'repairShop') renderRepairStage();
  if (target.id === 'geometryLab') renderGeometryStage();
  if (target.id === 'exitSnapshot') renderExit();
  if (target.id === 'stretchBreak') startBreak();
}

function updateProgress() {
  const done = [state.warmupDone, state.jumpDone, state.fractionDone, state.reviewDone, state.geometryDone, state.exitDone].filter(Boolean).length;
  $('progressLabel').textContent = `${done} / 6 chapters`;
  $('progressBar').style.width = `${done / 6 * 100}%`;
  $('progressDetail').textContent = sceneInfo[state.scene]?.[0] || 'Ready';
}

function setCard(cardId, statusId, open, done, openText, lockedText) {
  const card = $(cardId); if (!card) return;
  card.disabled = !open; card.classList.toggle('locked', !open); card.classList.toggle('open', open);
  const status = $(statusId); if (status) status.textContent = done ? '✓ Complete · replay →' : (open ? openText : lockedText);
}

function updateCover() {
  const all = state.teacherUnlock;
  setCard('warmupCard','warmupStatus',true,state.warmupDone,'Open →','Open →');
  setCard('jumpCard','jumpStatus',all || state.warmupDone,state.jumpDone,'Open jump lesson →','🔒 Finish / pass warm-up');
  setCard('fractionCard','fractionStatus',all || state.jumpDone,state.fractionDone,'Open fraction lesson →','🔒 Learn the jump strategy first');
  setCard('breakCard','breakStatus',all || state.fractionDone,state.breakDone,'Take the stretch break →','🔒 Finish the guided lesson');
  setCard('reviewCard','reviewStatus',all || state.breakDone,state.reviewDone,'Open Fraction Repair Shop →','🔒 Take the break first');
  setCard('geometryCard','geometryStatus',all || state.reviewDone,state.geometryDone,'Open geometry dessert →','🔒 Finish / pass review');
  $('exitCard').classList.toggle('hidden', !(all || state.geometryDone));
  $('teacherUnlockBtn').textContent = all ? '✓ Teacher unlock EVERYTHING ON' : 'Teacher unlock everything';
}

function setFeedback(id, text, type='') { const el=$(id); el.textContent=text; el.className=`feedback ${type}`; }
function updateHearts() { $('heartText').textContent = `${'♥ '.repeat(state.hearts)}${'♡ '.repeat(3-state.hearts)}`.trim(); }
function loseHeart(message) { state.hearts=clamp(state.hearts-1,0,3); updateHearts(); if (message) setCat(message); if(state.hearts===0) $('heartModal').classList.remove('hidden'); }
function updateFocus() { $('focusStars').textContent = `${'★ '.repeat(state.focus)}${'☆ '.repeat(5-state.focus)}`.trim(); }

function verticalFraction(n,d, cls='') { return `<span class="vfrac ${cls}"><span class="num">${n}</span><span class="bar"></span><span class="den">${d}</span></span>`; }
function stageDots(id, current, total) { $(id).innerHTML = Array.from({length:total},(_,i)=>`<span class="stage-dot ${i<current?'done':''} ${i===current?'current':''}"></span>`).join(''); }
function pathFor(step,target) { if(target%step!==0) return []; return Array.from({length:target/step+1},(_,i)=>i*step); }
function pathHtml(step,target, revealCount=true) { const p=pathFor(step,target); return `<div class="static-jump-path">${p.map((v,i)=>`${i?'<span class="path-arrow">→</span>':''}<span class="path-node">${v}</span>`).join('')}</div>${revealCount?`<div class="path-summary"><span>jump size <b>+${step}</b></span><span>number of jumps <b>${p.length-1}</b></span><span>multiplier <b>×${p.length-1}</b></span></div>`:''}`; }
function groupVisual(a,b){ return `<div class="group-visual">${Array.from({length:a},(_,i)=>`<div class="dot-box"><small>group ${i+1}</small><div>${Array.from({length:b},()=>'<i></i>').join('')}</div></div>`).join('')}</div>`; }

// ---------- MODALS ----------
$$('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>$(x.dataset.closeModal).classList.add('hidden')));
$('helperBookBtn').addEventListener('click',()=>{ $('helperBookModal').classList.remove('hidden'); renderHelperBook(2); });
$$('.helper-tab').forEach(b=>b.addEventListener('click',()=>{ $$('.helper-tab').forEach(x=>x.classList.toggle('active',x===b)); renderHelperBook(+b.dataset.helper); }));
function renderHelperBook(m){
  const notes={2:'×2 means double: two equal groups.',3:'×3 means three equal groups / three equal jumps.',4:'×4 can be double, then double again.',5:'×5 grows by 5: 5, 10, 15, 20…',10:'×10 grows by tens: 10, 20, 30…'};
  const rows=Array.from({length:8},(_,i)=>`<span>${m} × ${i+1} = <b>${m*(i+1)}</b></span>`).join('');
  $('helperBookContent').innerHTML=`<div class="helper-note"><strong>${notes[m]}</strong></div><div class="helper-facts">${rows}</div>`;
}
$('helperJumpBtn').addEventListener('click',()=>{ const s=+($('helperJumpSize').value||0),t=+($('helperJumpTarget').value||0); $('helperJumpOutput').innerHTML = s>0&&t>0&&t%s===0 ? pathHtml(s,t,true) : '<div class="tiny-note">Choose a target that can be reached by equal whole jumps.</div>'; });

// ---------- START / COVER ----------
$('startAdventureBtn').addEventListener('click',()=>showScene('cover'));
$('notYetBtn').addEventListener('click',()=>{ $('notYetReply').textContent='Alice will wait by the mirror door. ♡'; $('notYetReply').classList.remove('hidden'); });
$('coverBtn').addEventListener('click',()=>showScene('cover'));
$$('.world-stop[data-target]').forEach(b=>b.addEventListener('click',()=>{
  if(b.disabled)return;
  if(b.id==='warmupCard'&&state.warmupDone)state.warmup={facts:makeWarmupFacts(),index:0,current:null,repeatPhase:0,hintUsed:false};
  if(b.id==='jumpCard'&&state.jumpDone){state.jump.index=0;state.jump.engine=null;}
  if(b.id==='fractionCard'&&state.fractionDone){state.fraction.stage=0;state.fraction.mini=null;}
  if(b.id==='reviewCard'&&state.reviewDone){state.repair.stage=0;}
  if(b.id==='geometryCard'&&state.geometryDone){state.geometry={stage:0,areaCount:0,edgeCount:0,compareStep:0};}
  showScene(b.dataset.target);
}));
$('teacherUnlockBtn').addEventListener('click',()=>{ state.teacherUnlock=!state.teacherUnlock; updateCover(); setCat(state.teacherUnlock?'Teacher preview unlocked.':'Student locks restored.',true); });
$('exitCard').addEventListener('click',()=>showScene('exitSnapshot'));
$('resetAdventureBtn').addEventListener('click',resetAdventure);
$('finalCoverBtn').addEventListener('click',()=>showScene('cover'));
$('finalResetBtn').addEventListener('click',resetAdventure);
$('exitCoverBtn').addEventListener('click',()=>showScene('cover'));

// ---------- WARM-UP ----------
const WARMUP_POOL = [
  {a:2,b:4},{a:3,b:3},{a:2,b:6},{a:3,b:4},{a:4,b:3},{a:5,b:2},{a:3,b:5},{a:4,b:4},{a:5,b:3},{a:2,b:5}
];
function makeWarmupFacts(){
  const basics=shuffle(WARMUP_POOL.filter(f=>f.a<=3&&f.b<=3)).slice(0,1);
  const medium=shuffle(WARMUP_POOL.filter(f=>Math.max(f.a,f.b)>=4)).slice(0,4);
  let facts=[...basics,...medium]; if(facts.length<5)facts=shuffle(WARMUP_POOL).slice(0,5);
  return facts.map(f=>({...f,answer:f.a*f.b, repeat: Math.max(f.a,f.b)>3}));
}
function resetWarmup(){ state.warmup={facts:makeWarmupFacts(),index:0,current:null,repeatPhase:0,hintUsed:false}; state.warmupDone=false; }
$('warmupStartBtn').addEventListener('click',()=>{ if(!state.warmup.facts.length)resetWarmup(); showScene('warmupLab'); });
function renderWarmup(){
  if(!state.warmup.facts.length)resetWarmup();
  const f=state.warmup.facts[state.warmup.index]; if(!f){completeWarmup();return;} state.warmup.current=f; state.warmup.hintUsed=false;
  stageDots('warmupDots',state.warmup.index,5); $('warmupCount').textContent=`${state.warmup.index+1} / 5`; $('warmupFeedback').textContent='';
  $('warmupGameArea').innerHTML=`<div class="warm-fact-card"><small>LOOK · THINK · ANSWER</small><div class="warm-equation">${f.a} × ${f.b} = <span>?</span></div><div class="warm-answer-row"><input id="warmAnswer" class="big-number-input" inputmode="numeric" autocomplete="off" aria-label="Multiplication answer"/><button id="warmCheckBtn" class="primary-btn" type="button">Check</button></div><div id="warmHintArea"></div></div>`;
  $('warmCheckBtn').addEventListener('click',checkWarmup); $('warmAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')checkWarmup()}); setTimeout(()=>$('warmAnswer')?.focus(),100);
}
function checkWarmup(){ const f=state.warmup.current, raw=$('warmAnswer').value.trim(); if(!raw)return setFeedback('warmupFeedback','Write an answer first.','bad'); if(+raw===f.answer){setFeedback('warmupFeedback','Correct — now the important part: say the whole fact aloud.','good');openSpokenGate(f);}else{setFeedback('warmupFeedback','Not yet. Build or count the groups, then try again.','bad');loseHeart('Use a visual relationship, not a random guess.');}}
$('warmupHintBtn').addEventListener('click',()=>{const f=state.warmup.current;if(!f)return; if(!state.warmup.hintUsed){loseHeart('Visual clue opened. Count the equal groups.');state.warmup.hintUsed=true;} $('warmHintArea').innerHTML=`<div class="visual-help-box"><strong>${f.a} equal groups of ${f.b}</strong>${groupVisual(f.a,f.b)}<p>Count the total. The answer is still yours.</p></div>`;});
function openSpokenGate(f){
  state.warmup.repeatPhase=0; $('spokenModal').classList.remove('hidden'); $('spokenEyebrow').textContent='ALICE IS LISTENING'; $('spokenTitle').textContent='Can you read this aloud so Alice can hear you?'; $('spokenFact').textContent=`${f.a} × ${f.b} = ${f.answer}`; $('spokenPrompt').textContent='Say the whole multiplication fact out loud.'; $('spokenConfirmBtn').textContent='I said it!';
}
$('spokenConfirmBtn').addEventListener('click',()=>{const f=state.warmup.current;if(!f)return;if(f.repeat&&state.warmup.repeatPhase===0){state.warmup.repeatPhase=1;$('spokenEyebrow').textContent='THE WONDERLAND BIRDS ARE NOISY';$('spokenTitle').textContent='Oh! Alice could not hear you. Can you repeat it one more time?';$('spokenPrompt').textContent='Read the SAME fact aloud again.';$('spokenConfirmBtn').textContent='I repeated it!';$('spokenFact').classList.remove('spoken-pulse');void $('spokenFact').offsetWidth;$('spokenFact').classList.add('spoken-pulse');return;} $('spokenModal').classList.add('hidden');state.warmup.index++;if(state.warmup.index>=5){completeWarmup()}else{renderWarmup();setCat('Good. New fact — same solve-and-say routine.',true);}});
function completeWarmup(){state.warmupDone=true;updateCover();updateProgress();$('helperBookBtn').classList.remove('hidden');showScene('jumpIntro');setCat('You solved it and said it. Now we build what a multiplier means.',true);}

// ---------- JUMP-TO-TARGET ----------
function resetJump(){state.jump.index=0;state.jump.problems=[{step:3,target:12},{step:4,target:16},{step:5,target:20}];state.jump.engine=null;state.jumpDone=false;}
$('jumpStartBtn').addEventListener('click',()=>{if(!state.jump.problems.length)resetJump();showScene('jumpLesson')});
function newJumpEngine(problem){return {step:problem.step,target:problem.target,current:0,count:0,path:[0],phase:'calculate',complete:false};}
function renderJumpProblem(){
  if(!state.jump.problems.length)resetJump();
  const p=state.jump.problems[state.jump.index]; if(!p){completeJumpLesson();return;} if(!state.jump.engine||state.jump.engine.target!==p.target||state.jump.engine.step!==p.step)state.jump.engine=newJumpEngine(p);
  stageDots('jumpLessonDots',state.jump.index,3);$('jumpProblemCount').textContent=`${state.jump.index+1} / 3`;$('jumpFeedback').textContent='';$('jumpNextBtn').classList.add('hidden');$('jumpSupportBtn').classList.add('hidden');
  renderJumpEngine('jumpGameArea',state.jump.engine,{onComplete:()=>{$('jumpNextBtn').classList.remove('hidden');setFeedback('jumpFeedback',`${p.step} needs ×${p.target/p.step} to become ${p.target}. The multiplier is the NUMBER OF JUMPS.`,'good');},feedbackId:'jumpFeedback'});
}
function renderJumpEngine(areaId,e,opts={}){
  const area=$(areaId); const nodes=e.path.map((v,i)=>`${i?'<span class="path-arrow">→</span>':''}<span class="path-node ${i===e.path.length-1?'current-node':''}">${v}</span>`).join('');
  let action='';
  if(e.phase==='calculate') action=`<div class="jump-calc-card"><p>Jump ${e.count+1}</p><div class="jump-calc"><span>${e.current}</span><b>+ ${e.step}</b><span>=</span><input id="engineLanding" inputmode="numeric" autocomplete="off" aria-label="Landing number" /></div><button id="engineLandBtn" class="primary-btn" type="button">Land Alice</button></div>`;
  if(e.phase==='check') action=`<div class="target-check-card"><p>We jumped <strong>${e.count}</strong> time${e.count===1?'':'s'}.</p><h4>Are we at the target <span>${e.target}</span> yet?</h4><div class="choice-grid two"><button data-target-check="yes">YES</button><button data-target-check="no">NOT YET</button></div></div>`;
  if(e.phase==='count') action=`<div class="jump-count-card"><p>Target reached!</p><h4>How many equal +${e.step} jumps did Alice make?</h4><input id="engineCountInput" class="big-number-input compact" inputmode="numeric" /><button id="engineCountBtn" class="primary-btn" type="button">Check jump count</button></div>`;
  if(e.phase==='translate') action=`<div class="translation-card"><p class="translation-line">${Array.from({length:e.count},()=>e.step).join(' + ')} = ${e.target}</p><div class="translation-arrow">↓</div><p class="translation-big">${e.step} × ${e.count} = ${e.target}</p><div class="translation-arrow">↓</div><p class="multiplier-conclusion"><b>${e.step}</b> needs <strong>×${e.count}</strong> to become <b>${e.target}</b>.</p><div class="multiplier-name">${e.count} is our multiplier because Alice made ${e.count} equal jumps.</div></div>`;
  area.innerHTML=`<div class="jump-board"><div class="jump-target-row"><div><small>JUMP SIZE</small><strong class="jump-size-badge">+${e.step}</strong></div><div><small>TARGET</small><strong>${e.target}</strong></div></div><div class="live-jump-path">${nodes}</div><div class="jump-count-badges">${Array.from({length:e.count},(_,i)=>`<span>${i+1}</span>`).join('')}</div>${action}</div>`;
  if(e.phase==='calculate'){
    $('engineLandBtn').addEventListener('click',()=>{const raw=$('engineLanding').value.trim(), expected=e.current+e.step;if(!raw)return setFeedback(opts.feedbackId||'jumpFeedback','Calculate the landing number first.','bad');if(+raw===expected){e.current=expected;e.count++;e.path.push(expected);e.phase='check';setFeedback(opts.feedbackId||'jumpFeedback',`Yes — Alice lands on ${expected}.`,'good');renderJumpEngine(areaId,e,opts)}else setFeedback(opts.feedbackId||'jumpFeedback',`Try adding ${e.step} to ${e.current} again.`,'bad')});
    $('engineLanding').addEventListener('keydown',ev=>{if(ev.key==='Enter')$('engineLandBtn').click()});setTimeout(()=>$('engineLanding')?.focus(),50);
  }
  if(e.phase==='check') $$('[data-target-check]').forEach(b=>b.addEventListener('click',()=>{const shouldYes=e.current===e.target,saidYes=b.dataset.targetCheck==='yes';if(shouldYes===saidYes){if(shouldYes){e.phase='count'}else{e.phase='calculate'}setFeedback(opts.feedbackId||'jumpFeedback',shouldYes?'Yes — target reached! Now count the jumps.':'Right — not there yet. Jump by the SAME amount again.','good');renderJumpEngine(areaId,e,opts)}else setFeedback(opts.feedbackId||'jumpFeedback',shouldYes?`Look at the target: we are on ${e.current}, which IS ${e.target}.`:`We are on ${e.current}, but the target is ${e.target}.`,'bad')}));
  if(e.phase==='count'){
    $('engineCountBtn').addEventListener('click',()=>{const raw=$('engineCountInput').value.trim();if(+raw===e.count){e.phase='translate';e.complete=true;renderJumpEngine(areaId,e,opts);opts.onComplete?.(e)}else setFeedback(opts.feedbackId||'jumpFeedback','Count the jump badges, not the landing numbers.','bad')});
    $('engineCountInput').addEventListener('keydown',ev=>{if(ev.key==='Enter')$('engineCountBtn').click()});
  }
}
$('jumpNextBtn').addEventListener('click',()=>{state.jump.index++;state.jump.engine=null;if(state.jump.index>=3)completeJumpLesson();else renderJumpProblem();});
function completeJumpLesson(){state.jumpDone=true;updateCover();updateProgress();showScene('fractionIntro');setCat('Now use the jump multiplier inside a fraction.',true);}

// ---------- FRACTION LESSON ----------
$('fractionStartBtn').addEventListener('click',()=>{state.fraction.stage=0;state.fraction.mini=null;showScene('fractionLesson')});
function renderFractionStage(){
  stageDots('fractionStageDots',state.fraction.stage,4);$('fractionStageCount').textContent=`${state.fraction.stage+1} / 4`;$('fractionFeedback').textContent='';$('fractionNextBtn').classList.add('hidden');$('fractionNextBtn').textContent=state.fraction.stage===3?'Finish guided lesson →':'Next mirror →';$('fractionHelpBtn').classList.remove('hidden');
  const s=state.fraction.stage;
  if(s===0)renderFractionGuided(); else if(s===1)renderFractionSemi(); else if(s===2)renderFractionMissingBottom(); else renderFractionCheck();
}
function fractionEquation(a,b,c,d,highlight='den'){return `<div class="fraction-equation giant-equation">${verticalFraction(a,b,highlight==='den'?'focus-den':'')}<span class="symbol">=</span>${verticalFraction(c,d,highlight==='den'?'focus-den':'')}</div>`;}
function renderFractionGuided(){
  $('fractionKicker').textContent='GUIDED · FULL JUMP PATH';$('fractionGameTitle').textContent='Repair 2/3 = ?/12';$('fractionStageTitle').textContent='Mirror Repair · Guided';$('fractionStageStory').textContent='First find what happened downstairs.';
  $('fractionGameArea').innerHTML=`<div class="fraction-focus-card"><p class="micro-instruction">Look ONLY downstairs first.</p>${fractionEquation(2,3,'?',12,'den')}<div class="den-relation">We need to change <strong>3 → 12</strong>.</div><button id="fractionFindJump" class="primary-btn" type="button">Find the jump!</button><div id="fractionMiniJump"></div><div id="fractionTopStep"></div></div>`;
  $('fractionHelpBtn').classList.add('hidden');$('fractionFindJump').addEventListener('click',()=>startFractionMiniJump({step:3,target:12,m:4,top:2,answer:8}));
}
function startFractionMiniJump(cfg){
  state.fraction.mini=newJumpEngine({step:cfg.step,target:cfg.target});
  renderJumpEngine('fractionMiniJump',state.fraction.mini,{feedbackId:'fractionFeedback',onComplete:()=>{const m=cfg.m;$('fractionTopStep').innerHTML=`<div class="same-change-reveal"><span>DOWNSTAIRS ×${m} ✓</span><strong>Whatever happens downstairs must also happen upstairs.</strong><div class="top-math">${cfg.top} × ${m} = <input id="fractionTopInput" inputmode="numeric" /></div><button id="fractionTopCheck" class="primary-btn" type="button">Repair upstairs</button></div>`;$('fractionTopCheck').addEventListener('click',()=>{if(+$('fractionTopInput').value===cfg.answer){setFeedback('fractionFeedback',`Yes. ${verticalText(cfg.top,cfg.step,cfg.answer)} Same ×${m} upstairs and downstairs.`,'good');$('fractionTopStep').insertAdjacentHTML('beforeend',`<div class="completed-mirror">${fractionEquation(cfg.top,cfg.step,cfg.answer,cfg.target,'none')}<span>Mirror repaired ✦</span></div>`);$('fractionNextBtn').classList.remove('hidden')}else setFeedback('fractionFeedback',`Downstairs was ×${m}. Use that SAME ×${m} on ${cfg.top}.`,'bad')})}});
}
function verticalText(top,den,ans){return `${top} × ${ans/top} = ${ans}.`;}
function renderFractionSemi(){
  $('fractionKicker').textContent='SEMI-GUIDED';$('fractionGameTitle').textContent='Repair 3/4 = ?/12';$('fractionStageTitle').textContent='Mirror Repair · Find the multiplier';$('fractionStageStory').textContent='Try the relationship first. Jump help is optional.';
  $('fractionGameArea').innerHTML=`<div class="fraction-focus-card">${fractionEquation(3,4,'?',12,'den')}<div class="den-relation">4 needs × <input id="semiMultiplier" class="inline-number-input" inputmode="numeric" /> to become 12.</div><button id="semiMultiplierCheck" class="soft-btn" type="button">Check multiplier</button><div id="semiTopArea"></div><div id="semiHelpArea"></div></div>`;
  $('fractionHelpBtn').onclick=()=>{$('semiHelpArea').innerHTML=`<div class="visual-help-box">${pathHtml(4,12,false)}<p>Count the equal +4 jumps.</p></div>`;};
  $('semiMultiplierCheck').addEventListener('click',()=>{if(+$('semiMultiplier').value===3){$('semiTopArea').innerHTML=`<div class="same-change-reveal"><span>DOWNSTAIRS ×3 ✓</span><div class="top-math">3 × 3 = <input id="semiTopInput" inputmode="numeric" /></div><button id="semiTopCheck" class="primary-btn">Repair upstairs</button></div>`;$('semiTopCheck').addEventListener('click',()=>{if(+$('semiTopInput').value===9){setFeedback('fractionFeedback','Yes — 3/4 = 9/12. Same ×3 on both parts.','good');$('fractionNextBtn').classList.remove('hidden')}else setFeedback('fractionFeedback','Use the same ×3 upstairs.','bad')})}else setFeedback('fractionFeedback','How many equal groups of 4 make 12? Use Help Alice if needed.','bad')});
}
function renderFractionMissingBottom(){
  $('fractionKicker').textContent='NEW WRAPPER · MISSING DENOMINATOR';$('fractionGameTitle').textContent='Repair 3/5 = 12/?';$('fractionStageTitle').textContent='Mirror Repair · Missing downstairs';$('fractionStageStory').textContent='Find the multiplier from the part you can see, then copy it.';
  $('fractionGameArea').innerHTML=`<div class="fraction-focus-card">${fractionEquation(3,5,12,'?','none')}<div class="known-relation">Known relation: <strong>3 → 12</strong></div><div class="multiplier-entry">How many jumps/groups? × <input id="bottomMultiplier" class="inline-number-input" inputmode="numeric" /></div><button id="bottomMultiplierCheck" class="soft-btn">Check multiplier</button><div id="bottomResultArea"></div><div id="bottomHelpArea"></div></div>`;
  $('fractionHelpBtn').onclick=()=>{$('bottomHelpArea').innerHTML=`<div class="visual-help-box">${pathHtml(3,12,false)}<p>Count the equal +3 jumps.</p></div>`;};
  $('bottomMultiplierCheck').addEventListener('click',()=>{if(+$('bottomMultiplier').value===4){$('bottomResultArea').innerHTML=`<div class="same-change-reveal"><span>UPSTAIRS ×4 ✓</span><strong>Same change downstairs:</strong><div class="top-math">5 × 4 = <input id="bottomAnswer" inputmode="numeric" /></div><button id="bottomAnswerCheck" class="primary-btn">Repair downstairs</button></div>`;$('bottomAnswerCheck').addEventListener('click',()=>{if(+$('bottomAnswer').value===20){setFeedback('fractionFeedback','Yes — 3/5 = 12/20. Same ×4 on both parts.','good');$('fractionNextBtn').classList.remove('hidden')}else setFeedback('fractionFeedback','Copy ×4 to the denominator: 5 × 4 = ?','bad')})}else setFeedback('fractionFeedback','3 → 12 needs four equal jumps of 3. Try again or open Help Alice.','bad')});
}
function renderFractionCheck(){
  $('fractionKicker').textContent='CHECK THE MIRROR';$('fractionGameTitle').textContent='Are 2/3 and 8/12 equivalent?';$('fractionStageTitle').textContent='Truth Detector';$('fractionStageStory').textContent='Inspect the same-change rule before deciding.';
  $('fractionGameArea').innerHTML=`<div class="truth-detector"><div class="truth-pair">${verticalFraction(2,3)}<span>?</span>${verticalFraction(8,12)}</div><button id="inspectTruthBtn" class="primary-btn">Inspect the mirror</button><div id="truthEvidence"></div><div id="truthChoices" class="choice-grid two hidden"><button data-truth="yes">SAME / EQUIVALENT</button><button data-truth="no">NOT EQUIVALENT</button></div></div>`;
  $('fractionHelpBtn').classList.add('hidden');$('inspectTruthBtn').addEventListener('click',()=>{$('truthEvidence').innerHTML=`<div class="evidence-card"><p>Downstairs: 3 → 12 = <strong>×4</strong></p><p>Upstairs: 2 × 4 = <strong>8</strong></p><p>Candidate top = <strong>8</strong></p></div>`;$('truthChoices').classList.remove('hidden');});
  $$('[data-truth]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.truth==='yes'){b.classList.add('correct');setFeedback('fractionFeedback','Equivalent. Both upstairs and downstairs used ×4.','good');$('fractionNextBtn').textContent='Finish guided lesson →';$('fractionNextBtn').classList.remove('hidden')}else{b.classList.add('wrong');setFeedback('fractionFeedback','Look at the evidence: ×4 works on both parts.','bad')}}));
}
$('fractionNextBtn').addEventListener('click',()=>{state.fraction.stage++;if(state.fraction.stage>=4)completeFractionLesson();else renderFractionStage();});
function completeFractionLesson(){state.fractionDone=true;updateCover();updateProgress();showScene('stretchBreak');}

// ---------- BREAK ----------
let breakTimerId=null;
function startBreak(){clearInterval(breakTimerId);let left=15;$('breakReadyBtn').classList.add('hidden');$('breakRestartBtn').classList.remove('hidden');$('breakTimer').textContent=left;$('breakProgress').style.width='0%';const instruction=()=>left>11?'Reach both hands up.':left>7?'Roll your shoulders slowly.':left>3?'Shake your hands gently.':'One slow deep breath.';$('breakInstruction').textContent=instruction();breakTimerId=setInterval(()=>{left--;$('breakTimer').textContent=left;$('breakInstruction').textContent=instruction();$('breakProgress').style.width=`${(15-left)/15*100}%`;if(left<=0){clearInterval(breakTimerId);$('breakTimer').textContent='✓';$('breakInstruction').textContent='Tiny break complete.';$('breakReadyBtn').classList.remove('hidden');$('breakRestartBtn').classList.add('hidden');}},1000);}
$('breakRestartBtn').addEventListener('click',startBreak);
$('breakReadyBtn').addEventListener('click',()=>{state.breakDone=true;updateCover();showScene('repairShop');setCat('Welcome back. The review is the game now.',true);});

// ---------- REPAIR SHOP ----------
const REPAIR_STAGES=[
  {title:'Cake Card Repair',story:'Repair the missing denominator.',kicker:'STATION 1 · TYPE',game:'cake'},
  {title:'Door Lock',story:'Enter the missing numerator.',kicker:'STATION 2 · LOCK',game:'door'},
  {title:'Playing-Card Family',story:'Decide whether the two fraction cards belong together.',kicker:'STATION 3 · YES / NO',game:'cards'},
  {title:'Potion Mistake',story:'Keep the denominator 10 and repair the numerator.',kicker:'STATION 4 · ERROR REPAIR',game:'potion'},
  {title:'Fraction Machine',story:'Choose the multiplier gear, then repair the output.',kicker:'STATION 5 · MACHINE',game:'machine'}
];
function renderRepairStage(){
  const s=REPAIR_STAGES[state.repair.stage];if(!s){completeRepair();return;}state.repair.helpUsed=false;state.repair.wrongTimes=[];stageDots('repairDots',state.repair.stage,5);$('repairStageTitle').textContent=s.title;$('repairStageStory').textContent=s.story;$('repairKicker').textContent=s.kicker;$('repairGameTitle').textContent=s.title;$('repairStageCount').textContent=`${state.repair.stage+1} / 5`;$('repairFeedback').textContent='';$('repairNextBtn').classList.add('hidden');$('repairHelpBtn').classList.remove('hidden');$('repairWorldReward').innerHTML='';
  if(s.game==='cake')repairCake();if(s.game==='door')repairDoor();if(s.game==='cards')repairCards();if(s.game==='potion')repairPotion();if(s.game==='machine')repairMachine();
}
function showRepairHelp(step,target){if(!state.repair.helpUsed){loseHeart('Help opened. Use the jump relationship, then return to the fraction.');state.repair.helpUsed=true;}$('repairHelpBox').innerHTML=`<div class="visual-help-box">${pathHtml(step,target,true)}</div>`;}
function repairSuccess(message,reward){setFeedback('repairFeedback',message,'good');$('repairWorldReward').innerHTML=`<div class="reward-banner">${reward}</div>`;$('repairNextBtn').classList.remove('hidden');setCat('Repair complete. Same-change rule worked again.',true);}
function repairCake(){
  $('repairGameArea').innerHTML=`<div class="repair-object cake-object"><div class="object-title">Hatter’s Cake Card</div>${fractionEquation(1,2,4,'?','none')}<p>1 → 4 uses which multiplier? Then copy it downstairs.</p><div class="repair-input-row"><span>missing denominator</span><input id="repairInput" class="big-number-input compact" inputmode="numeric"/><button id="repairCheck" class="primary-btn">Repair cake</button></div><div id="repairHelpBox"></div></div>`;
  $('repairHelpBtn').onclick=()=>showRepairHelp(1,4);$('repairCheck').addEventListener('click',()=>{if(+$('repairInput').value===8)repairSuccess('Correct: 1/2 = 4/8. Both parts used ×4.','🍰 Cake layers line up!');else{setFeedback('repairFeedback','Keep the new top 4. Since 1 → 4 is ×4, what is 2 × 4?','bad');loseHeart('Find the multiplier first.')}});
}
function repairDoor(){
  $('repairGameArea').innerHTML=`<div class="repair-object door-object"><div class="magic-door"><div class="door-lock-symbol">?</div></div>${fractionEquation(3,4,'?',12,'none')}<div class="repair-input-row"><span>door code</span><input id="repairInput" class="big-number-input compact" inputmode="numeric"/><button id="repairCheck" class="primary-btn">Try the lock</button></div><div id="repairHelpBox"></div></div>`;
  $('repairHelpBtn').onclick=()=>showRepairHelp(4,12);$('repairCheck').addEventListener('click',()=>{if(+$('repairInput').value===9){document.querySelector('.magic-door')?.classList.add('open-door');repairSuccess('Door code 9. 4 → 12 is ×3, so 3 × 3 = 9.','✦ The mirror door opens!');}else{setFeedback('repairFeedback','What multiplier turns 4 into 12? Then use it on 3.','bad');loseHeart('Bottom relationship first.')}});
}
function repairCards(){
  $('repairGameArea').innerHTML=`<div class="repair-object card-object"><div class="playing-pair"><div class="fraction-playing-card">${verticalFraction(2,3)}</div><div class="family-link">same family?</div><div class="fraction-playing-card">${verticalFraction(6,9)}</div></div><div class="choice-grid two"><button data-family="yes">YES — SAME FAMILY</button><button data-family="no">NO — DIFFERENT</button></div><div id="repairHelpBox"></div></div>`;
  $('repairHelpBtn').onclick=()=>showRepairHelp(3,9);$$('[data-family]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.family==='yes'){b.classList.add('correct');repairSuccess('Yes. 3 → 9 is ×3 and 2 × 3 = 6.','♣ The matching cards glow!')}else{b.classList.add('wrong');setFeedback('repairFeedback','Inspect the same multiplier before deciding.','bad');loseHeart('Use Help Alice if you need the jump path.')}}));
}
function repairPotion(){
  $('repairGameArea').innerHTML=`<div class="repair-object potion-object"><img src="assets/potion.png" alt="Potion" class="potion-big"/><div><p>Alice wrote:</p><div class="bad-transform">${verticalFraction(2,5)} <span>→</span> ${verticalFraction(6,10)}</div><p>Keep the denominator <strong>10</strong>. What should the numerator be?</p><div class="repair-input-row"><input id="repairInput" class="big-number-input compact" inputmode="numeric"/><button id="repairCheck" class="primary-btn">Fix the potion</button></div><div id="repairHelpBox"></div></div></div>`;
  $('repairHelpBtn').onclick=()=>showRepairHelp(5,10);$('repairCheck').addEventListener('click',()=>{if(+$('repairInput').value===4)repairSuccess('Fixed: 2/5 = 4/10. Denominator ×2, numerator ×2.','🧪 Potion colour settles!');else{setFeedback('repairFeedback','5 → 10 is ×2. Keep the SAME ×2 upstairs.','bad');loseHeart('The two parts need the same change.')}});
}
function repairMachine(){
  $('repairGameArea').innerHTML=`<div class="repair-object machine-object"><div class="fraction-machine"><div>${verticalFraction(3,4)}</div><div class="gear-choice-row"><button data-gear="2">×2</button><button data-gear="3">×3</button><button data-gear="4">×4</button></div><div>${verticalFraction('?',16)}</div></div><div id="machineOutput"></div><div id="repairHelpBox"></div></div>`;
  $('repairHelpBtn').onclick=()=>showRepairHelp(4,16);$$('[data-gear]').forEach(b=>b.addEventListener('click',()=>{if(+b.dataset.gear===4){b.classList.add('correct');$('machineOutput').innerHTML=`<div class="repair-input-row"><span>3 × 4 =</span><input id="machineAnswer" class="big-number-input compact" inputmode="numeric"/><button id="machineCheck" class="primary-btn">Run machine</button></div>`;$('machineCheck').addEventListener('click',()=>{if(+$('machineAnswer').value===12){document.querySelector('.fraction-machine')?.classList.add('machine-running');repairSuccess('Machine repaired: 3/4 = 12/16. Same ×4.','⚙ The multiplier gear spins!')}else{setFeedback('repairFeedback','You chose ×4. Now use 3 × 4.','bad');loseHeart('Keep the chosen gear on both parts.')}})}else{b.classList.add('wrong');setFeedback('repairFeedback','Which gear changes 4 into 16?','bad');loseHeart('Build 4 → 16 if you need help.')}}));
}
$('repairNextBtn').addEventListener('click',()=>{state.repair.stage++;if(state.repair.stage>=5)completeRepair();else renderRepairStage();});
function completeRepair(){state.reviewDone=true;updateCover();updateProgress();showScene('geometryIntro');setCat('Fraction repairs complete. Geometry is dessert now.',true);}

// ---------- GEOMETRY DESSERT ----------
$('geometryStartBtn').addEventListener('click',()=>{state.geometry={stage:0,areaCount:0,edgeCount:0,compareStep:0};showScene('geometryLab')});
function renderGeometryStage(){stageDots('geometryDots',state.geometry.stage,3);$('geometryStageCount').textContent=`${state.geometry.stage+1} / 3`;$('geometryFeedback').textContent='';$('geometryNextBtn').classList.add('hidden');if(state.geometry.stage===0)geometryArea();else if(state.geometry.stage===1)geometryPerimeter();else geometryCompare();}
function geometryArea(){
  $('geometryStageTitle').textContent='Plant the Garden';$('geometryStageStory').textContent='Tap every square where Alice can plant.';$('geometryKicker').textContent='QUEST 1 · AREA = INSIDE';$('geometryGameTitle').textContent='Cover the inside';state.geometry.areaCount=0;
  $('geometryGameArea').innerHTML=`<div class="geometry-task"><p class="micro-instruction">Tap every unit square. Do not use a formula.</p><div class="tile-grid grid-4x3">${Array.from({length:12},(_,i)=>`<button class="garden-tile" data-tile="${i}" aria-label="Garden tile ${i+1}"></button>`).join('')}</div><div id="areaCounter" class="live-counter">0 squares planted</div><div id="geometryQuestion"></div></div>`;
  $$('.garden-tile').forEach(t=>t.addEventListener('click',()=>{if(t.classList.contains('planted'))return;t.classList.add('planted');state.geometry.areaCount++;$('areaCounter').textContent=`${state.geometry.areaCount} squares planted`;if(state.geometry.areaCount===12){$('geometryQuestion').innerHTML=`<div class="choice-grid three"><button data-area="10">10</button><button data-area="12">12</button><button data-area="14">14</button></div><p>How many square units cover the INSIDE?</p>`;$$('[data-area]').forEach(b=>b.addEventListener('click',()=>{if(+b.dataset.area===12){b.classList.add('correct');geometrySuccess('Area = 12 square units. Area covers the inside.')}else{b.classList.add('wrong');loseHeart('Count the planted squares inside.')}}));}}));
  $('geometryHintBtn').onclick=()=>{loseHeart('Tiny hint: area counts square tiles inside.');setFeedback('geometryFeedback','AREA = cover the INSIDE with unit squares.','good');};
}
function geometryPerimeter(){
  $('geometryStageTitle').textContent='Build the Golden Fence';$('geometryStageStory').textContent='Use the same garden. Tap only the outside edge units.';$('geometryKicker').textContent='QUEST 2 · PERIMETER = AROUND';$('geometryGameTitle').textContent='Trace around the outside';state.geometry.edgeCount=0;
  const edgeBtns=(side,n)=>Array.from({length:n},(_,i)=>`<button class="edge-unit ${side}" data-edge="${side}-${i}" aria-label="${side} edge ${i+1}"></button>`).join('');
  $('geometryGameArea').innerHTML=`<div class="geometry-task"><p class="micro-instruction">Tap every little fence piece around the OUTSIDE.</p><div class="perimeter-board-new"><div class="edge-row top-edges">${edgeBtns('top',4)}</div><div class="edge-middle"><div class="edge-col left-edges">${edgeBtns('left',3)}</div><div class="garden-center-grid">${Array.from({length:12},()=>'<i></i>').join('')}</div><div class="edge-col right-edges">${edgeBtns('right',3)}</div></div><div class="edge-row bottom-edges">${edgeBtns('bottom',4)}</div></div><div id="edgeCounter" class="live-counter">0 fence units traced</div><div id="geometryQuestion"></div></div>`;
  $$('.edge-unit').forEach(e=>e.addEventListener('click',()=>{if(e.classList.contains('traced'))return;e.classList.add('traced');state.geometry.edgeCount++;$('edgeCounter').textContent=`${state.geometry.edgeCount} fence units traced`;if(state.geometry.edgeCount===14){$('geometryQuestion').innerHTML=`<p>How many units all the way AROUND?</p><div class="choice-grid three"><button data-perim="12">12</button><button data-perim="14">14</button><button data-perim="16">16</button></div>`;$$('[data-perim]').forEach(b=>b.addEventListener('click',()=>{if(+b.dataset.perim===14){b.classList.add('correct');geometrySuccess('Perimeter = 14 units around the outside.')}else{b.classList.add('wrong');loseHeart('Use the number of traced fence units.')}}));}}));
  $('geometryHintBtn').onclick=()=>{loseHeart('Tiny hint: perimeter is only the outside boundary.');setFeedback('geometryFeedback','PERIMETER = walk all the way AROUND the outside.','good');};
}
function miniGrid(cols,rows){return `<div class="compare-grid" style="--cols:${cols}">${Array.from({length:cols*rows},()=>'<i></i>').join('')}</div>`;}
function geometryCompare(){
  $('geometryStageTitle').textContent='Same Area, Different Fence';$('geometryStageStory').textContent='Both gardens use 12 tiles. Do they need the same fence?';$('geometryKicker').textContent='QUEST 3 · REASONING';$('geometryGameTitle').textContent='Same inside — same around?';state.geometry.compareStep=0;
  $('geometryGameArea').innerHTML=`<div class="geometry-task"><div class="garden-compare"><div><strong>Garden A · 3 × 4</strong>${miniGrid(4,3)}</div><div><strong>Garden B · 2 × 6</strong>${miniGrid(6,2)}</div></div><div id="compareQuestion"><p>Both gardens have 12 tiles. Do they have the same AREA?</p><div class="choice-grid two"><button data-compare-area="yes">YES</button><button data-compare-area="no">NO</button></div></div></div>`;
  $$('[data-compare-area]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.compareArea==='yes'){b.classList.add('correct');$('compareQuestion').innerHTML=`<div class="reasoning-note">Yes — both cover 12 square units inside.</div><p>Do they need the same amount of fence AROUND?</p><div class="choice-grid two"><button data-compare-perim="yes">YES</button><button data-compare-perim="no">NO</button></div>`;$$('[data-compare-perim]').forEach(x=>x.addEventListener('click',()=>{if(x.dataset.comparePerim==='no'){x.classList.add('correct');$('compareQuestion').insertAdjacentHTML('beforeend','<div class="reasoning-note">Garden A perimeter = 14. Garden B perimeter = 16. Same area does NOT always mean same perimeter.</div>');geometrySuccess('Great reasoning: same inside can have a different around.')}else{x.classList.add('wrong');loseHeart('Count the outside edges of each rectangle.')}}));}else{b.classList.add('wrong');loseHeart('Count the unit squares inside both gardens.')}}));
  $('geometryHintBtn').onclick=()=>{loseHeart('Tiny hint: area counts tiles; perimeter counts the outside fence.');setFeedback('geometryFeedback','Count INSIDE first, then compare AROUND.','good');};
}
function geometrySuccess(msg){setFeedback('geometryFeedback',msg,'good');$('geometryNextBtn').classList.remove('hidden');setCat('Geometry clue solved.',true);}
$('geometryNextBtn').addEventListener('click',()=>{state.geometry.stage++;if(state.geometry.stage>=3){state.geometryDone=true;updateCover();updateProgress();showScene('exitSnapshot')}else renderGeometryStage();});

// ---------- EXIT ----------
const TRACKER=['Find multiplier with jumps','Equivalent fraction · missing top','Equivalent fraction · missing bottom','Same / not equivalent','Verbal multiplication recall'];
function renderExit(){
  $('exitQ1').innerHTML=`<div class="exit-question"><p>4 needs × ? to become 16.</p><div class="choice-grid three"><button data-exit1="3">×3</button><button data-exit1="4">×4</button><button data-exit1="5">×5</button></div><div id="exit1Help"></div></div>`;
  $('exitQ2').innerHTML=`<div class="exit-question">${fractionEquation(3,4,'?',12,'none')}<input id="exit2Input" class="big-number-input compact" inputmode="numeric"/><button id="exit2Check" class="soft-btn">Check</button><div id="exit2Help"></div></div>`;
  $('supportTracker').innerHTML=TRACKER.map((s,i)=>`<div class="tracker-row"><span>${s}</span><div><button data-track="${i}" data-level="I">I</button><button data-track="${i}" data-level="V">V</button><button data-track="${i}" data-level="T">T</button></div></div>`).join('');
  $$('[data-track]').forEach(b=>b.addEventListener('click',()=>{state.exit.tracker[b.dataset.track]=b.dataset.level;$$(`[data-track="${b.dataset.track}"]`).forEach(x=>x.classList.toggle('selected',x===b));updateSummary()}));
  $$('[data-exit1]').forEach(b=>b.addEventListener('click',()=>{if(+b.dataset.exit1===4){b.classList.add('correct');state.exit.q1=true;setFeedback('exitFeedback','Multiplier check complete.','good');checkExitReady()}else{b.classList.add('wrong');$('exit1Help').innerHTML=`<div class="visual-help-box">${pathHtml(4,16,false)}</div>`;setFeedback('exitFeedback','Use equal jumps once, then answer again.','bad')}}));
  $('exit2Check').addEventListener('click',()=>{if(+$('exit2Input').value===9){state.exit.q2=true;setFeedback('exitFeedback','Equivalent-fraction check complete.','good');checkExitReady()}else{$('exit2Help').innerHTML='<div class="visual-help-box">Downstairs: 4 → 12 is ×3. Same change upstairs.</div>';setFeedback('exitFeedback','Use the same multiplier upstairs.','bad')}});
  updateSummary(); checkExitReady();
}
function checkExitReady(){const ready=state.exit.q1&&state.exit.q2;$('finishAdventureBtn').disabled=!ready;if(ready){state.exitDone=true;updateProgress();updateSummary();}}
function updateSummary(){const lines=['Faith · Equivalent Fractions Session',`Q1 4 → 16 multiplier: ${state.exit.q1?'correct':'not yet'}`,`Q2 3/4 = ?/12: ${state.exit.q2?'correct':'not yet'}`,'','Support levels:'];TRACKER.forEach((s,i)=>lines.push(`${s}: ${state.exit.tracker[i]||'—'}`));$('summaryText').value=lines.join('\n');}
$('copySummaryBtn').addEventListener('click',async()=>{updateSummary();try{await navigator.clipboard.writeText($('summaryText').value);setFeedback('exitFeedback','Session summary copied.','good')}catch{$('summaryText').select();document.execCommand('copy');setFeedback('exitFeedback','Session summary copied.','good')}});
$('finishAdventureBtn').addEventListener('click',()=>{if(state.exit.q1&&state.exit.q2)showScene('finale')});

// ---------- TEACHER / RESET ----------
$('focusPenaltyBtn').addEventListener('click',()=>{state.focus=clamp(state.focus-1,0,5);updateFocus();if(state.focus===0)$('focusModal').classList.remove('hidden')});
$('focusResetBtn').addEventListener('click',()=>{state.focus=3;state.focusSecondChance=true;updateFocus();$('focusModal').classList.add('hidden');setCat('One tiny task. Look at the current relationship.');});
$('heartRestartBtn').addEventListener('click',()=>{state.hearts=3;updateHearts();$('heartModal').classList.add('hidden');restartCheckpoint()});
function restartCheckpoint(){if(state.scene==='warmupLab')renderWarmup();else if(state.scene==='repairShop')renderRepairStage();else if(state.scene==='geometryLab')renderGeometryStage();}
$('teacherPassBtn').addEventListener('click',()=>{
  $('spokenModal').classList.add('hidden');
  const s=state.scene;
  if(['warmupIntro','warmupLab'].includes(s)){state.warmupDone=true;showScene('jumpIntro')}
  else if(['jumpIntro','jumpLesson'].includes(s)){state.jumpDone=true;showScene('fractionIntro')}
  else if(['fractionIntro','fractionLesson'].includes(s)){state.fractionDone=true;showScene('stretchBreak')}
  else if(s==='stretchBreak'){clearInterval(breakTimerId);state.breakDone=true;showScene('repairShop')}
  else if(s==='repairShop'){state.reviewDone=true;showScene('geometryIntro')}
  else if(['geometryIntro','geometryLab'].includes(s)){state.geometryDone=true;showScene('exitSnapshot')}
  updateCover();updateProgress();
});
function resetAdventure(){
  clearInterval(breakTimerId);
  state.teacherUnlock=false;state.hearts=3;state.focus=5;state.focusSecondChance=false;state.warmupDone=false;state.jumpDone=false;state.fractionDone=false;state.breakDone=false;state.reviewDone=false;state.geometryDone=false;state.exitDone=false;state.exit={q1:false,q2:false,tracker:{}};
  resetWarmup();resetJump();state.fraction={stage:0,mini:null,multiplier:null};state.repair={stage:0,helpUsed:false,wrongTimes:[]};state.geometry={stage:0,areaCount:0,edgeCount:0,compareStep:0};updateHearts();updateFocus();updateCover();showScene('prologue');
}

window.addEventListener('pointermove',(e)=>{if(window.innerWidth<900)return;const x=(e.clientX/window.innerWidth-.5)*12,y=(e.clientY/window.innerHeight-.5)*8;$('catGuide').style.transform=`translate(${x}px,${y}px)`});

// ---------- INIT ----------
resetWarmup(); resetJump(); updateHearts(); updateFocus(); updateCover(); showScene('prologue');
