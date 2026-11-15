/* Baston TV — Prototype 0.21.1. Aucun framework, ni serveur, ni compte requis. */
"use strict";

const SAVE_KEY = "bastontv-save-v03";
const VERSION_LABEL = "0.21.1";
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
const OFFLINE_RECAP_THRESHOLD_MS = 15 * 60_000;
const COMBAT_RESULT_HOLD_MS = 1500;
const SHOP_NORMAL_EGG_GEMS = 35;
const SHOP_SHINY_EGG_GEMS = 75;
const PROTEIN_PRICE_GEMS = 500;
const SHOP_FREE_EGG_COOLDOWN_MS = 24 * 60 * 60_000;
const CHANNEL_MAX_LEVEL = 10;
const CHANNEL_UPGRADE_COSTS = [0,450,850,1350,2100,3100,4500,6300,8500,11200];
const CHANNEL_BONUSES = [0,0,8,15,22,35,45,60,72,86,100];
const NINJA_UNLOCK_COST = 2000;
const SUMO_UNLOCK_COST = 6500;
const ROBOT_UNLOCK_COST = 18000;
const FAMILY_ORDER = ['boxe','ninja','sumo','robot'];
const FAMILY_DATA = {
  boxe:{name:'Bourrins',singular:'Bourrin',channel:'Boxe TV',icon:'🥊',unlockCost:0,trainingMultiplier:1},
  ninja:{name:'Ninjas',singular:'Ninja',channel:'Ninja TV',icon:'🥷',unlockCost:NINJA_UNLOCK_COST,trainingMultiplier:1.35},
  sumo:{name:'Sumos',singular:'Sumo',channel:'Sumo TV',icon:'🥋',unlockCost:SUMO_UNLOCK_COST,trainingMultiplier:1.65},
  robot:{name:'Robots',singular:'Robot',channel:'Robot TV',icon:'🤖',unlockCost:ROBOT_UNLOCK_COST,trainingMultiplier:1.95}
};
const NINJA_LEVELS = [null,
  {name:'Bébé Ninja',income:4},{name:'Le Novice',income:9},{name:'Le Filou',income:22},
  {name:'Le Sabreur',income:53},{name:'Le Maître des Ombres',income:126},{name:'Le Shuriken Suprême',income:500}
];
const NINJA_EQUIPMENT = [
  {id:'masque',label:'Masque',icon:'🥷'}, {id:'kunai',label:'Kunaï',icon:'🗡️'},
  {id:'tenue',label:'Tenue ninja',icon:'🥋'}, {id:'sandales',label:'Sandales',icon:'👣'}
];
const SUMO_LEVELS = [null,
  {name:'Bébé Sumo',income:5},{name:'Le Poussin',income:12},{name:'L’Apprenti',income:29},
  {name:'Le Rikishi',income:72},{name:'Le Colosse',income:170},{name:'Le Yokozuna',income:600}
];
const SUMO_EQUIPMENT = [
  {id:'mawashi',label:'Mawashi',icon:'🥋'}, {id:'chignon',label:'Chignon',icon:'🎀'},
  {id:'bandages',label:'Bandages',icon:'🩹'}, {id:'corde',label:'Corde sacrée',icon:'🪢'}
];
const ROBOT_LEVELS = [null,
  {name:'Bébé Boulon',income:6},{name:'Le Bidule',income:15},{name:'Le Turbo',income:38},
  {name:'Le Propulseur',income:95},{name:'Le Blindé',income:230},{name:'Mécha Suprême',income:760}
];
const ROBOT_EQUIPMENT = [
  {id:'boulons',label:'Boulons',icon:'🔩'}, {id:'puce',label:'Puce',icon:'💾'},
  {id:'batterie',label:'Batterie',icon:'🔋'}, {id:'blindage',label:'Blindage',icon:'🛡️'}
];
const LEVELS = [null,
  { name: "Bébé Bourrin", income: 3 },
  { name: "Le Paumé", income: 7 },
  { name: "Le Balourd", income: 16 },
  { name: "Le Cogneur", income: 40 },
  { name: "Le Titan", income: 100 },
  { name: "Le Champion", income: 430 }
];
const MAX_FIGHTER_LEVEL = LEVELS.length - 1;
const OPPONENT_NAMES = ["Jojo des Cordes","Momo la Mandale","Le Sparring TV","Tonton Crochet","Baston Bot","Rico le Rigolo"];
const EQUIPMENT = [
  { id: "gants", label: "Gants", icon: "🥊" },
  { id: "bandeau", label: "Bandeau", icon: "🎗️" },
  { id: "short", label: "Short", icon: "🩳" },
  { id: "chaussures", label: "Chaussures", icon: "👟" }
];
const now = () => Date.now();
const format = n => Math.floor(n).toLocaleString("fr-FR");
// Les six niveaux Bourrins ont désormais des sprites complets ; le niveau 6
// représente maintenant un champion à deux bras avec ses ceintures.
const imageFor = (level,family='boxe') => `./assets/${({boxe:'boxeur',ninja:'ninja',sumo:'sumo',robot:'robot'}[family]||'boxeur')}-${Math.max(1,Math.min(level,MAX_FIGHTER_LEVEL))}.png`;
const familyOf = f => FAMILY_ORDER.includes(f?.family)?f.family:'boxe';
const familyLevels = family => ({boxe:LEVELS,ninja:NINJA_LEVELS,sumo:SUMO_LEVELS,robot:ROBOT_LEVELS}[family]||LEVELS);
const familyEquipment = family => ({boxe:EQUIPMENT,ninja:NINJA_EQUIPMENT,sumo:SUMO_EQUIPMENT,robot:ROBOT_EQUIPMENT}[family]||EQUIPMENT);
const fighterName = f => familyLevels(familyOf(f))[f.level]?.name || 'Combattant';
const incomeFor = f => familyLevels(familyOf(f))[f.level]?.income||0;
const isFamilyUnlocked = family => family==='boxe'||Boolean(game.unlockedFamilies?.[family]);
const familyFighters = family => game.fighters.filter(f=>familyOf(f)===family);
const sortFighters = (a,b) => b.level-a.level || Number(b.shiny)-Number(a.shiny);
// À l'accueil, seule la prochaine chaîne est révélée. Les suivantes sont anonymes.
const nextFamilyToUnlock = () => FAMILY_ORDER.slice(1).find(f=>!isFamilyUnlocked(f)) || null;
const visibleOpponentFamilies = () => FAMILY_ORDER.filter(f=>isFamilyUnlocked(f)||f===nextFamilyToUnlock());
const familyTabs = (selected,action) => `<div class="family-tabs" role="group" aria-label="Choix de la famille">${FAMILY_ORDER.map(f=>{
  const revealed = isFamilyUnlocked(f) || (action==='select-channel' && f===nextFamilyToUnlock());
  if (!revealed) return action==='select-channel' ? '<span class="family-tab family-mystery" aria-label="Chaîne encore mystérieuse">🔒 ???</span>' : '';
  return `<button type="button" class="family-tab ${selected===f?'active':''}" data-action="${action}" data-family="${f}">${FAMILY_DATA[f].icon} ${FAMILY_DATA[f].name}${isFamilyUnlocked(f)?'':' 🔒'}</button>`;
}).join('')}</div>`;
const evolutionClass = level => level === 6 ? ' evolution-6' : '';
function evolutionDecoration(level,family='boxe') {
  // Compatibilité des emplacements des anciennes décorations : le sprite complet
  // fournit désormais le dessin du champion directement dans l'image.
  return '';
}
const getNewId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function freshSave() {
  return {
    coins: 600,
    studioLevel: 1,
    channelLevels: {boxe:1,ninja:1,sumo:1,robot:1},
    unlockedFamilies: {boxe:true,ninja:false,sumo:false,robot:false},
    selectedChannel:'boxe', selectedLockerFamily:'boxe', selectedGymFamily:'boxe',
    selectedCombatId:null,
    equipmentByFamily:{ninja:Object.fromEntries(NINJA_EQUIPMENT.map(x=>[x.id,0])),sumo:Object.fromEntries(SUMO_EQUIPMENT.map(x=>[x.id,0])),robot:Object.fromEntries(ROBOT_EQUIPMENT.map(x=>[x.id,0]))},
    sessionsByFamily:{boxe:0,ninja:0,sumo:0,robot:0},
    lastTick: now(),
    equipment: Object.fromEntries(EQUIPMENT.map(x => [x.id, 0])),
    fighters: [{ id: getNewId(), level: 1, family:"boxe" }],
    sessions: 0,
    gems: GEM_START,
    combatWins: 0,
    pendingCombatEggs: 0,
    gymCompanionId: null,
    eggs: [],
    shinyAlbum: {boxe:{},ninja:{},sumo:{},robot:{}},
    schemaVersion: 21,
    devMode: false,
    nextFreeShopEggAt: 0,
    proteins: 0
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
if ((game.schemaVersion || 0) < 13) {
  game.schemaVersion = 13;
}
if ((game.schemaVersion || 0) < 14) game.schemaVersion = 14;
// v0.15 n'altère pas les personnages, les ressources ou les séries de victoires.
if ((game.schemaVersion || 0) < 15) game.schemaVersion = 15;
// v0.16 : ancienne chaîne studio -> niveau de Boxe TV équivalent, sans perdre le bonus.
if ((game.schemaVersion||0)<16) {
  const oldToChannel={1:1,2:3,3:5,4:7,5:10};
  game.channelLevels={boxe:oldToChannel[game.studioLevel]||1,ninja:1};
  game.schemaVersion=16;
}
// v0.17 : évolution d'interface uniquement, aucune transformation de collection.
if ((game.schemaVersion||0)<17) game.schemaVersion=17;
if (!game.channelLevels || typeof game.channelLevels!=='object') game.channelLevels={boxe:1,ninja:1,sumo:1,robot:1};
for (const family of FAMILY_ORDER) game.channelLevels[family]=Math.max(1,Math.min(CHANNEL_MAX_LEVEL,Math.floor(game.channelLevels[family]||1)));
if (!game.unlockedFamilies || typeof game.unlockedFamilies!=='object') game.unlockedFamilies={boxe:true,ninja:false,sumo:false,robot:false};
game.unlockedFamilies.boxe=true;
if (game.fighters.some(f=>f.family==='ninja')) game.unlockedFamilies.ninja=true;
if (game.fighters.some(f=>f.family==='sumo')) game.unlockedFamilies.sumo=true;
if (game.fighters.some(f=>f.family==='robot')) game.unlockedFamilies.robot=true;
// Préserve les parties existantes et leur ordre de déblocage, même migrées.
if (game.unlockedFamilies.robot) game.unlockedFamilies.sumo=true;
if (game.unlockedFamilies.sumo) game.unlockedFamilies.ninja=true;
if (!game.equipmentByFamily || typeof game.equipmentByFamily!=='object') game.equipmentByFamily={};
for (const fam of ['ninja','sumo','robot']) {
  if (!game.equipmentByFamily[fam]) game.equipmentByFamily[fam]={};
  for (const eq of familyEquipment(fam)) if (!Number.isFinite(game.equipmentByFamily[fam][eq.id])) game.equipmentByFamily[fam][eq.id]=0;
}
if (!game.sessionsByFamily || typeof game.sessionsByFamily!=='object') game.sessionsByFamily={boxe:game.sessions||0,ninja:0,sumo:0};
for (const family of FAMILY_ORDER) game.sessionsByFamily[family]=Math.max(0,Math.floor(game.sessionsByFamily[family]||0));
for (const key of ['selectedChannel','selectedLockerFamily','selectedGymFamily']) {
  if (!FAMILY_ORDER.includes(game[key])||!isFamilyUnlocked(game[key])) game[key]='boxe';
}
if (game.selectedCombatId && !game.fighters.some(f=>f.id===game.selectedCombatId)) game.selectedCombatId=null;
game.fighters.forEach(f => { f.shiny=Boolean(f.shiny); if(!FAMILY_ORDER.includes(f.family))f.family='boxe'; });
if (typeof game.devMode !== 'boolean') game.devMode = false;
if (!Number.isSafeInteger(game.proteins) || game.proteins < 0) game.proteins = 0;
if (!Number.isFinite(game.nextFreeShopEggAt) || game.nextFreeShopEggAt < 0) game.nextFreeShopEggAt = 0;
if (!Array.isArray(game.eggs)) game.eggs = [];
if (!Number.isFinite(game.sessions) || game.sessions < 0) game.sessions = 0;
if (typeof game.lastDailyEgg !== 'string') game.lastDailyEgg = '';
if (!Number.isFinite(game.gems) || game.gems < 0) game.gems = GEM_START;
if (!Number.isFinite(game.combatWins) || game.combatWins < 0) game.combatWins = 0;
if (!Number.isFinite(game.pendingCombatEggs) || game.pendingCombatEggs < 0) game.pendingCombatEggs = 0;
if (typeof game.gymCompanionId !== 'string') game.gymCompanionId = null;
if (!game.shinyAlbum || typeof game.shinyAlbum !== 'object') game.shinyAlbum = {};
if (!game.shinyAlbum.boxe || typeof game.shinyAlbum.boxe!=='object') {
  const oldAlbum=game.shinyAlbum;
  game.shinyAlbum={boxe:{},ninja:{}};
  for(const [level,found] of Object.entries(oldAlbum)) if(found && /^\d+$/.test(level))game.shinyAlbum.boxe[level]=true;
}
for(const fam of ['ninja','sumo','robot']) if(!game.shinyAlbum[fam] || typeof game.shinyAlbum[fam]!=='object')game.shinyAlbum[fam]={};
for(const f of game.fighters) if(f.shiny) game.shinyAlbum[familyOf(f)][f.level]=true;
// v0.18 : la famille d'un œuf est fixée au moment où on le reçoit.
// Les œufs en incubation sont respectés ; ceux encore en stock de v0.17
// reçoivent un tirage unique pour ne plus pouvoir être changés à volonté.
if ((game.schemaVersion||0)<18) {
  game.eggs.forEach(egg=>{
    if (!egg.startedAt) egg.family=randomOwnedEggFamily();
    else if (!isFamilyUnlocked(egg.family)) egg.family='boxe';
  });
  game.schemaVersion=18;
}
for (const egg of game.eggs) if(!isFamilyUnlocked(egg.family)) egg.family='boxe';
// v0.19 : Sumos, puis v0.20 : Robots et découverte progressive.
if ((game.schemaVersion||0)<19) game.schemaVersion=19;
if ((game.schemaVersion||0)<20) game.schemaVersion=20;
// v0.21 : changement visuel et d’équilibrage uniquement, aucune ressource retirée.
if ((game.schemaVersion||0)<21) game.schemaVersion=21;
let currentView = "home";
let training = null;
let latestReward = null;
let duel = null; // Combat d’animation simple, non sauvegardé
let combatRosterOpen = false;
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
  return FAMILY_ORDER.reduce((sum,family)=>sum+Object.values(game.shinyAlbum?.[family]||{}).filter(Boolean).length,0);
}
function localDayKey() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
function randomOwnedEggFamily() {
  // Tirage parmi les familles débloquées ET réellement présentes dans la collection.
  const owned=FAMILY_ORDER.filter(f=>isFamilyUnlocked(f)&&game.fighters.some(member=>familyOf(member)===f));
  const available=owned.length?owned:['boxe'];
  return available[Math.floor(Math.random()*available.length)];
}
function createEgg(source, options={}) {
  return {id:getNewId(),startedAt:null,source,family:randomOwnedEggFamily(),...options};
}
function hasBusyIncubator() {
  return game.eggs.some(egg=>egg.startedAt && eggState(egg)!=='ready');
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
function channelLevel(family) {return game.channelLevels?.[family]||1;}
function channelBonusPercent(family) {return CHANNEL_BONUSES[channelLevel(family)]||0;}
function nextChannelUpgradeCost(family) {const level=channelLevel(family);return level>=CHANNEL_MAX_LEVEL?null:Math.round((CHANNEL_UPGRADE_COSTS[level]||11200)*({boxe:1,ninja:1.3,sumo:1.6,robot:2.2}[family]||1));}
function channelIncome(family) {
  if(!isFamilyUnlocked(family))return 0;
  const twoBest=familyFighters(family).sort(sortFighters).slice(0,2);
  return twoBest.reduce((sum,f)=>sum+incomeFor(f),0)*(1+channelBonusPercent(family)/100)*(1+shinyBonusPercent()/100);
}
function inventoryFor(family) {return family==='boxe'?game.equipment:(game.equipmentByFamily[family] ||= Object.fromEntries(familyEquipment(family).map(x=>[x.id,0])));}
function freeShopEggRemaining() { return Math.max(0, (game.nextFreeShopEggAt || 0) - now()); }
function canClaimFreeShopEgg() { return freeShopEggRemaining() <= 0; }
function opponentForLevel(playerLevel) {
  const shift = [-1, 0, 0, 1][Math.floor(Math.random()*4)];
  const level = Math.max(1, Math.min(MAX_FIGHTER_LEVEL, playerLevel + shift));
  return {
    name: OPPONENT_NAMES[Math.floor(Math.random()*OPPONENT_NAMES.length)],
    level
  };
}
// La progression reste possible même avec peu de pièces :
// +20 pièces toutes les 3 séances réalisées, +30 par stade au-dessus de 2.
function trainingCost(family=game.selectedGymFamily) {
  const members=familyFighters(family),best=Math.max(1,...members.map(f=>f.level));
  const sessions=game.sessionsByFamily[family]||0;
  const base=BASE_TRAINING_COST+TRAINING_INCREASE_AMOUNT*Math.floor(sessions/TRAINING_INCREASE_EVERY)+30*Math.max(0,best-2);
  return Math.min(5000,Math.ceil(base*FAMILY_DATA[family].trainingMultiplier/5)*5);
}
function incomePerMinute() {return FAMILY_ORDER.reduce((sum,f)=>sum+channelIncome(f),0);}

function advanceCoins() {
  const time = now();
  const elapsed = Math.min(OFFLINE_CAP_MS, Math.max(0, time - (game.lastTick || time)));
  const earned = incomePerMinute() * elapsed / 60_000;
  game.coins += earned;
  game.lastTick = time;
  return earned;
}
function showOfflineRecap(elapsedMs, earned) {
  if (elapsedMs < OFFLINE_RECAP_THRESHOLD_MS) return;
  const dialog=document.getElementById('offline-dialog');
  if (!dialog || dialog.open) return;
  const effective=Math.min(OFFLINE_CAP_MS, Math.max(0,elapsedMs));
  const channels=FAMILY_ORDER.filter(f=>isFamilyUnlocked(f))
    .map(f=>`<div class="offline-channel"><span>${FAMILY_DATA[f].icon} ${FAMILY_DATA[f].channel}</span><b>+${format(channelIncome(f)*effective/60_000)} 🪙</b></div>`).join('');
  document.getElementById('offline-duration').textContent=readableDuration(effective);
  document.getElementById('offline-total').textContent=`+${format(earned)} 🪙`;
  document.getElementById('offline-channels').innerHTML=channels;
  document.getElementById('offline-cap-note').hidden=elapsedMs<=OFFLINE_CAP_MS;
  if (typeof dialog.showModal==='function') dialog.showModal();
  else {dialog.setAttribute('open','');}
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
function strongestFighters(family=game.selectedChannel) {
  return familyFighters(family).sort(sortFighters).slice(0,2);
}
// Un choix indépendant des combattants diffusés : seul le visuel de l'entraînement change.
function gymCompanion(family=game.selectedGymFamily) {
  const selected=game.fighters.find(f=>f.id===game.gymCompanionId&&familyOf(f)===family);
  if(selected)return selected;
  return familyFighters(family).sort(sortFighters)[0]||null;
}
function chooseGymCompanion(id) {
  if(training)return;
  const fighter=game.fighters.find(f=>f.id===id&&familyOf(f)===game.selectedGymFamily);
  if(!fighter)return;
  game.gymCompanionId=fighter.id;save();render();
  showToast(`${fighter.shiny?'✨ ':''}${fighterName(fighter)} t'accompagnera à l'entraînement !`);
}
function gymCompanionHtml(fighter) {
  if(!fighter)return '';
  const family=familyOf(fighter);
  return `<div class="gym-companion-actor ${fighter.shiny?'shiny-actor':''}${family==='boxe'?evolutionClass(fighter.level):''}" aria-label="${fighterName(fighter)}">
    <img class="gym-boxer breathing" id="gym-boxer" src="${imageFor(fighter.level,family)}" alt="${fighterName(fighter)}">${evolutionDecoration(fighter.level,family)}</div>`;
}
function gymRosterHtml(companion) {
  const members=familyFighters(game.selectedGymFamily).sort(sortFighters);
  return `<section class="card gym-choice-panel"><h2>${FAMILY_DATA[game.selectedGymFamily].icon} Choisir mon accompagnateur</h2>
      <p class="muted">Le choix de l'accompagnateur ne change pas les équipements obtenus : c'est la famille sélectionnée au-dessus qui compte.</p>
      <div class="gym-roster" role="group" aria-label="Choix du combattant">${members.map(f=>`
        <button class="gym-roster-fighter ${companion?.id===f.id?'is-selected':''} ${f.shiny?'shiny-fighter':''}" type="button" data-action="choose-companion" data-fighter-id="${f.id}"
          aria-pressed="${String(companion?.id===f.id)}" aria-label="Choisir ${fighterName(f)}, évolution ${f.level}">
          <img src="${imageFor(f.level,familyOf(f))}" alt=""><strong>${f.shiny?'✨ ':''}${fighterName(f)}</strong><small>Niv. ${f.level}</small>
          <span class="gym-roster-check">${companion?.id===f.id?'✓ Sélectionné':'Choisir'}</span></button>`).join('')}</div></section>`;
}

// Le compteur simule une audience en direct. Il varie légèrement sans changer les revenus.
let viewerShift = 0;
let viewerDelta = 0;
function baseAudience() {
  return 160 + channelLevel(game.selectedChannel)*26 + strongestFighters(game.selectedChannel).reduce((sum,f)=>sum+f.level*115,0);
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

// Petits affrontements TV purement décoratifs : aucun dégât, aucune récompense,
// aucun son automatique et aucun changement de sauvegarde.
let tvPunchIndex=0;
function animateStudioTV() {
  if (document.hidden || currentView!=='home') return;
  const stage=document.querySelector('.tv-stage');
  const fighters=stage?.querySelectorAll('.on-air .fighter-onair');
  if (!stage || !fighters || fighters.length<2) return;
  const attackerIndex=tvPunchIndex++%2;
  const attacker=fighters[attackerIndex];
  const defender=fighters[1-attackerIndex];
  attacker.classList.remove('tv-strike');
  defender.classList.remove('tv-flinch');
  void attacker.offsetWidth;
  attacker.classList.add('tv-strike');
  defender.classList.add('tv-flinch');
  const bubble=document.createElement('span');
  bubble.className='tv-pow';
  bubble.textContent=['POW !','BAM !','TCHAK !','PAF !'][(tvPunchIndex-1)%4];
  bubble.setAttribute('aria-hidden','true');
  stage.appendChild(bubble);
  setTimeout(()=>{attacker.classList.remove('tv-strike');defender.classList.remove('tv-flinch');bubble.remove();},650);
}

function fighterTile(fighter) {
  const info = LEVELS[fighter.level];
  return `<div class="fighter-card"><img src="${imageFor(fighter.level)}" alt="${info.name}"><b>${info.name}</b><small>Évolution ${fighter.level} · +${info.income} pièces/min</small></div>`;
}
function homeScreen() {
  const family=game.selectedChannel;
  const unlocked=isFamilyUnlocked(family);
  const info=FAMILY_DATA[family];
  const onAir=unlocked?strongestFighters(family):[];
  const nextCost=unlocked?nextChannelUpgradeCost(family):null;
  return `<span class="kicker">📡 Les chaînes TV</span><h1 class="h1">Bienvenue au studio !</h1>
    <p class="muted">Chaque famille possède sa chaîne, ses deux vedettes et ses propres améliorations. Les revenus des chaînes se cumulent, même quand tu regardes une autre chaîne.</p>
    ${familyTabs(family,'select-channel')}
    ${!unlocked?`<section class="card unlock-panel"><h2>${info.icon} Débloquer ${info.channel}</h2><p class="muted">${family==='robot'?'Ouvre l’atelier Robot TV et reçois ton premier Bébé Boulon ! Les Robots sont robustes et disposent d’un blindage qui réduit les dégâts.':family==='sumo'?'Ouvre l’écurie des Sumos et reçois ton premier Bébé Sumo ! Leur spécialité : deux parades par tour, beaucoup de vie mais peu de vitesse.':'Ouvre le dojo Ninja, reçois un Bébé Ninja et débloque ses équipements, son vestiaire et sa chaîne.'}</p>
      <div class="price"><span>Prix de déblocage</span><strong>🪙 ${format(info.unlockCost)}</strong></div>
      <button class="action pink" data-action="unlock-family" data-family="${family}" ${game.coins<info.unlockCost?'disabled':''}>${info.icon} Débloquer ${info.name}</button>
      <p class="subnote">${game.coins<info.unlockCost?`Il te manque ${format(info.unlockCost-game.coins)} pièce(s).`:'Famille disponible à l’achat !'}</p></section>`:
      `<div class="tv-stage ${family==='ninja'?'tv-ninja':family==='sumo'?'tv-sumo':family==='robot'?'tv-robot':''}" aria-label="${info.channel} en direct">
        <span class="live-label">● EN DIRECT</span>
        <div class="viewers-live" aria-label="Audience simulée en direct">👥 <b id="viewers-live">${format(currentAudience())}</b> <small id="viewers-change" class="viewers-change up">• 0</small></div>
        <div class="stage-logo">${info.icon} ${info.channel.toUpperCase()}</div>
        <div class="on-air">${onAir.map((f,i)=>`<div class="fighter-onair tv-fighter-${i+1} ${f.shiny?'shiny-fighter':''}${family==='boxe'?evolutionClass(f.level):''}">
          <div class="tv-actor"><img src="${imageFor(f.level,family)}" alt="${fighterName(f)}">${evolutionDecoration(f.level,family)}</div><strong>${f.shiny?'✨ ':''}${fighterName(f)}</strong></div>`).join('')}
          ${onAir.length<2?'<div class="empty-slot">Place libre</div>':''}</div></div>`}
    <div class="stat-grid"><div class="stat"><small>📈 Revenus totaux</small><b id="rate-live">+${format(incomePerMinute())}/min</b><small>${info.channel} : +${format(channelIncome(family))}/min</small></div>
      <div class="stat"><small>🎬 ${info.channel}</small><b>Niv. ${unlocked?channelLevel(family):'🔒'}</b><small>Bonus : +${unlocked?channelBonusPercent(family):0} %</small></div></div>
    <div class="tv-shiny-caption">✨ Shinies découverts : ${shinyBonusPercent()} · Bonus global : +${shinyBonusPercent()} % aux revenus TV</div>
    <button type="button" class="action secondary" data-action="go-gym">🥊 Aller s'entraîner</button>
    <button type="button" class="action pink" data-action="go-combat">⚔️ Aller combattre</button>
    ${unlocked?`<section class="card"><h2>🔧 Améliorer ${info.channel}</h2>
      <p class="muted">${CHANNEL_MAX_LEVEL} niveaux par chaîne. Les améliorations ne renforcent que ${info.channel}, avec un bonus maximum de +100 %.</p>
      <div class="price"><span>Prochain niveau</span><span>${nextCost?`🪙 ${format(nextCost)}`:'MAX'}</span></div>
      <button class="action" type="button" data-action="upgrade" ${!nextCost || game.coins<nextCost?'disabled':''}>${nextCost?`Améliorer (+${CHANNEL_BONUSES[channelLevel(family)+1]-channelBonusPercent(family)} %)`:'Chaîne au maximum'}</button></section>`:''}
    ${unlocked?`<section class="card evolution-roadmap"><h2>${info.icon} Évolutions ${info.name}</h2>
      <p class="muted">Six stades. Il faut 32 recrues niveau 1 pour créer un niveau 6 sans protéine.</p>
      <div class="evolution-roadmap-grid">${familyLevels(family).slice(1).map((stage,index)=>{
        const level=index+1,found=familyFighters(family).some(f=>f.level>=level);
        return `<div class="roadmap-step ${found?'roadmap-unlocked':''}"><small>Stade ${level}</small><strong>${found?'✓':'🔒'} ${stage.name}</strong><span>+${stage.income} 🪙/min</span></div>`;
      }).join('')}</div></section>`:'<section class="card mystery-roadmap"><h2>🔒 Évolutions secrètes</h2><p class="muted">Débloque cette chaîne pour découvrir ses six évolutions et leurs revenus.</p></section>'}
    <section class="install-panel" id="install-panel"><h2>📱 Baston TV sur ton téléphone</h2>
      <p>Installe le jeu depuis ton navigateur pour le retrouver sur ton écran d’accueil.</p>
      <button class="action secondary" type="button" data-action="install-app" id="install-app-button">📲 Installer Baston TV</button></section>`;
}
function gymScreen() {
  const family=training?.family||game.selectedGymFamily;
  const companion=training?.companion?game.fighters.find(f=>f.id===training.companion.id)||training.companion:gymCompanion(family);
  if(training)return `<span class="kicker">🥊 Entraînement ${FAMILY_DATA[family].name}</span><h1 class="h1">Frappe les points faibles !</h1>
    <div class="train-stat"><span>⏱ <span id="training-timer">20,0</span> s</span><span>⭐ <span id="training-hits">0</span> touches</span><span>🔥 <span id="training-combo">0</span></span><span>❌ <span id="training-misses">0</span></span></div>
    <div class="progress"><span id="training-progress" style="width:100%"></span></div>
    <div class="bag-arena" id="bag-arena" style="margin-top:12px"><span class="gym-status" id="gym-status">Vise la cible !</span>${gymCompanionHtml(companion)}<div class="bag-swing" id="bag-swing"><div class="bag-cable" aria-hidden="true"></div><div class="bag" id="bag"><button class="spot" id="spot" data-action="hit" aria-label="Frapper le point faible" style="left:50%;top:45%"></button></div></div></div>
    <p class="muted">Tu récoltes uniquement des équipements ${FAMILY_DATA[family].name} pendant cette séance.</p>`;
  const result=latestReward?`<section class="card"><h2>🎁 Dernière séance · ${FAMILY_DATA[latestReward.family||'boxe'].name}</h2><p class="muted">${latestReward.hits} point(s) · combo : ${latestReward.best} · erreurs : ${latestReward.misses}</p>
      <div class="reward-list">${latestReward.items.length?latestReward.items.map(id=>{const item=familyEquipment(latestReward.family||'boxe').find(x=>x.id===id);return `<span class="reward-bubble">${item?.icon||''} ${item?.label||id}</span>`;}).join(''):'<span>Aucun équipement cette fois.</span>'}</div></section>`:'';
  return `<span class="kicker">🎯 Les coulisses</span><h1 class="h1">Salle d'entraînement</h1>
    <p class="muted">Choisis la famille à entraîner : les équipements récoltés serviront uniquement à recruter des combattants de cette famille.</p>
    ${familyTabs(family,'select-gym-family')}
    <div class="bag-arena">${gymCompanionHtml(companion)}<div class="bag-swing"><div class="bag-cable" aria-hidden="true"></div><div class="bag"><div class="spot" style="left:49%;top:34%;pointer-events:none"></div></div></div></div>
    <button class="action gym-start-cta" type="button" data-action="start-training" ${game.coins<trainingCost(family)?'disabled':''}>🥊 Commencer la séance ${FAMILY_DATA[family].icon} · ${format(trainingCost(family))} 🪙</button>
    ${gymRosterHtml(companion)}
    <div class="stat-grid"><div class="stat"><small>⏱ Durée</small><b>20 s</b></div><div class="stat"><small>🪙 Prix ${FAMILY_DATA[family].name}</small><b>${format(trainingCost(family))}</b></div></div>
    <p class="subnote">La Boxe est la moins chère ; les Ninjas, les Sumos et les Robots coûtent progressivement plus cher. Chaque famille a son propre prix évolutif.</p>
    ${result}
    <div class="tip"><b>Récompenses :</b> 0 équipement pour un mauvais score ; 1 à 2 en général, jusqu'à 4 avec un excellent combo sans faute.</div>`;
}
function lockerCharacter(fighter,index,onAir=false) {
  const level=fighter.level,family=familyOf(fighter);
  // Chaque rangée est posée sur sa propre plateforme (pieds au même niveau).
  const x=17+(index%3)*33, floor=31+Math.floor(index/3)*155;
  const delay=((index*73)%17)/10,duration=3.2+(index%4)*.45;
  return `<div class="locker-fighter ${onAir?'locker-on-air':'locker-wander'}" data-fighter-id="${fighter.id}" data-fighter-level="${level}" data-fighter-family="${family}" data-fighter-shiny="${fighter.shiny?'true':'false'}" tabindex="0" role="button" aria-label="${fighterName(fighter)} niveau ${level}, glisser sur une recrue du même niveau" style="--lx:${x}%;--floor-bottom:${floor}px;--delay:-${delay}s;--distance:${6+(index%4)*4}px;--duration:${duration}s">
    <div class="locker-character ${fighter.shiny?'is-shiny':''}${family==='boxe'?evolutionClass(level):''}"><img src="${imageFor(level,family)}" draggable="false" alt="">${evolutionDecoration(level,family)}<span class="locker-level">${fighter.shiny?'✨ ':''}Niv. ${level}</span></div>
    <span class="locker-name">${fighter.shiny?'✨ ':''}${fighterName(fighter)}</span></div>`;
}
function collectionScreen() {
  const family=game.selectedLockerFamily,info=FAMILY_DATA[family];
  const inventory=inventoryFor(family),equipment=familyEquipment(family);
  const ready=equipment.every(item=>inventory[item.id]>0);
  const onAir=strongestFighters(family), assigned=new Set(onAir.map(f=>f.id));
  const others=familyFighters(family).filter(f=>!assigned.has(f.id));
  const display=others.slice(0,30),rows=Math.max(1,Math.ceil(display.length/3)),rest=others.length-display.length;
  const proteinEligible=[...game.fighters].filter(f=>f.level<MAX_FIGHTER_LEVEL).sort(sortFighters);
  return `<span class="kicker">🧤 Les coulisses</span><h1 class="h1">Les vestiaires</h1>
    <p class="muted">Un vestiaire par famille : fusionne deux combattants du même niveau, de la même famille et de la même rareté.</p>
    ${familyTabs(family,'select-locker-family')}
    <section class="card locker-panel"><h2>📡 Sur ${info.channel}</h2><p class="subnote">Les vedettes de cette chaîne peuvent également être fusionnées.</p>
      <div class="locker-onair-strip">${onAir.map((f,i)=>lockerCharacter(f,i,true)).join('')}${onAir.length<2?'<span class="locker-air-empty">Emplacement libre</span>':''}</div></section>
    <section class="card locker-panel"><div class="locker-heading"><h2>🏠 Vestiaire ${info.name} (${others.length})</h2><span class="locker-help">☝️ Glisser pour fusionner</span></div>
      <div class="locker-room ${family==='ninja'?'ninja-locker':family==='sumo'?'sumo-locker':family==='robot'?'robot-locker':''}" id="locker-room" style="--locker-height:${Math.max(305,rows*155+95)}px">
        <div class="locker-poster">${info.channel.toUpperCase()} ★ CLUB</div><div class="locker-bench"></div>
        ${Array.from({length:rows},(_,i)=>`<div class="locker-floor" style="bottom:${12+i*155}px"></div>`).join('')}
        ${display.map((f,i)=>lockerCharacter(f,i)).join('')}
        ${!others.length?'<p class="locker-empty">Toutes tes recrues sont sur le plateau TV !</p>':''}
      </div>${rest?`<p class="subnote">${rest} autre(s) combattant(s) en réserve (30 premiers affichés).</p>`:''}
      <p class="subnote">Normal + normal → normal · Shiny + shiny → shiny. Pas de mélange entre les familles.</p></section>
    <section class="card"><h2>🎁 Équipements ${info.name}</h2><div class="eq-grid">${equipment.map(item=>`<div class="eq-item ${inventory[item.id]>0?'ready':''}"><span>${item.icon} ${item.label}</span><b>×${inventory[item.id]}</b></div>`).join('')}</div>
      <button class="action" type="button" data-action="recruit" ${ready?'':'disabled'}>${info.icon} Recruter : ${familyLevels(family)[1].name}</button>
      <p class="subnote">Consomme un exemplaire de chaque équipement ${info.name}. Les équipements sont propres à chaque famille.</p></section>
    <section class="card protein-panel"><h2>🥤 Protéine d'évolution</h2>
      <p class="muted">Tu possèdes <b>${game.proteins} protéine(s)</b>. Utilisable sur toutes les familles, même sur un shiny.</p>
      <label for="protein-fighter" class="protein-label">Choisir le bénéficiaire</label>
      <select id="protein-fighter" class="protein-select" ${!game.proteins?'disabled':''}>
        ${proteinEligible.map(f=>`<option value="${f.id}">${FAMILY_DATA[familyOf(f)].icon} ${f.shiny?'✨ ':''}${fighterName(f)} (niv. ${f.level} → ${f.level+1})</option>`).join('')}
      </select>
      <button class="action pink" type="button" data-action="use-protein" ${!game.proteins||!proteinEligible.length?'disabled':''}>🥤 Utiliser une protéine</button>
      <p class="subnote">Disponible pour 500 💎 à la boutique. Le niveau 6 est le maximum.</p></section>`;
}
// Fusion au glisser-déposer, compatible avec la souris ET le tactile.
let lockerDrag = null;
let lockerSelection = null;
function fighterById(id) { return game.fighters.find(f=>f.id===id); }
function clearLockerSelection() { lockerSelection=null; document.querySelectorAll('.locker-fighter.selected-for-fusion').forEach(e=>e.classList.remove('selected-for-fusion')); }
function fuseFighters(firstId, secondId) {
  if (!firstId || !secondId || firstId===secondId) return false;
  const a=fighterById(firstId), b=fighterById(secondId);
  if (!a || !b || familyOf(a)!==familyOf(b) || a.level!==b.level || Boolean(a.shiny)!==Boolean(b.shiny) || a.level>=MAX_FIGHTER_LEVEL) return false;
  const newLevel=a.level+1;
  const companionWasUsed = game.gymCompanionId===a.id || game.gymCompanionId===b.id;
  const fused = {id:getNewId(),family:familyOf(a),level:newLevel,shiny:Boolean(a.shiny)};
  game.fighters=game.fighters.filter(f=>f.id!==a.id && f.id!==b.id);
  game.fighters.push(fused);
  if (companionWasUsed) game.gymCompanionId=fused.id;
  if (a.shiny) game.shinyAlbum[familyOf(a)][newLevel]=true;
  clearLockerSelection();
  playSound('combo'); save(); render();
  showToast(`✨ Fusion ! ${fighterName(fused)}${a.shiny?' shiny':''} obtenu !`);
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
    hit.classList.add(Number(hit.dataset.fighterLevel)===d.level && hit.dataset.fighterFamily===d.family && hit.dataset.fighterShiny===d.shiny && d.level<MAX_FIGHTER_LEVEL?'drop-ok':'drop-no');
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
  lockerDrag={id:el.dataset.fighterId,level:Number(el.dataset.fighterLevel),family:el.dataset.fighterFamily,shiny:el.dataset.fighterShiny,el,ghost,
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
  return `<div class="egg-slot ${revealed?'egg-shiny':''} ${state==='ready'?'egg-ready':''}" data-egg-slot="${egg.id}" data-egg-state="${state}">
    <div class="egg-visual ${revealed?'egg-glowing':''}" aria-hidden="true">🥚</div>
    <strong>${badge} ${name}</strong>
    ${state==='incubating'||state==='glowing'?`<small class="egg-countdown" data-egg-countdown="${egg.id}">${readableDuration(eggTimeLeft(egg))}</small>`:''}
    <small class="egg-fixed-family">${FAMILY_DATA[familyOf(egg)].icon} Œuf de ${FAMILY_DATA[familyOf(egg)].name}</small>
    ${state==='stock'?`<button class="egg-button" data-action="incubate" data-egg-id="${egg.id}" ${hasBusyIncubator()?'disabled':''}>${hasBusyIncubator()?'Incubateur occupé':'Incuber'}</button>`:''}
    ${state==='ready'?`<button class="egg-button" data-action="hatch" data-egg-id="${egg.id}">Ouvrir l'œuf</button>`:''}
    ${state==='incubating'||state==='glowing'?`<button class="egg-button egg-gems-button" data-action="gem-egg" data-egg-id="${egg.id}" ${game.gems<GEM_ACCEL_COST?'disabled':''}>💎 ${GEM_ACCEL_COST} gemmes · −30 min</button>
    ${game.devMode?`<button class="egg-test-button" data-action="test-egg" data-egg-id="${egg.id}">⏩ Accélérer (test)</button>`:''}`:''}
  </div>`;
}
function laterScreen() {
  const shinyEntries=FAMILY_ORDER.filter(f=>isFamilyUnlocked(f)).map(f=>`<h3>${FAMILY_DATA[f].icon} ${FAMILY_DATA[f].name}</h3><div class="shiny-album">${Array.from({length:MAX_FIGHTER_LEVEL},(_,i)=>i+1).map(level=>`<div class="album-entry ${game.shinyAlbum[f]?.[level]?'unlocked':''}">${game.shinyAlbum[f]?.[level]?'✨':'🔒'}<small>Niv. ${level}</small></div>`).join('')}</div>`).join('');
  const freeReady = canClaimFreeShopEgg();
  const freeRemaining = freeShopEggRemaining();
  return `<span class="kicker">🛒 Boutique & incubateur</span><h1 class="h1">Boutique des œufs</h1>
    <p class="muted">Chaque œuf reçoit une famille au hasard parmi celles que tu possèdes. Elle est fixée dès son obtention et indiquée sur l'œuf.</p>
    <section class="card"><h2>🛍️ Boutique</h2>
      <div class="shop-grid">
        <div class="shop-item"><strong>🎁 Œuf gratuit</strong><small>Réclamable toutes les 24 h</small><b id="shop-free-timer">${freeReady ? 'Disponible !' : readableDuration(freeRemaining)}</b><button id="shop-free-claim" class="egg-button" data-action="claim-free-shop-egg" ${freeReady && game.eggs.length < EGG_CAP ? '' : 'disabled'}>${game.eggs.length >= EGG_CAP ? 'Stock plein' : freeReady ? 'Réclamer' : 'Patiente…'}</button></div>
        <div class="shop-item"><strong>🥚 Œuf normal</strong><small>Chance shiny : 30 % à l’incubation</small><b>💎 ${SHOP_NORMAL_EGG_GEMS}</b><button class="egg-button" data-action="buy-egg" data-kind="normal" ${game.gems >= SHOP_NORMAL_EGG_GEMS && game.eggs.length < EGG_CAP ? '' : 'disabled'}>Acheter</button></div>
        <div class="shop-item premium"><strong>✨ Œuf shiny garanti</strong><small>Shiny assuré à l’incubation</small><b>💎 ${SHOP_SHINY_EGG_GEMS}</b><button class="egg-button egg-gems-button" data-action="buy-egg" data-kind="shiny" ${game.gems >= SHOP_SHINY_EGG_GEMS && game.eggs.length < EGG_CAP ? '' : 'disabled'}>Acheter</button></div>
        <div class="shop-item protein-shop"><strong>🥤 Protéine d'évolution</strong><small>Fait monter 1 combattant de 1 niveau, shiny compris.</small><b>💎 ${PROTEIN_PRICE_GEMS}</b><button class="egg-button" data-action="buy-protein" ${game.gems >= PROTEIN_PRICE_GEMS ? '' : 'disabled'}>Acheter</button></div>
      </div>
      <p class="subnote">Protéines en réserve : <b>${game.proteins}</b> · Utilisation dans les Vestiaires. Les protéines ne prennent pas de place dans le stock d’œufs.</p><p class="subnote">Stock maximum : ${EGG_CAP} œufs. Un seul œuf en cours d’incubation à la fois ; tu peux lancer le suivant dès que le premier est prêt, sans devoir l’ouvrir.</p>
    </section>
    <section class="card"><h2>🏆 Récompenses de combat</h2>
      <p class="muted">Tous les <b>${WINS_PER_EGG} duels remportés</b> : un œuf à récupérer. Victoires totales : <b>${game.combatWins}</b> · Encore <b>${WINS_PER_EGG-(game.combatWins%WINS_PER_EGG)}</b> victoire(s) avant le prochain.</p>
      <p class="muted">Récompenses disponibles : <b>${game.pendingCombatEggs}</b> · Stock : <b>${game.eggs.length}/${EGG_CAP}</b> œufs.</p>
      <button class="action secondary" data-action="claim-combat-egg" ${game.pendingCombatEggs>0 && game.eggs.length<EGG_CAP?'':'disabled'}>🥚 Récupérer un œuf de combat</button>
    </section>
    <section class="card"><h2>🔮 Mes œufs</h2>
      <div class="gem-caption">💎 Gemmes : <b>${format(game.gems)}</b> · Accélération de 30 min : <b>${GEM_ACCEL_COST} gemmes</b></div>
      <div class="egg-header"><span>Œufs stockés : <b>${game.eggs.length}/${EGG_CAP}</b></span><span>Chance shiny normale : <b>30 %</b></span></div>
      <div class="egg-grid">${game.eggs.map(eggSlotHtml).join('')}${Array.from({length:Math.max(0,EGG_CAP-game.eggs.length)},()=>'<div class="egg-slot egg-empty"><span>＋</span><small>Emplacement libre</small></div>').join('')}</div>
      ${!game.eggs.length?'<p class="subnote">Achète un œuf ou gagne sept combats pour remplir l’incubateur.</p>':''}
      <p class="subnote">Les gemmes réduisent l'incubation de 30 minutes. Les shinies gardent les mêmes statistiques que les normaux.</p>
    </section>
    <section class="card"><h2>✨ Album shiny — Toutes les familles</h2>${shinyEntries}
      <p class="muted">Chaque nouvelle évolution shiny découverte rapporte <b>+1 % de revenus TV permanents</b>. Bonus actuel : <b>+${shinyBonusPercent()} %</b>.</p>
    </section>
    <div class="tip">Fusion : normal + normal ou shiny + shiny seulement, à niveau égal. Les outils d'œufs de test sont réservés au mode développeur dans les Paramètres.</div>`;
}
function addTestEgg(forceShiny=false) {
  if (!game.devMode) return showToast('Réservé au mode développeur.');
  if (game.eggs.length >= EGG_CAP) return showToast('Stock plein : ouvre un œuf avant d’en ajouter.');
  game.eggs.push(createEgg('developer',{testForcedShiny:Boolean(forceShiny)}));
  playSound('confirm'); save(); render();
  showToast(forceShiny ? '✨ Œuf shiny de test ajouté !' : '🥚 Œuf de test ajouté !');
}
function incubateEgg(id) {
  const egg=game.eggs.find(e=>e.id===id);
  if (!egg || egg.startedAt) return;
  if (hasBusyIncubator()) return showToast('Une autre incubation est en cours. Le prochain œuf pourra démarrer dès qu’elle sera terminée.');
  const shiny=egg.testForcedShiny || egg.guaranteedShiny || Math.random()<SHINY_RATE;
  egg.shiny=shiny;
  egg.level=shiny?(Math.random()<.05?2:1):(Math.random()<.35?2:1);
  egg.startedAt=now();
  save();render();showToast('Incubation lancée !');
}
function hatchEgg(id) {
  const egg=game.eggs.find(e=>e.id===id);
  if (!egg || eggState(egg)!=='ready') return;
  const fighter={id:getNewId(),family:familyOf(egg),level:egg.level,shiny:Boolean(egg.shiny)};
  game.fighters.push(fighter);
  if (fighter.shiny) game.shinyAlbum[familyOf(fighter)][fighter.level]=true;
  game.eggs=game.eggs.filter(e=>e.id!==id);
  playSound('recruit');save();render();
  showToast(`${fighter.shiny?'✨ SHINY ! ':'🎉 '}${fighterName(fighter)} niveau ${fighter.level} obtenu !`);
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
  game.eggs.push(createEgg('combat'));
  playSound('confirm');save();render();showToast('🥚 Œuf de victoire récupéré !');
}
function claimFreeShopEgg() {
  if (game.eggs.length >= EGG_CAP) return showToast('Stock plein : ouvre un œuf avant de réclamer le cadeau gratuit.');
  if (!canClaimFreeShopEgg()) return showToast(`Reviens dans ${readableDuration(freeShopEggRemaining())}.`);
  game.eggs.push(createEgg('free-shop'));
  game.nextFreeShopEggAt = now() + SHOP_FREE_EGG_COOLDOWN_MS;
  playSound('confirm'); save(); render(); showToast('🎁 Œuf gratuit récupéré !');
}
function buyEgg(kind='normal') {
  if (game.eggs.length >= EGG_CAP) return showToast('Stock plein : ouvre un œuf avant d’en acheter un autre.');
  const guaranteedShiny = kind === 'shiny';
  const cost = guaranteedShiny ? SHOP_SHINY_EGG_GEMS : SHOP_NORMAL_EGG_GEMS;
  if (game.gems < cost) return showToast('Pas assez de gemmes.');
  game.gems -= cost;
  game.eggs.push(createEgg('shop',{guaranteedShiny}));
  playSound('confirm'); save(); render(); showToast(guaranteedShiny ? '✨ Œuf shiny garanti acheté !' : '🥚 Œuf normal acheté !');
}
function buyProtein() {
  if (game.gems < PROTEIN_PRICE_GEMS) return showToast('Il te faut 500 gemmes pour une protéine.');
  game.gems -= PROTEIN_PRICE_GEMS;
  game.proteins++;
  playSound('confirm'); save(); render();
  showToast('🥤 Protéine achetée ! Choisis ton combattant dans les Vestiaires.');
}
function useProtein() {
  if (!game.proteins) return showToast('Tu ne possèdes pas de protéine.');
  const id=document.getElementById('protein-fighter')?.value;
  const fighter=game.fighters.find(f=>f.id===id);
  if (!fighter) return showToast('Choisis un combattant valide.');
  if (fighter.level >= MAX_FIGHTER_LEVEL) return showToast('Ce combattant est déjà au niveau 6.');
  const before=fighterName(fighter), after=familyLevels(familyOf(fighter))[fighter.level+1].name;
  if (!window.confirm(`Utiliser 1 protéine sur ${before}${fighter.shiny?' ✨ shiny':''} ? Il deviendra ${after}, sans utiliser de deuxième combattant.`)) return;
  fighter.level++;
  game.proteins--;
  if (fighter.shiny) game.shinyAlbum[familyOf(fighter)][fighter.level]=true;
  clearLockerSelection();
  playSound('recruit'); save(); render();
  showToast(`🥤 Évolution réussie : ${after}${fighter.shiny?' ✨ shiny':''} !`);
}
function accelerateEggTest(id) {
  if (!game.devMode) return;
  const egg=game.eggs.find(e=>e.id===id);
  if (!egg || !egg.startedAt || eggState(egg)==='ready') return;
  const elapsed=now()-egg.startedAt;
  egg.startedAt=now() - (elapsed < EGG_NORMAL_MS ? EGG_NORMAL_MS+1000 : EGG_SHINY_MS+1000);
  save();render();showToast(eggState(egg)==='glowing'?'🌟 Surprise : cet œuf est shiny !':'🥚 Éclosion prête !');
}
// Combats Baston TV : nouvelle mécanique à timing (une seule traversée par jauge).
// Quatre familles jouables : Bourrins, Ninjas, Sumos, Robots.
const FIGHT_FAMILIES = {
  boxe: {name:'Bourrins', emoji:'🥊', speed:10, speedPerLevel:2.4, hp:1, attack:1, strikes:1, parries:1, gaugeMs:1408, attackZones:[55,76,84], defenseZones:[56,76,84]},
  ninja: {name:'Ninjas', emoji:'🥷', speed:19, speedPerLevel:3.2, hp:.82, attack:.71, strikes:2, parries:1, gaugeMs:1232, attackZones:[52,75,83], defenseZones:[54,75,83]},
  sumo: {name:'Sumos', emoji:'🥋', speed:5, speedPerLevel:1.6, hp:1.5, attack:.9, strikes:1, parries:2, gaugeMs:1656, attackZones:[58,78,86], defenseZones:[58,78,86]},
  robot: {name:'Robots', emoji:'🤖', speed:8, speedPerLevel:2, hp:1.26, attack:1.06, strikes:1, parries:1, gaugeMs:1340, attackZones:[53,76,87], defenseZones:[56,77,89]}
};
const ATTACK_MULTIPLIERS = [0.5,1,1.75,0];
const DEFENSE_MULTIPLIERS = [0.20,0.35,0.75,0];
let lastOpponentFamily = null;
let combatFrame = 0;
const combatTimeouts = new Set();
function cancelCombatTimers() {
  if (combatFrame) cancelAnimationFrame(combatFrame);
  combatFrame = 0;
  for (const handle of combatTimeouts) clearTimeout(handle);
  combatTimeouts.clear();
}
function combatLater(callback, ms) {
  const handle=setTimeout(()=>{combatTimeouts.delete(handle);callback();},ms);
  combatTimeouts.add(handle);
}
function fighterStats(family, level) {
  const style=FIGHT_FAMILIES[family] || FIGHT_FAMILIES.boxe;
  return {
    hp:Math.round((83+level*27)*style.hp),
    speed:Math.round(style.speed+level*style.speedPerLevel),
    attack:Math.round((11+level*8)*style.attack),
    strikes:style.strikes, parries:style.parries
  };
}
function duelCoinReward(opponent) {
  // Récompenses entre 95 et 305 pièces : niveau + spécialité adverse.
  const familyBonus={boxe:0,ninja:20,sumo:35,robot:50};
  return 60+35*Math.max(1,Math.min(MAX_FIGHTER_LEVEL,opponent.level))+(familyBonus[opponent.family]||0);
}
function chooseDuelOpponent(playerLevel) {
  const eligible=visibleOpponentFamilies();
  const other=eligible.filter(type=>type!==lastOpponentFamily);
  const available=other.length?other:eligible;
  const family=available[Math.floor(Math.random()*available.length)];
  lastOpponentFamily=family;
  const level=Math.max(1,Math.min(MAX_FIGHTER_LEVEL,playerLevel+[-1,0,0,1][Math.floor(Math.random()*4)]));
  const names={boxe:OPPONENT_NAMES,ninja:['Ombre Éclair','Kiko l’Invisible','Ninja du Direct'],sumo:['Tonton Tatami','Gros Nuage','Sumo Tonnerre'],robot:['Bip-Bop 3000','Robo-Crochet','Le Ferrailleur']};
  return {family,level,name:names[family][Math.floor(Math.random()*names[family].length)]};
}
function familyVisual(family, level, side) {
  if (family==='boxe') return `<img class="breathing" src="${imageFor(level)}" alt="Boxeur de la famille Bourrins">${evolutionDecoration(level)}`;
  if (family==='ninja') return `<img class="breathing" src="${imageFor(level,'ninja')}" alt="Combattant Ninja">`;
  if (family==='sumo') return `<img class="breathing" src="${imageFor(level,'sumo')}" alt="Combattant Sumo">`;
  if (family==='robot') return `<img class="breathing" src="${imageFor(level,'robot')}" alt="Combattant Robot">`;
  return `<div class="fight-style-preview ninja" role="img" aria-label="Personnage ninja provisoire"><span>🥷</span><small>NINJAS</small></div>`;
}
function combatGaugeHtml() {
  const gauge=duel?.gauge;
  if (!gauge) {
    const queued=duel?.queuedGauge;
    if (queued) return `<div class="combat-ready"><h2>${queued.kind==='attack'?'🥊 Prépare ta frappe !':'🛡️ Prépare ta défense !'}</h2>
      <p class="muted">Appuie sur PRÊT quand tu es bien installé. Ensuite, la jauge partira de gauche à droite <b>une seule fois</b> : touche le bouton au bon moment.</p>
      ${queued.kind==='defense'&&FIGHT_FAMILIES[duel.playerFamily].parries>1?`<p class="combat-defense-best">🥋 Parade ${queued.attempt}/${FIGHT_FAMILIES[duel.playerFamily].parries} · Meilleure protection : ${Math.round((duel.bestDefense||0)*100)} %</p>`:''}
      <div class="combat-meter-legend"><span>⚪ Faible</span><span>🟢 Normal</span><span>🔵 Critique</span><span>🔴 Raté</span></div>
      <button type="button" class="action secondary combat-ready-button" data-action="combat-ready">🚦 PRÊT !</button></div>`;
    return `<div class="combat-waiting" aria-live="polite">${duel?.log || 'Préparation du prochain tour…'}</div>`;
  }
  const defend=gauge.kind==='defense';
  const family = defend ? duel.playerFamily : duel.playerFamily;
  const zones=(defend?FIGHT_FAMILIES[family].defenseZones:FIGHT_FAMILIES[family].attackZones);
  const [weak,green,blue]=zones;
  const names = defend ? ['20 %','35 %','75 %','0 %'] : ['50 %','100 %','175 %','0 %'];
  const labels=defend?['🛡️ Parade légère','🟩 Parade moyenne','🟦 Parade renforcée','🟥 Parade ratée']:['⬜ Coup faible','🟩 Bon coup','🟦 Coup critique','🟥 Coup raté'];
  const percentages=[weak, green-weak, blue-green, 100-blue];
  return `<div class="combat-timing-title"><strong>${defend?'🛡️ DÉFENDS-TOI !':'🥊 À TON TOUR !'}</strong><span>${defend ? `Parade ${gauge.attempt}/${gauge.totalAttempts}` : `Frappe ${duel.strikeIndex}/${duel.strikeTotal}`}</span></div>
    <p class="combat-gauge-hint">${defend?'Arrête la jauge pour réduire les dégâts.':'Arrête la jauge pour attaquer. Si tu dépasses le bleu et arrives au rouge, tu rates !'}</p>
    ${defend&&gauge.totalAttempts>1?`<p class="combat-defense-best">🥋 Sumo : deux chances de parade · Meilleure protection : ${Math.round((duel.bestDefense||0)*100)} %</p>`:''}
    <div class="combat-meter" role="progressbar" aria-label="Jauge de ${defend?'défense':'frappe'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="combat-meter">
      ${percentages.map((size,index)=>`<span class="combat-meter-zone zone-${index}" style="width:${size}%" title="${labels[index]}"></span>`).join('')}
      <span class="combat-meter-needle" id="combat-needle" style="left:0%"></span>
    </div>
    <div class="combat-meter-legend">${names.map((x,i)=>`<span>${i===0?'⚪':i===1?'🟢':i===2?'🔵':'🔴'} ${x}</span>`).join('')}</div>
    <button type="button" class="action ${defend?'secondary':'pink'} combat-stop-button" data-action="combat-tap">${defend?'🛡️ PARER !':'🥊 FRAPPER !'}</button>
    <p class="subnote combat-single-pass">La jauge ne passe qu'une fois. Appuie avant la zone rouge !</p>`;
}
function combatScreen() {
  const selected=game.fighters.find(f=>f.id===game.selectedCombatId)||[...game.fighters].sort(sortFighters)[0];
  if (!duel) return `<span class="kicker">🎬 Arène Baston TV</span><h1 class="h1">Combat au timing !</h1>
    <p class="muted">Choisis ton combattant. Styles connus : ${visibleOpponentFamilies().map(f=>({boxe:'Bourrins équilibrés',ninja:'Ninjas rapides (2 frappes)',sumo:'Sumos défensifs (2 parades)',robot:'Robots blindés (−12 % de dégâts)'}[f])).join(' · ')}.</p>
    <section class="card combat-select-panel"><h2>⚔️ Mon combattant</h2>
      <div class="combat-choice-summary">
        <img src="${imageFor(selected.level,familyOf(selected))}" alt="">
        <div><strong>${FAMILY_DATA[familyOf(selected)].icon} ${fighterName(selected)} ${selected.shiny?'✨':''}</strong>
          <small>Niveau ${selected.level} · ${FIGHT_FAMILIES[familyOf(selected)].strikes} frappe(s) / tour</small></div>
      </div>
      <button class="action secondary combat-choose-button" type="button" data-action="toggle-combat-roster" aria-expanded="${combatRosterOpen}" aria-controls="combat-roster-list">${combatRosterOpen?'✕ Fermer la liste':'🧤 Sélectionner le combattant'}</button>
      ${combatRosterOpen?`<div id="combat-roster-list" class="combat-roster" aria-label="Mes combattants, classés par niveau">${[...game.fighters].sort(sortFighters).map(f=>`<button class="combat-roster-entry ${selected?.id===f.id?'is-selected':''}" data-action="select-combat-fighter" data-fighter-id="${f.id}" type="button">
        <img src="${imageFor(f.level,familyOf(f))}" alt=""><span>${FAMILY_DATA[familyOf(f)].icon} ${fighterName(f)} ${f.shiny?'✨':''}<small>Niv. ${f.level} · ${FIGHT_FAMILIES[familyOf(f)].strikes} frappe(s) / tour</small></span>${selected?.id===f.id?'✓':''}</button>`).join('')}</div>`:''}</section>
    <div class="fight-arena fight-preview"><div class="ring-glow"></div><div class="ring-floor"></div>
      <div class="fight-actor player-actor ${selected?.shiny?'shiny-actor':''}">${familyVisual(familyOf(selected),selected.level,'player')}</div>
      <div class="fight-actor enemy-actor">${familyVisual(nextFamilyToUnlock()||FAMILY_ORDER.filter(isFamilyUnlocked).slice(-1)[0]||'boxe',Math.max(1,selected.level),'enemy')}</div><span class="ring-versus">VS</span></div>
    <button class="action" type="button" data-action="start-duel">⚡ Combattre avec ${fighterName(selected)}</button>
    <div class="tip"><b>Jauges encore accélérées de 25 % !</b> Bleu = 175 % en attaque, 75 % de parade en défense. Les Robots ont des zones bleues élargies et leur blindage. Le rouge rate l'action.</div>`;
  const end=Boolean(duel.result);
  const playerFamily=FIGHT_FAMILIES[duel.playerFamily];
  const enemyFamily=FIGHT_FAMILIES[duel.opponent.family];
  return `<div class="combat-live-layout">
    <div class="combat-live-heading"><strong>${end ? duel.result==='win'?'🏆 Victoire !':'💥 Défaite !':'⚔️ Duel en direct'}</strong><small>⚡ ${duel.playerSpeed} / ${duel.enemySpeed}</small></div>
    <div class="fight-top combat-compact-hp">
      <div class="combat-unit"><strong>${duel.playerName}</strong><div class="hpbar"><span id="combat-player-bar" style="width:${100*duel.playerHP/duel.maxPlayerHP}%"></span></div><small id="combat-player-hp">❤️ ${duel.playerHP} / ${duel.maxPlayerHP}</small></div>
      <strong class="versus-label">VS</strong>
      <div class="combat-unit right"><strong>${duel.opponent.name}</strong><div class="hpbar"><span id="combat-enemy-bar" style="width:${100*duel.enemyHP/duel.maxEnemyHP}%"></span></div><small id="combat-enemy-hp">❤️ ${duel.enemyHP} / ${duel.maxEnemyHP}</small></div>
    </div>
    <div class="fight-arena ${end?'fight-done':''}" id="fight-arena">
      <span class="fight-live">● EN DIRECT</span><div class="ring-glow"></div><div class="ring-floor"></div>
      <div class="fight-actor player-actor ${duel.shiny?'shiny-actor':''}${duel.playerFamily==='boxe'?evolutionClass(duel.level):''} ${end&&duel.result==='lose'?'knocked-out':''}" id="player-actor">${familyVisual(duel.playerFamily,duel.level,'player')}</div>
      <div class="fight-actor enemy-actor ${end&&duel.result==='win'?'knocked-out':''}" id="enemy-actor">${familyVisual(duel.opponent.family,duel.opponent.level,'enemy')}</div>
      ${!end&&duel.roundFeedback?`<div class="combat-result-banner ${duel.roundFeedback.kind}" role="status"><b>${duel.roundFeedback.title}</b><small>${duel.roundFeedback.details}</small></div>`:''}
      ${end?`<div class="fight-end-overlay ${duel.result}"><strong>${duel.result==='win'?'🏆 VICTOIRE !':'💥 DÉFAITE !'}</strong><span>${duel.result==='win'?`+${format(duel.rewardCoins)} pièces TV`:'Retente ta chance !'}</span></div>`:''}
    </div>
    ${end?'':`<section class="card combat-timing-panel" id="combat-timing-panel">${combatGaugeHtml()}</section>`}
    <p class="combat-log" id="combat-log" aria-live="polite">${duel.log}</p>
    ${end?'<button class="action" type="button" data-action="start-duel">🔁 Refaire un combat</button><button class="action secondary" data-action="choose-fighter-again" type="button">🧤 Changer de combattant</button><button class="action secondary" data-action="go-gym" type="button">🥊 Retour à l’entraînement</button>':''}
    <p class="subnote">${playerFamily.emoji} ${playerFamily.name} : ${playerFamily.strikes} frappe(s) · ${playerFamily.parries} parade(s). ${enemyFamily.emoji} ${enemyFamily.name} : ${enemyFamily.strikes} frappe(s) · ${enemyFamily.parries} parade(s).</p>
  </div>`;
}
function startDuel() {
  cancelCombatTimers();
  const selected=game.fighters.find(f=>f.id===game.selectedCombatId)||[...game.fighters].sort(sortFighters)[0];
  if(!selected)return;
  const level=selected.level;
  const family=familyOf(selected);
  const opponent=chooseDuelOpponent(level);
  const p=fighterStats(family,level),e=fighterStats(opponent.family,opponent.level);
  const first=p.speed===e.speed?(Math.random()<.5?'player':'enemy'):(p.speed>e.speed?'player':'enemy');
  duel={level,shiny:Boolean(selected.shiny),playerFamily:family,playerName:fighterName(selected),opponent,
    maxPlayerHP:p.hp,playerHP:p.hp,maxEnemyHP:e.hp,enemyHP:e.hp,
    playerSpeed:p.speed,enemySpeed:e.speed,attacker:first,strikeIndex:1,
    strikeTotal:first==='player'?p.strikes:e.strikes,gauge:null,incoming:null,
    bestDefense:0,phase:'waiting',result:null,rewardCoins:duelCoinReward(opponent),roundFeedback:null,
    log:`⚡ ${first==='player'?'Tu es le plus rapide : commence !':`${opponent.name} est plus rapide : prépare ta défense !`}`};
  currentView='combat';render();window.scrollTo({top:0,behavior:'instant'});
  const fight=duel;combatLater(()=>{if(duel===fight&&!duel.result)startCombatStrike();},750);
}

function refreshDuelUI() {
  if(!duel||currentView!=='combat')return;
  for(const side of ['player','enemy']){
    const value=duel[side+'HP'];
    const total=duel[side==='player'?'maxPlayerHP':'maxEnemyHP'];
    const bar=document.getElementById('combat-'+side+'-bar');
    const label=document.getElementById('combat-'+side+'-hp');
    if(bar) bar.style.width=`${Math.max(0,100*value/total)}%`;
    if(label)label.textContent=`❤️ ${value} / ${total}`;
  }
}
function floatingDamage(side,amount) {
  const actor=document.getElementById(side+'-actor');
  const arena=document.getElementById('fight-arena');
  if(!actor||!arena)return;
  const frame=arena.getBoundingClientRect(),target=actor.getBoundingClientRect();
  const bubble=document.createElement('span');
  bubble.className='floating-damage';
  bubble.textContent=`−${amount}`;
  bubble.style.left=`${target.left-frame.left+target.width*.5}px`;
  bubble.style.top=`${Math.max(20,target.top-frame.top+target.height*.12)}px`;
  bubble.style.transform='translateX(-50%)';
  arena.appendChild(bubble);
  combatLater(()=>bubble.remove(),850);
}
function finishDuel(result) {
  if(!duel||duel.result)return;
  cancelCombatTimers();
  duel.result=result; duel.phase='finished'; duel.gauge=null;
  duel.log=result==='win'?`🏆 Tu remportes ${format(duel.rewardCoins)} pièces contre ${duel.opponent.name} !`:'💥 Ce duel est perdu. Tes combattants restent dans ta collection.';
  if(result==='win'){
    game.coins+=duel.rewardCoins;game.combatWins++;
    if(game.combatWins%WINS_PER_EGG===0)game.pendingCombatEggs++;
    if(game.combatWins%2===0)game.gems+=2;
    save();
  }
  playSound(result==='win'?'win':'lose');render();
  showToast(result==='win'?(game.combatWins%WINS_PER_EGG===0?`🏆 +${format(duel.rewardCoins)} pièces, un œuf à récupérer !`:`🏆 +${format(duel.rewardCoins)} pièces TV !`):'💥 Défaite. Pas de boxeur perdu.');
}
function startCombatStrike() {
  if(!duel||duel.result||currentView!=='combat')return;
  const fight=duel;
  const actor=duel.attacker;
  const family=actor==='player'?duel.playerFamily:duel.opponent.family;
  duel.phase='waiting';duel.gauge=null;duel.roundFeedback=null;
  if(actor==='player') {
    duel.log=`🥊 À toi ! ${duel.strikeIndex}/${duel.strikeTotal} frappe(s) : vise le vert ou tente le bleu !`;
    queueCombatGauge('attack');
  } else {
    const attack=aiGrade('attack',family,duel.opponent.level);
    const multiplier=ATTACK_MULTIPLIERS[attack];
    const base=fighterStats(family,duel.opponent.level).attack;
    duel.incoming={grade:attack,multiplier,base};
    if(!multiplier){
      duel.log=`${duel.opponent.name} rate sa frappe (${duel.strikeIndex}/${duel.strikeTotal}) : tu ne prends aucun dégât !`;
      duel.roundFeedback={kind:'miss',title:'🔴 RATÉ ENNEMI',details:'0 dégât reçu · Aucune parade nécessaire'};
      render();playSound('miss');combatLater(()=>{if(duel===fight)advanceCombatTurn();},COMBAT_RESULT_HOLD_MS);
      return;
    }
    duel.log=`${duel.opponent.name} attaque (${duel.strikeIndex}/${duel.strikeTotal}) ! Prépare ta parade.`;
    duel.bestDefense=0;
    combatLater(()=>{if(duel===fight&&!duel.result)queueCombatGauge('defense',1);},460);
    render();
  }
}
function aiGrade(kind,family,level) {
  // Les zones ne sont pas choisies systématiquement en fonction de leur taille :
  // une IA imparfaite peut réussir un critique, mais aussi rater son coup.
  const profile=FIGHT_FAMILIES[family];
  const marks=kind==='attack'?profile.attackZones:profile.defenseZones;
  const roll=Math.random();
  const rank=roll<.17?3:roll<.29?2:roll<.64?1:0;
  const lo=rank===0?0:marks[rank-1],hi=rank===3?100:marks[rank];
  return timingGrade(kind,family,(lo+hi)/2);
}
function timingGrade(kind,family,progress) {
  const profile=FIGHT_FAMILIES[family];
  const marks=kind==='attack'?profile.attackZones:profile.defenseZones;
  return progress<marks[0]?0:progress<marks[1]?1:progress<marks[2]?2:3;
}
function queueCombatGauge(kind,attempt=1) {
  if (!duel||duel.result||currentView!=='combat')return;
  duel.queuedGauge={kind,attempt};duel.phase='ready';duel.gauge=null;
  render();
}
function activateCombatGauge(){
  if(!duel?.queuedGauge||duel.result||currentView!=='combat')return;
  const queued=duel.queuedGauge;duel.queuedGauge=null;
  window.scrollTo({top:0,behavior:'instant'});
  beginCombatGauge(queued.kind,queued.attempt);
}
function beginCombatGauge(kind,attempt=1) {
  if(!duel||duel.result||currentView!=='combat')return;
  if(combatFrame)cancelAnimationFrame(combatFrame);
  const family=duel.playerFamily;
  const profile=FIGHT_FAMILIES[family];
  const gauge={kind,attempt,totalAttempts:kind==='defense'?profile.parries:1,
    startedAt:performance.now(),duration:Math.round(profile.gaugeMs / 1.25),token:Math.random()};
  duel.phase=kind;duel.gauge=gauge;
  render();
  function tick(){
    if(!duel||duel.gauge!==gauge||duel.result||currentView!=='combat')return;
    const pct=Math.min(100,100*(performance.now()-gauge.startedAt)/gauge.duration);
    const needle=document.getElementById('combat-needle');
    const meter=document.getElementById('combat-meter');
    if(needle)needle.style.left=`${pct}%`;
    if(meter)meter.setAttribute('aria-valuenow',String(Math.round(pct)));
    if(pct>=100){completeCombatGauge(100,true);return;}
    combatFrame=requestAnimationFrame(tick);
  }
  combatFrame=requestAnimationFrame(tick);
}
function tapCombatGauge(){
  if(!duel||!duel.gauge||duel.result||currentView!=='combat')return;
  const gauge=duel.gauge;
  const pct=Math.min(100,100*(performance.now()-gauge.startedAt)/gauge.duration);
  completeCombatGauge(pct,false);
}
function completeCombatGauge(progress,timedOut){
  const fight=duel;
  if(!fight||!fight.gauge||fight.result)return;
  const gauge=fight.gauge;
  const kind=gauge.kind;
  const grade=timedOut?3:timingGrade(kind,fight.playerFamily,progress);
  const fraction=(kind==='attack'?ATTACK_MULTIPLIERS:DEFENSE_MULTIPLIERS)[grade];
  if(combatFrame)cancelAnimationFrame(combatFrame);
  combatFrame=0;fight.gauge=null;fight.phase='resolving';
  if(kind==='attack')resolvePlayerAttack(grade,fraction);
  else resolvePlayerDefense(gauge,grade,fraction);
}
function combatDamage(side,amount,message,isHeavy=false,feedback=null){
  const fight=duel;if(!fight||fight.result)return;
  fight[side+'HP']=Math.max(0,fight[side+'HP']-amount);
  fight.log=message;
  fight.roundFeedback=feedback;
  render();
  const actor=document.getElementById(side+'-actor');
  const attacker=document.getElementById((side==='enemy'?'player':'enemy')+'-actor');
  if(attacker)attacker.classList.add(isHeavy?'uppercut':'jabbing');
  if(actor&&amount)actor.classList.add('taking-hit');
  if(amount){
    playSound(side==='enemy'?'jab':'enemy');
    impactEffect(document.getElementById('fight-arena'),isHeavy?'CRITIQUE !':'POW !',side==='enemy'?'right':'left',isHeavy);
    floatingDamage(side,amount);
  } else playSound('miss');
  refreshDuelUI();
  if(!fight[side+'HP']){
    combatLater(()=>{if(duel===fight)finishDuel(side==='enemy'?'win':'lose');},COMBAT_RESULT_HOLD_MS);
  } else combatLater(()=>{if(duel===fight&&!fight.result)advanceCombatTurn();},COMBAT_RESULT_HOLD_MS);
}
function resolvePlayerAttack(grade,factor){
  if(!duel)return;
  const p=fighterStats(duel.playerFamily,duel.level);
  const eFamily=duel.opponent.family;
  const eProfile=FIGHT_FAMILIES[eFamily];
  const guard=Math.max(...Array.from({length:eProfile.parries},()=>DEFENSE_MULTIPLIERS[aiGrade('defense',eFamily,duel.opponent.level)]));
  const amount=factor>0?Math.max(1,Math.round(p.attack*factor*(1-guard))):0;
  const label=grade===2?'🔵 CRITIQUE':grade===1?'🟢 BON COUP':grade===0?'⚪ Coup faible':'🔴 RATÉ';
  combatDamage('enemy',amount,`${label} · ${amount} dégâts · L'adversaire a bloqué ${Math.round(guard*100)} %.`,grade===2,{kind:grade===2?'critical':grade===3?'miss':grade===1?'success':'weak',title:label,details:`${amount} dégâts infligés · Blocage ennemi : ${Math.round(guard*100)} %`});
}
function resolvePlayerDefense(gauge,grade,protection){
  if(!duel||!duel.incoming)return;
  duel.bestDefense=Math.max(duel.bestDefense,protection);
  if(gauge.attempt<gauge.totalAttempts){
    duel.log=`🛡️ Première parade : ${Math.round(protection*100)} % de protection. Tu peux tenter une deuxième fois !`;
    duel.roundFeedback={kind:grade===2?'critical':grade===3?'miss':'success',title:grade===2?'🔵 SUPER PARADE':grade===3?'🔴 PARADE RATÉE':'🛡️ PARADE RÉUSSIE',details:`${Math.round(protection*100)} % de protection · Une deuxième chance !`};
    const fight=duel;
    render();
    combatLater(()=>{if(duel===fight&&!fight.result){duel.roundFeedback=null;queueCombatGauge('defense',gauge.attempt+1);}},1150);
    return;
  }
  const original=duel.incoming;
  const robotArmor=duel.playerFamily==='robot'?0.12:0;
  const amount=Math.max(1,Math.round(original.base*original.multiplier*(1-duel.bestDefense)*(1-robotArmor)));
  const guarded=Math.round(duel.bestDefense*100);
  const critical=original.multiplier===1.75;
  duel.incoming=null;
  combatDamage('player',amount,`${guarded>=75?'🟦 SUPER PARADE':guarded===0?'🟥 Aucune parade':'🛡️ Parade à '+guarded+' %'} · ${amount} dégât(s) subi(s)${critical?' · Attaque critique ennemie !':''}`,critical,{kind:guarded>=75?'critical':guarded===0?'miss':'success',title:guarded>=75?'🔵 SUPER PARADE':guarded===0?'🔴 PARADE RATÉE':'🛡️ PARADE RÉUSSIE',details:`${amount} dégâts reçus · ${guarded} % bloqués${robotArmor?' · Blindage −12 %':''}${critical?' · Critique adverse !':''}`});
}
function advanceCombatTurn(){
  if(!duel||duel.result||currentView!=='combat')return;
  if(duel.strikeIndex<duel.strikeTotal){duel.strikeIndex++;}
  else {
    duel.attacker=duel.attacker==='player'?'enemy':'player';
    duel.strikeIndex=1;
    const family=duel.attacker==='player'?duel.playerFamily:duel.opponent.family;
    duel.strikeTotal=FIGHT_FAMILIES[family].strikes;
  }
  startCombatStrike();
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
    <p class="subnote">Version 0.20 · Sauvegarde locale dans ce navigateur. Les codes sont visibles dans les fichiers publics du jeu : ils ne constituent pas une protection sécurisée.</p>`;
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
  if (code==='test0.12' || code==='test0.13') {
    if (redeemedCodes.includes(code)) return showToast('Ce code a déjà été utilisé sur cet appareil.');
    game.gems += 100;
    redeemedCodes.push(code);
    try {localStorage.setItem(REDEEMED_CODES_KEY,JSON.stringify(redeemedCodes));} catch (_) {}
    save(); render(); playSound('recruit'); showToast('🎁 Code accepté : +100 gemmes !');
  } else if (code==='dev0.12' || code==='dev0.13') {
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
  cancelCombatTimers(); game=freshSave(); training=null; duel=null; latestReward=null; viewerShift=0; viewerDelta=0;
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
  if (duel && currentView === 'combat' && next !== 'combat' && !duel.result) {
    if (!window.confirm('Quitter le combat en cours ? Tu n’obtiendras pas de récompense pour ce duel.')) return;
    cancelCombatTimers(); duel = null;
  }
  if(duel?.result && (next!=='combat'||currentView==='combat')){cancelCombatTimers();duel=null;}
  clearLockerSelection();
  combatRosterOpen=false;
  currentView = next;
  render();
  window.scrollTo({top:0,behavior:"instant"});
}
function upgrade() {
  const family=game.selectedChannel,cost=nextChannelUpgradeCost(family);
  if(!isFamilyUnlocked(family)||!cost||game.coins<cost)return;
  advanceCoins(); if(game.coins<cost)return;
  game.coins-=cost;game.channelLevels[family]++;
  save();render();showToast(`📺 ${FAMILY_DATA[family].channel} niveau ${channelLevel(family)} : +${channelBonusPercent(family)} % !`);
}
function unlockFamily(family) {
  if (family!==nextFamilyToUnlock() || isFamilyUnlocked(family)) return showToast('Débloque d’abord la chaîne précédente.');
  const info=FAMILY_DATA[family],cost=info.unlockCost;
  advanceCoins();
  if(game.coins<cost)return showToast(`Il manque ${format(cost-game.coins)} pièces pour débloquer ${info.name}.`);
  game.coins-=cost;
  game.unlockedFamilies[family]=true;
  game.channelLevels[family]=Math.max(1,game.channelLevels[family]||1);
  const first={id:getNewId(),family,level:1,shiny:false};
  game.fighters.push(first);
  game.selectedChannel=family;game.selectedLockerFamily=family;game.selectedGymFamily=family;
  game.gymCompanionId=null;
  save();render();playSound('recruit');showToast(`${info.icon} ${info.channel} débloquée ! ${fighterName(first)} rejoint ton équipe.`);
}

function selectFamily(screen,family) {
  if(!FAMILY_ORDER.includes(family))return;
  if(screen==='home'&&!isFamilyUnlocked(family)&&family!==nextFamilyToUnlock())return;
  if(screen!=='home'&&!isFamilyUnlocked(family))return showToast('Débloque cette famille sur la page TV !');
  const key={home:'selectedChannel',gym:'selectedGymFamily',collection:'selectedLockerFamily'}[screen];
  if(!key)return;
  game[key]=family; if(screen==='gym')game.gymCompanionId=null;
  if(screen==='home'){viewerShift=0;viewerDelta=0;}
  save();render();
}
function selectCombatFighter(id) {
  if(duel)return;
  const f=fighterById(id);if(!f)return;
  game.selectedCombatId=id;combatRosterOpen=false;save();render();
}

function startTraining() {
  const family=game.selectedGymFamily;
  if(!isFamilyUnlocked(family))return;
  const cost=trainingCost(family);
  if (training || game.coins < cost) return;
  game.coins -= cost;
  game.sessions++;
  game.sessionsByFamily[family]++;
  const chosen = gymCompanion();
  training = {family, start: performance.now(), end: performance.now() + TRAINING_MS, next: 0, hits: 0, misses: 0, wrongClicks: 0, combo: 0, best: 0, spotX: 50, spotY: 45,
    companion: chosen ? { id:chosen.id, family:familyOf(chosen), level:chosen.level, shiny:Boolean(chosen.shiny) } : null };
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
  const hangingBag = document.querySelector('#bag-swing');
  const boxer = document.querySelector('#gym-boxer');
  if (hangingBag) {hangingBag.classList.remove('bag-swing-hit'); void hangingBag.offsetWidth; hangingBag.classList.add('bag-swing-hit');}
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
function chooseEquipment(family) {
  const equipment=familyEquipment(family),inventory=inventoryFor(family);
  const missing=equipment.filter(item=>inventory[item.id]===0);
  const list=missing.length&&Math.random()<.55?missing:equipment;
  return list[Math.floor(Math.random()*list.length)].id;
}
function finishTraining() {
  if(!training)return;
  const {hits,best,family}=training;
  let total=hits<5?0:hits<11?1:2;
  if(training.misses===0&&best>=10)total++;
  if(training.misses===0&&best>=16)total++;
  total=Math.min(total,4);
  const items=[],inventory=inventoryFor(family);
  for(let i=0;i<total;i++) {const id=chooseEquipment(family);inventory[id]++;items.push(id);}
  latestReward={hits,best,items,family,misses:training.misses};
  playSound(total>=3?'combo':total===0?'lose':'recruit');
  training=null;save();render();
  showTrainingRewards(latestReward);
  showToast(total?`${total} équipement(s) ${FAMILY_DATA[family].name} gagné(s) !`:'Aucun équipement : essaie de faire un meilleur combo.');
}
// Petit bilan visuel immédiat, qui se ferme automatiquement après 3,5 s.
let trainingRewardTimer=null;
function showTrainingRewards(reward) {
  const dialog=document.getElementById('training-reward-dialog');
  const title=document.getElementById('training-reward-title');
  const body=document.getElementById('training-reward-items');
  if(!dialog||!title||!body||!reward)return;
  clearTimeout(trainingRewardTimer);
  const items=familyEquipment(reward.family);
  const tally=new Map();
  for(const id of reward.items)tally.set(id,(tally.get(id)||0)+1);
  title.textContent=`🎁 ${reward.items.length} équipement${reward.items.length===1?'':'s'} gagné${reward.items.length===1?'':'s'} !`;
  body.innerHTML=reward.items.length?[...tally].map(([id,count])=>{
    const item=items.find(x=>x.id===id);
    return `<div class="training-reward-item"><span>${item?.icon||'🎁'}</span><strong>${item?.label||id}</strong><b>×${count}</b></div>`;
  }).join(''):'<p>Pas d’équipement cette fois. Essaie de faire un meilleur combo !</p>';
  try { if(!dialog.open)dialog.showModal(); } catch(_) { return; }
  trainingRewardTimer=setTimeout(()=>{if(dialog.open)dialog.close();},3500);
}

function recruit() {
  const family=game.selectedLockerFamily,items=familyEquipment(family),inventory=inventoryFor(family);
  if(!isFamilyUnlocked(family)||!items.every(item=>inventory[item.id]>0))return;
  items.forEach(item=>inventory[item.id]--);
  const fighter={id:getNewId(),family,level:1,shiny:false};
  game.fighters.push(fighter);
  playSound('recruit');save();render();showToast(`${FAMILY_DATA[family].icon} ${fighterName(fighter)} recruté !`);
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
    case "choose-fighter-again": if(duel?.result){cancelCombatTimers();duel=null;combatRosterOpen=false;render();} break;
    case "combat-tap": tapCombatGauge(); break;
    case "combat-ready": activateCombatGauge(); break;
    case "upgrade": upgrade(); break;
    case "unlock-family": unlockFamily(target.dataset.family); break;
    case "select-channel": selectFamily('home',target.dataset.family); break;
    case "select-gym-family": selectFamily('gym',target.dataset.family); break;
    case "select-locker-family": selectFamily('collection',target.dataset.family); break;
    case "toggle-combat-roster": if(!duel){combatRosterOpen=!combatRosterOpen;render();} break;
    case "select-combat-fighter": selectCombatFighter(target.dataset.fighterId); break;
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
    case "claim-free-shop-egg": claimFreeShopEgg(); break;
    case "buy-egg": buyEgg(target.dataset.kind); break;
    case "buy-protein": buyProtein(); break;
    case "use-protein": useProtein(); break;
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

const initialAbsenceMs=Math.max(0,now()-(game.lastTick||now()));
const offlineCoins = advanceCoins();
save(); render();
if(initialAbsenceMs>=OFFLINE_RECAP_THRESHOLD_MS) showOfflineRecap(initialAbsenceMs,offlineCoins);
else if (offlineCoins > 1) setTimeout(() => showToast(`Pendant ton absence : +${format(offlineCoins)} pièces TV !`), 500);
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
setInterval(animateStudioTV, 3350);
setInterval(()=>{if(!document.hidden && currentView==='home')tickAudience();},3200);
function updateEggClocks() {
  if(document.hidden || currentView!=='later') return;
  const remaining=freeShopEggRemaining();
  const freeTimer=document.getElementById('shop-free-timer');
  const freeButton=document.getElementById('shop-free-claim');
  if(freeTimer) freeTimer.textContent=remaining?readableDuration(remaining):'Disponible !';
  if(freeButton) {
    const full=game.eggs.length>=EGG_CAP;
    freeButton.disabled=remaining>0 || full;
    freeButton.textContent=full?'Stock plein':remaining?'Patiente…':'Réclamer';
  }
  let stateChanged=false;
  for (const egg of game.eggs) {
    if (!egg.startedAt) continue;
    const countdown=document.querySelector(`[data-egg-countdown="${egg.id}"]`);
    if(countdown) countdown.textContent=readableDuration(eggTimeLeft(egg));
    const slot=document.querySelector(`[data-egg-slot="${egg.id}"]`);
    if(slot && slot.dataset.eggState!==eggState(egg)) stateChanged=true;
  }
  // Une transition d'incubation change les boutons, mais une liste ouverte
  // ne doit jamais être détruite sous le doigt de l'utilisateur.
  if(stateChanged) render();
}
setInterval(updateEggClocks,1000);
let combatHiddenAt = 0;
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    save();
    if(duel?.gauge) combatHiddenAt=performance.now();
  } else {
    const absenceMs=Math.max(0,now()-(game.lastTick||now()));
    const gained=advanceCoins();updateLiveLabels();save();
    if(absenceMs>=OFFLINE_RECAP_THRESHOLD_MS) showOfflineRecap(absenceMs,gained);
    if(combatHiddenAt && duel?.gauge) duel.gauge.startedAt+=performance.now()-combatHiddenAt;
    combatHiddenAt=0;
  }
  syncCrowdAudio();
});
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
