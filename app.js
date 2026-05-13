'use strict';
/* ═══════════════════════════════════════
   CricScore Pro — app.js
═══════════════════════════════════════ */

// ── State ──────────────────────────────
let M = {}; // match state
let history = []; // undo stack

const defaultState = () => ({
  setup: { teamA:'', teamB:'', playersA:[], playersB:[], overs:20, venue:'', umpire1:'', umpire2:'', tossWon:'A', tossElect:'bat', battingFirst:'A', logoA:'', logoB:'' },
  innings: 1,
  batting: 'A', // which team bats
  bowling: 'B',
  score: 0, wickets: 0,
  overs: 0, balls: 0, // balls in current over
  target: 0,
  inns1Score: 0,
  extras: { wide:0, noball:0, bye:0, legbye:0 },
  batsmen: [
    { idx:0, runs:0, balls:0, fours:0, sixes:0, out:false },
    { idx:1, runs:0, balls:0, fours:0, sixes:0, out:false }
  ],
  strikerIdx: 0, // 0 or 1 in batsmen array
  bowler: { idx:0, overs:0, balls:0, runs:0, wickets:0 },
  currentOverBalls: [],
  overHistory: [],
  commentary: [],
  partnership: { runs:0, balls:0 },
  dotBalls: 0, totalLegalBalls: 0,
  fours: 0, sixes: 0,
  nextBatIdx: 2, // index into batting team players
  usedBowlers: [], // indices
  inProgress: true
});

// ── Init ─────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Build player inputs ONCE on load (no onchange duplicate)
  buildPlayerInputs('A', false);
  buildPlayerInputs('B', false);
  const saved = localStorage.getItem('cricscore_state');
  if (saved) {
    try { M = JSON.parse(saved); showScreen('scoring'); renderAll(); }
    catch(e) { M = defaultState(); }
  } else {
    M = defaultState();
  }
});

/* buildPlayerInputs(team, sync)
   team  = 'A' | 'B'
   sync  = true  → also update the other team's count to match
*/
function buildPlayerInputs(team, sync = true) {
  const countEl = document.getElementById(`playerCount${team}`);
  let count     = countEl ? parseInt(countEl.value) : 11;

  if (isNaN(count) || count < 1) return; // Don't rebuild if invalid
  if (count > 30) count = 30; // Safety limit

  // Sync the other team's selector to the same count
  if (sync) {
    const other = team === 'A' ? 'B' : 'A';
    const otherSel = document.getElementById(`playerCount${other}`);
    if (otherSel && otherSel.value !== String(count)) {
      otherSel.value = count;
      buildPlayerInputs(other, false); // rebuild other without triggering infinite loop
    }
  }

  const el    = document.getElementById(`team${team}Players`);
  const label = document.getElementById(`team${team}PlayerLabel`);
  if (label) label.textContent = `Players (${count})`;

  // Preserve existing names so rebuild doesn't erase typed names
  const existing = {};
  el.querySelectorAll('.player-row-wrap').forEach(row => {
    const num  = row.dataset.idx;
    const name = row.querySelector('.player-input')?.value || '';
    const jersey = row.querySelector('.jersey-input')?.value || '';
    existing[num] = { name, jersey };
  });

  el.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const prev = existing[i] || {};
    el.innerHTML += `
      <div class="player-row-wrap player-input-row" data-idx="${i}">
        <input class="jersey-input"
               id="j${team}${i}"
               type="number"
               min="1" max="99"
               placeholder="#"
               value="${prev.jersey || i}"
               title="Jersey number"/>
        <input class="player-input"
               id="p${team}${i}"
               type="text"
               placeholder="Player ${i} name"
               value="${prev.name || ''}"/>
      </div>`;
  }
}

function setImpact(team, val) {
  // Toggle active state
  document.getElementById(`impact${team}Yes`).classList.toggle('toggle-active', val === 'yes');
  document.getElementById(`impact${team}No`).classList.toggle('toggle-active', val === 'no');
  // Show/hide name field
  const field = document.getElementById(`impact${team}Field`);
  if (val === 'yes') field.classList.remove('hidden');
  else { field.classList.add('hidden'); document.getElementById(`impact${team}Name`).value = ''; }
}

// ── Logo upload ────────────────────────
function loadLogo(team, inp) {
  if (!inp.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    const el = document.getElementById(`logo${team}`);
    el.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover"/>`;
    M.setup[`logo${team}`] = e.target.result;
  };
  r.readAsDataURL(inp.files[0]);
}

// ── START MATCH ─────────────────────────
function startMatch() {
  const s = M.setup;
  s.teamA   = document.getElementById('teamAName').value || 'Team A';
  s.teamB   = document.getElementById('teamBName').value || 'Team B';
  s.overs   = parseInt(document.getElementById('oversFormat').value);
  s.venue   = document.getElementById('venue').value;
  s.umpire1 = document.getElementById('umpire1').value;
  s.umpire2 = document.getElementById('umpire2').value;
  s.tossWon = document.getElementById('tossWon').value;
  s.tossElect = document.getElementById('tossElect').value;
  s.battingFirst = document.getElementById('battingFirst').value;

  const countA = parseInt(document.getElementById('playerCountA').value);
  const countB = parseInt(document.getElementById('playerCountB').value);
  // Read name + jersey number for each player
  s.playersA = Array.from({length:countA}, (_,i) => {
    const name    = document.getElementById(`pA${i+1}`)?.value?.trim() || `Player ${i+1}`;
    const jersey  = document.getElementById(`jA${i+1}`)?.value?.trim() || String(i+1);
    return `${name} (#${jersey})`;
  });
  s.playersB = Array.from({length:countB}, (_,i) => {
    const name    = document.getElementById(`pB${i+1}`)?.value?.trim() || `Player ${i+1}`;
    const jersey  = document.getElementById(`jB${i+1}`)?.value?.trim() || String(i+1);
    return `${name} (#${jersey})`;
  });

  // Impact players
  const impactAOn = document.getElementById('impactAYes').classList.contains('toggle-active');
  const impactBOn = document.getElementById('impactBYes').classList.contains('toggle-active');
  s.impactA = impactAOn ? (document.getElementById('impactAName').value.trim() || '') : '';
  s.impactB = impactBOn ? (document.getElementById('impactBName').value.trim() || '') : '';

  M.batting = s.battingFirst;
  M.bowling = s.battingFirst === 'A' ? 'B' : 'A';
  M.innings = 1;
  M.score = 0; M.wickets = 0; M.overs = 0; M.balls = 0;
  M.extras = {wide:0,noball:0,bye:0,legbye:0};
  M.batsmen = [{idx:0,runs:0,balls:0,fours:0,sixes:0,out:false},{idx:1,runs:0,balls:0,fours:0,sixes:0,out:false}];
  M.strikerIdx = 0; M.nextBatIdx = 2;
  M.bowler = {idx:0,overs:0,balls:0,runs:0,wickets:0};
  M.currentOverBalls = []; M.overHistory = []; M.commentary = [];
  M.partnership = {runs:0,balls:0};
  M.dotBalls=0; M.totalLegalBalls=0; M.fours=0; M.sixes=0;
  M.usedBowlers=[0]; M.inProgress=true;
  history=[];
  save(); showScreen('scoring'); renderAll();
  showToast(`🏏 Match Started! ${teamName(M.batting)} bats first`);
}

// ── SCORE BALL ─────────────────────────
function scoreBall(runs) {
  if (!M.inProgress) return;
  pushHistory();
  const striker = M.batsmen[M.strikerIdx];
  striker.runs += runs; striker.balls++;
  M.score += runs;
  M.partnership.runs += runs; M.partnership.balls++;
  M.bowler.runs += runs; M.bowler.balls++;
  M.totalLegalBalls++;
  if (runs===0) M.dotBalls++;
  if (runs===4) { striker.fours++; M.fours++; }
  if (runs===6) { striker.sixes++; M.sixes++; }
  M.currentOverBalls.push(String(runs));
  addBall();
  if (runs===4) { showToast('💥 FOUR! Boundary!'); addComment(`FOUR! ${getShot()} — ${runs} runs`, 'four-color'); }
  else if (runs===6) { showToast('🚀 SIX! Maximum!'); addComment(`SIX! ${getShot()} — over the ropes!`, 'six-color'); }
  else if (runs===0) addComment('Dot ball — well bowled.', '');
  else addComment(`${runs} run${runs>1?'s':''} taken.`, '');
  if (runs%2!==0) swapStrike();
  checkInningsEnd();
  save(); renderAll();
}

// ── EXTRAS ─────────────────────────────
function scoreExtra(type) {
  if (!M.inProgress) return;
  pushHistory();
  const label = {wide:'Wd',noball:'Nb',bye:'B',legbye:'Lb'}[type];
  M.extras[type]++;
  M.score++;
  M.bowler.runs++;
  M.partnership.runs++;
  if (type==='wide'||type==='noball') {
    M.currentOverBalls.push(label);
    addComment(`${type==='wide'?'Wide ball!':'No Ball!'} — extra run added.`, '');
    // no ball count, no over advance
  } else {
    // bye/legbye count as legal ball
    M.bowler.balls++;
    M.totalLegalBalls++;
    M.currentOverBalls.push(label);
    addBall();
    addComment(`${type==='bye'?'Bye':'Leg Bye'} — 1 extra.`, '');
  }
  save(); renderAll();
}

// ── WICKET MODAL ────────────────────────
function openWicketModal() {
  populateBatterSelects('batterOut');
  populateFieldingTeam('catcherName');
  populateNextBatsmen('nextBatsman');
  onWicketTypeChange();
  document.getElementById('wicketModal').classList.remove('hidden');
}
function closeWicketModal() { document.getElementById('wicketModal').classList.add('hidden'); }

function onWicketTypeChange() {
  const type = document.getElementById('wicketType').value;
  document.getElementById('catcherGroup').style.display = (type==='caught'||type==='stumped') ? 'block' : 'none';
}

function confirmWicket() {
  if (!M.inProgress) return;
  pushHistory();
  const type = document.getElementById('wicketType').value;
  const outIdx = parseInt(document.getElementById('batterOut').value);
  const runs = parseInt(document.getElementById('wicketRuns').value)||0;
  const nextIdx = parseInt(document.getElementById('nextBatsman').value);

  M.score += runs;
  M.wickets++;
  M.bowler.balls++; M.bowler.wickets++;
  M.totalLegalBalls++; M.dotBalls++;
  M.currentOverBalls.push('W');
  const outName = getBattingPlayers()[M.batsmen[outIdx].idx];
  addComment(`WICKET! ${outName} — ${type}!`, 'danger');
  showToast(`🔴 WICKET! ${outName} out!`);

  // Replace batsman
  M.batsmen[outIdx] = {idx:nextIdx, runs:0, balls:0, fours:0, sixes:0, out:false};
  M.nextBatIdx = nextIdx+1;
  M.strikerIdx = outIdx; // new batsman on strike
  M.partnership = {runs:0,balls:0};
  addBall();
  if (runs%2!==0) swapStrike();
  closeWicketModal();
  checkInningsEnd();
  save(); renderAll();
}

// ── RUN OUT ─────────────────────────────
function openRunOutModal() {
  populateBatterSelects('runOutBatter');
  populateNextBatsmen('runOutNext');
  document.getElementById('runOutModal').classList.remove('hidden');
}
function closeRunOutModal() { document.getElementById('runOutModal').classList.add('hidden'); }

function confirmRunOut() {
  if (!M.inProgress) return;
  pushHistory();
  const outIdx = parseInt(document.getElementById('runOutBatter').value);
  const runs   = parseInt(document.getElementById('runOutRuns').value)||0;
  const nextIdx= parseInt(document.getElementById('runOutNext').value);

  M.score += runs; M.wickets++;
  M.bowler.balls++; M.totalLegalBalls++;
  M.currentOverBalls.push('W');
  const outName = getBattingPlayers()[M.batsmen[outIdx].idx];
  addComment(`RUN OUT! ${outName} — ${runs} run${runs!==1?'s':''} completed.`, 'danger');
  showToast(`🏃 RUN OUT! ${outName}!`);

  M.batsmen[outIdx] = {idx:nextIdx, runs:0, balls:0, fours:0, sixes:0, out:false};
  M.nextBatIdx = nextIdx+1;
  M.strikerIdx = outIdx;
  M.partnership = {runs:0,balls:0};
  addBall();
  if (runs%2!==0) swapStrike();
  closeRunOutModal();
  checkInningsEnd();
  save(); renderAll();
}

// ── BOWLER CHANGE ───────────────────────
function changeBowler() { openBowlerModal(); }
function openBowlerModal(forced=false) {
  const bowlPlayers = getBowlingPlayers();
  const list = document.getElementById('bowlerList');
  list.innerHTML = '';
  bowlPlayers.forEach((name, i) => {
    const used = M.usedBowlers.includes(i);
    list.innerHTML += `<button onclick="selectBowler(${i})" class="w-full text-left px-4 py-3 rounded-xl border mb-1 transition ${used?'border-white/10 text-white/40 bg-white/02':'border-neon/20 text-white bg-neon/05 hover:bg-neon/10'}">
      <span class="font-semibold">${name}</span>${used?' <span class="text-xs text-white/30">(bowled)</span>':''}
    </button>`;
  });
  document.getElementById('bowlerModal').classList.remove('hidden');
}
function closeBowlerModal() { document.getElementById('bowlerModal').classList.add('hidden'); }
function selectBowler(idx) {
  M.bowler = {idx, overs:0, balls:0, runs:0, wickets:0};
  if (!M.usedBowlers.includes(idx)) M.usedBowlers.push(idx);
  closeBowlerModal();
  showToast(`🎳 ${getBowlingPlayers()[idx]} to bowl`);
  save(); renderAll();
}

// ── UNDO ────────────────────────────────
function undoLastBall() {
  if (!history.length) { showToast('⚠ Nothing to undo'); return; }
  M = JSON.parse(history.pop());
  save(); renderAll();
  showToast('↩ Last ball undone');
}
function pushHistory() { history.push(JSON.stringify(M)); if(history.length>30) history.shift(); }

// ── OVER MANAGEMENT ─────────────────────
function addBall() {
  M.balls++;
  if (M.balls >= 6) {
    // Over complete
    M.overs++; M.balls = 0;
    M.bowler.overs++; M.bowler.balls = 0;
    M.overHistory.push({over:M.overs, balls:[...M.currentOverBalls]});
    M.currentOverBalls = [];
    swapStrike(); // end of over
    if (M.overs < M.setup.overs && M.wickets < 10) {
      addComment(`Over ${M.overs} complete.`, '');
      setTimeout(() => openBowlerModal(true), 300);
    }
  }
}

function swapStrike() { M.strikerIdx = M.strikerIdx===0 ? 1 : 0; }

// ── INNINGS CHECK ───────────────────────
function checkInningsEnd() {
  const maxOvers = M.setup.overs;
  if (M.wickets >= 10 || M.overs >= maxOvers) {
    if (M.innings === 1) {
      M.inns1Score = M.score;
      showInningsBreak();
    } else {
      showMatchResult();
    }
  }
  // Check target in 2nd innings
  if (M.innings === 2 && M.score > M.target-1) {
    showMatchResult();
  }
}

function showInningsBreak() {
  M.inProgress = false;
  const batting = teamName(M.batting);
  document.getElementById('inningsSummary').innerHTML =
    `<p class="text-white font-bold text-xl">${batting}</p>
     <p class="text-neon text-3xl font-barlow font-black">${M.score}/${M.wickets}</p>
     <p class="text-white/50 text-sm">${M.overs}.${M.balls} overs</p>`;
  const bowlTeam = teamName(M.bowling);
  document.getElementById('inningsTarget').textContent =
    `${bowlTeam} need ${M.score+1} runs to win in ${M.setup.overs} overs`;
  document.getElementById('inningsModal').classList.remove('hidden');
}

function startSecondInnings() {
  document.getElementById('inningsModal').classList.add('hidden');
  const prevBatting = M.batting;
  M.batting = M.bowling; M.bowling = prevBatting;
  M.innings = 2; M.target = M.inns1Score + 1;
  M.score=0; M.wickets=0; M.overs=0; M.balls=0;
  M.extras={wide:0,noball:0,bye:0,legbye:0};
  M.batsmen=[{idx:0,runs:0,balls:0,fours:0,sixes:0,out:false},{idx:1,runs:0,balls:0,fours:0,sixes:0,out:false}];
  M.strikerIdx=0; M.nextBatIdx=2;
  M.bowler={idx:0,overs:0,balls:0,runs:0,wickets:0};
  M.currentOverBalls=[]; M.overHistory=[]; M.commentary=[];
  M.partnership={runs:0,balls:0};
  M.dotBalls=0; M.totalLegalBalls=0; M.fours=0; M.sixes=0;
  M.usedBowlers=[0]; M.inProgress=true;
  history=[];
  save(); renderAll();
  showToast(`🏏 2nd Innings — ${teamName(M.batting)} need ${M.target} runs`);
}

function showMatchResult() {
  M.inProgress = false; save();
  let title='', desc='', emoji='🏆';
  if (M.innings===1) {
    const opp = teamName(M.bowling);
    title=`${teamName(M.batting)} wins!`;
    desc=`Won by ${M.score} runs (All out chasing ${M.inns1Score})`;
  } else {
    const needed = M.target - M.score;
    if (M.score >= M.target) {
      const wktsLeft = 10-M.wickets;
      title=`${teamName(M.batting)} wins!`;
      desc=`Won by ${wktsLeft} wicket${wktsLeft!==1?'s':''}`;
    } else {
      emoji='🎉';
      title=`${teamName(M.bowling)} wins!`;
      desc=`Won by ${needed-1} runs`;
    }
  }
  document.getElementById('matchResultEmoji').textContent=emoji;
  document.getElementById('matchResultTitle').textContent=title;
  document.getElementById('matchResultDesc').textContent=desc;
  document.getElementById('matchSummaryStats').innerHTML=`
    <div class="flex justify-between"><span class="text-white/50">Venue</span><span>${M.setup.venue||'—'}</span></div>
    <div class="flex justify-between"><span class="text-white/50">Innings 1</span><span class="text-neon font-bold">${M.inns1Score||M.score}/${M.innings===1?M.wickets:'10'}</span></div>
    ${M.innings===2?`<div class="flex justify-between"><span class="text-white/50">Innings 2</span><span class="text-neon font-bold">${M.score}/${M.wickets}</span></div>`:''}
    <div class="flex justify-between"><span class="text-white/50">Boundaries</span><span>${M.fours} fours, ${M.sixes} sixes</span></div>
  `;
  document.getElementById('matchCompleteModal').classList.remove('hidden');
}

// ── EXIT / RESET ─────────────────────────
function confirmExit() { document.getElementById('exitModal').classList.remove('hidden'); }
function closeExitModal() { document.getElementById('exitModal').classList.add('hidden'); }
function resetMatch() {
  localStorage.removeItem('cricscore_state');
  M = defaultState(); history=[];
  ['exitModal','matchCompleteModal','inningsModal'].forEach(id => document.getElementById(id).classList.add('hidden'));
  buildPlayerInputs('A'); buildPlayerInputs('B');
  showScreen('setup');
}

// ── RENDER ──────────────────────────────
function renderAll() {
  renderTopBar(); renderBatsmen(); renderBowler();
  renderCurrentOverBalls(); renderOverHistory();
  renderCommentary(); renderStats();
}

function renderTopBar() {
  const s = M.setup;
  document.getElementById('liveTeamName').textContent = teamName(M.batting);
  document.getElementById('liveScore').textContent = `${M.score}-${M.wickets}`;
  document.getElementById('liveOvers').textContent = `(${M.overs}.${M.balls})`;
  document.getElementById('liveOpponent').textContent = teamName(M.bowling);
  if (M.innings===2) {
    const need = M.target - M.score;
    const ballsLeft = (M.setup.overs - M.overs)*6 - M.balls;
    document.getElementById('targetDisplay').textContent = `Need ${need} in ${ballsLeft} balls`;
  } else {
    document.getElementById('targetDisplay').textContent = '';
  }
  const totalBalls = M.overs*6+M.balls;
  const crr = totalBalls>0 ? (M.score/(totalBalls/6)).toFixed(2) : '0.00';
  document.getElementById('crrDisplay').textContent = crr;
  if (M.innings===2) {
    const ballsLeft = (M.setup.overs-M.overs)*6-M.balls;
    const need = M.target-M.score;
    const rrr = ballsLeft>0 ? ((need/ballsLeft)*6).toFixed(2) : '—';
    document.getElementById('rrrDisplay').textContent = rrr;
    document.getElementById('rrrDisplay').style.color = parseFloat(rrr)>12?'#ff4757':'#39ff8f';
  } else {
    document.getElementById('rrrDisplay').textContent = '—';
  }
  document.getElementById('matchStatusBar').textContent =
    M.innings===1 ? `Innings 1 • ${s.venue||''}` : `Innings 2 • Target: ${M.target}`;
  // Pop animation on score
  const scoreEl = document.getElementById('liveScore');
  scoreEl.classList.remove('score-pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-pop');
}

function renderBatsmen() {
  const players = getBattingPlayers();
  const rows = M.batsmen.map((b,i) => {
    const name = players[b.idx] || '—';
    const sr = b.balls>0 ? ((b.runs/b.balls)*100).toFixed(0) : '0';
    const strike = i===M.strikerIdx;
    return `<tr class="${strike?'on-strike':''}">
      <td class="font-semibold">${name}</td>
      <td>${b.runs}</td><td>${b.balls}</td>
      <td class="text-blue-400">${b.fours}</td>
      <td class="text-purple-400">${b.sixes}</td>
      <td class="text-white/50">${sr}</td>
    </tr>`;
  });
  document.getElementById('batsmenTable').innerHTML = rows.join('');
  document.getElementById('partnershipDisplay').textContent =
    `${M.partnership.runs}(${M.partnership.balls})`;
}

function renderBowler() {
  const players = getBowlingPlayers();
  const name = players[M.bowler.idx] || '—';
  document.getElementById('bowlerName').textContent = name;
  const ov = `${M.bowler.overs}.${M.bowler.balls}`;
  document.getElementById('bowlerOvers').textContent = ov;
  document.getElementById('bowlerRuns').textContent = M.bowler.runs;
  document.getElementById('bowlerWkts').textContent = M.bowler.wickets;
}

function renderCurrentOverBalls() {
  const el = document.getElementById('currentOverBalls');
  el.innerHTML = M.currentOverBalls.map((b,i) =>
    `<div class="ball-circle ${ballClass(b)}" style="animation-delay:${i*0.05}s">${ballLabel(b)}</div>`
  ).join('');
}

function renderOverHistory() {
  const el = document.getElementById('overHistory');
  const rows = [...M.overHistory].reverse().slice(0,10).map(o =>
    `<div class="over-history-row">
      <span class="over-num">Ov ${o.over}</span>
      ${o.balls.map(b=>`<div class="ball-circle ${ballClass(b)}" style="width:22px;height:22px;font-size:10px">${ballLabel(b)}</div>`).join('')}
    </div>`
  );
  el.innerHTML = rows.join('');
}

function renderCommentary() {
  const el = document.getElementById('commentaryFeed');
  el.innerHTML = [...M.commentary].reverse().slice(0,20).map(c =>
    `<div class="commentary-item">
      <span class="comment-ball">${c.ball}</span>
      <span class="comment-text ${c.cls}">${c.text}</span>
    </div>`
  ).join('');
}

function renderStats() {
  const total = M.totalLegalBalls;
  document.getElementById('dotPct').textContent = total>0 ? Math.round(M.dotBalls/total*100)+'%' : '0%';
  document.getElementById('boundaryCount').textContent = M.fours+M.sixes;
  const extras = Object.values(M.extras).reduce((a,b)=>a+b,0);
  document.getElementById('extrasTotal').textContent = extras;
}

// ── HELPERS ─────────────────────────────
function getBattingPlayers() { return M.batting==='A' ? M.setup.playersA : M.setup.playersB; }
function getBowlingPlayers() { return M.bowling==='A' ? M.setup.playersA : M.setup.playersB; }
function teamName(t) { return t==='A' ? (M.setup.teamA||'Team A') : (M.setup.teamB||'Team B'); }

function populateBatterSelects(id) {
  const players = getBattingPlayers();
  const el = document.getElementById(id);
  el.innerHTML = M.batsmen.map((b,i) =>
    `<option value="${i}">${players[b.idx]}</option>`
  ).join('');
}

function populateFieldingTeam(id) {
  const players = getBowlingPlayers();
  const el = document.getElementById(id);
  el.innerHTML = players.map((p,i)=>`<option value="${i}">${p}</option>`).join('');
}

function populateNextBatsmen(id) {
  const players = getBattingPlayers();
  const usedIdxs = M.batsmen.map(b=>b.idx);
  const el = document.getElementById(id);
  el.innerHTML = players
    .map((p,i)=>({p,i}))
    .filter(({i})=>!usedIdxs.includes(i))
    .map(({p,i})=>`<option value="${i}">${p}</option>`)
    .join('');
}

function addComment(text, cls) {
  const ball = `${M.overs}.${M.balls}`;
  M.commentary.push({ball, text, cls});
  if (M.commentary.length>50) M.commentary.shift();
}

function ballClass(v) {
  if(v==='W') return 'bc-wicket';
  if(v==='6') return 'bc-six';
  if(v==='4') return 'bc-four';
  if(v==='0') return 'bc-dot';
  if(v==='Wd') return 'bc-wide';
  if(v==='Nb') return 'bc-noball';
  if(v==='B'||v==='Lb') return 'bc-bye';
  return 'bc-run';
}
function ballLabel(v) {
  if(v==='0') return '·';
  return v;
}

const shots=['cover drive','pull shot','cut shot','flick shot','straight drive','sweep shot','hook shot','loft over mid-on'];
function getShot() { return shots[Math.floor(Math.random()*shots.length)]; }

function showScreen(s) {
  document.getElementById('setupScreen').classList.toggle('hidden', s!=='setup');
  document.getElementById('scoringScreen').classList.toggle('hidden', s!=='scoring');
}

function showToast(msg, color='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.color = color || '';
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.add('hidden'), 2800);
}

function save() {
  try { localStorage.setItem('cricscore_state', JSON.stringify(M)); } catch(e){}
}
