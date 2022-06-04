class CatmullRomError extends Error
{
    constructor(message) {
        super(message);
        this.name = "CatmullRomError";
    }
}

class CatmullRom {
    constructor(draw_step=0.001)
    {
        this.points = [];
        this.current_drawn_point_idx = 1;
        this.draw_step = draw_step;
    }

    #interpolateAt(t, tau)
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
                    let new_pt = this.#interpolateAt(start, 0.5);
                    console.log(JSON.stringify(new_pt));
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
    }

    getPoints()
    {
        return this.points;
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