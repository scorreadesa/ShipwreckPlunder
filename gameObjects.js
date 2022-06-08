class GameObject {
    constructor(x, y, sprite, collisionRadius) {
        this.sprite = sprite;
        this.sprite.x = x;
        this.sprite.y = y;
        this.collisionRadius = collisionRadius;
        //Debug.DrawDot(x, y, collisionRadius, 1000);
        Game.PIXIApp.stage.addChild(this.sprite);
        Game.Objects.push(this);
    }

    fadeIn(duration, startScale, endScale) {
        this.fadingOut = false;
        this.fadeTimer = duration;
        this.sprite.scale.set(startScale);
        this.fadeDuration = duration;
        this.startScale = startScale;
        this.endScale = endScale;
        this.sprite.alpha = 0;
        this.sprite.scale.set(startScale);
    }

    fadeOut(duration, startScale, endScale, callback) {
        this.fadingOut = true;
        this.fadeTimer = duration;
        this.sprite.scale.set(startScale);
        this.fadeDuration = duration;
        this.startScale = startScale;
        this.endScale = endScale;
        this.fadeCallback = callback;
    }

    update(delta) {
        if (this.fadeTimer > 0) {
            this.fadeTimer -= delta;
            if (this.fadeTimer <= 0) {
                if (this.fadingOut) {
                    this.fadeCallback();
                    return;
                }
                this.sprite.alpha = 1;
                this.sprite.scale.set(this.endScale);
                return;
            }
            let fade = this.fadeTimer / this.fadeDuration;
            this.sprite.alpha = this.fadingOut ? fade : 1 - fade;
            this.sprite.scale.set(fade * this.startScale + (1 - fade) * this.endScale);
        }
    }

    destroy() {
        Game.PIXIApp.stage.removeChild(this.sprite);
        Game.Objects = Game.Objects.filter((v) => {
            return v !== this
        });
    }
}

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.player.texture), 50);
        this.particle = new Particle(x, y, 1, true);
        this.moveForce = new PlayerMovementForce();
        this.particle.selfForces.push(this.moveForce);
        this.particle.isPlayer = true;
        this.sprite.scale.set(0.5);
        this.sprite.anchor.set(0.408, 0.5);
        this.sprite.zIndex = 999;

        this.cannonCooldownTime = Game.upgrades.cannonCooldown.default;
        this.cannonCooldown = 0;
        this.maxHP = Game.upgrades.health.default;
        this.currentHP = this.maxHP;
        this.pickupRange = 50;
        this.movementSpeed = Game.upgrades.speed.default;
        this.explosionDamageTaken = Game.upgrades.explosionResist.default;
    }

    update(delta) {
        ParticleDynamics.UpdateParticle(this.particle, delta)
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
        let look = Game.MousePosition.subtractPure(this.particle.pos);
        this.sprite.angle = look.getRotationAngle();

        if (this.cannonCooldown > 0) {
            this.cannonCooldown -= delta;
        }
    }

    shoot() {
        if (this.cannonCooldown > 0) {
            return;
        }

        this.cannonCooldown = this.cannonCooldownTime;
        let direction = new Vector2(1, 0);
        direction.rotate(this.sprite.angle);
        let scaling = 100 * this.sprite.scale.x;
        new Cannonball(this.sprite.x + direction.x * scaling, this.sprite.y + direction.y * scaling, direction, 25);
        for (let i = 0; i < 20; i++) {
            let smokeDir = direction.clone();
            smokeDir.rotate((Math.random() - 0.5) * 60)
            new Smoke(this.sprite.x + direction.x * scaling * 1.6, this.sprite.y + direction.y * scaling * 1.6, smokeDir, Math.random() * 2, 0.4, 0.3 + Math.random() * 0.5);
        }
    }

    damage(amount, explosive = false) {
        if (explosive) {
            amount *= this.explosionDamageTaken;
        }
        this.currentHP -= amount;
        if (this.currentHP <= 0) {
            Game.GameOver();
        }
    }

    heal(healing) {
        this.currentHP = Math.min(this.currentHP + healing, this.maxHP);
        return Math.max(0, healing - (this.maxHP - this.currentHP)); // Return excess healing
    }

    fortify(amount) {
        this.maxHP += amount;
    }

    destroy() {
        super.destroy();
        this.particle.clearTracking();
    }
}

class Cannonball extends GameObject {
    constructor(x, y, direction, speed) {
        super(x, y, new PIXI.Sprite(Game.Resources.cannonball.texture), 7);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.5);
        this.direction = direction;
        this.speed = speed;
        this.lifetime = 1;
    }

    update(delta) {
        this.sprite.x += this.direction.x * this.speed;
        this.sprite.y += this.direction.y * this.speed;
        this.lifetime -= delta;
        if (this.lifetime < 0) {
            this.destroy();
        }
        let objects = Game.GetCollidingObjects(this);
        let consumed = false;
        objects.forEach((object) => {
            if (!("cannonHit" in object)) {
                return;
            }
            consumed = true;
            object.cannonHit(new Vector2(this.sprite.x, this.sprite.y));
        })
        if (consumed) {
            this.destroy();
        }
    }
}

class Plank extends GameObject {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.plank.texture), 25);
        this.particle = new Particle(x, y, 1, true);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.5);
        this.sprite.angle = Math.random() * 360;
        this.sprite.interactive = true;
        this.health = 10;
        this.dead = false;
        this.sprite.on('pointerdown', () => { // Pickup Handler
            if (this.dead) {
                return;
            }
            let distance = Distance(this.sprite.x, this.sprite.y, Game.player.sprite.x, Game.player.sprite.y);
            if (distance <= Game.player.pickupRange + this.collisionRadius + Game.player.collisionRadius) {
                let excess = Game.player.heal(Game.config.healingPerPlank);
                Game.score += excess * Game.config.excessHealingScoreMultiplier;
                this.destroy();
            }
        });
        this.fadeIn(1, 0.4, 0.5);
    }

    update(delta) {
        super.update(delta);
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    destroy() {
        if (this.dead) {
            return;
        }
        this.dead = true;
        this.fadeOut(1, 0.5, 0.4, this.#destroyActual);
    }

    #destroyActual() {
        super.destroy();
        this.particle.clearTracking();
    }

    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }
}

class Treasure extends GameObject {
    constructor(x, y, tier) {
        let s;
        if (tier === 1) {
            s = new PIXI.Sprite(Game.Resources.treasure_low.texture);
        } else if (tier === 2) {
            s = new PIXI.Sprite(Game.Resources.treasure_mid.texture);
        } else if (tier === 3) {
            s = new PIXI.Sprite(Game.Resources.treasure_high.texture);
        } else {
            console.log("Unknown treasure tier." + tier)
        }
        let scale = 0.4;
        super(x, y, s, 90 * scale);
        this.particle = new Particle(x, y, tier * 2, true);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(scale);
        this.sprite.angle = Math.random() * 360;
        this.sprite.interactive = true;
        this.health = 20 * tier;
        this.sprite.on('pointerdown', () => { // Pickup Handler
            if (this.dead) {
                return;
            }
            let distance = Distance(this.sprite.x, this.sprite.y, Game.player.sprite.x, Game.player.sprite.y);
            if (distance <= Game.player.pickupRange + this.collisionRadius + Game.player.collisionRadius) {
                Game.plunder += Game.config.plunderValues[tier - 1];
                this.destroy();
            }
        });
        this.fadeIn(1, scale * 0.8, scale);
    }

    update(delta) {
        super.update(delta);
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    destroy() {
        if (this.dead) {
            return;
        }
        this.dead = true;
        this.fadeOut(1, this.sprite.scale.x, this.sprite.scale.x * 0.8, this.#destroyActual);
    }

    #destroyActual() {
        super.destroy();
        this.particle.clearTracking();
    }

    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }
}

class Barrel extends GameObject {
    constructor(x, y, explosive, fade = true) {
        let scale = 0.5;
        super(x, y, new PIXI.Sprite(explosive ? Game.Resources.barrel_gunpowder.texture : Game.Resources.barrel.texture), 82 * scale);
        this.explosive = explosive;
        this.particle = new Particle(x, y, explosive ? 3 : 1, true);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(scale);
        this.sprite.angle = Math.random() * 360;
        this.sprite.interactive = true;
        this.health = 50;
        if (fade) {
            this.fadeIn(1, scale * 0.8, scale);
        }
    }

    update(delta) {
        super.update(delta);
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    destroy() {
        if (this.dead) {
            return;
        }
        this.dead = true;
        this.fadeOut(1, this.sprite.scale.x, this.sprite.scale.x * 0.8, this.#destroyActual);
    }

    #destroyActual() {
        super.destroy();
        this.particle.clearTracking();
    }

    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }

    cannonHit(point) {
        this.#destroyActual();
        if (this.explosive) {
            console.log("Boom")
            new Explosion(this.sprite.x, this.sprite.y);
            for (let i = 0; i < 30; i++) {
                let dir = new Vector2(0, 1);
                dir.rotate(Math.random() * 360);
                new Smoke(this.sprite.x, this.sprite.y, dir, (0.5 + Math.random() * 0.5) * 5, 1, 0.3 + Math.random());
            }
            this.collisionRadius *= 3;
            let objects = Game.GetCollidingObjects(this);
            objects.forEach((object) => {
                if (!("cannonHit" in object)) {
                    if (object.hasOwnProperty("particle")) {
                        let dir = object.particle.pos.subtractPure(this.particle.pos);
                        dir.normalize();
                        dir.scalarMultiply(Game.config.barrelExplosionPushback);
                        object.particle.addImpulse(dir);
                    }
                    if ("damage" in object) {
                        object.damage(Game.config.barrelExplosionDamage, true);
                    }
                    return;
                }
                object.cannonHit(new Vector2(object.sprite.x, object.sprite.y), Game.config.barrelExplosionPower);
            })
        } else {
            // Only fracture regular barrel, explosion VFX hides fracture.
            VoronoiFracture.FractureSprite(this.sprite, this.explosive ? "barrel_gunpowder" : "barrel", point, 10, 1.5);
            for (let i = 0; i < Game.config.barrelPlanks; i++) {
                let plank = new Plank(this.sprite.x + this.collisionRadius * Math.random() - this.collisionRadius / 2,
                    this.sprite.y + this.collisionRadius * Math.random() - this.collisionRadius / 2);
                let dir = plank.particle.pos.subtractPure(this.particle.pos);
                dir.normalize();
                dir.scalarMultiply(10);
                plank.particle.addImpulse(dir);
            }
        }
    }
}

class ShipPart extends GameObject {
    constructor(x, y, type) {
        let scale = 0.7;
        let s;
        let partType;
        if (type === 1) {
            s = new PIXI.Sprite(Game.Resources.ship1.texture);
            partType = "ship1";
        } else if (type === 2) {
            s = new PIXI.Sprite(Game.Resources.ship2.texture);
            partType = "ship2"
        } else if (type === 3) {
            s = new PIXI.Sprite(Game.Resources.ship3.texture);
            partType = "ship3";
        } else {
            console.log("Unknown ship type." + type);
        }
        super(x, y, s, 195 * scale);
        this.partType = partType;
        this.particle = new Particle(x, y, 50, true);
        this.sprite.scale.set(scale);
        this.sprite.angle = Math.random() * 360;
        this.sprite.anchor.set(0.5);
        this.durability = Game.config.shipPartDurability;
        this.fadeIn(1, scale * 0.8, scale);
    }

    update(delta) {
        super.update(delta);
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    damage(amount) {
        // Empty method, diminishes vortexes but can't be destroyed by them
    }

    destroy() {
        super.destroy();
        this.particle.clearTracking();
    }

    cannonHit(point) {
        this.durability--;
        if (this.durability <= 0) {
            VoronoiFracture.FractureSprite(this.sprite, this.partType, point, 25, 3);
            for (let i = 0; i < Game.config.shipPartPlanks; i++) {
                let plank = new Plank(this.sprite.x + this.collisionRadius * Math.random() - this.collisionRadius / 2,
                    this.sprite.y + this.collisionRadius * Math.random() - this.collisionRadius / 2);
                let dir = plank.particle.pos.subtractPure(this.particle.pos);
                dir.normalize();
                dir.scalarMultiply(25);
                plank.particle.addImpulse(dir);
            }
            for (let i = 0; i < Game.config.shipPartBarrels; i++) {
                let barrel = new Barrel(this.sprite.x + this.collisionRadius * Math.random() - this.collisionRadius / 2,
                    this.sprite.y + this.collisionRadius * Math.random() - this.collisionRadius / 2,
                    Math.random() > 0.75);
                let dir = barrel.particle.pos.subtractPure(this.particle.pos);
                dir.normalize();
                dir.scalarMultiply(25);
                barrel.particle.addImpulse(dir);
            }
            this.destroy()
        }
    }
}

class Vortex extends GameObject {
    constructor(magnitude) {
        let scale = magnitude * Game.config.vortexScaleMagnitudeRatio;
        let start = OffscreenPoint(80 * scale);
        let end = OffscreenPoint(80 * scale);
        super(start.x, start.y, new PIXI.Sprite(Game.Resources.vortex.texture), 75 * scale);
        this.magnitude = magnitude;
        this.sprite.scale.set(scale);
        this.sprite.anchor.set(0.5);
        this.sprite.zIndex = -1;
        this.force = new VortexForce(start.x, start.y, Game.config.vortexPowerMagnitudeRatio * magnitude, Game.config.vortexSizeMagnitudeRatio * magnitude);
        ParticleDynamics.Forces.push(this.force);
        this.moveSpeed = 50;
        this.path = new CatmullRom(0.1, 0.5);
        let points = [];
        points.push(start);
        points.push(start);
        for (let i = 0; i < 3; i++) {
            points.push(new Vector2(Math.random() * Game.width, Math.random() * Game.height));
        }
        points.push(end);
        points.push(end);
        this.path.addPoints(points);
        this.path.createLineSigments();
        this.sample = 0;
    }

    update(delta) {
        this.sprite.angle += -90 * delta;

        let pos = this.path.lookUp(this.sample);
        if (pos === undefined) {
            this.destroy();
            return;
        }
        this.sample += delta * Math.min(this.moveSpeed / this.magnitude, 200);
        this.sprite.x = pos.x;
        this.sprite.y = pos.y;
        this.force.center.x = pos.x;
        this.force.center.y = pos.y;

        let objects = Game.GetCollidingObjects(this);
        objects.forEach((object) => {
            if (!("damage" in object)) {
                return;
            }
            let damage = this.magnitude * delta * Game.config.vortexDamagePerSecond;
            object.damage(damage)
            this.magnitude -= damage * Game.config.vortexSelfDamageMultiplier;
        })

        this.magnitude -= Game.config.vortexMagnitudeLossPerSecond * delta;

        if (this.magnitude <= 0) {
            this.destroy();
        }

        this.sprite.scale.set(this.magnitude * Game.config.vortexScaleMagnitudeRatio);
        this.force.power = this.magnitude * Game.config.vortexPowerMagnitudeRatio;
        this.force.size = this.magnitude * Game.config.vortexSizeMagnitudeRatio;
    }

    destroy() {
        super.destroy();
        this.path.destroy();
        ParticleDynamics.Forces = ParticleDynamics.Forces.filter((obj) => {
            return obj !== this.force
        });
    }
}

class Bird extends GameObject {
    constructor(type) {
        let textures = [];
        if (type === 0) {
            textures.push(Game.Resources.birdGreen1.texture);
            textures.push(Game.Resources.birdGreen2.texture);
            textures.push(Game.Resources.birdGreen3.texture);
        } else if (type === 1) {
            textures.push(Game.Resources.birdRed1.texture);
            textures.push(Game.Resources.birdRed2.texture);
            textures.push(Game.Resources.birdRed3.texture);
        } else if (type === 2) {
            textures.push(Game.Resources.birdBlue1.texture);
            textures.push(Game.Resources.birdBlue2.texture);
            textures.push(Game.Resources.birdBlue3.texture);
        } else {
            console.log("Unknown bird type " + type);
        }
        let start = OffscreenPoint(100);
        let end = OffscreenPoint(100);
        super(start.x, start.y, new PIXI.Sprite(textures[0]), 0);
        this.textures = textures;
        this.sprite.scale.set(1);
        this.sprite.anchor.set(0.5);
        this.sprite.zIndex = 1000;
        this.animationState = 0;
        this.animationTimer = 0.5;

        this.path = new CatmullRom(0.1, 0.75);
        let points = [];
        points.push(start);
        points.push(start);
        for (let i = 0; i < 5; i++) {
            points.push(new Vector2(Math.random() * Game.width, Math.random() * Game.height));
        }
        points.push(end);
        points.push(end);
        this.path.addPoints(points);
        this.path.createLineSigments();
        this.lookahead = 50;
        this.moveSpeed = 50;
        this.sample = 0;
    }

    update(delta) {
        this.animationTimer -= delta;
        if (this.animationTimer <= 0) {
            this.animationTimer = 0.5;
            switch (this.animationState) {
                case 0: { // Wings up, going down
                    this.sprite.texture = this.textures[1];
                    this.animationState++;
                    break;
                }
                case 1: { // Wings middle, going down
                    this.sprite.texture = this.textures[2];
                    this.animationState++;
                    break;
                }
                case 2: { // Wings down, going up
                    this.sprite.texture = this.textures[1];
                    this.animationState++;
                    break;
                }
                case 3: { // Wings middle, going up
                    this.sprite.texture = this.textures[0];
                    this.animationState = 0;
                    break;
                }
            }
        }

        let pos = this.path.lookUp(this.sample);
        let lookahead = this.path.lookUp(this.sample + this.lookahead);
        if (pos === undefined || lookahead === undefined) {
            this.destroy();
            return;
        }
        this.sample += delta * this.moveSpeed;
        this.sprite.x = pos.x;
        this.sprite.y = pos.y;
        lookahead.subtract(pos);
        this.sprite.angle = lookahead.getRotationAngle();
    }

    destroy() {
        super.destroy();
        this.path.destroy();
    }
}

class CoconutBird extends Bird {
    constructor() {
        super(2);
        this.hasCoconut = true;
        this.moveSpeed = 75;
    }

    update(delta) {
        super.update(delta);
        if (!this.hasCoconut) {
            return;
        }
        let playerVec = Game.player.particle.pos.subtractPure(new Vector2(this.sprite.x, this.sprite.y));
        let distanceToPlayer = playerVec.magnitude();
        playerVec.normalize();
        if (distanceToPlayer < Game.config.birdCoconutRange) {
            this.hasCoconut = false;
            playerVec.rotate((Math.random() - 0.5) * 40);
            new Coconut(this.sprite.x, this.sprite.y, playerVec);
        }
    }
}

class BarrelBird extends Bird {
    constructor() {
        super(1);
        this.moveSpeed = 25;
        this.hasBarrel = true;
        this.barrelSprite = new PIXI.Sprite(Game.Resources.barrel_gunpowder.texture);
        this.barrelSprite.anchor.set(0.5);
        this.barrelSprite.scale.set(0.5);
        this.barrelSprite.zIndex = 999;
        this.barrelSprite.angle = this.sprite.angle;
        Game.PIXIApp.stage.addChild(this.barrelSprite);
    }

    update(delta) {
        super.update(delta);
        if (this.hasBarrel) {
            this.barrelSprite.x = this.sprite.x;
            this.barrelSprite.y = this.sprite.y;
            this.barrelSprite.angle = this.sprite.angle;
            if (Math.random() > 0.99) { // TODO: Replace with point on curve
                this.hasBarrel = false;
                this.moveSpeed = 75;
                let barrel = new Barrel(this.sprite.x, this.sprite.y, true, false);
                barrel.sprite.angle = this.sprite.angle;
                Game.PIXIApp.stage.removeChild(this.barrelSprite);
            }
        }
    }
}

class Coconut extends GameObject {
    constructor(x, y, direction) {
        let scale = 0.5;
        super(x, y, new PIXI.Sprite(Game.Resources.coconut.texture), 30 * scale);
        this.sprite.scale.set(scale);
        this.sprite.anchor.set(0.5);
        this.sprite.angle = Math.random() * 360;
        this.sprite.interactive = true;
        this.health = 1;
        this.sprite.on('pointerdown', () => { // Pickup Handler
            let distance = Distance(this.sprite.x, this.sprite.y, Game.player.sprite.x, Game.player.sprite.y);
            if (distance <= Game.player.pickupRange + this.collisionRadius + Game.player.collisionRadius) {
                Game.score += Game.config.birdCoconutPickupScore;
                if (this.airtime > 0) {
                    Game.score += Game.config.birdCoconutCatchBonus;
                }
                this.destroy();
            }
        });
        this.airtime = 1;
        this.speed = 5;
        this.particle = undefined;
        this.direction = direction;
    }

    update(delta) {
        if (this.airtime > 0) { // Flight
            this.airtime -= delta * 0.5;
            if (this.airtime <= 0) {
                this.particle = new Particle(this.sprite.x, this.sprite.y, 0.5, true);
                return;
            }
            this.sprite.x += this.direction.x * this.speed * this.airtime;
            this.sprite.y += this.direction.y * this.speed * this.airtime;
            if (Game.CheckCollision(this, Game.player)) {
                Game.player.damage(Game.config.birdCoconutDamage);
                this.destroy();
            }
            return;
        }
        // In Water
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    destroy() {
        super.destroy();
        if (this.particle !== undefined) {
            this.particle.clearTracking();
        }
    }
}

function OffscreenPoint(distance) {
    return Math.random() > 0.5 ?
        new Vector2(Math.random() * Game.width, Math.random() > 0.5 ? -distance : Game.height + distance) :
        new Vector2(Math.random() > 0.5 ? -distance : Game.width + distance, Math.random() * Game.height);

}