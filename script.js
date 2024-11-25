window.addEventListener("load", function() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const CANVAS_WIDTH = canvas.width = 1376;
    const CANVAS_HEIGHT = canvas.height = 793;
    let gameSpeed = 0;
    let enemies = [];
    let gameOver = false;
    let score = 0;
    let scoreInterval = 500;
    let timeToScoreIncrement = 0;
    let thingsDodged = 0;
    let metersTravelled = 0;
    const fullScreenBtn = document.getElementById("toggleFullScreen");
    let userHasInteracted = false;
    const backgroundMusic = new Audio();
    backgroundMusic.src = "./Public/Audio/background.mp3";
    backgroundMusic.loop = true;

    function muffleMusic() {
        backgroundMusic.volume = 0.375;
        backgroundMusic.playbackRate = 0.75;
    }

    function restoreMusic() {
        backgroundMusic.volume = 1.0;
        backgroundMusic.playbackRate = 1.0;
    }

    function resetMusic() {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
    }

    class InputHandler {
        constructor() {
            this.keys = [];
            this.touchY = "";
            this.touchThreshold = 30;
            window.addEventListener("keydown", event => {
                if (!userHasInteracted) {
                    userHasInteracted = true;
                    backgroundMusic.play();
                }
                if ((event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "ArrowRight") && this.keys.indexOf(event.key) === -1) {
                    this.keys.push(event.key);
                } else if ((event.key === "r" || event.key === "R" || event.key === "Enter" || this.keys.indexOf("swipe down") > -1) && gameOver) {
                    restartGame()
                } else if (event.key === "f" || event.key === "F") {
                    toggleFullScreen();
                }
            }) 
            window.addEventListener("keyup", event => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    this.keys.splice(this.keys.indexOf(event.key), 1);
                }
            })
            window.addEventListener("touchstart", event => {
                this.touchY = event.changedTouches[0].pageY;
            })
            window.addEventListener("touchmove", event => {
                const distance = event.changedTouches[0].pageY - this.touchY;
                if (distance < -this.touchThreshold && this.keys.indexOf("swipe up") === -1) this.keys.push("swipe up");
                else if (distance > this.touchThreshold && this.keys.indexOf("swipe down") === -1) this.keys.push("swipe down");
            })
            window.addEventListener("touchend", () => {
                this.keys.splice(this.keys.indexOf("swipe up"), 1);
                this.keys.splice(this.keys.indexOf("swipe down"), 1);
            })
        }
    }

    class Player {
        constructor(gameWidth, gameHeight) {
            this.spriteWidth = 796;
            this.spriteHeight = 719;
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = this.spriteWidth * 0.4;
            this.height = this.spriteHeight * 0.4;
            this.x = 100;
            this.y = this.gameHeight - this.height - 100;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
            this.frames = [];
            this.animationState = "run";
            this.maxFrames = 19;
            this.currentFrame = 0;
            this.timeToNewFrame = 0;
            this.frameInterval = 20;
            this.loadFrames("run", 19)
            this.hitBoxX = this.x + 90;
            this.hitBoxY = this.y + 90;
            this.hitBoxWidth = this.width / 3.75;
            this.hitBoxHeight = this.height - 80;
            this.dustCloud = document.getElementById("dust");
            this.dustCloudSpriteWidth = 80;
            this.dustCloudSpriteHeight = 64;
            this.dustCloudFrameX = 0;
            this.dustCloudWidth = this.dustCloudSpriteWidth * 1.5;
            this.dustCloudHeight = this.dustCloudSpriteHeight * 1.5;
            this.showDustCloud = true;
            this.sound = new Audio();
            this.sound.src = "./Public/Audio/running.wav";
            this.sound.loop = true;
        }
        playSound() {
            if (userHasInteracted) {
                if (this.onGround() && this.sound.paused) {
                    this.sound.play();
                } else if (!this.onGround() && !this.sound.paused) {
                    this.sound.pause();
                    this.sound.currentTime = 0;
                }
            }
        }
        restart() {
            this.x = 100;
            this.y = this.gameHeight - this.height - 100;
            this.vy = 0;
            this.speed = 0;
            this.currentFrame = 0;
            this.animationState = "run";
            this.loadFrames("run", 19)
            this.hitBoxX = this.x + 90;
            this.hitBoxY = this.y + 70;
            this.hitBoxWidth = this.width / 3.75;
            this.hitBoxHeight = this.height - 60;
        }
        loadFrames(animationType, maxFrames) {
            this.frames = [];
            this.currentFrame = 0;
            this.maxFrames = maxFrames;
            for (let i = 1; i <= this.maxFrames; i++) {
                this.frames.push(document.getElementById(`${animationType}${i}`));
            }
        }
        update(input, deltaTime) {
            this.playSound();
            enemies.forEach(enemy => {
                if (this.hitBoxX < enemy.hitBoxX + enemy.hitBoxWidth &&
                    this.hitBoxX + this.hitBoxWidth > enemy.hitBoxX &&
                    this.hitBoxY < enemy.hitBoxY + enemy.hitBoxHeight &&
                    this.hitBoxY + this.hitBoxHeight > enemy.hitBoxY
                ) {
                    gameOver = true;
                    muffleMusic();
                    enemies.forEach(enemy => {
                        enemy.stopSound();
                    })
                } else {
                    timeToScoreIncrement += deltaTime;
                    if (timeToScoreIncrement >= scoreInterval) {
                        score += Math.floor(Math.random() * 2 + 1);
                        timeToScoreIncrement = 0;
                        metersTravelled += 1;
                    }
                    if (score > 1000) {
                        scoreInterval = 400;
                    } else if (score > 5000) {
                        scoreInterval = 200;
                    }
                }
            })
            this.timeToNewFrame += deltaTime;   
            if (this.timeToNewFrame >= this.frameInterval) {
                this.currentFrame++;
                this.dustCloudFrameX++;
                if (this.dustCloudFrameX > 8) {
                    this.dustCloudFrameX = 0;
                } 
                this.timeToNewFrame = 0;
            }
            if (this.currentFrame >= this.maxFrames) this.currentFrame = 0;
            if (input.keys.indexOf("ArrowRight") > -1) {
                this.speed = 5;
                scoreInterval = 450;
                gameSpeed = 6;
            } else if (input.keys.indexOf("ArrowLeft") > -1) {
                this.speed = -5;
                scoreInterval = 550;
                gameSpeed = 4;
            } else {
                this.speed = 0;
                gameSpeed = 5;
                scoreInterval = 500;
            }
            if ((input.keys.indexOf("ArrowUp") > -1 || input.keys.indexOf("swipe up") > -1) && this.onGround()) {
                this.vy -=  23;
                this.animationState = "jump";
                this.loadFrames("jump", 11);
                this.frameInterval = 20;
            }
            this.x += this.speed;
            if (this.x <= 0) this.x = 0;
            else if (this.x >= this.gameWidth - this.width) this.x = this.gameWidth - this.width;
            this.y += this.vy;
            if (!this.onGround()) {
                this.showDustCloud = false;
                this.vy += this.weight;
                if (this.weight === this.vy) {
                    if (this.animationState !== 'fall') {
                        this.animationState = 'fall';
                        this.loadFrames('fall', 13);
                        this.frameInterval = 50;
                    }
                }
            } else {
                this.showDustCloud = true;
                this.vy = 0;
                if (this.animationState !== 'run') {
                    this.animationState = 'run';
                    this.loadFrames('run', 19);
                    this.frameInterval = 20;
                }
            }
            if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
            this.hitBoxX = this.x + 90;
            if (this.animationState === "jump") {
                this.hitBoxY = this.y + 30;
            } else if (this.animationState === "fall") {
                this.hitBoxY = this.y + 50;
            } else {
                this.hitBoxY = this.y + 90;
            }
        }
        draw(context) {
            context.drawImage(this.frames[this.currentFrame], this.x, this.y, this.width, this.height);
            if (this.showDustCloud) context.drawImage(this.dustCloud, this.dustCloudFrameX * this.dustCloudSpriteWidth, 0, this.dustCloudSpriteWidth, this.dustCloudSpriteHeight, this.x, this.y + this.height / 2 + 50, this.dustCloudWidth, this.dustCloudHeight);
        }
        onGround() {
            return this.y >= this.gameHeight - this.height - 100;
        }
    }

    class Enemy {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.frameX = 0;
            this.isMarkedForDeletion = false;
            this.frameInterval = 100;
            this.timeToNewFrame = 0;
            this.isMarkedForDeletion = false;
        }
        update(deltaTime) {
            this.x -= this.speed;
            this.timeToNewFrame += deltaTime;
            if (this.timeToNewFrame >= this.frameInterval) {
                this.frameX++;
                this.timeToNewFrame = 0;
            }
            if (this.frameX > this.maxFrames) this.frameX = 0;
            if (this.x < -this.width) {
                this.isMarkedForDeletion = true;
                score += Math.floor(Math.random() * 10 + 5);
                thingsDodged++;
            }
        }
        draw(context) {
            context.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
    }

    class Demon extends Enemy {
        constructor(enemy) {
            super();
            this.speed = Math.random() * 7 + 8;
            this.enemy = enemy;
            this.spriteWidth = 81;
            this.spriteHeight = 71;
            this.width = this.spriteWidth * 1.75;
            this.height = this.spriteHeight * 1.75;
            this.image = document.getElementById("demon-flying");
            this.maxFrames = 3;
            this.x = this.enemy.gameWidth + this.width;
            this.baseY = Math.floor(Math.random() * (550 - 475 + 1)) + 475;
            this.y = this.baseY;
            this.angle = Math.random() * Math.PI * 2;
            this.curve = Math.random() * 2 + 1;
            this.frequency = Math.random() * 0.05 + 0.02;
            this.randomMovementTimer = 0;
            this.randomY = 0;
            this.hitBoxX = this.x + 20;
            this.hitBoxY = this.y + this.height / 3;
            this.hitBoxWidth = this.width / 2;
            this.hitBoxHeight = this.height / 2;
            this.sound = new Audio();
            this.sounds = ["./Public/Audio/demon1.mp3", "./Public/Audio/demon2.mp3", "./Public/Audio/demon3.mp3"];
            this.playSound();
        }
        stopSound() {
            this.sound.pause();
            this.sound.currentTime = 0;
        }
        playSound() {
            if (userHasInteracted) {
                this.sound.src = this.sounds[Math.floor(Math.random() * this.sounds.length)];
                this.sound.volume = 0.1;
                this.sound.play();
            }
        }
        update(deltaTime) {
            super.update(deltaTime);
            this.y = this.baseY + Math.sin(this.angle) * this.curve * 20;
            this.angle += this.frequency;
            this.randomMovementTimer += deltaTime;
            if (this.randomMovementTimer > 1000) {
                this.randomY = Math.random() * 30 - 15;
                this.randomMovementTimer = 0;
            }
            this.y += this.randomY;
            this.y = Math.max(0, Math.min(this.y, this.enemy.gameHeight - this.height));
            this.hitBoxX = this.x + 20;
            this.hitBoxY = this.y + this.height / 3;
        }
        draw(context) {
            super.draw(context);
        }
    }
    
    class Fireball extends Enemy {
        constructor(enemy) {
            super();
            this.enemy = enemy;
            this.image = document.getElementById("fireball");
            this.spriteWidth = 48;
            this.spriteHeight = 32;
            this.width = this.spriteWidth * 1.5;
            this.height = this.spriteHeight * 1.5;
            this.x = this.enemy.gameWidth + this.width;
            this.y = Math.random() * 300 + 300;
            this.speed = Math.random() * 10 + 15;
            this.hitBoxX = this.x + 8;
            this.hitBoxY = this.y + 15;
            this.hitBoxWidth = this.width - 20;
            this.hitBoxHeight = this.height - 20;
            this.sound = new Audio();
            this.sound.src = "./Public/Audio/fireball.wav";
            this.playSound();
        }
        stopSound() {
            this.sound.pause();
            this.sound.currentTime = 0;
        }
        playSound() {
            if (userHasInteracted) this.sound.play();
        }
        update() {
            if (this.x < -this.width) {
                this.isMarkedForDeletion = true;
                score += Math.floor(Math.random() * 15 + 5);
                thingsDodged++;
            }
            this.x -= this.speed;
            this.hitBoxX = this.x + 8;
            this.hitBoxY = this.y + 15;
        }
        draw(context) {
            super.draw(context);
        }
    }

    class Background {
        constructor(layer, speedModifier) {
            this.x = 0;
            this.y = 0;
            this.spriteWidth = 1376;
            this.spriteHeight = 634;
            this.width = 1376 * 1.25;
            this.height = 634 * 1.25;
            this.layer = layer;
            this.gameSpeed = 5;
            this.speedModifier = speedModifier;
        }
        restart() {
            this.x = 0;
        }
        update(newGameSpeed) {
            this.gameSpeed = newGameSpeed * this.speedModifier;
            this.x -= this.gameSpeed;
            if (this.x < -this.width) {
                this.x = 0;
            }
        }
        drawLayer(context) {
            context.drawImage(this.layer, this.x, this.y, this.width, this.height);
            context.drawImage(this.layer, this.x + this.width - this.gameSpeed, this.y, this.width, this.height);
        }
    }

    class Bezel {
        constructor(gameWidth, gameHeight) {
            this.x = 0;
            this.y = 0;
            this.image = document.getElementById("bezel");
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = this.gameWidth;
            this.height = this.gameHeight;
        }
        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    function handleEnemies(deltaTime) {
        const enemyTypes = ["demon", "fireball"];
        const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        if (timeToNewEnemy >= randomEnemyInterval) {
            if (randomEnemy === "demon") enemies.push(new Demon(enemy));
            else if (randomEnemy === "fireball") enemies.push(new Fireball(enemy));
            randomEnemyInterval = Math.random() * 1000 + 1000;
            timeToNewEnemy = 0;
        } else {
            timeToNewEnemy += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        })
        enemies = enemies.filter(enemy => !enemy.isMarkedForDeletion);
    }

    function displayStatusText() {
        ctx.textAlign = "left";
        ctx.fillStyle = "#B7B58A";
        ctx.font = "30px Bokor";
        ctx.fillText(`Your Score: ${score}`, 85, 85);
        ctx.fillText(`Monsters Dodged: ${thingsDodged}`, 85, 120);
        ctx.fillText(`${metersTravelled} Meters`, 75, CANVAS_HEIGHT - 75);
        ctx.fillStyle = "#FDFCEC";
        ctx.fillText(`Your Score: ${score}`, 87, 87);
        ctx.fillText(`Monsters Dodged: ${thingsDodged}`, 87, 122);
        ctx.fillText(`${metersTravelled} Meters`, 77, CANVAS_HEIGHT - 77);
        if (gameOver) {
            ctx.textAlign = "center";
            ctx.font = "40px Bokor";
            ctx.fillStyle = "#19332D";
            ctx.fillText("GAME OVER, press R or swipe down to restart!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.fillStyle = "#FDFCEC";
            ctx.fillText("GAME OVER, press R or swipe down to restart!", CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 + 2);
        }
    }

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                alert(`Error, can't enable full-screen mode: ${err.message}`);
            })
        } else {
            document.exitFullscreen();
        }
    }
    fullScreenBtn.addEventListener("click", toggleFullScreen);

    function restartGame() {
        gameOver = false;
        background1.x = 0;
        background2.x = 0;
        background3.x = 0;
        enemies = [];
        player.restart();
        score = 0;
        thingsDodged = 0;
        metersTravelled = 0;  
        resetMusic();
        restoreMusic();
        animate(0);
    }

    const layer1 = document.getElementById("layer1");
    const background1 = new Background(layer1, 0.4);
    const layer2 = document.getElementById("layer2");
    const background2 = new Background(layer2, 0.8);
    const layer3 = document.getElementById("layer3");
    const background3 = new Background(layer3, 1.4);

    const input = new InputHandler();
    const player = new Player(CANVAS_WIDTH, CANVAS_HEIGHT);
    const enemy = new Enemy(CANVAS_WIDTH, CANVAS_HEIGHT);
    const bezel = new Bezel(CANVAS_WIDTH, CANVAS_HEIGHT);

    let lastTime = 0;
    let timeToNewEnemy = 0;
    let randomEnemyInterval = Math.random() * 1000 + 1000;
    function animate(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        background1.drawLayer(ctx);
        background1.update(gameSpeed);
        background2.drawLayer(ctx);
        background2.update(gameSpeed);
        player.update(input, deltaTime);
        player.draw(ctx);
        handleEnemies(deltaTime);
        background3.drawLayer(ctx);
        background3.update(gameSpeed);
        displayStatusText();
        if (!gameOver) requestAnimationFrame(animate);
        bezel.draw(ctx);
    }
    animate(0);
})