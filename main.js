function main() {
    const loader = PIXI.Loader.shared;
    let app = new PIXI.Application({width: 1280, height: 720, backgroundColor: 0x1099bb});
    document.body.appendChild(app.view);


    let sprites = {};
    loader.add("player", "assets/bunny.png");
    loader.load((loader, resources) => {
        sprites.player = new PIXI.Sprite(resources.player.texture);
    });
    loader.onComplete.add(setup);

    let state;
    let player;

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

        state = play;
        app.ticker.add(delta => gameLoop(delta));
    }

    function gameLoop(delta) {
        state(delta);
        document.getElementById("renderfps").innerText = "Rendering: " + Math.round(app.ticker.FPS).toString() + "fps";
        document.getElementById("simulationfps").innerText = "Simulation: " + Math.round(app.ticker.FPS).toString() + "fps";
    }

    function play(delta) {
        player.x += player.vx * delta;
        player.y += player.vy * delta;
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

