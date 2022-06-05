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
        /**
         * needs interpolateBetween
         */
        return {}
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

    addPoint(point)
    {
        if(!(point instanceof Vector2))
        {
            throw new CatmullRomError("expected type Vector2, got: " + typeof(point));
        }

        this.points.push(point);
    }

    addPoints(points, debug=true)
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