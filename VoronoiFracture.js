VoronoiFracture = {}
VoronoiFracture.debugShowPoints = true;
VoronoiFracture.debugShowField = true;
VoronoiFracture.ImageBuffer = {};
VoronoiFracture.noised = true;
VoronoiFracture.noiseScale = 25;
VoronoiFracture.noiseImpact = 3.5;

VoronoiFracture.FractureSprite = FractureSprite;
VoronoiFracture.RegisterTexture = RegisterTexture;

function RegisterTexture(name, path) {
    let img = new Image();
    img.src = path;
    img.addEventListener("load", () => {
        let canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        let context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        VoronoiFracture.ImageBuffer[name] = new ImageDataWrapper(context.getImageData(0, 0, img.naturalWidth, img.naturalHeight));
    })
}

function FractureSprite(sprite, textureName) {
    let time = window.performance.now();
    let width = sprite.width;
    let height = sprite.height;
    let cells = [];
    let data = VoronoiFracture.ImageBuffer[textureName];
    noise.seed(Math.random());

    // TODO: Split into separate methods for different scattering approaches
    for (let i = 0; i < 50; i++) {
        cells.push(new VoronoiCell(Math.random() * height, Math.random() * width, RandomColor()));
    }

    let init = window.performance.now() - time;

    let pixels = [];
    let indices = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let closest = -1;
            let second = -1;
            let dist = Number.MAX_VALUE;
            let distSecond = Number.MAX_VALUE;
            for (let i = 0; i < cells.length; i++) {
                let d = Distance(cells[i].seed.x, cells[i].seed.y, x, y);
                if (d < dist) {
                    second = closest;
                    distSecond = dist;
                    closest = i;
                    dist = d;
                } else if (d < second && d !== dist) {
                    second = i;
                    distSecond = d;
                }
            }

            if (VoronoiFracture.noised && second >= 0) {
                let value = noise.perlin2(x / width * VoronoiFracture.noiseScale, y / height * VoronoiFracture.noiseScale);
                dist += value * VoronoiFracture.noiseImpact;
                distSecond -= value * VoronoiFracture.noiseImpact;
                if(distSecond < dist)
                {
                    closest = second;
                }
            }

            cells[closest].updateBounds(x, y);
            pixels.push(cells[closest].color); // TODO: Check for debug option
            indices.push(closest);
        }
    }

    let closestt = window.performance.now() - time;

    cells.forEach((cell) => {
        cell.createEmptyPixels();
    })

    let empty = window.performance.now() - time;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            cells[indices[y * width + x]].setPixel(x, y, data.pixel(x, y).toABGR());
        }
    }

    let set = window.performance.now() - time;

    let s = SpriteFromPixels(pixels, width, height);
    s.x = sprite.x;
    s.y = sprite.y;
    s.angle = sprite.angle;
    s.anchor = sprite.anchor;
    Game.PIXIApp.stage.addChild(s);

    cells.forEach((cell) => {
        CreateFragment(cell, sprite, width, height);
    })

    let sprites = window.performance.now() - time;

    console.log("Init " + (init))
    console.log("Closest " + (closestt - init))
    console.log("Empty " + (empty - closestt))
    console.log("Set " + (set - closestt))
    console.log("Sprites " + (sprites - set))
}

function Distance(a, b, x, y) {
    let xDist = a - x;
    let yDist = b - y;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

function CreateFragment(cell, sprite, width, height) {
    if (cell.pixels.length === 0) {
        return;
    }
    let s = SpriteFromPixels(cell.pixels, cell.maxX - cell.minX + 1, cell.maxY - cell.minY + 1);
    //Debug.DrawLine(sprite.x, sprite.y, sprite.x + cell.seed.y - width / 2, sprite.y + cell.seed.x - height / 2, 5000);
    s.anchor.set((cell.seed.y - cell.minX) / (cell.maxX - cell.minX + 1), (cell.seed.x - cell.minY) / (cell.maxY - cell.minY + 1));
    // TODO: Apply rotations
    let x = sprite.x + cell.seed.y - width / 2;
    let y = sprite.y + cell.seed.x - height / 2;
    let fade = 5;
    let frag = new Fragment(x, y, s, fade);
    setTimeout(() => {
        frag.destroy();
    }, fade * 1000);
}

function SpriteFromPixels(pixels, width, height) {
    let colorValues = Uint32Array.from(pixels);
    let u8 = new Uint8Array(colorValues.buffer);
    let br = new PIXI.BufferResource(u8, {width: width, height: height});
    let bt = new PIXI.BaseTexture(br);
    let texture = new PIXI.Texture(bt);
    return new PIXI.Sprite(texture);
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
        this.pixels = [];
        if (this.width() <= 0 || this.height() <= 0) {
            console.log("Yeah")
            return;
        }
        let length = (this.width() + 1) * (this.height() + 1);
        for (let i = 0; i < length; i++) {
            this.pixels.push(0);
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