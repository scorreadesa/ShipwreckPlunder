Debug = {};
Debug.DrawLine = DrawLine;

function DrawLine(xf, yf, xt, yt, duration) {
    let graphics = new PIXI.Graphics();
    graphics.lineStyle({width: 1, color: 0xFF0000});
    graphics.zIndex = 9999;
    graphics.moveTo(xf, yf);
    graphics.lineTo(xt, yt);
    Game.PIXIApp.stage.addChild(graphics);
    setTimeout(() => {
        Game.PIXIApp.stage.removeChild(graphics);
        graphics.destroy();
    }, duration)
}