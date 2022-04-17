class GameObject {
    constructor(x, y, sprite) {
        this.sprite = sprite;
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5);
        Game.PIXIApp.stage.addChild(this.sprite);
    }

    destroy() {
        Game.PIXIApp.stage.removeChild(this.sprite);
    }
}

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.player.texture));
        this.particle = new Particle(x, y, 1, true);
        this.particle.isPlayer = true;
        this.sprite.scale.set(0.5);
        this.sprite.zIndex = 999;
    }

    update(delta) {
        ParticleDynamics.UpdateParticle(this.particle, delta)
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
        let look = Game.MousePosition.subtractPure(this.particle.pos);
        look.normalize();
        let angle = Math.asin(look.y / (Math.sqrt(look.x * look.x + look.y * look.y))) * (180 / Math.PI);
        if(look.x <= 0)
        {
            angle = 180 - angle;
        }
        this.sprite.angle = angle + 90;
    }
}

class Plank extends GameObject {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.plank.texture));
        this.particle = new Particle(x, y, 1, true);
        this.sprite.scale.set(0.5);
        this.sprite.angle = 40;
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