// Stake-style Mines game JS (5x5 grid, fills space)
const BOARD_SIZE = 5;
const GRID_SIZE = BOARD_SIZE * BOARD_SIZE;

const GEM_SVG = `<svg width="48" height="48" viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 32,34 8,34 4,14" fill="#23e165" stroke="#109a3d" stroke-width="2"/><polygon points="20,4 32,34 8,34" fill="#6affb7" opacity="0.7"/><polygon points="20,4 36,14 32,34" fill="#00b94d" opacity="0.5"/></svg>`;
const BOMB_SVG = `<svg width="48" height="48" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="24" r="12" fill="#222" stroke="#555" stroke-width="2"/><rect x="17" y="7" width="6" height="7" rx="2" fill="#555"/><path d="M20 6 L20 2" stroke="#f5c542" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="2" r="1.5" fill="#f5c542"/><path d="M16 10 Q20 14 24 10" stroke="#888" stroke-width="1.5" fill="none"/></svg>`;

const grid = document.getElementById('mines-grid');
const wagerInput = document.getElementById('wager');
const minesInput = document.getElementById('mines');
const placeBetBtn = document.getElementById('place-bet');
const cashoutBtn = document.getElementById('cashout');
const randomBtn = document.getElementById('random-tile');
const messageDiv = document.getElementById('stake-message');
const balanceAmount = document.getElementById('balance-amount');
const addFundsBtn = document.getElementById('add-funds-btn');
const addFundsMenu = document.getElementById('add-funds-menu');
const addFundsDropdown = addFundsBtn.parentElement;
const cashoutResult = document.getElementById('stake-cashout-result');
const cashoutMult = document.getElementById('cashout-mult');
const cashoutWin = document.getElementById('cashout-win');

let balance = 1000;
let betPlaced = false;
let revealed = [];
let minesArr = [];
let safeTiles = 0;
let currentBet = 0;
let currentPayout = 0;

// -- BALANCE --
function updateBalanceDisplay() {
  balanceAmount.textContent = `$${balance.toFixed(2)}`;
}
function addFunds(amount) {
  balance += amount;
  updateBalanceDisplay();
  messageDiv.textContent = `+ $${amount.toFixed(2)} added!`;
  messageDiv.className = "stake-message win";
  setTimeout(() => {
    if (messageDiv.textContent.startsWith("+ $")) {
      messageDiv.textContent = "";
      messageDiv.className = "stake-message";
    }
  }, 1500);
}
addFundsBtn.addEventListener('click', () => {
  addFundsDropdown.classList.toggle('open');
});
addFundsMenu.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', e => {
    const amt = parseFloat(btn.getAttribute('data-amount'));
    addFunds(amt);
    addFundsDropdown.classList.remove('open');
  });
});
document.addEventListener('click', e => {
  if (!addFundsDropdown.contains(e.target)) {
    addFundsDropdown.classList.remove('open');
  }
});

// -- GAME --
function fillGrid() {
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;
  for (let i = 0; i < GRID_SIZE; i++) {
    const tile = document.createElement('button');
    tile.className = 'mines-tile';
    tile.dataset.index = i;
    tile.disabled = !betPlaced;
    tile.addEventListener('click', () => onTileClick(i, tile));
    grid.appendChild(tile);
  }
}
fillGrid();

function onTileClick(idx, tile) {
  if (!betPlaced || tile.classList.contains('revealed')) return;
  const isMine = minesArr.includes(idx);
  tile.classList.add('revealed');
  if (isMine) {
    tile.classList.add('mine');
    tile.innerHTML = BOMB_SVG;
    document.querySelectorAll('.mines-tile').forEach((t, j) => {
      if (minesArr.includes(j)) {
        t.classList.add('revealed', 'mine');
        t.innerHTML = BOMB_SVG;
      }
      t.disabled = true;
    });
    betPlaced = false;
    cashoutBtn.disabled = true;
    randomBtn.disabled = true;
    messageDiv.textContent = "💥 You hit a mine! Game over.";
    messageDiv.className = "stake-message lose";
    currentBet = 0;
    currentPayout = 0;
    updateBalanceDisplay();
    setTimeout(resetToStart, 1500);
  } else {
    tile.innerHTML = GEM_SVG;
    safeTiles++;
    tile.disabled = true;
    // payout hidden until cashout
  }
  revealed.push(idx);
}

function calcPayout() {
  const mines = parseInt(minesInput.value, 10);
  const safeClicked = safeTiles;
  let payout = 1;
  for (let i = 0; i < safeClicked; i++) {
    payout *= (GRID_SIZE - i - mines) / (GRID_SIZE - i);
  }
  payout = payout === 1 ? 1 : Math.max(1.01, 1 / payout);
  return payout;
}

function onPlaceBet() {
  const wager = parseFloat(wagerInput.value);
  const mines = parseInt(minesInput.value, 10);
  if (isNaN(wager) || wager < 0.01 || isNaN(mines) || mines < 1 || mines >= GRID_SIZE) {
    messageDiv.textContent = "Enter a valid bet and mine count.";
    messageDiv.className = "stake-message lose";
    return;
  }
  if (wager > balance) {
    messageDiv.textContent = "Insufficient balance!";
    messageDiv.className = "stake-message lose";
    return;
  }
  betPlaced = true;
  placeBetBtn.disabled = true;
  cashoutBtn.disabled = false;
  randomBtn.disabled = false;
  wagerInput.disabled = true;
  minesInput.disabled = true;
  messageDiv.textContent = "";
  messageDiv.className = "stake-message";
  revealed = [];
  safeTiles = 0;
  currentBet = wager;
  balance -= wager;
  updateBalanceDisplay();
  minesArr = [];
  while (minesArr.length < mines) {
    const pos = Math.floor(Math.random() * GRID_SIZE);
    if (!minesArr.includes(pos)) minesArr.push(pos);
  }
  fillGrid();
  cashoutResult.style.display = "none";
}

function onCashout() {
  if (!betPlaced) return;
  betPlaced = false;
  placeBetBtn.disabled = false;
  cashoutBtn.disabled = true;
  randomBtn.disabled = true;
  wagerInput.disabled = false;
  minesInput.disabled = false;

  // Calculate payout
  const payout = calcPayout();
  currentPayout = payout;
  const winnings = currentBet * payout;

  // Show pretty gem with payout
  cashoutMult.textContent = `${payout.toFixed(2)}x`;
  cashoutWin.textContent = `+$${winnings.toFixed(2)}`;
  cashoutResult.style.display = "flex";
  messageDiv.textContent = "";
  messageDiv.className = "stake-message";

  // add winnings to balance
  balance += winnings;
  updateBalanceDisplay();

  currentBet = 0;

  // disable grid
  document.querySelectorAll('.mines-tile').forEach(t => t.disabled = true);
}

function resetToStart() {
  betPlaced = false;
  revealed = [];
  safeTiles = 0;
  minesArr = [];
  wagerInput.disabled = false;
  minesInput.disabled = false;
  placeBetBtn.disabled = false;
  cashoutBtn.disabled = true;
  randomBtn.disabled = false;
  messageDiv.textContent = "";
  messageDiv.className = "stake-message";
  cashoutResult.style.display = "none";
  fillGrid();
}

function onRandomTile() {
  if (!betPlaced) return;
  // Pick a random unrevealed tile and click it
  const unrevealed = [];
  document.querySelectorAll('.mines-tile').forEach((t, i) => {
    if (!t.classList.contains('revealed')) unrevealed.push({t, i});
  });
  if (unrevealed.length === 0) return;
  const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
  pick.t.click();
}

placeBetBtn.addEventListener('click', onPlaceBet);
cashoutBtn.addEventListener('click', onCashout);
randomBtn.addEventListener('click', onRandomTile);

updateBalanceDisplay();
