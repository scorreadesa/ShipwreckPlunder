class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let mag = this.magnitude();
        if (mag > 0) {
            this.x = this.x / mag;
            this.y = this.y / mag;
        }
    }

    normalized() {
        let mag = this.magnitude();
        if (mag > 0) {
            return new Vector2(this.x / mag, this.y / mag);
        } else {
            return new Vector2(0, 0);
        }
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    subtract(other) {
        this.x -= other.x;
        this.y -= other.y;
    }

    addPure(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtractPure(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    scalarMultiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    vectorMultiply(other) {
        this.x *= other.x;
        this.y *= other.y;
    }

    scalarDivide(scalar) {
        this.x /= scalar;
        this.y /= scalar;
    }
}