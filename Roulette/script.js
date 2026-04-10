const wheel = document.getElementById("wheel");
const resultDisplay = document.getElementById("resultDisplay");
const balanceEl = document.getElementById("balance");
const betList = document.getElementById("betList");
const totalWagerEl = document.getElementById("totalWager");
const chipRow = document.getElementById("chipRow");
const numberGrid = document.getElementById("numberGrid");
const zeroCell = document.getElementById("zeroCell");
const spinBtn = document.getElementById("spinBtn");
const clearBetsBtn = document.getElementById("clearBetsBtn");
const doubleBetsBtn = document.getElementById("doubleBetsBtn");
const depositBtn = document.getElementById("depositBtn");
const depositAmount = document.getElementById("depositAmount");
const advancedGrid = document.getElementById("advancedGrid");
const advancedType = document.getElementById("advancedType");
const placeAdvancedBtn = document.getElementById("placeAdvancedBtn");
const clearAdvancedBtn = document.getElementById("clearAdvancedBtn");
const advancedStatus = document.getElementById("advancedStatus");

const wheelNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34,
  6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18,
  29, 7, 28, 12, 35, 3, 26
];

const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const chipValues = [5, 10, 25, 50, 100, 250];
const payoutTable = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  line: 5,
  dozen: 2,
  column: 2,
  color: 1,
  parity: 1,
  range: 1
};

const advancedConfig = {
  split: { count: 2, label: "Split", payout: payoutTable.split },
  street: { count: 3, label: "Street", payout: payoutTable.street },
  corner: { count: 4, label: "Corner", payout: payoutTable.corner },
  line: { count: 6, label: "Line", payout: payoutTable.line }
};

let balance = 1500;
let selectedChip = chipValues[1];
let bets = [];
let betId = 0;
let currentRotation = 0;
let isSpinning = false;
let lastWinningNumber = null;
const selectedAdvancedNumbers = new Set();
const numberCells = new Map();

function formatMoney(value) {
  return `$${value.toLocaleString("en-US")}`;
}

function updateBalance() {
  balanceEl.textContent = formatMoney(balance);
}

function setResult(message) {
  resultDisplay.textContent = message;
}

function setAdvancedStatus(message) {
  advancedStatus.textContent = message;
}

function getColor(number) {
  if (number === 0) return "green";
  return redNumbers.has(number) ? "red" : "black";
}

function getColorHex(color) {
  if (color === "red") return "#cf3c3c";
  if (color === "black") return "#1a1a1a";
  return "#2bb673";
}

function buildWheel() {
  const step = 360 / wheelNumbers.length;
  const angleOffset = -step / 8;
  const gradientParts = wheelNumbers.map((num, index) => {
    const color = getColor(num);
    const start = index * step + angleOffset;
    const end = (index + 1) * step + angleOffset;
    return `${getColorHex(color)} ${start}deg ${end}deg`;
  });
  wheel.style.setProperty("--wheel-gradient", `conic-gradient(${gradientParts.join(",")})`);
  wheel.innerHTML = "";

  const radius = wheel.clientWidth / 2 - 34;
  wheelNumbers.forEach((num, index) => {
    const label = document.createElement("div");
    label.className = "slot-label";
    label.textContent = num;
    const angle = index * step + angleOffset + step / 2;
    label.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) rotate(0deg)`;
    wheel.appendChild(label);
  });
}

function buildBoard() {
  numberGrid.innerHTML = "";
  for (let i = 1; i <= 36; i += 1) {
    const cell = document.createElement("button");
    cell.className = `bet-cell ${getColor(i)}`;
    cell.dataset.betType = "straight";
    cell.dataset.number = i;
    cell.textContent = i;
    cell.addEventListener("click", () => placeStraightBet(i));
    numberGrid.appendChild(cell);
    numberCells.set(i, cell);
  }
  zeroCell.classList.add("green");
  zeroCell.addEventListener("click", () => placeStraightBet(0));
}

function buildChips() {
  chipRow.innerHTML = "";
  chipValues.forEach((value) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = formatMoney(value);
    chip.dataset.value = value;
    if (value === selectedChip) chip.classList.add("active");
    chip.addEventListener("click", () => selectChip(value));
    chipRow.appendChild(chip);
  });
}

function buildAdvancedGrid() {
  advancedGrid.innerHTML = "";
  for (let i = 1; i <= 36; i += 1) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.dataset.number = i;
    btn.addEventListener("click", () => toggleAdvancedNumber(i, btn));
    advancedGrid.appendChild(btn);
  }
}

function selectChip(value) {
  selectedChip = value;
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", Number(chip.dataset.value) === value);
  });
  setResult(`Chip selected: ${formatMoney(value)}.`);
}

function placeStraightBet(number) {
  placeBet({
    type: "straight",
    label: `Straight ${number}`,
    payout: payoutTable.straight,
    numbers: [number]
  });
}

function placeBet(bet) {
  const amount = selectedChip;
  if (amount <= 0) return;
  if (balance < amount) {
    setResult("Not enough balance. Deposit more funds.");
    return;
  }
  balance -= amount;
  updateBalance();
  bets.push({ id: ++betId, amount, ...bet });
  renderBets();
  setResult(`${bet.label} placed for ${formatMoney(amount)}.`);
}

function renderBets() {
  betList.innerHTML = "";
  let total = 0;
  bets.forEach((bet) => {
    total += bet.amount;
    const item = document.createElement("div");
    item.className = "bet-item";
    const info = document.createElement("div");
    info.innerHTML = `<strong>${bet.label}</strong><br/><small>${formatMoney(bet.amount)} | Pays ${bet.payout}:1</small>`;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeBet(bet.id));
    item.appendChild(info);
    item.appendChild(removeBtn);
    betList.appendChild(item);
  });
  totalWagerEl.textContent = `${formatMoney(total)} wagered`;
}

function removeBet(id) {
  const index = bets.findIndex((bet) => bet.id === id);
  if (index === -1) return;
  const [removed] = bets.splice(index, 1);
  balance += removed.amount;
  updateBalance();
  renderBets();
  setResult(`${removed.label} removed.`);
}

function clearBets() {
  if (!bets.length) return;
  const refund = bets.reduce((sum, bet) => sum + bet.amount, 0);
  balance += refund;
  bets = [];
  updateBalance();
  renderBets();
  setResult("All bets cleared and refunded.");
}

function doubleBets() {
  if (!bets.length) {
    setResult("Place a bet first before doubling.");
    return;
  }
  const total = bets.reduce((sum, bet) => sum + bet.amount, 0);
  if (balance < total) {
    setResult("Not enough balance to double all bets.");
    return;
  }
  const clones = bets.map((bet) => ({ ...bet, id: ++betId }));
  balance -= total;
  bets = bets.concat(clones);
  updateBalance();
  renderBets();
  setResult("All bets doubled.");
}

function spinWheel() {
  if (isSpinning) return;
  if (!bets.length) {
    setResult("Place at least one bet to spin the wheel.");
    return;
  }
  isSpinning = true;
  spinBtn.disabled = true;
  clearWinnerHighlight();
  const winIndex = Math.floor(Math.random() * wheelNumbers.length);
  const winNumber = wheelNumbers[winIndex];
  const step = 360 / wheelNumbers.length;
  const angleOffset = -step / 2;
  const offset = (Math.random() - 0.5) * step * 0.6;
  const extraSpins = 5 + Math.floor(Math.random() * 3);
  const targetAngle = winIndex * step + angleOffset + step / 2;
  currentRotation += extraSpins * 360 - targetAngle + offset;
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  setResult("Spinning...");

  window.setTimeout(() => finishSpin(winNumber), 4600);
}

function finishSpin(winNumber) {
  const totalStaked = bets.reduce((sum, bet) => sum + bet.amount, 0);
  let payout = 0;
  bets.forEach((bet) => {
    if (isBetWinner(bet, winNumber)) {
      payout += bet.amount * (bet.payout + 1);
    }
  });

  balance += payout;
  updateBalance();
  const net = payout - totalStaked;
  const color = getColor(winNumber);
  lastWinningNumber = winNumber;
  highlightWinner(winNumber);

  if (payout > 0) {
    const netText = net >= 0 ? `Net +${formatMoney(net)}` : `Net -${formatMoney(Math.abs(net))}`;
    setResult(`Result: ${winNumber} ${color}. Payout ${formatMoney(payout)}. ${netText}.`);
  } else {
    setResult(`Result: ${winNumber} ${color}. No wins this round.`);
  }

  bets = [];
  renderBets();
  isSpinning = false;
  spinBtn.disabled = false;
}

function isBetWinner(bet, winNumber) {
  switch (bet.type) {
    case "straight":
    case "split":
    case "street":
    case "corner":
    case "line":
      return bet.numbers.includes(winNumber);
    case "color":
      return winNumber !== 0 && getColor(winNumber) === bet.color;
    case "parity":
      return winNumber !== 0 && (winNumber % 2 === 0 ? "even" : "odd") === bet.parity;
    case "range":
      return winNumber !== 0 && (bet.range === "low" ? winNumber <= 18 : winNumber >= 19);
    case "dozen":
      if (winNumber === 0) return false;
      return Math.ceil(winNumber / 12) === bet.dozen;
    case "column":
      if (winNumber === 0) return false;
      return ((winNumber - 1) % 3) + 1 === bet.column;
    default:
      return false;
  }
}

function highlightWinner(winNumber) {
  clearWinnerHighlight();
  if (winNumber === 0) {
    zeroCell.classList.add("winner");
    return;
  }
  const cell = numberCells.get(winNumber);
  if (cell) cell.classList.add("winner");
}

function clearWinnerHighlight() {
  zeroCell.classList.remove("winner");
  numberCells.forEach((cell) => cell.classList.remove("winner"));
}

function handleOutsideBet(button) {
  const type = button.dataset.betType;
  if (type === "color") {
    const color = button.dataset.color;
    placeBet({
      type: "color",
      color,
      label: `${color.charAt(0).toUpperCase() + color.slice(1)}`,
      payout: payoutTable.color
    });
  }
  if (type === "parity") {
    const parity = button.dataset.parity;
    placeBet({
      type: "parity",
      parity,
      label: parity === "even" ? "Even" : "Odd",
      payout: payoutTable.parity
    });
  }
  if (type === "range") {
    const range = button.dataset.range;
    placeBet({
      type: "range",
      range,
      label: range === "low" ? "1-18" : "19-36",
      payout: payoutTable.range
    });
  }
  if (type === "dozen") {
    const dozen = Number(button.dataset.dozen);
    placeBet({
      type: "dozen",
      dozen,
      label: `${dozen}st 12`.replace("1st", "1st").replace("2st", "2nd").replace("3st", "3rd"),
      payout: payoutTable.dozen
    });
  }
  if (type === "column") {
    const column = Number(button.dataset.column);
    placeBet({
      type: "column",
      column,
      label: `Column ${column}`,
      payout: payoutTable.column
    });
  }
}

function toggleAdvancedNumber(number, button) {
  const config = advancedConfig[advancedType.value];
  if (selectedAdvancedNumbers.has(number)) {
    selectedAdvancedNumbers.delete(number);
    button.classList.remove("selected");
  } else {
    if (selectedAdvancedNumbers.size >= config.count) {
      setAdvancedStatus(`Max ${config.count} numbers for a ${config.label} bet.`);
      return;
    }
    selectedAdvancedNumbers.add(number);
    button.classList.add("selected");
  }
  const selected = Array.from(selectedAdvancedNumbers).sort((a, b) => a - b).join(", ");
  setAdvancedStatus(selected ? `Selected: ${selected}` : "");
}

function clearAdvancedSelection() {
  selectedAdvancedNumbers.clear();
  advancedGrid.querySelectorAll("button").forEach((btn) => btn.classList.remove("selected"));
  setAdvancedStatus("");
}

function placeAdvancedBet() {
  const type = advancedType.value;
  const config = advancedConfig[type];
  const numbers = Array.from(selectedAdvancedNumbers).sort((a, b) => a - b);
  if (numbers.length !== config.count) {
    setAdvancedStatus(`Select ${config.count} numbers for a ${config.label} bet.`);
    return;
  }
  if (!validateAdvancedSelection(type, numbers)) {
    setAdvancedStatus(`${config.label} selection is not a valid table combo.`);
    return;
  }
  placeBet({
    type,
    numbers,
    payout: config.payout,
    label: `${config.label} ${numbers.join("-")}`
  });
  clearAdvancedSelection();
}

function getRowCol(number) {
  return {
    row: Math.ceil(number / 3),
    col: ((number - 1) % 3) + 1
  };
}

function validateAdvancedSelection(type, numbers) {
  const coords = numbers.map(getRowCol);
  const rows = coords.map((c) => c.row);
  const cols = coords.map((c) => c.col);
  const uniqueRows = new Set(rows);
  const uniqueCols = new Set(cols);

  if (type === "split") {
    const [a, b] = coords;
    const sameRow = a.row === b.row && Math.abs(a.col - b.col) === 1;
    const sameCol = a.col === b.col && Math.abs(a.row - b.row) === 1;
    return sameRow || sameCol;
  }
  if (type === "street") {
    return uniqueRows.size === 1 && uniqueCols.size === 3;
  }
  if (type === "corner") {
    if (uniqueRows.size !== 2 || uniqueCols.size !== 2) return false;
    const rowMin = Math.min(...rows);
    const rowMax = Math.max(...rows);
    const colMin = Math.min(...cols);
    const colMax = Math.max(...cols);
    if (rowMax - rowMin !== 1 || colMax - colMin !== 1) return false;
    const needed = new Set([
      `${rowMin}-${colMin}`,
      `${rowMin}-${colMax}`,
      `${rowMax}-${colMin}`,
      `${rowMax}-${colMax}`
    ]);
    return coords.every((c) => needed.has(`${c.row}-${c.col}`));
  }
  if (type === "line") {
    if (uniqueRows.size !== 2 || uniqueCols.size !== 3) return false;
    const rowMin = Math.min(...rows);
    const rowMax = Math.max(...rows);
    if (rowMax - rowMin !== 1) return false;
    const required = new Set([
      `${rowMin}-1`, `${rowMin}-2`, `${rowMin}-3`,
      `${rowMax}-1`, `${rowMax}-2`, `${rowMax}-3`
    ]);
    return coords.every((c) => required.has(`${c.row}-${c.col}`));
  }
  return false;
}

function handleDeposit(amount) {
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    setResult("Enter a valid deposit amount.");
    return;
  }
  balance += amount;
  updateBalance();
  setResult(`Deposited ${formatMoney(amount)}.`);
}

function hookOutsideBets() {
  document.querySelectorAll(".bet-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleOutsideBet(btn));
  });
}

function init() {
  updateBalance();
  buildChips();
  buildBoard();
  buildAdvancedGrid();
  buildWheel();
  hookOutsideBets();

  spinBtn.addEventListener("click", spinWheel);
  clearBetsBtn.addEventListener("click", clearBets);
  doubleBetsBtn.addEventListener("click", doubleBets);
  depositBtn.addEventListener("click", () => handleDeposit(Number(depositAmount.value)));
  document.querySelectorAll(".chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleDeposit(Number(btn.dataset.deposit)));
  });
  placeAdvancedBtn.addEventListener("click", placeAdvancedBet);
  clearAdvancedBtn.addEventListener("click", clearAdvancedSelection);
  advancedType.addEventListener("change", () => {
    clearAdvancedSelection();
    setAdvancedStatus("");
  });

  window.addEventListener("resize", buildWheel);
}

init();
