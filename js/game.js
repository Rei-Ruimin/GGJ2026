import { getLevels } from './data/levels.js';
import { LANG } from './data/story.js';
import { AudioManager } from './audio.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.tileSize = 50;
        
        this.audio = new AudioManager();

        // Language & Levels
        this.language = 'zh'; // Default to Chinese
        document.body.classList.add(`lang-${this.language}`);
        this.levels = getLevels(this.language);

        // Initialize UI Text
        this.initUI();

        // Landscape settings
        this.gridW = 500;
        this.gridH = 500;
        this.offsetX = (800 - 500) / 2; // Center horizontally
        this.offsetY = (600 - 500) / 2 + 10; // Center vertically with slight offset
        
        this.currentLevelIdx = 0;
        this.player = { x: 0, y: 0, direction: 'front' };
        this.dimension = 0; 
        this.state = 'start'; 
        this.particles = []; // Particle system
        this.shakeIntensity = 0;

        this.colors = {
            0: { bg: '#2c2c2c', wall: '#505050', path: '#3a3a3a', player: '#fff', ambient: 'rgba(17, 17, 17, 0.4)' },
            1: { bg: '#e0f7fa', wall: '#81d4fa', path: '#b3e5fc', player: '#ffd700', ambient: 'rgba(0, 47, 108, 0.4)' },
            2: { bg: '#210000', wall: '#b71c1c', path: '#4a0000', player: '#ff3d00', ambient: 'rgba(26, 0, 0, 0.4)' }
        };

        this.heroImages = {};
        this.loadHeroImages();

        this.levelImages = {};
        this.loadLevelImages();
        
        this.itemImages = {};
        this.bulbImage = new Image();
        this.loadItemImages();

        this.bindInput();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    setLanguage(lang) {
        if (this.language === lang) return;
        this.language = lang;
        this.levels = getLevels(this.language);
        
        // Update body class for CSS styling (e.g., fonts)
        document.body.classList.remove('lang-zh', 'lang-en');
        document.body.classList.add(`lang-${lang}`);

        this.initUI();
        
        // Update active button state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            // Simple check based on text content or we could add data-lang attribute
            const btnLang = btn.innerText === '中文' ? 'zh' : 'en';
            if (btnLang === lang) btn.classList.add('active');
        });
    }

    spawnParticles(x, y, count, color, type = 'move') {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + Math.random() * 40 + 5,
                y: y + Math.random() * 40 + 5,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0,
                color: color,
                type: type
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            if (p.type === 'glitch') {
                this.ctx.fillRect(p.x, p.y, Math.random() * 10, 2);
            } else {
                this.ctx.fillRect(p.x, p.y, 3, 3);
            }
        });
        this.ctx.globalAlpha = 1.0;
    }

    triggerShake() {
        this.shakeIntensity = 20;
    }

    showDialog(text, imageSrc = null) {
        this.state = 'dialog';
        const box = document.getElementById('dialog-box');
        const content = document.getElementById('dialog-text');
        const itemImg = document.getElementById('dialog-item-img');
        
        box.style.display = 'block';
        content.innerText = ""; // Clear existing

        if (imageSrc) {
            itemImg.src = `assets/level/items/${imageSrc}`;
            itemImg.style.display = 'block';
        } else {
            itemImg.style.display = 'none';
        }

        let index = 0;
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);

        this.typewriterInterval = setInterval(() => {
            content.innerText += text.charAt(index);
            index++;
            if (index >= text.length) {
                clearInterval(this.typewriterInterval);
            }
        }, 30); // Speed of typing
    }

    advanceDialog() {
        document.getElementById('dialog-box').style.display = 'none';
        document.getElementById('dialog-item-img').style.display = 'none';
        this.state = 'playing';
    }

    initUI() {
        const story = LANG[this.language];

        // Start Screen
        const startScreen = document.querySelector('#start-screen');
        // Only update title/desc/button, preserve lang buttons
        const h1 = startScreen.querySelector('h1');
        if(h1) h1.innerHTML = `${story.title}<br><span style="font-size:18px; color:#888;">${story.subtitle}</span>`;
        
        const p = startScreen.querySelector('p');
        if(p) p.innerHTML = story.startScreen.description;
        
        const btn = startScreen.querySelector('.start-btn');
        if(btn) btn.innerText = story.startScreen.button;

        // Game Over Screen
        const gameOverScreen = document.querySelector('#game-over-screen');
        gameOverScreen.querySelector('h1').innerText = story.gameOver.title;
        gameOverScreen.querySelector('#death-reason').innerText = story.gameOver.defaultReason;
        gameOverScreen.querySelector('button').innerText = story.gameOver.button;

        // Victory Screen
        const victoryScreen = document.querySelector('#victory-screen');
        victoryScreen.querySelector('h1').innerText = story.victory.title;
        victoryScreen.querySelector('div').innerHTML = story.victory.content;
        victoryScreen.querySelector('button').innerText = story.victory.button;

        // HUD & Controls
        const controlsHint = document.getElementById('controls-hint');
        if (controlsHint) controlsHint.innerText = story.ui.controls;

        const dialogNext = document.getElementById('dialog-next');
        if (dialogNext) dialogNext.innerText = story.ui.next;
    }

    loadHeroImages() {
        const directions = ['front', 'back', 'left', 'right', 'shadow'];
        for (let dim = 1; dim <= 3; dim++) {
            this.heroImages[dim] = {};
            directions.forEach(dir => {
                const img = new Image();
                img.src = `assets/hero/filter${dim}${dir}.png`;
                this.heroImages[dim][dir] = img;
            });
        }
    }

    loadLevelImages() {
        // Dim 0: Human -> bg1, 1book
        // Dim 1: Heaven -> bg2, 2cloud
        // Dim 2: Hell -> bg3, 3lava
        const assets = [
            { bg: 'bg1.png', wall: '1book.png' },
            { bg: 'bg2.png', wall: '2cloud.png' },
            { bg: 'bg3.png', wall: '3lava.png' }
        ];

        assets.forEach((asset, idx) => {
            const dim = idx; // 0, 1, 2
            this.levelImages[dim] = {};
            
            const bgImg = new Image();
            bgImg.src = `assets/level/${asset.bg}`;
            this.levelImages[dim].bg = bgImg;

            const wallImg = new Image();
            wallImg.src = `assets/level/${asset.wall}`;
            this.levelImages[dim].wall = wallImg;
        });
    }

    loadItemImages() {
        const items = ['1cola.png', '2dim.png', '3wings.png', '4flash.png'];
        items.forEach((item) => {
            const img = new Image();
            img.src = `assets/level/items/${item}`;
            this.itemImages[item] = img;
        });
        this.bulbImage.src = 'assets/level/items/bulb.png';
    }

    bindInput() {
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'playing' && this.state !== 'dialog') return;

            if (this.state === 'dialog') {
                if (e.key === ' ' || e.key === 'Enter') this.advanceDialog();
                return;
            }

            switch(e.key.toLowerCase()) {
                case 'w': case 'arrowup': this.move(0, -1); break;
                case 's': case 'arrowdown': this.move(0, 1); break;
                case 'a': case 'arrowleft': this.move(-1, 0); break;
                case 'd': case 'arrowright': this.move(1, 0); break;
                case '1': this.switchDimension(0); break;
                case '2': this.switchDimension(1); break;
                case '3': this.switchDimension(2); break;
            }
        });
    }

    startLevel(idx) {
        this.currentLevelIdx = idx;
        const level = this.levels[this.currentLevelIdx];
        this.player = { ...level.start, direction: 'front' };
        this.dimension = 0;
        this.state = 'playing';
        this.particles = []; // Clear particles
        
        // Audio Init
        this.audio.init().then(() => {
            this.audio.fadeBGM(0);
        });

        for(let key in level.items) level.items[key].collected = false;

        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
        document.getElementById('level-display').innerText = level.name.toUpperCase();
        this.updateMaskUI();
        
        if (idx === 0) {
            this.showDialog(LANG[this.language].dialogs.intro);
        }
    }
    
    restartLevel() {
        this.startLevel(this.currentLevelIdx);
    }

    move(dx, dy) {
        if (this.state !== 'playing') return;

        // Update direction
        if (dy < 0) this.player.direction = 'back';
        if (dy > 0) this.player.direction = 'front';
        if (dx < 0) this.player.direction = 'left';
        if (dx > 0) this.player.direction = 'right';

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        const level = this.levels[this.currentLevelIdx];

        if (newX < 0 || newX >= 10 || newY < 0 || newY >= 10) {
            this.audio.playBump();
            this.shakeIntensity = 5;
            return;
        }
        if (level.maps[this.dimension][newY][newX] === 1) {
            this.audio.playBump();
            this.shakeIntensity = 5;
            return;
        }

        this.player.x = newX;
        this.player.y = newY;
        
        this.audio.playFlap();
        
        // Spawn movement particles
        const px = this.offsetX + this.player.x * this.tileSize;
        const py = this.offsetY + this.player.y * this.tileSize;
        this.spawnParticles(px, py, 5, '#fff', 'move');

        this.checkTileEvents();
    }

    switchDimension(newDim) {
        if (this.state !== 'playing') return;
        if (this.dimension === newDim) return;
        
        const level = this.levels[this.currentLevelIdx];
        if (level.lockedDimensions[newDim]) {
            this.audio.playBump();
            this.shakeIntensity = 5;
            return;
        }

        // Spawn glitch particles before switch
        const px = this.offsetX + this.player.x * this.tileSize;
        const py = this.offsetY + this.player.y * this.tileSize;
        
        let glitchColor = '#fff';
        if (newDim === 0) glitchColor = '#aaaaaa'; // Human
        if (newDim === 1) glitchColor = '#00ffff'; // Heaven
        if (newDim === 2) glitchColor = '#ff4400'; // Hell
        
        this.spawnParticles(px, py, 20, glitchColor, 'glitch');

        // Check if at start
        const isAtStart = this.player.x === level.start.x && this.player.y === level.start.y;

        // Collision logic
        if (!isAtStart && level.maps[newDim][this.player.y][this.player.x] === 1) {
            this.dimension = newDim; 
            this.triggerShake();
            this.die(LANG[this.language].dialogs.deathOverlap);
            return;
        }

        this.dimension = newDim;
        this.audio.fadeBGM(newDim);
        this.updateMaskUI();
        
        this.canvas.style.filter = 'contrast(1.5) brightness(1.2)';
        setTimeout(() => this.canvas.style.filter = 'none', 100);
    }

    updateMaskUI() {
        const level = this.levels[this.currentLevelIdx];
        document.querySelectorAll('.mask-btn').forEach(btn => {
            btn.classList.remove('active', 'locked');
            const typeIdx = btn.dataset.type === 'human' ? 0 : btn.dataset.type === 'heaven' ? 1 : 2;
            if (level.lockedDimensions[typeIdx]) btn.classList.add('locked');
            if (typeIdx === this.dimension) btn.classList.add('active');
        });
    }

    checkTileEvents() {
        const level = this.levels[this.currentLevelIdx];
        const tileType = level.maps[this.dimension][this.player.y][this.player.x];

        if (this.player.x === level.end.x && this.player.y === level.end.y) {
            if (this.currentLevelIdx < this.levels.length - 1) {
                this.startLevel(this.currentLevelIdx + 1);
            } else {
                this.victory();
            }
            return;
        }

        const key = `${this.player.x},${this.player.y}`;
        if ((tileType === 2 || level.items[key]) && level.items[key] && !level.items[key].collected) {
            level.items[key].collected = true;
            this.showDialog(level.items[key].text, level.items[key].image);
        }
    }

    die(reason) {
        this.state = 'gameover';
        this.audio.playZap();
        setTimeout(() => this.audio.stopAll(), 100); 

        document.getElementById('death-reason').innerText = reason;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    victory() {
        this.state = 'victory';
        this.audio.playZap();
        setTimeout(() => this.audio.stopAll(), 100);

        document.getElementById('victory-screen').classList.remove('hidden');
    }

    advanceDialog() {
        document.getElementById('dialog-box').style.display = 'none';
        this.state = 'playing';
    }

    draw() {
        // Explicitly clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'start') {
            this.renderStartScreen();
        } else {
            this.renderGame();
        }
    }

    renderStartScreen() {
        // Draw a solid dark background to ensure no bleed-through
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderGame() {
        // Background - Ambient Theme Color
        const theme = this.colors[this.dimension];
        this.ctx.fillStyle = theme.ambient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        if (this.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
            this.shakeIntensity *= 0.9;
            if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
        }

        const level = this.levels[this.currentLevelIdx];
        const map = level.maps[this.dimension];
        
        // Get current dimension assets
        const levelAssets = this.levelImages[this.dimension];

        // --- Draw Grid Background (The Play Area) ---
        this.ctx.fillRect(this.offsetX - 5, this.offsetY - 5, this.gridW + 10, this.gridH + 10);

        // --- Draw Map Tiles ---
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const tile = map[y][x];
                const posX = this.offsetX + x * this.tileSize;
                const posY = this.offsetY + y * this.tileSize;

                // Floor
                if (levelAssets && levelAssets.bg && levelAssets.bg.complete) {
                     this.ctx.drawImage(levelAssets.bg, posX, posY, this.tileSize, this.tileSize);
                } else {
                     this.ctx.fillStyle = theme.path;
                     this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                }

                // Walls
                if (tile === 1) {
                    if (levelAssets && levelAssets.wall && levelAssets.wall.complete) {
                        this.ctx.drawImage(levelAssets.wall, posX, posY, this.tileSize, this.tileSize);
                    } else {
                        this.ctx.fillStyle = theme.wall;
                        this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                        
                        // 3D effect bevel (Legacy fallback)
                        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                        this.ctx.fillRect(posX, posY + 40, 50, 10);
                        this.ctx.fillRect(posX + 40, posY, 10, 50);
                    }
                }

                // Items
                const key = `${x},${y}`;
                if (level.items[key] && !level.items[key].collected && tile !== 1) {
                    const px = posX;
                    const py = posY;
                    
                    const itemData = level.items[key];
                    const itemImg = this.itemImages[itemData.image];
                    
                    if (itemImg && itemImg.complete) {
                        this.ctx.drawImage(itemImg, px + 5, py + 5, 40, 40);
                    } else {
                        // Fallback
                        this.ctx.fillStyle = '#FFD700';
                        this.ctx.beginPath();
                        this.ctx.moveTo(px + 25, py + 10);
                        this.ctx.lineTo(px + 15, py + 40);
                        this.ctx.lineTo(px + 35, py + 40);
                        this.ctx.fill();
                    }
                }
            }
        }

        // Draw Start
        const sx = this.offsetX + level.start.x * this.tileSize + 25;
        const sy = this.offsetY + level.start.y * this.tileSize + 25;
        
        this.ctx.strokeStyle = '#aaa';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const time = Date.now() / 1000;
        const radius = 10 + Math.sin(time * 2) * 2;
        this.ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.1;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;

        // Draw End (Bulb)
        const ex = this.offsetX + level.end.x * this.tileSize;
        const ey = this.offsetY + level.end.y * this.tileSize;
        
        if (this.bulbImage && this.bulbImage.complete) {
             this.ctx.drawImage(this.bulbImage, ex, ey, this.tileSize, this.tileSize);
             
             // Add glow behind bulb
             const glowIntensity = 0.5 + Math.random() * 0.5;
             this.ctx.globalCompositeOperation = 'screen';
             this.ctx.shadowBlur = 20;
             this.ctx.shadowColor = '#ffff00';
             this.ctx.fillStyle = `rgba(255, 255, 0, ${glowIntensity * 0.3})`;
             this.ctx.fillRect(ex + 10, ey + 10, 30, 30);
             this.ctx.shadowBlur = 0;
             this.ctx.globalCompositeOperation = 'source-over';
        } else {
            // Fallback
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(ex + 10, ey + 5, 30, 40);
        }

        // Draw Player
        const px = this.offsetX + this.player.x * this.tileSize;
        const py = this.offsetY + this.player.y * this.tileSize;
        
        // --- Added: Breathing & Tilt Animations ---
        const breathingTime = Date.now() / 200; // Speed of breathing
        const bobOffset = Math.sin(breathingTime); // Up/down movement
        
        let rotation = 0;
        if (this.player.direction === 'left') rotation = -0.15; // ~8.5 degrees
        if (this.player.direction === 'right') rotation = 0.15;
        // ------------------------------------------

        const dimIndex = this.dimension + 1;
        const heroSet = this.heroImages[dimIndex];

        if (heroSet) {
            // Draw Shadow (Static on ground)
            if (heroSet.shadow && heroSet.shadow.complete) {
                this.ctx.drawImage(heroSet.shadow, px, py, this.tileSize, this.tileSize);
            }
            
            // Draw Character (Animated)
            this.ctx.save();
            // Move center of drawing to player tile center + bobbing
            this.ctx.translate(px + this.tileSize / 2, py + this.tileSize / 2 + bobOffset);
            this.ctx.rotate(rotation);
            
            const dir = this.player.direction || 'front';
            const sprite = heroSet[dir];
            
            if (sprite && sprite.complete) {
                // Draw sprite centered at (0,0) because of translate
                this.ctx.drawImage(sprite, -this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);
            } else {
                this.ctx.fillStyle = theme.player;
                this.ctx.fillRect(-15, -15, 30, 30);
            }
            this.ctx.restore();
        } else {
             this.ctx.fillStyle = theme.player;
             this.ctx.fillRect(px + 15, py + 15, 20, 25);
        }

        // Draw Particles
        this.drawParticles();

        // Fog of War
        let fogColor = null;
        if (this.dimension === 0) fogColor = 'rgba(0,0,0,0.85)';
        if (this.dimension === 2) fogColor = 'rgba(20,0,0,0.6)';

        if (fogColor) {
            const centerX = px + this.tileSize / 2;
            const centerY = py + this.tileSize / 2;
            const gradient = this.ctx.createRadialGradient(centerX, centerY, 60, centerX, centerY, 400);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, fogColor);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Crush Effect
        if (this.state === 'gameover') {
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(px, py);
            this.ctx.lineTo(px + 50, py + 50);
            this.ctx.moveTo(px + 50, py);
            this.ctx.lineTo(px, py + 50);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    loop() {
        this.updateParticles();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}
