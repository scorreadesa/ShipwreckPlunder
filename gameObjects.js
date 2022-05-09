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

    update(delta) {

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
        this.particle.isPlayer = true;
        this.sprite.scale.set(0.5);
        this.sprite.anchor.set(0.408, 0.5);
        this.sprite.zIndex = 999;

        this.cannonCooldown = 0;
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

        this.cannonCooldown = Game.cannonCooldown;
        let direction = new Vector2(1, 0);
        direction.rotate(this.sprite.angle);
        let scaling = 100 * this.sprite.scale.x;
        new Cannonball(this.sprite.x + direction.x * scaling, this.sprite.y + direction.y * scaling, direction, 25);
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
        if (objects.length > 0) {
            let consumed = false;
            objects.forEach((object) => {
                if (!object.hasOwnProperty("fragmentable")) {
                    return;
                }
                consumed = true;
                object.fragment(new Vector2(this.sprite.x, this.sprite.y));
            })
            if (consumed) {
                this.destroy();
            }
        }
    }
}

class Plank extends GameObject {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.plank.texture), 25);
        this.particle = new Particle(x, y, 1, true);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.5);
        //this.sprite.angle = 40;
    }

    update(delta) {
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    destroy() {
        super.destroy();
        this.particle.clearTracking();
    }
}

class ShipPart extends GameObject {
    constructor(x, y) {
        let scale = 0.7;
        super(x, y, new PIXI.Sprite(Game.Resources.ship2.texture), 195 * scale);
        this.sprite.scale.set(scale);
        this.sprite.angle = 42;
        this.sprite.anchor.set(0.5);
        this.fragmentable = true;
    }

    fragment(point) {
        VoronoiFracture.FractureSprite(this.sprite, "ship2", point, 25);
        super.destroy();
    }
}

class Vortex extends GameObject {
    constructor(x, y) {
        let scale = 0.5;
        super(x, y, new PIXI.Sprite(Game.Resources.vortex.texture), 75 * scale);
        this.sprite.scale.set(scale);
        this.sprite.anchor.set(0.5);
        this.force = new RadialForce(x, y, 20, 100);
        ParticleDynamics.Forces.push(this.force);
        let vel = 75;
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
    }

    destroy() {
        super.destroy();
        ParticleDynamics.Forces.filter((obj) => {
            return obj !== this.force
        });
    }
}