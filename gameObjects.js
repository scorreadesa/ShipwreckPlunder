class Plank {
    constructor(x, y) {
        this.particle = new Particle(x, y, 1, true);
        this.sprite = new PIXI.Sprite(Game.Resources.plank.texture);
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.25);
        Game.PIXIApp.stage.addChild(this.sprite);
    }

    update(delta)
    {
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.sprite.x = this.particle.pos.x;
        this.sprite.y = this.particle.pos.y;
    }

    destroy()
    {
        Game.PIXIApp.stage.removeChild(this.sprite);
        this.particle.clearTracking();
    }
}