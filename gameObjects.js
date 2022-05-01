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
        super(x, y, new PIXI.Sprite(Game.Resources.player.texture), 55);
        this.particle = new Particle(x, y, 1, true);
        this.particle.isPlayer = true;
        this.sprite.scale.set(0.5);
        this.sprite.anchor.set(0.5);
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
        if(objects.length > 0)
        {
            objects.forEach((object) => {
                if (!object.hasOwnProperty("fragmentable")) {
                    return;
                }
                object.fragment(new Vector2(this.sprite.x, this.sprite.y));
            })
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
        this.destroy();
    }
}

class Fragment extends GameObject {
    constructor(x, y, sprite, fade) {
        super(x, y, sprite, 0);
        this.fade = fade;
        this.currentFade = fade;
        this.particle = new Particle(x, y, 0.1, false); // TODO: Calculate mass based on pixels if needed
    }

    update(delta) {
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
        this.currentFade -= delta;
        this.sprite.alpha = this.currentFade / this.fade;
    }

    destroy() {
        super.destroy();
        this.sprite.destroy(true); // Destroys texture too
    }
}