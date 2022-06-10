PathInterpolation = {};
PathInterpolation.debugShowLine = false;
PathInterpolation.debugShowPoints = false;
PathInterpolation.debugShowTable = false;
PathInterpolation.ApplyDebug = ApplyDebug;

PathInterpolation.Splines = [];

function ApplyDebug() {
    PathInterpolation.Splines.forEach((spline) => {
        spline.applyDrawing();
    })
}

class CatmullRomError extends Error {
    constructor(message) {
        super(message);
        this.name = "CatmullRomError";
    }
}

class ArcLengthTable {
    constructor() {
        this.parametric_arclength_map = [];
    }

    show() {
        console.log("index | parametric value | arc length")
        for (let i = 0; i < this.parametric_arclength_map.length; i++) {
            console.log(JSON.stringify(this.parametric_arclength_map[i]));
        }
    }

    add(parametric_value, arc_length_value) {
        let lookup_entry = {};
        lookup_entry.parametric_value = parametric_value;
        lookup_entry.arc_length_value = arc_length_value;
        this.parametric_arclength_map.push(lookup_entry);
    }

    bsearchClosest(val) {
        let first = this.parametric_arclength_map[0].arc_length_value;
        let last = this.parametric_arclength_map[this.parametric_arclength_map.length - 1].arc_length_value;
        if (val < first || val > last) {
            return undefined;
        }

        let answer = {}

        let lower = 0, upper = this.parametric_arclength_map.length - 1;

        while (lower <= upper) {
            let mid = Math.floor((lower + upper) / 2);
            let found = this.parametric_arclength_map[mid];
            let next = this.parametric_arclength_map[mid + 1];
            if (val >= found.arc_length_value && val <= next.arc_length_value) {
                answer.idx = mid;
                answer.parametric_value = found.parametric_value;
                answer.arc_length_value = found.arc_length_value;
                break;
            } else if (found.arc_length_value < val) {
                lower = mid + 1;
            } else {
                upper = mid - 1;
            }
        }

        return answer;
    }

    tableLookup(pt) {
        let ans = this.bsearchClosest(pt);
        let ret = undefined

        if (ans !== undefined) {
            if (ans.arc_length_value !== pt && ans.idx < this.parametric_arclength_map.length - 1) {
                let next_val = this.parametric_arclength_map[ans.idx + 1];
                let inverse_lerp_value = (pt - ans.arc_length_value) / (next_val.arc_length_value - ans.arc_length_value);
                let interpolated_param = (1 - inverse_lerp_value) * ans.parametric_value + inverse_lerp_value * next_val.parametric_value;
                let integer_part = Math.floor(interpolated_param);
                let t = interpolated_param - integer_part;
                ret = {};
                ret.idx = integer_part;
                ret.t = t;
            } else {
                let integer_part = Math.floor(ans.parametric_value);
                let t = ans.parametric_value - integer_part;
                ret = {};
                ret.idx = integer_part;
                ret.t = t;
            }

            return ret;
        }
    }
}

class CatmullRom {
    constructor(draw_step = 0.1, tau = 0.5) {
        this.points = [];
        this.draw_step = draw_step;
        this.tau = tau;
        this.arcLengthTable = new ArcLengthTable();
        this.lineSegments = [];
        this.controlPoints = [];
        this.tablePoints = [];
        PathInterpolation.Splines.push(this);
    }

    destroy() {
        if(PathInterpolation.debugShowLine) {
            this.lineSegments.forEach((obj) => {
                Game.PIXIApp.stage.removeChild(obj);
                obj.destroy();
            })
        }
        if(PathInterpolation.debugShowPoints) {
            this.controlPoints.forEach((obj) => {
                Game.PIXIApp.stage.removeChild(obj);
                obj.destroy();
            })
        }
        if(PathInterpolation.debugShowTable) {
            this.tablePoints.forEach((obj) => {
                Game.PIXIApp.stage.removeChild(obj);
                obj.destroy();
            })
        }
        PathInterpolation.Splines = PathInterpolation.Splines.filter((v) => {
            return v !== this
        });
    }

    applyDrawing() {
        if(PathInterpolation.debugShowLine) {
            this.lineSegments.forEach((obj) => {
                Game.PIXIApp.stage.addChild(obj);
            })
        } else {
            this.lineSegments.forEach((obj) => {
                Game.PIXIApp.stage.removeChild(obj);
            })
        }
        if(PathInterpolation.debugShowPoints) {
            this.controlPoints.forEach((obj) => {
                Game.PIXIApp.stage.addChild(obj);
            })
        } else {
            this.controlPoints.forEach((obj) => {
                Game.PIXIApp.stage.removeChild(obj);
            })
        }
        if(PathInterpolation.debugShowTable) {
            this.tablePoints.forEach((obj) => {
                Game.PIXIApp.stage.addChild(obj);
            })
        } else {
            this.tablePoints.forEach((obj) => {
                Game.PIXIApp.stage.removeChild(obj);
            })
        }
    }

    lookUp(pt) {
        let ret = this.arcLengthTable.tableLookup(pt);
        if (ret !== undefined) {
            let prev = this.points[ret.idx - 1];
            let current = this.points[ret.idx];
            let next = this.points[ret.idx + 1];
            let last = this.points[ret.idx + 2];
            return this.interpolateBetween(prev, current, next, last, ret.t, this.tau);
        }
        return undefined;
    }

    computeArcLengthTable() {
        if (this.points.length >= 4) {
            let accumulated_chord_length = 0.0;
            for (let i = 1; i < this.points.length - 2; i++) {
                let prev_pt = this.points[i - 1];
                let current_pt = this.points[i];
                let next_pt = this.points[i + 1];
                let last_pt = this.points[i + 2];

                let old_point = current_pt;

                for (let start = 0.0; start <= 1.0; start += this.draw_step) {
                    let new_point = this.interpolateBetween(prev_pt, current_pt, next_pt, last_pt, start, this.tau);
                    let chord_length = (new_point.subtractPure(old_point)).magnitude();
                    accumulated_chord_length += chord_length;
                    let param_value = i + start;
                    this.arcLengthTable.add(param_value, accumulated_chord_length);
                    old_point = new_point;
                }
            }
            this.createTableSamples();
        }
    }

    createTableSamples() {
        let sample = 0;
        while(true) {
            let point = this.lookUp(sample);
            if(point === undefined) {
                break;
            }
            let arcGraph = new PIXI.Graphics();
            arcGraph.zIndex = 100001;
            arcGraph.beginFill(0xFFFF00);
            arcGraph.drawCircle(point.x, point.y, 2);
            arcGraph.endFill();
            this.tablePoints.push(arcGraph);
            sample += 50;
        }
    }

    interpolateBetween(p0, p1, p2, p3, t, tau) {
        let pt = new Vector2(0, 0);

        pt.x = (
            (p1.x) +
            (-tau * p0.x + tau * p2.x) * t +
            (2 * tau * p0.x + (tau - 3) * p1.x + (3 - 2 * tau) * p2.x + -tau * p3.x) * t * t +
            (-tau * p0.x + (2 - tau) * p1.x + (tau - 2) * p2.x + tau * p3.x) * t * t * t);

        pt.y = (
            (p1.y) +
            (-tau * p0.y + tau * p2.y) * t +
            (2 * tau * p0.y + (tau - 3) * p1.y + (3 - 2 * tau) * p2.y + -tau * p3.y) * t * t +
            (-tau * p0.y + (2 - tau) * p1.y + (tau - 2) * p2.y + tau * p3.y) * t * t * t);

        return pt;
    }

    createLineSegments() {
        if (this.points.length >= 4) {
            this.computeArcLengthTable();
            let where = 0;
            let l = new PIXI.Graphics();
            l.zIndex = 99999;
            l.lineStyle({width: 1, color: 0x00FF00})
            let point = this.lookUp(where);
            l.moveTo(point.x, point.y);
            while (true) {
                where += 5;
                point = this.lookUp(where);
                if (point === undefined) {
                    break;
                }
                l.lineTo(point.x, point.y);
            }
            this.lineSegments.push(l);
        }

        this.applyDrawing(); // Method is called once path is finalized
    }

    addPoint(point) {
        if (!(point instanceof Vector2)) {
            throw new CatmullRomError("expected type Vector2, got: " + typeof (point));
        }

        this.points.push(point);
        let pointGraph = new PIXI.Graphics();
        pointGraph.zIndex = 100000;
        pointGraph.beginFill(0xFF00FF);
        pointGraph.drawCircle(point.x, point.y, 5);
        pointGraph.endFill();
        this.controlPoints.push(pointGraph);
    }

    addPoints(points) {
        for (const point of points) {
            if (!(point instanceof Vector2)) {
                throw new CatmullRomError("expected type Vector2, got: " + typeof (point));
            }

            this.addPoint(point);
        }
    }
}