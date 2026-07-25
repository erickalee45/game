const ROSTER = [
  {
    id: "neutrophil",
    name: "Neutrophil",
    maxHp: 100,
    hp: 100,
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
    maxHp: 100,
    hp: 100,
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
    maxHp: 100,
    hp: 100,
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
    // Unshaken: resistant to flinch/stun. No move in the game currently inflicts
    // either on the player, so this flag has no observable effect yet — it's here
    // so it's ready once a stunning enemy/boss move exists.
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

const ENEMY_TEMPLATES = [
  {
    name: "Opportunistic Bacterium",
    type: "bacteria",
    attackName: "Scratch",
    maxHp: 100,
    attackMin: 8,
    attackMax: 18
  },
  {
    name: "Opportunistic Virus",
    type: "virus",
    attackName: "Infect",
    maxHp: 100,
    attackMin: 8,
    attackMax: 18
  }
];

let enemy;

function spawnRandomEnemy() {
  const template = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
  enemy = {
    name: template.name,
    type: template.type,
    attackName: template.attackName,
    maxHp: template.maxHp,
    hp: template.maxHp,
    attackMin: template.attackMin,
    attackMax: template.attackMax,
    bleeding: false,
    immobilizedTurns: 0
  };
  nameEnemy.textContent = enemy.name;
}

const ENEMY_THINK_DELAY_MIN_MS = 1000;
const ENEMY_THINK_DELAY_MAX_MS = 2000;
const BLEED_DELAY_MIN_MS = 500;
const BLEED_DELAY_MAX_MS = 1000;
const DEFAULT_MOVE_DESCRIPTION = "Hover or focus a move to see what it does.";
const BLEED_PERCENT = 0.1;
const IMMOBILIZED_DAMAGE_MULTIPLIER = 0.3;

const nameEnemy = document.getElementById("name-enemy");
const namePlayer = document.getElementById("name-player");
const hpBarPlayer = document.getElementById("hp-bar-player");
const hpBarTrailPlayer = document.getElementById("hp-bar-trail-player");
const hpTextPlayer = document.getElementById("hp-text-player");
const hpBarEnemy = document.getElementById("hp-bar-enemy");
const hpBarTrailEnemy = document.getElementById("hp-bar-trail-enemy");
const hpTextEnemy = document.getElementById("hp-text-enemy");
const narrationBox = document.getElementById("narration-box");
const moveDescription = document.getElementById("move-description");
const moveButtonsEl = document.getElementById("move-buttons");
const btnRestart = document.getElementById("btn-restart");
const btnSwitch = document.getElementById("btn-switch");
const switchPanel = document.getElementById("switch-panel");
const spritePlayer = document.getElementById("sprite-player");
const spritePlayerImg = document.getElementById("sprite-player-img");
const spriteEnemy = document.getElementById("sprite-enemy");

let battleOver = false;
let activeFighterId = DEFAULT_FIGHTER_ID;
let ctcAnimationTimer = null;
let awaitingForcedSwitch = false;
const moveButtons = [];

function getActiveFighter() {
  return ROSTER.find((fighter) => fighter.id === activeFighterId);
}

function randomDamage(fighter) {
  return Math.floor(Math.random() * (fighter.attackMax - fighter.attackMin + 1)) + fighter.attackMin;
}

function logMessage(text) {
  const entry = document.createElement("div");
  entry.textContent = text;
  narrationBox.prepend(entry);
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
  logMessage(`${fallenFighter.name} has fallen! Choose another fighter.`);
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

function endBattle(didPlayerWin) {
  battleOver = true;
  setMovesLocked(true);
  btnRestart.style.display = "inline-block";
  const fighter = getActiveFighter();
  logMessage(didPlayerWin ? `${enemy.name} is defeated. ${fighter.name} wins!` : `${fighter.name} is defeated. ${enemy.name} wins!`);
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

function useMove(fighter, move) {
  if (battleOver) return;

  setMovesLocked(true);

  const { damage: playerDamage, isCrit, isOneShot, isNotVeryEffective } = computePlayerDamage(fighter, move);
  enemy.hp -= playerDamage;
  flashDamage(spriteEnemy);
  const hitSuffix = isOneShot ? " — finishing them off" : isCrit ? " (critical hit!)" : "";
  logMessage(`${fighter.name} uses ${move.name} on ${enemy.name} for ${playerDamage} damage${hitSuffix}.`);

  if (isNotVeryEffective) {
    logMessage("But it doesn't seem very effective...");
  }

  if (move.appliesBleed) {
    enemy.bleeding = true;
    logMessage(`${enemy.name} is bleeding!`);
  }

  if (move.immobilizeChance && Math.random() < move.immobilizeChance) {
    enemy.immobilizedTurns = 2;
    logMessage(`${enemy.name} is immobilized!`);
  }

  refreshDisplay();

  if (enemy.hp <= 0) {
    endBattle(true);
    return;
  }

  logMessage(`${enemy.name} is deciding...`);

  const thinkDelay = ENEMY_THINK_DELAY_MIN_MS + Math.random() * (ENEMY_THINK_DELAY_MAX_MS - ENEMY_THINK_DELAY_MIN_MS);
  setTimeout(() => {
    let enemyDamage = randomDamage(enemy);
    if (enemy.immobilizedTurns > 0) {
      enemyDamage = Math.max(1, Math.round(enemyDamage * IMMOBILIZED_DAMAGE_MULTIPLIER));
      enemy.immobilizedTurns -= 1;
    }

    if (fighter.passive?.type === "tank" && Math.random() < fighter.passive.chance) {
      enemyDamage = Math.max(1, Math.round(enemyDamage * (1 - fighter.passive.reduction)));
      logMessage(`${fighter.name}'s Tank reduces the hit!`);
    }

    fighter.hp -= enemyDamage;
    flashDamage(spritePlayer);
    logMessage(`${enemy.name} uses ${enemy.attackName} on ${fighter.name} for ${enemyDamage} damage.`);
    refreshDisplay();

    if (fighter.hp <= 0) {
      const hasHealthyTeammate = ROSTER.some((other) => other.id !== fighter.id && other.hp > 0);
      if (hasHealthyTeammate) {
        beginForcedSwitch(fighter);
      } else {
        endBattle(false);
      }
      return;
    }

    if (fighter.passive?.type === "corrosiveBlood") {
      const reflectPercent = fighter.passive.minPercent + Math.random() * (fighter.passive.maxPercent - fighter.passive.minPercent);
      const reflectDamage = Math.max(1, Math.round(enemy.maxHp * reflectPercent));
      enemy.hp -= reflectDamage;
      flashDamage(spriteEnemy);
      logMessage(`${fighter.name}'s Corrosive Blood deals ${reflectDamage} damage to ${enemy.name}.`);
      refreshDisplay();

      if (enemy.hp <= 0) {
        endBattle(true);
        return;
      }
    }

    if (enemy.bleeding) {
      logMessage(`${enemy.name} is bleeding out...`);
      const bleedDelay = BLEED_DELAY_MIN_MS + Math.random() * (BLEED_DELAY_MAX_MS - BLEED_DELAY_MIN_MS);
      setTimeout(() => {
        const bleedDamage = Math.max(1, Math.round(enemy.maxHp * BLEED_PERCENT));
        enemy.hp -= bleedDamage;
        enemy.bleeding = false;
        flashDamage(spriteEnemy);
        logMessage(`${enemy.name} takes ${bleedDamage} bleed damage.`);
        refreshDisplay();

        if (enemy.hp <= 0) {
          endBattle(true);
          return;
        }

        setMovesLocked(false);
      }, bleedDelay);
      return;
    }

    setMovesLocked(false);
  }, thinkDelay);
}

function restartBattle() {
  ROSTER.forEach((fighter) => {
    fighter.hp = fighter.maxHp;
  });
  spawnRandomEnemy();
  battleOver = false;
  activeFighterId = DEFAULT_FIGHTER_ID;
  awaitingForcedSwitch = false;
  btnSwitch.hidden = false;
  btnRestart.style.display = "none";
  narrationBox.innerHTML = "";
  logMessage("A new battle begins!");
  renderActiveFighter();
  setMovesLocked(false);
}

btnRestart.addEventListener("click", restartBattle);
btnSwitch.addEventListener("click", toggleSwitchPanel);

spawnRandomEnemy();
renderActiveFighter();
logMessage("A new battle begins!");

// ---------- Cutscene ----------

const CUTSCENE_CHARACTERS = {
  neutrophil: { name: "Neutrophil", lines: ["[placeholder]"], lineIndex: 0, read: false },
  macrophage: { name: "Macrophage", lines: ["[placeholder]"], lineIndex: 0, read: false },
  ctc: { name: "Cytotoxic T Cell", lines: ["[placeholder]"], lineIndex: 0, read: false }
};

const cutsceneScreen = document.getElementById("cutscene-screen");
const battleScreenEl = document.getElementById("battle-screen");
const dialogueBox = document.getElementById("dialogue-box");
const dialogueSpeaker = document.getElementById("dialogue-speaker");
const dialogueText = document.getElementById("dialogue-text");
const btnContinueFighting = document.getElementById("btn-continue-fighting");
const dialogueWarningModal = document.getElementById("dialogue-warning-modal");
const btnWarningYes = document.getElementById("btn-warning-yes");
const btnWarningNo = document.getElementById("btn-warning-no");

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

function hideAllBubbles() {
  Object.values(cutsceneBubbles).forEach((bubble) => {
    bubble.hidden = true;
  });
}

function openDialogue(charId) {
  const character = CUTSCENE_CHARACTERS[charId];
  dialogueSpeaker.textContent = character.name;
  dialogueText.textContent = character.lines[character.lineIndex];
  dialogueBox.hidden = false;
  hideAllBubbles();

  character.lineIndex++;
  if (character.lineIndex >= character.lines.length) {
    character.read = true;
    character.lineIndex = 0;
  }
}

function closeDialogue() {
  dialogueBox.hidden = true;
}

function allDialogueRead() {
  return Object.values(CUTSCENE_CHARACTERS).every((character) => character.read);
}

function goToBattle() {
  dialogueWarningModal.hidden = true;
  cutsceneScreen.hidden = true;
  battleScreenEl.hidden = false;
}

Object.entries(cutsceneHotspots).forEach(([charId, hotspot]) => {
  const bubble = cutsceneBubbles[charId];
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
  hotspot.addEventListener("click", () => openDialogue(charId));
});

dialogueBox.addEventListener("click", closeDialogue);

btnContinueFighting.addEventListener("click", () => {
  if (allDialogueRead()) {
    goToBattle();
  } else {
    dialogueWarningModal.hidden = false;
  }
});

btnWarningYes.addEventListener("click", goToBattle);
btnWarningNo.addEventListener("click", () => {
  dialogueWarningModal.hidden = true;
});

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
