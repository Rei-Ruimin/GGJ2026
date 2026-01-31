import { LEVELS } from './levels.js';
import { STORY } from './story.js';
import { AudioManager } from './audio.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 50;
        
        this.audio = new AudioManager();

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

        this.colors = {
            0: { bg: '#2c2c2c', wall: '#505050', path: '#3a3a3a', player: '#fff', ambient: '#111' },
            1: { bg: '#e0f7fa', wall: '#81d4fa', path: '#b3e5fc', player: '#ffd700', ambient: '#002f6c' },
            2: { bg: '#210000', wall: '#b71c1c', path: '#4a0000', player: '#ff3d00', ambient: '#1a0000' }
        };

        this.heroImages = {};
        this.loadHeroImages();

        this.levelImages = {};
        this.loadLevelImages();

        this.bindInput();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    // ... (Existing initUI, loadHeroImages, loadLevelImages methods) ...

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

    updateAvatar() {
        const dimIndex = this.dimension + 1; // 1, 2, 3
        const avatarImg = document.getElementById('avatar-img');
        // Use the front-facing sprite as avatar
        // Fallback to empty if not loaded yet, though load happens early
        avatarImg.src = `assets/hero/filter${dimIndex}front.png`;
    }

    triggerShake() {
        const container = document.getElementById('game-container');
        container.classList.remove('shake');
        void container.offsetWidth; // Trigger reflow
        container.classList.add('shake');
    }

    showDialog(text) {
        this.state = 'dialog';
        const box = document.getElementById('dialog-box');
        const content = document.getElementById('dialog-text');
        box.style.display = 'block';
        content.innerText = ""; // Clear existing

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

    // ... (rest of methods)

    initUI() {
        // Start Screen
        const startScreen = document.querySelector('#start-screen');
        startScreen.querySelector('h1').innerHTML = `${STORY.title}<br><span style="font-size:18px; color:#888;">${STORY.subtitle}</span>`;
        startScreen.querySelector('p').innerHTML = STORY.startScreen.description;
        startScreen.querySelector('button').innerText = STORY.startScreen.button;

        // Game Over Screen
        const gameOverScreen = document.querySelector('#game-over-screen');
        gameOverScreen.querySelector('h1').innerText = STORY.gameOver.title;
        gameOverScreen.querySelector('#death-reason').innerText = STORY.gameOver.defaultReason;
        gameOverScreen.querySelector('button').innerText = STORY.gameOver.button;

        // Victory Screen
        const victoryScreen = document.querySelector('#victory-screen');
        victoryScreen.querySelector('h1').innerText = STORY.victory.title;
        victoryScreen.querySelector('div').innerHTML = STORY.victory.content;
        victoryScreen.querySelector('button').innerText = STORY.victory.button;
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
        const level = LEVELS[this.currentLevelIdx];
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
        this.updateHUD();
        
        if (idx === 0) {
            this.showDialog(STORY.dialogs.intro);
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
        const level = LEVELS[this.currentLevelIdx];

        if (newX < 0 || newX >= 10 || newY < 0 || newY >= 10) {
            this.audio.playBump();
            return;
        }
        if (level.maps[this.dimension][newY][newX] === 1) {
            this.audio.playBump();
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
        
        const level = LEVELS[this.currentLevelIdx];
        if (level.lockedDimensions[newDim]) return;

        // Spawn glitch particles before switch
        const px = this.offsetX + this.player.x * this.tileSize;
        const py = this.offsetY + this.player.y * this.tileSize;
        
        let glitchColor = '#fff';
        if (newDim === 0) glitchColor = '#aaaaaa'; // Human
        if (newDim === 1) glitchColor = '#00ffff'; // Heaven
        if (newDim === 2) glitchColor = '#ff4400'; // Hell
        
        this.spawnParticles(px, py, 20, glitchColor, 'glitch');

        // 安全检测：是否在出生点
        const isAtStart = this.player.x === level.start.x && this.player.y === level.start.y;

        // 碰撞逻辑：如果不在出生点，且目标维度当前位置是墙，则死亡
        if (!isAtStart && level.maps[newDim][this.player.y][this.player.x] === 1) {
            this.dimension = newDim; 
            this.triggerShake();
            this.die(STORY.dialogs.deathOverlap);
            return;
        }

        this.dimension = newDim;
        this.audio.fadeBGM(newDim);
        this.updateMaskUI();
        
        this.canvas.style.filter = 'contrast(1.5) brightness(1.2)';
        setTimeout(() => this.canvas.style.filter = 'none', 100);
    }

    updateMaskUI() {
        const level = LEVELS[this.currentLevelIdx];
        document.querySelectorAll('.mask-btn').forEach(btn => {
            btn.classList.remove('active', 'locked');
            const typeIdx = btn.dataset.type === 'human' ? 0 : btn.dataset.type === 'heaven' ? 1 : 2;
            if (level.lockedDimensions[typeIdx]) btn.classList.add('locked');
            if (typeIdx === this.dimension) btn.classList.add('active');
        });
    }

    checkTileEvents() {
        const level = LEVELS[this.currentLevelIdx];
        const tileType = level.maps[this.dimension][this.player.y][this.player.x];

        if (this.player.x === level.end.x && this.player.y === level.end.y) {
            if (this.currentLevelIdx < LEVELS.length - 1) {
                this.startLevel(this.currentLevelIdx + 1);
            } else {
                this.victory();
            }
            return;
        }

        const key = `${this.player.x},${this.player.y}`;
        if ((tileType === 2 || level.items[key]) && level.items[key] && !level.items[key].collected) {
            level.items[key].collected = true;
            this.showDialog(level.items[key].text);
        }
    }

    die(reason) {
        this.state = 'gameover';
        this.audio.playZap();
        setTimeout(() => this.audio.stopAll(), 100); // Slight delay to ensure zap starts

        document.getElementById('death-reason').innerText = reason;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    victory() {
        this.state = 'victory';
        this.audio.playZap();
        setTimeout(() => this.audio.stopAll(), 100);

        document.getElementById('victory-screen').classList.remove('hidden');
    }

    showDialog(text) {
        this.state = 'dialog';
        const box = document.getElementById('dialog-box');
        const content = document.getElementById('dialog-text');
        box.style.display = 'block';
        content.innerText = text;
    }

    advanceDialog() {
        document.getElementById('dialog-box').style.display = 'none';
        this.state = 'playing';
    }

    draw() {
        // Clear Full Canvas with Ambient Theme Color
        const theme = this.colors[this.dimension];
        this.ctx.fillStyle = theme.ambient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'start') return;

        const level = LEVELS[this.currentLevelIdx];
        const map = level.maps[this.dimension];
        
        // Get current dimension assets
        const levelAssets = this.levelImages[this.dimension];

        // --- Draw Grid Background (The Play Area) ---
        this.ctx.fillStyle = '#000'; // Border for grid
        this.ctx.fillRect(this.offsetX - 5, this.offsetY - 5, this.gridW + 10, this.gridH + 10);

        // --- Draw Map Tiles ---
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const tile = map[y][x];
                const posX = this.offsetX + x * this.tileSize;
                const posY = this.offsetY + y * this.tileSize;

                // Floor (Always draw floor background for tiles)
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

                // Grid Lines
                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                this.ctx.strokeRect(posX, posY, this.tileSize, this.tileSize);

                // Items
                const key = `${x},${y}`;
                if (level.items[key] && !level.items[key].collected && tile !== 1) {
                    const px = posX;
                    const py = posY;
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.moveTo(px + 25, py + 10);
                    this.ctx.lineTo(px + 15, py + 40);
                    this.ctx.lineTo(px + 35, py + 40);
                    this.ctx.fill();
                }
            }
        }

        // Draw Start (Atmospheric Icon: Faint Awakening Pulse)
        const sx = this.offsetX + level.start.x * this.tileSize + 25;
        const sy = this.offsetY + level.start.y * this.tileSize + 25;
        
        // Pulse effect
        this.ctx.strokeStyle = '#aaa';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const time = Date.now() / 1000;
        const radius = 10 + Math.sin(time * 2) * 2;
        this.ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner weak light
        this.ctx.fillStyle = '#fff';
        this.ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.1;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;

        // Draw End (Atmospheric Icon: The "Ultimate Light" / Bug Zapper)
        const ex = this.offsetX + level.end.x * this.tileSize;
        const ey = this.offsetY + level.end.y * this.tileSize;
        
        // Zapper Grid (Metal bars)
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(ex + 10, ey + 5, 30, 40);
        this.ctx.strokeStyle = '#333';
        this.ctx.beginPath();
        for(let i=0; i<=30; i+=6) {
             this.ctx.moveTo(ex + 10 + i, ey + 5);
             this.ctx.lineTo(ex + 10 + i, ey + 45);
        }
        this.ctx.stroke();

        // The "Deadly" Glow (Purple/Blue)
        const glowIntensity = 0.5 + Math.random() * 0.5; // Flickering
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#b388ff';
        this.ctx.fillStyle = `rgba(130, 224, 255, ${glowIntensity})`;
        this.ctx.fillRect(ex + 12, ey + 10, 26, 30);
        this.ctx.shadowBlur = 0;

        // Electric Arcs (Random zaps)
        if (Math.random() > 0.8) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(ex + 10 + Math.random()*30, ey + 5 + Math.random()*40);
            this.ctx.lineTo(ex + 10 + Math.random()*30, ey + 5 + Math.random()*40);
            this.ctx.stroke();
        }

        // Draw Player
        const px = this.offsetX + this.player.x * this.tileSize;
        const py = this.offsetY + this.player.y * this.tileSize;
        
        // Get correct image set based on dimension (1-based index for assets)
        const dimIndex = this.dimension + 1;
        const heroSet = this.heroImages[dimIndex];

        if (heroSet) {
            // Draw Shadow
            if (heroSet.shadow && heroSet.shadow.complete) {
                this.ctx.drawImage(heroSet.shadow, px, py, this.tileSize, this.tileSize);
            }
            
            // Draw Character
            const dir = this.player.direction || 'front';
            const sprite = heroSet[dir];
            
            if (sprite && sprite.complete) {
                this.ctx.drawImage(sprite, px, py, this.tileSize, this.tileSize);
            } else {
                this.ctx.fillStyle = theme.player;
                this.ctx.fillRect(px + 10, py + 10, 30, 30);
            }
        } else {
             this.ctx.fillStyle = theme.player;
             this.ctx.fillRect(px + 15, py + 15, 20, 25);
        }

        // Draw Particles
        this.drawParticles();

        // Lighting / Fog of War Overlay
        // Dim 0 (Human): Dark, seeking light
        // Dim 1 (Heaven): Bright, no fog
        // Dim 2 (Hell): Reddish gloom
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

        // --- Draw Side Decorations (Pixel Art Fillers) ---
        // Left Side
        this.drawSideArt(0, 0, this.offsetX, 600, this.dimension);
        // Right Side
        this.drawSideArt(this.offsetX + 500, 0, this.offsetX, 600, this.dimension);
    }

    drawSideArt(x, y, w, h, dim) {
        // Simple pattern based on dimension
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(x, y, w, h);
        
        // Draw some random "pixels" for texture
        const color = dim === 1 ? '#81d4fa' : dim === 2 ? '#b71c1c' : '#505050';
        this.ctx.fillStyle = color;
        
        // Use a seeded pseudo-random for stability (simplified here to static blocks)
        if (dim === 1) { // Heaven: Clouds
                this.ctx.globalAlpha = 0.1;
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + 100, 40, 0, Math.PI*2);
                this.ctx.arc(x + w/2 - 20, y + 120, 30, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + 400, 50, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
        } else if (dim === 2) { // Hell: Spikes
                this.ctx.globalAlpha = 0.2;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y + 600);
                this.ctx.lineTo(x + w/2, y + 400);
                this.ctx.lineTo(x + w, y + 600);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
        } else { // Human: Bars
                this.ctx.strokeStyle = '#333';
                this.ctx.beginPath();
                for(let i=0; i<600; i+=50) {
                    this.ctx.moveTo(x + 20, i);
                    this.ctx.lineTo(x + w - 20, i);
                }
                this.ctx.stroke();
        }
    }

    loop() {
        this.updateParticles();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}
