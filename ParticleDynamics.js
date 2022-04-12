ParticleDynamics = {};
ParticleDynamics.Forces = [];
ParticleDynamics.h = 1 / 180;
ParticleDynamics.UpdateParticle = UpdateParticle;

function UpdateParticle(particle, delta) {
    Euler(particle, delta, ParticleDynamics.h);
}

function Euler(particle, delta, h)
{
    let time = 0;
    while (time < delta)
    {
        EulerStep(particle, h);
        time += h;
    }
}

function EulerStep(particle, h)
{
    let changes = ApplyForce(particle);
    particle.pos.x += changes.posX * h;
    particle.pos.y += changes.posY * h;
    particle.vel.x += changes.velX * h;
    particle.vel.y += changes.velY * h;
}

function ApplyForce(particle) {
    particle.clearForce();
    ParticleDynamics.Forces.forEach((force, i) => {
        force.apply(particle);
    })

    let result = {};
    result.posX = particle.vel.x;
    result.posY = particle.vel.y;
    result.velX = particle.force.x / particle.mass;
    result.velY = particle.force.y / particle.mass;

    return result;
}

