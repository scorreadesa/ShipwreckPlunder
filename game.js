Game = {}
Game.PIXIApp = undefined;
Game.Resources = PIXI.Loader.shared.resources;
Game.MousePosition = new Vector2(0, 0);
Game.width = 960;
Game.height = 960;
Game.player = undefined;
Game.playerSpeed = 50;
Game.simulationTPS = 60;
Game.renderFPS = 60;
Game.simulationInterval = undefined;
Game.lastTimestamp = -1;
Game.useStableDeltas = true; // If false uses exact high-res clock to calculate deltas, if true uses 1/TPS. Eliminates debug line flickering if enabled.

Game.Inputs = {}
Game.Inputs.Left = undefined;
Game.Inputs.Right = undefined;
Game.Inputs.Up = undefined;
Game.Inputs.Down = undefined;

Game.Objects = [];

// Temporary for Particle Dynamics testing
Game.Forces = [];
Game.Motion = [];

Game.Init = Init;
Game.SetSimulationTPS = SetSimulationTPS;
Game.SetRenderFPS = SetRenderFPS;
Game.SetStableDeltas = SetStableDeltas;

function Init() {
    PIXI.settings.ANISOTROPIC_LEVEL = 16;
    PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.ON;
    PIXI.settings.FILTER_MULTISAMPLE = PIXI.MSAA_QUALITY.HIGH;
    PIXI.settings.SORTABLE_CHILDREN = true;

    UI.Init();
    LoadAssets();
    ParticleDynamics.Init();
}

function LoadAssets() {
    const loader = PIXI.Loader.shared;
    Game.PIXIApp = new PIXI.Application({width: Game.width, height: Game.height, backgroundColor: 0x1099bb});
    UI.Elements.game.appendChild(Game.PIXIApp.view); // TODO: Once window decoration is here, attach in a way that fits

    Game.PIXIApp.ticker.minFPS = 0;
    Game.PIXIApp.ticker.maxFPS = Game.renderFPS;
    Game.SetSimulationTPS(Game.simulationTPS);

    Game.PIXIApp.stage.interactive = true;
    Game.PIXIApp.stage.on("mousemove", (event) => {
        Game.MousePosition.x = event.data.global.x;
        Game.MousePosition.y = event.data.global.y;
    })

    VoronoiFracture.RegisterTexture("plank", "assets/plank.png");

    loader.add("player", "assets/pirate.png");
    loader.add("plank", "assets/plank.png");
    loader.load(Setup);
}

function Setup() {
    //CreatePlayer();
    //CreateForces();
    let plank = new Plank(400, 400);
    Game.Objects.push(plank);
    let time = window.performance.now();
    VoronoiFracture.FractureSprite(plank.sprite, "plank");
    let passed = window.performance.now() - time;
    console.log(passed);
}

function CreatePlayer() {
    Game.player = new Player(500, 500); // We might want to change instantiation to something more dynamic later if we want to have a title screen
    Game.Objects.push(Game.player);

    // https://github.com/kittykatattack/learningPixi
    Game.Inputs.Left = SetupKey("a");
    Game.Inputs.Up = SetupKey("w");
    Game.Inputs.Right = SetupKey("d");
    Game.Inputs.Down = SetupKey("s");
}

function CreateForces() {
    const power = 20;
    const size = 100;
    const amount = 5;
    const vel = 75;

    for (let i = 0; i < amount; i++) {
        let force = new RadialForce(Math.random() * Game.width, Math.random() * Game.height, power, size);
        ParticleDynamics.Forces.push(force);
        Game.Forces.push(force);
        Game.Motion.push(new Vector2(Math.random() * vel - vel / 2, Math.random() * vel - vel / 2));
    }//*/

    ParticleDynamics.Forces.push(new DragForce(0.5));
    ParticleDynamics.Forces.push(new PlayerMovementForce());
}

function Tick() {
    let delta;
    if (Game.useStableDeltas || Game.lastTimestamp < 0) {
        delta = 1 / Game.simulationTPS;
    } else {
        delta = (window.performance.now() - Game.lastTimestamp) * 0.001;
    }
    Game.lastTimestamp = window.performance.now();

    UI.UpdateInterface();
    SimulationUpdate(delta);
}

function SimulationUpdate(delta) {
    Game.Forces.forEach((force, i) => {
        force.center.x += Game.Motion[i].x * delta;
        force.center.y += Game.Motion[i].y * delta;

        if (force.center.x < 0) {
            force.center.x += Game.width;
        } else if (force.center.x > Game.width) {
            force.center.x -= Game.width;
        }

        if (force.center.y < 0) {
            force.center.y += Game.height;
        } else if (force.center.y > Game.height) {
            force.center.y -= Game.height;
        }
    })//*/

    Game.Objects.forEach((obj) => {
        obj.update(delta);
    })

    ParticleDynamics.UpdateDebug(delta);
}

function SetSimulationTPS(tps) {
    if (Game.simulationInterval !== undefined) {
        clearInterval(Game.simulationInterval);
    }
    let millis = 1000 / tps;
    Game.simulationInterval = setInterval(Tick, millis);
    Game.simulationTPS = tps;
}

function SetStableDeltas(stable) {
    Game.useStableDeltas = stable;
    if (stable) {
        Game.lastTimestamp = -1; // Reset to -1 to prevent large jumps when switching back
    }
}

function SetRenderFPS(fps) {
    Game.renderFPS = fps;
    Game.PIXIApp.ticker.maxFPS = fps;
}

// https://github.com/kittykatattack/learningPixi#introduction
function SetupKey(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    // downHandler
    key.downHandler = (event) => {
        if (event.key === key.value) {
            if (key.isUp && key.press) {
                key.press();
            }
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };
    // upHandler
    key.upHandler = (event) => {
        if (event.key === key.value) {
            if (key.isDown && key.release) {
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