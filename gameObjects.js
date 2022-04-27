class GameObject {
    constructor(x, y, sprite) {
        this.sprite = sprite;
        this.sprite.x = x;
        this.sprite.y = y;
        Game.PIXIApp.stage.addChild(this.sprite);
        Game.Objects.push(this);
    }

    update(delta) {

    }

    destroy() {
        Game.PIXIApp.stage.removeChild(this.sprite);
        Game.Objects = Game.Objects.filter((v) => {return v !== this});
    }
}

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.player.texture));
        this.particle = new Particle(x, y, 1, true);
        this.particle.isPlayer = true;
        this.sprite.scale.set(0.5);
        this.sprite.anchor.set(0.5);
        this.sprite.zIndex = 999;
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
    }
}

class Plank extends GameObject {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.plank.texture));
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
        super(x, y,  new PIXI.Sprite(Game.Resources.ship2.texture));
        //this.sprite.scale.set(0.5);
        this.sprite.anchor.set(0.5);
    }
}

class Fragment extends GameObject {
    constructor(x, y, sprite, fade) {
        super(x, y, sprite);
        this.fade = fade;
        this.currentFade = fade;
        this.particle = new Particle(x, y, 0.1, false); // TODO: Calculate mass based on pixels if needed
    }

    update(delta)
    {
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