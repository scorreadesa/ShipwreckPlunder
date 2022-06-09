GameLogic = {};
GameLogic.Update = Update;
GameLogic.CurrentLines = [];
GameLogic.currentLineGrid = 10;
GameLogic.currentLineDuration = 5;
GameLogic.cumulativeSpawns = 0;

GameLogic.vortexes = 0;
GameLogic.vortexCap = 3;
GameLogic.vortexSpawnInterval = 25;
GameLogic.vortexSpawnTimer = 10;
GameLogic.vortexThreatScale = 0.5;
GameLogic.vortexMaxMagintude = 3;
GameLogic.treasureSpawnInterval = 10;
GameLogic.treasureSpawnTimer = 1;
GameLogic.plankSpawnInterval = 5;
GameLogic.plankSpawnTimer = 2;
GameLogic.barrelSpawnInterval = 20;
GameLogic.barrelSpawnTimer = 3;
GameLogic.shipParts = 0;
GameLogic.shipPartCap = 2;
GameLogic.shipPartSpawnInterval = 60;
GameLogic.shipPartSpawnTimer = 30;
GameLogic.birds = 0;
GameLogic.birdCap = 3;
GameLogic.birdSpawnInterval = 30;
GameLogic.birdSpawnTimer = 15;

GameLogic.timerVariance = 0.5;
GameLogic.threat = 1;
GameLogic.threatPerSecond = 1 / 60; // One threat per minute.
GameLogic.threatSpawnAcceleration = 0.1;
GameLogic.threatMaxAcceleration = 0.75;
GameLogic.uberVortexSpawnThreshold = 5;

function Update(delta) {
    CreateCurrentLines(delta);
    Logic(delta);
}

function Logic(delta) {
    GameLogic.threat += delta * GameLogic.threatPerSecond;
    if(GameLogic.vortexes < GameLogic.vortexCap) {
        GameLogic.vortexSpawnTimer -= delta;
        if(GameLogic.vortexSpawnTimer <= 0) {
            GameLogic.vortexSpawnTimer = SpawnTimerValue(GameLogic.vortexSpawnInterval);
            let vortex = new Vortex(Math.min(GameLogic.threat * GameLogic.vortexThreatScale, GameLogic.vortexMaxMagintude));
            vortex.onDestroy = function () {
                GameLogic.vortexes--;
            }
            GameLogic.vortexes++;
        }
    }
    if(GameLogic.birds < GameLogic.birdCap) {
        GameLogic.birdSpawnTimer -= delta;
        if(GameLogic.birdSpawnTimer <= 0) {
            GameLogic.birdSpawnTimer = SpawnTimerValue(GameLogic.birdSpawnInterval);
            let bird;
            let random = Math.random();
            if(random < 0.333) {
                bird = new Bird(0);
            } else if (random < 0.666) {
                bird = new BarrelBird();
            } else {
                bird = new CoconutBird();
            }
            bird.onDestroy = function () {
                GameLogic.birds--;
            }
            GameLogic.birds++;
        }
    }
    if(GameLogic.shipParts < GameLogic.shipPartCap) {
        GameLogic.shipPartSpawnTimer -= delta;
        if(GameLogic.shipPartSpawnTimer <= 0) {
            GameLogic.shipPartSpawnTimer = SpawnTimerValue(GameLogic.shipPartSpawnInterval);
            let part = new ShipPart(Math.random() * Game.width, Math.random() * Game.height, 1 + Math.round(Math.random() * 2));
            part.onDestroy = function () {
                GameLogic.shipParts--;
            }
            GameLogic.shipParts++;
        }
    }
    GameLogic.plankSpawnTimer -= delta;
    if(GameLogic.plankSpawnTimer <= 0) {
        GameLogic.plankSpawnTimer = SpawnTimerValue(GameLogic.plankSpawnInterval);
        new Plank(Math.random() * Game.width, Math.random() * Game.height);
    }
    GameLogic.barrelSpawnTimer -= delta;
    if(GameLogic.barrelSpawnTimer <= 0) {
        GameLogic.barrelSpawnTimer = SpawnTimerValue(GameLogic.barrelSpawnInterval);
        new Barrel(Math.random() * Game.width, Math.random() * Game.height, Math.random() > 0.75);
    }
    GameLogic.treasureSpawnTimer -= delta;
    if(GameLogic.treasureSpawnTimer <= 0) {
        GameLogic.treasureSpawnTimer = SpawnTimerValue(GameLogic.treasureSpawnInterval);
        new Treasure(Math.random() * Game.width, Math.random() * Game.height, 1 + Math.round(Math.random() * 2));
    }
}

function SpawnTimerValue(time) {
    return time + (Math.random() - 0.5) * time * GameLogic.timerVariance * 2 * Math.max(1 - (GameLogic.threat - 1) * GameLogic.threatSpawnAcceleration, GameLogic.threatMaxAcceleration);
}

function CreateCurrentLines(delta) {
    GameLogic.cumulativeSpawns += GameLogic.currentLineGrid * GameLogic.currentLineGrid / GameLogic.currentLineDuration * delta;
    for(let i = 0; i < Math.floor(GameLogic.cumulativeSpawns); i++) {
        new CurrentLine(Math.random() * Game.width, Math.random() * Game.height);
    }
    GameLogic.cumulativeSpawns -= Math.floor(GameLogic.cumulativeSpawns);
    GameLogic.CurrentLines.forEach((line) => {
        line.update(delta);
    });
}

class CurrentLine {
    constructor(x, y) {
        this.segments = [];
        for(let i = 0; i < 20; i++) {
            let l = new PIXI.Graphics();
            l.lineStyle({width: 2, color: 0x22aacc});
            l.zIndex = -2;
            l.moveTo(x, y);
            l.lineTo(x, y);
            this.segments.push(l);
            Game.PIXIApp.stage.addChild(l);
        }
        this.particle = new Particle(x, y, 0.2, false);
        this.tip = new Vector2(x, y);
        this.life = GameLogic.currentLineDuration;
        GameLogic.CurrentLines.push(this);
    }

    update(delta) {
        this.life -= delta;
        if(this.life <= 0) {
            this.destroy();
            return;
        }
        this.particle.addImpulse(new Vector2((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25));
        ParticleDynamics.UpdateParticle(this.particle, delta);
        let l = this.segments.pop();
        l.clear();
        l.lineStyle({width: 2, color: 0x22aacc});
        l.moveTo(this.tip.x, this.tip.y);
        l.lineTo(this.particle.pos.x, this.particle.pos.y);
        l.alpha = Math.sin(this.life / GameLogic.currentLineDuration * Math.PI);
        this.segments.unshift(l);
        this.tip.x = this.particle.pos.x;
        this.tip.y = this.particle.pos.y;
    }

    destroy() {
        this.segments.forEach((l) => {
            Game.PIXIApp.stage.removeChild(l);
        })
        GameLogic.CurrentLines = GameLogic.CurrentLines.filter((v) => {
            return v !== this
        });
    }
}