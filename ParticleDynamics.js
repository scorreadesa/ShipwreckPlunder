ParticleDynamics = {};
ParticleDynamics.Forces = [];
ParticleDynamics.DebugLines = [];
ParticleDynamics.h = 1 / 180;
ParticleDynamics.eulerSolver = false;
ParticleDynamics.debugLinesEnabled = false;
ParticleDynamics.debugPathsEnabled = false;
ParticleDynamics.debugLinesLengthMult = 1;

ParticleDynamics.Init = Init;
ParticleDynamics.UpdateDebug = UpdateDebug;
ParticleDynamics.EnableForceLines = EnableForceLines;
ParticleDynamics.DisableForceLines = DisableForceLines;
ParticleDynamics.UpdateParticle = UpdateParticle;

function Init()
{
    SetupDebug();
}

function UpdateParticle(particle, delta) {
    let cappedH = Math.min(delta, ParticleDynamics.h); // Is this correct? It feels correct, but is it?
    if (ParticleDynamics.eulerSolver) {
        Euler(particle, delta, cappedH);
    } else {
        RungeKutta(particle, delta, cappedH)
    }
}

function Euler(particle, delta, h) {
    let time = 0;

    while (time < delta) {
        let changes = CalculateForce(particle);
        particle.applyChanges(changes, h);
        time += h;
    }

    // scale force with h for smooth switching between modes and for field lines
    particle.force.x *= h;
    particle.force.y *= h;
}

function RungeKutta(particle, delta, h) {
    let time = 0;
    while (time < delta) {
        // k1 is just reapplying previous frame's forces with no change. Is this correct?
        let k1 = {posX: particle.vel.x, posY: particle.vel.y, velX: particle.force.x, velY: particle.force.y};

        let p2 = particle.clone();
        // Step to midpoint using k1 and calculate force
        p2.applyChanges(k1, h * 0.5);
        let k2 = CalculateForce(p2);

        let p3 = particle.clone();
        // Step to new midpoint using k2 and calculate force
        p3.applyChanges(k2, h * 0.5);
        let k3 = CalculateForce(p3);

        let p4 = particle.clone();
        // Step to end using k3 and calculate force
        p4.applyChanges(k3, h);
        let k4 = CalculateForce(p4);

        // average changes
        let finalChanges = {};
        finalChanges.posX = (1 / 6) * (k1.posX + 2 * k2.posX + 2 * k3.posX + k4.posX);
        finalChanges.posY = (1 / 6) * (k1.posY + 2 * k2.posY + 2 * k3.posY + k4.posY);
        finalChanges.velX = (1 / 6) * (k1.velX + 2 * k2.velX + 2 * k3.velX + k4.velX);
        finalChanges.velY = (1 / 6) * (k1.velY + 2 * k2.velY + 2 * k3.velY + k4.velY);

        particle.applyChanges(finalChanges, h);
        // manually add forces for k1 of next iteration/frame
        particle.force.x = finalChanges.velX * h;
        particle.force.y = finalChanges.velY * h;
        time += h;
    }
}

function CalculateForce(particle) {
    particle.clearForce();
    ParticleDynamics.Forces.forEach((force, i) => {
        force.apply(particle);
    })

    let result = {};
    result.posX = particle.vel.x;
    result.posY = particle.vel.y;
    // Do not factor mass in here, instead considered in the forces since some (like drag) may not be affected by mass
    result.velX = particle.force.x;
    result.velY = particle.force.y;

    return result;
}

////////
// Debug

function SetupDebug()
{
    let xGrid = 50;
    let yGrid = 50;
    for(let x = xGrid; x < Game.width; x += xGrid)
    {
        for(let y = yGrid; y < Game.height; y += yGrid)
        {
            let line = new FieldLine(x, y);
            ParticleDynamics.DebugLines.push(line);
            //app.stage.addChild(line);
        }
    }//*/

    /*let line = new FieldLine(200, 200);
    lines.push(line);
    app.stage.addChild(line);//*/
}

function EnableForceLines()
{
    ParticleDynamics.DebugLines.forEach((line) => {
        Game.PIXIApp.stage.addChild(line);
    })
    ParticleDynamics.debugLinesEnabled = true;
}

function DisableForceLines()
{
    ParticleDynamics.DebugLines.forEach((line) => {
        Game.PIXIApp.stage.removeChild(line);
    })
    ParticleDynamics.debugLinesEnabled = false;
}

function UpdateDebug(delta)
{
    if(!ParticleDynamics.debugLinesEnabled)
    {
        return;
    }

    ParticleDynamics.DebugLines.forEach((line) => {
        line.update(delta);
    })
}

//////////
// Classes

class Particle {
    constructor(posX, posY, mass) {
        this.pos = new Vector2(posX, posY);
        this.vel = new Vector2(0, 0);
        this.force = new Vector2(0, 0);
        this.mass = mass;
        // For field lines only
        this.lastFrameForce = new Vector2(0, 0);
    }

    clearForce()
    {
        this.force.x = 0;
        this.force.y = 0;
    }

    applyChanges(changes, multiplier)
    {
        this.pos.x += changes.posX * multiplier;
        this.pos.y += changes.posY * multiplier;
        this.vel.x += changes.velX * multiplier;
        this.vel.y += changes.velY * multiplier;
    }

    clone()
    {
        let c = new Particle(this.pos.x, this.pos.y, this.mass);
        c.vel.x = this.vel.x;
        c.vel.y = this.vel.y;
        c.force.x = this.force.x;
        c.force.y = this.force.y;
        return c;
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
        this.lineTo(this.posX + this.particle.vel.x * ParticleDynamics.debugLinesLengthMult / delta, this.posY + this.particle.vel.y * ParticleDynamics.debugLinesLengthMult / delta);
    }
}

class ConstantForce {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    apply(particle)
    {
        particle.force.x += this.x / particle.mass;
        particle.force.y += this.y / particle.mass;
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
        particle.force.x += dir.x * force / particle.mass;
        particle.force.y += dir.y * force / particle.mass;
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