VoronoiFracture = {}
VoronoiFracture.debugShowPoints = true;
VoronoiFracture.debugShowField = true;
VoronoiFracture.noised = false;
VoronoiFracture.type = 1;
VoronoiFracture.ImageBuffer = {};
VoronoiFracture.octaves = 4;
VoronoiFracture.scale = 0.2;
VoronoiFracture.persistence = 0.5;
VoronoiFracture.lacunarity = 2.1;
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

function FractureSprite(sprite, textureName, point, force) {
    let time = window.performance.now();
    let data = VoronoiFracture.ImageBuffer[textureName];
    let width = data.data.width; //sprite.width;
    let height = data.data.height; //sprite.height;
    let cells;
    let center;

    noise.seed(Math.random());

    if (VoronoiFracture.type === 0) {
        cells = RandomPoints(width, height, 15);
        center = new Vector2(sprite.x, sprite.y);
    } else if (VoronoiFracture.type === 1) {
        let offset = new Vector2(point.x - sprite.x, point.y - sprite.y);
        offset.scalarMultiply(1 / sprite.scale.x);
        offset.rotate(-sprite.angle);
        cells = ShatterPoints(width, height, 25, new Vector2(offset.x + width / 2, offset.y + height / 2));
        center = point;
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
                let value = OctaveNoise(x / width, y / height, VoronoiFracture.octaves, VoronoiFracture.scale, VoronoiFracture.persistence, VoronoiFracture.lacunarity);
                dist += value * VoronoiFracture.noiseImpact * sprite.scale.x; // Assuming uniformly scaled sprites
                distSecond -= value * VoronoiFracture.noiseImpact * sprite.scale.x;
                if (distSecond < dist) {
                    closest = second;
                }
            }

            cells[closest].updateBounds(x, y);
            if (VoronoiFracture.debugShowField) {
                pixels.push(cells[closest].color);
                //pixels.push(Grayscale(OctaveNoise(x / width, y / height, 3, 0.1, 0.5, 2.1) * 0.5));
            }
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

    if (VoronoiFracture.debugShowField) {
        let s = SpriteFromPixels(pixels, width, height);
        s.x = sprite.x;
        s.y = sprite.y;
        s.angle = sprite.angle;
        s.anchor = sprite.anchor;
        s.scale = sprite.scale;
        Game.PIXIApp.stage.addChild(s);

        setTimeout(() => {
            Game.PIXIApp.stage.removeChild(s);
            s.destroy(true);
        }, 5000)
    }

    cells.forEach((cell) => {
        if (cell.pixels.length === 0) {
            return;
        }

        let s = SpriteFromPixels(cell.pixels, cell.maxX - cell.minX + 1, cell.maxY - cell.minY + 1);
        let offset = new Vector2(cell.seed.x - width / 2, cell.seed.y - height / 2);
        offset.scalarMultiply(sprite.scale.x);
        offset.rotate(sprite.angle);

        if (VoronoiFracture.debugShowPoints) {
            //Debug.DrawLine(sprite.x, sprite.y, sprite.x + offset.x, sprite.y + offset.y, 5000);
            Debug.DrawDot(sprite.x + offset.x, sprite.y + offset.y, 1.5, 50000);
        }
        s.anchor.set((cell.seed.x - cell.minX) / (cell.maxX - cell.minX + 1), (cell.seed.y - cell.minY) / (cell.maxY - cell.minY + 1));
        s.angle = sprite.angle;
        s.scale = sprite.scale;

        let x = sprite.x + offset.x;
        let y = sprite.y + offset.y;
        let fade = 5;

        let frag = new Fragment(x, y, s, fade);

        let forceVector = new Vector2(x - center.x, y - center.y);
        forceVector.normalize();
        forceVector.scalarMultiply(force);
        frag.particle.vel = forceVector;

        setTimeout(() => {
            frag.destroy();
        }, fade * 1000);
    })

    let sprites = window.performance.now() - time;

    console.log("Init " + (init))
    console.log("Closest " + (closestt - init))
    console.log("Empty " + (empty - closestt))
    console.log("Set " + (set - closestt))
    console.log("Sprites " + (sprites - set))
}

function RandomPoints(width, height, amount) {
    let cells = [];
    for (let i = 0; i < amount; i++) {
        cells.push(new VoronoiCell(Math.random() * height, Math.random() * width, RandomColor()));
    }
    return cells;
}

function ShatterPoints(width, height, amount, point)
{
    let cells = [];
    let radius = Math.max(width, height) * 0.5;
    let innerRatio = 0.75;
    let innerRing = radius * innerRatio;
    let innerCells = Math.floor(amount / 2);
    let angle = 0;

    while (angle < 360)
    {
        let vector = new Vector2(0, 1);
        angle += (360 / innerCells) * 0.5 + (360 / innerCells) * 0.5 * (Math.random() * 2);
        vector.rotate(angle);
        vector.scalarMultiply(innerRing);
        vector.add(point);
        cells.push(new VoronoiCell(vector.x, vector.y, RandomColor()));
        amount--;
    }

    while(amount > 0)
    {
        let vector = new Vector2(0, 1);
        vector.rotate(Math.random() * 360);
        vector.scalarMultiply(innerRing + radius * Math.random());
        vector.add(point);
        if(vector.x < 0 || vector.y < 0 || vector.x > width || vector.y > height) {
            continue;
        }
        cells.push(new VoronoiCell(vector.x, vector.y, RandomColor()));
        amount--;
    }
    return cells;
}

function Distance(a, b, x, y) {
    let xDist = a - x;
    let yDist = b - y;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

function OctaveNoise(x, y, octaves, scale, persistence, lacunarity) {
    let amplitude = 1;
    let frequency = 1;
    let cumulative = 0;

    for (let o = 0; o < octaves; o++) {
        let sample = noise.perlin2(x / scale * frequency, y / scale * frequency);
        cumulative += sample;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return cumulative;
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
    let r = Math.floor(255 * Math.random());
    let g = Math.floor(256 * Math.random());
    let b = Math.floor(256 * Math.random());
    return 255 * 256 * 256 * 256 + r * 256 * 256 + g * 256 + b; // It's ARGB internally
}

function Grayscale(value) {
    value = Math.min(1, Math.max(0, (value + 1) / 2));
    let v = Math.floor(255 * value);
    return 255 * 256 * 256 * 256 + v * 256 * 256 + v * 256 + v;
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