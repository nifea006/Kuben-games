const chicken = document.getElementById('chicken');
const balanceDisplays = document.querySelectorAll('.balance-display');
const cashoutBtn = document.getElementById('cashout-btn');
const addBtn = document.getElementById('add-btn');
const goBtn = document.getElementById('go-btn');
const autoCashoutBtn = document.getElementById('auto-cashout-btn');
const autoCashoutChips = Array.from(document.querySelectorAll('.auto-chip'));
const pills = document.querySelectorAll('.pill');
const statusText = document.getElementById('status-text');
const toast = document.getElementById('toast');
const columns = Array.from(document.querySelectorAll('.column'));
const stepDisplay = document.getElementById('step-display');

let balance = 0;
let starterGiven = false;
let isRunning = false;
let currentDifficulty = 'Easy';
let steps = 0;
let autoCashoutEnabled = false;
let autoCashoutThreshold = 1000;

const defaultChickenLeft = '18%';
const multipliers = [1, 1.2, 1.5, 1.8, 2];
const lossMessages = [
    'Old man ran you over',
    'Dude with Storm Ltd ran you over',
    'Skatteetaten ran you over',
    'Kjell Ove ran you over',
    'scnh´im ran you over',
    'A Tesla on winter tires ran you over',
    'A guy named Roger ran you over',
    'A foodora bike ran you over since he was late for a delivery',
    'A distracted driver ran you over',
    'A trucker on a coffee break ran you over',
    'A bus driver looking for a parking spot ran you over',
    'A cyclist swerving to avoid a pothole ran you over',
    'A pedestrian jaywalking ran you over',
    'A delivery van making a last-minute stop ran you over'
];
const starterMessages = [
    'Starter pack dropped: +$50 chicken welfare',
    'Municipal seed support approved: +$50',
    'A suspicious uncle spotted you +$50',
    'The chicken union sent you a welcome gift: +$50',
    'A mysterious benefactor admired your courage: +$50'
];
const peckMessages = [
    'Chicken found a sidewalk coin: +$5',
    'Pecked a rich breadcrumb: +$5',
    'Street seed combo activated: +$5'
];
const winMessages = [
    'Chicken cooked the odds',
    'Traffic forgot to spawn',
    'Road inspector looked away',
    'The crosswalk gods approved this run'
];
const depositMessages = [
    'DNB panic transfer complete',
    'Emergency road fund received',
    'Wallet inflated for reckless poultry behavior'
];
const cashoutMessages = [
    'Escaped with the bag',
    'Cashed out before the asphalt remembered you',
    'Profit evacuated to a safer location'
];
const difficultyMessages = {
    Easy: 'Easy mode: local traffic is half asleep',
    Medium: 'Medium mode: drivers are checking mirrors',
    Hard: 'Hard mode: everyone is late for work',
    Hardcore: 'Hardcore mode: the road has personal beef'
};
const difficultyConfig = {
    Easy: { winChance: 0.8, weights: [0.4, 0.3, 0.18, 0.1, 0.02] },
    Medium: { winChance: 0.65, weights: [0.32, 0.26, 0.2, 0.15, 0.07] },
    Hard: { winChance: 0.5, weights: [0.26, 0.22, 0.2, 0.18, 0.14] },
    Hardcore: { winChance: 0.35, weights: [0.2, 0.2, 0.2, 0.2, 0.2] }
};

function formatThreshold(value) {
    return value >= 1000 ? `${value / 1000}k` : `${value}`;
}

function syncAutoCashoutUi() {
    if (autoCashoutBtn) {
        autoCashoutBtn.classList.toggle('active', autoCashoutEnabled);
        autoCashoutBtn.textContent = autoCashoutEnabled
            ? `Auto Cashout ${formatThreshold(autoCashoutThreshold)}`
            : 'Auto Cashout Off';
    }

    autoCashoutChips.forEach((chip) => {
        const threshold = Number(chip.dataset.threshold);
        chip.classList.toggle('active', threshold === autoCashoutThreshold);
    });
}

function cashoutBalance(reason = 'manual') {
    if (balance <= 0) return false;
    const cash = balance;
    const cashoutMessage = pickRandomMessage(cashoutMessages, 'Cashed out');
    setBalance(0);
    const prefix = reason === 'auto'
        ? `Auto cashout ${formatThreshold(autoCashoutThreshold)}`
        : cashoutMessage;
    const msg = `${prefix}: $${cash.toFixed(2)} sent to DNB 1337 67 42069`;
    setStatus(msg, 'win');
    showToast(msg, 'win');
    return true;
}

function maybeAutoCashout() {
    if (!autoCashoutEnabled || balance < autoCashoutThreshold) return;
    cashoutBalance('auto');
}

function syncBalance() {
    balanceDisplays.forEach((el) => {
        el.textContent = `Balance: $${balance.toFixed(2)}`;
    });
    if (cashoutBtn) {
        cashoutBtn.disabled = balance <= 0;
    }
    maybeAutoCashout();
}

function syncSteps() {
    if (stepDisplay) {
        stepDisplay.textContent = `Steps: ${steps}`;
    }
}

function setBalance(newValue) {
    balance = Math.max(0, newValue);
    syncBalance();
    balanceDisplays.forEach((el) => {
        el.classList.add('balance-update');
        setTimeout(() => el.classList.remove('balance-update'), 300);
    });
}

function updateBalance(delta) {
    setBalance(balance + delta);
}

function pickRandomMessage(messages = [], fallback = 'Message unavailable') {
    if (!messages.length) return fallback;
    return messages[Math.floor(Math.random() * messages.length)];
}

function grantStarter() {
    if (starterGiven) return;
    starterGiven = true;
    updateBalance(50);
    showToast(pickRandomMessage(starterMessages, 'Starter +$50 added'), 'win');
}

function setStatus(message, tone = 'neutral') {
    if (!statusText) return;
    statusText.textContent = message;
    if (tone === 'win') {
        statusText.style.color = '#b7f0c8';
    } else if (tone === 'lose') {
        statusText.style.color = '#ffd7de';
    } else {
        statusText.style.color = '#e3f1ff';
    }
}

function showToast(message, tone = 'neutral') {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('success', 'fail', 'show');
    if (tone === 'win') {
        toast.classList.add('success');
    } else if (tone === 'lose') {
        toast.classList.add('fail');
    }
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1900);
}

function pickIndex(weights = []) {
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i += 1) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

function getColumnLeft(el) {
    if (!el) return defaultChickenLeft;
    const styleLeft = el.style.left || getComputedStyle(el).left;
    return styleLeft || defaultChickenLeft;
}

function animateChickenTo(leftValue, callback) {
    if (!chicken) {
        callback?.();
        return;
    }
    chicken.classList.add('running');
    requestAnimationFrame(() => {
        chicken.style.left = leftValue;
        setTimeout(() => callback && callback(), 780);
    });
}

function resetChicken() {
    if (!chicken) return;
    chicken.style.left = defaultChickenLeft;
    chicken.classList.remove('running', 'shake');
}

function endRun() {
    setTimeout(() => {
        resetChicken();
        if (goBtn) {
            goBtn.textContent = 'GO';
            goBtn.disabled = false;
            goBtn.classList.remove('running');
        }
        isRunning = false;
    }, 1100);
}

function startRun() {
    if (isRunning) return;
    const config = difficultyConfig[currentDifficulty] || difficultyConfig.Medium;
    isRunning = true;
    steps += 1;
    syncSteps();

    if (goBtn) {
        goBtn.textContent = 'Running...';
        goBtn.disabled = true;
        goBtn.classList.add('running');
    }

    const didWin = Math.random() < config.winChance;

    if (didWin) {
        const targetIndex = pickIndex(config.weights);
        const targetColumn = columns[targetIndex] || columns[0];
        const factor = multipliers[targetIndex] || multipliers[0];

        animateChickenTo(getColumnLeft(targetColumn), () => {
            const before = balance;
            const newBalance = Number((balance * factor).toFixed(2));
            const gain = Math.max(0, newBalance - before);
            const winMessage = pickRandomMessage(winMessages, 'Chicken survived');

            setBalance(newBalance);
            setStatus(`${winMessage}: ${factor.toFixed(2)}x -> +$${gain.toFixed(2)} on ${currentDifficulty}`, 'win');
            showToast(`${winMessage}! +$${gain.toFixed(2)}`, 'win');
            endRun();
        });
    } else {
        const missLeft = `${14 + Math.random() * 18}%`;
        animateChickenTo(missLeft, () => {
            const lossMessage = pickRandomMessage(lossMessages, 'You got run over');
            if (chicken) chicken.classList.add('shake');
            setStatus(`${lossMessage} on ${currentDifficulty}`, 'lose');
            showToast(lossMessage, 'lose');
            endRun();
        });
    }
}

if (chicken) {
    chicken.addEventListener('click', () => {
        grantStarter();
        updateBalance(5);
        const peckMessage = pickRandomMessage(peckMessages, 'Chicken pecked +$5');
        setStatus(peckMessage, 'win');
        showToast(peckMessage, 'win');
    });
}

if (cashoutBtn) {
    cashoutBtn.addEventListener('click', () => {
        cashoutBalance();
    });
}

if (autoCashoutBtn) {
    autoCashoutBtn.addEventListener('click', () => {
        autoCashoutEnabled = !autoCashoutEnabled;
        syncAutoCashoutUi();
        const message = autoCashoutEnabled
            ? `Auto cashout armed at ${formatThreshold(autoCashoutThreshold)}`
            : 'Auto cashout disabled';
        setStatus(message);
        showToast(message);
        maybeAutoCashout();
    });
}

autoCashoutChips.forEach((chip) => {
    chip.addEventListener('click', () => {
        const threshold = Number(chip.dataset.threshold);
        if (!threshold) return;
        autoCashoutThreshold = threshold;
        syncAutoCashoutUi();
        const message = `Auto cashout target set to ${formatThreshold(autoCashoutThreshold)}`;
        setStatus(message);
        showToast(message);
        maybeAutoCashout();
    });
});

if (addBtn) {
    addBtn.addEventListener('click', () => {
        const amount = 50;
        const depositMessage = pickRandomMessage(depositMessages, 'Transfer received');
        updateBalance(amount);
        const msg = `${depositMessage}: +$${amount.toFixed(2)} from DNB XXXX XX XXXXX`;
        setStatus(msg, 'win');
        showToast(msg, 'win');
    });
}

if (goBtn) {
    goBtn.addEventListener('click', () => {
        grantStarter();
        startRun();
    });
}

pills.forEach((pill) => {
    pill.addEventListener('click', () => {
        const diff = pill.dataset.difficulty;
        if (!diff || diff === currentDifficulty) return;
        currentDifficulty = diff;
        pills.forEach((p) => p.classList.toggle('active', p === pill));
        const difficultyMessage = difficultyMessages[currentDifficulty] || `Difficulty: ${currentDifficulty}`;
        setStatus(difficultyMessage);
        showToast(difficultyMessage);
    });
});

syncBalance();
syncAutoCashoutUi();
setStatus('Ready to cross');
syncSteps();
