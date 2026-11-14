/* Baston TV — Prototype 0.12. Aucun framework, ni serveur, ni compte requis. */
"use strict";

const SAVE_KEY = "bastontv-save-v03";
const BASE_TRAINING_COST = 100;
const TRAINING_INCREASE_EVERY = 3;
const TRAINING_INCREASE_AMOUNT = 20;
const TRAINING_MS = 20_000;
const SPOT_LIFETIME_MS = 980;
const MISS_PENALTY_MS = 700;
const WRONG_CLICK_PENALTY_MS = 500;
const MIN_SPOT_DISTANCE = 28;
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1_000;
// Œufs : normal 30 min, shiny révélé après 30 min puis prêt après 2 h.
const EGG_NORMAL_MS = 30 * 60_000;
const EGG_SHINY_MS = 120 * 60_000;
const EGG_CAP = 3;
const SHINY_RATE = 0.30;
const GEM_START = 10;
const GEM_ACCEL_COST = 5;
const GEM_ACCEL_MS = 30 * 60_000;
const WINS_PER_EGG = 7;
const LEVELS = [null,
  { name: "Bébé Bourrin", income: 3 },
  { name: "Le Paumé", income: 7 },
  { name: "Le Balourd", income: 16 },
  { name: "Le Cogneur", income: 40 },
  { name: "Le Titan", income: 100 },
  { name: "Le Quadri-Poings", income: 430 }
];
const MAX_FIGHTER_LEVEL = LEVELS.length - 1;
const EQUIPMENT = [
  { id: "gants", label: "Gants", icon: "🥊" },
  { id: "bandeau", label: "Bandeau", icon: "🎗️" },
  { id: "short", label: "Short", icon: "🩳" },
  { id: "chaussures", label: "Chaussures", icon: "👟" }
];
const now = () => Date.now();
const format = n => Math.floor(n).toLocaleString("fr-FR");
// Bébé Bourrin est une nouvelle illustration ; les quatre dessins originaux
// sont décalés d'un stade. Le niveau 6 conserve son effet visuel provisoire.
const imageFor = level => `./assets/boxeur-${Math.min(level, MAX_FIGHTER_LEVEL)}.png`;
const evolutionClass = level => level === 6 ? ' evolution-6' : '';
function evolutionDecoration(level) {
  if (level === 6) return '<span class="evolution-emblem evolution-six" aria-hidden="true"><span>🥊</span><span>🥊</span></span>';
  return '';
}
const getNewId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function freshSave() {
  return {
    coins: 600,
    studioLevel: 1,
    lastTick: now(),
    equipment: Object.fromEntries(EQUIPMENT.map(x => [x.id, 0])),
    fighters: [{ id: getNewId(), level: 1 }],
    sessions: 0,
    gems: GEM_START,
    combatWins: 0,
    pendingCombatEggs: 0,
    gymCompanionId: null,
    eggs: [],
    shinyAlbum: {},
    schemaVersion: 12,
    devMode: false
  };
}
function loadSave() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem("bastontv-save-v01"));
    if (value && typeof value.coins === "number" && Array.isArray(value.fighters) && value.equipment && value.studioLevel) return value;
  } catch (_) { /* stockage désactivé ou ancienne sauvegarde invalide */ }
  return freshSave();
}
let game = loadSave();
// Migration unique : on garde l'apparence des anciennes recrues.
// v0.11 : Paumé(1)→2, Balourd(2)→3, Cogneur(3)→4, Titan(4)→5 ;
// le Mastodonte provisoire(5) garde le stade 5 et Quadri-Poings(6) reste 6.
if ((game.schemaVersion || 0) < 12) {
  const previousToNew = [0, 2, 3, 4, 5, 5, 6];
  game.fighters.forEach(f => { f.level = previousToNew[f.level] || 1; });
  if (game.shinyAlbum && typeof game.shinyAlbum === 'object') {
    const migratedAlbum = {};
    Object.entries(game.shinyAlbum).forEach(([level, found]) => {
      if (found) migratedAlbum[previousToNew[Number(level)] || 1] = true;
    });
    game.shinyAlbum = migratedAlbum;
  }
  if (Array.isArray(game.eggs)) {
    game.eggs.forEach(e => { if (e.level) e.level = previousToNew[e.level] || 1; });
  }
  game.schemaVersion = 12;
}
game.fighters.forEach(f => { f.shiny = Boolean(f.shiny); });
if (typeof game.devMode !== 'boolean') game.devMode = false;
if (!Array.isArray(game.eggs)) game.eggs = [];
if (!Number.isFinite(game.sessions) || game.sessions < 0) game.sessions = 0;
if (typeof game.lastDailyEgg !== 'string') game.lastDailyEgg = '';
if (!Number.isFinite(game.gems) || game.gems < 0) game.gems = GEM_START;
if (!Number.isFinite(game.combatWins) || game.combatWins < 0) game.combatWins = 0;
if (!Number.isFinite(game.pendingCombatEggs) || game.pendingCombatEggs < 0) game.pendingCombatEggs = 0;
if (typeof game.gymCompanionId !== 'string') game.gymCompanionId = null;
if (!game.shinyAlbum || typeof game.shinyAlbum !== 'object') game.shinyAlbum = {};
for (const f of game.fighters) if (f.shiny) game.shinyAlbum[f.level] = true;
let currentView = "home";
let training = null;
let latestReward = null;
let duel = null; // Combat d’animation simple, non sauvegardé
let toastTimeout = null;

// Sons proceduraux : aucun MP3 à installer et aucune requête réseau.
// Le navigateur autorise les sons après une interaction de l'utilisateur.
const SOUND_KEY = "bastontv-sound-enabled";
const AUDIO_SETTINGS_KEY = "bastontv-audio-v012";
const REDEEMED_CODES_KEY = "bastontv-used-codes-v012";
let soundEnabled = (() => { try { return localStorage.getItem(SOUND_KEY) !== "false"; } catch (_) { return true; } })();
function getSavedAudioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || '{}');
    return {
      menus: Number.isFinite(saved.menus) ? Math.max(0,Math.min(100,saved.menus)) : 70,
      effects: Number.isFinite(saved.effects) ? Math.max(0,Math.min(100,saved.effects)) : 85,
      music: Number.isFinite(saved.music) ? Math.max(0,Math.min(100,saved.music)) : 50
    };
  } catch (_) { return {menus:70,effects:85,music:50}; }
}
let audioSettings = getSavedAudioSettings();
let audioCtx = null;
let sfxGain = null;
let redeemedCodes = (()=>{try{return JSON.parse(localStorage.getItem(REDEEMED_CODES_KEY)||'[]')}catch(_){return []}})();
if (!Array.isArray(redeemedCodes)) redeemedCodes=[];
let noiseBuffer = null;

// Sons d'impact courts enregistrés en fichiers audio (synthèse percussive).
// Plus de petites mélodies électroniques pour simuler les coups : on utilise
// un claquement aigu et un bruit sourd très court, légèrement différents.
const SOUND_FILES = {
  ui: './assets/audio/clic.wav',
  confirm: './assets/audio/confirmation.wav',
  bag: './assets/audio/sac-frappe.wav',
  jab: './assets/audio/coup-rapide.wav',
  uppercut: './assets/audio/uppercut.wav',
  enemy: './assets/audio/riposte.wav'
};
const SAMPLE_VOLUMES = {ui:.20, confirm:.28, bag:.62, jab:.68, uppercut:.74, enemy:.58};
const soundPool = new Map();
for (const [kind, file] of Object.entries(SOUND_FILES)) {
  const clips = Array.from({length:3}, () => {
    const a = new Audio(file);
    a.preload = 'auto';
    return a;
  });
  soundPool.set(kind,{clips,next:0});
}
function playSample(kind) {
  if (!soundEnabled || document.hidden) return true;
  const pool = soundPool.get(kind);
  if (!pool) return false;
  const clip = pool.clips[pool.next++ % pool.clips.length];
  try {
    clip.pause();
    clip.currentTime = 0;
    clip.volume = Math.min(1,(SAMPLE_VOLUMES[kind] ?? .5) * (kind==='ui'||kind==='confirm' ? audioSettings.menus : audioSettings.effects)/100);
    const played = clip.play();
    if (played && played.catch) played.catch(() => {});
  } catch (_) { /* Son non pris en charge : le jeu continue sans audio. */ }
  return true;
}

// Ambiance de foule volontairement désactivée : le son synthétique précédent
// faisait trop "horreur". Dès que tu fourniras foule.mp3, on pourra l'ajouter.
function unlockSounds() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}
function syncCrowdAudio() { /* Pas d'ambiance tant qu'un vrai son de tribune n'a pas été choisi. */ }
function stopCrowdNow() { /* Pas de lecture en cours. */ }

function getAudioContext() {
  if (!soundEnabled) return null;
  const AudioApi = window.AudioContext || window.webkitAudioContext;
  if (!AudioApi) return null;
  try {
    if (!audioCtx) {
      audioCtx = new AudioApi();
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = audioSettings.effects / 100;
      sfxGain.connect(audioCtx.destination);
      // Petit bruit synthétique à bande large pour les impacts de gant.
      noiseBuffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * .24), audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch (_) { return null; }
}
function soundTone(ctx, t, a, b, duration, level, wave="triangle") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(Math.max(a, 1), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(b, 1), t + duration);
  gain.gain.setValueAtTime(.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(.001, level), t + .009);
  gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
  osc.connect(gain).connect(sfxGain || ctx.destination);
  osc.start(t); osc.stop(t + duration + .012);
}
function soundNoise(ctx, t, duration, level, cutoff) {
  if (!noiseBuffer) return;
  const src = ctx.createBufferSource(); src.buffer=noiseBuffer;
  const filter = ctx.createBiquadFilter(); filter.type="lowpass"; filter.frequency.value=cutoff;
  const gain=ctx.createGain();
  gain.gain.setValueAtTime(Math.max(.001,level), t);
  gain.gain.exponentialRampToValueAtTime(.0001, t+duration);
  src.connect(filter).connect(gain).connect(sfxGain || ctx.destination);
  src.start(t); src.stop(t+duration);
}
function playSound(kind) {
  if (!soundEnabled) return;
  if (playSample(kind)) return;
  const ctx = getAudioContext(); if (!ctx) return;
  const t=ctx.currentTime + .01;
  if (kind === "bag") {
    soundNoise(ctx,t,.12,.16,950);
    soundTone(ctx,t,145,65,.14,.17);
    soundTone(ctx,t+.025,320,110,.07,.025);
  } else if (kind === "jab") {
    soundNoise(ctx,t,.09,.12,1150);
    soundTone(ctx,t,195,85,.10,.16);
  } else if (kind === "uppercut") {
    soundNoise(ctx,t,.19,.21,800);
    soundTone(ctx,t,125,42,.22,.23,"sawtooth");
    soundTone(ctx,t+.045,275,65,.15,.08);
  } else if (kind === "enemy") {
    soundNoise(ctx,t,.11,.12,630);
    soundTone(ctx,t,130,70,.13,.13);
  } else if (kind === "miss") {
    soundTone(ctx,t,280,175,.14,.055,"square");
  } else if (kind === "combo") {
    soundTone(ctx,t,520,780,.08,.045,"sine");
    soundTone(ctx,t+.09,660,1060,.10,.045,"sine");
  } else if (kind === "win") {
    [440,554,659,880].forEach((hz,i) => soundTone(ctx,t+i*.115,hz,hz*1.02,.19,.09,"sine"));
  } else if (kind === "lose") {
    soundTone(ctx,t,320,105,.35,.12);
  } else if (kind === "recruit") {
    [480,650,940].forEach((hz,i) => soundTone(ctx,t+i*.075,hz,hz*1.05,.15,.075,"sine"));
  }
}
function refreshSoundButton() {
  const button=document.getElementById("sound-toggle");
  if (!button) return;
  button.textContent=soundEnabled ? "🔊" : "🔇";
  button.setAttribute("aria-pressed", String(soundEnabled));
  button.setAttribute("aria-label", soundEnabled ? "Couper les sons" : "Activer les sons");
  button.title=soundEnabled ? "Couper les sons" : "Activer les sons";
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem(SOUND_KEY,String(soundEnabled)); } catch (_) {}
  if (soundEnabled) {
    unlockSounds();
    playSound('confirm');
  } else {
    stopCrowdNow();
  }
  refreshSoundButton();
  syncCrowdAudio();
}
// Éclairs et bandes dessinées qui renforcent chaque impact.
function impactEffect(container, label="POW!", side="right", heavy=false) {
  if (!container) return;
  const fx=document.createElement("span");
  fx.className="impact-fx" + (heavy ? " impact-heavy" : "");
  fx.textContent=label;
  fx.style.left=side === "right" ? "67%" : "26%";
  fx.style.top=heavy ? "33%" : "45%";
  container.appendChild(fx);
  container.classList.remove("arena-shake");
  void container.offsetWidth;
  container.classList.add("arena-shake");
  setTimeout(() => {fx.remove();container.classList.remove("arena-shake");},560);
}


function shinyBonusPercent() {
  return Object.values(game.shinyAlbum).filter(Boolean).length;
}
function localDayKey() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
function eggState(egg, at=now()) {
  if (!egg.startedAt) return 'stock';
  const elapsed = at - egg.startedAt;
  if (elapsed >= (egg.shiny ? EGG_SHINY_MS : EGG_NORMAL_MS)) return 'ready';
  if (egg.shiny && elapsed >= EGG_NORMAL_MS) return 'glowing';
  return 'incubating';
}
function eggTimeLeft(egg, at=now()) {
  if (!egg.startedAt) return 0;
  return Math.max(0, egg.startedAt + (egg.shiny ? EGG_SHINY_MS : EGG_NORMAL_MS) - at);
}
function readableDuration(ms) {
  const seconds=Math.ceil(ms/1000);
  const h=Math.floor(seconds/3600), m=Math.floor((seconds%3600)/60), sec=seconds%60;
  return h ? `${h} h ${String(m).padStart(2,'0')} min` : `${m} min ${String(sec).padStart(2,'0')} s`;
}
// La progression reste possible même avec peu de pièces :
// +20 pièces toutes les 3 séances réalisées, +30 par stade au-dessus de 2.
function trainingCost() {
  const best = Math.max(1, ...game.fighters.map(f => f.level));
  const rounds = Math.floor(game.sessions / TRAINING_INCREASE_EVERY);
  return Math.min(3500, BASE_TRAINING_COST + TRAINING_INCREASE_AMOUNT * rounds + 30 * Math.max(0, best - 2));
}
function incomePerMinute() {
  const twoBest = [...game.fighters].sort((a, b) => b.level - a.level).slice(0, 2);
  const basic = twoBest.reduce((sum, fighter) => sum + LEVELS[fighter.level].income, 0);
  return basic * (1 + .25 * (game.studioLevel - 1)) * (1 + shinyBonusPercent() / 100);
}
function advanceCoins() {
  const time = now();
  const elapsed = Math.min(OFFLINE_CAP_MS, Math.max(0, time - (game.lastTick || time)));
  const earned = incomePerMinute() * elapsed / 60_000;
  game.coins += earned;
  game.lastTick = time;
  return earned;
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }
  catch (_) { showToast("Sauvegarde locale indisponible sur ce navigateur."); }
}
function showToast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove("visible"), 3300);
}
function strongestFighters() {
  return [...game.fighters].sort((a, b) => b.level - a.level || Number(b.shiny)-Number(a.shiny)).slice(0, 2);
}
// Un choix indépendant des combattants diffusés : seul le visuel de l'entraînement change.
function gymCompanion() {
  const selected = game.fighters.find(f => f.id === game.gymCompanionId);
  if (selected) return selected;
  const fallback = strongestFighters()[0] || game.fighters[0] || null;
  game.gymCompanionId = fallback?.id || null;
  return fallback;
}
function chooseGymCompanion(id) {
  if (training) return;
  const fighter = game.fighters.find(f => f.id === id);
  if (!fighter) return;
  game.gymCompanionId = fighter.id;
  save(); render();
  showToast(`${fighter.shiny?'✨ ':''}${LEVELS[fighter.level].name} t'accompagnera à l'entraînement !`);
}
function gymCompanionHtml(fighter) {
  if (!fighter) return '';
  return `<div class="gym-companion-actor ${fighter.shiny?'shiny-actor':''}${evolutionClass(fighter.level)}" aria-label="${LEVELS[fighter.level].name}${fighter.shiny?' shiny':''} t'accompagne">
    <img class="gym-boxer breathing" id="gym-boxer" src="${imageFor(fighter.level)}" alt="${LEVELS[fighter.level].name}${fighter.shiny?' shiny':''}">${evolutionDecoration(fighter.level)}
  </div>`;
}
function gymRosterHtml(companion) {
  return `<section class="card gym-choice-panel"><h2>🥊 Choisir mon accompagnateur</h2>
      <p class="muted">Choisis librement un boxeur, même shiny ou niveau 1. Cela ne modifie ni ses statistiques ni les revenus TV.</p>
      <div class="gym-roster" role="group" aria-label="Choix du boxeur pour l'entraînement">${game.fighters.map(f=>`
        <button class="gym-roster-fighter ${companion?.id===f.id?'is-selected':''} ${f.shiny?'shiny-fighter':''}${evolutionClass(f.level)}" type="button" data-action="choose-companion" data-fighter-id="${f.id}"
          aria-pressed="${String(companion?.id===f.id)}" aria-label="Choisir ${LEVELS[f.level].name}, évolution ${f.level}${f.shiny?', shiny':''}">
          <img src="${imageFor(f.level)}" alt="">${evolutionDecoration(f.level)}<strong>${f.shiny?'✨ ':''}${LEVELS[f.level].name}</strong><small>Niv. ${f.level}</small>
          <span class="gym-roster-check">${companion?.id===f.id?'✓ Sélectionné':'Choisir'}</span>
        </button>`).join('')}</div>
    </section>`;
}


// Le compteur simule une audience en direct. Il varie légèrement sans changer les revenus.
let viewerShift = 0;
let viewerDelta = 0;
function baseAudience() {
  return 160 + game.studioLevel * 38 + strongestFighters().reduce((sum, fighter) => sum + fighter.level * 115, 0);
}
function currentAudience() { return Math.max(0, baseAudience() + viewerShift); }
function tickAudience() {
  const maximum = Math.max(5, Math.round(baseAudience() * .035));
  const previous = viewerShift;
  viewerShift = Math.min(maximum, Math.max(-maximum, viewerShift + Math.floor(Math.random() * 11) - 5));
  viewerDelta = viewerShift - previous;
  const label = document.getElementById('viewers-live');
  const change = document.getElementById('viewers-change');
  if (label) label.textContent = format(currentAudience());
  if (change) { change.textContent = viewerDelta > 0 ? `▲ +${viewerDelta}` : viewerDelta < 0 ? `▼ ${viewerDelta}` : '• 0'; change.className = 'viewers-change ' + (viewerDelta >= 0 ? 'up' : 'down'); }
}

function fighterTile(fighter) {
  const info = LEVELS[fighter.level];
  return `<div class="fighter-card"><img src="${imageFor(fighter.level)}" alt="${info.name}"><b>${info.name}</b><small>Évolution ${fighter.level} · +${info.income} pièces/min</small></div>`;
}
function homeScreen() {
  const onAir = strongestFighters();
  const nextCost = 200 * Math.pow(2, game.studioLevel - 1);
  return `
    <span class="kicker">📡 Les chaînes TV</span><h1 class="h1">Bienvenue au studio !</h1>
    <p class="muted">Ta chaîne rapporte des pièces automatiquement. Les deux meilleurs boxeurs passent à l'antenne.</p>
    <div class="tv-stage" aria-label="Boxe TV en direct">
      <span class="live-label">● EN DIRECT</span>
      <div class="viewers-live" aria-label="Audience simulée en direct">👥 <b id="viewers-live">${format(currentAudience())}</b> <small id="viewers-change" class="viewers-change up">• 0</small></div><div class="stage-logo">BASTON <span>TV</span></div>
      <div class="on-air">${onAir.map(f => `<div class="fighter-onair ${f.shiny?'shiny-fighter':''}${evolutionClass(f.level)}"><img class="breathing" src="${imageFor(f.level)}" alt="${LEVELS[f.level].name}${f.shiny?' shiny':''}">${evolutionDecoration(f.level)}<strong>${f.shiny?'✨ ':''}${LEVELS[f.level].name}</strong></div>`).join("")}
      ${onAir.length < 2 ? '<div class="empty-slot">Place libre</div>' : ''}</div>
    </div>
    <div class="stat-grid"><div class="stat"><small>📈 Revenus TV</small><b id="rate-live">+${format(incomePerMinute())}/min</b><small>En jeu et hors ligne (8 h max.)</small></div>
    <div class="stat"><small>🎬 Niveau du studio</small><b>${game.studioLevel}</b><small>Bonus : +${25 * (game.studioLevel - 1)} %</small></div></div>
    <div class="tv-shiny-caption">✨ Découvertes shiny : ${shinyBonusPercent()} / ${MAX_FIGHTER_LEVEL} · Bonus permanent : +${shinyBonusPercent()} % aux revenus TV</div>
    <button type="button" class="action secondary" data-action="go-gym">🥊 Aller s'entraîner</button>
    <button type="button" class="action pink" data-action="go-combat">⚔️ Essayer le combat animé !</button>
    <section class="card"><h2>🔧 Améliorer le studio</h2><p class="muted">Augmente de 25 % les revenus de tes émissions. Les nouvelles évolutions rapportent encore plus.</p>
    <div class="price"><span>Coût du prochain niveau</span><span>🪙 ${format(nextCost)}</span></div>
    <button class="action" type="button" data-action="upgrade" ${game.studioLevel >= 5 || Math.floor(game.coins) < nextCost ? "disabled" : ""}>${game.studioLevel >= 5 ? "Niveau maximal du prototype" : "Améliorer (+25 %)"}</button></section>
    <div class="tip"><strong>💡 Astuce :</strong> deux Bébés Bourrins rapportent 6 pièces/min. En les fusionnant, un Paumé rapporte 7 pièces/min : pense à occuper les deux places TV pour maximiser tes revenus !</div>
    <section class="card evolution-roadmap"><h2>🥊 Évolutions des Bourrins</h2>
      <p class="muted">Six stades à débloquer. Pour fabriquer un niveau 6 uniquement avec des recrues niveau 1, il en faut <b>32</b> !</p>
      <div class="evolution-roadmap-grid">${LEVELS.slice(1).map((info,index) => {
        const level=index+1, unlocked=game.fighters.some(f=>f.level>=level);
        return `<div class="roadmap-step ${unlocked?'roadmap-unlocked':''}"><small>Stade ${level}</small><strong>${unlocked?'✓ ':'🔒 '}${info.name}</strong><span>+${info.income} 🪙/min</span></div>`;
      }).join('')}</div>
      <p class="subnote">Le bébé est un nouveau dessin ; le niveau 6 utilise encore une silhouette provisoire et des gants supplémentaires.</p>
    </section>
    <section class="install-panel" id="install-panel"><h2>📱 Baston TV sur ton téléphone</h2>
      <p>Installe le jeu depuis ton navigateur pour le retrouver sur ton écran d’accueil.</p>
      <button class="action secondary" type="button" data-action="install-app" id="install-app-button">📲 Installer Baston TV</button></section>`;
}
function gymScreen() {
  const companion = gymCompanion();
  if (training) return `<span class="kicker">🥊 Entraînement en cours</span><h1 class="h1">Frappe les points faibles !</h1>
    <div class="train-stat"><span>⏱ <span id="training-timer">20,0</span> s</span><span>⭐ <span id="training-hits">0</span> touches</span><span>🔥 <span id="training-combo">0</span></span><span>❌ <span id="training-misses">0</span></span></div>
    <div class="progress"><span id="training-progress" style="width:100%"></span></div>
    <div class="bag-arena" id="bag-arena" style="margin-top:12px"><span class="gym-status" id="gym-status">Vise la cible !</span><div class="bag-cable"></div>${gymCompanionHtml(training.companion || companion)}<div class="bag" id="bag"><button class="spot" id="spot" data-action="hit" aria-label="Frapper le point faible" style="left:50%;top:45%"></button></div></div>
    <p class="muted">Le point faible change de place. Si tu rates ou si tu cliques à côté, tu perds du temps !</p>
    <p class="subnote">⏳ Cible expirée : −0,7 s · Mauvais clic : −0,5 s · 5 touches de suite = bonus</p>`;
  const result = latestReward ? `<section class="card"><h2>🎁 Dernière séance</h2><p class="muted">${latestReward.hits} point(s) touché(s) · meilleur combo : ${latestReward.best} · erreurs : ${latestReward.misses}</p><div class="reward-list">${latestReward.items.length?latestReward.items.map(id => `<span class="reward-bubble">${EQUIPMENT.find(x => x.id === id).icon} ${EQUIPMENT.find(x => x.id === id).label}</span>`).join(""):'<span class="reward-empty">Aucun équipement cette fois. Tu feras mieux au prochain essai !</span>'}</div></section>` : "";
  return `<span class="kicker">🎯 Les coulisses</span><h1 class="h1">Salle d'entraînement</h1>
    <p class="muted">Les points faibles sont plus espacés. Il faut être rapide et précis : les erreurs te font perdre du temps.</p>
    <div class="bag-arena"><div class="bag-cable"></div>${gymCompanionHtml(companion)}<div class="bag"><div class="spot" style="left:49%;top:34%;pointer-events:none"></div></div></div>
    ${gymRosterHtml(companion)}
    <div class="stat-grid"><div class="stat"><small>⏱ Durée</small><b>20 s</b></div><div class="stat"><small>🪙 Prix actuel</small><b>${format(trainingCost())}</b></div></div>
    <p class="subnote">Le prix augmente de 20 pièces toutes les 3 séances, puis de 30 pièces supplémentaires à chaque nouvelle évolution au-delà du niveau 2.</p>
    <button class="action" type="button" data-action="start-training" ${Math.floor(game.coins) < trainingCost() ? "disabled" : ""}>🥊 Commencer la séance · ${format(trainingCost())} 🪙</button>
    ${Math.floor(game.coins) < trainingCost() ? '<p class="subnote">Pas assez de pièces. Laisse ta chaîne en produire un peu, puis reviens !</p>' : ''}
    ${result}
    <div class="tip"><strong>Récompenses :</strong> 0 équipement pour un score très faible ; sinon 1 à 2. Tu peux gagner jusqu'à 4 équipements si tu réalises un excellent combo <b>sans aucune faute</b>. Chaque faute retire du temps et brise le combo.</div>`;
}
function lockerCharacter(fighter, index, onAir=false) {
  const level = fighter.level;
  const x = 17 + (index % 3) * 33;
  const floor = 22 + Math.floor(index / 3) * 155;
  const delay = ((index * 73) % 17) / 10;
  const duration = 3.2 + (index % 4) * .45;
  return `<div class="locker-fighter ${onAir ? 'locker-on-air' : 'locker-wander'}" data-fighter-id="${fighter.id}" data-fighter-level="${level}" data-fighter-shiny="${fighter.shiny?'true':'false'}" tabindex="0" role="button" aria-label="${LEVELS[level].name} niveau ${level}${fighter.shiny?' shiny':''}. Glisse sur un autre combattant du même niveau et de la même rareté pour fusionner" style="--lx:${x}%;--floor-bottom:${floor}px;--delay:-${delay}s;--distance:${6+(index%4)*4}px;--duration:${duration}s">
    <div class="locker-character ${fighter.shiny?'is-shiny':''}${evolutionClass(level)}"><img src="${imageFor(level)}" draggable="false" alt="">${evolutionDecoration(level)}<span class="locker-level">${fighter.shiny?'✨ ':''}Niv. ${level}</span></div>
    <span class="locker-name">${fighter.shiny?'✨ ':''}${LEVELS[level].name}</span></div>`;
}
function collectionScreen() {
  const ready=EQUIPMENT.every(item=>game.equipment[item.id]>0);
  const onAir=strongestFighters();
  const assigned=new Set(onAir.map(f=>f.id));
  const others=game.fighters.filter(f=>!assigned.has(f.id));
  const display=others.slice(0,16);
  const rows=Math.max(1,Math.ceil(display.length/3));
  const rest=others.length-display.length;
  return `<span class="kicker">🧤 Les coulisses</span><h1 class="h1">Les vestiaires</h1>
    <p class="muted">Les boxeurs se promènent dans le vestiaire. <b>Glisse deux combattants du même niveau et de la même rareté l'un sur l'autre pour fusionner.</b> Maintenant jusqu'au stade ${MAX_FIGHTER_LEVEL} !</p>
    <section class="card locker-panel"><h2>📡 Sur le plateau TV</h2><p class="subnote">Ces deux vedettes restent immobiles, mais tu peux aussi les attraper pour fusionner.</p>
      <div class="locker-onair-strip">${onAir.map((f,i)=>lockerCharacter(f,i,true)).join('')}${onAir.length<2?'<span class="locker-air-empty">Emplacement libre</span>':''}</div></section>
    <section class="card locker-panel"><div class="locker-heading"><h2>🏠 Dans les coulisses (${others.length})</h2><span class="locker-help">☝️ Glisser pour fusionner</span></div>
      <div class="locker-room" id="locker-room" style="--locker-height:${Math.max(305,rows*155+130)}px">
        <div class="locker-poster">BASTON TV ★ CLUB</div><div class="locker-bench"></div>
        ${Array.from({length:rows},(_,i)=>`<div class="locker-floor" style="bottom:${15+i*155}px"></div>`).join('')}
        ${display.map((f,i)=>lockerCharacter(f,i)).join('')}
        ${!others.length?'<p class="locker-empty">Tous tes boxeurs sont à l’antenne ! Tu peux quand même les fusionner en les faisant glisser l’un sur l’autre ci-dessus.</p>':''}
      </div>${rest>0?`<p class="subnote">${rest} autre(s) combattant(s) en réserve. Les 16 premiers sont affichés.</p>`:''}
      <p class="subnote" id="locker-instruction">Normal + normal → normal · Shiny + shiny → shiny. Les mélanges sont impossibles.</p></section>
    <section class="card"><h2>🎁 Équipements de boxe</h2><div class="eq-grid">${EQUIPMENT.map(item => `<div class="eq-item ${game.equipment[item.id] > 0 ? 'ready' : ''}"><span>${item.icon} ${item.label}</span><b>×${game.equipment[item.id]}</b></div>`).join('')}</div>
    <button class="action" type="button" data-action="recruit" ${ready ? '' : 'disabled'}>✨ Recruter un Bébé Bourrin</button><p class="subnote">Consomme un exemplaire de chacun des quatre équipements.</p></section>`;
}

// Fusion au glisser-déposer, compatible avec la souris ET le tactile.
let lockerDrag = null;
let lockerSelection = null;
function fighterById(id) { return game.fighters.find(f=>f.id===id); }
function clearLockerSelection() { lockerSelection=null; document.querySelectorAll('.locker-fighter.selected-for-fusion').forEach(e=>e.classList.remove('selected-for-fusion')); }
function fuseFighters(firstId, secondId) {
  if (!firstId || !secondId || firstId===secondId) return false;
  const a=fighterById(firstId), b=fighterById(secondId);
  if (!a || !b || a.level!==b.level || Boolean(a.shiny)!==Boolean(b.shiny) || a.level>=MAX_FIGHTER_LEVEL) return false;
  const newLevel=a.level+1;
  const companionWasUsed = game.gymCompanionId===a.id || game.gymCompanionId===b.id;
  const fused = {id:getNewId(),level:newLevel,shiny:Boolean(a.shiny)};
  game.fighters=game.fighters.filter(f=>f.id!==a.id && f.id!==b.id);
  game.fighters.push(fused);
  if (companionWasUsed) game.gymCompanionId=fused.id;
  if (a.shiny) game.shinyAlbum[newLevel]=true;
  clearLockerSelection();
  playSound('combo'); save(); render();
  showToast(`✨ Fusion ! ${LEVELS[newLevel].name}${a.shiny?' shiny':''} obtenu !`);
  const room=document.querySelector('#locker-room');
  if(room){room.classList.add('fusion-flash');setTimeout(()=>room.classList.remove('fusion-flash'),700);}
  return true;
}
function selectLockerFighter(id) {
  if (!fighterById(id)) return;
  if (lockerSelection===id) {clearLockerSelection();return;}
  if (!lockerSelection) {
    lockerSelection=id;
    document.querySelectorAll('.locker-fighter').forEach(el=>el.classList.toggle('selected-for-fusion',el.dataset.fighterId===id));
    showToast('Choisis un deuxième boxeur du même niveau !');
    return;
  }
  if (!fuseFighters(lockerSelection,id)) {
    clearLockerSelection();
    showToast('Fusion : il faut deux boxeurs du même niveau et tous les deux normaux ou shinies.');
  }
}
function updateLockerDrag(ev) {
  if (!lockerDrag) return;
  const d=lockerDrag;
  const dx=ev.clientX-d.startX, dy=ev.clientY-d.startY;
  if (Math.abs(dx)+Math.abs(dy)>8) d.moved=true;
  if (d.ghost) {
    d.ghost.style.left=`${ev.clientX-d.offsetX}px`;
    d.ghost.style.top=`${ev.clientY-d.offsetY}px`;
  }
  document.querySelectorAll('.locker-fighter.drop-ok,.locker-fighter.drop-no').forEach(e=>e.classList.remove('drop-ok','drop-no'));
  const hit=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.locker-fighter');
  if(hit && hit.dataset.fighterId!==d.id) {
    hit.classList.add(Number(hit.dataset.fighterLevel)===d.level && hit.dataset.fighterShiny===d.shiny && d.level<MAX_FIGHTER_LEVEL?'drop-ok':'drop-no');
  }
}
function endLockerDrag(ev) {
  if (!lockerDrag) return;
  const d=lockerDrag;lockerDrag=null;
  d.el.classList.remove('drag-source');
  d.ghost?.remove();
  document.querySelectorAll('.locker-fighter.drop-ok,.locker-fighter.drop-no').forEach(e=>e.classList.remove('drop-ok','drop-no'));
  const target=ev.type==='pointercancel'?null:document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.locker-fighter');
  if (!d.moved) {selectLockerFighter(d.id); return;}
  if (target && target.dataset.fighterId!==d.id && fuseFighters(d.id,target.dataset.fighterId)) return;
  showToast('Dépose-le sur un boxeur du même niveau et de la même rareté (normal/shiny).');
}
document.addEventListener('pointerdown',ev=>{
  if(currentView!=='collection' || ev.button!==0 || lockerDrag) return;
  const el=ev.target.closest('.locker-fighter');
  if(!el || !fighterById(el.dataset.fighterId))return;
  ev.preventDefault();
  const rect=el.getBoundingClientRect();
  const ghost=el.cloneNode(true);
  ghost.className='locker-fighter locker-drag-ghost';
  ghost.removeAttribute('data-fighter-id');
  ghost.removeAttribute('tabindex');
  ghost.style.width=`${rect.width}px`;ghost.style.height=`${rect.height}px`;
  document.body.appendChild(ghost);
  lockerDrag={id:el.dataset.fighterId,level:Number(el.dataset.fighterLevel),shiny:el.dataset.fighterShiny,el,ghost,
    startX:ev.clientX,startY:ev.clientY,offsetX:ev.clientX-rect.left,offsetY:ev.clientY-rect.top,moved:false};
  el.classList.add('drag-source');
  updateLockerDrag(ev);
});
window.addEventListener('pointermove',ev=>{if(lockerDrag){ev.preventDefault();updateLockerDrag(ev)}},{passive:false});
window.addEventListener('pointerup',endLockerDrag);
window.addEventListener('pointercancel',endLockerDrag);
document.addEventListener('keydown',ev=>{
  const item=ev.target.closest('.locker-fighter');
  if(item && (ev.key==='Enter'||ev.key===' ')) {ev.preventDefault(); selectLockerFighter(item.dataset.fighterId);}
});
// Première version jouable de l'incubateur. Les gemmes et les récompenses de
// championnat arriveront en v0.9 ; le bouton test évite d'attendre des heures.
function eggSlotHtml(egg) {
  const state=eggState(egg);
  const revealed=state==='glowing' || (state==='ready' && egg.shiny);
  const name=state==='stock'?'En attente':state==='incubating'?'Incubation...':state==='glowing'?'✨ SHINY !':'Prêt à ouvrir !';
  const badge=state==='stock'?'📦':revealed?'🌟':state==='ready'?'🎉':'⏳';
  return `<div class="egg-slot ${revealed?'egg-shiny':''} ${state==='ready'?'egg-ready':''}">
    <div class="egg-visual ${revealed?'egg-glowing':''}" aria-hidden="true">🥚</div>
    <strong>${badge} ${name}</strong>
    ${state==='incubating'||state==='glowing'?`<small class="egg-countdown">${readableDuration(eggTimeLeft(egg))}</small>`:''}
    ${state==='stock'?`<button class="egg-button" data-action="incubate" data-egg-id="${egg.id}">Incuber</button>`:''}
    ${state==='ready'?`<button class="egg-button" data-action="hatch" data-egg-id="${egg.id}">Ouvrir l'œuf</button>`:''}
    ${state==='incubating'||state==='glowing'?`<button class="egg-button egg-gems-button" data-action="gem-egg" data-egg-id="${egg.id}" ${game.gems<GEM_ACCEL_COST?'disabled':''}>💎 ${GEM_ACCEL_COST} gemmes · −30 min</button>
    ${game.devMode?`<button class="egg-test-button" data-action="test-egg" data-egg-id="${egg.id}">⏩ Accélérer (test)</button>`:''}`:''}
  </div>`;
}
function laterScreen() {
  const shinyEntries=Array.from({length:MAX_FIGHTER_LEVEL},(_,i)=>i+1).map(level=>`<div class="album-entry ${game.shinyAlbum[level]?'unlocked':''}">${game.shinyAlbum[level]?'✨':'🔒'}<small>Niv. ${level}</small></div>`).join('');
  return `<span class="kicker">🥚 Les coulisses</span><h1 class="h1">Incubateur</h1>
    <p class="muted">Les œufs proviennent désormais des victoires : aucun œuf quotidien gratuit. Après 30 minutes, un œuf shiny commence à briller ; il éclot au bout de 2 heures.</p>
    <section class="card"><h2>🏆 Gagner des œufs</h2>
      <p class="muted">Tous les <b>${WINS_PER_EGG} duels remportés</b> : un œuf à récupérer. Victoires totales : <b>${game.combatWins}</b> · Encore <b>${WINS_PER_EGG-(game.combatWins%WINS_PER_EGG)}</b> victoire(s) avant le prochain.</p>
      <p class="muted">Récompenses disponibles : <b>${game.pendingCombatEggs}</b> · Stock : <b>${game.eggs.length}/${EGG_CAP}</b> œufs.</p>
      <button class="action secondary" data-action="claim-combat-egg" ${game.pendingCombatEggs>0 && game.eggs.length<EGG_CAP?'':'disabled'}>🥚 Récupérer un œuf de combat</button>
    </section>
    <section class="card"><h2>🔮 Mes œufs</h2>
      <div class="gem-caption">💎 Gemmes : <b>${format(game.gems)}</b> · Accélération de 30 min : <b>${GEM_ACCEL_COST} gemmes</b></div>
      <div class="egg-header"><span>Œufs stockés : <b>${game.eggs.length}/${EGG_CAP}</b></span><span>Chance shiny : <b>30 %</b></span></div>
      <div class="egg-grid">${game.eggs.map(eggSlotHtml).join('')}${Array.from({length:Math.max(0,EGG_CAP-game.eggs.length)},()=>'<div class="egg-slot egg-empty"><span>＋</span><small>Emplacement libre</small></div>').join('')}</div>
      ${!game.eggs.length?'<p class="subnote">Gagne sept combats pour récupérer ton premier œuf.</p>':''}
      <p class="subnote">Les gemmes réduisent l'incubation de 30 minutes. Les shinies gardent les mêmes statistiques que les normaux.</p>
    </section>
    <section class="card"><h2>✨ Album shiny — Les Bourrins</h2><div class="shiny-album">${shinyEntries}</div>
      <p class="muted">Chaque nouvelle évolution shiny découverte rapporte <b>+1 % de revenus TV permanents</b>. Bonus actuel : <b>+${shinyBonusPercent()} %</b>.</p>
    </section>
    <div class="tip">Fusion : normal + normal ou shiny + shiny seulement, à niveau égal. Les outils d'œufs de test sont désormais réservés au mode développeur dans les Paramètres.</div>`;
}
function addTestEgg(forceShiny=false) {
  if (!game.devMode) return showToast('Réservé au mode développeur.');
  if (game.eggs.length >= EGG_CAP) return showToast('Stock plein : ouvre un œuf avant d’en ajouter.');
  game.eggs.push({id:getNewId(),startedAt:null,testForcedShiny:Boolean(forceShiny)});
  playSound('confirm'); save(); render();
  showToast(forceShiny ? '✨ Œuf shiny de test ajouté !' : '🥚 Œuf de test ajouté !');
}
function incubateEgg(id) {
  const egg=game.eggs.find(e=>e.id===id);
  if (!egg || egg.startedAt || game.eggs.some(e=>e.startedAt)) return showToast('Un seul œuf peut être dans l’incubateur à la fois. Ouvre le précédent.');
  const shiny=egg.testForcedShiny || Math.random()<SHINY_RATE;
  egg.shiny=shiny;
  egg.level=shiny?(Math.random()<.05?2:1):(Math.random()<.35?2:1);
  egg.startedAt=now();
  save();render();showToast('Incubation lancée !');
}
function hatchEgg(id) {
  const egg=game.eggs.find(e=>e.id===id);
  if (!egg || eggState(egg)!=='ready') return;
  const fighter={id:getNewId(),level:egg.level,shiny:Boolean(egg.shiny)};
  game.fighters.push(fighter);
  if (fighter.shiny) game.shinyAlbum[fighter.level]=true;
  game.eggs=game.eggs.filter(e=>e.id!==id);
  playSound('recruit');save();render();
  showToast(`${fighter.shiny?'✨ SHINY ! ':'🎉 '}${LEVELS[fighter.level].name} niveau ${fighter.level} obtenu !`);
}
function accelerateEggGems(id) {
  const egg=game.eggs.find(e=>e.id===id);
  if (!egg || !egg.startedAt || eggState(egg)==='ready') return;
  if (game.gems < GEM_ACCEL_COST) return showToast('Pas assez de gemmes pour accélérer cet œuf.');
  game.gems -= GEM_ACCEL_COST;
  egg.startedAt -= GEM_ACCEL_MS;
  playSound('confirm'); save();render();
  showToast(eggState(egg)==='glowing'?'🌟 L’œuf se met à briller !':eggState(egg)==='ready'?'🥚 L’œuf est prêt !':'⏩ Incubation avancée de 30 min !');
}
function claimCombatEgg() {
  if (!game.pendingCombatEggs) return;
  if (game.eggs.length >= EGG_CAP) return showToast('Stock plein, récupère ton œuf plus tard.');
  game.pendingCombatEggs--;
  game.eggs.push({id:getNewId(),startedAt:null});
  playSound('confirm');save();render();showToast('🥚 Œuf de victoire récupéré !');
}
function accelerateEggTest(id) {
  if (!game.devMode) return;
  const egg=game.eggs.find(e=>e.id===id);
  if (!egg || !egg.startedAt || eggState(egg)==='ready') return;
  const elapsed=now()-egg.startedAt;
  egg.startedAt=now() - (elapsed < EGG_NORMAL_MS ? EGG_NORMAL_MS+1000 : EGG_SHINY_MS+1000);
  save();render();showToast(eggState(egg)==='glowing'?'🌟 Surprise : cet œuf est shiny !':'🥚 Éclosion prête !');
}
// Première arène de démonstration : un boxeur, deux attaques animées, un adversaire.
// Ce n'est pas encore le vrai championnat 3 contre 3.
function combatScreen() {
  const fighter = strongestFighters()[0];
  const level = duel?.level ?? fighter.level;
  const character = LEVELS[level];
  if (!duel) return `<span class="kicker">🎬 Plateau de tournage</span><h1 class="h1">Premier combat animé</h1>
    <p class="muted">Notre toute première arène ! Deux mouvements : les personnages respirent et se balancent, puis avancent pour frapper. Les adversaires réagissent aux coups.</p>
    <div class="fight-arena fight-preview">
      <div class="ring-glow"></div><div class="ring-floor"></div>
      <div class="fight-actor player-actor ${fighter.shiny?'shiny-actor':''}${evolutionClass(fighter.level)}"><img class="breathing" src="${imageFor(fighter.level)}" alt="${LEVELS[fighter.level].name}">${evolutionDecoration(fighter.level)}</div>
      <div class="fight-actor enemy-actor"><img class="breathing" src="${imageFor(1)}" alt="Bébé Bourrin adverse"></div>
      <span class="ring-versus">VS</span>
    </div>
    <section class="card"><h2>🥊 ${LEVELS[fighter.level].name} contre Bébé Bourrin</h2><p class="muted">Le boxeur le plus évolué de ta collection entre sur le ring. Les dégâts et les points de vie sont simplifiés pour tester les animations.</p><button type="button" data-action="start-duel" class="action">🎬 Lancer le combat !</button></section>
    <div class="tip">Tous les 7 duels gagnés : 1 œuf à récupérer dans l’incubateur. Une victoire sur deux donne aussi 2 gemmes. Les équipes de 3 et les championnats arriveront après.</div>`;
  const end = duel.result !== null;
  return `<span class="kicker">🥊 Boxe TV · Démo de combat</span><h1 class="h1">${end ? duel.result === 'win' ? 'Victoire ! 🎉' : 'Défaite ! 💥' : 'Sur le ring !'}</h1>
    <div class="fight-top">
      <div class="combat-unit"><strong>${character.name}</strong><div class="hpbar"><span id="combat-player-bar" style="width:${100*duel.playerHP/duel.maxPlayerHP}%"></span></div><small id="combat-player-hp">❤️ ${duel.playerHP} / ${duel.maxPlayerHP}</small></div>
      <strong class="versus-label">VS</strong>
      <div class="combat-unit right"><strong>Bébé Bourrin TV</strong><div class="hpbar"><span id="combat-enemy-bar" style="width:${100*duel.enemyHP/duel.maxEnemyHP}%"></span></div><small id="combat-enemy-hp">❤️ ${duel.enemyHP} / ${duel.maxEnemyHP}</small></div>
    </div>
    <div class="fight-arena ${end?'fight-done':''}" id="fight-arena">
      <span class="fight-live">● EN DIRECT</span><div class="ring-glow"></div><div class="ring-floor"></div>
      <div class="fight-actor player-actor ${duel.shiny?'shiny-actor':''}${evolutionClass(level)} ${end && duel.result==='lose'?'knocked-out':''}" id="player-actor"><img class="breathing" src="${imageFor(level)}" alt="${character.name}">${evolutionDecoration(level)}</div>
      <div class="fight-actor enemy-actor ${end && duel.result==='win'?'knocked-out':''}" id="enemy-actor"><img class="breathing" src="${imageFor(1)}" alt="Bébé Bourrin TV adverse"></div>
      ${end ? `<div class="fight-end-overlay ${duel.result}"><strong>${duel.result==='win'?'🏆 VICTOIRE !':'💥 DÉFAITE !'}</strong><span>${duel.result==='win'?'+75 pièces TV':'Reviens plus fort !'}</span></div>` : ''}
    </div>
    <p class="combat-log" id="combat-log" aria-live="polite">${end ? duel.result==='win'?'Tu remportes 75 pièces !':'Tu peux réessayer sans perdre ton boxeur.' : 'Choisis une attaque pour voir ton boxeur bouger.'}</p>
    ${end ? '<button class="action" data-action="start-duel" type="button">🔁 Refaire un combat</button><button class="action secondary" data-action="go-gym" type="button">🥊 Retour à l’entraînement</button>' :
      `<div class="fight-actions"><button type="button" class="action secondary" data-action="punch" data-type="jab" ${duel.busy?'disabled':''}>🥊 Coup rapide</button><button type="button" class="action" data-action="punch" data-type="uppercut" ${duel.busy?'disabled':''}>💥 Uppercut</button></div><p class="subnote">Le coup rapide est moins puissant, l’uppercut inflige davantage de dégâts. L’adversaire réplique après chaque coup.</p>`}
  `;
}
function startDuel() {
  const level = strongestFighters()[0].level;
  const maxPlayerHP = 76 + level * 24;
  duel = {level, shiny:Boolean(strongestFighters()[0].shiny), maxPlayerHP, playerHP:maxPlayerHP, maxEnemyHP:64 + level * 12, enemyHP:64 + level * 12, busy:false, result:null};
  currentView='combat';
  render();
}
function refreshDuelUI() {
  if(!duel || currentView!=='combat') return;
  for (const side of ['player','enemy']) {
    const hp = duel[side+'HP'];
    const max = duel['max'+(side==='player'?'Player':'Enemy')+'HP'];
    const bar = document.getElementById('combat-'+side+'-bar');
    const label = document.getElementById('combat-'+side+'-hp');
    if(bar) bar.style.width = `${100*hp/max}%`;
    if(label) label.textContent = `❤️ ${hp} / ${max}`;
  }
}
function floatingDamage(side, amount) {
  // Le boxeur adverse est retourné en CSS (scaleX(-1)).
  // Le texte doit être dans l'arène pour rester toujours lisible à l'endroit.
  const actor = document.getElementById(side + '-actor');
  const arena = document.getElementById('fight-arena');
  if (!actor || !arena) return;
  const frame = arena.getBoundingClientRect();
  const target = actor.getBoundingClientRect();
  const bubble = document.createElement('span');
  bubble.className = 'floating-damage';
  bubble.textContent = `−${amount}`;
  bubble.style.left = `${target.left - frame.left + target.width * 0.5}px`;
  bubble.style.top = `${Math.max(20, target.top - frame.top + target.height * 0.12)}px`;
  bubble.style.transform = 'translateX(-50%)';
  arena.appendChild(bubble);
  setTimeout(() => bubble.remove(), 850);
}
function finishDuel(result) {
  if(!duel || duel.result) return;
  duel.result=result;
  duel.busy=false;
  if(result==='win') {
    game.coins+=75;
    game.combatWins++;
    if (game.combatWins % WINS_PER_EGG === 0) game.pendingCombatEggs++;
    if (game.combatWins % 2 === 0) game.gems += 2; // prototype : gemmes gagnées une victoire sur deux
    save();
  }
  playSound(result === 'win' ? 'win' : 'lose');
  // Pas de faux cri de foule : on conserve seulement la mélodie de victoire.
  render();
  showToast(result==='win' ? (game.combatWins%WINS_PER_EGG===0?'🏆 +75 pièces et 1 œuf à récupérer !':'🏆 Bravo ! +75 pièces') : '💥 Défaite ! Aucun combattant perdu.');
}
function punch(type) {
  if(!duel || duel.busy || duel.result || currentView!=='combat') return;
  const fight=duel;
  const power=11 + fight.level*6;
  const amount=type==='uppercut'?Math.round(power*1.55):power;
  fight.busy=true;
  document.querySelectorAll('.fight-actions button').forEach(b=>b.disabled=true);
  const player = document.getElementById('player-actor');
  const enemy = document.getElementById('enemy-actor');
  const log = document.getElementById('combat-log');
  if(log) log.textContent=type==='uppercut'?'💥 Uppercut en approche !':'🥊 Coup de poing !';
  if(player) player.classList.add(type==='uppercut'?'uppercut':'jabbing');
  setTimeout(()=>{
    if(duel!==fight || fight.result) return;
    fight.enemyHP=Math.max(0,fight.enemyHP-amount);
    enemy?.classList.add('taking-hit');
    playSound(type === 'uppercut' ? 'uppercut' : 'jab');
    impactEffect(document.getElementById('fight-arena'),type === 'uppercut' ? 'BOUM !' : 'POW !','right',type === 'uppercut');
    floatingDamage('enemy',amount);
    refreshDuelUI();
    if(fight.enemyHP===0){setTimeout(()=>{if(duel===fight) finishDuel('win')},500);return;}
    if(log) log.textContent=`Tu infliges ${amount} dégâts. Attention, l'adversaire riposte !`;
    setTimeout(()=>{
      if(duel!==fight || fight.result) return;
      enemy?.classList.remove('taking-hit');
      enemy?.classList.add('jabbing');
      const retaliation=5+Math.floor(fight.level*2.5);
      setTimeout(()=>{
        if(duel!==fight || fight.result) return;
        fight.playerHP=Math.max(0,fight.playerHP-retaliation);
        player?.classList.add('taking-hit');
        playSound('enemy');
        impactEffect(document.getElementById('fight-arena'),'Paf !','left',false);
        floatingDamage('player',retaliation);
        refreshDuelUI();
        if(fight.playerHP===0){setTimeout(()=>{if(duel===fight) finishDuel('lose')},450);return;}
        if(log)log.textContent=`L'adversaire te rend ${retaliation} dégâts. À toi !`;
        setTimeout(()=>{
          if(duel!==fight || fight.result) return;
          player?.classList.remove('jabbing','uppercut','taking-hit');
          enemy?.classList.remove('jabbing','taking-hit');
          fight.busy=false;
          document.querySelectorAll('.fight-actions button').forEach(b=>b.disabled=false);
        },450);
      },260);
    },400);
  },280);
}

// Paramètres : volumes conservés sur cet appareil. La musique reste
// désactivée pour l'instant, mais son réglage est prêt pour un futur fichier.
function settingsScreen() {
  return `<span class="kicker">⚙️ Baston TV</span><h1 class="h1">Paramètres</h1>
    <section class="card settings-card"><h2>🔊 Réglages audio</h2>
      ${[['menus','🔔 Sons des menus'],['effects','🥊 Effets sonores'],['music','🎵 Musique de fond (à venir)']].map(([key,label])=>`
      <label class="settings-slider" for="audio-${key}"><span>${label}</span><strong id="vol-${key}">${audioSettings[key]} %</strong></label>
      <input class="volume-range" id="audio-${key}" type="range" min="0" max="100" step="5" value="${audioSettings[key]}" data-volume="${key}" aria-label="${label}">
      `).join('')}
      <p class="subnote">La musique n'est pas encore intégrée : son volume est sauvegardé pour plus tard. Le bouton 🔊 en haut coupe tous les sons.</p>
    </section>
    <section class="card settings-card"><h2>🎁 Codes cadeaux</h2>
      <p class="muted">Entre un code puis valide. Chaque code cadeau n'est utilisable qu'une fois sur cet appareil.</p>
      <div class="code-form"><input id="redeem-code" type="text" maxlength="64" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Entrer un code…" aria-label="Code cadeau"><button class="action" type="button" data-action="redeem-code">Valider</button></div>
    </section>
    ${game.devMode?`<section class="card dev-panel"><h2>🧪 Mode développeur activé</h2>
      <p class="muted">Outils de test locaux. Ne pas utiliser pour équilibrer les vraies récompenses.</p>
      <div class="dev-add"><label>🪙 Pièces <input type="number" id="dev-coins" min="1" max="1000000" step="100" value="10000"></label><button type="button" class="action secondary" data-action="dev-coins">Ajouter</button></div>
      <div class="dev-add"><label>💎 Gemmes <input type="number" id="dev-gems" min="1" max="100000" step="10" value="100"></label><button type="button" class="action secondary" data-action="dev-gems">Ajouter</button></div>
      <div class="dev-eggs"><button class="action secondary" type="button" data-action="add-test-egg" ${game.eggs.length>=EGG_CAP?'disabled':''}>🥚 Œuf test</button><button class="action pink" type="button" data-action="add-test-shiny" ${game.eggs.length>=EGG_CAP?'disabled':''}>✨ Œuf shiny test</button></div>
      <p class="subnote">En incubation, le bouton « Accélérer (test) » permet d'ouvrir un œuf sans attendre.</p>
      </section>`:''}
    <section class="card reset-panel"><h2>⚠️ Réinitialiser le compte</h2>
      <p class="muted">Supprime les combattants, les shinies, les équipements, les œufs, les pièces et les gemmes de cet appareil. Tes préférences audio restent inchangées.</p>
      <button type="button" class="action reset-button" data-action="reset-account">Réinitialiser ma progression</button>
      <p class="subnote">Un double contrôle de confirmation évite toute suppression accidentelle.</p>
    </section>
    <p class="subnote">Version 0.12 · Sauvegarde locale dans ce navigateur. Les codes sont visibles dans les fichiers publics du jeu : ils ne constituent pas une protection sécurisée.</p>`;
}
function adjustVolume(name, value) {
  if (!['menus','effects','music'].includes(name)) return;
  audioSettings[name] = Math.max(0, Math.min(100, Number(value)||0));
  try { localStorage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify(audioSettings)); } catch (_) {}
  if (sfxGain) sfxGain.gain.value = audioSettings.effects/100;
  const label=document.getElementById(`vol-${name}`);
  if(label) label.textContent=`${audioSettings[name]} %`;
}
function redeemCode() {
  const field=document.getElementById('redeem-code');
  if (!field) return;
  const code=(field.value||'').trim().toLowerCase();
  if (code==='test0.12') {
    if (redeemedCodes.includes(code)) return showToast('Ce code a déjà été utilisé sur cet appareil.');
    game.gems += 100;
    redeemedCodes.push(code);
    try {localStorage.setItem(REDEEMED_CODES_KEY,JSON.stringify(redeemedCodes));} catch (_) {}
    save(); render(); playSound('recruit'); showToast('🎁 Code accepté : +100 gemmes !');
  } else if (code==='dev0.12') {
    game.devMode=true; save();render();playSound('confirm');showToast('🧪 Mode développeur activé !');
  } else {
    showToast('Code inconnu. Vérifie son orthographe.');
    field.focus();
  }
}
function devAdd(kind) {
  if (!game.devMode) return;
  const input=document.getElementById(kind==='coins'?'dev-coins':'dev-gems');
  const amount=Number(input?.value);
  const max=kind==='coins'?1000000:100000;
  if (!Number.isSafeInteger(amount) || amount<1 || amount>max) return showToast(`Choisis un nombre entier entre 1 et ${format(max)}.`);
  game[kind]+=amount;
  save();render(); showToast(`🧪 +${format(amount)} ${kind==='coins'?'pièces':'gemmes'} !`);
}
function resetAccount() {
  if (!window.confirm('ATTENTION : réinitialiser Baston TV supprimera toute ta progression locale. Continuer ?')) return;
  const word=window.prompt('Dernière confirmation : écris REINITIALISER pour supprimer définitivement ta partie.');
  if (word !== 'REINITIALISER') return showToast('Réinitialisation annulée.');
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('bastontv-save-v01');
  } catch (_) {}
  game=freshSave(); training=null; duel=null; latestReward=null; viewerShift=0; viewerDelta=0;
  clearLockerSelection();
  currentView='home';
  save(); render(); showToast('Nouvelle partie créée. Bonne chance !');
}

function render() {
  const screen = document.querySelector("#screen");
  screen.innerHTML = ({home:homeScreen,gym:gymScreen,collection:collectionScreen,combat:combatScreen,later:laterScreen,settings:settingsScreen})[currentView]();
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === currentView;
    button.classList.toggle("selected", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  updateLiveLabels();
  const installPanel = document.getElementById('install-panel');
  if (installPanel) installPanel.hidden = installedMode();
  tickAudience();
  refreshSoundButton();
  syncCrowdAudio();
}
function updateLiveLabels() {
  const coins = document.querySelector("#coins-live");
  if (coins) coins.textContent = format(game.coins);
  const gems = document.querySelector('#gems-live');
  if (gems) gems.textContent = format(game.gems);
  const rate = document.querySelector("#rate-live");
  if (rate) rate.textContent = `+${format(incomePerMinute())}/min`;
}
function changeView(next) {
  if (training) { showToast("Termine ta séance avant de changer de salle !"); return; }
  if (duel?.busy && currentView === "combat") { showToast("Attends la fin du coup !"); return; }
  clearLockerSelection();
  currentView = next;
  render();
  window.scrollTo({top:0,behavior:"instant"});
}
function upgrade() {
  const cost = 200 * Math.pow(2, game.studioLevel - 1);
  if (game.studioLevel >= 5 || game.coins < cost) return;
  game.coins -= cost;
  game.studioLevel++;
  save(); render(); showToast("Studio amélioré ! Tes revenus augmentent.");
}
function startTraining() {
  const cost = trainingCost();
  if (training || game.coins < cost) return;
  game.coins -= cost;
  game.sessions++;
  const chosen = gymCompanion();
  training = { start: performance.now(), end: performance.now() + TRAINING_MS, next: 0, hits: 0, misses: 0, wrongClicks: 0, combo: 0, best: 0, spotX: 50, spotY: 45,
    companion: chosen ? { id:chosen.id, level:chosen.level, shiny:Boolean(chosen.shiny) } : null };
  latestReward = null;
  save(); render();
  moveSpot();
}
function moveSpot() {
  if (!training) return;
  const spot = document.querySelector("#spot");
  if (!spot) return;
  let x = 0, y = 0, ok = false, tries = 0;
  while (!ok && tries < 30) {
    x = 18 + Math.random() * 64;
    y = 16 + Math.random() * 68;
    const dx = x - (training.spotX ?? 50);
    const dy = y - (training.spotY ?? 45);
    ok = Math.hypot(dx, dy) >= MIN_SPOT_DISTANCE;
    tries++;
  }
  training.spotX = x;
  training.spotY = y;
  spot.style.left = `${x}%`;
  spot.style.top = `${y}%`;
  spot.style.animation = "none";
  void spot.offsetWidth;
  spot.style.animation = "";
  training.next = performance.now() + SPOT_LIFETIME_MS;
}
function spotCenterInArena() {
  const arena=document.getElementById("bag-arena");
  const spot=document.getElementById("spot");
  if (!arena || !spot) return null;
  const a=arena.getBoundingClientRect(), s=spot.getBoundingClientRect();
  return {x:(s.left+s.right)/2-a.left, y:(s.top+s.bottom)/2-a.top};
}
function gymFeedback(message, positive=false) {
  const status=document.getElementById("gym-status");
  if (!status) return;
  status.textContent=message;
  status.classList.toggle("positive",positive);
  status.classList.remove("bounce-label"); void status.offsetWidth; status.classList.add("bounce-label");
}
function spawnMarker(x, y, type = "miss", text = "") {
  const arena = document.querySelector('#bag-arena') || document.querySelector('.bag-arena');
  if (!arena) return;
  const mark = document.createElement('span');
  mark.className = `marker marker-${type}`;
  mark.textContent = (type === 'good' ? '✔' : '✖') + (text ? ` ${text}` : '');
  mark.style.left = `${x}px`;
  mark.style.top = `${y}px`;
  arena.appendChild(mark);
  setTimeout(() => mark.remove(), 650);
}
function penalizeTraining(ms, reason = 'miss', x = null, y = null) {
  if (!training) return;
  training.end -= ms;
  training.misses++;
  training.combo = 0;
  if (reason === 'wrong') training.wrongClicks++;
  playSound("miss");
  gymFeedback(reason === 'wrong' ? "Aïe, mauvais clic ! −0,5 s" : "Trop tard ! −0,7 s");
  const missesLabel=document.getElementById('training-misses');
  const comboLabel=document.getElementById('training-combo');
  if (missesLabel) missesLabel.textContent=String(training.misses);
  if (comboLabel) comboLabel.textContent='0';
  const arena = document.querySelector('#bag-arena') || document.querySelector('.bag-arena');
  if (arena) {
    const rect = arena.getBoundingClientRect();
    const fx = x ?? rect.width * (training.spotX / 100);
    const fy = y ?? rect.height * ((training.spotY + 5) / 100);
    spawnMarker(fx, fy, 'miss', reason === 'wrong' ? '−0,5 s' : '−0,7 s');
  }
}
function trainingMissedSpot() {
  const arena = document.querySelector('#bag-arena') || document.querySelector('.bag-arena');
  if (!arena || !training) return penalizeTraining(MISS_PENALTY_MS, 'miss');
  const center=spotCenterInArena();
  penalizeTraining(MISS_PENALTY_MS,'miss',center?.x ?? null,center?.y ?? null);
}
function handleGymMiss(event) {
  if (!training || currentView !== 'gym') return;
  const spot = document.getElementById('spot');
  if (spot && event.target === spot) return;
  const arena = document.getElementById('bag-arena');
  if (!arena) return;
  const clickedArena = event.target.closest('#bag-arena') || event.target.closest('#bag');
  if (!clickedArena) return;
  const rect = arena.getBoundingClientRect();
  penalizeTraining(WRONG_CLICK_PENALTY_MS, 'wrong', event.clientX - rect.left, event.clientY - rect.top);
}

function hitSpot() {
  if (!training || performance.now() >= training.end) return;
  if (performance.now() >= training.next) {
    trainingMissedSpot(); moveSpot();
    return;
  }
  training.hits++;
  training.combo++;
  const bag = document.querySelector('#bag');
  const boxer = document.querySelector('#gym-boxer');
  if (bag) {bag.classList.remove('bag-hit'); void bag.offsetWidth; bag.classList.add('bag-hit');}
  if (boxer) {boxer.classList.remove('gym-punch'); void boxer.offsetWidth; boxer.classList.add('gym-punch');}
  const arena = document.querySelector('#bag-arena') || document.querySelector('.bag-arena');
  const center=spotCenterInArena();
  if (arena && center) spawnMarker(center.x,center.y,'good');
  if (arena) impactEffect(arena,"BAM!","right",false);
  playSound('bag');
  if (training.combo % 5 === 0) { playSound('combo'); gymFeedback(`SUPER COMBO ×${training.combo} !`,true); }
  else gymFeedback('Bien joué !',true);
  training.best = Math.max(training.best, training.combo);
  moveSpot();
  const hits = document.querySelector("#training-hits");
  const combo = document.querySelector("#training-combo");
  if (hits) hits.textContent = String(training.hits);
  if (combo) combo.textContent = String(training.combo);
}
function chooseEquipment() {
  // Petit coup de pouce : une tenue incomplète a un peu plus de chances d'être complétée.
  const missing = EQUIPMENT.filter(item => game.equipment[item.id] === 0);
  const list = missing.length && Math.random() < .55 ? missing : EQUIPMENT;
  return list[Math.floor(Math.random() * list.length)].id;
}
function finishTraining() {
  if (!training) return;
  const {hits, best} = training;
  // Jusqu'à 2 équipements normaux. Le 3e / 4e exige un excellent
  // enchaînement parfait sans aucune faute (ni clic raté, ni cible expirée).
  let total = hits < 3 ? 0 : hits < 8 ? 1 : 2;
  if (training.misses === 0 && best >= 8) total++;
  if (training.misses === 0 && best >= 13) total++;
  total = Math.min(total, 4);
  const items = [];
  for (let i = 0; i < total; i++) {
    const id = chooseEquipment();
    game.equipment[id]++;
    items.push(id);
  }
  latestReward = {hits,best,items,misses: training.misses};
  playSound(total >= 3 ? 'combo' : total===0 ? 'lose' : 'recruit');
  training = null;
  save(); render();
  showToast(total ? `${total} équipement(s) gagné(s) ! Va voir les vestiaires.` : 'Aucun équipement : vise les cibles plus rapidement !');
}
function recruit() {
  if (!EQUIPMENT.every(item => game.equipment[item.id] > 0)) return;
  EQUIPMENT.forEach(item => game.equipment[item.id]--);
  game.fighters.push({id:getNewId(),level:1});
  playSound('recruit'); save();render();showToast("Nouveau combattant recruté : Bébé Bourrin !");
}
document.addEventListener('input', event => {
  const volume=event.target?.dataset?.volume;
  if (volume) adjustVolume(volume,event.target.value);
});
// Valider un code aussi avec la touche Entrée sur ordinateur.
document.addEventListener('keydown', event => {
  if (event.key==='Enter' && event.target?.id==='redeem-code') {
    event.preventDefault(); redeemCode();
  }
});
document.addEventListener("click", event => {
  handleGymMiss(event);
  const nav = event.target.closest("[data-view]");
  const target = event.target.closest("[data-action]");
  // Les boutons ont un petit clic de validation, mais les cibles du sac
  // utilisent exclusivement leur propre effet sonore de frappe.
  if (nav || (target && target.dataset.action !== 'toggle-sound')) {
    unlockSounds();
    if (!target || target.dataset.action !== 'hit') playSound('ui');
  }
  if (nav) {changeView(nav.dataset.view);return;}
  if (!target) return;
  switch(target.dataset.action) {
    case "go-gym": changeView("gym"); break;
    case "go-combat": changeView("combat"); break;
    case "start-duel": startDuel(); break;
    case "punch": punch(target.dataset.type); break;
    case "upgrade": upgrade(); break;
    case "start-training": startTraining(); break;
    case "choose-companion": chooseGymCompanion(target.dataset.fighterId); break;
    case "toggle-sound": toggleSound(); break;
    case "install-app": installBastonTV(); break;
    case "hit": hitSpot(); break;
    case "recruit": recruit(); break;
    case "add-test-egg": addTestEgg(false); break;
    case "add-test-shiny": addTestEgg(true); break;
    case "incubate": incubateEgg(target.dataset.eggId); break;
    case "hatch": hatchEgg(target.dataset.eggId); break;
    case "test-egg": accelerateEggTest(target.dataset.eggId); break;
    case "gem-egg": accelerateEggGems(target.dataset.eggId); break;
    case "claim-combat-egg": claimCombatEgg(); break;
    case "redeem-code": redeemCode(); break;
    case "dev-coins": devAdd('coins'); break;
    case "dev-gems": devAdd('gems'); break;
    case "reset-account": resetAccount(); break;
  }
});

// PWA : bouton d'installation Android/Chrome et aide pour iPhone et autres navigateurs.
let deferredInstallPrompt = null;
const installedMode = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const panel = document.getElementById('install-panel');
  if (panel) panel.hidden = true;
  showToast('📱 Baston TV est installée !');
});
function installHelpContent() {
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!window.isSecureContext) return '<p>Pour installer la PWA sur ton téléphone, ouvre le jeu depuis une adresse <strong>HTTPS</strong> (par exemple GitHub Pages), pas une adresse locale du PC.</p>';
  if (ios) return '<p>Sur iPhone ou iPad :</p><ul><li>Ouvre Baston TV dans ton navigateur.</li><li>Appuie sur <strong>Partager</strong>.</li><li>Choisis <strong>Sur l’écran d’accueil</strong> (ou « Ajouter à l’écran d’accueil »), puis confirme.</li></ul>';
  return '<p>Sur Android : ouvre Baston TV dans <strong>Chrome</strong> ou <strong>Samsung Internet</strong>, puis utilise le menu du navigateur (⋮) et choisis <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</p><p>Si tu ne vois pas l’option, vérifie que le jeu est publié en HTTPS et recharge la page.</p>';
}
async function installBastonTV() {
  if (installedMode()) { showToast('📱 Baston TV est déjà installée !'); return; }
  if (deferredInstallPrompt) {
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; }
    catch (_) { showInstallHelp(); }
    return;
  }
  showInstallHelp();
}
function showInstallHelp() {
  const dialog = document.getElementById('install-dialog');
  const message = document.getElementById('install-help');
  if (!dialog || !message) return;
  message.innerHTML = installHelpContent();
  if (!dialog.open) dialog.showModal();
}

const offlineCoins = advanceCoins();
save(); render();
if (offlineCoins > 1) setTimeout(() => showToast(`Pendant ton absence : +${format(offlineCoins)} pièces TV !`), 500);
setInterval(() => {
  if (document.hidden) return; // Le temps hors ligne est compté une seule fois au retour.
  advanceCoins();
  updateLiveLabels();
  if (training) {
    const time = performance.now();
    if (time >= training.end) finishTraining();
    else {
      if (time >= training.next) { trainingMissedSpot(); moveSpot(); }
      const remaining = (training.end - time)/1000;
      const timer = document.querySelector("#training-timer");
      const combo = document.querySelector("#training-combo");
      const progress = document.querySelector("#training-progress");
      if (timer) timer.textContent = remaining.toFixed(1).replace(".",",");
      if (combo) combo.textContent = String(training.combo);
      if (progress) progress.style.width = `${remaining*100/(TRAINING_MS/1000)}%`;
    }
  }
}, 100);
setInterval(save, 4_000);
setInterval(()=>{if(!document.hidden && currentView==='home')tickAudience();},3200);
setInterval(()=>{if(!document.hidden && currentView==='later' && game.eggs.some(e=>e.startedAt))render();},1000);
document.addEventListener("visibilitychange",()=>{ if(document.hidden) save(); else {advanceCoins(); updateLiveLabels();} syncCrowdAudio(); });
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
