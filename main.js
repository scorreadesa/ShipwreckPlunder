function main() {
    const width = 800;
    const height = 800;

    const loader = PIXI.Loader.shared;
    let app = new PIXI.Application({width: width, height: height, backgroundColor: 0x1099bb});
    document.body.appendChild(app.view);

    let sprites = {};
    loader.add("player", "assets/bunny.png");
    loader.load((loader, resources) => {
        sprites.player = new PIXI.Sprite(resources.player.texture);
    });
    loader.onComplete.add(setup);

    let state;
    let player;
    let lines = [];
    let forces = [];
    let motion = [];

    function setup() {
        player = sprites.player;
        player.position.set(100, 100);
        player.anchor.set(0.5, 0.5);
        player.vx = 0;
        player.vy = 0;
        app.stage.addChild(player);

        // https://github.com/kittykatattack/learningPixi#introduction
        const left = keyboard("ArrowLeft"), up = keyboard("ArrowUp"), right = keyboard("ArrowRight"), down = keyboard("ArrowDown");
        const speed = 5.0;

        left.press = () => {
            player.vx = -speed;
            player.vy = 0;
        };
        left.release = () => {
            if(!right.isDown && player.vy === 0) {
                player.vx = 0;
            }
        };
        up.press = () => {
            player.vy = -speed;
            player.vx = 0;
        };
        up.release = () => {
            if(!down.isDown && player.vx === 0) {
                player.vy = 0;
            }
        };
        right.press = () => {
            player.vx = speed;
            player.vy = 0;
        };
        right.release = () => {
            if(!left.isDown && player.vy === 0) {
                player.vx = 0;
            }
        };
        down.press = () => {
            player.vy = speed;
            player.vx = 0;
        };
        down.release = () => {
            if(!up.isDown && player.vx === 0) {
                player.vy = 0;
            }
        };

        state = play; // TODO: move to simulation loop once created
        // TODO: Split into simulation and render
        app.ticker.add(delta => gameLoop(delta / 60)); // Divide by 60 to get per second values
        app.ticker.maxFPS = 60; // Hardcoded for now, move to UI controls

        const power = 20;
        const size = 100;
        const amount = 5;
        const vel = 75;

        for(let i = 0; i < amount; i++)
        {
            let force = new RadialForce(Math.random() * width, Math.random() * height, power, size);
            ParticleDynamics.Forces.push(force);
            forces.push(force);
            motion.push(new Vector2(Math.random() * vel - vel / 2, Math.random() * vel - vel / 2));
        }

        //ParticleDynamics.Forces.push(new ConstantForce(5, 7));
        ParticleDynamics.Forces.push(new DragForce(0.1));

        let xGrid = 41;
        let yGrid = 41;
        for(let x = xGrid; x < width; x += xGrid)
        {
            for(let y = yGrid; y < height; y += yGrid)
            {
                let line = new FieldLine(x, y);
                lines.push(line);
                app.stage.addChild(line);
            }
        }//*/

        /*let line = new FieldLine(200, 200);
        lines.push(line);
        app.stage.addChild(line);//*/
    }

    function gameLoop(delta) {
        state(delta);
        document.getElementById("renderfps").innerText = "Rendering: " + Math.round(app.ticker.FPS).toString() + "fps";
        document.getElementById("simulationfps").innerText = "Simulation: " + Math.round(app.ticker.FPS).toString() + "fps";
    }

    function play(delta) {
        player.x += player.vx * delta;
        player.y += player.vy * delta;

        lines.forEach((l, i) => {
            l.update(delta);
        })

        forces.forEach((force, i) => {
            force.center.x += motion[i].x * delta;
            force.center.y += motion[i].y * delta;

            if(force.center.x < 0)
            {
                force.center.x += width;
            }
            else if(force.center.x > width)
            {
                force.center.x -= width;
            }

            if(force.center.y < 0)
            {
                force.center.y += height;
            }
            else if(force.center.y > height)
            {
                force.center.y -= height;
            }
        })
    }

    // https://github.com/kittykatattack/learningPixi#introduction
    function keyboard(value) {
        let key = {};
        key.value = value;
        key.isDown = false;
        key.isUp = true;
        key.press = undefined;
        key.release = undefined;
        // downHandler
        key.downHandler = (event) => {
            if(event.key === key.value) {
                if(key.isUp && key.press) {
                    key.press();
                }
                key.isDown = true;
                key.isUp = false;
                event.preventDefault();
            }
        };
        // upHandler
        key.upHandler = (event) => {
            if(event.key === key.value) {
                if(key.isDown && key.release) {
                    key.release();
                }
                key.isDown = false;
                key.isUp = true;
                event.preventDefault();
            }
        };
        // attach event listeners
        const downListener = key.downHandler.bind(key);
        const upListener = key.upHandler.bind(key);
        window.addEventListener("keydown", downListener, false);
        window.addEventListener("keyup", upListener, false);
        // detach event listeners
        key.unsubscribe = () => {
            window.removeEventListener("keydown", downListener);
            window.removeEventListener("keyup", upListener);
        };

        return key;
    }

}

