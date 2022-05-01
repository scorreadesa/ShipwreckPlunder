UI = {};
UI.Init = Init;
UI.UpdateInterface = UpdateInterface;
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

UI.Elements = {};

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
}

function UpdateInterface() {

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