// Leonida Platinum Roadmap: tracker and guide for the 55 GTA VI trophies.
// All data lives in data/trophies.json (official names, descriptions, grades
// plus this entry's own guides) and data/roadmap.json (the seven stages).
// Progress is saved in localStorage and never leaves the browser.
const STORAGE_KEY = 'leonida-platinum-roadmap-v1';
const DEMO_EARNED = [2, 3, 4, 8, 9, 10, 15, 16, 21, 25, 28, 30, 35, 42, 44, 46, 51, 53];
const KIND_LABELS = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };
const TIER_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

const params = new URLSearchParams(location.search);
const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');
const missableBoxEl = document.getElementById('missableBox');
const stagesEl = document.getElementById('stages');
const searchInput = document.getElementById('search');
const spoilerInput = document.getElementById('spoiler');

let trophies = [];
let roadmap = [];
let earned = loadEarned();
let selectedId = Number(params.get('select')) || 17;
let filters = {
  tier: params.get('grade') || 'all',
  kind: params.get('kind') || 'all',
  earned: params.get('show') || 'all',
  stage: params.get('stage') ? Number(params.get('stage')) : null,
  search: '',
};
let spoilerOn = params.get('spoiler') !== 'off';

function loadEarned() {
  if (params.get('demo') === '1' && !localStorage.getItem(STORAGE_KEY)) {
    return new Set(DEMO_EARNED);
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(saved.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function isStorySpoiler(trophy) {
  return spoilerOn && trophy.kinds.includes('story') && !earned.has(trophy.id);
}

function targetLabel(trophy) {
  if (trophy.count == null) return '';
  if (trophy.category === 'money') return 'Target: $' + trophy.count.toLocaleString('en-US');
  return 'PSN target: ' + trophy.count;
}

function visibleName(trophy) {
  return isStorySpoiler(trophy) ? 'Hidden story trophy' : trophy.name;
}

function visibleDescription(trophy) {
  return isStorySpoiler(trophy) ? 'Earn this trophy to reveal its name and description.' : trophy.description;
}

function matchesFilters(trophy) {
  if (filters.tier !== 'all' && trophy.grade !== filters.tier) return false;
  if (filters.kind !== 'all' && !trophy.kinds.includes(filters.kind)) return false;
  if (filters.earned === 'remaining' && earned.has(trophy.id)) return false;
  if (filters.earned === 'earned' && !earned.has(trophy.id)) return false;
  if (filters.stage && trophy.roadmap !== filters.stage) return false;
  if (filters.search) {
    const hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
    if (!hay.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

function nextUpTrophy() {
  const ordered = [...trophies].sort((a, b) => a.roadmap - b.roadmap || a.id - b.id);
  return ordered.find((t) => !earned.has(t.id)) || null;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.id)).length;
  document.getElementById('earnedCount').textContent = done;
  document.getElementById('barFill').style.width = total ? Math.round((done / total) * 100) + '%' : '0%';
  document.getElementById('progressPct').textContent = (total ? Math.round((done / total) * 100) : 0) + '% to the platinum';
  const next = nextUpTrophy();
  document.getElementById('nextUp').textContent = next
    ? 'Next up: ' + next.name + ' (stage ' + next.roadmap + ')'
    : 'Every trophy earned — the platinum is yours.';
  const counts = document.getElementById('tierCounts');
  counts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const ofGrade = trophies.filter((t) => t.grade === grade);
    const got = ofGrade.filter((t) => earned.has(t.id)).length;
    const li = document.createElement('li');
    li.textContent = TIER_LABELS[grade] + ' ' + got + '/' + ofGrade.length;
    counts.append(li);
  }
}

function renderStages() {
  stagesEl.replaceChildren();
  for (const stage of roadmap) {
    const done = stage.ids.filter((id) => earned.has(id)).length;
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage' + (filters.stage === stage.stage ? ' active' : '');
    button.setAttribute('aria-pressed', String(filters.stage === stage.stage));
    const title = document.createElement('span');
    title.className = 'stage-title';
    title.textContent = stage.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = done + '/' + stage.ids.length + ' done';
    const detail = document.createElement('span');
    detail.className = 'stage-detail';
    detail.textContent = stage.detail;
    button.append(title, count, detail);
    button.addEventListener('click', () => {
      filters.stage = filters.stage === stage.stage ? null : stage.stage;
      renderAll();
    });
    li.append(button);
    stagesEl.append(li);
  }
}

function renderFilterButtons() {
  const tierBox = document.getElementById('tierFilters');
  tierBox.replaceChildren();
  for (const tier of ['all', 'platinum', 'gold', 'silver', 'bronze']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = tier === 'all' ? 'All grades' : TIER_LABELS[tier];
    button.className = 'chip' + (filters.tier === tier ? ' active' : '');
    button.setAttribute('aria-pressed', String(filters.tier === tier));
    button.addEventListener('click', () => { filters.tier = tier; renderAll(); });
    tierBox.append(button);
  }
  const kindBox = document.getElementById('kindFilters');
  kindBox.replaceChildren();
  for (const kind of ['all', 'story', 'missable', 'collectibles', 'activities', 'online']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = kind === 'all' ? 'All kinds' : KIND_LABELS[kind];
    button.className = 'chip' + (filters.kind === kind ? ' active' : '');
    button.setAttribute('aria-pressed', String(filters.kind === kind));
    button.addEventListener('click', () => { filters.kind = kind; renderAll(); });
    kindBox.append(button);
  }
  const earnedBox = document.getElementById('earnedFilters');
  earnedBox.replaceChildren();
  for (const [value, label] of [['all', 'Show all'], ['remaining', 'Remaining'], ['earned', 'Earned']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = 'chip' + (filters.earned === value ? ' active' : '');
    button.setAttribute('aria-pressed', String(filters.earned === value));
    button.addEventListener('click', () => { filters.earned = value; renderAll(); });
    earnedBox.append(button);
  }
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  listEl.replaceChildren();
  for (const trophy of shown) {
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(trophy.id) ? ' earned' : '') + (selectedId === trophy.id ? ' selected' : '');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = earned.has(trophy.id);
    checkbox.setAttribute('aria-label', 'Earned: ' + visibleName(trophy));
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) earned.add(trophy.id);
      else earned.delete(trophy.id);
      saveEarned();
      renderAll();
    });
    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'trophy-body';
    body.addEventListener('click', () => { selectedId = trophy.id; renderAll(); });
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = visibleName(trophy);
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.textContent = visibleDescription(trophy);
    const meta = document.createElement('span');
    meta.className = 'trophy-meta';
    const grade = document.createElement('span');
    grade.className = 'badge grade-' + trophy.grade;
    grade.textContent = TIER_LABELS[trophy.grade];
    meta.append(grade);
    for (const kind of trophy.kinds) {
      const tag = document.createElement('span');
      tag.className = 'badge kind-' + kind;
      tag.textContent = KIND_LABELS[kind];
      meta.append(tag);
    }
    if (trophy.missable) {
      const flag = document.createElement('span');
      flag.className = 'badge missable';
      flag.textContent = 'Missable';
      meta.append(flag);
    }
    const target = targetLabel(trophy);
    if (target) {
      const targetEl = document.createElement('span');
      targetEl.className = 'badge target';
      targetEl.textContent = target;
      meta.append(targetEl);
    }
    body.append(name, desc, meta);
    li.append(checkbox, body);
    listEl.append(li);
  }
  document.getElementById('emptyMsg').hidden = shown.length > 0;
  document.getElementById('listCount').textContent = shown.length + ' of ' + trophies.length + ' trophies shown';
  document.getElementById('listHeading').textContent =
    filters.stage ? 'Checklist — ' + (roadmap.find((s) => s.stage === filters.stage) || {}).title : 'Checklist';
}

function renderDetail() {
  const trophy = trophyById(selectedId) || trophies[0];
  if (!trophy) return;
  detailEl.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = visibleName(trophy);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = 'Official: "' + visibleDescription(trophy) + '" — ' + TIER_LABELS[trophy.grade];
  detailEl.append(heading, official);
  if (isStorySpoiler(trophy)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Spoiler mode is on. Earn this trophy to reveal its guide, or switch spoiler mode off above.';
    detailEl.append(note);
    return;
  }
  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = trophy.guide;
  const source = document.createElement('p');
  source.className = 'source';
  source.textContent = 'Source: ' + trophy.source;
  const stage = roadmap.find((s) => s.stage === trophy.roadmap);
  if (stage) {
    const stageNote = document.createElement('p');
    stageNote.className = 'stage-note';
    stageNote.textContent = 'Roadmap: ' + stage.title;
    detailEl.append(guideHeading, source, guide, stageNote);
  } else {
    detailEl.append(guideHeading, source, guide);
  }
  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'missable-warn';
    warn.textContent = 'Missable — tied to a one-time story moment or a specific condition. Read the guide before you pass it.';
    detailEl.append(warn);
  }
}

function renderMissableBox() {
  const missed = trophies.filter((t) => t.missable);
  const remaining = missed.filter((t) => !earned.has(t.id));
  missableBoxEl.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Missable watchlist — ' + (missed.length - remaining.length) + '/' + missed.length + ' done';
  const intro = document.createElement('p');
  intro.textContent = 'Eight trophies are tied to a one-time story moment or a specific condition. Clear them before the final mission.';
  const list = document.createElement('ul');
  for (const trophy of missed) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = (earned.has(trophy.id) ? '✓ ' : '○ ') + trophy.name;
    button.addEventListener('click', () => { selectedId = trophy.id; renderAll(); });
    li.append(button);
    list.append(li);
  }
  missableBoxEl.append(heading, intro, list);
}

function renderAll() {
  renderProgress();
  renderStages();
  renderFilterButtons();
  renderList();
  renderDetail();
  renderMissableBox();
}

function exportProgress() {
  const payload = { game: 'Grand Theft Auto VI', guide: 'Leonida Platinum Roadmap', exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const valid = new Set(trophies.map((t) => t.id));
    const next = new Set(ids.filter((id) => valid.has(id)));
    earned = next;
    saveEarned();
    renderAll();
  } catch {
    alert('That file is not a progress export from this guide.');
  }
}

document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) importProgress(file);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveEarned();
    renderAll();
  }
});
searchInput.addEventListener('input', () => { filters.search = searchInput.value; renderList(); });
spoilerInput.checked = spoilerOn;
spoilerInput.addEventListener('change', () => { spoilerOn = spoilerInput.checked; renderAll(); });

const [trophyDoc, roadmapDoc] = await Promise.all([
  (await fetch('data/trophies.json')).json(),
  (await fetch('data/roadmap.json')).json(),
]);
trophies = trophyDoc.trophies;
roadmap = roadmapDoc.stages;
if (!trophyById(selectedId)) selectedId = trophies[0].id;
renderAll();
if (params.get('scroll')) window.scrollTo(0, Number(params.get('scroll')));
