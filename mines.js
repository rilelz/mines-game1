const BOARD_SIZE = 5;
const GRID_SIZE = BOARD_SIZE * BOARD_SIZE;

const GEM_SVG = `<svg width="48" height="48" viewBox="0 0 40 40" fill="none"><polygon points="20,4 36,14 32,34 8,34 4,14" fill="#23e165" stroke="#109a3d" stroke-width="2"/><polygon points="20,4 32,34 8,34" fill="#6affb7" opacity="0.7"/><polygon points="20,4 36,14 32,34" fill="#00b94d" opacity="0.5"/></svg>`;
const BOMB_SVG = `<svg width="48" height="48" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="24" r="12" fill="#222" stroke="#555" stroke-width="2"/><rect x="17" y="7" width="6" height="7" rx="2" fill="#555"/><path d="M20 6 L20 2" stroke="#f5c542" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="2" r="1.5" fill="#f5c542"/><path d="M16 10 Q20 14 24 10" stroke="#888" stroke-width="1.5" fill="none"/></svg>`;

const grid = document.getElementById('mines-grid');
const wagerInput = document.getElementById('wager');
const minesInput = document.getElementById('mines');
const betInfo = document.getElementById('info-bet');
const payoutInfo = document.getElementById('info-payout');
const minesInfo = document.getElementById('info-mines');
const safeInfo = document.getElementById('info-safe');
const placeBetBtn = document.getElementById('place-bet');
const cashoutBtn = document.getElementById('cashout');
const resetBtn = document.getElementById('reset');
const messageDiv = document.getElementById('stake-message');
const balanceAmount = document.getElementById('balance-amount');
const addFundsBtn = document.getElementById('add-funds-btn');
const addFundsMenu = document.getElementById('add-funds-menu');
const addFundsDropdown = addFundsBtn.parentElement;

let balance = 1000;
let betPlaced = false;
let revealed = [];
let minesArr = [];
let payout = 0;
let safeTiles = 0;
let currentBet = 0;

function updateBalanceDisplay() {
  balanceAmount.textContent = balance.toFixed(2);
}
function addFunds(amount) {
  balance += amount;
  updateBalanceDisplay();
  messageDiv.textContent = `+ $${amount.toFixed(2)} added to balance!`;
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

function fillGrid() {
  grid.innerHTML = '';
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
    messageDiv.textContent = "💥 You hit a mine! Game over.";
    messageDiv.className = "stake-message lose";
    currentBet = 0;
    updateBalanceDisplay();
  } else {
    tile.innerHTML = GEM_SVG;
    safeTiles++;
    safeInfo.textContent = safeTiles;
    payout = calcPayout();
    payoutInfo.textContent = payout.toFixed(2);
    tile.disabled = true;
  }
  revealed.push(idx);
}

function calcPayout() {
  // Demo: increase payout with each safe tile, real logic should match your backend
  const base = 1;
  return base + safeTiles * 0.3;
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
  wagerInput.disabled = true;
  minesInput.disabled = true;
  messageDiv.textContent = "";
  messageDiv.className = "stake-message";
  revealed = [];
  payout = 0;
  safeTiles = 0;
  safeInfo.textContent = safeTiles;
  payoutInfo.textContent = "0.00";
  betInfo.textContent = wager.toFixed(2);
  minesInfo.textContent = mines;
  currentBet = wager;
  balance -= wager;
  updateBalanceDisplay();
  minesArr = [];
  while (minesArr.length < mines) {
    const pos = Math.floor(Math.random() * GRID_SIZE);
    if (!minesArr.includes(pos)) minesArr.push(pos);
  }
  fillGrid();
}

function onCashout() {
  if (!betPlaced) return;
  betPlaced = false;
  placeBetBtn.disabled = false;
  cashoutBtn.disabled = true;
  wagerInput.disabled = false;
  minesInput.disabled = false;
  const winnings = currentBet * payout;
  balance += winnings;
  updateBalanceDisplay();
  messageDiv.textContent = `✅ You cashed out: $${winnings.toFixed(2)} (${payout.toFixed(2)}x)`;
  messageDiv.className = "stake-message win";
  currentBet = 0;
  document.querySelectorAll('.mines-tile').forEach(t => t.disabled = true);
}

function onReset() {
  betPlaced = false;
  revealed = [];
  payout = 0;
  safeTiles = 0;
  minesArr = [];
  wagerInput.disabled = false;
  minesInput.disabled = false;
  placeBetBtn.disabled = false;
  cashoutBtn.disabled = true;
  messageDiv.textContent = "";
  messageDiv.className = "stake-message";
  wagerInput.value = "1.00";
  minesInput.value = "5";
  betInfo.textContent = "1.00";
  payoutInfo.textContent = "0.00";
  minesInfo.textContent = "5";
  safeInfo.textContent = "0";
  currentBet = 0;
  fillGrid();
}

placeBetBtn.addEventListener('click', onPlaceBet);
cashoutBtn.addEventListener('click', onCashout);
resetBtn.addEventListener('click', onReset);

wagerInput.addEventListener('input', () => {
  betInfo.textContent = parseFloat(wagerInput.value || 0).toFixed(2);
});
minesInput.addEventListener('input', () => {
  minesInfo.textContent = minesInput.value;
});

updateBalanceDisplay();
