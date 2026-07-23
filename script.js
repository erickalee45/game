const player = {
  name: "Fighter A",
  maxHp: 100,
  hp: 100,
  attackMin: 10,
  attackMax: 20
};

const enemy = {
  name: "Fighter B",
  maxHp: 100,
  hp: 100,
  attackMin: 8,
  attackMax: 18
};

const hpBarPlayer = document.getElementById("hp-bar-player");
const hpTextPlayer = document.getElementById("hp-text-player");
const hpBarEnemy = document.getElementById("hp-bar-enemy");
const hpTextEnemy = document.getElementById("hp-text-enemy");
const battleLog = document.getElementById("battle-log");
const btnAttack = document.getElementById("btn-attack");
const btnRestart = document.getElementById("btn-restart");

let battleOver = false;

function randomDamage(fighter) {
  return Math.floor(Math.random() * (fighter.attackMax - fighter.attackMin + 1)) + fighter.attackMin;
}

function logMessage(text) {
  const entry = document.createElement("div");
  entry.textContent = text;
  battleLog.prepend(entry);
}

function updateHpDisplay(fighter, barEl, textEl) {
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  barEl.style.width = pct + "%";
  barEl.classList.toggle("low", pct <= 25);
  textEl.textContent = `${Math.max(0, fighter.hp)} / ${fighter.maxHp} HP`;
}

function refreshDisplay() {
  updateHpDisplay(player, hpBarPlayer, hpTextPlayer);
  updateHpDisplay(enemy, hpBarEnemy, hpTextEnemy);
}

function endBattle(didPlayerWin) {
  battleOver = true;
  btnAttack.disabled = true;
  btnRestart.style.display = "inline-block";
  logMessage(didPlayerWin ? `${enemy.name} is defeated. ${player.name} wins!` : `${player.name} is defeated. ${enemy.name} wins!`);
}

const ENEMY_THINK_DELAY_MIN_MS = 1000;
const ENEMY_THINK_DELAY_MAX_MS = 2000;

function takeTurn() {
  if (battleOver) return;

  btnAttack.disabled = true;

  const playerDamage = randomDamage(player);
  enemy.hp -= playerDamage;
  logMessage(`${player.name} attacks ${enemy.name} for ${playerDamage} damage.`);
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
      btnAttack.disabled = false;
    }
  }, thinkDelay);
}

function restartBattle() {
  player.hp = player.maxHp;
  enemy.hp = enemy.maxHp;
  battleOver = false;
  btnAttack.disabled = false;
  btnRestart.style.display = "none";
  battleLog.innerHTML = "";
  logMessage("A new battle begins!");
  refreshDisplay();
}

btnAttack.addEventListener("click", takeTurn);
btnRestart.addEventListener("click", restartBattle);

refreshDisplay();
logMessage("A new battle begins!");
