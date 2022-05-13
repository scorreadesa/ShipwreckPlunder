class CatmullRomError extends Error
{
    constructor(message) {
        super(message);
        this.name = "CatmullRomError";
    }
}

class CatmullRom {
    constructor(draw_step=0.25)
    {
        this.points = [];
        this.current_point_idx = 1;
        this.draw_step = draw_step;
    }

    #interpolateAt(t, tau)
    {

        let p0 = this.points[this.current_point_idx - 1];
        let p1 = this.points[this.current_point_idx];
        let p2 = this.points[this.current_point_idx + 1];
        let p3 = this.points[this.current_point_idx + 2];

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

    #interpolateAll()
    {
        let last_point_idx = this.points.length - 2;
        //console.log("Before: ", this.points);

        for(let idx = this.current_point_idx; idx < last_point_idx; idx++)
        {
            let interpolated_points = [];
            let old_pt = this.points[idx];

            for(let start = this.draw_step; start < 1.0; start += this.draw_step)
            {
                let new_pt = this.#interpolateAt(start, 0.5);
                interpolated_points.push(new_pt);
                old_pt = new_pt;
            }

            console.log("Interpolated between : " + JSON.stringify(this.points[this.current_point_idx], null, 2) +
                " and " + JSON.stringify(this.points[this.points.length - 2], null, 2) +
                ": " + JSON.stringify(interpolated_points, null, ));
            this.points.splice(this.current_point_idx + 1, 0, ...interpolated_points);
            console.log(this.points);
            this.current_point_idx += interpolated_points.length;
            this.current_point_idx++;
            console.log(this.current_point_idx);
        }
    }

    addPoint(point)
    {
        if(!(point instanceof Vector2))
        {
            throw new CatmullRomError("expected type Vector2, got: " + typeof(point));
        }

        this.points.push(point);
        console.log("(" + point.x + ", " + point.y + ")");

        if(this.points.length >= 4 && this.current_point_idx + 2 < this.points.length)
        {
            console.log("interpolating...");
            this.#interpolateAll();
        }
    }

    addPoints(points)
    {
        for(const point of points)
        {
            if(!(point instanceof Vector2))
            {
                throw new CatmullRomError("expected type Vector2, got: " + typeof(point));
            }

            this.points.push(point);
        }

        if(this.points.length >= 4 && this.current_point_idx + 2 < this.points.length)
        {
            this.#interpolateAll();
        }
    }

    getPoints()
    {
        return this.points;
    }

    setStepSize(step_size)
    {
        if(step_size > 0 && step_size < 1)
        {
            this.draw_step = step_size
        }
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