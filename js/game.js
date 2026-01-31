import { LEVELS } from './levels.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 50;
        
        // Landscape settings
        this.gridW = 500;
        this.gridH = 500;
        this.offsetX = (800 - 500) / 2; // Center horizontally
        this.offsetY = (600 - 500) / 2 + 10; // Center vertically with slight offset
        
        this.currentLevelIdx = 0;
        this.player = { x: 0, y: 0 };
        this.dimension = 0; 
        this.state = 'start'; 
        
        this.colors = {
            0: { bg: '#2c2c2c', wall: '#505050', path: '#3a3a3a', player: '#fff', ambient: '#111' },
            1: { bg: '#e0f7fa', wall: '#81d4fa', path: '#b3e5fc', player: '#ffd700', ambient: '#002f6c' },
            2: { bg: '#210000', wall: '#b71c1c', path: '#4a0000', player: '#ff3d00', ambient: '#1a0000' }
        };

        this.bindInput();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
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
        this.player = { ...level.start };
        this.dimension = 0;
        this.state = 'playing';
        
        for(let key in level.items) level.items[key].collected = false;

        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
        document.getElementById('level-display').innerText = level.name.toUpperCase();
        this.updateMaskUI();
        
        if (idx === 0) {
            this.showDialog("主角：头好痛……这是哪？");
        }
    }

    restartLevel() {
        this.startLevel(this.currentLevelIdx);
    }

    move(dx, dy) {
        if (this.state !== 'playing') return;

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        const level = LEVELS[this.currentLevelIdx];

        if (newX < 0 || newX >= 10 || newY < 0 || newY >= 10) return;
        if (level.maps[this.dimension][newY][newX] === 1) return;

        this.player.x = newX;
        this.player.y = newY;
        this.checkTileEvents();
    }

    switchDimension(newDim) {
        if (this.state !== 'playing') return;
        if (this.dimension === newDim) return;
        
        const level = LEVELS[this.currentLevelIdx];
        if (level.lockedDimensions[newDim]) return;

        // 安全检测：是否在出生点
        const isAtStart = this.player.x === level.start.x && this.player.y === level.start.y;

        // 碰撞逻辑：如果不在出生点，且目标维度当前位置是墙，则死亡
        if (!isAtStart && level.maps[newDim][this.player.y][this.player.x] === 1) {
            this.dimension = newDim; 
            this.die("空间重叠：你的身体卡在了墙里。");
            return;
        }

        this.dimension = newDim;
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
        document.getElementById('death-reason').innerText = reason;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    victory() {
        this.state = 'victory';
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

        // --- Draw Grid Background (The Play Area) ---
        this.ctx.fillStyle = '#000'; // Border for grid
        this.ctx.fillRect(this.offsetX - 5, this.offsetY - 5, this.gridW + 10, this.gridH + 10);

        // --- Draw Map Tiles ---
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const tile = map[y][x];
                const posX = this.offsetX + x * this.tileSize;
                const posY = this.offsetY + y * this.tileSize;

                // Floor
                this.ctx.fillStyle = theme.path;
                this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);

                // Walls
                if (tile === 1) {
                    this.ctx.fillStyle = theme.wall;
                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    
                    // 3D effect bevel
                    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    this.ctx.fillRect(posX, posY + 40, 50, 10);
                    this.ctx.fillRect(posX + 40, posY, 10, 50);

                    // Decor
                    if(this.dimension === 1) { // Heaven
                        this.ctx.fillStyle = '#fff';
                        this.ctx.beginPath();
                        this.ctx.arc(posX+25, posY+25, 10, 0, Math.PI*2);
                        this.ctx.fill();
                    } else if (this.dimension === 2) { // Hell
                        this.ctx.fillStyle = '#ff9100';
                        this.ctx.fillRect(posX+10, posY+10, 10, 20);
                        this.ctx.fillRect(posX+30, posY+20, 10, 20);
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

        // Draw Start (Atmospheric Icon: Green Vortex)
        const sx = this.offsetX + level.start.x * this.tileSize + 25;
        const sy = this.offsetY + level.start.y * this.tileSize + 25;
        
        // Spiral effect
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < 3; i++) {
                let r = 5 + i * 6;
                this.ctx.arc(sx, sy, r, (Date.now() / 200) + (i * 1.5), (Date.now() / 200) + (i * 1.5) + 4);
        }
        this.ctx.stroke();

        // Draw End (Atmospheric Icon: Glowing White Door)
        const ex = this.offsetX + level.end.x * this.tileSize + 5;
        const ey = this.offsetY + level.end.y * this.tileSize + 5;
        
        // Door Frame
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(ex + 5, ey + 5, 30, 40);
        
        // Inner Light
        this.ctx.fillStyle = '#fff';
        this.ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 200) * 0.2; // Pulsing light
        this.ctx.fillRect(ex + 10, ey + 10, 20, 35);
        this.ctx.globalAlpha = 1.0;

        // Draw Player
        const px = this.offsetX + this.player.x * this.tileSize;
        const py = this.offsetY + this.player.y * this.tileSize;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.beginPath();
        this.ctx.ellipse(px + 25, py + 42, 12, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = theme.player;
        this.ctx.fillRect(px + 15, py + 15, 20, 25);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(px + 18, py + 20, 5, 5);
        this.ctx.fillRect(px + 27, py + 20, 5, 5);

        if (this.dimension === 1) { // Halo
            this.ctx.strokeStyle = '#ffeb3b';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.ellipse(px + 25, py + 10, 10, 3, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (this.dimension === 2) { // Horns
            this.ctx.fillStyle = '#b71c1c';
            this.ctx.beginPath();
            this.ctx.moveTo(px+15, py+15);
            this.ctx.lineTo(px+10, py+5);
            this.ctx.lineTo(px+20, py+15);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(px+35, py+15);
            this.ctx.lineTo(px+40, py+5);
            this.ctx.lineTo(px+30, py+15);
            this.ctx.fill();
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
        // Note: In a real game, this would be a static image or pattern
        // We use procedural dots here to avoid lag
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
        this.draw();
        requestAnimationFrame(this.loop);
    }
}
