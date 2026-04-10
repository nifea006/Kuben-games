const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayHint = document.getElementById("overlayHint");
const startBtn = document.getElementById("startBtn");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const world = {
  width: 420,
  height: 640
};

const colors = {
  skyTop: "#8ac8ff",
  skyBottom: "#bdefff",
  pipe: "#2e8b57",
  pipeDark: "#1f6a42",
  bird: "#f2c94c",
  wing: "#e2b43c",
  beak: "#f29f4b",
  cloud: "rgba(255, 255, 255, 0.65)",
  ground: "#2f9e4f",
  groundDark: "#1f7a3b"
};

const gameState = {
  running: false,
  gameOver: false,
  score: 0,
  best: Number(localStorage.getItem("flappyBest") || 0)
};

const bird = {
  x: 120,
  y: 320,
  radius: 16,
  velocity: 0,
  gravity: 1200,
  lift: -460
};

const pipes = [];
const pipeConfig = {
  gap: 170,
  width: 70,
  speed: 210,
  spacing: 220
};

let lastTime = 0;
let spawnTimer = 0;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = world.width * ratio;
  canvas.height = world.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function resetGame() {
  bird.y = world.height / 2;
  bird.velocity = 0;
  pipes.length = 0;
  spawnTimer = 0;
  gameState.score = 0;
  gameState.running = false;
  gameState.gameOver = false;
  updateScores();
}

function startGame() {
  resetGame();
  gameState.running = true;
  overlay.classList.add("hidden");
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  gameState.running = false;
  gameState.gameOver = true;
  if (gameState.score > gameState.best) {
    gameState.best = gameState.score;
    localStorage.setItem("flappyBest", String(gameState.best));
  }
  updateScores();
  overlayTitle.textContent = "Game Over";
  overlayHint.textContent = `Score ${gameState.score}. Tap to fly again.`;
  startBtn.textContent = "Restart";
  overlay.classList.remove("hidden");
}

function updateScores() {
  scoreEl.textContent = gameState.score;
  bestEl.textContent = gameState.best;
}

function flap() {
  if (!gameState.running && !gameState.gameOver) {
    startGame();
    return;
  }
  if (gameState.gameOver) {
    startGame();
    return;
  }
  bird.velocity = bird.lift;
}

function spawnPipe() {
  const minTop = 90;
  const maxTop = world.height - pipeConfig.gap - 120;
  const topHeight = Math.max(minTop, Math.random() * maxTop);
  pipes.push({
    x: world.width + pipeConfig.width,
    top: topHeight,
    passed: false
  });
}

function update(delta) {
  bird.velocity += bird.gravity * delta;
  bird.y += bird.velocity * delta;

  spawnTimer += delta * 1000;
  if (spawnTimer > 1500) {
    spawnTimer = 0;
    spawnPipe();
  }

  pipes.forEach((pipe) => {
    pipe.x -= pipeConfig.speed * delta;
    if (!pipe.passed && pipe.x + pipeConfig.width < bird.x) {
      pipe.passed = true;
      gameState.score += 1;
      updateScores();
    }
  });

  while (pipes.length && pipes[0].x + pipeConfig.width < -20) {
    pipes.shift();
  }

  if (bird.y + bird.radius >= world.height - 40) {
    bird.y = world.height - 40 - bird.radius;
    endGame();
  }
  if (bird.y - bird.radius <= 0) {
    bird.y = bird.radius;
    bird.velocity = 0;
  }

  pipes.forEach((pipe) => {
    const inX = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeConfig.width;
    const inTop = bird.y - bird.radius < pipe.top;
    const inBottom = bird.y + bird.radius > pipe.top + pipeConfig.gap;
    if (inX && (inTop || inBottom)) {
      endGame();
    }
  });
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
  gradient.addColorStop(0, colors.skyTop);
  gradient.addColorStop(1, colors.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = colors.cloud;
  ctx.beginPath();
  ctx.ellipse(90, 90, 50, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(140, 90, 35, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(120, 70, 40, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(300, 140, 50, 20, 0, 0, Math.PI * 2);
  ctx.ellipse(340, 140, 35, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(320, 120, 38, 18, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipes() {
  pipes.forEach((pipe) => {
    const bottomY = pipe.top + pipeConfig.gap;
    ctx.fillStyle = colors.pipe;
    ctx.fillRect(pipe.x, 0, pipeConfig.width, pipe.top);
    ctx.fillRect(pipe.x, bottomY, pipeConfig.width, world.height - bottomY - 40);

    ctx.fillStyle = colors.pipeDark;
    ctx.fillRect(pipe.x, pipe.top - 18, pipeConfig.width, 18);
    ctx.fillRect(pipe.x, bottomY, pipeConfig.width, 18);
  });
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(Math.min(Math.max(bird.velocity / 600, -0.5), 0.4));

  ctx.fillStyle = colors.bird;
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.radius + 2, bird.radius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.wing;
  ctx.beginPath();
  ctx.ellipse(-6, 4, 8, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(6, -3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.beak;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(28, 4);
  ctx.lineTo(16, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, world.height - 40, world.width, 40);
  ctx.fillStyle = colors.groundDark;
  ctx.fillRect(0, world.height - 40, world.width, 10);
}

function drawScore() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "22px Oxanium, sans-serif";
  ctx.fillText(gameState.score, world.width - 48, 36);
}

function render() {
  drawBackground();
  drawPipes();
  drawGround();
  drawBird();
  drawScore();
}

function loop(time) {
  if (!gameState.running) return;
  const delta = Math.min((time - lastTime) / 1000, 0.02);
  lastTime = time;
  update(delta);
  render();
  if (gameState.running) {
    requestAnimationFrame(loop);
  }
}

function handleInput(event) {
  event.preventDefault();
  flap();
}

startBtn.addEventListener("click", startGame);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    handleInput(event);
  }
});
canvas.addEventListener("pointerdown", handleInput);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
resetGame();
updateScores();
render();
