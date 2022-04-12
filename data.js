class Particle {
    constructor(posX, posY, mass) {
        this.pos = new Vector2(posX, posY);
        this.vel = new Vector2(0, 0);
        this.force = new Vector2(0, 0);
        this.mass = mass;
    }

    clearForce()
    {
        this.force.x = 0;
        this.force.y = 0;
    }
}

class FieldLine extends PIXI.Graphics {
    constructor(x, y) {
        super()
        this.posX = x;
        this.posY = y;
        this.particle = new Particle(x, y, 1);
        this.lineStyle({width: 3, color: 0x000000});
        this.moveTo(x, y);
        this.lineTo(x + 1, y + 1);
    }

    update(delta)
    {
        this.particle.pos.x = this.posX;
        this.particle.pos.y = this.posY;
        this.particle.vel.x = 0;
        this.particle.vel.y = 0;
        ParticleDynamics.UpdateParticle(this.particle, delta);
        this.clear();
        this.lineStyle({width: 3, color: 0x000000});
        this.moveTo(this.posX, this.posY);
        this.lineTo(this.posX + this.particle.force.x, this.posY + this.particle.force.y);
    }
}

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let mag = this.magnitude();
        this.x = this.x / mag;
        this.y = this.y / mag;
    }

    normalized()
    {
        let mag = this.magnitude();
        return new Vector2(this.x / mag, this.y / mag);
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    subtract(other) {
        this.x -= other.x;
        this.y -= other.y;
    }

    addPure(other)
    {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtractPure(other)
    {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    scalarMultiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    vectorMultiply(other) {
        this.x *= other.x;
        this.y *= other.y;
    }
}

class ConstantForce {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    apply(particle)
    {
        particle.force.x += this.x;
        particle.force.y += this.y;
    }
}

class RadialForce {
    constructor(x, y, power, size) {
        this.center = new Vector2(x, y);
        this.power = power;
        this.size = size;
    }

    apply(particle)
    {
        let dir = this.center.subtractPure(particle.pos);
        let distance = dir.magnitude();
        dir.normalize();
        let force = Math.min(this.power / Math.pow(distance / this.size, 2), this.power);
        particle.force.x += dir.x * force
        particle.force.y += dir.y * force;
    }
}

class DragForce {
    constructor(coefficient) {
        this.coefficient = coefficient;
    }

    apply(particle)
    {
        particle.force.x -= particle.vel.x * this.coefficient;
        particle.force.y -= particle.vel.y * this.coefficient;
    }
}