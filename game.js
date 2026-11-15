const TILE = 48;
const COLS = 13;
const ROWS = 11;
const PLAYER_HALF = 19;
const PLAYER_SPEED = 160;
const BUBBLE_TIME = 2;
const FLAME_TIME = 0.5;
const EXPLOSION_RANGE = 1;
const MAX_BUBBLES = 1;
const EPS = 0.001;

const MAP = [
  '#############',
  '#...........#',
  '#.#.#.#.#.#.#',
  '#...........#',
  '#.#.#.#.#.#.#',
  '#...........#',
  '#.#.#.#.#.#.#',
  '#...........#',
  '#.#.#.#.#.#.#',
  '#...........#',
  '#############',
];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;

const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
let player, bubbles, flames, state, elapsed;

function reset() {
  player = { x: TILE * 1.5, y: TILE * 1.5 };
  bubbles = [];
  flames = [];
  elapsed = 0;
  state = 'playing';
}

function isWall(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return MAP[ty][tx] === '#';
}

function playerTiles(x, y) {
  const x0 = Math.floor((x - PLAYER_HALF) / TILE);
  const x1 = Math.floor((x + PLAYER_HALF - EPS) / TILE);
  const y0 = Math.floor((y - PLAYER_HALF) / TILE);
  const y1 = Math.floor((y + PLAYER_HALF - EPS) / TILE);
  const tiles = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      tiles.push([tx, ty]);
    }
  }
  return tiles;
}

function blockedAt(x, y) {
  return playerTiles(x, y).some(([tx, ty]) => isWall(tx, ty));
}

function movePlayer(axis, delta) {
  const next = player[axis] + delta;
  const blocked = axis === 'x' ? blockedAt(next, player.y) : blockedAt(player.x, next);
  if (!blocked) {
    player[axis] = next;
    return;
  }
  if (delta > 0) {
    player[axis] = Math.floor((next + PLAYER_HALF - EPS) / TILE) * TILE - PLAYER_HALF;
  } else {
    player[axis] = (Math.floor((next - PLAYER_HALF) / TILE) + 1) * TILE + PLAYER_HALF;
  }
}

function placeBubble() {
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  if (bubbles.length >= MAX_BUBBLES) return;
  if (bubbles.some(b => b.tx === tx && b.ty === ty)) return;
  bubbles.push({ tx, ty, t: BUBBLE_TIME });
}

function addFlame(tx, ty) {
  flames.push({ tx, ty, t: FLAME_TIME });
}

function explode(bubble) {
  bubbles = bubbles.filter(b => b !== bubble);
  addFlame(bubble.tx, bubble.ty);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let i = 1; i <= EXPLOSION_RANGE; i++) {
      const tx = bubble.tx + dx * i;
      const ty = bubble.ty + dy * i;
      if (isWall(tx, ty)) break;
      addFlame(tx, ty);
    }
  }
}

function hasFlame(tx, ty) {
  return flames.some(f => f.tx === tx && f.ty === ty);
}

function update(dt) {
  const dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
  const dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
  if (dx !== 0) movePlayer('x', dx * PLAYER_SPEED * dt);
  if (dy !== 0) movePlayer('y', dy * PLAYER_SPEED * dt);
  elapsed += dt;

  for (const f of flames) f.t -= dt;
  flames = flames.filter(f => f.t > 0);

  for (const b of bubbles) b.t -= dt;
  for (const b of bubbles.filter(b => b.t <= 0)) explode(b);

  if (playerTiles(player.x, player.y).some(([tx, ty]) => hasFlame(tx, ty))) {
    state = 'over';
  }
}

function drawTiles() {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      ctx.fillStyle = isWall(tx, ty) ? '#6d4c41' : '#e8dcb5';
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
}

function drawBubbles() {
  const pulse = 1 + 0.05 * Math.sin(elapsed * 10);
  ctx.fillStyle = 'rgba(79, 195, 247, 0.9)';
  for (const b of bubbles) {
    ctx.beginPath();
    ctx.arc(b.tx * TILE + TILE / 2, b.ty * TILE + TILE / 2, TILE * 0.4 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlames() {
  ctx.fillStyle = '#ff7043';
  for (const f of flames) {
    ctx.fillRect(f.tx * TILE + 4, f.ty * TILE + 4, TILE - 8, TILE - 8);
  }
}

function drawPlayer() {
  ctx.fillStyle = '#fff176';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_HALF, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(player.x - 6, player.y - 4, 3, 0, Math.PI * 2);
  ctx.arc(player.x + 6, player.y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px "Malgun Gothic", sans-serif';
  ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '22px "Malgun Gothic", sans-serif';
  ctx.fillText('Enter 또는 R: 재시작', canvas.width / 2, canvas.height / 2 + 30);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTiles();
  drawBubbles();
  drawFlames();
  drawPlayer();
  if (state === 'over') drawGameOver();
}

addEventListener('keydown', e => {
  if (e.code in keys || e.code === 'Space') e.preventDefault();
  if (e.code in keys) keys[e.code] = true;
  if (state === 'playing' && e.code === 'Space' && !e.repeat) placeBubble();
  if (state === 'over' && (e.code === 'Enter' || e.code === 'KeyR')) reset();
});

addEventListener('keyup', e => {
  if (e.code in keys) keys[e.code] = false;
});

addEventListener('blur', () => {
  for (const k of Object.keys(keys)) keys[k] = false;
});

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(frame);
}

reset();
requestAnimationFrame(frame);
