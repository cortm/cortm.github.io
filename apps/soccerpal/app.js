const STORAGE_KEY = 'soccerpal';

const DEFAULT_PROFILE = {
  skillLevel: 'beginner',
  challengesPerDay: 5,
  focusArea: 'balanced',
  equipment: { ball: true, cones: false, ladder: false },
  notifications: { dailyReminder: false, streakAlerts: false },
  restTimer: false,
  xp: 0,
  streak: 0,
  lastTrainedDate: null,
  totalDrillsDone: 0,
  completedDrillIds: [],
  weeklyHistory: {},
  completionLog: {},
  bonusAwardedDate: null,
  drillDurations: {},
  drillOverrides: {},
  settingsTab: 'general',
};

let profile = { ...DEFAULT_PROFILE };
let dailySession = null;
let currentView = 'home';
let activeDrillId = null;

let timerState = {
  remaining: 0,
  total: 0,
  running: false,
  interval: null,
  finished: false,
};

let repCount = 0;

let restInterval = null;

let calendarView = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
};
let selectedCalendarDate = null;
let pendingRemoveBonusDrillId = null;

let drillPool = DRILL_POOL.map((d) => ({ ...d, equipment: [...d.equipment] }));
let supabaseClient = null;
let drillsLoadedFromSupabase = false;

const SYNC_ID_KEY = 'soccerpal_sync_id';
let syncId = null;
let progressUpdatedAt = null;
let pushProgressTimer = null;

// ── Supabase ──

function initSupabase() {
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function mapRowToDrill(row) {
  const drill = {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.type,
    equipment: row.equipment || [],
    xp: row.xp,
    description: row.description,
    videoUrl: row.video_url || VIDEO_SEEDS[row.id] || '',
  };

  if (row.type === 'timer') {
    drill.duration = row.duration;
  } else {
    drill.reps = row.reps;
  }

  return drill;
}

function mapDrillToRow(drill) {
  const row = {
    id: drill.id,
    name: drill.name,
    category: drill.category,
    type: drill.type,
    equipment: drill.equipment,
    xp: drill.xp,
    description: drill.description,
    video_url: drill.videoUrl?.trim() || null,
    duration: null,
    reps: null,
  };

  if (drill.type === 'timer') {
    row.duration = drill.duration;
  } else {
    row.reps = drill.reps;
  }

  return row;
}

async function loadDrillsFromSupabase() {
  if (!supabaseClient) return false;

  const bundled = DRILL_POOL.map((d) => ({
    ...d,
    equipment: [...d.equipment],
    videoUrl: VIDEO_SEEDS[d.id] || d.videoUrl || '',
  }));
  const byId = new Map(bundled.map((d) => [d.id, d]));

  const { data, error } = await supabaseClient
    .from('drills')
    .select('*')
    .order('name');

  if (error) {
    console.warn('Supabase drill load failed, using bundled drills.', error);
    drillPool = bundled;
    return false;
  }

  if (data?.length) {
    data.forEach((row) => {
      byId.set(row.id, mapRowToDrill(row));
    });
    drillsLoadedFromSupabase = true;
  }

  drillPool = [...byId.values()];
  return Boolean(data?.length);
}

async function saveDrillToSupabase(id, drill) {
  if (!supabaseClient) return { error: new Error('Supabase not configured') };

  const payload = mapDrillToRow({ ...drill, id });
  const { data, error } = await supabaseClient
    .from('drills')
    .upsert(payload, { onConflict: 'id' })
    .select('id');

  if (error) return { error };
  if (!data?.length) {
    return { error: new Error('Cloud save blocked by database permissions') };
  }

  return { error: null };
}

function saveDrillLocally(id, drill) {
  profile.drillOverrides[id] = { ...drill };
  upsertLocalDrill(drill);
  saveState();
}

async function syncLocalOverridesToSupabase() {
  if (!supabaseClient) return 0;

  const overrides = Object.entries(profile.drillOverrides || {});
  if (!overrides.length) return 0;

  let synced = 0;

  for (const [id, override] of overrides) {
    const base = getBundledDrill(id) || getBaseDrill(id);
    if (!base) continue;

    const merged = {
      ...base,
      ...override,
      id,
      equipment: override.equipment ? [...override.equipment] : [...base.equipment],
    };

    if (merged.videoUrl) {
      merged.videoUrl = merged.videoUrl.trim();
    }

    const { error } = await saveDrillToSupabase(id, merged);
    if (error) {
      console.warn(`Could not sync override for ${id}`, error);
    }

    upsertLocalDrill(merged);
    if (!error) synced += 1;
  }

  if (synced) {
    saveState();
    console.info(`Synced ${synced} local drill override(s) to Supabase.`);
  }

  return synced;
}

function getOrCreateSyncId() {
  let id = localStorage.getItem(SYNC_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SYNC_ID_KEY, id);
  }
  return id;
}

function isValidSyncId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function profileForSync() {
  const { settingsTab, drillOverrides, ...rest } = profile;
  return rest;
}

function applyProfileFromCloud(cloudProfile) {
  profile = { ...DEFAULT_PROFILE, ...cloudProfile };
  profile.equipment = { ...DEFAULT_PROFILE.equipment, ...profile.equipment };
  profile.notifications = { ...DEFAULT_PROFILE.notifications, ...profile.notifications };
  profile.drillDurations = { ...DEFAULT_PROFILE.drillDurations, ...profile.drillDurations };
  profile.drillOverrides = { ...DEFAULT_PROFILE.drillOverrides, ...profile.drillOverrides };
  profile.completionLog = { ...DEFAULT_PROFILE.completionLog, ...profile.completionLog };
  profile.completedDrillIds = Array.isArray(profile.completedDrillIds) ? profile.completedDrillIds : [];
  profile.weeklyHistory = profile.weeklyHistory || {};
}

function applyCloudProgress(row) {
  if (row.profile) applyProfileFromCloud(row.profile);
  dailySession = row.daily_session || null;
  progressUpdatedAt = row.updated_at;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, dailySession, progressUpdatedAt }));
}

async function pushProgressToSupabase() {
  if (!supabaseClient || !syncId) return;

  const now = new Date().toISOString();
  progressUpdatedAt = now;

  const { error } = await supabaseClient
    .from('user_progress')
    .upsert({
      sync_id: syncId,
      profile: profileForSync(),
      daily_session: dailySession,
      updated_at: now,
    }, { onConflict: 'sync_id' });

  if (error) {
    console.warn('Could not sync progress to cloud', error);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, dailySession, progressUpdatedAt }));
}

function scheduleProgressPush() {
  if (!supabaseClient || !syncId) return;
  if (pushProgressTimer) clearTimeout(pushProgressTimer);
  pushProgressTimer = setTimeout(() => {
    pushProgressToSupabase();
  }, 500);
}

async function loadProgressFromSupabase({ forceCloud = false } = {}) {
  if (!supabaseClient || !syncId) return;

  const { data, error } = await supabaseClient
    .from('user_progress')
    .select('*')
    .eq('sync_id', syncId)
    .maybeSingle();

  if (error) {
    console.warn('Could not load progress from cloud', error);
    return;
  }

  if (!data) {
    await pushProgressToSupabase();
    return;
  }

  const localUpdated = progressUpdatedAt ? new Date(progressUpdatedAt) : new Date(0);
  const cloudUpdated = new Date(data.updated_at);

  if (forceCloud || cloudUpdated > localUpdated) {
    applyCloudProgress(data);
  } else if (localUpdated > cloudUpdated) {
    await pushProgressToSupabase();
  }
}

async function linkSyncDevice(code) {
  const trimmed = code.trim();
  if (!isValidSyncId(trimmed)) {
    showToast('Invalid sync code');
    return;
  }

  if (trimmed === syncId) {
    showToast('Already using this sync code');
    document.getElementById('sync-id-link').value = '';
    return;
  }

  if (!window.confirm('Replace progress on this device with the synced cloud data?')) {
    return;
  }

  syncId = trimmed;
  localStorage.setItem(SYNC_ID_KEY, syncId);
  document.getElementById('sync-id-link').value = '';

  await loadProgressFromSupabase({ forceCloud: true });
  syncStatsFromLog();
  ensureDailySession();
  renderGeneralSettings();
  if (currentView === 'home') renderHome();
  if (currentView === 'stats') renderStats();
  showToast('Device linked');
}

function getBundledDrill(id) {
  const base = DRILL_POOL.find((d) => d.id === id);
  if (!base) return null;
  return { ...base, equipment: [...base.equipment] };
}

function drillDiffersFromBundled(drill) {
  const bundled = getBundledDrill(drill.id);
  if (!bundled) return true;

  return (
    drill.name !== bundled.name
    || drill.category !== bundled.category
    || drill.type !== bundled.type
    || drill.xp !== bundled.xp
    || drill.description !== bundled.description
    || (drill.videoUrl || '') !== (bundled.videoUrl || '')
    || JSON.stringify(drill.equipment) !== JSON.stringify(bundled.equipment)
    || (drill.type === 'timer' ? drill.duration !== bundled.duration : drill.reps !== bundled.reps)
  );
}

function upsertLocalDrill(drill) {
  const index = drillPool.findIndex((d) => d.id === drill.id);
  const normalized = { ...drill, equipment: [...drill.equipment] };

  if (index === -1) {
    drillPool.push(normalized);
  } else {
    drillPool[index] = normalized;
  }
}

// ── Storage ──

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      profile = { ...DEFAULT_PROFILE, ...data.profile };
      profile.equipment = { ...DEFAULT_PROFILE.equipment, ...profile.equipment };
      profile.notifications = { ...DEFAULT_PROFILE.notifications, ...profile.notifications };
      profile.drillDurations = { ...DEFAULT_PROFILE.drillDurations, ...profile.drillDurations };
      profile.drillOverrides = { ...DEFAULT_PROFILE.drillOverrides, ...profile.drillOverrides };
      profile.completionLog = { ...DEFAULT_PROFILE.completionLog, ...profile.completionLog };
      dailySession = data.dailySession || null;
      progressUpdatedAt = data.progressUpdatedAt || null;
    }
  } catch {
    profile = { ...DEFAULT_PROFILE };
    dailySession = null;
  }
}

function saveState() {
  progressUpdatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, dailySession, progressUpdatedAt }));
  scheduleProgressPush();
}

// ── Date helpers ──

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// ── Drill helpers ──

function getBaseDrill(id) {
  return drillPool.find((d) => d.id === id);
}

function mergeDrill(base) {
  const overrides = profile.drillOverrides[base.id];
  if (!overrides) return { ...base, equipment: [...base.equipment] };

  return {
    ...base,
    ...overrides,
    equipment: overrides.equipment ? [...overrides.equipment] : [...base.equipment],
  };
}

function getDrill(id) {
  const base = getBaseDrill(id);
  if (!base) return null;
  return mergeDrill(base);
}

function getDrillPool() {
  return drillPool.map(mergeDrill);
}

function isYouTubeShortUrl(url) {
  return /youtube\.com\/shorts\//i.test(url);
}

function toEmbedUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.includes('youtube.com/embed/')) return trimmed;

  let videoId = '';
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);

  if (shortMatch) videoId = shortMatch[1];
  else if (shortsMatch) videoId = shortsMatch[1];
  else if (watchMatch) videoId = watchMatch[1];
  else if (embedMatch) videoId = embedMatch[1];

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return trimmed;
}

function getDrillDuration(drill) {
  return profile.drillDurations[drill.id] ?? drill.duration;
}

function setDrillDuration(drillId, seconds) {
  const drill = getDrill(drillId);
  if (!drill || drill.type !== 'timer') return false;

  const clamped = Math.max(5, Math.min(600, seconds));
  if (clamped === drill.duration) {
    delete profile.drillDurations[drillId];
  } else {
    profile.drillDurations[drillId] = clamped;
  }
  saveState();
  return true;
}

function openDurationModal() {
  if (!activeDrillId || timerState.running || timerState.finished) return;

  const drill = getDrill(activeDrillId);
  if (!drill || drill.type !== 'timer') return;

  const total = getDrillDuration(drill);
  document.getElementById('duration-minutes').value = Math.floor(total / 60);
  document.getElementById('duration-seconds').value = total % 60;
  document.getElementById('duration-modal-default').textContent = `Default: ${formatTime(drill.duration)}`;
  document.getElementById('duration-modal-reset').classList.toggle(
    'btn-hidden',
    profile.drillDurations[activeDrillId] == null
  );
  document.getElementById('duration-modal').classList.add('active');
}

function closeDurationModal() {
  document.getElementById('duration-modal').classList.remove('active');
}

function saveDurationModal() {
  if (!activeDrillId) return;

  const drill = getDrill(activeDrillId);
  if (!drill || drill.type !== 'timer') return;

  const minutes = parseInt(document.getElementById('duration-minutes').value, 10) || 0;
  const seconds = parseInt(document.getElementById('duration-seconds').value, 10) || 0;
  const total = minutes * 60 + seconds;

  if (total < 5) {
    showToast('Duration must be at least 5 seconds');
    return;
  }
  if (total > 600) {
    showToast('Duration cannot exceed 10 minutes');
    return;
  }

  setDrillDuration(activeDrillId, total);
  resetTimer(drill);
  closeDurationModal();
  renderDetail();
}

function resetDrillDuration() {
  if (!activeDrillId) return;

  const drill = getDrill(activeDrillId);
  if (!drill || drill.type !== 'timer') return;

  delete profile.drillDurations[activeDrillId];
  saveState();
  resetTimer(drill);
  closeDurationModal();
  renderDetail();
}

function equipmentLabel(drill) {
  if (!drill.equipment.length) return 'No equipment';
  const labels = { ball: 'Ball', cones: 'Cones', ladder: 'Ladder' };
  return drill.equipment.map((e) => labels[e] || e).join(', ');
}

function metaLine(drill) {
  const part =
    drill.type === 'timer'
      ? `${getDrillDuration(drill)}s`
      : `${drill.reps} reps`;
  return `${part} · ${equipmentLabel(drill)}`;
}

function drillMatchesEquipment(drill) {
  return drill.equipment.every((eq) => profile.equipment[eq]);
}

function pickWeightedDrills(pool, count) {
  const weights = FOCUS_AREAS[profile.focusArea] || FOCUS_AREAS.balanced;
  const picked = [];
  const available = [...pool];

  while (picked.length < count && available.length > 0) {
    const categories = Object.keys(weights);
    const roll = Math.random();
    let cumulative = 0;
    let targetCat = categories[0];
    for (const cat of categories) {
      cumulative += weights[cat];
      if (roll < cumulative) {
        targetCat = cat;
        break;
      }
    }

    let candidates = available.filter((d) => d.category === targetCat);
    if (!candidates.length) candidates = available;

    const idx = Math.floor(Math.random() * candidates.length);
    const drill = candidates[idx];
    picked.push(drill);
    const removeIdx = available.findIndex((d) => d.id === drill.id);
    available.splice(removeIdx, 1);
  }

  return picked;
}

function generateDailySession() {
  const filtered = getDrillPool().filter(drillMatchesEquipment);
  const count = Math.min(profile.challengesPerDay, filtered.length);
  const drills = pickWeightedDrills(filtered, count);

  dailySession = {
    date: todayStr(),
    drills: drills.map((d) => ({ drillId: d.id, completed: false })),
  };
  saveState();
}

function refreshDailySessionCount() {
  if (!dailySession || dailySession.date !== todayStr()) {
    generateDailySession();
    return;
  }

  const filtered = getDrillPool().filter(drillMatchesEquipment);
  const targetCount = Math.min(profile.challengesPerDay, filtered.length);
  const bonusDrills = dailySession.drills.filter((d) => d.bonus);
  let regularDrills = dailySession.drills.filter((d) => !d.bonus);

  if (regularDrills.length > targetCount) {
    while (regularDrills.length > targetCount) {
      const removeIdx = regularDrills.findLastIndex((d) => !d.completed);
      if (removeIdx === -1) break;
      regularDrills.splice(removeIdx, 1);
    }
  } else if (regularDrills.length < targetCount) {
    const existingIds = new Set(dailySession.drills.map((d) => d.drillId));
    const available = filtered.filter((d) => !existingIds.has(d.id));
    const toAdd = targetCount - regularDrills.length;
    const picked = pickWeightedDrills(available, toAdd);
    regularDrills = regularDrills.concat(picked.map((d) => ({ drillId: d.id, completed: false })));
  }

  dailySession.drills = [...regularDrills, ...bonusDrills];
  saveState();
}

function ensureDailySession() {
  if (!dailySession || dailySession.date !== todayStr()) {
    generateDailySession();
  }
}

// ── Gamification ──

function syncCompletedDrillIds() {
  const ids = new Set();
  Object.values(profile.completionLog).forEach((dayDrills) => {
    dayDrills.forEach((id) => ids.add(id));
  });
  profile.completedDrillIds = [...ids];
}

function syncTotalDrillsDone() {
  profile.totalDrillsDone = Object.values(profile.completionLog).reduce(
    (sum, dayDrills) => sum + dayDrills.length,
    0
  );
}

function syncWeeklyHistory() {
  const next = {};
  Object.entries(profile.completionLog).forEach(([date, drills]) => {
    if (drills.length) next[date] = drills.length;
  });
  profile.weeklyHistory = next;
}

function recalculateStreakFromLog() {
  const dates = Object.keys(profile.completionLog)
    .filter((d) => profile.completionLog[d].length > 0)
    .sort();

  if (!dates.length) {
    profile.streak = 0;
    profile.lastTrainedDate = null;
    return;
  }

  profile.lastTrainedDate = dates[dates.length - 1];

  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const curr = new Date(dates[i] + 'T12:00:00');
    const prev = new Date(dates[i - 1] + 'T12:00:00');
    const dayDiff = Math.round((curr - prev) / 86400000);
    if (dayDiff === 1) streak++;
    else break;
  }
  profile.streak = streak;
}

function syncStatsFromLog() {
  syncCompletedDrillIds();
  syncTotalDrillsDone();
  syncWeeklyHistory();
  recalculateStreakFromLog();
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function pruneHistory() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  for (const key of Object.keys(profile.completionLog)) {
    if (key < cutoffStr) delete profile.completionLog[key];
  }
}

function recordWeeklyCompletion(drillId) {
  const today = todayStr();
  if (!profile.completionLog[today]) profile.completionLog[today] = [];
  profile.completionLog[today].push(drillId);
  pruneHistory();
}

function completeDrill(drillId) {
  const entry = dailySession.drills.find((d) => d.drillId === drillId);
  if (!entry || entry.completed) return false;

  const drill = getDrill(drillId);
  if (!drill) return false;

  entry.completed = true;
  profile.xp += drill.xp;

  recordWeeklyCompletion(drillId);

  const allDone = dailySession.drills.every((d) => d.completed);
  let bonus = 0;
  if (allDone && profile.bonusAwardedDate !== todayStr()) {
    profile.xp += 50;
    profile.bonusAwardedDate = todayStr();
    bonus = 50;
  }

  syncStatsFromLog();
  saveState();
  return { xp: drill.xp, bonus };
}

function incompleteDrill(drillId) {
  const entry = dailySession.drills.find((d) => d.drillId === drillId);
  if (!entry || !entry.completed) return false;

  const drill = getDrill(drillId);
  if (!drill) return false;

  entry.completed = false;
  profile.xp = Math.max(0, profile.xp - drill.xp);

  const today = todayStr();
  if (profile.completionLog[today]) {
    const idx = profile.completionLog[today].lastIndexOf(drillId);
    if (idx !== -1) profile.completionLog[today].splice(idx, 1);
    if (!profile.completionLog[today].length) delete profile.completionLog[today];
  }

  if (profile.bonusAwardedDate === today && !dailySession.drills.every((d) => d.completed)) {
    profile.xp = Math.max(0, profile.xp - 50);
    profile.bonusAwardedDate = null;
  }

  syncStatsFromLog();
  saveState();
  return true;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

let celebrationTimeout = null;
let celebrationOnDismiss = null;

function spawnConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#d4af37', '#f5d76e', '#22c55e', '#1e4d8c', '#2563eb', '#ef4444', '#ffffff', '#a855f7'];

  for (let i = 0; i < 100; i++) {
    const piece = document.createElement('div');
    const isCircle = Math.random() > 0.6;
    piece.className = `confetti-piece${isCircle ? ' confetti-circle' : ''}`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    piece.style.setProperty('--drift', `${-40 + Math.random() * 80}px`);
    container.appendChild(piece);
  }
}

function dismissCelebration() {
  clearTimeout(celebrationTimeout);
  celebrationTimeout = null;
  document.getElementById('celebration-overlay').classList.remove('active');
  document.getElementById('confetti-container').innerHTML = '';
  const cb = celebrationOnDismiss;
  celebrationOnDismiss = null;
  if (cb) cb();
}

function showCelebration(xp, bonus, onDismiss) {
  dismissCelebration();
  celebrationOnDismiss = onDismiss;

  document.getElementById('celebration-xp').textContent = `+${xp} XP earned!`;
  const bonusEl = document.getElementById('celebration-bonus');
  if (bonus > 0) {
    bonusEl.textContent = `+${bonus} bonus XP — all drills done!`;
    bonusEl.classList.remove('btn-hidden');
  } else {
    bonusEl.classList.add('btn-hidden');
  }

  spawnConfetti();
  document.getElementById('celebration-overlay').classList.add('active');
  celebrationTimeout = setTimeout(dismissCelebration, 3000);
}

// ── Audio ──

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* audio unavailable */
  }
}

// ── Timer ──

const RING_RADIUS = 90;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function resetTimer(drill) {
  clearInterval(timerState.interval);
  const duration = getDrillDuration(drill);
  timerState.total = duration;
  timerState.remaining = duration;
  timerState.running = false;
  timerState.finished = false;
  timerState.interval = null;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function updateRing() {
  const fg = document.getElementById('timer-ring-fg');
  if (!fg) return;
  const progress = timerState.remaining / timerState.total;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  fg.style.strokeDashoffset = offset;
}

function tickTimer() {
  if (timerState.remaining <= 0) {
    clearInterval(timerState.interval);
    timerState.running = false;
    timerState.finished = true;
    playBeep();
    renderDetail();
    return;
  }
  timerState.remaining -= 1;
  document.getElementById('timer-display').textContent = formatTime(timerState.remaining);
  updateRing();
}

function toggleTimer() {
  if (timerState.finished) return;

  if (timerState.running) {
    clearInterval(timerState.interval);
    timerState.running = false;
  } else {
    timerState.running = true;
    timerState.interval = setInterval(tickTimer, 1000);
  }
  renderDetailControls();
}

function resetTimerBtn() {
  const drill = getDrill(activeDrillId);
  if (!drill) return;
  resetTimer(drill);
  renderDetail();
}

// ── Rest overlay ──

function showRestOverlay() {
  if (!profile.restTimer) {
    navigate('home');
    return;
  }

  const overlay = document.getElementById('rest-overlay');
  const countEl = document.getElementById('rest-count');
  let remaining = 30;
  countEl.textContent = remaining;
  overlay.classList.add('active');

  clearInterval(restInterval);
  restInterval = setInterval(() => {
    remaining -= 1;
    countEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(restInterval);
      overlay.classList.remove('active');
      navigate('home');
    }
  }, 1000);
}

function skipRest() {
  clearInterval(restInterval);
  document.getElementById('rest-overlay').classList.remove('active');
  navigate('home');
}

// ── Navigation ──

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');

  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.view === view);
  });

  if (view === 'home') renderHome();
  else if (view === 'stats') renderStats();
  else if (view === 'settings') renderSettings();
}

function openDetail(drillId) {
  activeDrillId = drillId;
  const drill = getDrill(drillId);
  if (!drill) return;

  if (drill.type === 'timer') {
    resetTimer(drill);
  } else {
    repCount = 0;
  }

  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById('view-detail').classList.add('active');
  renderDetail();
}

function goBack() {
  clearInterval(timerState.interval);
  timerState.running = false;
  closeDurationModal();
  navigate('home');
}

function openBonusDrillPicker() {
  ensureDailySession();
  currentView = 'bonus-picker';
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById('view-bonus-picker').classList.add('active');
  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.view === 'home');
  });
  renderBonusDrillList();
}

function goBackFromBonusPicker() {
  navigate('home');
}

function renderBonusDrillList() {
  const list = document.getElementById('bonus-drill-list');
  const inSession = new Set(dailySession.drills.map((d) => d.drillId));
  const drills = getDrillPool().sort((a, b) => a.name.localeCompare(b.name));

  list.innerHTML = '';

  if (!drills.length) {
    list.innerHTML = '<div class="empty-state">No drills available</div>';
    return;
  }

  drills.forEach((drill) => {
    const inToday = inSession.has(drill.id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `bonus-drill-card${inToday ? ' in-session' : ''}`;
    card.disabled = inToday;

    card.innerHTML = `
      <div class="bonus-drill-body">
        <span class="category-pill ${drill.category}">${CATEGORY_LABELS[drill.category]}</span>
        <div class="challenge-name">${drill.name}</div>
        <div class="challenge-meta">${metaLine(drill)}</div>
        <div class="challenge-xp">+${drill.xp} XP</div>
      </div>
      <span class="bonus-drill-action">${inToday ? 'Added' : 'Add'}</span>
    `;

    if (!inToday) {
      card.addEventListener('click', () => addBonusDrill(drill.id));
    }

    list.appendChild(card);
  });
}

function addBonusDrill(drillId) {
  ensureDailySession();

  if (dailySession.drills.some((d) => d.drillId === drillId)) {
    showToast('Drill already in today\'s session');
    return;
  }

  dailySession.drills.push({ drillId, completed: false, bonus: true });
  saveState();
  showToast('Bonus drill added!');
  navigate('home');
}

function openRemoveBonusModal(drillId) {
  const drill = getDrill(drillId);
  if (!drill) return;

  pendingRemoveBonusDrillId = drillId;
  document.getElementById('remove-bonus-message').textContent =
    `Remove ${drill.name} from today's session?`;
  document.getElementById('remove-bonus-modal').classList.add('active');
}

function closeRemoveBonusModal() {
  pendingRemoveBonusDrillId = null;
  document.getElementById('remove-bonus-modal').classList.remove('active');
}

function confirmRemoveBonusDrill() {
  const drillId = pendingRemoveBonusDrillId;
  if (!drillId || !dailySession) {
    closeRemoveBonusModal();
    return;
  }

  const idx = dailySession.drills.findIndex((d) => d.drillId === drillId && d.bonus);
  if (idx === -1) {
    closeRemoveBonusModal();
    return;
  }

  const entry = dailySession.drills[idx];
  if (entry.completed) incompleteDrill(drillId);

  dailySession.drills.splice(idx, 1);
  saveState();
  closeRemoveBonusModal();
  showToast('Bonus drill removed');
  renderHome();
  if (currentView === 'stats') renderStats();
}

// ── Render: Home ──

function renderHome() {
  ensureDailySession();

  document.getElementById('streak-badge').textContent = `🔥 ${profile.streak} day${profile.streak !== 1 ? 's' : ''}`;
  document.getElementById('xp-badge').textContent = `⭐ ${profile.xp} XP`;

  const done = dailySession.drills.filter((d) => d.completed).length;
  const total = dailySession.drills.length;
  document.getElementById('progress-label').textContent = `${done} of ${total} done`;
  document.getElementById('progress-fill').style.width = total ? `${(done / total) * 100}%` : '0%';

  const list = document.getElementById('challenge-list');
  list.innerHTML = '';

  if (!total) {
    list.innerHTML = '<div class="empty-state">No drills available with your equipment. Update settings to add gear.</div>';
    return;
  }

  dailySession.drills.forEach((entry) => {
    const drill = getDrill(entry.drillId);
    if (!drill) return;

    const card = document.createElement('div');
    card.className = `challenge-card${entry.completed ? ' done' : ''}`;
    card.innerHTML = `
      <div class="challenge-body">
        <div class="challenge-pills">
          <span class="category-pill ${drill.category}">${CATEGORY_LABELS[drill.category]}</span>
          ${entry.bonus ? '<button type="button" class="bonus-badge" aria-label="Remove bonus drill">Bonus</button>' : ''}
        </div>
        <div class="challenge-name">${drill.name}</div>
        <div class="challenge-meta">${metaLine(drill)}</div>
        <div class="challenge-xp">+${drill.xp} XP</div>
      </div>
      <button type="button" class="check-circle${entry.completed ? ' done' : ''}" aria-label="${entry.completed ? 'Mark incomplete' : 'Mark complete'}" data-drill-id="${entry.drillId}">${entry.completed ? '✓' : ''}</button>
    `;

    const bonusBadge = card.querySelector('.bonus-badge');
    if (bonusBadge) {
      bonusBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        openRemoveBonusModal(entry.drillId);
      });
    }

    const checkBtn = card.querySelector('.check-circle');
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDrillCompletion(entry.drillId, { fromHome: true });
    });

    card.addEventListener('click', () => openDetail(entry.drillId));
    list.appendChild(card);
  });
}

// ── Render: Detail ──

function renderDetailControls() {
  const drill = getDrill(activeDrillId);
  if (!drill || drill.type !== 'timer') return;

  const startBtn = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  const completeBtn = document.getElementById('timer-complete-btn');

  const entry = dailySession?.drills.find((d) => d.drillId === activeDrillId);
  const alreadyDone = entry?.completed;

  if (timerState.finished) {
    startBtn.classList.add('btn-hidden');
    resetBtn.classList.remove('btn-hidden');
  } else {
    startBtn.classList.remove('btn-hidden');
    startBtn.textContent = timerState.running ? 'Pause' : timerState.remaining < timerState.total ? 'Resume' : 'Start';
    resetBtn.classList.remove('btn-hidden');
  }

  completeBtn.classList.remove('btn-hidden');
  updateCompleteButton('timer-complete-btn', alreadyDone);
}

function updateCompleteButton(btnId, alreadyDone) {
  const btn = document.getElementById(btnId);
  btn.disabled = false;
  btn.textContent = alreadyDone ? 'Mark incomplete' : 'Mark complete';
  btn.classList.toggle('btn-incomplete', alreadyDone);
}

function renderDetail() {
  const drill = getDrill(activeDrillId);
  if (!drill) return;

  document.getElementById('detail-title').textContent = drill.name;

  const entry = dailySession?.drills.find((d) => d.drillId === activeDrillId);
  const alreadyDone = entry?.completed;

  const timerSection = document.getElementById('timer-section');
  const repSection = document.getElementById('rep-section');

  if (drill.type === 'timer') {
    timerSection.style.display = 'flex';
    repSection.style.display = 'none';

    document.getElementById('timer-display').textContent = formatTime(timerState.remaining);

    const editBtn = document.getElementById('edit-duration-btn');
    const editingDisabled = timerState.running || timerState.finished;
    editBtn.disabled = editingDisabled;
    editBtn.style.opacity = editingDisabled ? '0.4' : '1';

    const fg = document.getElementById('timer-ring-fg');
    fg.setAttribute('stroke-dasharray', RING_CIRCUMFERENCE);
    updateRing();
    renderDetailControls();
  } else {
    timerSection.style.display = 'none';
    repSection.style.display = 'flex';
    document.getElementById('rep-count').textContent = repCount;
    document.getElementById('rep-target').textContent = `Target: ${drill.reps} reps`;
    updateCompleteButton('rep-complete-btn', alreadyDone);
  }

  document.getElementById('drill-description').textContent = drill.description;

  const videoEl = document.getElementById('video-section');
  const embedUrl = toEmbedUrl(drill.videoUrl);
  videoEl.classList.toggle('video-section--shorts', isYouTubeShortUrl(drill.videoUrl));
  if (embedUrl) {
    videoEl.innerHTML = `<iframe src="${embedUrl}" title="${drill.name} tutorial" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  } else {
    videoEl.classList.remove('video-section--shorts');
    videoEl.innerHTML = '<div class="video-placeholder">No video for this drill yet — add one in Settings → Drills</div>';
  }
}

function adjustReps(delta) {
  repCount = Math.max(0, repCount + delta);
  document.getElementById('rep-count').textContent = repCount;
}

function toggleDrillCompletion(drillId, { fromHome = false } = {}) {
  const entry = dailySession?.drills.find((d) => d.drillId === drillId);
  if (!entry) return;

  const drill = getDrill(drillId);
  if (!drill) return;

  const wasCompleted = entry.completed;

  if (wasCompleted) {
    if (!incompleteDrill(drillId)) return;
    showToast(`Marked ${drill.name} incomplete`);

    if (fromHome) renderHome();
    else renderDetail();

    if (currentView === 'stats') renderStats();
    if (currentView === 'day-detail') renderDayDetail();
    return;
  }

  const result = completeDrill(drillId);
  if (!result) return;

  if (fromHome) renderHome();
  else renderDetail();

  if (currentView === 'stats') renderStats();
  if (currentView === 'day-detail') renderDayDetail();

  showCelebration(result.xp, result.bonus, () => {
    if (profile.restTimer) showRestOverlay();
  });
}

function markComplete() {
  if (!activeDrillId) return;
  toggleDrillCompletion(activeDrillId);
}

// ── Render: Stats ──

function skillBreakdown() {
  const categories = ['footwork', 'ball-control', 'agility'];
  const totals = {};
  let grandTotal = 0;

  categories.forEach((cat) => {
    totals[cat] = profile.completedDrillIds.filter((id) => {
      const d = getDrill(id);
      return d && d.category === cat;
    }).length;
    grandTotal += totals[cat];
  });

  return categories.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    pct: grandTotal ? Math.round((totals[cat] / grandTotal) * 100) : 0,
    count: totals[cat],
  }));
}

function renderStats() {
  document.getElementById('stat-streak').textContent = profile.streak;
  document.getElementById('stat-drills').textContent = profile.totalDrillsDone;
  document.getElementById('stat-xp').textContent = profile.xp;
  document.getElementById('stat-time').textContent = `${profile.totalDrillsDone * 3}m`;

  const days = last7Days();
  const maxCount = Math.max(1, ...days.map((d) => profile.weeklyHistory[d] || 0));
  const chart = document.getElementById('weekly-chart');
  chart.innerHTML = '';

  days.forEach((date) => {
    const count = profile.weeklyHistory[date] || 0;
    const height = Math.max(4, (count / maxCount) * 90);
    const wrap = document.createElement('div');
    wrap.className = 'chart-bar-wrap';
    wrap.innerHTML = `
      <span class="chart-count">${count || ''}</span>
      <div class="chart-bar" style="height:${height}px"></div>
      <span class="chart-label">${dayLabel(date)}</span>
    `;
    chart.appendChild(wrap);
  });

  const skills = document.getElementById('skill-breakdown');
  skills.innerHTML = '';
  skillBreakdown().forEach((s) => {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <div class="skill-header">
        <span>${s.label}</span>
        <span>${s.pct}% (${s.count})</span>
      </div>
      <div class="skill-bar-track">
        <div class="skill-bar-fill ${s.category}" style="width:${s.pct}%"></div>
      </div>
    `;
    skills.appendChild(row);
  });

  renderCalendar();
}

function renderCalendar() {
  const { year, month } = calendarView;
  const label = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  document.getElementById('cal-month-label').textContent = label;

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayStr();

  for (let i = 0; i < firstDay; i++) {
    const pad = document.createElement('div');
    pad.className = 'calendar-day empty';
    grid.appendChild(pad);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = (profile.completionLog[dateStr] || []).length;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'calendar-day';
    cell.dataset.date = dateStr;

    if (dateStr === today) cell.classList.add('today');
    if (count > 0) cell.classList.add('has-activity');

    cell.innerHTML = `
      <span class="calendar-day-num">${day}</span>
      ${count > 0 ? `<span class="calendar-day-dot">${count}</span>` : ''}
    `;
    grid.appendChild(cell);
  }
}

function openDayDetail(dateStr) {
  selectedCalendarDate = dateStr;
  currentView = 'day-detail';

  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById('view-day-detail').classList.add('active');

  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.view === 'stats');
  });

  renderDayDetail();
}

function goBackFromDayDetail() {
  navigate('stats');
}

function renderDayDetail() {
  const dateStr = selectedCalendarDate;
  const drillIds = profile.completionLog[dateStr] || [];

  document.getElementById('day-detail-title').textContent = formatDateLabel(dateStr);

  const list = document.getElementById('day-detail-list');
  list.innerHTML = '';

  if (!drillIds.length) {
    list.innerHTML = '<li class="calendar-empty">No drills completed this day</li>';
    return;
  }

  drillIds.forEach((id) => {
    const drill = getDrill(id);
    const li = document.createElement('li');
    li.className = 'calendar-drill-item';
    if (drill) {
      li.innerHTML = `
        <span class="category-pill ${drill.category}">${CATEGORY_LABELS[drill.category]}</span>
        <span class="calendar-drill-name">${drill.name}</span>
      `;
    } else {
      li.textContent = id;
    }
    list.appendChild(li);
  });
}

function selectCalendarDay(dateStr) {
  openDayDetail(dateStr);
}

function shiftCalendarMonth(delta) {
  calendarView.month += delta;
  if (calendarView.month > 11) {
    calendarView.month = 0;
    calendarView.year += 1;
  } else if (calendarView.month < 0) {
    calendarView.month = 11;
    calendarView.year -= 1;
  }
  renderCalendar();
}

// ── Render: Settings ──

function switchSettingsTab(tab) {
  profile.settingsTab = tab;
  saveState();
  document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('settings-tab-general').classList.toggle('active', tab === 'general');
  document.getElementById('settings-tab-drills').classList.toggle('active', tab === 'drills');
  if (tab === 'drills') renderDrillEditors();
}

function renderGeneralSettings() {
  document.querySelectorAll('#skill-pills button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === profile.skillLevel);
  });

  document.getElementById('challenges-select').value = String(profile.challengesPerDay);
  document.getElementById('focus-select').value = profile.focusArea;

  document.getElementById('eq-ball').checked = profile.equipment.ball;
  document.getElementById('eq-cones').checked = profile.equipment.cones;
  document.getElementById('eq-ladder').checked = profile.equipment.ladder;

  document.getElementById('notif-daily').checked = profile.notifications.dailyReminder;
  document.getElementById('notif-streak').checked = profile.notifications.streakAlerts;
  document.getElementById('rest-timer').checked = profile.restTimer;

  const syncDisplay = document.getElementById('sync-id-display');
  if (syncDisplay) syncDisplay.value = syncId || '';
}

function drillEditorTypeFields(drill) {
  if (drill.type === 'timer') {
    return `
      <div class="drill-field">
        <label>Duration (seconds)</label>
        <input type="number" class="text-input drill-duration" min="5" max="600" value="${drill.duration}">
      </div>
    `;
  }
  return `
    <div class="drill-field">
      <label>Reps</label>
      <input type="number" class="text-input drill-reps" min="1" max="999" value="${drill.reps}">
    </div>
  `;
}

function renderDrillEditors() {
  const list = document.getElementById('drill-editor-list');
  list.innerHTML = '';

  const drills = getDrillPool().sort((a, b) => a.name.localeCompare(b.name));

  drills.forEach((drill) => {
    const hasOverrides = Boolean(profile.drillOverrides[drill.id]) || drillDiffersFromBundled(drill);
    const card = document.createElement('div');
    card.className = 'drill-editor-card';
    card.dataset.drillId = drill.id;

    card.innerHTML = `
      <button type="button" class="drill-editor-header">
        <div class="drill-editor-header-text">
          <span class="category-pill ${drill.category}">${CATEGORY_LABELS[drill.category]}</span>
          <span class="drill-editor-name">${drill.name}</span>
        </div>
        <span class="drill-editor-chevron">›</span>
      </button>
      <div class="drill-editor-body">
        <div class="drill-field">
          <label>Name</label>
          <input type="text" class="text-input drill-name" value="${escapeAttr(drill.name)}">
        </div>
        <div class="drill-field">
          <label>Category</label>
          <select class="select-input drill-category">
            <option value="footwork" ${drill.category === 'footwork' ? 'selected' : ''}>Footwork</option>
            <option value="ball-control" ${drill.category === 'ball-control' ? 'selected' : ''}>Ball control</option>
            <option value="agility" ${drill.category === 'agility' ? 'selected' : ''}>Agility</option>
          </select>
        </div>
        <div class="drill-field">
          <label>Type</label>
          <select class="select-input drill-type">
            <option value="timer" ${drill.type === 'timer' ? 'selected' : ''}>Timer</option>
            <option value="reps" ${drill.type === 'reps' ? 'selected' : ''}>Reps</option>
          </select>
        </div>
        <div class="drill-type-fields">${drillEditorTypeFields(drill)}</div>
        <div class="drill-field">
          <label>XP reward</label>
          <input type="number" class="text-input drill-xp" min="1" max="999" value="${drill.xp}">
        </div>
        <div class="drill-field">
          <label>Description</label>
          <textarea class="text-input drill-description" rows="3">${escapeHtml(drill.description)}</textarea>
        </div>
        <div class="drill-field">
          <div class="drill-field-label-row">
            <label>Video link (YouTube)</label>
            <button type="button" class="drill-video-search-btn btn-hidden" aria-label="Search YouTube for this drill" title="Search YouTube">↗</button>
          </div>
          <input type="url" class="text-input drill-video" placeholder="https://youtube.com/watch?v=... or /shorts/..." value="${escapeAttr(drill.videoUrl || '')}">
        </div>
        <div class="drill-field">
          <label>Equipment</label>
          <div class="drill-equipment">
            <label class="drill-check"><input type="checkbox" class="drill-eq-ball" ${drill.equipment.includes('ball') ? 'checked' : ''}> Ball</label>
            <label class="drill-check"><input type="checkbox" class="drill-eq-cones" ${drill.equipment.includes('cones') ? 'checked' : ''}> Cones</label>
            <label class="drill-check"><input type="checkbox" class="drill-eq-ladder" ${drill.equipment.includes('ladder') ? 'checked' : ''}> Ladder</label>
          </div>
        </div>
        <div class="drill-editor-actions">
          <button type="button" class="btn btn-primary btn-sm drill-save-btn">Save drill</button>
          <button type="button" class="btn btn-secondary btn-sm drill-reset-btn${hasOverrides ? '' : ' btn-hidden'}">Reset to default</button>
        </div>
      </div>
    `;

    list.appendChild(card);
    updateDrillVideoSearchBtn(card);
  });
}

function updateDrillVideoSearchBtn(card) {
  const input = card.querySelector('.drill-video');
  const btn = card.querySelector('.drill-video-search-btn');
  if (!input || !btn) return;

  btn.classList.toggle('btn-hidden', Boolean(input.value.trim()));
}

function openDrillVideoSearch(card) {
  const name = card.querySelector('.drill-name')?.value.trim();
  if (!name) {
    showToast('Enter a drill name first');
    return;
  }

  const query = encodeURIComponent(`${name} soccer drill`);
  window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readDrillEditor(card) {
  const id = card.dataset.drillId;
  const type = card.querySelector('.drill-type').value;
  const equipment = [];
  if (card.querySelector('.drill-eq-ball').checked) equipment.push('ball');
  if (card.querySelector('.drill-eq-cones').checked) equipment.push('cones');
  if (card.querySelector('.drill-eq-ladder').checked) equipment.push('ladder');

  const drill = {
    name: card.querySelector('.drill-name').value.trim(),
    category: card.querySelector('.drill-category').value,
    type,
    xp: parseInt(card.querySelector('.drill-xp').value, 10) || 1,
    description: card.querySelector('.drill-description').value.trim(),
    videoUrl: card.querySelector('.drill-video').value.trim(),
    equipment,
  };

  if (type === 'timer') {
    drill.duration = parseInt(card.querySelector('.drill-duration').value, 10) || 30;
  } else {
    drill.reps = parseInt(card.querySelector('.drill-reps').value, 10) || 10;
  }

  return { id, drill };
}

async function saveDrillEditor(card) {
  const { id, drill } = readDrillEditor(card);

  if (!drill.name) {
    showToast('Drill name is required');
    return;
  }
  if (!drill.description) {
    showToast('Description is required');
    return;
  }

  const normalized = { ...drill, id };
  if (normalized.videoUrl) {
    normalized.videoUrl = normalized.videoUrl.trim();
  } else {
    normalized.videoUrl = '';
  }

  if (supabaseClient) {
    const { error } = await saveDrillToSupabase(id, normalized);
    if (error) {
      console.error(error);
      saveDrillLocally(id, normalized);
      showToast('Saved on this device');
      renderDrillEditors();
      if (currentView === 'home') renderHome();
      if (currentView === 'detail' && activeDrillId === id) renderDetail();
      return;
    }
  }

  delete profile.drillOverrides[id];
  upsertLocalDrill(normalized);
  saveState();
  showToast(`Saved ${normalized.name}`);
  renderDrillEditors();
  if (currentView === 'home') renderHome();
  if (currentView === 'detail' && activeDrillId === id) renderDetail();
}

async function resetDrillEditor(card) {
  const id = card.dataset.drillId;
  const bundled = getBundledDrill(id);
  if (!bundled) return;

  if (supabaseClient) {
    const { error } = await saveDrillToSupabase(id, bundled);
    if (error) {
      console.error(error);
      delete profile.drillOverrides[id];
      delete profile.drillDurations[id];
      upsertLocalDrill(bundled);
      saveState();
      showToast('Reset on this device');
      renderDrillEditors();
      if (currentView === 'home') renderHome();
      if (currentView === 'detail' && activeDrillId === id) renderDetail();
      return;
    }
  }

  delete profile.drillOverrides[id];
  delete profile.drillDurations[id];
  upsertLocalDrill(bundled);
  saveState();
  showToast('Drill reset to default');
  renderDrillEditors();
  if (currentView === 'home') renderHome();
  if (currentView === 'detail' && activeDrillId === id) renderDetail();
}

function onDrillTypeChange(card) {
  const drill = getDrill(card.dataset.drillId);
  const type = card.querySelector('.drill-type').value;
  const fields = card.querySelector('.drill-type-fields');
  fields.innerHTML = drillEditorTypeFields({
    ...drill,
    type,
    duration: drill.duration || 30,
    reps: drill.reps || 10,
  });
}

function renderSettings() {
  switchSettingsTab(profile.settingsTab || 'general');
  renderGeneralSettings();
  if (profile.settingsTab === 'drills') renderDrillEditors();
}

function onSettingChange() {
  saveState();
  if (currentView === 'home') renderHome();
}

// ── Init ──

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  document.getElementById('back-btn').addEventListener('click', goBack);
  document.getElementById('bonus-picker-back-btn').addEventListener('click', goBackFromBonusPicker);
  document.getElementById('add-bonus-drill-btn').addEventListener('click', openBonusDrillPicker);

  document.getElementById('remove-bonus-modal-backdrop').addEventListener('click', closeRemoveBonusModal);
  document.getElementById('remove-bonus-cancel').addEventListener('click', closeRemoveBonusModal);
  document.getElementById('remove-bonus-confirm').addEventListener('click', confirmRemoveBonusDrill);

  document.getElementById('day-detail-back-btn').addEventListener('click', goBackFromDayDetail);
  document.getElementById('timer-start-btn').addEventListener('click', toggleTimer);
  document.getElementById('timer-reset-btn').addEventListener('click', resetTimerBtn);
  document.getElementById('timer-complete-btn').addEventListener('click', markComplete);
  document.getElementById('rep-complete-btn').addEventListener('click', markComplete);

  document.getElementById('edit-duration-btn').addEventListener('click', openDurationModal);
  document.getElementById('duration-modal-backdrop').addEventListener('click', closeDurationModal);
  document.getElementById('duration-modal-cancel').addEventListener('click', closeDurationModal);
  document.getElementById('duration-modal-save').addEventListener('click', saveDurationModal);
  document.getElementById('duration-modal-reset').addEventListener('click', resetDrillDuration);

  ['rep-minus-10', 'rep-minus-1', 'rep-plus-1', 'rep-plus-10'].forEach((id) => {
    document.getElementById(id).addEventListener('click', () => {
      const map = { 'rep-minus-10': -10, 'rep-minus-1': -1, 'rep-plus-1': 1, 'rep-plus-10': 10 };
      adjustReps(map[id]);
    });
  });

  document.getElementById('skip-rest').addEventListener('click', skipRest);

  document.getElementById('celebration-continue').addEventListener('click', dismissCelebration);
  document.getElementById('celebration-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'celebration-overlay') dismissCelebration();
  });

  document.getElementById('cal-prev').addEventListener('click', () => shiftCalendarMonth(-1));
  document.getElementById('cal-next').addEventListener('click', () => shiftCalendarMonth(1));
  document.getElementById('calendar-grid').addEventListener('click', (e) => {
    const cell = e.target.closest('.calendar-day:not(.empty)');
    if (cell?.dataset.date) selectCalendarDay(cell.dataset.date);
  });

  document.querySelectorAll('#skill-pills button').forEach((btn) => {
    btn.addEventListener('click', () => {
      profile.skillLevel = btn.dataset.value;
      renderSettings();
      onSettingChange();
    });
  });

  document.getElementById('challenges-select').addEventListener('change', (e) => {
    profile.challengesPerDay = parseInt(e.target.value, 10);
    refreshDailySessionCount();
    onSettingChange();
  });

  document.getElementById('focus-select').addEventListener('change', (e) => {
    profile.focusArea = e.target.value;
    onSettingChange();
  });

  ['ball', 'cones', 'ladder'].forEach((eq) => {
    document.getElementById(`eq-${eq}`).addEventListener('change', (e) => {
      profile.equipment[eq] = e.target.checked;
      onSettingChange();
    });
  });

  document.getElementById('notif-daily').addEventListener('change', (e) => {
    profile.notifications.dailyReminder = e.target.checked;
    onSettingChange();
  });

  document.getElementById('notif-streak').addEventListener('change', (e) => {
    profile.notifications.streakAlerts = e.target.checked;
    onSettingChange();
  });

  document.getElementById('rest-timer').addEventListener('change', (e) => {
    profile.restTimer = e.target.checked;
    onSettingChange();
  });

  document.getElementById('sync-accordion-toggle').addEventListener('click', () => {
    document.getElementById('sync-accordion').classList.toggle('expanded');
  });

  document.getElementById('sync-copy-btn').addEventListener('click', async () => {
    if (!syncId) return;
    try {
      await navigator.clipboard.writeText(syncId);
      showToast('Sync code copied');
    } catch {
      showToast('Could not copy — select and copy manually');
    }
  });

  document.getElementById('sync-link-btn').addEventListener('click', () => {
    linkSyncDevice(document.getElementById('sync-id-link').value);
  });

  document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchSettingsTab(btn.dataset.tab));
  });

  document.getElementById('drill-editor-list').addEventListener('click', (e) => {
    const header = e.target.closest('.drill-editor-header');
    if (header) {
      header.parentElement.classList.toggle('expanded');
      return;
    }

    const saveBtn = e.target.closest('.drill-save-btn');
    if (saveBtn) {
      saveDrillEditor(saveBtn.closest('.drill-editor-card'));
      return;
    }

    const resetBtn = e.target.closest('.drill-reset-btn');
    if (resetBtn) {
      resetDrillEditor(resetBtn.closest('.drill-editor-card'));
      return;
    }

    const searchBtn = e.target.closest('.drill-video-search-btn');
    if (searchBtn) {
      openDrillVideoSearch(searchBtn.closest('.drill-editor-card'));
    }
  });

  document.getElementById('drill-editor-list').addEventListener('input', (e) => {
    if (e.target.classList.contains('drill-video')) {
      updateDrillVideoSearchBtn(e.target.closest('.drill-editor-card'));
    }
  });

  document.getElementById('drill-editor-list').addEventListener('change', (e) => {
    if (e.target.classList.contains('drill-type')) {
      onDrillTypeChange(e.target.closest('.drill-editor-card'));
    }
  });
}

async function init() {
  supabaseClient = initSupabase();
  syncId = getOrCreateSyncId();
  loadState();
  await loadDrillsFromSupabase();
  await loadProgressFromSupabase();
  await syncLocalOverridesToSupabase();
  syncStatsFromLog();
  ensureDailySession();
  bindEvents();
  navigate('home');

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadProgressFromSupabase().then(() => {
        syncStatsFromLog();
        ensureDailySession();
        if (currentView === 'home') renderHome();
        if (currentView === 'stats') renderStats();
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
