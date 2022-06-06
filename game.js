Game = {}
Game.PIXIApp = undefined;
Game.Resources = PIXI.Loader.shared.resources;
Game.MousePosition = new Vector2(0, 0);
Game.width = 960;
Game.height = 960;
Game.player = undefined;
Game.simulationTPS = 60;
Game.renderFPS = 60;
Game.simulationInterval = undefined;
Game.lastTimestamp = -1;
Game.useStableDeltas = true; // If false uses exact high-res clock to calculate deltas, if true uses 1/TPS. Eliminates debug line flickering if enabled.
Game.paused = false;

Game.config = {};
Game.config.healingPerPlank = 20;
Game.config.excessHealingScoreMultiplier = 1;
Game.config.vortexDamagePerSecond = 10;
Game.config.vortexSelfDamageMultiplier = 0.001;
Game.config.vortexMagnitudeLossPerSecond = 0.01;
Game.config.vortexScaleMagnitudeRatio = 0.5;
Game.config.vortexPowerMagnitudeRatio = 40;
Game.config.vortexSizeMagnitudeRatio = 100;
Game.config.plunderValues = [50, 100, 200];
Game.config.barrelPlanks = 3;
Game.config.barrelExplosionPower = 5;
Game.config.barrelExplosionPushback = 150;
Game.config.barrelExplosionDamage = 75;
Game.config.shipPartDurability = 10;
Game.config.shipPartPlanks = 10;
Game.config.shipPartBarrels = 3;
Game.config.birdCoconutRange = 300;
Game.config.birdCoconutDamage = 10;
Game.config.birdCoconutPickupScore = 25;
Game.config.birdCoconutCatchBonus = 125;

Game.upgrades = {};
Game.upgrades.cannonCooldown = {};
Game.upgrades.cannonCooldown.label = "Cannon Cooldown";
Game.upgrades.cannonCooldown.default = 7;
Game.upgrades.cannonCooldown.values = [5, 3, 1];
Game.upgrades.cannonCooldown.costs = [50, 50, 50];
Game.upgrades.cannonCooldown.display = ["7s", "5s", "3s", "1s"];
Game.upgrades.cannonCooldown.level = -1;
Game.upgrades.health = {};
Game.upgrades.health.label = "Health";
Game.upgrades.health.default = 100;
Game.upgrades.health.values = [150, 200, 250];
Game.upgrades.health.costs = [50, 50, 50];
Game.upgrades.health.display = ["100", "150", "200", "250"];
Game.upgrades.health.level = -1;
Game.upgrades.speed = {};
Game.upgrades.speed.label = "Speed";
Game.upgrades.speed.default = 50;
Game.upgrades.speed.values = [75, 100, 125];
Game.upgrades.speed.costs = [50, 50, 50];
Game.upgrades.speed.display = ["100%", "150%", "200%", "250%"];
Game.upgrades.speed.level = -1;
Game.upgrades.explosionResist = {};
Game.upgrades.explosionResist.label = "Explosion Resist";
Game.upgrades.explosionResist.default = 1;
Game.upgrades.explosionResist.values = [0.5, 0];
Game.upgrades.explosionResist.costs = [50, 50, 50];
Game.upgrades.explosionResist.display = ["0%", "50%", "100%"];
Game.upgrades.explosionResist.level = -1;

Game.score = 0;
Game.plunder = 0;

Game.Inputs = {}
Game.Inputs.Left = undefined;
Game.Inputs.Right = undefined;
Game.Inputs.Up = undefined;
Game.Inputs.Down = undefined;

Game.Objects = [];

// Temporary for Particle Dynamics testing
Game.Forces = [];
Game.Motion = [];

// Temporary for PathInterpolation testing
Game.CatmullRomDebug = undefined;
Game.graphics = undefined;

Game.AddPoint = AddPoint;
Game.DrawControlPoints = DrawControlPoints;
Game.DrawSplineCurve = DrawSplineCurve;
Game.ShowArcLengthTable = ShowArcLengthTable;

Game.Init = Init;
Game.GameOver = GameOver;
Game.SetSimulationTPS = SetSimulationTPS;
Game.SetRenderFPS = SetRenderFPS;
Game.SetStableDeltas = SetStableDeltas;
Game.GetCollidingObjects = GetCollidingObjects;
Game.CheckCollision = CheckCollision;
Game.Pause = Pause;
Game.Unpause = Unpause;
Game.Step = Step;
Game.CreateVortex = CreateVortex;
Game.CreateShipPart = CreateShipPart;
Game.CreatePlank = CreatePlank;
Game.DrawSpline = DrawSpline;

function Init() {
    PIXI.settings.ANISOTROPIC_LEVEL = 16;
    PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.ON;
    PIXI.settings.FILTER_MULTISAMPLE = PIXI.MSAA_QUALITY.HIGH;
    PIXI.settings.SORTABLE_CHILDREN = true;

    UI.InitSidebar();
    LoadAssets();
    ParticleDynamics.Init();
    VoronoiFracture.Init();
}

function LoadAssets() {
    const loader = PIXI.Loader.shared;
    Game.PIXIApp = new PIXI.Application({width: Game.width, height: Game.height, backgroundColor: 0x1099bb});
    UI.Elements.game.appendChild(Game.PIXIApp.view); // TODO: Once window decoration is here, attach in a way that fits

    Game.PIXIApp.stage.interactive = true;
    Game.PIXIApp.stage.on("mousemove", (event) => {
        Game.MousePosition.x = event.data.global.x;
        Game.MousePosition.y = event.data.global.y;
    });

    Game.graphics = new PIXI.Graphics();
    Game.PIXIApp.stage.addChild(Game.graphics);

    VoronoiFracture.RegisterTexture("plank", "assets/plank.png");
    VoronoiFracture.RegisterTexture("ship1", "assets/ship1.png");
    VoronoiFracture.RegisterTexture("ship2", "assets/ship2.png");
    VoronoiFracture.RegisterTexture("ship3", "assets/ship3.png");
    VoronoiFracture.RegisterTexture("barrel", "assets/barrel.png");
    VoronoiFracture.RegisterTexture("barrel_gunpowder", "assets/barrel_gunpowder.png");

    loader.add("player", "assets/pirate.png");
    loader.add("cannonball", "assets/cannonball.png");
    loader.add("coconut", "assets/coconut.png");
    loader.add("plank", "assets/plank.png");
    loader.add("ship1", "assets/ship1w.png");
    loader.add("ship2", "assets/ship2w.png");
    loader.add("ship3", "assets/ship3w.png");
    loader.add("barrel", "assets/barrel.png");
    loader.add("barrel_gunpowder", "assets/barrel_gunpowder.png");
    loader.add("vortex", "assets/vortex.png");

    loader.add("treasure_low", "assets/treasure_low.png");
    loader.add("treasure_mid", "assets/treasure_mid.png");
    loader.add("treasure_high", "assets/treasure_high.png");
    loader.add("birdGreen1", "assets/birdGreen1.png");
    loader.add("birdGreen2", "assets/birdGreen2.png");
    loader.add("birdGreen3", "assets/birdGreen3.png");
    loader.add("birdRed1", "assets/birdRed1.png");
    loader.add("birdRed2", "assets/birdRed2.png");
    loader.add("birdRed3", "assets/birdRed3.png");
    loader.add("birdBlue1", "assets/birdBlue1.png");
    loader.add("birdBlue2", "assets/birdBlue2.png");
    loader.add("birdBlue3", "assets/birdBlue3.png");

    loader.load(Setup);
}

function Setup() {
    ParticleDynamics.Forces.push(new DragForce(0.5));

    ParticleDynamics.Forces.push(new OutOfBoundsForce(150));

    CreatePlayer();
    UI.InitHUD();

    Game.PIXIApp.ticker.minFPS = 0;
    Game.PIXIApp.ticker.maxFPS = Game.renderFPS;
    if (!Game.paused) {
        Game.SetSimulationTPS(Game.simulationTPS);
    }
}

function CreatePlayer() {
    Game.player = new Player(Game.width / 2, Game.height / 2);

    // https://github.com/kittykatattack/learningPixi
    Game.Inputs.Left = SetupKey("a");
    Game.Inputs.Up = SetupKey("w");
    Game.Inputs.Right = SetupKey("d");
    Game.Inputs.Down = SetupKey("s");
    Game.Inputs.Space = SetupKey(" ");
    Game.Inputs.UpgradeHealth = SetupKey("1");
    Game.Inputs.UpgradeSpeed = SetupKey("2");
    Game.Inputs.UpgradeCannon = SetupKey("3");
    Game.Inputs.UpgradeResist = SetupKey("4");

    Game.Inputs.SpawnTreasure = SetupKey("t");
    Game.Inputs.SpawnBarrel = SetupKey("b");
    Game.Inputs.SpawnBarrelExplosive = SetupKey("e");
    Game.Inputs.SpawnBird = SetupKey("f");

    Game.Inputs.Space.press = function () {
        Game.player.shoot();
    }

    Game.Inputs.UpgradeHealth.press = function () {
        Game.player.maxHP = GetUpgradeValue(Game.upgrades.health);
    }

    Game.Inputs.UpgradeSpeed.press = function () {
        Game.player.movementSpeed = GetUpgradeValue(Game.upgrades.speed);
    }

    Game.Inputs.UpgradeCannon.press = function () {
        Game.player.cannonCooldownTime = GetUpgradeValue(Game.upgrades.cannonCooldown);
    }

    Game.Inputs.UpgradeResist.press = function () {
        Game.player.explosionDamageTaken = GetUpgradeValue(Game.upgrades.explosionResist);
    }

    Game.Inputs.SpawnTreasure.press = function () {
        new Treasure(Math.random() * Game.width, Math.random() * Game.height, 1 + Math.round(Math.random() * 2));
    }

    Game.Inputs.SpawnBarrel.press = function () {
        new Barrel(Math.random() * Game.width, Math.random() * Game.height, false);
    }

    Game.Inputs.SpawnBarrelExplosive.press = function () {
        new Barrel(Math.random() * Game.width, Math.random() * Game.height, true);
    }

    Game.Inputs.SpawnBird.press = function () {
        new BarrelBird(Math.random() * Game.width, Math.random() * Game.height);
    }
}

function GetUpgradeValue(upgrade) {
    if(upgrade.level + 1 >= upgrade.values.length || Game.plunder < upgrade.costs[upgrade.level + 1]) {
        return upgrade.values[upgrade.level];
    }
    upgrade.level++;
    Game.plunder -= upgrade.costs[upgrade.level];
    return upgrade.values[upgrade.level];
}

function CreateVortex() {
    new Vortex(Math.random() * Game.width, Math.random() * Game.height, 3);
}

function CreateShipPart() {
    new ShipPart(200, 500, 1 + Math.round(Math.random() * 2));
}

function CreatePlank() {
    new Plank(Math.random() * Game.width, Math.random() * Game.height);
}

function DrawSpline() {
    let control_points = [
        new Vector2(90, 480), new Vector2(90, 480), new Vector2(120, 550), new Vector2(200, 580),
        new Vector2(250, 620), new Vector2(280, 650), new Vector2(290, 700), new Vector2(290, 700),
    ];
    let cmr = new CatmullRom(0.001);
    cmr.addPoints(control_points);
    cmr.draw();
}

function Tick() {
    let delta;
    if (Game.useStableDeltas || Game.lastTimestamp < 0) {
        delta = 1 / Game.simulationTPS;
    } else {
        delta = (window.performance.now() - Game.lastTimestamp) * 0.001;
    }
    Game.lastTimestamp = window.performance.now();
    UI.UpdateInterface(delta);
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

function GameOver() {
    console.log("You are dead! Not big surprise.")
}

function SetSimulationTPS(tps) {
    Game.simulationTPS = tps;
    if (Game.paused) {
        return; // Enables setting of step interval while paused without restarting simulation
    }
    if (Game.simulationInterval !== undefined) {
        clearInterval(Game.simulationInterval);
    }
    let millis = 1000 / tps;
    Game.simulationInterval = setInterval(Tick, millis);
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

function Pause() {
    Game.paused = true;
    if (Game.simulationInterval !== undefined) {
        clearInterval(Game.simulationInterval);
    }
    Game.PIXIApp.ticker.stop();
    Game.PIXIApp.renderer.render(Game.PIXIApp.stage); // Render current state of game
}

function Unpause() {
    Game.paused = false;
    Game.lastTimestamp = -1;
    SetSimulationTPS(Game.simulationTPS);
    Game.PIXIApp.ticker.start();
}

function Step() {
    Game.lastTimestamp = -1;
    Tick();
    Game.PIXIApp.renderer.render(Game.PIXIApp.stage); // Simulation and rendering in lockstep while stepping
}

function GetCollidingObjects(obj) {
    if (obj.collisionRadius <= 0) {
        return;
    }
    let objects = [];
    Game.Objects.forEach((object) => {
        if (object.collisionRadius <= 0) {
            return;
        }
        if (object === obj) {
            return;
        }
        let xDelta = object.sprite.x - obj.sprite.x;
        let yDelta = object.sprite.y - obj.sprite.y;
        let distance = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
        if (distance < object.collisionRadius + obj.collisionRadius) {
            objects.push(object);
            //Debug.DrawDot(object.sprite.x, object.sprite.y, object.collisionRadius, 1000);
        }
    });
    return objects;
}

function CheckCollision(obj1, obj2) {
    let xDelta = obj1.sprite.x - obj2.sprite.x;
    let yDelta = obj1.sprite.y - obj2.sprite.y;
    let distance = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
    if (distance < obj1.collisionRadius + obj2.collisionRadius) {
        return true;
    }
    return false;
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

function AddPoint()
{
    let x = parseFloat(document.getElementById("xcoordinate").value);
    let y = parseFloat(document.getElementById("ycoordinate").value);
    if(!Game.CatmullRomDebug) {
        Game.CatmullRomDebug = new CatmullRom();
    }

    let new_pt = new Vector2(x, y);
    console.log("Adding pt ", JSON.stringify(new_pt), " to spline curve.");
    Game.CatmullRomDebug.addPoint(new_pt);
}

function DrawControlPoints()
{
    if(Game.CatmullRomDebug) {
        const points = Game.CatmullRomDebug.getPoints();
        console.log(points);
        drawPoints(points);
    }
}

function DrawSplineCurve()
{
    if(Game.CatmullRomDebug) {
        Game.CatmullRomDebug.draw();
    }
}

function ShowArcLengthTable()
{
    if(Game.CatmullRomDebug) {
        let nsamples = parseFloat(document.getElementById("nsamples").value);
        Game.CatmullRomDebug.showArcLengthSamples(nsamples);
    }
}