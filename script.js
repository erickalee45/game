const player = {
  name: "Neutrophil",
  maxHp: 100,
  hp: 100,
  attackMin: 10,
  attackMax: 20
};

const enemy = {
  name: "Opportunistic Bacterium",
  maxHp: 100,
  hp: 100,
  attackMin: 8,
  attackMax: 18,
  bleeding: false
};

// Corrosive Blood (passive) is intentionally excluded — passives aren't selectable moves.
const MOVES = [
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
    isAvailable: () => enemy.hp > 0 && enemy.hp / enemy.maxHp <= 0.2
  }
];

const ENEMY_THINK_DELAY_MIN_MS = 1000;
const ENEMY_THINK_DELAY_MAX_MS = 2000;
const DEFAULT_MOVE_DESCRIPTION = "Hover or focus a move to see what it does.";
const BLEED_PERCENT = 0.1;

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

let battleOver = false;
const moveButtons = [];

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
  updateHpDisplay(player, hpBarPlayer, hpTextPlayer);
  updateHpDisplay(enemy, hpBarEnemy, hpTextEnemy);
  updateMoveAvailability();
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

function buildSwitchPanel() {
  const entry = document.createElement("div");
  entry.className = "roster-entry active";
  entry.textContent = `${player.name} (active)`;
  switchPanel.appendChild(entry);
}

function showMoveDescription(move) {
  moveDescription.textContent = `"${move.description}"`;
}

function resetMoveDescription() {
  moveDescription.textContent = DEFAULT_MOVE_DESCRIPTION;
}

function buildMoveButtons() {
  MOVES.forEach((move) => {
    const btn = document.createElement("button");
    btn.className = "move-btn";
    btn.textContent = move.name;
    btn.addEventListener("mouseenter", () => showMoveDescription(move));
    btn.addEventListener("focus", () => showMoveDescription(move));
    btn.addEventListener("mouseleave", resetMoveDescription);
    btn.addEventListener("blur", resetMoveDescription);
    btn.addEventListener("click", () => useMove(move));
    moveButtonsEl.appendChild(btn);
    moveButtons.push({ move, el: btn });
  });
}

function endBattle(didPlayerWin) {
  battleOver = true;
  setMovesLocked(true);
  btnRestart.style.display = "inline-block";
  logMessage(didPlayerWin ? `${enemy.name} is defeated. ${player.name} wins!` : `${player.name} is defeated. ${enemy.name} wins!`);
}

function useMove(move) {
  if (battleOver) return;

  setMovesLocked(true);

  const playerDamage = Math.max(1, Math.round(randomDamage(player) * move.damageMultiplier));
  enemy.hp -= playerDamage;
  logMessage(`${player.name} uses ${move.name} on ${enemy.name} for ${playerDamage} damage.`);

  if (move.appliesBleed) {
    enemy.bleeding = true;
    logMessage(`${enemy.name} is bleeding!`);
  }

  refreshDisplay();

  if (enemy.hp <= 0) {
    endBattle(true);
    return;
  }

  logMessage(`${enemy.name} is deciding...`);

  const thinkDelay = ENEMY_THINK_DELAY_MIN_MS + Math.random() * (ENEMY_THINK_DELAY_MAX_MS - ENEMY_THINK_DELAY_MIN_MS);
  setTimeout(() => {
    const enemyDamage = randomDamage(enemy);
    player.hp -= enemyDamage;
    logMessage(`${enemy.name} attacks ${player.name} for ${enemyDamage} damage.`);
    refreshDisplay();

    if (player.hp <= 0) {
      endBattle(false);
      return;
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
  player.hp = player.maxHp;
  enemy.hp = enemy.maxHp;
  enemy.bleeding = false;
  battleOver = false;
  setMovesLocked(false);
  btnRestart.style.display = "none";
  narrationBox.innerHTML = "";
  logMessage("A new battle begins!");
  refreshDisplay();
}

btnRestart.addEventListener("click", restartBattle);
btnSwitch.addEventListener("click", toggleSwitchPanel);

nameEnemy.textContent = enemy.name;
namePlayer.textContent = player.name;

buildMoveButtons();
buildSwitchPanel();
refreshDisplay();
logMessage("A new battle begins!");
