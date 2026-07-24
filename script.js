const ROSTER = [
  {
    id: "neutrophil",
    name: "Neutrophil",
    maxHp: 100,
    hp: 100,
    attackMin: 10,
    attackMax: 20,
    sprite: { type: "placeholder" },
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
    sprite: { type: "placeholder" },
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

const enemy = {
  name: "Opportunistic Bacterium",
  maxHp: 100,
  hp: 100,
  attackMin: 8,
  attackMax: 18,
  bleeding: false,
  immobilizedTurns: 0
};

const ENEMY_THINK_DELAY_MIN_MS = 1000;
const ENEMY_THINK_DELAY_MAX_MS = 2000;
const DEFAULT_MOVE_DESCRIPTION = "Hover or focus a move to see what it does.";
const BLEED_PERCENT = 0.1;
const IMMOBILIZED_DAMAGE_MULTIPLIER = 0.3;

const nameEnemy = document.getElementById("name-enemy");
const namePlayer = document.getElementById("name-player");
const hpBarPlayer = document.getElementById("hp-bar-player");
const hpTextPlayer = document.getElementById("hp-text-player");
const hpBarEnemy = document.getElementById("hp-bar-enemy");
const hpTextEnemy = document.getElementById("hp-text-enemy");
const narrationBox = document.getElementById("narration-box");
const moveDescription = document.getElementById("move-description");
const moveButtonsEl = document.getElementById("move-buttons");
const btnRestart = document.getElementById("btn-restart");
const btnSwitch = document.getElementById("btn-switch");
const switchPanel = document.getElementById("switch-panel");
const spritePlayer = document.getElementById("sprite-player");
const spritePlayerImg = document.getElementById("sprite-player-img");

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

function updateHpDisplay(fighter, barEl, textEl) {
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  barEl.style.width = pct + "%";
  barEl.classList.toggle("low", pct <= 25);
  textEl.textContent = `${Math.max(0, fighter.hp)} / ${fighter.maxHp} HP`;
}

function updateMoveAvailability() {
  moveButtons.forEach(({ move, el }) => {
    el.hidden = !move.isAvailable();
  });
}

function refreshDisplay() {
  updateHpDisplay(getActiveFighter(), hpBarPlayer, hpTextPlayer);
  updateHpDisplay(enemy, hpBarEnemy, hpTextEnemy);
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
    entry.textContent = `${fighter.name}${status} — ${Math.max(0, fighter.hp)}/${fighter.maxHp} HP`;
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
    btn.textContent = move.name;
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
  if (move.isCrush) {
    return { damage: Math.max(1, Math.round(enemy.hp * 0.5)), isCrit: false, isOneShot: false };
  }

  if (move.oneShotChance && Math.random() < move.oneShotChance) {
    return { damage: enemy.hp, isCrit: false, isOneShot: true };
  }

  let roll = randomDamage(fighter) * move.damageMultiplier;
  let isCrit = false;
  if (move.critChance && Math.random() < move.critChance) {
    roll *= 2;
    isCrit = true;
  }

  return { damage: Math.max(1, Math.round(roll)), isCrit, isOneShot: false };
}

function useMove(fighter, move) {
  if (battleOver) return;

  setMovesLocked(true);

  const { damage: playerDamage, isCrit, isOneShot } = computePlayerDamage(fighter, move);
  enemy.hp -= playerDamage;
  const hitSuffix = isOneShot ? " — finishing them off" : isCrit ? " (critical hit!)" : "";
  logMessage(`${fighter.name} uses ${move.name} on ${enemy.name} for ${playerDamage} damage${hitSuffix}.`);

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
    logMessage(`${enemy.name} attacks ${fighter.name} for ${enemyDamage} damage.`);
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
      logMessage(`${fighter.name}'s Corrosive Blood deals ${reflectDamage} damage to ${enemy.name}.`);
      refreshDisplay();

      if (enemy.hp <= 0) {
        endBattle(true);
        return;
      }
    }

    if (enemy.bleeding) {
      const bleedDamage = Math.max(1, Math.round(enemy.maxHp * BLEED_PERCENT));
      enemy.hp -= bleedDamage;
      enemy.bleeding = false;
      logMessage(`${enemy.name} takes ${bleedDamage} bleed damage.`);
      refreshDisplay();

      if (enemy.hp <= 0) {
        endBattle(true);
        return;
      }
    }

    setMovesLocked(false);
  }, thinkDelay);
}

function restartBattle() {
  ROSTER.forEach((fighter) => {
    fighter.hp = fighter.maxHp;
  });
  enemy.hp = enemy.maxHp;
  enemy.bleeding = false;
  enemy.immobilizedTurns = 0;
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

nameEnemy.textContent = enemy.name;

renderActiveFighter();
logMessage("A new battle begins!");
