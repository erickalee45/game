const ROSTER = [
  {
    id: "neutrophil",
    name: "Neutrophil",
    maxHp: 100,
    hp: 100,
    stunned: false,
    attackMin: 10,
    attackMax: 20,
    sprite: {
      type: "animated",
      frames: ["assets/neutrophil/frame-0.png", "assets/neutrophil/frame-1.png", "assets/neutrophil/frame-2.png"],
      frameDurationMs: 500
    },
    // Canon height 5'9" — the baseline the other two fighters scale up from.
    spriteSize: 96,
    type: "phagocyte",
    weakAgainst: ["virus"],
    // "idle" here is the battle-facing pose (forward, toward the enemy) — the true idle
    // pose is cutscene-only now and lives in CUTSCENE_CHARACTERS.neutrophil.portrait instead.
    portrait: { idle: "assets/neutrophil/battle-portrait.png", hurt: "assets/neutrophil/hurt-portrait.png" },
    // Corrosive Blood: after an enemy attacks him, reflect ~3-5% of the enemy's max HP back.
    passive: { type: "corrosiveBlood", minPercent: 0.03, maxPercent: 0.05 },
    moves: [
      {
        id: "slash",
        name: "Slash",
        description: "Slash them.",
        damageMultiplier: 1,
        isAvailable: () => true
      },
      {
        id: "bite",
        name: "Bite",
        description: "Take a bite.",
        damageMultiplier: 0.5,
        appliesBleed: true,
        isAvailable: () => true
      },
      {
        id: "pursue",
        name: "Pursue",
        description: "Don't let them get away.",
        damageMultiplier: 1,
        oneShotChance: 0.25,
        isAvailable: () => enemy.hp > 0 && enemy.hp / enemy.maxHp <= 0.2
      }
    ]
  },
  {
    id: "macrophage",
    name: "Macrophage",
    maxHp: 130,
    hp: 130,
    stunned: false,
    attackMin: 10,
    attackMax: 20,
    sprite: {
      type: "animated",
      frames: ["assets/macrophage/frame-0.png", "assets/macrophage/frame-1.png", "assets/macrophage/frame-2.png"],
      frameDurationMs: 500
    },
    // Canon height 6'2" — tallest of the three, a couple px above CTC.
    spriteSize: 108,
    type: "phagocyte",
    // Macrophages handle both bacteria and viruses fine in real life, so unlike
    // Neutrophil (also a Phagocyte), Macrophage has no weakAgainst entries.
    weakAgainst: [],
    // Exception to the idle/battle split: his design covers his eyes, so there's
    // no separate forward-facing pose — idle doubles as both the cutscene and
    // battle "idle" mood art.
    portrait: { idle: "assets/macrophage/idle-portrait.png", hurt: "assets/macrophage/hurt-portrait.png" },
    // Tank: small chance to significantly reduce an incoming hit.
    passive: { type: "tank", chance: 0.25, reduction: 0.5 },
    moves: [
      {
        id: "shoulder-check",
        name: "Shoulder Check",
        description: "Break their bones.",
        damageMultiplier: 1,
        isAvailable: () => true
      },
      {
        id: "crush",
        name: "Crush",
        description: "Wrap your arms around them and crush.",
        isCrush: true,
        isAvailable: () => true
      },
      {
        id: "grapple",
        name: "Grapple",
        description: "Where do you think you're going?",
        damageMultiplier: 1,
        immobilizeChance: 0.2,
        isAvailable: () => true
      }
    ]
  },
  {
    id: "ctc",
    name: "Cytotoxic T Cell",
    maxHp: 110,
    hp: 110,
    stunned: false,
    attackMin: 10,
    attackMax: 20,
    sprite: {
      type: "animated",
      frames: ["assets/ctc/frame-0.png", "assets/ctc/frame-1.png", "assets/ctc/frame-2.png"],
      frameDurationMs: 500
    },
    // Canon height 6'1" — taller than Neutrophil, just under Macrophage.
    spriteSize: 106,
    type: "adaptive",
    weakAgainst: ["bacteria"],
    // "idle" here is the battle-facing pose (forward, toward the enemy) — the true idle
    // pose is cutscene-only now and lives in CUTSCENE_CHARACTERS.ctc.portrait instead.
    portrait: { idle: "assets/ctc/battle-portrait.png", hurt: "assets/ctc/hurt-portrait.png" },
    // Unshaken: fully immune to stun (bacteria's chance to skip the player's turn).
    passive: { type: "unshaken" },
    moves: [
      {
        id: "fire",
        name: "Fire",
        description: "Aim your gun and shoot.",
        damageMultiplier: 1,
        isAvailable: () => true
      },
      {
        id: "stab",
        name: "Stab",
        description: "Stab them.",
        damageMultiplier: 1,
        appliesBleed: true,
        isAvailable: () => true
      },
      {
        id: "precision-shot",
        name: "Precision Shot",
        description: "Take them out completely.",
        damageMultiplier: 1,
        critChance: 0.2,
        isAvailable: () => true
      }
    ]
  }
];

const DEFAULT_FIGHTER_ID = "neutrophil";

const ENEMY_TEMPLATES = {
  bacteriaVariant1: {
    name: "Opportunistic Bacterium",
    type: "bacteria",
    attackName: "Scratch",
    maxHp: 100,
    attackMin: 8,
    attackMax: 18,
    // Bacteria can stun on hit, skipping the player's next turn entirely.
    canStun: true,
    sprite: {
      type: "animated",
      frames: ["assets/bacteria/variant1-frame-0.png", "assets/bacteria/variant1-frame-1.png"],
      frameDurationMs: 500
    },
    spriteSize: 96
  },
  virusVariant1: {
    name: "Opportunistic Virus",
    type: "virus",
    attackName: "Infect",
    maxHp: 100,
    attackMin: 8,
    attackMax: 18,
    sprite: {
      type: "animated",
      frames: ["assets/virus/variant1-frame-0.png", "assets/virus/variant1-frame-1.png"],
      frameDurationMs: 500
    },
    spriteSize: 96
  }
};

// Regular Fight 1: guaranteed one bacterium then one virus (both variant 1, the
// "normal" strain) so the player meets both enemy types and the weakness chart
// risk-free before RNG variants (2 = weakened, 3 = resistant) start showing up.
const ENCOUNTER_QUEUE = [ENEMY_TEMPLATES.bacteriaVariant1, ENEMY_TEMPLATES.virusVariant1];
let encounterIndex = 0;

let enemy;

function spawnEnemyFromTemplate(template) {
  enemy = {
    name: template.name,
    type: template.type,
    attackName: template.attackName,
    maxHp: template.maxHp,
    hp: template.maxHp,
    attackMin: template.attackMin,
    attackMax: template.attackMax,
    canStun: template.canStun ?? false,
    sprite: template.sprite ?? null,
    spriteSize: template.spriteSize ?? 96,
    bleeding: false,
    immobilizedTurns: 0
  };
  nameEnemy.textContent = enemy.name;
  renderEnemySprite(enemy);
  snapHpTrail(enemy, hpBarTrailEnemy);
}

function spawnNextEncounter() {
  const template = ENCOUNTER_QUEUE[encounterIndex];
  encounterIndex++;
  spawnEnemyFromTemplate(template);
}

function startEncounterQueue() {
  encounterIndex = 0;
  spawnNextEncounter();
}

const DEFAULT_MOVE_DESCRIPTION = "Hover or focus a move to see what it does.";
const BLEED_PERCENT = 0.1;
const IMMOBILIZED_DAMAGE_MULTIPLIER = 0.3;
const STUN_CHANCE = 0.35;

const nameEnemy = document.getElementById("name-enemy");
const namePlayer = document.getElementById("name-player");
const hpBarPlayer = document.getElementById("hp-bar-player");
const hpBarTrailPlayer = document.getElementById("hp-bar-trail-player");
const hpTextPlayer = document.getElementById("hp-text-player");
const hpBarEnemy = document.getElementById("hp-bar-enemy");
const hpBarTrailEnemy = document.getElementById("hp-bar-trail-enemy");
const hpTextEnemy = document.getElementById("hp-text-enemy");
const battleDialogueBox = document.getElementById("battle-dialogue-box");
const battleDialogueText = document.getElementById("battle-dialogue-text");
const battleDialoguePortrait = document.getElementById("battle-dialogue-portrait");
const moveDescription = document.getElementById("move-description");
const moveButtonsEl = document.getElementById("move-buttons");
const btnRestart = document.getElementById("btn-restart");
const btnContinueCutscene2 = document.getElementById("btn-continue-cutscene2");
const btnSwitch = document.getElementById("btn-switch");
const switchPanel = document.getElementById("switch-panel");
const spritePlayer = document.getElementById("sprite-player");
const spritePlayerImg = document.getElementById("sprite-player-img");
const spriteEnemy = document.getElementById("sprite-enemy");
const spriteEnemyImg = document.getElementById("sprite-enemy-img");

let battleOver = false;
let activeFighterId = DEFAULT_FIGHTER_ID;
let ctcAnimationTimer = null;
let enemyAnimationTimer = null;
let awaitingForcedSwitch = false;
let awaitingCutsceneTransition = false;
const moveButtons = [];

function getActiveFighter() {
  return ROSTER.find((fighter) => fighter.id === activeFighterId);
}

function randomDamage(fighter) {
  return Math.floor(Math.random() * (fighter.attackMax - fighter.attackMin + 1)) + fighter.attackMin;
}

let currentBattleSteps = [];
let currentBattleStepIndex = 0;

function renderBattleDialoguePortrait(mood) {
  const src = getActiveFighter().portrait?.[mood || "idle"];
  if (src) {
    battleDialoguePortrait.src = src;
    battleDialoguePortrait.hidden = false;
  } else {
    battleDialoguePortrait.hidden = true;
  }
}

function runBattleSteps(steps) {
  currentBattleSteps = steps;
  currentBattleStepIndex = 0;
  advanceBattleDialogue();
}

function advanceBattleDialogue() {
  if (currentBattleStepIndex >= currentBattleSteps.length) return;
  const step = currentBattleSteps[currentBattleStepIndex];
  currentBattleStepIndex++;
  step.apply();
  battleDialogueText.textContent = step.text;
  renderBattleDialoguePortrait(step.mood);

  if (currentBattleStepIndex < currentBattleSteps.length) return;

  if (awaitingCutsceneTransition) {
    battleDialogueBox.hidden = true;
    battleDialoguePortrait.hidden = true;
    btnContinueCutscene2.hidden = false;
    return;
  }

  if (!battleOver && !awaitingForcedSwitch) {
    const fighter = getActiveFighter();
    if (fighter.stunned) {
      fighter.stunned = false;
      runBattleSteps(buildStunnedTurnSteps(fighter));
    } else {
      setMovesLocked(false);
    }
  }
}

function flashDamage(spriteEl) {
  spriteEl.classList.remove("hit");
  void spriteEl.offsetWidth;
  spriteEl.classList.add("hit");
  spriteEl.addEventListener("animationend", () => spriteEl.classList.remove("hit"), { once: true });
}

function updateHpDisplay(fighter, barEl, trailEl, textEl) {
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  barEl.style.width = pct + "%";
  barEl.classList.toggle("low", pct <= 25);
  trailEl.style.width = pct + "%";
  textEl.textContent = `${Math.max(0, fighter.hp)} / ${fighter.maxHp} HP`;
}

function snapHpTrail(fighter, trailEl) {
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  trailEl.style.transition = "none";
  trailEl.style.width = pct + "%";
  void trailEl.offsetWidth;
  trailEl.style.transition = "";
}

function updateMoveAvailability() {
  moveButtons.forEach(({ move, el }) => {
    el.hidden = !move.isAvailable();
  });
}

function refreshDisplay() {
  updateHpDisplay(getActiveFighter(), hpBarPlayer, hpBarTrailPlayer, hpTextPlayer);
  updateHpDisplay(enemy, hpBarEnemy, hpBarTrailEnemy, hpTextEnemy);
  updateMoveAvailability();
  rebuildSwitchPanel();
}

function setMovesLocked(locked) {
  moveButtons.forEach(({ el }) => {
    el.disabled = locked;
  });
  btnSwitch.disabled = locked;
  if (locked) {
    closeSwitchPanel();
  }
}

function closeSwitchPanel() {
  switchPanel.hidden = true;
}

function toggleSwitchPanel() {
  switchPanel.hidden = !switchPanel.hidden;
}

function switchFighter(fighterId) {
  if (fighterId === activeFighterId || battleOver) {
    closeSwitchPanel();
    return;
  }
  const target = ROSTER.find((fighter) => fighter.id === fighterId);
  if (!target || target.hp <= 0) {
    return;
  }
  activeFighterId = fighterId;
  const wasForcedSwitch = awaitingForcedSwitch;
  awaitingForcedSwitch = false;
  btnSwitch.hidden = false;
  closeSwitchPanel();
  renderActiveFighter();
  if (wasForcedSwitch) {
    setMovesLocked(false);
  }
}

function rebuildSwitchPanel() {
  switchPanel.innerHTML = "";
  ROSTER.forEach((fighter) => {
    const isActive = fighter.id === activeFighterId;
    const isFainted = fighter.hp <= 0;
    const entry = document.createElement("button");
    entry.type = "button";
    entry.className = "roster-entry" + (isActive ? " active" : "");
    const status = isFainted ? " (fainted)" : isActive ? " (active)" : "";
    const label = document.createElement("span");
    label.textContent = `${fighter.name}${status} — ${Math.max(0, fighter.hp)}/${fighter.maxHp} HP`;
    entry.appendChild(label);
    entry.disabled = isActive || isFainted;
    entry.addEventListener("click", () => switchFighter(fighter.id));
    switchPanel.appendChild(entry);
  });
}

function beginForcedSwitch(fallenFighter) {
  awaitingForcedSwitch = true;
  moveButtonsEl.innerHTML = "";
  moveButtons.length = 0;
  moveDescription.textContent = "Choose a fighter to send out!";
  btnSwitch.hidden = true;
  switchPanel.hidden = false;
  rebuildSwitchPanel();
}

function renderSprite(fighter) {
  if (ctcAnimationTimer) {
    clearInterval(ctcAnimationTimer);
    ctcAnimationTimer = null;
  }

  spritePlayer.style.width = fighter.spriteSize + "px";
  spritePlayer.style.height = fighter.spriteSize + "px";

  if (fighter.sprite.type === "animated") {
    spritePlayer.classList.add("has-art");
    spritePlayerImg.hidden = false;
    let frameIndex = 0;
    spritePlayerImg.src = fighter.sprite.frames[frameIndex];
    ctcAnimationTimer = setInterval(() => {
      frameIndex = (frameIndex + 1) % fighter.sprite.frames.length;
      spritePlayerImg.src = fighter.sprite.frames[frameIndex];
    }, fighter.sprite.frameDurationMs);
  } else {
    spritePlayer.classList.remove("has-art");
    spritePlayerImg.hidden = true;
    spritePlayerImg.src = "";
  }
}

function renderEnemySprite(enemyData) {
  if (enemyAnimationTimer) {
    clearInterval(enemyAnimationTimer);
    enemyAnimationTimer = null;
  }

  spriteEnemy.style.width = enemyData.spriteSize + "px";
  spriteEnemy.style.height = enemyData.spriteSize + "px";

  if (enemyData.sprite?.type === "animated") {
    spriteEnemy.classList.add("has-art");
    spriteEnemyImg.hidden = false;
    let frameIndex = 0;
    spriteEnemyImg.src = enemyData.sprite.frames[frameIndex];
    enemyAnimationTimer = setInterval(() => {
      frameIndex = (frameIndex + 1) % enemyData.sprite.frames.length;
      spriteEnemyImg.src = enemyData.sprite.frames[frameIndex];
    }, enemyData.sprite.frameDurationMs);
  } else {
    spriteEnemy.classList.remove("has-art");
    spriteEnemyImg.hidden = true;
    spriteEnemyImg.src = "";
  }
}

function showMoveDescription(move) {
  moveDescription.textContent = `"${move.description}"`;
}

function resetMoveDescription() {
  moveDescription.textContent = DEFAULT_MOVE_DESCRIPTION;
}

function buildMoveButtons(fighter) {
  moveButtonsEl.innerHTML = "";
  moveButtons.length = 0;
  fighter.moves.forEach((move) => {
    const btn = document.createElement("button");
    btn.className = "move-btn";
    const label = document.createElement("span");
    label.textContent = move.name;
    btn.appendChild(label);
    btn.addEventListener("mouseenter", () => showMoveDescription(move));
    btn.addEventListener("focus", () => showMoveDescription(move));
    btn.addEventListener("mouseleave", resetMoveDescription);
    btn.addEventListener("blur", resetMoveDescription);
    btn.addEventListener("click", () => useMove(fighter, move));
    moveButtonsEl.appendChild(btn);
    moveButtons.push({ move, el: btn });
  });
}

function renderActiveFighter() {
  const fighter = getActiveFighter();
  namePlayer.textContent = fighter.name;
  renderSprite(fighter);
  buildMoveButtons(fighter);
  snapHpTrail(fighter, hpBarTrailPlayer);
  refreshDisplay();
}

function endBattle() {
  battleOver = true;
  setMovesLocked(true);
  btnRestart.style.display = "inline-block";
}

// Called once the last enemy in the encounter queue is defeated — instead of the
// usual restart button, the VN narration box and portrait disappear entirely and
// hand off to a "Continue to Cutscene" prompt (see advanceBattleDialogue()).
function endBattleWithVictory() {
  battleOver = true;
  setMovesLocked(true);
  awaitingCutsceneTransition = true;
}

function pushEnemyDefeatedSteps(steps, fighter) {
  const hasNextEncounter = encounterIndex < ENCOUNTER_QUEUE.length;

  steps.push({
    text: `${enemy.name} is defeated. ${fighter.name} wins!`,
    mood: "idle",
    apply: hasNextEncounter ? () => {} : () => { endBattleWithVictory(); }
  });

  if (hasNextEncounter) {
    const nextName = ENCOUNTER_QUEUE[encounterIndex].name;
    steps.push({
      text: `${nextName} appears!`,
      mood: "idle",
      apply: () => { spawnNextEncounter(); refreshDisplay(); }
    });
    steps.push({ text: `${fighter.name} is deciding...`, mood: "idle", apply: () => {} });
  }

  return steps;
}

function computePlayerDamage(fighter, move) {
  if (move.oneShotChance && Math.random() < move.oneShotChance) {
    return { damage: enemy.hp, isCrit: false, isOneShot: true, isNotVeryEffective: false };
  }

  const isNotVeryEffective = fighter.weakAgainst?.includes(enemy.type) ?? false;
  const weaknessMultiplier = isNotVeryEffective ? 0.5 : 1;

  if (move.isCrush) {
    const damage = Math.max(1, Math.round(enemy.hp * 0.5 * weaknessMultiplier));
    return { damage, isCrit: false, isOneShot: false, isNotVeryEffective };
  }

  let roll = randomDamage(fighter) * move.damageMultiplier;
  let isCrit = false;
  if (move.critChance && Math.random() < move.critChance) {
    roll *= 2;
    isCrit = true;
  }
  roll *= weaknessMultiplier;

  return { damage: Math.max(1, Math.round(roll)), isCrit, isOneShot: false, isNotVeryEffective };
}

function buildTurnSteps(fighter, move) {
  const steps = [];

  // ---- Player's move ----
  const { damage: playerDamage, isCrit, isOneShot, isNotVeryEffective } = computePlayerDamage(fighter, move);
  const enemyHpAfterMove = enemy.hp - playerDamage;
  const hitSuffix = isOneShot ? " — finishing them off" : isCrit ? " (critical hit!)" : "";
  steps.push({
    text: `${fighter.name} uses ${move.name} on ${enemy.name} for ${playerDamage} damage${hitSuffix}.`,
    mood: "idle",
    apply: () => { enemy.hp = enemyHpAfterMove; flashDamage(spriteEnemy); refreshDisplay(); }
  });

  if (isNotVeryEffective) {
    steps.push({ text: "But it doesn't seem very effective...", mood: "idle", apply: () => {} });
  }

  let enemyBleedingAfterMove = enemy.bleeding;
  if (move.appliesBleed) {
    enemyBleedingAfterMove = true;
    steps.push({
      text: `${enemy.name} is bleeding!`,
      mood: "idle",
      apply: () => { enemy.bleeding = true; }
    });
  }

  let enemyImmobilizedTurnsAfterMove = enemy.immobilizedTurns;
  if (move.immobilizeChance && Math.random() < move.immobilizeChance) {
    enemyImmobilizedTurnsAfterMove = 2;
    steps.push({
      text: `${enemy.name} is immobilized!`,
      mood: "idle",
      apply: () => { enemy.immobilizedTurns = 2; }
    });
  }

  if (enemyHpAfterMove <= 0) {
    return pushEnemyDefeatedSteps(steps, fighter);
  }

  return appendEnemyTurnSteps(steps, fighter, enemyHpAfterMove, enemyBleedingAfterMove, enemyImmobilizedTurnsAfterMove);
}

// A stunned fighter skips their move entirely — this builds a turn that starts
// straight from the enemy's side, using whatever state the enemy already has
// (no player action happened this turn to change it).
function buildStunnedTurnSteps(fighter) {
  const steps = [{
    text: `${fighter.name} is stunned and can't move!`,
    mood: "idle",
    apply: () => {}
  }];
  return appendEnemyTurnSteps(steps, fighter, enemy.hp, enemy.bleeding, enemy.immobilizedTurns);
}

function appendEnemyTurnSteps(steps, fighter, enemyHpAfterMove, enemyBleedingAfterMove, enemyImmobilizedTurnsAfterMove) {
  // ---- Enemy's turn ----
  steps.push({ text: `${enemy.name} is deciding...`, mood: "idle", apply: () => {} });

  let enemyDamage = randomDamage(enemy);
  let immobilizedTurnsAfterAttack = enemyImmobilizedTurnsAfterMove;
  if (enemyImmobilizedTurnsAfterMove > 0) {
    enemyDamage = Math.max(1, Math.round(enemyDamage * IMMOBILIZED_DAMAGE_MULTIPLIER));
    immobilizedTurnsAfterAttack = enemyImmobilizedTurnsAfterMove - 1;
  }

  let tankTriggered = false;
  if (fighter.passive?.type === "tank" && Math.random() < fighter.passive.chance) {
    enemyDamage = Math.max(1, Math.round(enemyDamage * (1 - fighter.passive.reduction)));
    tankTriggered = true;
  }

  const fighterHpAfterAttack = fighter.hp - enemyDamage;

  // Unshaken makes CTC fully immune to stun — the roll never even happens for him.
  const isStunImmune = fighter.passive?.type === "unshaken";
  const stunTriggered = enemy.canStun && !isStunImmune && Math.random() < STUN_CHANCE;

  if (tankTriggered) {
    steps.push({ text: `${fighter.name}'s Tank reduces the hit!`, mood: "idle", apply: () => {} });
  }

  steps.push({
    text: `${enemy.name} uses ${enemy.attackName} on ${fighter.name} for ${enemyDamage} damage.`,
    mood: "hurt",
    apply: () => {
      fighter.hp = fighterHpAfterAttack;
      enemy.immobilizedTurns = immobilizedTurnsAfterAttack;
      flashDamage(spritePlayer);
      refreshDisplay();
    }
  });

  if (fighterHpAfterAttack <= 0) {
    const hasHealthyTeammate = ROSTER.some((other) => other.id !== fighter.id && other.hp > 0);
    if (hasHealthyTeammate) {
      steps.push({
        text: `${fighter.name} has fallen! Choose another fighter.`,
        mood: "hurt",
        apply: () => { beginForcedSwitch(fighter); }
      });
    } else {
      steps.push({
        text: `${fighter.name} is defeated. ${enemy.name} wins!`,
        mood: "hurt",
        apply: () => { endBattle(); }
      });
    }
    return steps;
  }

  if (stunTriggered) {
    steps.push({
      text: `${fighter.name} is stunned and will miss their next move!`,
      mood: "hurt",
      apply: () => { fighter.stunned = true; }
    });
  }

  // ---- Corrosive Blood ----
  let enemyHpAfterCorrosive = enemyHpAfterMove;
  if (fighter.passive?.type === "corrosiveBlood") {
    const reflectPercent = fighter.passive.minPercent + Math.random() * (fighter.passive.maxPercent - fighter.passive.minPercent);
    const reflectDamage = Math.max(1, Math.round(enemy.maxHp * reflectPercent));
    enemyHpAfterCorrosive = enemyHpAfterMove - reflectDamage;
    steps.push({
      text: `${fighter.name}'s Corrosive Blood deals ${reflectDamage} damage to ${enemy.name}.`,
      mood: "idle",
      apply: () => { enemy.hp = enemyHpAfterCorrosive; flashDamage(spriteEnemy); refreshDisplay(); }
    });

    if (enemyHpAfterCorrosive <= 0) {
      return pushEnemyDefeatedSteps(steps, fighter);
    }
  }

  // ---- Bleed ----
  if (enemyBleedingAfterMove) {
    steps.push({ text: `${enemy.name} is bleeding out...`, mood: "idle", apply: () => {} });

    const bleedDamage = Math.max(1, Math.round(enemy.maxHp * BLEED_PERCENT));
    const enemyHpAfterBleed = enemyHpAfterCorrosive - bleedDamage;
    steps.push({
      text: `${enemy.name} takes ${bleedDamage} bleed damage.`,
      mood: "idle",
      apply: () => { enemy.hp = enemyHpAfterBleed; enemy.bleeding = false; flashDamage(spriteEnemy); refreshDisplay(); }
    });

    if (enemyHpAfterBleed <= 0) {
      return pushEnemyDefeatedSteps(steps, fighter);
    }
  }

  steps.push({ text: `${fighter.name} is deciding...`, mood: "idle", apply: () => {} });

  return steps;
}

function useMove(fighter, move) {
  if (battleOver) return;
  setMovesLocked(true);
  runBattleSteps(buildTurnSteps(fighter, move));
}

function restartBattle() {
  ROSTER.forEach((fighter) => {
    fighter.hp = fighter.maxHp;
    fighter.stunned = false;
  });
  startEncounterQueue();
  battleOver = false;
  activeFighterId = DEFAULT_FIGHTER_ID;
  awaitingForcedSwitch = false;
  btnSwitch.hidden = false;
  btnRestart.style.display = "none";
  renderActiveFighter();
  setMovesLocked(true);
  runBattleSteps([{ text: "A new battle begins!", mood: "idle", apply: () => {} }]);
}

btnRestart.addEventListener("click", restartBattle);
btnSwitch.addEventListener("click", toggleSwitchPanel);
battleDialogueBox.addEventListener("click", advanceBattleDialogue);
btnContinueCutscene2.addEventListener("click", () => {
  battleScreenEl.hidden = true;
  cutscene2Screen.hidden = false;
});

startEncounterQueue();
renderActiveFighter();
setMovesLocked(true);
runBattleSteps([{ text: "A new battle begins!", mood: "idle", apply: () => {} }]);

// ---------- Cutscene ----------

const CUTSCENE_CHARACTERS = {
  neutrophil: {
    name: "Neutrophil",
    portraits: { idle: "assets/neutrophil/idle-portrait.png", shocked: "assets/neutrophil/shocked-portrait.png" }
  },
  macrophage: {
    name: "Macrophage",
    portraits: {
      idle: "assets/macrophage/idle-portrait.png",
      hurt: "assets/macrophage/hurt-portrait.png",
      shocked: "assets/macrophage/shocked-portrait.png"
    }
  },
  ctc: {
    name: "Cytotoxic T Cell",
    portraits: { idle: "assets/ctc/idle-portrait.png", shocked: "assets/ctc/shocked-portrait.png" }
  }
};

const NM_CONVERSATION_BEFORE = [
  { speaker: "neutrophil", mood: "idle", text: "So, how's your patrol route?" },
  { speaker: "macrophage", mood: "idle", text: "Pretty calm today." },
  { speaker: "neutrophil", mood: "idle", text: "That's rare. See any foreign invaders at all?" },
  { speaker: "macrophage", mood: "idle", text: "No. Not yet, at least." },
  { speaker: "neutrophil", mood: "idle", text: "That's strange. There's always *something*." },
  { speaker: "macrophage", mood: "idle", text: "Maybe it'll stay that way." }
];

const NM_CONVERSATION_AFTER = [
  { speaker: "neutrophil", mood: "shocked", text: "..we should probably go handle that." },
  { speaker: "macrophage", mood: "hurt", text: "....yes." }
];

const CTC_MONOLOGUE_BEFORE = [
  { speaker: "ctc", mood: "idle", text: "(9 minutes until break's over.)", thought: true },
  { speaker: "ctc", mood: "idle", text: "(...I wonder what Arden's doing.)", thought: true }
];

const CTC_MONOLOGUE_AFTER = [
  { speaker: "ctc", mood: "idle", text: "(I should go see what happened.)", thought: true }
];

const SHOCK_EVENT_LINES = [
  { speaker: "neutrophil", mood: "shocked", text: "...!!" },
  { speaker: "macrophage", mood: "shocked", text: "...!!" },
  { speaker: "ctc", mood: "shocked", text: "...!!" },
  { speaker: "neutrophil", mood: "shocked", text: "...spoke too soon about things being quiet." },
  { speaker: "macrophage", mood: "hurt", text: "Move." },
  { speaker: "ctc", mood: "idle", text: "(Back to work, then.)", thought: true }
];

const SHOCK_EVENT_DELAY_MS = 500;

// Placeholder small talk for cutscene 2 — same shared/separate structure as
// cutscene 1 (Neutrophil and Macrophage share a conversation since they're
// still sitting together, CTC gets his own lines), real dialogue TBD.
const NM_CONVERSATION_2 = [
  { speaker: "neutrophil", mood: "idle", text: "[placeholder]" }
];

const CTC_MONOLOGUE_2 = [
  { speaker: "ctc", mood: "idle", text: "[placeholder]", thought: true }
];

const cutsceneScreen = document.getElementById("cutscene-screen");
const cutsceneStageEl = document.getElementById("cutscene-stage");
const cutscene2Screen = document.getElementById("cutscene2-screen");
const battleScreenEl = document.getElementById("battle-screen");
const dialoguePortrait = document.getElementById("dialogue-portrait");
const dialogueBox = document.getElementById("dialogue-box");
const dialogueSpeaker = document.getElementById("dialogue-speaker");
const dialogueText = document.getElementById("dialogue-text");
const btnContinueFighting = document.getElementById("btn-continue-fighting");

const dialogue2Portrait = document.getElementById("dialogue2-portrait");
const dialogue2Box = document.getElementById("dialogue2-box");
const dialogue2Speaker = document.getElementById("dialogue2-speaker");
const dialogue2Text = document.getElementById("dialogue2-text");

const cutsceneBubbles = {
  neutrophil: document.getElementById("bubble-neutrophil"),
  macrophage: document.getElementById("bubble-macrophage"),
  ctc: document.getElementById("bubble-ctc")
};

const cutsceneHotspots = {
  neutrophil: document.getElementById("hotspot-neutrophil"),
  macrophage: document.getElementById("hotspot-macrophage"),
  ctc: document.getElementById("hotspot-ctc")
};

const cutscene2Bubbles = {
  neutrophil: document.getElementById("bubble2-neutrophil"),
  macrophage: document.getElementById("bubble2-macrophage"),
  ctc: document.getElementById("bubble2-ctc")
};

const cutscene2Hotspots = {
  neutrophil: document.getElementById("hotspot2-neutrophil"),
  macrophage: document.getElementById("hotspot2-macrophage"),
  ctc: document.getElementById("hotspot2-ctc")
};

// "before" = pre-infection small talk; "after" = post-shock, everyone's on alert.
let cutsceneStage = "before";
let nmDialogueRead = false;
let ctcDialogueRead = false;

function hideBubbles(bubbles) {
  Object.values(bubbles).forEach((bubble) => {
    bubble.hidden = true;
  });
}

// A self-contained click-to-continue VN engine bound to one dialogue box/portrait
// pair. Each cutscene screen gets its own instance so they don't share state.
function createDialogueEngine(box, portrait, speaker, text, onOpen) {
  let lines = [];
  let lineIndex = 0;
  let onFinished = null;

  function showLine(entry) {
    const character = CUTSCENE_CHARACTERS[entry.speaker];
    speaker.textContent = character.name;
    text.textContent = entry.text;
    text.classList.toggle("inner-thought", !!entry.thought);

    const portraitSrc = character.portraits[entry.mood || "idle"];
    if (portraitSrc) {
      portrait.src = portraitSrc;
      portrait.hidden = false;
    } else {
      portrait.hidden = true;
    }

    box.hidden = false;
  }

  function close() {
    box.hidden = true;
    portrait.hidden = true;
    text.classList.remove("inner-thought");
    lines = [];
    lineIndex = 0;

    const finished = onFinished;
    onFinished = null;
    if (finished) finished();
  }

  function advance() {
    if (lineIndex >= lines.length) {
      close();
      return;
    }
    const entry = lines[lineIndex];
    lineIndex++;
    showLine(entry);
  }

  function open(newLines, finishedCallback) {
    if (onOpen) onOpen();
    lines = newLines;
    lineIndex = 0;
    onFinished = finishedCallback || null;
    advance();
  }

  box.addEventListener("click", advance);

  return { open };
}

const cutscene1Dialogue = createDialogueEngine(dialogueBox, dialoguePortrait, dialogueSpeaker, dialogueText, () => hideBubbles(cutsceneBubbles));
const cutscene2Dialogue = createDialogueEngine(dialogue2Box, dialogue2Portrait, dialogue2Speaker, dialogue2Text, () => hideBubbles(cutscene2Bubbles));

function shakeScreen() {
  cutsceneStageEl.classList.remove("shake");
  void cutsceneStageEl.offsetWidth;
  cutsceneStageEl.classList.add("shake");
  cutsceneStageEl.addEventListener("animationend", () => cutsceneStageEl.classList.remove("shake"), { once: true });
}

function checkPreEventProgress() {
  if (cutsceneStage === "before" && nmDialogueRead && ctcDialogueRead) {
    triggerShockEvent();
  }
}

function triggerShockEvent() {
  cutsceneStage = "after";
  shakeScreen();
  setTimeout(() => {
    cutscene1Dialogue.open(SHOCK_EVENT_LINES, () => {
      btnContinueFighting.hidden = false;
    });
  }, SHOCK_EVENT_DELAY_MS);
}

function handleHotspotClick(charId) {
  if (charId === "ctc") {
    const lines = cutsceneStage === "before" ? CTC_MONOLOGUE_BEFORE : CTC_MONOLOGUE_AFTER;
    cutscene1Dialogue.open(lines, () => {
      if (cutsceneStage === "before") {
        ctcDialogueRead = true;
        checkPreEventProgress();
      }
    });
  } else {
    const lines = cutsceneStage === "before" ? NM_CONVERSATION_BEFORE : NM_CONVERSATION_AFTER;
    cutscene1Dialogue.open(lines, () => {
      if (cutsceneStage === "before") {
        nmDialogueRead = true;
        checkPreEventProgress();
      }
    });
  }
}

function handleHotspot2Click(charId) {
  const lines = charId === "ctc" ? CTC_MONOLOGUE_2 : NM_CONVERSATION_2;
  cutscene2Dialogue.open(lines);
}

function goToBattle() {
  cutsceneScreen.hidden = true;
  battleScreenEl.hidden = false;
}

function wireHotspots(hotspots, bubbles, onClick) {
  Object.entries(hotspots).forEach(([charId, hotspot]) => {
    const bubble = bubbles[charId];
    hotspot.addEventListener("mouseenter", () => {
      bubble.hidden = false;
    });
    hotspot.addEventListener("focus", () => {
      bubble.hidden = false;
    });
    hotspot.addEventListener("mouseleave", () => {
      bubble.hidden = true;
    });
    hotspot.addEventListener("blur", () => {
      bubble.hidden = true;
    });
    hotspot.addEventListener("click", () => onClick(charId));
  });
}

wireHotspots(cutsceneHotspots, cutsceneBubbles, handleHotspotClick);
wireHotspots(cutscene2Hotspots, cutscene2Bubbles, handleHotspot2Click);

btnContinueFighting.addEventListener("click", goToBattle);

// ---------- Title / Extras ----------

const titleScreen = document.getElementById("title-screen");
const extrasScreen = document.getElementById("extras-screen");
const btnNewGame = document.getElementById("btn-new-game");
const btnExtras = document.getElementById("btn-extras");
const btnExtrasBack = document.getElementById("btn-extras-back");

btnNewGame.addEventListener("click", () => {
  titleScreen.hidden = true;
  cutsceneScreen.hidden = false;
});

btnExtras.addEventListener("click", () => {
  titleScreen.hidden = true;
  extrasScreen.hidden = false;
});

btnExtrasBack.addEventListener("click", () => {
  extrasScreen.hidden = true;
  titleScreen.hidden = false;
});
