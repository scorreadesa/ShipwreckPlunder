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
        if(this.fadeTimer > 0) {
            this.fadeTimer -= delta;
            if(this.fadeTimer <= 0) {
                if(this.fadingOut) {
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

        this.cannonCooldownTime = 1;
        this.cannonCooldown = 0;
        this.maxHP = 100;
        this.currentHP = this.maxHP;
        this.pickupRange = 50;
        this.movementSpeed = 50;
    }

    update(delta) {
        ParticleDynamics.UpdateParticle(this.particle, delta)
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
        let look = Game.MousePosition.subtractPure(this.particle.pos);
        look.normalize();
        let angle = Math.asin(look.y / (Math.sqrt(look.x * look.x + look.y * look.y))) * (180 / Math.PI);
        if (look.x <= 0) {
            angle = 180 - angle;
        }
        this.sprite.angle = angle;

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
    }

    damage(amount) {
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
            if(this.dead) {
                return;
            }
            let distance = Distance(this.sprite.x, this.sprite.y, Game.player.sprite.x, Game.player.sprite.y);
            if(distance <= Game.player.pickupRange + this.collisionRadius + Game.player.collisionRadius) {
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
        if(this.dead) {
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
        if(this.health <= 0) {
            this.destroy();
        }
    }
}

class Treasure extends GameObject {
    constructor(x, y, tier) {
        let s;
        if(tier === 1) {
            s = new PIXI.Sprite(Game.Resources.treasure_low.texture);
        } else if(tier === 2) {
            s = new PIXI.Sprite(Game.Resources.treasure_mid.texture);
        } else if(tier === 3) {
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
            if(this.dead) {
                return;
            }
            let distance = Distance(this.sprite.x, this.sprite.y, Game.player.sprite.x, Game.player.sprite.y);
            if(distance <= Game.player.pickupRange + this.collisionRadius + Game.player.collisionRadius) {
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
        if(this.dead) {
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
        if(this.health <= 0) {
            this.destroy();
        }
    }
}

class Barrel extends GameObject {
    constructor(x, y, explosive) {
        let scale = 0.5;
        super(x, y, new PIXI.Sprite(explosive ? Game.Resources.barrel_gunpowder.texture : Game.Resources.barrel.texture), 82 * scale);
        this.explosive = explosive;
        this.particle = new Particle(x, y, explosive ? 3 : 1, true);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(scale);
        this.sprite.angle = Math.random() * 360;
        this.sprite.interactive = true;
        this.health = 50;
        this.fadeIn(1, scale * 0.8, scale);
    }

    update(delta) {
        super.update(delta);
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    destroy() {
        if(this.dead) {
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
        if(this.health <= 0) {
            this.destroy();
        }
    }

    cannonHit(point) {
        this.#destroyActual();
        if(this.explosive) {
            // TODO: Explosion VFX
            this.collisionRadius *= 3;
            let objects = Game.GetCollidingObjects(this);
            objects.forEach((object) => {
                if (!("cannonHit" in object)) {
                    if(object.hasOwnProperty("particle")) {
                        let dir = object.particle.pos.subtractPure(this.particle.pos);
                        dir.normalize();
                        dir.scalarMultiply(Game.config.barrelExplosionPushback);
                        object.particle.addImpulse(dir);
                    }
                    if("damage" in object) {
                        object.damage(Game.config.barrelExplosionDamage);
                    }
                    return;
                }
                object.cannonHit(new Vector2(object.sprite.x, object.sprite.y), Game.config.barrelExplosionPower);
            })
        } else {
            // Only fracture regular barrel, explosion VFX hides fracture.
            VoronoiFracture.FractureSprite(this.sprite, this.explosive ? "barrel_gunpowder" : "barrel", point, 10, 1.5);
            for(let i = 0; i < Game.config.barrelPlanks; i++) {
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
        if(type === 1) {
            s = new PIXI.Sprite(Game.Resources.ship1.texture);
            partType = "ship1";
        } else if(type === 2) {
            s = new PIXI.Sprite(Game.Resources.ship2.texture);
            partType = "ship2"
        } else if(type === 3) {
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

    cannonHit(point) {
        this.durability--;
        if(this.durability <= 0) {
            VoronoiFracture.FractureSprite(this.sprite, this.partType, point, 25, 3);
            for(let i = 0; i < Game.config.shipPartPlanks; i++) {
                let plank = new Plank(this.sprite.x + this.collisionRadius * Math.random() - this.collisionRadius / 2,
                    this.sprite.y + this.collisionRadius * Math.random() - this.collisionRadius / 2);
                let dir = plank.particle.pos.subtractPure(this.particle.pos);
                dir.normalize();
                dir.scalarMultiply(25);
                plank.particle.addImpulse(dir);
            }
            for(let i = 0; i < Game.config.shipPartBarrels; i++) {
                let barrel = new Barrel(this.sprite.x + this.collisionRadius * Math.random() - this.collisionRadius / 2,
                    this.sprite.y + this.collisionRadius * Math.random() - this.collisionRadius / 2,
                    Math.random() > 0.75);
                let dir = barrel.particle.pos.subtractPure(this.particle.pos);
                dir.normalize();
                dir.scalarMultiply(25);
                barrel.particle.addImpulse(dir);
            }
            super.destroy();
        }
    }
}

class Vortex extends GameObject {
    constructor(x, y, magnitude) {
        let scale = magnitude * Game.config.vortexScaleMagnitudeRatio;
        super(x, y, new PIXI.Sprite(Game.Resources.vortex.texture), 75 * scale);
        this.magnitude = magnitude;
        this.sprite.scale.set(scale);
        this.sprite.anchor.set(0.5);
        this.force = new VortexForce(x, y, Game.config.vortexPowerMagnitudeRatio * magnitude, Game.config.vortexSizeMagnitudeRatio * magnitude);
        ParticleDynamics.Forces.push(this.force);

        // TODO: Replace with path interpolation
        let vel = 25;
        this.motion = new Vector2((Math.random() * 2 - 1) * vel, (Math.random() * 2 - 1) * vel)
    }

    update(delta) {
        this.sprite.angle += -90 * delta;
        this.force.center.x += this.motion.x * delta;
        this.force.center.y += this.motion.y * delta;

        if (this.force.center.x < 0) {
            this.force.center.x += Game.width;
        } else if (this.force.center.x > Game.width) {
            this.force.center.x -= Game.width;
        }

        if (this.force.center.y < 0) {
            this.force.center.y += Game.height;
        } else if (this.force.center.y > Game.height) {
            this.force.center.y -= Game.height;
        }

        this.sprite.x = this.force.center.x;
        this.sprite.y = this.force.center.y;

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

        if(this.magnitude <= 0) {
            this.destroy();
        }

        this.sprite.scale.set(this.magnitude * Game.config.vortexScaleMagnitudeRatio);
        this.force.power = this.magnitude * Game.config.vortexPowerMagnitudeRatio;
        this.force.size = this.magnitude * Game.config.vortexSizeMagnitudeRatio;
    }

    destroy() {
        super.destroy();
        ParticleDynamics.Forces = ParticleDynamics.Forces.filter((obj) => {
            return obj !== this.force
        });
    }
}