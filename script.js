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
  attackMax: 18
};

// Corrosive Blood (passive) is intentionally excluded — passives aren't selectable moves.
const MOVES = [
  {
    id: "slash",
    name: "Slash",
    description: "Slash them.",
    isAvailable: () => true
  },
  {
    id: "bite",
    name: "Bite",
    description: "Take a bite.",
    isAvailable: () => true
  },
  {
    id: "pursue",
    name: "Pursue",
    description: "Don't let them get away.",
    isAvailable: () => enemy.hp > 0 && enemy.hp / enemy.maxHp <= 0.2
  }
];

const ENEMY_THINK_DELAY_MIN_MS = 1000;
const ENEMY_THINK_DELAY_MAX_MS = 2000;
const DEFAULT_MOVE_DESCRIPTION = "Hover or focus a move to see what it does.";

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

  const playerDamage = randomDamage(player);
  enemy.hp -= playerDamage;
  logMessage(`${player.name} uses ${move.name} on ${enemy.name} for ${playerDamage} damage.`);
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
    } else {
      setMovesLocked(false);
    }
  }, thinkDelay);
}

function restartBattle() {
  player.hp = player.maxHp;
  enemy.hp = enemy.maxHp;
  battleOver = false;
  setMovesLocked(false);
  btnRestart.style.display = "none";
  narrationBox.innerHTML = "";
  logMessage("A new battle begins!");
  refreshDisplay();
}

btnRestart.addEventListener("click", restartBattle);

nameEnemy.textContent = enemy.name;
namePlayer.textContent = player.name;

buildMoveButtons();
refreshDisplay();
logMessage("A new battle begins!");
