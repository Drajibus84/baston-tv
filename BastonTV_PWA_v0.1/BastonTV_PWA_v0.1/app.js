/* Baston TV — Prototype 0.1. Aucun framework, ni serveur, ni compte requis. */
"use strict";

const SAVE_KEY = "bastontv-save-v01";
const TRAINING_COST = 100;
const TRAINING_MS = 20_000;
const SPOT_LIFETIME_MS = 1_150;
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1_000;
const LEVELS = [null,
  { name: "Le Paumé", income: 5 },
  { name: "Le Balourd", income: 12 },
  { name: "Le Cogneur", income: 30 },
  { name: "Le Titan", income: 75 }
];
const EQUIPMENT = [
  { id: "gants", label: "Gants", icon: "🥊" },
  { id: "bandeau", label: "Bandeau", icon: "🎗️" },
  { id: "short", label: "Short", icon: "🩳" },
  { id: "chaussures", label: "Chaussures", icon: "👟" }
];
const now = () => Date.now();
const format = n => Math.floor(n).toLocaleString("fr-FR");
const imageFor = level => `./assets/boxeur-${level}.webp`;
const getNewId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function freshSave() {
  return {
    coins: 600,
    studioLevel: 1,
    lastTick: now(),
    equipment: Object.fromEntries(EQUIPMENT.map(x => [x.id, 0])),
    fighters: [{ id: getNewId(), level: 1 }],
    sessions: 0
  };
}
function loadSave() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (value && typeof value.coins === "number" && Array.isArray(value.fighters) && value.equipment && value.studioLevel) return value;
  } catch (_) { /* stockage désactivé ou ancienne sauvegarde invalide */ }
  return freshSave();
}
let game = loadSave();
let currentView = "home";
let training = null;
let latestReward = null;
let toastTimeout = null;

function incomePerMinute() {
  const twoBest = [...game.fighters].sort((a, b) => b.level - a.level).slice(0, 2);
  const basic = twoBest.reduce((sum, fighter) => sum + LEVELS[fighter.level].income, 0);
  return basic * (1 + .25 * (game.studioLevel - 1));
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
  return [...game.fighters].sort((a, b) => b.level - a.level).slice(0, 2);
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
      <span class="live-label">● EN DIRECT</span><div class="stage-logo">BASTON <span>TV</span></div>
      <div class="on-air">${onAir.map(f => `<div class="fighter-onair"><img src="${imageFor(f.level)}" alt="${LEVELS[f.level].name}"><strong>${LEVELS[f.level].name}</strong></div>`).join("")}
      ${onAir.length < 2 ? '<div class="empty-slot">Place libre</div>' : ''}</div>
    </div>
    <div class="stat-grid"><div class="stat"><small>📈 Revenus TV</small><b id="rate-live">+${format(incomePerMinute())}/min</b><small>En jeu et hors ligne (8 h max.)</small></div>
    <div class="stat"><small>🎬 Niveau du studio</small><b>${game.studioLevel}</b><small>Bonus : +${25 * (game.studioLevel - 1)} %</small></div></div>
    <button type="button" class="action secondary" data-action="go-gym">🥊 Aller s'entraîner</button>
    <section class="card"><h2>🔧 Améliorer le studio</h2><p class="muted">Augmente de 25 % les revenus de tes émissions. Les nouvelles évolutions rapportent encore plus.</p>
    <div class="price"><span>Coût du prochain niveau</span><span>🪙 ${format(nextCost)}</span></div>
    <button class="action" type="button" data-action="upgrade" ${game.studioLevel >= 5 || Math.floor(game.coins) < nextCost ? "disabled" : ""}>${game.studioLevel >= 5 ? "Niveau maximal du prototype" : "Améliorer (+25 %)"}</button></section>
    <div class="tip"><strong>💡 Astuce :</strong> deux Paumés rapportent 10 pièces/min. En les fusionnant, un Balourd rapporte 12 pièces/min, tout en libérant une place à l'antenne !</div>`;
}
function gymScreen() {
  if (training) return `<span class="kicker">🥊 Entraînement en cours</span><h1 class="h1">Frappe les points faibles !</h1>
    <div class="train-stat"><span>⏱ <span id="training-timer">20,0</span> s</span><span>⭐ <span id="training-hits">0</span> touches</span><span>🔥 Combo <span id="training-combo">0</span></span></div>
    <div class="progress"><span id="training-progress" style="width:100%"></span></div>
    <div class="bag-arena" style="margin-top:12px"><div class="bag-cable"></div><div class="bag" id="bag"><button class="spot" id="spot" data-action="hit" aria-label="Frapper le point faible" style="left:50%;top:45%"></button></div></div>
    <p class="muted">Le point faible change d'emplacement. Touche-le rapidement avant qu'il disparaisse !</p>`;
  const result = latestReward ? `<section class="card"><h2>🎁 Dernière séance</h2><p class="muted">${latestReward.hits} point(s) touché(s) · meilleur combo : ${latestReward.best}</p><div class="reward-list">${latestReward.items.map(id => `<span class="reward-bubble">${EQUIPMENT.find(x => x.id === id).icon} ${EQUIPMENT.find(x => x.id === id).label}</span>`).join("")}</div></section>` : "";
  return `<span class="kicker">🎯 Les coulisses</span><h1 class="h1">Salle d'entraînement</h1>
    <p class="muted">Un point faible apparaît sur le sac de frappe puis change de place. Plus tu le touches vite, plus tu gagnes d'équipements pour recruter des boxeurs.</p>
    <div class="bag-arena"><div class="bag-cable"></div><div class="bag"><div class="spot" style="left:49%;top:34%;pointer-events:none"></div></div></div>
    <div class="stat-grid"><div class="stat"><small>⏱ Durée</small><b>20 s</b></div><div class="stat"><small>🪙 Prix</small><b>100</b></div></div>
    <button class="action" type="button" data-action="start-training" ${Math.floor(game.coins) < TRAINING_COST ? "disabled" : ""}>🥊 Commencer la séance</button>
    ${Math.floor(game.coins) < TRAINING_COST ? '<p class="subnote">Pas assez de pièces. Laisse ta chaîne en produire un peu, puis reviens !</p>' : ''}
    ${result}
    <div class="tip"><strong>Comment ça marche ?</strong> Une séance donne 1 à 4 équipements selon ton score, avec un bonus possible pour une série de 5 touches. Pas besoin de réussir toutes les cibles.</div>`;
}
function collectionScreen() {
  const ready = EQUIPMENT.every(item => game.equipment[item.id] > 0);
  const counts = [1,2,3].map(level => ({ level, count: game.fighters.filter(f => f.level === level).length })).filter(f => f.count >= 2);
  const fightersByLevel = [1,2,3,4].map(level => ({ level, count: game.fighters.filter(f => f.level === level).length })).filter(x => x.count > 0);
  return `<span class="kicker">🧤 Les coulisses</span><h1 class="h1">Vestiaires & fusions</h1>
    <p class="muted">Récupère un exemplaire de chaque équipement pour recruter un Paumé. Fusionne ensuite deux combattants de même évolution.</p>
    <section class="card"><h2>🎁 Équipements de boxe</h2><div class="eq-grid">${EQUIPMENT.map(item => `<div class="eq-item ${game.equipment[item.id] > 0 ? 'ready' : ''}"><span>${item.icon} ${item.label}</span><b>×${game.equipment[item.id]}</b></div>`).join("")}</div>
    <button class="action" type="button" data-action="recruit" ${ready ? '' : 'disabled'}>✨ Recruter un Paumé</button><p class="subnote">Recrutement : consomme un équipement de chaque type.</p></section>
    <section class="card"><h2>🥊 Mes combattants (${game.fighters.length})</h2><div class="fighter-grid">${fightersByLevel.map(f => `<div class="fighter-card"><img src="${imageFor(f.level)}" alt="${LEVELS[f.level].name}"><b>${LEVELS[f.level].name}</b><small>Évolution ${f.level} · possédés : ${f.count}</small></div>`).join("")}</div></section>
    <section class="card"><h2>🔗 Salle de fusion</h2><p class="muted">2 exemplaires identiques deviennent un combattant de l'évolution supérieure. Les fusions sont gratuites.</p>
    ${counts.length ? counts.map(f => `<div class="fusion-line"><span>2 × ${LEVELS[f.level].name}<br>→ ${LEVELS[f.level+1].name}</span><button type="button" data-action="fusion" data-level="${f.level}">Fusionner</button></div>`).join("") : '<p class="muted">Pas encore de fusion disponible. Recrute un deuxième boxeur !</p>'}</section>`;
}
function laterScreen() {
  return `<span class="kicker">🚧 Prochaines mises à jour</span><h1 class="h1">Le studio s'agrandira !</h1>
    <section class="card soon"><div class="big">🥚</div><h2>Incubateur & shinies</h2><p class="muted">Bientôt : un œuf gratuit chaque jour, trois emplacements maximum, 30 % de chance de shiny et révélation après 30 minutes.</p></section>
    <section class="card soon"><div class="big">🏆</div><h2>Combats & championnats</h2><p class="muted">Bientôt : équipes de trois, QTE, remplacement volontaire et sept disciplines.</p></section>
    <p class="subnote">Ces fonctionnalités font partie du cahier des charges, mais pas encore de ce prototype.</p>`;
}
function render() {
  const screen = document.querySelector("#screen");
  screen.innerHTML = ({home:homeScreen,gym:gymScreen,collection:collectionScreen,later:laterScreen})[currentView]();
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === currentView;
    button.classList.toggle("selected", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  updateLiveLabels();
}
function updateLiveLabels() {
  const coins = document.querySelector("#coins-live");
  if (coins) coins.textContent = format(game.coins);
  const rate = document.querySelector("#rate-live");
  if (rate) rate.textContent = `+${format(incomePerMinute())}/min`;
}
function changeView(next) {
  if (training) { showToast("Termine ta séance avant de changer de salle !"); return; }
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
  if (training || game.coins < TRAINING_COST) return;
  game.coins -= TRAINING_COST;
  game.sessions++;
  training = { start: performance.now(), end: performance.now() + TRAINING_MS, next: 0, hits: 0, misses: 0, combo: 0, best: 0 };
  latestReward = null;
  save(); render();
  moveSpot();
}
function moveSpot() {
  if (!training) return;
  const spot = document.querySelector("#spot");
  if (!spot) return;
  spot.style.left = `${26 + Math.random() * 48}%`;
  spot.style.top = `${17 + Math.random() * 63}%`;
  spot.style.animation = "none";
  void spot.offsetWidth;
  spot.style.animation = "";
  training.next = performance.now() + SPOT_LIFETIME_MS;
}
function hitSpot() {
  if (!training || performance.now() >= training.end) return;
  training.hits++;
  training.combo++;
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
  const total = Math.min(5, (hits >= 12 ? 4 : hits >= 8 ? 3 : hits >= 4 ? 2 : 1) + (best >= 5 ? 1 : 0));
  const items = [];
  for (let i = 0; i < total; i++) {
    const id = chooseEquipment();
    game.equipment[id]++;
    items.push(id);
  }
  latestReward = {hits,best,items};
  training = null;
  save(); render();
  showToast(`${total} équipement(s) gagné(s) ! Va voir les vestiaires.`);
}
function recruit() {
  if (!EQUIPMENT.every(item => game.equipment[item.id] > 0)) return;
  EQUIPMENT.forEach(item => game.equipment[item.id]--);
  game.fighters.push({id:getNewId(),level:1});
  save();render();showToast("Nouveau combattant recruté : Le Paumé !");
}
function fuse(level) {
  if (![1,2,3].includes(level)) return;
  const pair = game.fighters.filter(f=>f.level===level).slice(0,2);
  if (pair.length < 2) return;
  const removed = new Set(pair.map(f=>f.id));
  game.fighters = game.fighters.filter(f=>!removed.has(f.id));
  game.fighters.push({id:getNewId(),level:level+1});
  save();render();showToast(`Fusion réussie : ${LEVELS[level+1].name} !`);
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-view]");
  if (nav) {changeView(nav.dataset.view);return;}
  const target = event.target.closest("[data-action]");
  if (!target) return;
  switch(target.dataset.action) {
    case "go-gym": changeView("gym"); break;
    case "upgrade": upgrade(); break;
    case "start-training": startTraining(); break;
    case "hit": hitSpot(); break;
    case "recruit": recruit(); break;
    case "fusion": fuse(Number(target.dataset.level)); break;
  }
});

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
      if (time >= training.next) { training.misses++;training.combo=0;moveSpot(); }
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
document.addEventListener("visibilitychange",()=>{ if(document.hidden) save(); else {advanceCoins(); updateLiveLabels();} });
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
