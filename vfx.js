class VFX {
    constructor(x, y, sprite) {
        this.sprite = sprite;
        this.sprite.x = x;
        this.sprite.y = y;
        Game.PIXIApp.stage.addChild(this.sprite);
        Game.VFX.push(this);
    }

    update(delta) {

    }

    destroy() {
        Game.PIXIApp.stage.removeChild(this.sprite);
        this.sprite.destroy();
        Game.VFX = Game.VFX.filter((v) => {
            return v !== this
        });
    }
}

class Title extends VFX {
    constructor(x, y) {
        super(x, y + 20, new PIXI.Sprite(Game.Resources.title.texture));
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.95);
        this.animTime = 0;
        this.baseY = y;
    }

    update(delta) {
        this.animTime += delta;
        this.sprite.angle = Math.sin(this.animTime) * 2;
        this.sprite.y = this.baseY + Math.cos(this.animTime) * 20;
    }
}

class Explosion extends VFX {
    constructor(x, y) {
        super(x, y, new PIXI.Sprite(Game.Resources.explosion.texture));
        this.sprite.anchor.set(0.5);
        this.sprite.zIndex = 1001;
        this.duration = 1;
        this.life = 0;
        this.rotation = Math.random() * 2 - 1;
    }

    update(delta) {
        this.life += delta;
        if(this.life > this.duration) {
            this.destroy();
            return;
        }
        this.sprite.alpha = 1 - this.life / this.duration;
        this.sprite.angle = this.life * this.rotation * 30;
        this.sprite.scale.set((1 - this.life / this.duration) / 2 + 0.5);
    }
}

class Smoke extends VFX {
    constructor(x, y, direction, force, size, duration) {
        super(x, y, new PIXI.Sprite(Math.random() > 0.5 ? Game.Resources.smoke1.texture : Game.Resources.smoke2.texture));
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(size);
        this.sprite.angle = Math.random() * 360;
        this.sprite.zIndex = 1000;
        this.direction = direction;
        this.force = force;
        this.duration = duration;
        this.life = 0;
    }

    update(delta) {
        this.life += delta;
        if(this.life > this.duration) {
            this.destroy();
            return;
        }
        this.sprite.alpha = 1 - this.life / this.duration;
        this.sprite.x += this.direction.x * this.force;
        this.sprite.y += this.direction.y * this.force;
    }
}