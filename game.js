
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const roadPositions = [130, 300, 470];


const player = {
    x: 400,
    y: 510,
    width: 42,
    height: 42,
    speed: 5,

    // Direction the cat is facing
    facing: "right",

    // Attack timing
    attackUntil: 0,
    nextAttackTime: 0,
    invulnerableUntil: 0
};


let enemies = [];
let items = [];

let score = 0;
let coins = 0;
let hearts = 5;

let gameOver = false;
let lastWaveTime = 0;
let lastItemTime = 0;

const keys = {};

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
    }

    keys[key] = true;


    // Restart
    if (key === "r" && gameOver) {
        restartGame();
    }
});

document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});


// Mobile movement controls
const controlButtons = document.querySelectorAll(".control-btn");

controlButtons.forEach((button) => {

    const key = button.dataset.key;

    // Start moving when finger touches the button
    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        keys[key] = true;
        button.setPointerCapture(event.pointerId);
    });

    // Stop moving when finger is released
    button.addEventListener("pointerup", () => {
        keys[key] = false;
    });

    button.addEventListener("pointercancel", () => {
        keys[key] = false;
    });

    button.addEventListener("lostpointercapture", () => {
        keys[key] = false;
    });
});







// Create one enemy in every road
function spawnEnemies() {

    roadPositions.forEach((roadY) => {

        enemies.push({
            x: -40,
            y: roadY + 45,
            speed: 1.5 + Math.random() * 0.8,
            alive: true
        });

    });
}

// Spawn coins and occasional hearts
function spawnItems() {

    const roadIndex = Math.floor(Math.random() * roadPositions.length);
    const roadY = roadPositions[roadIndex];

    const isHeart = Math.random() < 0.2;

    items.push({
        x: 250 + Math.random() * 300,
        y: roadY + 45,
        type: isHeart ? "heart" : "coin"
    });
}

// Attack nearby enemies

function attack() {

    const now = Date.now();

    // Prevent continuous attacking
    if (now < player.nextAttackTime) {
        return;
    }

    player.nextAttackTime = now + 450;
    player.attackUntil = now + 180;

    // Direction vector
    const directions = {
        right: { x: 1, y: 0 },
        left:  { x: -1, y: 0 },
        up:    { x: 0, y: -1 },
        down:  { x: 0, y: 1 }
    };

    const direction = directions[player.facing];

    enemies.forEach((enemy) => {

        if (!enemy.alive) return;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;

        // Distance in the direction the cat is facing
        const forwardDistance = dx * direction.x + dy * direction.y;

        // Distance perpendicular to the attack direction
        const sideDistance = Math.abs(
            dx * direction.y - dy * direction.x
        );

        // Check whether enemy is inside sword range
        if (
            forwardDistance > 0 &&
            forwardDistance < 85 &&
            sideDistance < 32
        ) {
            enemy.alive = false;
            score += 10;
        }
    });
}


// Draw environment
function drawEnvironment() {

    ctx.fillStyle = "#75b95c";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Roads
    roadPositions.forEach((y) => {

        ctx.fillStyle = "#555555";
        ctx.fillRect(0, y, WIDTH, 90);

        // Road edges
        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(0, y, WIDTH, 4);
        ctx.fillRect(0, y + 86, WIDTH, 4);

        // Road markings
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.setLineDash([25, 20]);

        ctx.beginPath();
        ctx.moveTo(0, y + 45);
        ctx.lineTo(WIDTH, y + 45);
        ctx.stroke();

        ctx.setLineDash([]);
    });
}

// Draw Warrior Cat

function drawPlayer() {

    // Flash cat after collision
    const isFlashing = Date.now() < player.invulnerableUntil;

    ctx.globalAlpha = isFlashing &&
        Math.floor(Date.now() / 120) % 2 === 0 ? 0.25 : 1;

    ctx.fillStyle = "#f28c28";

    // Body
    ctx.beginPath();
    ctx.roundRect(player.x - 17, player.y - 12, 34, 28, 10);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(player.x, player.y - 15, 17, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(player.x - 14, player.y - 25);
    ctx.lineTo(player.x - 17, player.y - 39);
    ctx.lineTo(player.x - 4, player.y - 29);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.x + 14, player.y - 25);
    ctx.lineTo(player.x + 17, player.y - 39);
    ctx.lineTo(player.x + 4, player.y - 29);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(player.x - 6, player.y - 17, 2, 0, Math.PI * 2);
    ctx.arc(player.x + 6, player.y - 17, 2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = "#ffaaaa";
    ctx.beginPath();
    ctx.arc(player.x, player.y - 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Sword direction
    const directions = {
        right: { x: 1, y: 0 },
        left: { x: -1, y: 0 },
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 }
    };

    const direction = directions[player.facing] || directions.right;

    const isAttacking = Date.now() < player.attackUntil;

    const startX = player.x + direction.x * 15;
    const startY = player.y - 5 + direction.y * 15;

    const swordLength = isAttacking ? 55 : 35;

    const endX = player.x + direction.x * swordLength;
    const endY = player.y - 5 + direction.y * swordLength;

    // Sword blade
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = isAttacking ? 6 : 4;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Attack slash
    if (isAttacking) {
        const angle = Math.atan2(direction.y, direction.x);

        ctx.strokeStyle = "#ffff99";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(
            player.x,
            player.y - 5,
            42,
            angle - 0.6,
            angle + 0.6
        );
        ctx.stroke();
    }

    // Reset canvas transparency
    ctx.globalAlpha = 1;
}


// Draw Tung Tung enemy
function drawEnemies() {

    /*enemies.forEach((enemy) => {

        if (!enemy.alive) return;

        // Body
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(enemy.x - 18, enemy.y - 20, 36, 40);

        // Eyes
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(enemy.x - 7, enemy.y - 8, 5, 0, Math.PI * 2);
        ctx.arc(enemy.x + 7, enemy.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(enemy.x - 7, enemy.y - 8, 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + 7, enemy.y - 8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x - 7, enemy.y + 7);
        ctx.lineTo(enemy.x + 7, enemy.y + 7);
        ctx.stroke();
    });*/

    


    


    enemies.forEach((enemy) => {

        if (!enemy.alive) return;

        const x = enemy.x;
        const y = enemy.y;

        ctx.save();
        ctx.translate(x, y);

        // Legs
        ctx.fillStyle = "#654321";
        ctx.fillRect(-12, 12, 9, 20);
        ctx.fillRect(4, 12, 9, 20);

        // Feet
        ctx.fillStyle = "#302010";
        ctx.fillRect(-16, 29, 14, 6);
        ctx.fillRect(3, 29, 14, 6);

        // Arms
        ctx.strokeStyle = "#80552e";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(-13, -7);
        ctx.lineTo(-25, 9);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(13, -7);
        ctx.lineTo(24, -15);
        ctx.stroke();

        // Wooden body
        ctx.fillStyle = "#9b6639";
        ctx.fillRect(-15, -12, 30, 28);

        // Body wood texture
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-9, -5);
        ctx.lineTo(-3, -2);
        ctx.moveTo(3, 5);
        ctx.lineTo(10, 2);
        ctx.stroke();

        // SQUARE FACE
        ctx.fillStyle = "#b47a45";
        ctx.fillRect(-16, -48, 32, 34);

        // Face outline
        ctx.strokeStyle = "#754522";
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -48, 32, 34);

        // Square face wood texture
        ctx.beginPath();
        ctx.moveTo(-11, -39);
        ctx.lineTo(10, -36);
        ctx.moveTo(-10, -19);
        ctx.lineTo(9, -22);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(-7, -36, 5, 0, Math.PI * 2);
        ctx.arc(7, -36, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(-7, -36, 2.5, 0, Math.PI * 2);
        ctx.arc(7, -36, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -22);
        ctx.lineTo(6, -22);
        ctx.stroke();

        // Wooden bat
      // Wooden weapon at lower-right side
ctx.strokeStyle = "#80552e";
ctx.lineWidth = 8;
ctx.lineCap = "round";

ctx.beginPath();
ctx.moveTo(12, 5);
ctx.lineTo(22, 17);
ctx.stroke();

ctx.fillStyle = "#4b2b16";
ctx.fillRect(17, 15, 8, 22);

ctx.fillStyle = "#b88650";
        ctx.fillRect(14, 32, 14, 8);
        ctx.restore();
    });
}

    




// Draw coins and hearts
function drawItems() {

    items.forEach((item) => {

        if (item.type === "coin") {

            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#9b6900";
            ctx.font = "bold 12px Arial";
            ctx.fillText("$", item.x - 4, item.y + 4);

        } else {

            ctx.fillStyle = "#ff3333";
            ctx.font = "25px Arial";
            ctx.fillText("♥", item.x - 12, item.y + 9);

        }
    });
}

// Move player
function updatePlayer() {

   
if (keys["arrowleft"] || keys["a"]) {
    player.x -= player.speed;
    player.facing = "left";
}

if (keys["arrowright"] || keys["d"]) {
    player.x += player.speed;
    player.facing = "right";
}

if (keys["arrowup"] || keys["w"]) {
    player.y -= player.speed;
    player.facing = "up";
}

if (keys["arrowdown"] || keys["s"]) {
    player.y += player.speed;
    player.facing = "down";
}


    player.x = Math.max(25, Math.min(WIDTH - 25, player.x));
    player.y = Math.max(40, Math.min(HEIGHT - 25, player.y));
}

// Move enemies and check escaped enemies

function updateEnemies() {

    enemies.forEach((enemy) => {

        if (!enemy.alive) return;

        // Move Tung Tung towards the right
        enemy.x += enemy.speed;

        // Tung Tung escaping has no penalty
        if (enemy.x > WIDTH + 40) {
            enemy.alive = false;
            return;
        }

        // Check collision with Warrior Cat
       // Check collision with Warrior Cat
const dx = Math.abs(player.x - enemy.x);
const dy = Math.abs(player.y - enemy.y);

if (
    dx < 32 &&
    dy < 45 &&
    Date.now() > player.invulnerableUntil
) {
    enemy.alive = false;

    hearts--;

    // Cat flashes and becomes temporarily invulnerable
    player.invulnerableUntil = Date.now() + 2000;

    if (hearts <= 0) {
        hearts = 0;
        gameOver = true;
    }
}
    });

    // Remove enemies that escaped or touched the cat
    enemies = enemies.filter((enemy) => enemy.alive);
}


// Collect coins and hearts
function updateItems() {

    items = items.filter((item) => {

        const distance = Math.hypot(
            player.x - item.x,
            player.y - item.y
        );

        if (distance < 30) {

            if (item.type === "coin") {
                coins++;
                score += 5;
            } else {
                hearts = Math.min(5, hearts + 1);
            }

            return false;
        }

        return true;
    });
}

// Update score and hearts on screen
function updateUI() {

    document.getElementById("score").textContent = score;
    document.getElementById("coins").textContent = coins;
    document.getElementById("hearts").textContent = "♥ ".repeat(hearts);
}

// Restart game

function restartGame() {

    // Reset player position
    player.x = 400;
    player.y = 510;

    // Reset player direction and attack
    player.facing = "right";
    player.attackUntil = 0;
    player.nextAttackTime = 0;

    player.invulnerableUntil = 0;

    // Clear enemies and items
    enemies = [];
    items = [];

    // Reset game statistics
    score = 0;
    coins = 0;
    hearts = 5;

    // Restart game state
    gameOver = false;

    // Reset spawn timers
    lastWaveTime = 0;
    lastItemTime = 0;

    

    // Update displayed statistics
    updateUI();
}


// Game over screen
function drawGameOver() {

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", WIDTH / 2, 260);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Final Score: " + score, WIDTH / 2, 315);

    ctx.font = "20px Arial";
    ctx.fillText("Press R to Restart", WIDTH / 2, 370);

    ctx.textAlign = "left";
}

// Main game loop

function gameLoop(timestamp) {

    // Reset canvas drawing state every frame
    ctx.globalAlpha = 1;

    drawEnvironment();

    if (!gameOver) {

        updatePlayer();

        // Spawn enemies every 3.5 seconds
        if (timestamp - lastWaveTime > 3500) {
            spawnEnemies();
            lastWaveTime = timestamp;
        }

        // Spawn items every 2.5 seconds
        if (timestamp - lastItemTime > 2500) {
            spawnItems();
            lastItemTime = timestamp;
        }

        updateEnemies();
        updateItems();

        drawItems();
        drawEnemies();
        ctx.globalAlpha = 1;
ctx.globalCompositeOperation = "source-over";
        drawPlayer();

        updateUI();

    } else {

        drawItems();
        drawEnemies();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        drawPlayer();
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
