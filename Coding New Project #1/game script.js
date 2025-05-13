const character = document.getElementById("character");
const sword = document.querySelector(".sword");
const enemy = document.getElementById("enemy");
const inventoryButton = document.getElementById("inventory-button");
const inventory = document.getElementById("inventory");
const inventoryList = document.getElementById("inventory-list");
const waveCounter = document.getElementById("wave-counter"); // Wave counter element

let equippedSword = "Basic Sword"; // Default equipped sword
let inventoryItems = []; // Inventory array
let isMovingLeft = false;
let isMovingRight = false;
let isJumping = false;
let isSwinging = false;
let isGamePaused = false;
let characterX = 100; // Initial X position of the character
let enemyX = 500; // Initial X position of the enemy
let enemyFollowing = false;
let enemyCanAttack = true; // Cooldown flag for enemy attacks
let playerHealth = 35; // Initial player health
let maxPlayerHealth = 35; // Maximum player health
let enemyHealth = 15; // Initial enemy health
let waveCount = 1; // Initial wave count
let jumpPower = 150; // Initial jump power
const gameWidth = 1500; // Fixed width of the game world

// Load saved state from local storage
function loadGameState() {
    const savedSword = localStorage.getItem("equippedSword");
    const savedInventory = localStorage.getItem("inventoryItems");
    const savedJumpPower = localStorage.getItem("jumpPower");

    if (savedSword) {
        equippedSword = savedSword;
        updateSwordAppearance();
    }

    if (savedInventory) {
        inventoryItems = JSON.parse(savedInventory);
        inventoryItems.forEach((item) => addItemToInventory(item, false));
    }

    if (savedJumpPower) {
        jumpPower = parseInt(savedJumpPower, 10);
    }

    updateCharacterHPBar(); // Ensure the health bar is updated after loading
}

// Save game state to local storage
function saveGameState() {
    localStorage.setItem("equippedSword", equippedSword);
    localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
    localStorage.setItem("jumpPower", jumpPower);
}

// Update sword appearance based on the equipped sword
function updateSwordAppearance() {
    if (equippedSword === "Golden Sword") {
        sword.style.backgroundColor = "gold";
    } else {
        sword.style.backgroundColor = "silver";
    }
}

// Add items to the inventory dynamically
function addItemToInventory(itemName, save = true) {
    if (itemName === "Golden Sword" && inventoryItems.includes("Golden Sword")) {
        console.log("You already have a Golden Sword!");
        return;
    }

    const itemDiv = document.createElement("div");
    itemDiv.textContent = itemName;

    const equipButton = document.createElement("button");
    equipButton.textContent = "Equip";
    equipButton.classList.add("equip-button");
    equipButton.addEventListener("click", () => equipItem(itemName, itemDiv));

    itemDiv.appendChild(equipButton);
    inventoryList.appendChild(itemDiv);

    if (save) {
        inventoryItems.push(itemName);
        saveGameState();
    }
}

// Equip an item from the inventory
function equipItem(itemName, itemDiv) {
    if (itemName !== equippedSword) {
        addItemToInventory(equippedSword);
        equippedSword = itemName;
        updateSwordAppearance();
        inventoryItems = inventoryItems.filter((item) => item !== itemName);
        inventoryList.removeChild(itemDiv);
        saveGameState();
    }
}

// Toggle inventory visibility
inventoryButton.addEventListener("click", () => {
    inventory.classList.toggle("hidden");
    inventory.style.display = inventory.classList.contains("hidden") ? "none" : "block";

    if (inventory.classList.contains("hidden")) {
        isGamePaused = false;
        requestAnimationFrame(gameLoop);
    } else {
        isGamePaused = true;
    }
});

// Handle movement
window.addEventListener("keydown", (e) => {
    if (isGamePaused) return;

    if (e.key === "ArrowLeft" || e.key === "a") {
        isMovingLeft = true;
        character.classList.add("facing-left");
        sword.style.left = "-15px"; // Sword on the left
        sword.style.right = "auto";
    }
    if (e.key === "ArrowRight" || e.key === "d") {
        isMovingRight = true;
        character.classList.remove("facing-left");
        sword.style.right = "-15px"; // Sword on the right
        sword.style.left = "auto";
    }
    if ((e.key === " " || e.key === "ArrowUp" || e.key === "w") && !isJumping) {
        jump();
    }
});

window.addEventListener("keyup", (e) => {
    if (isGamePaused) return;

    if (e.key === "ArrowLeft" || e.key === "a") {
        isMovingLeft = false;
    }
    if (e.key === "ArrowRight" || e.key === "d") {
        isMovingRight = false;
    }
});

// Jumping logic
function jump() {
    if (isJumping) return;
    isJumping = true;

    const jumpDuration = 500;
    const groundLevel = 100;

    character.style.transition = `bottom ${jumpDuration / 1000}s ease-out`;
    character.style.bottom = `${groundLevel + jumpPower}px`;

    setTimeout(() => {
        character.style.bottom = `${groundLevel}px`;
        setTimeout(() => {
            isJumping = false;
        }, jumpDuration);
    }, jumpDuration);
}

// Sword swing logic
window.addEventListener("mousedown", (e) => {
    if (isGamePaused) return;
    if (e.button === 0) {
        swingSword();
    }
});

function swingSword() {
    if (isSwinging) return;
    isSwinging = true;

    if (character.classList.contains("facing-left")) {
        sword.style.transform = "rotate(-75deg)";
    } else {
        sword.style.transform = "rotate(75deg)";
    }

    setTimeout(() => {
        sword.style.transform = "rotate(0deg)";
        isSwinging = false;
    }, 500);

    const swordRect = sword.getBoundingClientRect();
    const enemyRect = enemy.getBoundingClientRect();

    const isColliding =
        swordRect.right > enemyRect.left &&
        swordRect.left < enemyRect.right &&
        swordRect.bottom > enemyRect.top &&
        swordRect.top < enemyRect.bottom;

    if (isColliding) {
        const damage = equippedSword === "Golden Sword" ? 10 : 5;
        enemyHealth -= damage;
        console.log(`Enemy hit! Health: ${enemyHealth}`);
        updateEnemyHPBar();
    }
}

// Enemy AI logic
function enemyAI() {
    const distance = Math.abs(characterX - enemyX);

    if (distance <= 200) {
        enemyFollowing = true;
    } else if (distance > 1000) {
        enemyFollowing = false;
    }

    if (enemyFollowing) {
        if (characterX < enemyX) {
            enemyX -= 2;
        } else {
            enemyX += 2;
        }
    }

    enemy.style.left = `${enemyX}px`;

    const characterRect = character.getBoundingClientRect();
    const enemyRect = enemy.getBoundingClientRect();

    if (
        characterRect.right > enemyRect.left &&
        characterRect.left < enemyRect.right &&
        characterRect.bottom > enemyRect.top &&
        characterRect.top < enemyRect.bottom
    ) {
        if (enemyCanAttack) {
            takeDamage(4); // Enemy deals 1 damage to the player
            enemyCanAttack = false;
            setTimeout(() => {
                enemyCanAttack = true; // Cooldown for enemy attacks
            }, 1400);
        }
    }
}

// Check for right wall collision
function checkRightWallCollision() {
    if (characterX > gameWidth - character.offsetWidth) {
        characterX = gameWidth - character.offsetWidth;
    }
    if (characterX < 0) {
        characterX = 0;
    }
}

// Respawn the enemy after 4 seconds
function respawnEnemy() {
    console.log("Respawning enemy...");
    setTimeout(() => {
        const middleStart = gameWidth / 3;
        const middleEnd = (gameWidth / 3) * 2;
        let newEnemyX;

        do {
            newEnemyX = Math.random() * (middleEnd - middleStart) + middleStart;
        } while (Math.abs(newEnemyX - characterX) < 300);

        enemyX = newEnemyX;

        // Adjust enemy health for wave milestones
        if (waveCount % 10 === 0) {
            enemyHealth = 40;
            playerHealth = maxPlayerHealth; // Heal player to max HP
            console.log("Wave milestone reached! Player healed to max HP.");
        } else {
            enemyHealth = 15;
        }

        enemy.style.left = `${enemyX}px`;
        enemy.style.bottom = "100px";
        enemy.style.display = "block";
        updateEnemyHPBar();

        waveCount++;
        waveCounter.textContent = `Wave: ${waveCount}`;
        console.log(`Wave ${waveCount}: Enemy respawned at X=${enemyX}`);
    }, 3000);
}

// Game loop
function gameLoop() {
    if (isGamePaused) return;

    if (isMovingLeft) {
        characterX = Math.max(0, characterX - 5);
    }
    if (isMovingRight) {
        characterX = Math.min(gameWidth - character.offsetWidth, characterX + 5);
    }

    checkRightWallCollision();
    character.style.left = `${characterX}px`;
    enemyAI();
    requestAnimationFrame(gameLoop);
}

function takeDamage(amount) {
    playerHealth -= amount;
    if (playerHealth <= 0) {
        console.log("Player defeated!");
        alert("You Died! Restarting...");
        window.location.reload();
    }
    updateCharacterHPBar();
}

function updateCharacterHPBar() {
    const characterHpBar = document.getElementById("character-hp-bar");
    characterHpBar.style.width = `${(playerHealth / maxPlayerHealth) * 50}px`;
    characterHpBar.textContent = `${playerHealth} HP`;
}

function updateEnemyHPBar() {
    const enemyHpBar = document.getElementById("enemy-hp-bar");
    enemyHpBar.style.width = `${(enemyHealth / (waveCount % 10 === 0 ? 40 : 15)) * 50}px`; // Adjust width based on enemy health
    enemyHpBar.textContent = `${enemyHealth} HP`;

    if (enemyHealth <= 0) {
        console.log("Enemy defeated!");
        enemy.style.display = "none";

        if (Math.random() < 0.25) {
            playerHealth = Math.min(playerHealth + 5, maxPlayerHealth);
            console.log("You healed 5 HP!");
        }

        if (Math.random() < 0.1) {
            maxPlayerHealth += 5;
            console.log("Your max HP increased by 5!");
        }

        if (Math.random() < 0.05) {
            jumpPower += 5;
            console.log("Your jump power increased by 5!");
        }

        saveGameState();
        respawnEnemy();
    }
}

// Initialize the game
loadGameState();
updateCharacterHPBar();
gameLoop();