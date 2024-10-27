window.addEventListener('DOMContentLoaded', (event) => {
    const levelButtons = document.querySelectorAll('.levelButton');
    const canvas = document.getElementById('gameCanvas');
    canvas.addEventListener('click', paddleJump); // 新增點擊事件監聽器

    const ctx = canvas.getContext('2d');
    const restartButton = document.getElementById('restartButton');
    const backgroundSelector = document.getElementById('backgroundSelector');
    const livesDisplay = document.getElementById('lives');
    const scoreDisplay = document.getElementById('score');
    const levelSelectDiv = document.getElementById('levelSelect');

    let ballRadius = 10;
    let x, y, dx, dy, paddleX, paddleY;
    let paddleHeight = 10;
    let paddleWidth = 75;
    let bricks = [];
    let score = 0;
    let lives = 3;
    let gameStarted = false;
    let gameEnded = false;
    let level = 0;

    let trail = [];
    const trailLength = 20;
    let explosionEffects = []; // 儲存爆炸效果

    let canJump = true; // 標記是否可以跳躍


    const levels = {
        0: { rows: 5, columns: 5, ballSpeed: 1, canvasWidth: 500, canvasHeight: 400, brickWidth: 75, brickHeight: 20, brickPadding: 10, brickOffsetTop: 30, brickOffsetLeft: 30 },
        1: { rows: 7, columns: 5, ballSpeed: 1.5, canvasWidth: 500, canvasHeight: 500, brickWidth: 80, brickHeight: 25, brickPadding: 10, brickOffsetTop: 40, brickOffsetLeft: 30 },
        2: { rows: 9, columns: 5, ballSpeed: 2, canvasWidth: 550, canvasHeight: 650, brickWidth: 90, brickHeight: 30, brickPadding: 10, brickOffsetTop: 50, brickOffsetLeft: 30 }
    };

    levelButtons.forEach(button => button.addEventListener('click', function(e) {
        const selectedLevel = parseInt(e.target.getAttribute('data-level'));
        changeLevel(selectedLevel);
    }));
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    restartButton.addEventListener('click', restartGame);
    backgroundSelector.addEventListener('change', function () {
        setBackground(this.value);
    });

    function changeLevel(newLevel) {
        if (gameStarted) {
            restartGame();
        }
        level = newLevel;
        startGame();
    }

    function restartGame() {
        gameStarted = false;
        gameEnded = false;
        score = 0;
        lives = 3;
        updateLivesDisplay();
        restartButton.style.display = 'none';
        resetBall();
        drawBricks();
    }

    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            initLevel();
            setBackground(backgroundSelector.value);
            drawBricks();
            drawPaddle();
            drawBallWithTrail();

            alert('點擊開始遊戲！');

            canvas.addEventListener('click', function beginGame() {
                requestAnimationFrame(draw);
                canvas.removeEventListener('click', beginGame);
            }, { once: true });
        }
    }

    function initLevel() {
        const currentLevel = levels[level];
    
        canvas.width = currentLevel.canvasWidth;
        canvas.height = currentLevel.canvasHeight;
        
        paddleX = (canvas.width - paddleWidth) / 2;
        paddleY = canvas.height - paddleHeight;
    
        x = paddleX + paddleWidth / 2;
        y = paddleY - ballRadius;
    
        dx = currentLevel.ballSpeed * 2;
        dy = -currentLevel.ballSpeed * 2;
    
        initBricks(currentLevel);
    }

function initBricks(currentLevel) {
    bricks = [];
    for (let c = 0; c < currentLevel.columns; c++) {
        bricks[c] = [];
        for (let r = 0; r < currentLevel.rows; r++) {
            let isSpecialBrick = (level === 1 && Math.random() < 0.5);
            let isSuperSpecialBrick = (level === 2 && Math.random() < 0.5);
            
            bricks[c][r] = { 
                status: isSuperSpecialBrick ? 3 : isSpecialBrick ? 2 : 1,
                hitCount: 0 // 新增擊打次數
            };
        }
    }
}


    function updateLivesDisplay() {
        livesDisplay.innerText = '剩餘生命: ' + lives;
        livesDisplay.style.color = lives > 1 ? 'green' : 'red';
    }

    if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy; 
        } else {
            lives--;
            updateLivesDisplay();
            if (!lives) endGame();
            else resetBall();
        }
    }

    function drawExplosions() {
        explosionEffects.forEach((explosion, index) => {
            ctx.fillStyle = explosion.color;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            ctx.fill();
            
            explosion.radius += explosion.speed;
            if (explosion.radius > 20) {
                explosionEffects.splice(index, 1);
            }
        });
    }

    function pauseGame() {
        isPaused = true;
        canvas.removeEventListener('mousemove', mouseMoveHandler); 
    
        const messageDiv = document.createElement('div');
        messageDiv.innerText = '按下滑鼠繼續遊戲！';
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '20px';
        messageDiv.style.borderRadius = '10px';
        document.body.appendChild(messageDiv);
    
        canvas.addEventListener('click', function continueGame() {
            document.body.removeChild(messageDiv);
            isPaused = false;
            canvas.addEventListener('mousemove', mouseMoveHandler);
            requestAnimationFrame(draw);
            canvas.removeEventListener('click', continueGame);
        }, { once: true });
    }

    function setBackground(value) {
        const backgrounds = { none: 'none', image1: "url('photo/japan.jpg')", image2: "url('photo/korean.jpg')", image3: "url('photo/taiwan.jpg')" };
        document.body.style.backgroundImage = backgrounds[value] || 'none';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    }

    function resetBall() {
        x = canvas.width / 2;
        y = paddleY - ballRadius;
        dx = levels[level].ballSpeed * 2;
        dy = -levels[level].ballSpeed * 2;
    }
    
    let isPaused = false;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBallWithTrail();
        drawPaddle();
        drawExplosions(); // 繪製爆炸效果
        collisionDetection();

        if (gameEnded || isPaused) {
            return; 
        }

        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
        if (y + dy < ballRadius) dy = -dy;
        else if (y + dy > canvas.height - ballRadius) {
            if (x > paddleX && x < paddleX + paddleWidth) {
                dy = -dy;
            } else {
                lives--;
                updateLivesDisplay();
                if (!lives) {
                    endGame();
                } else {
                    resetBall();
                    pauseGame();
                }
            }
        }
    
        x += dx;
        y += dy;
    
        requestAnimationFrame(draw);
    }

    function paddleJump() {
        if (canJump) {
            paddleY -= 30; // 擋板向上移動30像素
            canJump = false; // 禁用跳躍
            
            // 設置1秒冷卻時間後恢復原位置
            setTimeout(() => {
                paddleY += 30;
                canJump = true; // 恢復跳躍功能
            }, 1000);
        }
    }
    

    function mouseMoveHandler(e) {
        const relativeX = e.clientX - canvas.getBoundingClientRect().left;
        if (relativeX > paddleWidth / 2 && relativeX < canvas.width - paddleWidth / 2) {
            paddleX = relativeX - paddleWidth / 2;
        }
    }

    function endGame() {
        alert('遊戲結束！');
        gameEnded = true;
        restartButton.style.display = 'block';
        canvas.removeEventListener('mousemove', mouseMoveHandler);
    }
    
    function drawBricks() {
        const currentLevel = levels[level];
        bricks.forEach((column, c) => {
            column.forEach((brick, r) => {
                if (brick.status > 0) {
                    const brickX = c * (currentLevel.brickWidth + currentLevel.brickPadding) + currentLevel.brickOffsetLeft;
                    const brickY = r * (currentLevel.brickHeight + currentLevel.brickPadding) + currentLevel.brickOffsetTop;
                    ctx.fillStyle = brick.status === 3 ? '#f44336' : brick.status === 2 ? '#ff9800' : '#0095DD';
                    ctx.fillRect(brickX, brickY, currentLevel.brickWidth, currentLevel.brickHeight);
                }
            });
        });
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
        ctx.fillStyle = '#0095DD';
        ctx.fill();
        ctx.closePath();
    }

    function drawBallWithTrail() {
        ctx.fillStyle = '#0095DD';
    
        trail.push({ x, y });
        if (trail.length > trailLength) trail.shift();
    
        trail.forEach((point, i) => {
            ctx.globalAlpha = 1 - (i / trail.length) * 0.7;
            ctx.beginPath();
            ctx.arc(point.x, point.y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        });
    
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    function collisionDetection() {
        const currentLevel = levels[level];
        let allBricksHit = true;

        bricks.forEach((column, c) => {
            column.forEach((brick, r) => {
                if (brick.status > 0) {
                    allBricksHit = false;

                    const brickX = c * (currentLevel.brickWidth + currentLevel.brickPadding) + currentLevel.brickOffsetLeft;
                    const brickY = r * (currentLevel.brickHeight + currentLevel.brickPadding) + currentLevel.brickOffsetTop;

                    if (x > brickX && x < brickX + currentLevel.brickWidth && y > brickY && y < brickY + currentLevel.brickHeight) {
                        dy = -dy;
                        brick.status--;

                        // 新增爆炸效果
                        explosionEffects.push({
                            x: brickX + currentLevel.brickWidth / 2,
                            y: brickY + currentLevel.brickHeight / 2,
                            radius: 0,
                            speed: 2,
                            color: '#ffcc00'
                        });

                        score++;
                        scoreDisplay.innerText = '分數: ' + score;
                    }
                }
            });
        });

        if (allBricksHit) {
            alert('恭喜！所有磚塊已被擊中！');
            endGame();
        }
    }
});
