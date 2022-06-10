UI = {};
UI.InitSidebar = Init;
UI.InitHUD = InitGameHUD;
UI.RemoveHUD = RemoveGameHUD;
UI.UpdateInterface = UpdateInterface;
UI.InitResults = InitResultsScreen;
UI.ApplyTPS = ApplyTPS;
UI.ApplyFPS = ApplyFPS;
UI.ApplyDeltas = ApplyDeltas;
UI.ApplyH = ApplyH;
UI.ApplyEuler = ApplyEuler;
UI.ApplyForceLines = ApplyForceLines;
UI.ApplyPaths = ApplyPaths;
UI.ApplyFractureDebugPoints = ApplyFractureDebugPoints;
UI.ApplyFractureDebugField = ApplyFractureDebugField;
UI.ApplyNoised = ApplyNoised;
UI.ApplyFractureType = ApplyFractureType;
UI.ApplyNoiseType = ApplyNoiseType;
UI.ApplyShowSplines = ApplyShowSplines;
UI.ApplyShowSplinePoints = ApplyShowSplinePoints;
UI.ApplyShowSplineTable = ApplyShowSplineTable;
UI.TogglePause = TogglePause;
UI.Step = Step;

UI.Elements = {};
UI.HUD = {};

function Init() {
    UI.Elements.game = document.getElementById("game");
    UI.Elements.tps = document.getElementById("tps");
    UI.Elements.fps = document.getElementById("fps");
    UI.Elements.deltas = document.getElementById("deltas");
    UI.Elements.hValue = document.getElementById("hValue");
    UI.Elements.euler = document.getElementById("euler");
    UI.Elements.lines = document.getElementById("lines");
    UI.Elements.paths = document.getElementById("paths");
    UI.Elements.noised = document.getElementById("noised");
    UI.Elements.centers = document.getElementById("centers");
    UI.Elements.cells = document.getElementById("cells");
    UI.Elements.type = document.getElementById("type");
    UI.Elements.noiseType = document.getElementById("noiseType");
    UI.Elements.splines = document.getElementById("splines");
    UI.Elements.points = document.getElementById("points");
    UI.Elements.table = document.getElementById("table");
    UI.Elements.pause = document.getElementById("pause");
    UI.Elements.step = document.getElementById("step");

    UI.Elements.tps.value = Game.simulationTPS;
    UI.Elements.fps.value = Game.renderFPS;
    UI.Elements.deltas.checked = Game.useStableDeltas;
    UI.Elements.hValue.value = ParticleDynamics.h;
    UI.Elements.euler.checked = ParticleDynamics.eulerSolver;
    UI.Elements.lines.checked = ParticleDynamics.debugLinesEnabled;
    UI.Elements.paths.checked = ParticleDynamics.debugPathsEnabled;
    UI.Elements.noised.checked = VoronoiFracture.noised;
    UI.Elements.centers.checked = VoronoiFracture.debugShowPoints;
    UI.Elements.cells.checked = VoronoiFracture.debugShowField;
    UI.Elements.type.value = VoronoiFracture.type;
    UI.Elements.noiseType.value = VoronoiFracture.noiseType;
    UI.Elements.splines.checked = PathInterpolation.debugShowLine;
    UI.Elements.points.checked = PathInterpolation.debugShowPoints;
    UI.Elements.table.checked = PathInterpolation.debugShowTable;
    UI.Elements.pause.innerText = Game.paused ? "Unpause" : "Pause";
    UI.Elements.step.disabled = !Game.paused;
}

function InitGameHUD() {
    UI.HUD.healthBar = new PIXI.Container();
    let healthBackground = new PIXI.Graphics();
    UI.HUD.healthBar.addChild(healthBackground);
    UI.HUD.healthBar.background = healthBackground;
    let healthForeground = new PIXI.Graphics();
    UI.HUD.healthBar.addChild(healthForeground);
    UI.HUD.healthBar.foreground = healthForeground;

    UI.HUD.cannonCooldown = new PIXI.Container();
    let cannonBackground = new PIXI.Graphics();
    UI.HUD.cannonCooldown.addChild(cannonBackground);
    UI.HUD.cannonCooldown.background = cannonBackground;
    let cannonForeground = new PIXI.Graphics();
    UI.HUD.cannonCooldown.addChild(cannonForeground);
    UI.HUD.cannonCooldown.foreground = cannonForeground;
    let cannonText = new PIXI.Text("Cannon Ready!", {
        fontFamily: "Arial",
        fontSize: 20,
        fill: "white",
    });
    cannonText.position.set(16, 53);
    UI.HUD.cannonCooldown.addChild(cannonText);
    UI.HUD.cannonCooldown.text = cannonText;

    UI.HUD.textArea = new PIXI.Container();
    let textScore =  new PIXI.Text("Score: 0", {
        fontFamily: "Arial",
        fontSize: 20,
        fill: "#88ee00",
    });
    textScore.position.set(10, 80);
    UI.HUD.textArea.addChild(textScore);
    UI.HUD.textArea.score = textScore;
    let textPlunder = new PIXI.Text("Plunder: 0", {
        fontFamily: "Arial",
        fontSize: 20,
        fill: "yellow",
    });
    textPlunder.position.set(10, 100);
    UI.HUD.textArea.addChild(textPlunder);
    UI.HUD.textArea.plunder = textPlunder;

    AddUpgradeText(120, "health");
    AddUpgradeText(140, "speed");
    AddUpgradeText(160, "cannon");

    UI.HUD.healthBar.zIndex = 9999;
    UI.HUD.cannonCooldown.zIndex = 9999;
    UI.HUD.textArea.zIndex = 9999;
    Game.PIXIApp.stage.addChild(UI.HUD.healthBar);
    Game.PIXIApp.stage.addChild(UI.HUD.cannonCooldown);
    Game.PIXIApp.stage.addChild(UI.HUD.textArea);
}

function AddUpgradeText(y, name) {
    let textUpgrade = new PIXI.Text("", {
        fontFamily: "Arial",
        fontSize: 20,
        fill: "black",
    });
    textUpgrade.position.set(10, y);
    UI.HUD.textArea.addChild(textUpgrade);
    UI.HUD.textArea[name] = textUpgrade;
}

function RemoveGameHUD() {
    Game.PIXIApp.stage.removeChild(UI.HUD.healthBar);
    Game.PIXIApp.stage.removeChild(UI.HUD.cannonCooldown);
    Game.PIXIApp.stage.removeChild(UI.HUD.textArea);
    UI.HUD.healthBar.destroy({children: true});
    UI.HUD.cannonCooldown.destroy({children: true});
    UI.HUD.healthBar.destroy({children: true});
}

function InitResultsScreen() {
    UI.HUD.textArea = new PIXI.Container();
    let textScore =  new PIXI.Text("Score: " + Game.score, {
        fontFamily: "Arial",
        fontSize: 60,
        fill: "#88ee00",
        stroke: "black",
        strokeThickness: 10,
    });
    textScore.position.set(50, 50);
    UI.HUD.textArea.addChild(textScore);
    UI.HUD.textArea.score = textScore;
    let textPlunder = new PIXI.Text("Plunder: " + Game.plunder, {
        fontFamily: "Arial",
        fontSize: 60,
        fill: "yellow",
        stroke: "black",
        strokeThickness: 10,
    });
    textPlunder.position.set(50, 120);
    UI.HUD.textArea.addChild(textPlunder);
    UI.HUD.textArea.plunder = textPlunder;
    UI.HUD.textArea.zIndex = 9999;
    let textFinalScore =  new PIXI.Text("Final Score: " + Game.finalScore, {
        fontFamily: "Arial",
        fontSize: 60,
        fill: "white",
        stroke: "black",
        strokeThickness: 10,
    });
    textFinalScore.position.set(50, 190);
    UI.HUD.textArea.addChild(textFinalScore);
    UI.HUD.textArea.finalScore = textFinalScore;
    let textRank =  new PIXI.Text("Rank:\n" + Game.ranks.names[0], {
        fontFamily: "Arial",
        fontSize: 60,
        fill: "red",
        stroke: "black",
        strokeThickness: 10,
    });
    textRank.position.set(550, 90);
    UI.HUD.textArea.addChild(textRank);
    UI.HUD.textArea.rank = textRank;
    Game.PIXIApp.stage.addChild(UI.HUD.textArea);
}

function UpdateInterface(delta) {
    if(Game.context === 2) { // Game
        UpdateHealthBar();
        UpdateCannonCooldown();
        UpdateTextArea();
        UpdateUpgradeText("1", UI.HUD.textArea.health, Game.upgrades.health);
        UpdateUpgradeText("2", UI.HUD.textArea.speed, Game.upgrades.speed);
        UpdateUpgradeText("3", UI.HUD.textArea.cannon, Game.upgrades.cannonCooldown);
    } else if (Game.context === 3) { // Results Screen
        UpdateTextArea();
        let shiftSpeed = 1000;
        if(Game.score > 0) {
            let amount = Math.min(delta * shiftSpeed, Game.score);
            Game.score -= amount;
            Game.finalScore += amount;
            return;
        }
        if(Game.plunder > 0) {
            let amount = Math.min(delta * shiftSpeed, Game.plunder);
            Game.plunder -= amount;
            Game.finalScore += amount * Game.config.plunderToScoreRatio;
        }
    }
}

function UpdateHealthBar() {
    UI.HUD.healthBar.background.clear();
    UI.HUD.healthBar.background.beginFill(0x000000);
    UI.HUD.healthBar.background.drawRect(10, 10, Game.player.maxHP, 30);
    UI.HUD.healthBar.background.endFill();
    UI.HUD.healthBar.foreground.clear();
    UI.HUD.healthBar.foreground.beginFill(0xff0000);
    UI.HUD.healthBar.foreground.drawRect(10, 10, Game.player.currentHP, 30);
    UI.HUD.healthBar.foreground.endFill();
}

function UpdateCannonCooldown() {
    let width = 155;
    let height = 30;
    let spacing = 5;
    UI.HUD.cannonCooldown.background.clear();
    UI.HUD.cannonCooldown.background.beginFill(0x000000);
    UI.HUD.cannonCooldown.background.drawRect(10, 50, width, height);
    UI.HUD.cannonCooldown.background.endFill();
    UI.HUD.cannonCooldown.foreground.clear();
    UI.HUD.cannonCooldown.foreground.beginFill(0xaaaaaa);
    UI.HUD.cannonCooldown.foreground.drawRect(10 + spacing, 50 + spacing, (width - 2 * spacing) * (Game.player.cannonCooldown / Game.player.cannonCooldownTime), height - 2 * spacing);
    UI.HUD.cannonCooldown.foreground.endFill();
    UI.HUD.cannonCooldown.text.visible = Game.player.cannonCooldown <= 0;
}

function UpdateTextArea() {
    UI.HUD.textArea.score.text = "Score: " + Math.round(Game.score);
    UI.HUD.textArea.plunder.text = "Plunder: " + Math.round(Game.plunder);
    if(Game.context === 3) {
        UI.HUD.textArea.finalScore.text = "Final Score: " + Math.round(Game.finalScore);
        let rank = Game.ranks.names[0];
        for(let i = 0; i < Game.ranks.thresholds.length; i++) {
            if(Game.finalScore > Game.ranks.thresholds[i]) {
                rank = Game.ranks.names[i];
            }
        }
        UI.HUD.textArea.rank.text = "Rank:\n" + rank;
    }
}

function UpdateUpgradeText(key, text, upgrade) {
    let current = upgrade.display[upgrade.level + 1];
    let hasNext = upgrade.level + 1 < upgrade.values.length;
    text.text = key + ": " + upgrade.label + " " + current + (hasNext ? " -> " + upgrade.display[upgrade.level + 2] + " (" + upgrade.costs[upgrade.level + 1] + ")" : " (MAX)");
}

function ApplyTPS() {
    let tps = parseInt(UI.Elements.tps.value, 10);
    Game.SetSimulationTPS(Math.min(180, Math.max(0, tps)));
    UI.Elements.tps.value = tps;
}

function ApplyFPS() {
    let fps = parseInt(UI.Elements.fps.value, 10);
    Game.SetRenderFPS(Math.min(144, Math.max(0, fps)));
    UI.Elements.tps.value = fps;
}

function ApplyDeltas() {
    Game.SetStableDeltas(UI.Elements.deltas.checked);
}

function ApplyH() {
    ParticleDynamics.h = parseFloat(UI.Elements.hValue.value);
}

function ApplyEuler() {
    ParticleDynamics.eulerSolver = UI.Elements.euler.checked;
}

function ApplyForceLines() {
    if (UI.Elements.lines.checked) {
        ParticleDynamics.EnableForceLines();
    } else {
        ParticleDynamics.DisableForceLines();
    }
}

function ApplyPaths() {
    ParticleDynamics.SetDebugPaths(UI.Elements.paths.checked);
}

function ApplyFractureDebugPoints() {
    VoronoiFracture.debugShowPoints = UI.Elements.centers.checked;
}

function ApplyFractureDebugField() {
    VoronoiFracture.debugShowField = UI.Elements.cells.checked;
}

function ApplyNoised() {
    VoronoiFracture.noised = UI.Elements.noised.checked;
}

function ApplyFractureType() {
    VoronoiFracture.type = parseInt(UI.Elements.type.value);
}

function ApplyNoiseType() {
    VoronoiFracture.noiseType = parseInt(UI.Elements.noiseType.value);
}

function ApplyShowSplines() {
    PathInterpolation.debugShowLine = UI.Elements.splines.checked;
    PathInterpolation.ApplyDebug();
}

function ApplyShowSplinePoints() {
    PathInterpolation.debugShowPoints = UI.Elements.points.checked;
    PathInterpolation.ApplyDebug();
}

function ApplyShowSplineTable() {
    PathInterpolation.debugShowTable = UI.Elements.table.checked;
    PathInterpolation.ApplyDebug();
}

function TogglePause() {
    if (Game.paused) {
        Game.Unpause();
        UI.Elements.pause.innerText = "Pause";
        UI.Elements.step.disabled = true;
    } else {
        Game.Pause();
        UI.Elements.pause.innerText = "Unpause";
        UI.Elements.step.disabled = false;
    }
}

function Step() {
    Game.Step();
}