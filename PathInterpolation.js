class CatmullRomError extends Error
{
    constructor(message) {
        super(message);
        this.name = "CatmullRomError";
    }
}

class ArcLengthTable {
    constructor()
    {
        this.parametric_arclength_map = [];
    }

    getNSamplesFromTable(n)
    {
        let samples = [];
        let end = n >= this.parametric_arclength_map.length ? this.parametric_arclength_map.length - 1 : n;
        for(let start = 0; start < end; start++)
        {
            samples.push(this.parametric_arclength_map[start]);
        }
        return samples;
    }

    show()
    {
        console.log("index | parametric value | arc length")
        for(let i = 0; i < this.parametric_arclength_map.length; i++)
        {
            console.log(JSON.stringify(this.parametric_arclength_map[i]));
        }
    }

    add(parametric_value, arc_length_value)
    {
        let lookup_entry = {};
        lookup_entry.parametric_value = parametric_value;
        lookup_entry.arc_length_value = arc_length_value;
        this.parametric_arclength_map.push(lookup_entry);
    }

    bsearchClosest(val)
    {
        let first = this.parametric_arclength_map[0].arc_length_value;
        let last = this.parametric_arclength_map[this.parametric_arclength_map.length - 1].arc_length_value;
        if(val < first || val > last)
        {
            return undefined;
        }

        let answer = {}
        answer.best_distance = Math.abs(val - this.parametric_arclength_map[0].arc_length_value);
        answer.idx = 0;
        answer.parametric_value = this.parametric_arclength_map[0].parametric_value;
        answer.arc_length_value = this.parametric_arclength_map[0].arc_length_value;

        let lower = 0, upper = this.parametric_arclength_map.length - 1;

        while(lower <= upper)
        {
            let mid = Math.floor((lower + upper) / 2);
            let found = this.parametric_arclength_map[mid];
            let distance = Math.abs(val - found.arc_length_value);
            if(distance < answer.best_distance)
            {
                answer.best_distance = distance;
                answer.idx = mid;
                answer.parametric_value = found.parametric_value;
                answer.arc_length_value = found.arc_length_value;
            }
            else if(found.arc_length_value < val)
            {
                lower = mid + 1;
            }
            else
            {
                upper = mid - 1;
            }
        }

        return answer;
    }

    withinEpsilon(a, b, eps=1e-6)
    {
        return Math.abs(a - b) < eps;
    }

    tableLookup(pt)
    {
        let ans = this.bsearchClosest(pt);
        let ret = undefined

        if(ans !== undefined)
        {
            if (ans.arc_length_value !== pt && ans.idx < this.parametric_arclength_map.length - 1)
            {
                let next_val = this.parametric_arclength_map[ans.idx + 1];
                //let interpolated_arc_length = (ans.arc_length_value + next_val.arc_length_value) / 2;
                let interpolated_param = (ans.parametric_value + next_val.parametric_value) / 2;
                let integer_part = Math.floor(interpolated_param);
                let t = interpolated_param - integer_part;
                ret = {};
                ret.idx = integer_part;
                ret.t = t;
            }
            else
            {
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
    constructor(draw_step=0.001)
    {
        this.points = [];
        this.current_drawn_point_idx = 1;
        this.draw_step = draw_step;
        this.arcLengthTable = new ArcLengthTable();
        this.curve_length = 0.0;
    }

    showArcLengthSamples(n)
    {
        let samples = this.arcLengthTable.getNSamplesFromTable(n);
        for(let start = 0; start < samples.length; start++)
        {
            let pt = this.lookUp(samples[start].arc_length_value);
            console.log(JSON.stringify(samples[start]), JSON.stringify(pt));
        }
    }

    computeCurveLength()
    {
        if(this.points.length >= 4)
        {
            let total_length = 0.0;
            for(let i = 1; i < this.points.length - 2; i++)
            {
                let prev_pt = this.points[i - 1];
                let current_pt = this.points[i];
                let next_pt = this.points[i + 1];
                let last_pt = this.points[i + 2];

                let old_point = current_pt;
                for(let start = 0; start <= 1.0; start += this.draw_step)
                {
                    let new_point = this.interpolateBetween(prev_pt, current_pt, next_pt, last_pt, start, 0.5);
                    let chord_length = (new_point.subtractPure(old_point)).magnitude();
                    total_length += chord_length;
                    //console.log(JSON.stringify(old_point), JSON.stringify(new_point), chord_length, total_length);
                    old_point = new_point;
                }
            }

            return total_length;
        }
        else {
            return 0.0;
        }
    }

    lookUp(pt)
    {
        let ret = this.arcLengthTable.tableLookup(pt);
        if(ret !== undefined)
        {
            let prev = this.points[ret.idx - 1];
            let current = this.points[ret.idx];
            let next = this.points[ret.idx + 1];
            let last = this.points[ret.idx + 2];
            return this.interpolateBetween(prev, current, next, last, ret.t, 0.5);
        }
        return undefined;
    }

    computeArcLengthTable()
    {
        if(this.points.length >= 4 && this.curve_length > 0.0)
        {
            let accumulated_chord_length = 0.0;
            for(let i = 1; i < this.points.length - 2; i++)
            {
                let prev_pt = this.points[i - 1];
                let current_pt = this.points[i];
                let next_pt = this.points[i + 1];
                let last_pt = this.points[i + 2];

                let old_point = current_pt;

                for(let start = 0.0; start <= 1.0; start += this.draw_step)
                {
                    let new_point = this.interpolateBetween(prev_pt, current_pt, next_pt, last_pt, start, 0.5);
                    let chord_length = (new_point.subtractPure(old_point)).magnitude();
                    accumulated_chord_length += chord_length;
                    let param_value = i + start;
                    this.arcLengthTable.add(param_value, accumulated_chord_length);
                    old_point = new_point;
                }
            }
        }
    }

    interpolateBetween(p0, p1, p2, p3, t, tau)
    {
        let pt = new Vector2(0, 0);

        pt.x = tau * (
            (2.0 * p1.x) +
            (-p0.x + p2.x) * t +
            (2.0 * p0.x - 5.0 * p1.x + 4.0 * p2.x - p3.x) * t * t +
            (-p0.x + 3.0 * p1.x - 3.0 * p2.x + p3.x) * t * t * t
        );

        pt.y = tau * (
            (2.0 * p1.y) +
            (-p0.y + p2.y) * t +
            (2.0 * p0.y - 5.0 * p1.y + 4.0 * p2.y - p3.y) * t * t +
            (-p0.y + 3.0 * p1.y - 3.0 * p2.y + p3.y) * t * t * t
        );

        return pt;
    }

    interpolateAt(t, tau)
    {

        let p0 = this.points[this.current_drawn_point_idx - 1];
        let p1 = this.points[this.current_drawn_point_idx];
        let p2 = this.points[this.current_drawn_point_idx + 1];
        let p3 = this.points[this.current_drawn_point_idx + 2];

        let pt = new Vector2(0, 0);

        pt.x = tau * (
            (2.0 * p1.x) +
            (-p0.x + p2.x) * t +
            (2.0 * p0.x - 5.0 * p1.x + 4.0 * p2.x - p3.x) * t * t +
            (-p0.x + 3.0 * p1.x - 3.0 * p2.x + p3.x) * t * t * t
        );

        pt.y = tau * (
            (2.0 * p1.y) +
            (-p0.y + p2.y) * t +
            (2.0 * p0.y - 5.0 * p1.y + 4.0 * p2.y - p3.y) * t * t +
            (-p0.y + 3.0 * p1.y - 3.0 * p2.y + p3.y) * t * t * t
        );

        return pt;
    }

    draw()
    {
        // draw the points
        if(this.points.length >= 4) {

            // draw the curve
            let last_point_idx = this.points.length - 2;
            for (let idx = this.current_drawn_point_idx; idx < last_point_idx; idx++) {
                let old_pt = this.points[idx];

                for (let start = 0.0; start <= 1.0; start += this.draw_step) {
                    let new_pt = this.interpolateAt(start, 0.5);
                    //console.log("drawn_point: ", JSON.stringify(new_pt));
                    Game.graphics.beginFill(0xff0000);
                    Game.graphics.drawCircle(new_pt.x, new_pt.y, 2.5);
                    //Game.graphics.lineStyle(1, 0xff0000).moveTo(old_pt.x, old_pt.y).lineTo(new_pt.x, new_pt.y);
                    old_pt = new_pt;
                    Game.graphics.endFill();
                }

                this.current_drawn_point_idx++;
            }
        }
    }

    addPoint(point, debug=false)
    {
        if(!(point instanceof Vector2))
        {
            throw new CatmullRomError("expected type Vector2, got: " + typeof(point));
        }

        this.points.push(point);

        if(this.points.length >= 4)
        {
            this.curve_length = this.computeCurveLength();
            this.computeArcLengthTable();
            if(debug)
            {
                this.arcLengthTable.show();
                let test = this.lookUp(0.0)
                console.log(JSON.stringify(test));
                test = this.lookUp(321.0);
                console.log(JSON.stringify(test));
                test = this.lookUp(237.61);
                console.log(JSON.stringify(test));
                test = this.lookUp(321.024);
                console.log(JSON.stringify(test));
            }
        }
    }

    addPoints(points, debug=false)
    {
        for(const point of points)
        {
            if(!(point instanceof Vector2))
            {
                throw new CatmullRomError("expected type Vector2, got: " + typeof(point));
            }

            this.points.push(point);
        }

        if(this.points.length >= 4)
        {
            this.curve_length = this.computeCurveLength();
            this.computeArcLengthTable();
            if(debug)
            {
                this.arcLengthTable.show();
                let test = this.lookUp(0.0)
                console.log(JSON.stringify(test));
                test = this.lookUp(321.0);
                console.log(JSON.stringify(test));
                test = this.lookUp(237.61);
                console.log(JSON.stringify(test));
                test = this.lookUp(321.024);
                console.log(JSON.stringify(test));
            }
        }
    }

    getPoints()
    {
        return this.points;
    }

    getCurveLength()
    {
        return this.curve_length;
    }
}

function drawPoints(points)
{
    for(let idx = 0; idx < points.length; idx++)
    {
        Game.graphics.beginFill(0xff00ee);
        Game.graphics.drawCircle(points[idx].x, points[idx].y, 5.0);
        Game.graphics.endFill();
    }
}

function drawSpline(points)
{
    let first_point = points[0];
    for(let idx = 1; idx < points.length; idx++)
    {
        let next_point = points[idx];
        Game.graphics.beginFill(0xff0000);
        Game.graphics.lineStyle(1, 0xff0000).moveTo(first_point.x, first_point.y).lineTo(next_point.x, next_point.y);
        Game.graphics.endFill();
        first_point = next_point;
    }
}