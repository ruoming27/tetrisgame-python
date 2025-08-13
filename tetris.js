
// Tetris Web Version
class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.COLS = 10;
        this.ROWS = 20;
        this.CELL_SIZE = 30;
        this.FPS = 60;

        this.colors = {
            0: '#000000',
            1: '#ff3377',  // T
            2: '#ffa500',  // L
            3: '#0099ff',  // J
            4: '#ffd700',  // O
            5: '#00cc66',  // S
            6: '#cc0000',  // Z
            7: '#9933ff'   // I
        };

        this.tetrominoes = {
            'T': [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            'L': [[0, 0, 2], [2, 2, 2], [0, 0, 0]],
            'J': [[3, 0, 0], [3, 3, 3], [0, 0, 0]],
            'O': [[4, 4], [4, 4]],
            'S': [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
            'Z': [[6, 6, 0], [0, 6, 6], [0, 0, 0]],
            'I': [[0, 0, 0, 0], [7, 7, 7, 7], [0, 0, 0, 0], [0, 0, 0, 0]]
        };

        this.kickTests = [0, 1, -1, 2, -2];

        this.init();
        this.bindEvents();
        this.gameLoop();
    }

    init() {
        this.grid = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
        this.bag = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.paused = false;
        this.gameOver = false;
        this.dropTimer = 0;
        this.dropInterval = 1000;

        this.currentType = this.getNextPiece();
        this.current = this.copyMatrix(this.tetrominoes[this.currentType]);
        this.x = Math.floor(this.COLS / 2) - Math.floor(this.current[0].length / 2);
        this.y = -2;

        this.nextType = this.getNextPiece();

        this.updateUI();
    }

    getNextPiece() {
        if (this.bag.length === 0) {
            this.bag = Object.keys(this.tetrominoes);
            this.shuffle(this.bag);
        }
        return this.bag.pop();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    copyMatrix(matrix) {
        return matrix.map(row => row.slice());
    }

    rotate(matrix, clockwise = true) {
        if (clockwise) {
            return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
        } else {
            return matrix[0].map((_, i) => matrix.map(row => row[row.length - 1 - i]));
        }
    }

    isValidPosition(piece, x, y) {
        for (let py = 0; py < piece.length; py++) {
            for (let px = 0; px < piece[py].length; px++) {
                if (piece[py][px]) {
                    const nx = x + px;
                    const ny = y + py;

                    if (nx < 0 || nx >= this.COLS || ny >= this.ROWS) {
                        return false;
                    }
                    if (ny >= 0 && this.grid[ny][nx]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece() {
        for (let py = 0; py < this.current.length; py++) {
            for (let px = 0; px < this.current[py].length; px++) {
                if (this.current[py][px]) {
                    const ny = this.y + py;
                    const nx = this.x + px;
                    if (ny >= 0 && ny < this.ROWS && nx >= 0 && nx < this.COLS) {
                        this.grid[ny][nx] = this.current[py][px];
                    }
                }
            }
        }

        this.clearLines();
        this.spawnNewPiece();
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                y++; // Check the same row again
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            const points = [0, 100, 300, 500, 800][Math.min(linesCleared, 4)];
            this.score += points * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.updateUI();
        }
    }

    spawnNewPiece() {
        this.currentType = this.nextType;
        this.current = this.copyMatrix(this.tetrominoes[this.currentType]);
        this.x = Math.floor(this.COLS / 2) - Math.floor(this.current[0].length / 2);
        this.y = -2;
        this.nextType = this.getNextPiece();

        if (!this.isValidPosition(this.current, this.x, this.y + 1)) {
            this.gameOver = true;
            document.getElementById('gameState').textContent = 'GAME OVER';
        }
    }

    getGhostY() {
        let ghostY = this.y;
        while (this.isValidPosition(this.current, this.x, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    move(dx) {
        if (this.isValidPosition(this.current, this.x + dx, this.y)) {
            this.x += dx;
        }
    }

    softDrop() {
        if (this.isValidPosition(this.current, this.x, this.y + 1)) {
            this.y++;
            this.score++;
            this.updateUI();
        } else {
            this.lockPiece();
        }
    }

    hardDrop() {
        this.y = this.getGhostY();
        this.lockPiece();
    }

    rotateCW() {
        this.tryRotate(true);
    }

    rotateCCW() {
        this.tryRotate(false);
    }

    tryRotate(clockwise) {
        const rotated = this.rotate(this.current, clockwise);
        for (const kick of this.kickTests) {
            if (this.isValidPosition(rotated, this.x + kick, this.y)) {
                this.current = rotated;
                this.x += kick;
                return;
            }
        }
    }

    update(deltaTime) {
        if (this.paused || this.gameOver) return;

        this.dropTimer += deltaTime;
        const interval = Math.max(100, this.dropInterval - (this.level - 1) * 80);

        if (this.dropTimer >= interval) {
            this.dropTimer = 0;
            if (this.isValidPosition(this.current, this.x, this.y + 1)) {
                this.y++;
            } else {
                this.lockPiece();
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ghost piece
        const ghostY = this.getGhostY();
        this.ctx.globalAlpha = 0.3;
        this.drawPiece(this.current, this.x, ghostY);
        this.ctx.globalAlpha = 1.0;

        // Draw locked grid
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                if (this.grid[y][x]) {
                    this.drawCell(x, y, this.colors[this.grid[y][x]]);
                }
            }
        }

        // Draw current piece
        this.drawPiece(this.current, this.x, this.y);

        // Draw grid lines
        this.ctx.strokeStyle = '#1e1e1e';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.CELL_SIZE, 0);
            this.ctx.lineTo(x * this.CELL_SIZE, this.ROWS * this.CELL_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.CELL_SIZE);
            this.ctx.lineTo(this.COLS * this.CELL_SIZE, y * this.CELL_SIZE);
            this.ctx.stroke();
        }

        // Draw next piece
        this.nextCtx.fillStyle = '#14141c';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        const nextMatrix = this.tetrominoes[this.nextType];
        const offsetX = (this.nextCanvas.width - nextMatrix[0].length * this.CELL_SIZE) / 2;
        const offsetY = (this.nextCanvas.height - nextMatrix.length * this.CELL_SIZE) / 2;

        for (let py = 0; py < nextMatrix.length; py++) {
            for (let px = 0; px < nextMatrix[py].length; px++) {
                if (nextMatrix[py][px]) {
                    const x = offsetX + px * this.CELL_SIZE;
                    const y = offsetY + py * this.CELL_SIZE;
                    this.nextCtx.fillStyle = this.colors[nextMatrix[py][px]];
                    this.nextCtx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                    this.nextCtx.strokeStyle = '#333';
                    this.nextCtx.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                }
            }
        }
    }

    drawPiece(piece, x, y) {
        for (let py = 0; py < piece.length; py++) {
            for (let px = 0; px < piece[py].length; px++) {
                if (piece[py][px]) {
                    this.drawCell(x + px, y + py, this.colors[piece[py][px]]);
                }
            }
        }
    }

    drawCell(x, y, color) {
        const pixelX = x * this.CELL_SIZE;
        const pixelY = y * this.CELL_SIZE;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX, pixelY, this.CELL_SIZE, this.CELL_SIZE);
        this.ctx.strokeStyle = '#1e1e1e';
        this.ctx.strokeRect(pixelX, pixelY, this.CELL_SIZE, this.CELL_SIZE);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;

        if (this.paused) {
            document.getElementById('gameState').textContent = 'PAUSED';
        } else if (this.gameOver) {
            document.getElementById('gameState').textContent = 'GAME OVER';
        } else {
            document.getElementById('gameState').textContent = '';
        }
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
                this.gameOver = true;
                this.updateUI();
            } else if (e.key === 'p' || e.key === 'P') {
                this.paused = !this.paused;
                this.updateUI();
            } else if (e.key === 'r' || e.key === 'R') {
                this.init();
            } else if (!this.paused && !this.gameOver) {
                switch (e.key) {
                    case 'ArrowLeft':
                        this.move(-1);
                        break;
                    case 'ArrowRight':
                        this.move(1);
                        break;
                    case 'ArrowDown':
                        this.softDrop();
                        break;
                    case 'ArrowUp':
                    case 'x':
                    case 'X':
                        this.rotateCW();
                        break;
                    case 'z':
                    case 'Z':
                        this.rotateCCW();
                        break;
                    case ' ':
                        this.hardDrop();
                        break;
                }
            }
        });
    }

    gameLoop() {
        let lastTime = 0;
        const loop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            this.update(deltaTime);
            this.draw();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// Start the game
window.addEventListener('load', () => {
    new Tetris();
});
