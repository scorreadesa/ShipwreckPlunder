class SceneNode
{
    constructor(x, y, rotation)
    {
        this.parent = undefined;
        this.children = [];
        this.position = new Vector2(x, y);
        this.absolutePosition = new Vector2(x, y);
        this.rotation = rotation;
        this.absoluteRotation = rotation;
    }

    addChild(node)
    {
        node.parent = this;
        this.children.push(node);
        node.update(0); // Zero-time update to set only positions
    }

    removeChild(node)
    {
        node.destroy();
        this.children = this.children.filter((v) => {
            return v !== node;
        });
    }

    update(delta)
    {
        this.updateSelf(delta);
        if(this.parent !== undefined) {
            let offset = this.position.clone();
            offset.rotate(this.parent.absoluteRotation);
            offset.add(this.parent.absolutePosition);
            this.absolutePosition = offset;
            this.absoluteRotation = this.parent.absoluteRotation + this.rotation;
        }
        this.children.forEach((child) => {
            child.update(delta);
        })
        this.updatePost();
    }

    updateSelf(delta) {

    }

    updatePost(delta) {

    }

    destroy() {
        this.children.forEach((child) => {
            this.removeChild(child);
        })
    }
}

class Plundertron extends SceneNode {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        let offset = 150;
        this.addChild(new PlundertronBarrel(offset, offset, -45));
        this.addChild(new PlundertronBarrel(-offset, -offset, 135));
        this.addChild(new PlundertronBarrel(-offset, offset, 45));
        this.addChild(new PlundertronBarrel(offset, -offset, 225));
    }
}

class PlundertronBarrel extends SceneNode {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.baseX = x;
        this.baseY = y;
        this.time = 0;
        this.sprite = new PIXI.Sprite(Game.Resources.barrel.texture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.5);
        this.sprite.zIndex = 999;
        Game.PIXIApp.stage.addChild(this.sprite);
        let offset = 100;
        this.addChild(new PlundertronBird(offset, 0, 90));
        this.addChild(new PlundertronBird(-offset, 0, -90));
    }

    updateSelf(delta) {
        this.time += delta;
        this.position.x = this.baseX + this.baseX * Math.sin(this.time) / 4;
        this.position.y = this.baseY + this.baseY * Math.sin(this.time) / 4;
        this.rotation += delta * 45;
    }

    updatePost(delta) {
        this.sprite.x = this.absolutePosition.x;
        this.sprite.y = this.absolutePosition.y;
        this.sprite.angle = this.absoluteRotation;
    }

    destroy() {
        super.destroy();
        Game.PIXIApp.stage.removeChild(this.sprite);
        this.sprite.destroy();
    }
}

class PlundertronBird extends SceneNode {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.time = 0;
        this.sprite = new PIXI.Sprite(Game.Resources.birdRed2.texture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.5);
        this.sprite.zIndex = 1000;
        Game.PIXIApp.stage.addChild(this.sprite);

        this.addChild(new PlundertronSmoke(0, 50, 0))
        this.addChild(new PlundertronSmoke(0, -50, 0))
    }

    updateSelf(delta) {
        this.time += delta;
    }

    updatePost(delta) {
        this.sprite.x = this.absolutePosition.x;
        this.sprite.y = this.absolutePosition.y;
        this.sprite.angle = this.absoluteRotation;
        if(this.time > 2) {
            this.time = 0;
            let dir = new Vector2(1, 0);
            dir.rotate(this.absoluteRotation);
            new Cannonball(this.absolutePosition.x, this.absolutePosition.y, dir, 10);
        }
    }

    destroy() {
        super.destroy();
        Game.PIXIApp.stage.removeChild(this.sprite);
        this.sprite.destroy();
    }
}

class PlundertronSmoke extends SceneNode {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.time = 0;
        this.sprite = new PIXI.Sprite(Game.Resources.smoke1.texture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.5);
        this.sprite.zIndex = 999;
        Game.PIXIApp.stage.addChild(this.sprite);
    }

    updateSelf(delta) {
        this.time += delta;
        this.rotation += delta * 360;
    }

    updatePost(delta) {
        this.sprite.scale.set(0.5 + Math.sin(this.time) * 0.25);
        this.sprite.x = this.absolutePosition.x;
        this.sprite.y = this.absolutePosition.y;
        this.sprite.angle = this.absoluteRotation;
    }

    destroy() {
        super.destroy();
        Game.PIXIApp.stage.removeChild(this.sprite);
        this.sprite.destroy();
    }
}