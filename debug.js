Debug = {};
Debug.DrawLine = DrawLine;
Debug.DrawDot = DrawDot;

function DrawLine(xf, yf, xt, yt, duration, color = 0xFF0000) {
    let graphics = new PIXI.Graphics();
    graphics.lineStyle({width: 1, color: color});
    graphics.zIndex = 9999;
    graphics.moveTo(xf, yf);
    graphics.lineTo(xt, yt);
    Game.PIXIApp.stage.addChild(graphics);
    setTimeout(() => {
        Game.PIXIApp.stage.removeChild(graphics);
        graphics.destroy();
    }, duration)
}

function DrawDot(x, y, radius, duration, color = 0xFF0000) {
    let graphics = new PIXI.Graphics();
    graphics.zIndex = 9999;
    graphics.beginFill(color);
    graphics.drawCircle(x, y, radius);
    graphics.endFill();
    Game.PIXIApp.stage.addChild(graphics);
    setTimeout(() => {
        Game.PIXIApp.stage.removeChild(graphics);
        graphics.destroy();
    }, duration)
}