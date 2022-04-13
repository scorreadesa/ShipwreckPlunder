ParticleDynamics = {};
ParticleDynamics.Forces = [];
ParticleDynamics.h = 1 / 180;
ParticleDynamics.eulerSolver = true;
ParticleDynamics.UpdateParticle = UpdateParticle;

function UpdateParticle(particle, delta) {
    if (ParticleDynamics.eulerSolver) {
        Euler(particle, delta, ParticleDynamics.h);
    } else {
        RungeKutta(particle, delta, ParticleDynamics.h)
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