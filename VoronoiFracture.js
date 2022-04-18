VoronoiFracture = {}
VoronoiFracture.debugShowPoints = true;
VoronoiFracture.debugShowField = true;
VoronoiFracture.ImageBuffer = {};

VoronoiFracture.FractureSprite = FractureSprite;
VoronoiFracture.RegisterTexture = RegisterTexture;

function RegisterTexture(name, path) {
    let img = new Image();
    img.src = path;
    img.addEventListener("load", () => {
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        VoronoiFracture.ImageBuffer[name] = new ImageDataWrapper(context.getImageData(0, 0, img.naturalWidth, img.naturalHeight));
    })
}

function FractureSprite(sprite, textureName) {
    let width = sprite.width;
    let height = sprite.height;
    let cells = [];
    let data = VoronoiFracture.ImageBuffer[textureName];

    // TODO: Split into separate methods for different scattering approaches
    for (let i = 0; i < 15; i++) {
        cells.push(new VoronoiCell(Math.round(Math.random() * height), Math.round(Math.random() * width), RandomColor()));
    }

    let pixels = [];
    let indices = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let closest = FindClosest(x, y, cells);
            cells[closest].updateBounds(x, y);
            pixels.push(cells[closest].color); // TODO: Check for debug option
            indices.push(closest);
        }
    }

    // TODO: Apply Noise. Need to re-sample bounds for cells.

    cells.forEach((cell) => {
        cell.createEmptyPixels();
    })

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            cells[indices[y * width + x]].setPixel(x, y, data.pixel(x, y).toABGR());
        }
    }

    let s = SpriteFromPixels(pixels, width, height);
    s.x = sprite.x;
    s.y = sprite.y;
    s.angle = sprite.angle;
    s.anchor = sprite.anchor;
    Game.PIXIApp.stage.addChild(s);

    cells.forEach((cell) => {
        if (cell.pixels === undefined) {
            return;
        }
        let s = SpriteFromPixels(cell.pixels, cell.maxX - cell.minX + 1, cell.maxY - cell.minY + 1);
        //Debug.DrawLine(sprite.x, sprite.y, sprite.x + cell.seed.y - width / 2, sprite.y + cell.seed.x - height / 2, 5000);
        s.anchor.set((cell.seed.y - cell.minX) / (cell.maxX - cell.minX), (cell.seed.x - cell.minY) / (cell.maxY - cell.minY));
        // TODO: Apply rotations
        let x = sprite.x + cell.seed.y - width / 2;
        let y = sprite.y + cell.seed.x - height / 2;
        let fade = 3;
        let frag = new Fragment(x, y, s, fade);
        Game.Objects.push(frag);
        setTimeout(() => {
            Game.Objects.filter((obj) => {return obj !== frag})
            frag.destroy();
        }, fade * 1000);
    })
}

function SpriteFromPixels(pixels, width, height) {
    let colorValues = Uint32Array.from(pixels);
    let u8 = new Uint8Array(colorValues.buffer);
    let br = new PIXI.BufferResource(u8, {width: width, height: height});
    let bt = new PIXI.BaseTexture(br);
    let texture = new PIXI.Texture(bt);
    return new PIXI.Sprite(texture);
}

function FindClosest(x, y, cells) {
    let best = -1;
    let dist = 99999999999;
    cells.forEach((cell, i) => {
        let pos = new Vector2(y, x);
        pos.subtract(cell.seed);
        let d = pos.magnitude();
        if (d < dist) {
            best = i;
            dist = d;
        }
    })
    return best;
}

function RandomColor() {
    let r = Math.floor(256 * Math.random());
    let g = Math.floor(256 * Math.random());
    let b = Math.floor(256 * Math.random());
    return 255 * 256 * 256 * 256 + r * 256 * 256 + g * 256 + b; // It's ARGB internally
}

//////////
// Classes

class VoronoiCell {
    constructor(x, y, color) {
        this.seed = new Vector2(x, y);
        this.color = color;
        this.minX = 99999999;
        this.minY = 99999999;
        this.maxX = -1;
        this.maxY = -1;
        this.pixels = undefined;
    }

    updateBounds(x, y) {
        if (x < this.minX) {
            this.minX = x;
        }
        if (x > this.maxX) {
            this.maxX = x;
        }
        if (y < this.minY) {
            this.minY = y;
        }
        if (y > this.maxY) {
            this.maxY = y;
        }
    }

    width() {
        return this.maxX - this.minX;
    }

    height() {
        return this.maxY - this.minY;
    }

    createEmptyPixels() {
        let length = (this.width() + 1) * (this.height() + 1);
        try {
            this.pixels = Array.apply(null, Array(length)).map(() => {
                return 0
            });
        } catch (err) {
            console.log("Create Empty Pixels Error: " + err);
        }
    }

    setPixel(x, y, color) {
        let loc = (y - this.minY) * (this.width() + 1) + (x - this.minX);
        this.pixels[loc] = color;
    }
}

class ImageDataWrapper {
    constructor(data) {
        this.data = data;
    }

    pixel(x, y) {
        let start = (y * this.data.width + x) * 4;
        return new ImagePixel(this.data.data[start++], this.data.data[start++], this.data.data[start++], this.data.data[start]);
    }
}

class ImagePixel {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    isTransparent() {
        return this.a === 0;
    }

    toABGR() {
        return this.a * 256 * 256 * 256 + this.b * 256 * 256 + this.g * 256 + this.r;
    }
}