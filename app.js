class EventEmitter {
	constructor() {
		this.listeners = {};
	}

	on(message, listener) {
		if (!this.listeners[message]) {
			this.listeners[message] = [];
		}
		this.listeners[message].push(listener);
	}

	emit(message, payload = null) {
		if (this.listeners[message]) {
			this.listeners[message].forEach((l) => l(message, payload));
		}
	}
}

class Sprite {
	constructor(spriteSheet, x, y, w, h) {
		this.spriteSheet = spriteSheet;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	draw(ctx, x, y, w, h) {
		ctx.drawImage(this.spriteSheet, this.x, this.y, this.w, this.h, x, y, w, h);
	}
}

class GameObject { 
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.dead = false;
		this.type = "";
		this.width = 0;
		this.height = 0;
		this.sprite = undefined;
	}

	draw(ctx) {
		this.sprite.draw(ctx, this.x, this.y, this.width, this.height);
	}
	rectFromGameObject() {
		return {
			top: this.y,
			left: this.x,
			bottom: this.y + this.height,
			right: this.x + this.width,
		};
	}
}

class Hero extends GameObject {
	constructor(x, y) {
		super(x, y);
		(this.width = 99), (this.height = 75);
		this.type = 'Hero';
		this.speed = { x: 100, y: 100 };
		this.shotCooldown = 0;
		this.cooldownPerSecond = 100;
		this.life = 3;
		this.points = 0;
	}

	fire() {
		gameObjects.push(new Laser(this.x + 45, this.y - 10));
		this.shotCooldown = 50;
	}

	canFire() {
		return this.shotCooldown === 0;
	}

	decrementLife() {
		console.log('life lost');
		
		this.life--;
		if (this.life === 0) {
			this.dead = true;
		}
	}

	incrementPoints() {
		this.points += 100;
	}
}

class Enemy extends GameObject {
	constructor(x, y) {
		super(x, y);
		(this.width = 75), (this.height = 60);
		this.type = 'Enemy';
		this.speed = 25;
	}
}

class Laser extends GameObject {
	constructor(x, y) {
		super(x, y);
		(this.width = 9), (this.height = 33);
		this.type = 'Laser';
		this.sprite = laserImg;
		this.speed = 500;
	}
}

class KeyboardState {
	constructor() {
		this.arrowUp = false;
		this.arrowDown = false;
		this.arrowLeft = false;
		this.arrowRight = false;
		this.space = false;
	}
}

function loadTexture(path) {
	return new Promise((resolve) => {
		const img = new Image();
		img.src = path;
		img.onload = () => {
			resolve(img);
		};
	});
}

function intersectRect(r1, r2) {
	return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
}

const Messages = {
	KEY_DOWN_UP: 'KEY_DOWN_UP',
	KEY_DOWN_DOWN: 'KEY_DOWN_DOWN',
	KEY_DOWN_LEFT: 'KEY_DOWN_LEFT',
	KEY_DOWN_RIGHT: 'KEY_DOWN_RIGHT',
	KEY_DOWN_SPACE: 'KEY_DOWN_SPACE',
	KEY_UP_UP: 'KEY_UP_UP',
	KEY_UP_DOWN: 'KEY_UP_DOWN',
	KEY_UP_LEFT: 'KEY_UP_LEFT',
	KEY_UP_RIGHT: 'KEY_UP_RIGHT',
	KEY_UP_SPACE: 'KEY_UP_SPACE',
	KEY_UP_ENTER: 'KEY_UP_ENTER',
	COLLISION_ENEMY_LASER: 'COLLISION_ENEMY_LASER',
	COLLISION_ENEMY_HERO: 'COLLISION_ENEMY_HERO',
	GAME_END_WIN: 'GAME_END_WIN',
	GAME_END_LOSS: 'GAME_END_LOSS',
};

let heroImg, 
	enemyImg, 
	laserImg, 
	lifeImg,
	canvas, 
	ctx, 
	gameObjects = [], 
	hero, 
	eventEmitter = new EventEmitter(),
	gameLoopId,
	keyState,
	gameOver = false,
	secondsPassed = 0,
	oldTimeStamp = 0;

const spriteDefs = fetch('./assets/Spritesheet/sheet.json')
	.then(response => {
		return response.json();
	});

// EVENTS
let onKeyDown = function (e) {
	//console.log(e.keyCode);
	switch (e.keyCode) {
		case 37:
		case 39:
		case 38:
		case 40: // Arrow keys
		case 32:
			e.preventDefault();
			break; // Space
		default:
			break; // do not block other keys
	}
	if (e.key === 'ArrowUp') {
		eventEmitter.emit(Messages.KEY_DOWN_UP);
	} else if (e.key === 'ArrowDown') {
		eventEmitter.emit(Messages.KEY_DOWN_DOWN);
	} else if (e.key === 'ArrowLeft') {
		eventEmitter.emit(Messages.KEY_DOWN_LEFT);
	} else if (e.key === 'ArrowRight') {
		eventEmitter.emit(Messages.KEY_DOWN_RIGHT);
	} else if (e.code === 'Space') {
		eventEmitter.emit(Messages.KEY_DOWN_SPACE);
	}
}

window.addEventListener('keydown', onKeyDown);

window.addEventListener('keyup', (e) => {
	if (e.key === 'ArrowUp') {
		eventEmitter.emit(Messages.KEY_UP_UP);
	} else if (e.key === 'ArrowDown') {
		eventEmitter.emit(Messages.KEY_UP_DOWN);
	} else if (e.key === 'ArrowLeft') {
		eventEmitter.emit(Messages.KEY_UP_LEFT);
	} else if (e.key === 'ArrowRight') {
		eventEmitter.emit(Messages.KEY_UP_RIGHT);
	} else if (e.code === 'Space') {
		eventEmitter.emit(Messages.KEY_UP_SPACE);
	} else if (e.key === 'Enter') {
		eventEmitter.emit(Messages.KEY_UP_ENTER);
	}
});

function createEnemies() {
	const MONSTER_TOTAL = 5;
	const MONSTER_WIDTH = MONSTER_TOTAL * 98;
	const START_X = (canvas.width - MONSTER_WIDTH) / 2;
	const STOP_X = START_X + MONSTER_WIDTH;

	for (let x = START_X; x < STOP_X; x += 98) {
		for (let y = 0; y < 60 * 5; y += 60) {
			const enemy = new Enemy(x, y);
			enemy.sprite = enemyImg;
			gameObjects.push(enemy);
		}
	}
}

function createHero() {
	hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
	hero.sprite = heroImg;
	gameObjects.push(hero);
}

function updateGameObjects(secondsPassed) {
	const enemies = gameObjects.filter((go) => go.type === 'Enemy');
	const lasers = gameObjects.filter((go) => go.type === 'Laser');

	enemies.forEach((enemy) =>  {
		const heroRect = hero.rectFromGameObject();
		if (intersectRect(heroRect, enemy.rectFromGameObject())) {
			eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
		}
	});

	lasers.forEach((l) => {
		enemies.forEach((m) => {
			if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
				eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
					first: l,
					second: m,
				});
			}
		});
	});

	gameObjects = gameObjects.filter((go) => !go.dead);

	enemies.forEach((enemy) => {
		if (enemy.y < canvas.height - enemy.height) {
			enemy.y += (enemy.speed * secondsPassed);
		} else {
			console.log('Stopped at', enemy.y);
			endGame(false);
		}
	});

	lasers.forEach((laser) => {
		if (laser.y > 0) {
			laser.y -= (laser.speed * secondsPassed);
		} else {
			laser.dead = true;
		}
	});

	if (keyState.arrowUp) {
		hero.y -= (hero.speed.y * secondsPassed);
	}
	if (keyState.arrowDown) {
		hero.y += (hero.speed.y * secondsPassed);
	}
	if (keyState.arrowLeft) {
		hero.x -= (hero.speed.x * secondsPassed);
	}
	if (keyState.arrowRight) {
		hero.x += (hero.speed.x * secondsPassed);
	}
	if (keyState.space) {
		if(hero.canFire()) {
			hero.fire();
		}
	}
	if (hero.shotCooldown > 0) {
		hero.shotCooldown -= (hero.cooldownPerSecond * secondsPassed);
	}
	if (hero.shotCooldown < 0) {
		hero.shotCooldown = 0;
	}
}

function drawGameObjects(ctx) {
	gameObjects.forEach((go) => go.draw(ctx));
}

function initGame() {
	gameObjects = [];
	gameOver = false;
	createEnemies();
	createHero();
	keyState = new KeyboardState();

	eventEmitter.on(Messages.KEY_DOWN_UP, () => {
		keyState.arrowUp = true;
	});

	eventEmitter.on(Messages.KEY_UP_UP, () => {
		keyState.arrowUp = false;
	});

	eventEmitter.on(Messages.KEY_DOWN_DOWN, () => {
		keyState.arrowDown = true;
	});

	eventEmitter.on(Messages.KEY_UP_DOWN, () => {
		keyState.arrowDown = false;
	});

	eventEmitter.on(Messages.KEY_DOWN_LEFT, () => {
		keyState.arrowLeft = true;
	});

	eventEmitter.on(Messages.KEY_UP_LEFT, () => {
		keyState.arrowLeft = false;
	});

	eventEmitter.on(Messages.KEY_DOWN_RIGHT, () => {
		keyState.arrowRight = true;
	});

	eventEmitter.on(Messages.KEY_UP_RIGHT, () => {
		keyState.arrowRight = false;
	});

	eventEmitter.on(Messages.KEY_DOWN_SPACE, () => {
		keyState.space = true;
	});

	eventEmitter.on(Messages.KEY_UP_SPACE, () => {
		keyState.space = false;
	});

	eventEmitter.on(Messages.KEY_UP_ENTER, () => {
		if (gameOver) {
			resetGame();
		}
	})

	eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, {first, second }) => {
		first.dead = true;
		second.dead = true;
		hero.incrementPoints();

		if (isEnemiesDead()) {
			eventEmitter.emit(Messages.GAME_END_WIN);
		}
	});

	eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
		enemy.dead = true;
		hero.decrementLife();
		if (isHeroDead()) {
			eventEmitter.emit(Messages.GAME_END_LOSS);
			return;
		}
		if (isEnemiesDead()) {
			eventEmitter.emit(Messages.GAME_END_WIN);
		}
	});

	eventEmitter.on(Messages.GAME_END_WIN, () => {
		endGame(true);
	});

	eventEmitter.on(Messages.GAME_END_LOSS, () => {
		endGame(false);
	});
}

function drawLife() {
	const START_POS = canvas.width - 180;
	for (let i = 0; i < hero.life; i++) {
		ctx.drawImage(lifeImg, START_POS + 45 * (i + 1), canvas.height - 37);
	}
}

function drawPoints() {
	ctx.font = '30px Arial';
	ctx.fillStyle = 'red'
	ctx.textAlign = 'left';
	drawText('Points: ' + hero.points, 10, canvas.height - 20);
}

function drawText(message, x, y) {
	ctx.fillText(message, x, y);
}

function displayMessage(message, color='red') {
	ctx.font = '30px Arial';
	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function isHeroDead() {
	return hero.life <= 0;
}

function isEnemiesDead() {
	const enemies = gameObjects.filter((go) => go.type === 'Enemy' && !go.dead);
	return enemies.length === 0;
}

function endGame(win) {
	gameOver = true;

	setTimeout(() => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if (win) {
			displayMessage('Victory!!! Pew Pew... - Press [Enter] to start a new game.', 'green');
		} else {
			displayMessage('You died !!! Press [Enter] to start a new game.');
		}
	}, 200);
}

function resetGame() {
	gameObjects = [];
	gameOver = false;
	createEnemies();
	createHero();
}

window.onload = async () => {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	let spriteSheet = await loadTexture('./assets/Spritesheet/sheet.png')
	heroImg = new Sprite(spriteSheet, 224, 832, 99, 75);
	enemyImg = new Sprite(spriteSheet, 425, 552, 93, 84);
	laserImg = new Sprite(spriteSheet, 858, 230, 9, 54);
	lifeImg = await loadTexture('./assets/life.png');

	initGame();

	window.requestAnimationFrame(gameLoop);
};

function gameLoop(timeStamp) {
	secondsPassed = (timeStamp - oldTimeStamp) / 1000;
	oldTimeStamp = timeStamp;
	if (!gameOver) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		updateGameObjects(secondsPassed);
		drawPoints();
		drawLife();
		drawGameObjects(ctx);
	}
	window.requestAnimationFrame(gameLoop);
}
