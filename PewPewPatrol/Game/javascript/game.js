// ====== Canvas & Assets ======
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800
canvas.height = 600

const damage = 10;

const spaceshipImg = new Image();
spaceshipImg.src = '../images/Spaceships/v.2/Player/Spaseship-v.2.png';

const laserImg = new Image();
laserImg.src = '../images/Spaceships/Laser-green.png';

const smokeGif = new Image();
smokeGif.src = '../images/Effects/Smoke/smoke-png.gif';

const explosionGif = new Image();
explosionGif.src = '../images/Effects/Explosions/explosion.gif';



// ====== Audio ======
const laserShotSound = new Audio('../audio/SoundEffects/Retro_Laser_Shot_04.wav-MATRIXXX_.wav');
const asteroidExplosionSound = new Audio('../audio/SoundEffects/Space_Explosion.wav-morganpurkis.wav');
const asteroidCrackSound = new Audio('../audio/SoundEffects/rock-destroy-6409.mp3');
const spaceshipExplosionSound = new Audio('../audio/SoundEffects/Vortex_Shot.wav-MyMiniGemini.wav');
const backgroundMusic1 = new Audio('../audio/Music/Alex_Saym_-_Cinematic_Synth_Suspense.mp3');
const backgroundMusic2 = new Audio('../audio/Music/Igor_Pumphonia_-_Igor_Pumphonia_-_Mystery_in_the_Rain_(Dub).mp3');

laserShotSound.volume = 0.05;

asteroidExplosionSound.volume = 0.7;
asteroidExplosionSound.playbackRate = 4;
asteroidCrackSound.volume = 0.05;
asteroidCrackSound.playbackRate = 1;

spaceshipExplosionSound.volume = 0.5;
spaceshipExplosionSound.playbackRate = 5;

backgroundMusic1.volume = 0.1;
backgroundMusic2.volume = 0.1;
backgroundMusic1.loop = true;
backgroundMusic2.loop = true;
backgroundMusic1.play();



// ====== Game Constants ======
const hitboxWidth = 66
const hitboxHeight = 55
const hitboxOffsetX = 18
const hitboxOffsetY = 20;
const hitboxCornerCut = 120;
const asteroidHitboxInset = 6;
const reloadDuration = 700;
const DEBUG_HITBOXES = {
    spaceship: false,
    asteroid: false,
    redSpaceship: false
};



// ====== Game State ======
const spaceship = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    width: 100,
    height: 100,
    health: 100,
    smoking: false,
    invincible: false,
    blinkTimer: null,
    blinkVisible: true
};

const asteroids = [], lasers = [], tinyPieces = [], redSpaceships = [], redLasers = [];

const keys = { left: false, right: false };

let shootingInterval
let isShooting = false;


let smallAsteroidInterval;
let bigAsteroidInterval;

let smallAsteroidTimeout;
let bigAsteroidTimeout;

let smallAsteroidRemainingTime;
let bigAsteroidRemainingTime;

let smallAsteroidStartTime;
let bigAsteroidStartTime;


let redSpaceshipTimer;
let redSpaceshipRemainingTime;
let redSpaceshipStartTime;

let gamePaused = false;
let animationFrameId;

const controls = JSON.parse(localStorage.getItem('controls')) || {
    moveLeft: { control1: 'KeyA', control2: 'ArrowLeft' },
    moveRight: { control1: 'KeyD', control2: 'ArrowRight' },
    shoot: { control1: 'Space', control2: 'MouseClick' }
};

let hasBullet = true;

let score = 0;

let redWave = 1;

// Wave state flags
let redWaveAttack1 = false;

let redWaveAttack2 = false;
let redWave2Timer = null

// ====== UI Elements ======
const reloadOverlay = document.getElementById('reloadOverlay');



// ====== Asset Arrays ======
const smallAsteroidImages = [];
for (let i = 1; i <= 9; i++) {
    const img = new Image();
    img.src = `../images/asteroids/whole/small/small-asteroid_${i}.png`;
    smallAsteroidImages.push(img);
}

const bigAsteroidImages = [];
for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `../images/asteroids/whole/big/big-asteroid_${i}.png`;
    bigAsteroidImages.push(img);
}

const tinyAsteroidImages = [];
for (let i = 1; i <= 9; i++) {
    const img = new Image();
    img.src = `../images/asteroids/whole/small/small-asteroid_${i}.png`;
    tinyAsteroidImages.push(img);
}
for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `../images/asteroids/whole/big/big-asteroid_${i}.png`;
    tinyAsteroidImages.push(img);
}

const crackImages = [];
for (let i = 1; i <= 3; i++) {
    const img = new Image();
    img.src = `../images/asteroids/cracked/crack-${i}.png`;
    crackImages.push(img);
}



// ====== Utility Functions ======
function isColliding(a, b) {
    return a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top;
}

function pointInPoly(point, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.00001) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function segmentsIntersect(a, b, c, d) {
    const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const onSegment = (p, q, r) =>
        Math.min(p.x, r.x) <= q.x && q.x <= Math.max(p.x, r.x) &&
        Math.min(p.y, r.y) <= q.y && q.y <= Math.max(p.y, r.y);

    const d1 = cross(a, b, c);
    const d2 = cross(a, b, d);
    const d3 = cross(c, d, a);
    const d4 = cross(c, d, b);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }

    if (d1 === 0 && onSegment(a, c, b)) return true;
    if (d2 === 0 && onSegment(a, d, b)) return true;
    if (d3 === 0 && onSegment(c, a, d)) return true;
    if (d4 === 0 && onSegment(c, b, d)) return true;
    return false;
}

function rectIntersectsPoly(rect, poly) {
    const rectPoints = [
        { x: rect.left, y: rect.top },
        { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom },
        { x: rect.left, y: rect.bottom }
    ];

    for (const p of rectPoints) {
        if (pointInPoly(p, poly)) return true;
    }

    for (const p of poly) {
        if (p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom) {
            return true;
        }
    }

    for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        for (let j = 0; j < rectPoints.length; j++) {
            const c = rectPoints[j];
            const d = rectPoints[(j + 1) % rectPoints.length];
            if (segmentsIntersect(a, b, c, d)) return true;
        }
    }
    return false;
}

function getAsteroidHitbox(asteroid) {
    const inset = Math.min(asteroidHitboxInset, asteroid.width / 2 - 1, asteroid.height / 2 - 1);
    return {
        top: asteroid.y + inset,
        bottom: asteroid.y + asteroid.height - inset,
        left: asteroid.x + inset,
        right: asteroid.x + asteroid.width - inset
    };
}

function getDifficulty() {
    return localStorage.getItem('difficulty') || 'medium';
}

function adjustDamage(damage) {
    const d = getDifficulty();
    if (d === 'easy') return Math.max(1, damage - 5);
    if (d === 'hard') return damage + 5;
    if (d === 'very hard') return damage + 10;
    if (d === 'insane') return damage + 15;
    if (d === 'impossible') return damage + 20;
    return damage;
}

function applyVolumeSettings() {
    const master = (localStorage.getItem('masterVolume') || 50) / 100;
    const music = (localStorage.getItem('musicVolume') || 50) / 100;
    const effects = (localStorage.getItem('effectsVolume') || 50) / 100;

    backgroundMusic1.volume = music * master;
    backgroundMusic2.volume = music * master;

    laserShotSound.volume = effects * master;
    asteroidExplosionSound.volume = effects * master;
    asteroidCrackSound.volume = effects * master;
    spaceshipExplosionSound.volume = effects * master;
}



// ====== Asteroid & Piece Creation ======
function createSmallAsteroid() {
    asteroids.push({
        x: Math.random() * (canvas.width - 20),
        y: -50,
        width: 30 + Math.random() * 20,
        height: 30 + Math.random() * 20,
        speed: 2 + Math.random() * 3,
        img: smallAsteroidImages[Math.floor(Math.random() * smallAsteroidImages.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.75) * 0.75,
        HP: 1
    });
}
function createBigAsteroid() {
    asteroids.push({
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 60 + Math.random() * 50,
        height: 60 + Math.random() * 45,
        speed: 1 + Math.random() * 1.5,
        img: bigAsteroidImages[Math.floor(Math.random() * bigAsteroidImages.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.75) * 0.75,
        HP: 2,
        crackImg: null
    });
}

function spawnSmallAsteroids(bigAsteroid) {
    const num = Math.floor(Math.random() * 3) + 2; // between 2 and 4

    for (let i = 0; i < num; i++) {
        asteroids.push({
            x: bigAsteroid.x + Math.random() * bigAsteroid.width - 20,
            y: bigAsteroid.y + Math.random() * bigAsteroid.height - 20,
            width: 30 + Math.random() * 20,
            height: 30 + Math.random() * 20,
            speed: 1 + Math.random() * 1.5,
            img: smallAsteroidImages[Math.floor(Math.random() * smallAsteroidImages.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.75) * 0.75,
            HP: 1
        });
    }

    const explosionSound = asteroidExplosionSound.cloneNode();
    explosionSound.volume = asteroidExplosionSound.volume;
    explosionSound.play();
}

function spawnDestroyedBigAsteroids(bigAsteroid) {
    const baseDBAs = 1;
    const sizeFactor = Math.floor((bigAsteroid.width + bigAsteroid.height) / 100);
    const num = Math.min(baseDBAs + sizeFactor, 3);

    for (let i = 0; i < num; i++) {
        asteroids.push({
            x: bigAsteroid.x + Math.random() * bigAsteroid.width - 20,
            y: bigAsteroid.y + Math.random() * bigAsteroid.height - 20,
            width: 20 + Math.random() * 15,
            height: 20 + Math.random() * 15,
            speed: 2 + Math.random() * 2,
            img: smallAsteroidImages[Math.floor(Math.random() * smallAsteroidImages.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.75) * 0.75,
            HP: 1
        });
    }

    const explosionSound = asteroidExplosionSound.cloneNode();
    explosionSound.volume = asteroidExplosionSound.volume;
    explosionSound.play();
}

function createTinyPieces(asteroid, maxPieces) {
    const basePieces = 3;
    const sizeFactor = Math.floor((asteroid.width + asteroid.height) / 50);
    const num = Math.min(basePieces + sizeFactor, maxPieces);

    for (let i = 0; i < num; i++) {
        tinyPieces.push({
            x: asteroid.x + asteroid.width / 2,
            y: asteroid.y + asteroid.height / 2,
            width: 5 + Math.random() * 10,
            height: 5 + Math.random() * 10,
            speedX: (Math.random() - 0.5) * 2,
            speedY: Math.random() * 3 + 1,
            img: tinyAsteroidImages[Math.floor(Math.random() * tinyAsteroidImages.length)]
        });
    }

    const explosionSound = asteroidExplosionSound.cloneNode();
    explosionSound.volume = asteroidExplosionSound.volume;
    explosionSound.play();
}



// ====== Shooting ======
function shootLaser() {
    if (!hasBullet || gamePaused) return;

    hasBullet = false;

    // Add laser to the game
    lasers.push({
        x: spaceship.x + spaceship.width / 2 - 5,
        y: spaceship.y,
        width: 10,
        height: 20,
        speed: 5
    });

    laserShotSound.cloneNode().play();

    setTimeout(() => {
        hasBullet = true;
    }, reloadDuration);
}

function shootRedLaser(redSpaceship) {
    if (gamePaused) return;
    const redLaser = {
        x: redSpaceship.x + redSpaceship.width / 2 - 5,
        y: redSpaceship.y + redSpaceship.height,
        width: 10,
        height: 20,
        speed: 5,
        img: new Image()
    };

    redLaser.img.src = '../images/Spaceships/Laser-red.png';
    redLasers.push(redLaser);

    laserShotSound.cloneNode().play();
}



// ====== Smoke Effect ======
function showSmokeEffect(spaceship, isRed = false) {
    if (!spaceship.smokeElementLeft || !spaceship.smokeElementRight) {
        const smokeElementLeft = document.createElement('img');
        smokeElementLeft.src = smokeGif.src;
        smokeElementLeft.style.position = 'absolute';
        smokeElementLeft.style.pointerEvents = 'none';

        const smokeElementRight = document.createElement('img');
        smokeElementRight.src = smokeGif.src;
        smokeElementRight.style.position = 'absolute';
        smokeElementRight.style.pointerEvents = 'none';

        document.body.appendChild(smokeElementLeft);
        document.body.appendChild(smokeElementRight);

        spaceship.smokeElementLeft = smokeElementLeft;
        spaceship.smokeElementRight = smokeElementRight;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const offsetX = isRed ? 8 : 0, offsetY = isRed ? 0 : 10, smokeSize = isRed ? 20 : 30;

    spaceship.smokeElementLeft.style.width = `${smokeSize}px`;
    spaceship.smokeElementLeft.style.height = `${smokeSize}px`;
    spaceship.smokeElementLeft.style.left = `${spaceship.x + canvasRect.left + offsetX}px`;
    spaceship.smokeElementLeft.style.top = `${spaceship.y + canvasRect.top + spaceship.height / 2 + offsetY}px`;

    spaceship.smokeElementRight.style.width = `${smokeSize}px`;
    spaceship.smokeElementRight.style.height = `${smokeSize}px`;
    spaceship.smokeElementRight.style.left = `${spaceship.x + canvasRect.left + spaceship.width - offsetX - smokeSize}px`;
    spaceship.smokeElementRight.style.top = `${spaceship.y + canvasRect.top + spaceship.height / 2 + offsetY}px`;

    if (!isRed) {
        spaceship.smokeElementLeft.style.transform = 'rotate(180deg)';
        spaceship.smokeElementRight.style.transform = 'rotate(180deg)';
    }
}

function removeSmokeEffect(spaceship) {
    if (spaceship.smokeElementLeft) {
        spaceship.smokeElementLeft.remove();
        spaceship.smokeElementLeft = null;
    }

    if (spaceship.smokeElementRight) {
        spaceship.smokeElementRight.remove();
        spaceship.smokeElementRight = null;
    }
}



// ====== Explosion ======
function destroyAsteroidsInRange(explosionX, explosionY, explosionWidth, explosionHeight) {
    const explosionRect = {
        left: explosionX - explosionWidth / 2,
        right: explosionX + explosionWidth / 2,
        top: explosionY - explosionHeight / 2,
        bottom: explosionY + explosionHeight / 2
    };

    for (let i = 0; i < asteroids.length; i++) {
        const asteroid = asteroids[i];
        const asteroidRect = {
            left: asteroid.x,
            right: asteroid.x + asteroid.width,
            top: asteroid.y,
            bottom: asteroid.y + asteroid.height
        };

        if (
            explosionRect.left < asteroidRect.right &&
            explosionRect.right > asteroidRect.left &&
            explosionRect.top < asteroidRect.bottom &&
            explosionRect.bottom > asteroidRect.top
        ) {
            createTinyPieces(asteroid, 8);
            asteroids.splice(i, 1);
            i--;
        }
    }
}

function createExplosion(x, y, width, height) {
    const canvasRect = canvas.getBoundingClientRect();
    const explosionElement = document.createElement('img');
    explosionElement.src = explosionGif.src;
    explosionElement.style.position = 'absolute';
    explosionElement.style.pointerEvents = 'none';

    const explosionSize = width * 1.5;
    const offsetX = explosionSize / 5.5;
    const offsetY = explosionSize / 4.5;

    explosionElement.style.width = `${explosionSize}px`;
    explosionElement.style.height = `${explosionSize}px`;
    explosionElement.style.left = `${canvasRect.left + x - offsetX}px`;
    explosionElement.style.top = `${canvasRect.top + y - offsetY}px`;

    document.body.appendChild(explosionElement);

    const explosionSound = spaceshipExplosionSound.cloneNode();
    explosionSound.volume = spaceshipExplosionSound.volume;
    explosionSound.play();

    setTimeout(() => explosionElement.remove(), 1050);
}



// ====== Main Game Loop ======
function updateGame() {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move the spaceship
    moveSpaceship();

    // Draw the spaceship
    if (spaceship.health > 0) {
        if (spaceship.blinkVisible) {
            ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
        }
    } else {
        removeSmokeEffect(spaceship);
        createExplosion(
            spaceship.x + spaceship.width / 2,
            spaceship.y + spaceship.height / 2,
            spaceship.width,
            spaceship.height
        );
        endGame();
        return;
    }

    // Get spaceship hitbox (top corners chamfered)
    function getSpaceshipHitboxPolygon() {
        const left = spaceship.x + hitboxOffsetX;
        const right = left + hitboxWidth;
        const top = spaceship.y + hitboxOffsetY;
        const bottom = top + hitboxHeight;
        const cut = Math.min(hitboxCornerCut, hitboxWidth / 2 - 1, hitboxHeight / 2 - 1);

        return [
            { x: left + cut, y: top },
            { x: right - cut, y: top },
            { x: right, y: top + cut },
            { x: right, y: bottom },
            { x: left, y: bottom },
            { x: left, y: top + cut }
        ];
    }

    // Draw spaceship hitbox
    if (DEBUG_HITBOXES.spaceship) {
        const shipHitboxPoly = getSpaceshipHitboxPolygon();
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shipHitboxPoly[0].x, shipHitboxPoly[0].y);
        for (let i = 1; i < shipHitboxPoly.length; i++) {
            ctx.lineTo(shipHitboxPoly[i].x, shipHitboxPoly[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    // Handle smoke effect based on spaceship health
    if (spaceship.smoking) {
        showSmokeEffect(spaceship);
    } else {
        removeSmokeEffect(spaceship);
    }

    // Update and draw lasers
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y -= laser.speed;
        ctx.drawImage(laserImg, laser.x, laser.y, laser.width, laser.height);

        // Remove lasers that go off-screen
        if (laser.y + laser.height < 0) {
            lasers.splice(i, 1);
            i--;
            continue;
        }

        // Check for collisions with asteroids
        for (let j = 0; j < asteroids.length; j++) {
            const asteroid = asteroids[j];
            const laserRect = {
                top: laser.y,
                bottom: laser.y + laser.height,
                left: laser.x,
                right: laser.x + laser.width
            };

            const asteroidRect = getAsteroidHitbox(asteroid);

            if (isColliding(laserRect, asteroidRect)) {
                dealtDamage = 1;
                if (asteroid.HP > dealtDamage) {
                    asteroid.HP -= dealtDamage;
                    asteroid.crackImg = crackImages[Math.floor(Math.random() * crackImages.length)];
                    const crack = asteroidCrackSound.cloneNode();
                    crack.volume = asteroidCrackSound.volume;
                    crack.play();
                } else {
                    if (asteroid.width >= 50) {
                        spawnDestroyedBigAsteroids(asteroid);
                        createTinyPieces(asteroid, 5);
                        score += 10;
                        updateScoreDisplay();
                    } else {
                        createTinyPieces(asteroid, 6);
                    }
                    if (asteroid.width < 50) {
                        score += 5;
                        updateScoreDisplay();
                    }
                    asteroids.splice(j, 1);
                }
                lasers.splice(i, 1);
                i--;
                break;
            }
        }

        // Check for collisions with red spaceships
        for (let j = 0; j < redSpaceships.length; j++) {
            const redSpaceship = redSpaceships[j];
            const laserRect = {
                top: laser.y,
                bottom: laser.y + laser.height,
                left: laser.x,
                right: laser.x + laser.width
            };

            const redSpaceshipRect = getRedSpaceshipHitbox(redSpaceship);

            if (isColliding(laserRect, redSpaceshipRect)) {
                if (!redSpaceship.invincible) {
                    dealtDamage = 1;
                    redSpaceship.health -= dealtDamage;
                    triggerRedSpaceshipInvincibility(redSpaceship);
                    if (redSpaceship.health <= 1) {
                        redSpaceship.smoking = true;
                        showSmokeEffect(redSpaceship, true);
                    }
                    if (redSpaceship.health <= 0) {
                        createExplosion(
                            redSpaceship.x + redSpaceship.width / 2,
                            redSpaceship.y + redSpaceship.height / 2,
                            redSpaceship.width,
                            redSpaceship.height
                        );
                        redSpaceship.smoking = false;
                        removeSmokeEffect(redSpaceship);
                        clearInterval(redSpaceship.shootInterval);
                        redSpaceship.shootInterval = null;
                        // Stop blinking if dying
                        if (redSpaceship.blinkTimer) {
                            clearInterval(redSpaceship.blinkTimer);
                            redSpaceship.blinkTimer = null;
                        }
                        redSpaceships.splice(j, 1);
                        score += 50;
                        updateScoreDisplay();
                        if (redSpaceships.length === 0) {
                            resumeAsteroidIntervals();
                        }
                    }
                }
                lasers.splice(i, 1);
                i--;
                break;
            }
        }
    }

    // Update and draw asteroids
    for (let i = 0; i < asteroids.length; i++) {
        const asteroid = asteroids[i];
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;

        // Draw the asteroid
        ctx.save();
        ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
        ctx.rotate((asteroid.rotation * Math.PI) / 180);
        ctx.drawImage(
            asteroid.img,
            -asteroid.width / 2,
            -asteroid.height / 2,
            asteroid.width,
            asteroid.height
        );

        // Draw the crack overlay
        if (asteroid.crackImg) {
            ctx.drawImage(
                asteroid.crackImg,
                -asteroid.width / 2,
                -asteroid.height / 2,
                asteroid.width,
                asteroid.height
            );
        }
        ctx.restore();

        // Check for collisions with the spaceship
        const asteroidRect = getAsteroidHitbox(asteroid);

        // Draw asteroid hitbox
        if (DEBUG_HITBOXES.asteroid) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 180, 0, 0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                asteroidRect.left,
                asteroidRect.top,
                asteroidRect.right - asteroidRect.left,
                asteroidRect.bottom - asteroidRect.top
            );
            ctx.restore();
        }

        const shipHitboxPoly = getSpaceshipHitboxPolygon();

        if (rectIntersectsPoly(asteroidRect, shipHitboxPoly)) {
            if (!spaceship.invincible) {
                let asteroidDamage;
                if (asteroid.width >= 50) {
                    asteroidDamage = asteroid.crackImg ? 15 : 20;
                } else {
                    asteroidDamage = asteroid.crackImg ? 5 : 10;
                }
                spaceship.health -= adjustDamage(asteroidDamage);
                triggerSpaceshipInvincibility();
            }
            createTinyPieces(asteroid, 8);
            asteroids.splice(i, 1);
            i--;
        }

        // Remove asteroids that go off-screen
        if (asteroid.y > canvas.height) {
            asteroids.splice(i, 1);
            i--;
        }
    }

    // Update and draw tiny debris pieces
    for (let i = 0; i < tinyPieces.length; i++) {
        const piece = tinyPieces[i];
        piece.x += piece.speedX;
        piece.y += piece.speedY;
        ctx.drawImage(piece.img, piece.x, piece.y, piece.width, piece.height);

        // Remove debris that goes off-screen
        if (
            piece.x < 0 ||
            piece.x > canvas.width ||
            piece.y < 0 ||
            piece.y > canvas.height
        ) {
            tinyPieces.splice(i, 1);
            i--;
        }
    }

    // Update and draw red spaceships
    moveRedSpaceships();
    redSpaceships.forEach((redSpaceship) => {
        if (redSpaceship.blinkVisible) {
            ctx.save();
            ctx.translate(redSpaceship.x + redSpaceship.width / 2, redSpaceship.y + redSpaceship.height / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(
                redSpaceship.img,
                -redSpaceship.width / 2,
                -redSpaceship.height / 2,
                redSpaceship.width,
                redSpaceship.height
            );
            ctx.restore();

            // Draw red spaceship hitbox
            if (DEBUG_HITBOXES.redSpaceship) {
                const redSpaceshipRect = getRedSpaceshipHitbox(redSpaceship);
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    redSpaceshipRect.left,
                    redSpaceshipRect.top,
                    redSpaceshipRect.right - redSpaceshipRect.left,
                    redSpaceshipRect.bottom - redSpaceshipRect.top
                );
                ctx.restore();
            }

            if (redSpaceship.smoking) {
                showSmokeEffect(redSpaceship, true);
            }
        } else {
            removeSmokeEffect(redSpaceship);
        }
    });

    // Update and draw red lasers
    for (let i = 0; i < redLasers.length; i++) {
        const redLaser = redLasers[i];
        redLaser.y += redLaser.speed;
        ctx.drawImage(
            redLaser.img,
            redLaser.x,
            redLaser.y,
            redLaser.width,
            redLaser.height
        );

        // Remove red lasers that go off-screen
        if (redLaser.y > canvas.height) {
            redLasers.splice(i, 1);
            i--;
            continue;
        }

        // Check for collisions with the spaceship
        const redLaserRect = {
            top: redLaser.y,
            bottom: redLaser.y + redLaser.height,
            left: redLaser.x,
            right: redLaser.x + redLaser.width
        };

        const shipHitboxPoly = getSpaceshipHitboxPolygon();

        if (rectIntersectsPoly(redLaserRect, shipHitboxPoly)) {
            if (!spaceship.invincible) {
                spaceship.health -= adjustDamage(damage);
                triggerSpaceshipInvincibility();
            }
            redLasers.splice(i, 1);
            i--;
        }
    }

    // Handle smoke effect based on spaceship health
    if (spaceship.health < 35) {
        spaceship.smoking = true;
        showSmokeEffect(spaceship);
    } else {
        spaceship.smoking = false;
        removeSmokeEffect(spaceship);
    }

    // Check for game over
    if (spaceship.health <= 0) {
        removeSmokeEffect(spaceship);
        createExplosion(
            spaceship.x,
            spaceship.y,
            spaceship.width,
            spaceship.height
        );
        endGame();
        return;
    }

    // Update UI elements
    drawUI();

    // Control asteroid spawning
    if ((redWaveAttack1 && redSpaceships.length > 0 && !gamePaused) || gamePaused) {
        clearAsteroidIntervals();
    } else {
        if (!smallAsteroidInterval && !bigAsteroidInterval) {
            resumeAsteroidIntervals();
        }
    }

    // Handle infinite red wave transitions and timers
    if (
        redWaveAttack1 &&
        redSpaceships.length === 0 &&
        !gamePaused
    ) {
        redWaveAttack1 = false;
        // Start timer for next wave only once
        if (!redWave2Timer) {
            redWave2Timer = setTimeout(() => {
                redWave++;
                spawnRedSpaceships();
                redWave2Timer = null;
            }, 20000);
        }
    }

    drawControlsUI();

    // Request the next animation frame
    animationFrameId = requestAnimationFrame(updateGame);
}



// Invincibility
function getInvincibilityDuration() {
    const d = getDifficulty();
    if (d === 'easy') return 3000;
    if (d === 'hard') return 1000;
    if (d === 'very hard') return 700;
    if (d === 'insane') return 500;
    if (d === 'impossible') return 300;
    return 2000;
}

// ====== UI Drawing ======
function drawUI() {
    document.getElementById('healthText').textContent = 'Health: ' + Math.max(0, spaceship.health);
    document.getElementById('healthText').style.opacity = '1';
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('scoreText').textContent = `Score: ${score}`;
}



// ====== Game State Management ======
function endGame() {
    gamePaused = true;

    applyScoreToLeaderboard();

    document.getElementById('finalScoreText').textContent = `Final Score: ${score}`;

    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('healthText').style.opacity = '0';

    removeSmokeEffect(spaceship);
    redSpaceships.forEach(removeSmokeEffect);

    cancelAnimationFrame(animationFrameId);

    redSpaceships.forEach((redSpaceship) => clearInterval(redSpaceship.shootInterval));
    if (redSpaceshipTimer) clearTimeout(redSpaceshipTimer);

    clearAsteroidIntervals();

    asteroids.length = 0;
    lasers.length = 0;
    redLasers.length = 0;
    tinyPieces.length = 0;
    redSpaceships.length = 0;

    document.getElementById('finalScoreText').textContent = `Final Score: ${score}`;
}

function continueAsteroidMovement() {
    function updateAsteroids() {
        if (!gamePaused) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i];
            asteroid.y += asteroid.speed;
            asteroid.rotation += asteroid.rotationSpeed;
            ctx.save();
            ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
            ctx.rotate((asteroid.rotation * Math.PI) / 180);
            ctx.drawImage(asteroid.img, -asteroid.width / 2, -asteroid.height / 2, asteroid.width, asteroid.height);
            ctx.restore();
            if (asteroid.y > canvas.height) { asteroids.splice(i, 1); i--; }
        }
        requestAnimationFrame(updateAsteroids);
    }
    updateAsteroids();
}

function moveSpaceship() {
    const speed = 3.5;

    if (keys.left && spaceship.x > 0) {
        spaceship.x -= speed;
    }

    if (keys.right && spaceship.x + spaceship.width < canvas.width) {
        spaceship.x += speed;
    }
}

function clearAsteroidIntervals() {
    clearInterval(smallAsteroidInterval);
    clearInterval(bigAsteroidInterval);
    clearTimeout(smallAsteroidTimeout);
    clearTimeout(bigAsteroidTimeout);
}

function pauseAsteroidIntervals() {
    clearAsteroidIntervals();
    const now = Date.now();
    smallAsteroidRemainingTime = smallAsteroidInterval
        ? (700 + Math.random() * 500) - (now - smallAsteroidStartTime)
        : 0;
    bigAsteroidRemainingTime = bigAsteroidInterval
        ? (1000 + Math.random() * 500) - (now - bigAsteroidStartTime)
        : 0;
}

function resumeAsteroidIntervals() {
    const d = getDifficulty();
    let smallAsteroidBase = 700, bigAsteroidBase = 1000;
    if (d === 'easy') { smallAsteroidBase = 900; bigAsteroidBase = 1300; }
    if (d === 'hard') { smallAsteroidBase = 500; bigAsteroidBase = 800; }
    if (d === 'very hard') { smallAsteroidBase = 400; bigAsteroidBase = 700; }
    if (d === 'insane') { smallAsteroidBase = 300; bigAsteroidBase = 600; }
    if (d === 'impossible') { smallAsteroidBase = 200; bigAsteroidBase = 400; }

    if (smallAsteroidRemainingTime > 0) {
        smallAsteroidTimeout = setTimeout(() => {
            createSmallAsteroid();
            smallAsteroidInterval = setInterval(createSmallAsteroid, smallAsteroidBase + Math.random() * 500);
        }, smallAsteroidRemainingTime);
    } else {
        smallAsteroidInterval = setInterval(createSmallAsteroid, smallAsteroidBase + Math.random() * 500);
    }

    if (bigAsteroidRemainingTime > 0) {
        bigAsteroidTimeout = setTimeout(() => {
            createBigAsteroid();
            bigAsteroidInterval = setInterval(createBigAsteroid, bigAsteroidBase + Math.random() * 500);
        }, bigAsteroidRemainingTime);
    } else {
        bigAsteroidInterval = setInterval(createBigAsteroid, bigAsteroidBase + Math.random() * 500);
    }
}

function pauseGame() {
    if (!gamePaused) {
        gamePaused = true;
        cancelAnimationFrame(animationFrameId);
        pauseAsteroidIntervals();
        redSpaceships.forEach((redSpaceship) => {
            if (redSpaceship.shootInterval) {
                clearInterval(redSpaceship.shootInterval);
                redSpaceship.shootInterval = null;
            }
        });
        if (redWave2Timer) {
            clearTimeout(redWave2Timer);
            redSpaceshipRemainingTime = redWave2Timer - Date.now();
            redWave2Timer = null;
        }
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
}

// ====== Resume Game ======
function resumeGame() {
    if (gamePaused) {
        gamePaused = false;
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('healthText').style.opacity = '1';

        resumeAsteroidIntervals();
        // resume the red wave timer
        if (redWave2Timer) {
            redWave2Timer = setTimeout(() => {
                redWave++;
                spawnRedSpaceships();
                redWave2Timer = null;
            }, redSpaceshipRemainingTime);
        }

        redSpaceships.forEach((redSpaceship, index) => {
            if (!redSpaceship.shootInterval) {
                redSpaceship.shootInterval = setInterval(() => shootRedLaser(redSpaceship), 1300 + index * 500);
            }
        });

        updateGame();
    }
}

function restartGame() {
    // Reset spaceship health and position
    spaceship.health = 100;
    spaceship.x = canvas.width / 2 - spaceship.width / 2;
    spaceship.y = canvas.height - spaceship.height - 10;

    // Clear game objects
    asteroids.length = 0;
    tinyPieces.length = 0;
    lasers.length = 0;
    redLasers.length = 0;
    redSpaceships.length = 0;

    // Clear intervals and timers
    clearAsteroidIntervals();
    clearTimeout(redSpaceshipTimer);
    window.redSpaceshipRespawnScheduled = false;
    window.redSpaceshipWaveTimeout = null;

    // Reset red spaceship wave
    redWave = 1;
    redWaveAttack1 = false;
    if (redWave2Timer) {
        clearTimeout(redWave2Timer);
        redWave2Timer = null;
    }
    // Reset UI
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('healthText').style.opacity = '1';

    // Reset the score
    score = 0;
    updateScoreDisplay();

    // Restart asteroid intervals
    resumeAsteroidIntervals();

    // Restart the game loop
    gamePaused = false;
    updateGame();

    if (redWave2Timer) {
        clearTimeout(redWave2Timer);
        redWave2Timer = null;
    }
    setTimeout(() => {
        if (!gamePaused && redWave === 1 && redSpaceships.length === 0) {
            spawnRedSpaceships();
        }
    }, 30000);
}

function returnToMainMenu() {
    applyScoreToLeaderboard();
    window.location.href = '../../index.html';
}



// ====== Red Spaceships ======
function spawnRedSpaceships() {
    const flyInDuration = 40;

    function makeRedSpaceship(x, y) {
        const obj = {
            x: x,
            y: -40,
            targetY: y,
            width: 50,
            height: 50,
            speed: 2 + Math.floor(redWave / 3), // Increase speed every 3 waves
            img: new Image(),
            shootInterval: null,
            health: 1 + Math.floor(redWave / 2), // Increase health every 2 waves
            smoking: false,
            flyIn: true,
            flyInFrame: 0,
            flyInDuration,
            invincible: false,
            blinkTimer: null,
            blinkVisible: true
        };
        obj.img.src = '../images/Spaceships/v.2/Enemy/redSpaceship-v2.png';
        return obj;
    }

    clearAsteroidIntervals();
    redSpaceshipStartTime = Date.now();
    redSpaceships.length = 0;

    redWaveAttack1 = true;

    // Increase number of ships as waves progress
    const d = getDifficulty();
    let baseShips = 3, maxShips = 7, shootBase = 1200, shootStep = 400;
    if (d === 'easy') { baseShips = 2; maxShips = 5; shootBase = 1500; }
    if (d === 'hard') { baseShips = 4; maxShips = 8; shootBase = 1000; }
    if (d === 'very hard') { baseShips = 5; maxShips = 10; shootBase = 800; }
    if (d === 'insane') { baseShips = 6; maxShips = 12; shootBase = 600; }
    if (d === 'impossible') { baseShips = 8; maxShips = 16; shootBase = 400; }

    const numShips = Math.min(baseShips + Math.floor(redWave / 2), maxShips);
    const spacing = 60;
    const startX = canvas.width / 2 - ((numShips - 1) * spacing) / 2;
    for (let i = 0; i < numShips; i++) {
        const x = startX + i * spacing;
        const y = 50 + (i % 2) * 40;
        const ship = makeRedSpaceship(x, y);
        redSpaceships.push(ship);
        ship.shootInterval = setInterval(() => shootRedLaser(ship), shootBase + i * shootStep);
    }
}

function moveRedSpaceships() {
    redSpaceships.forEach((redSpaceship) => {
        if (redSpaceship.flyIn) {
            // Handle fly-in animation
            redSpaceship.flyInFrame++;
            const progress = redSpaceship.flyInFrame / redSpaceship.flyInDuration;
            redSpaceship.y = -40 + (redSpaceship.targetY + 40) * progress;

            if (redSpaceship.flyInFrame >= redSpaceship.flyInDuration) {
                redSpaceship.flyIn = false;
                redSpaceship.y = redSpaceship.targetY;
            }
        } else {
            redSpaceship.x += redSpaceship.speed;
            if (redSpaceship.x <= 0 || redSpaceship.x + redSpaceship.width >= canvas.width) {
                redSpaceship.speed *= -1;
            }
        }
    });
}

function getRedSpaceshipHitbox(redSpaceship) {
    return {
        top: redSpaceship.y,
        bottom: redSpaceship.y + redSpaceship.height,
        left: redSpaceship.x,
        right: redSpaceship.x + redSpaceship.width
    };
}



// ====== Controls ======
document.addEventListener('keydown', (event) => {
    if (controls.moveLeft.control1 === event.code || controls.moveLeft.control2 === event.code) {
        keys.left = true;
    }
    if (controls.moveRight.control1 === event.code || controls.moveRight.control2 === event.code) {
        keys.right = true;
    }
    if (controls.shoot.control1 === event.code || controls.shoot.control2 === event.code) {
        shootLaser();
    }
});

document.addEventListener('keyup', (event) => {
    if (controls.moveLeft.control1 === event.code || controls.moveLeft.control2 === event.code) {
        keys.left = false;
    }
    if (controls.moveRight.control1 === event.code || controls.moveRight.control2 === event.code) {
        keys.right = false;
    }
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyP' || event.code === 'Escape') pauseGame();
});

document.getElementById('resumeButton').addEventListener('click', resumeGame);
document.getElementById('restartButtonPause').addEventListener('click', restartGame);
document.getElementById('mainMenuButtonPause').addEventListener('click', returnToMainMenu);
document.getElementById('restartButtonGameOver').addEventListener('click', restartGame);
document.getElementById('mainMenuButtonGameOver').addEventListener('click', returnToMainMenu);

document.addEventListener('mousedown', (event) => {
    const canvasRect = canvas.getBoundingClientRect();
    const isInsideCanvas =
        event.clientX >= canvasRect.left &&
        event.clientX <= canvasRect.right &&
        event.clientY >= canvasRect.top &&
        event.clientY <= canvasRect.bottom;

    if (
        (controls.shoot.control1 === 'MouseClick' || controls.shoot.control2 === 'MouseClick') &&
        isInsideCanvas &&
        hasBullet
    ) {
        shootLaser();
    }
});

document.addEventListener('mouseup', () => {
    if (
        controls.shoot.control1 === 'MouseClick' ||
        controls.shoot.control2 === 'MouseClick'
    ) {
        clearInterval(shootingInterval);
        shootingInterval = null;
        isShooting = false;
    }
});

function formatKey(key) {
    if (key === 'Space') return 'Space';
    if (key === 'MouseClick') return 'Mouse';
    return key.replace('Key', '');
}

function drawControlsUI() {
    const hideControlsUI = JSON.parse(localStorage.getItem('hideControlsUI') || 'false');
    if (!hideControlsUI) {
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';

        const leftX = 10;
        const rightX = canvas.width - 100;
        const startY = 80;
        const lineHeight = 20;

        const controlsText = [
            `Move Left: ${controls.moveLeft.control1 === 'ArrowLeft' ? '←' : formatKey(controls.moveLeft.control1)}`,
            `Move Right: ${controls.moveRight.control1 === 'ArrowRight' ? '→' : formatKey(controls.moveRight.control1)}`,
            `Shoot: ${formatKey(controls.shoot.control1)}`
        ];

        controlsText.forEach((text, i) => {
            ctx.fillText(text, leftX, startY + i * lineHeight);
        });

        ctx.restore();
    }
}



// ====== Init ======
window.onload = () => {
    applyVolumeSettings();
};

spaceshipImg.onload = () => {
    spaceship.x = canvas.width / 2 - spaceship.width / 2;
    spaceship.y = canvas.height - spaceship.height - 10;
    updateGame();
    setTimeout(() => {
        if (!gamePaused && redWave === 1 && redSpaceships.length === 0) {
            spawnRedSpaceships();
        }
    }, 30000);
};

function triggerSpaceshipInvincibility() {
    if (spaceship.invincible) return;
    spaceship.invincible = true;
    spaceship.blinkVisible = false;
    let blinkCount = 0;
    if (spaceship.blinkTimer) clearInterval(spaceship.blinkTimer);
    spaceship.blinkTimer = setInterval(() => {

        if (spaceship.health <= 0 || gamePaused) {
            clearInterval(spaceship.blinkTimer);
            spaceship.blinkTimer = null;
            spaceship.invincible = false;
            spaceship.blinkVisible = true;
            return;
        }

        spaceship.blinkVisible = !spaceship.blinkVisible;
        blinkCount++;
        if (blinkCount >= 20) {
            clearInterval(spaceship.blinkTimer);
            spaceship.blinkTimer = null;
            spaceship.invincible = false;
            spaceship.blinkVisible = true;
        }
    }, 100);
}

function triggerRedSpaceshipInvincibility(redSpaceship) {
    if (redSpaceship.invincible) return;
    redSpaceship.invincible = true;
    redSpaceship.blinkVisible = false;
    let blinkCount = 0;
    if (redSpaceship.blinkTimer) clearInterval(redSpaceship.blinkTimer);
    redSpaceship.blinkTimer = setInterval(() => {

        if (!redSpaceships.includes(redSpaceship)) {
            clearInterval(redSpaceship.blinkTimer);
            redSpaceship.blinkTimer = null;
            return;
        }
        redSpaceship.blinkVisible = !redSpaceship.blinkVisible;
        blinkCount++;
        if (blinkCount >= 10) {
            clearInterval(redSpaceship.blinkTimer);
            redSpaceship.blinkTimer = null;
            redSpaceship.invincible = false;
            redSpaceship.blinkVisible = true;
        }
    }, 100);
}

// Utility function to save score to leaderboard
function applyScoreToLeaderboard() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const difficulty = localStorage.getItem('difficulty') || 'medium';
    let entry = leaderboard.find(e => e.email === userData.email && e.difficulty === difficulty);
    if (entry) {
        entry.nickname = userData.nickname;
        entry.score = Math.max(entry.score || 0, score);
    } else {
        leaderboard.push({
            nickname: userData.nickname,
            email: userData.email,
            score: score,
            difficulty: difficulty
        });
    }
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Save score if player closes or reloads the page (before dying)
window.addEventListener('beforeunload', function () {
    applyScoreToLeaderboard();
});
