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
        this.last_drawn_points_idx = 0;
        this.graphics = new PIXI.Graphics();
        this.draw_step = draw_step;
        Game.PIXIApp.stage.addChild(this.graphics);
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

    #draw()
    {
        // draw the points
        for(let idx = this.last_drawn_points_idx; idx < this.points.length; idx++)
        {
            this.graphics.beginFill(0xff00ee);
            this.graphics.drawCircle(this.points[idx].x, this.points[idx].y, 5.0);
            this.graphics.endFill();
            this.last_drawn_points_idx++;
        }

        // draw the curve
        let last_point_idx = this.points.length - 2;
        for(let idx = this.current_point_idx; idx < last_point_idx; idx++)
        {
            let old_pt = this.points[idx];

            for(let start = 0.0; start <= 1.0; start += this.draw_step)
            {
                let new_pt = this.#interpolateAt(start, 0.5);
                this.graphics.beginFill(0xff0000);
                this.graphics.drawCircle(new_pt.x, new_pt.y, 2.5);
                this.graphics.lineStyle(1, 0xff0000).moveTo(old_pt.x, old_pt.y).lineTo(new_pt.x, new_pt.y);
                old_pt = new_pt;
                this.graphics.endFill();
            }

            this.current_point_idx++;
        }
    }

    #interpolateAll(t, tau)
    {
        let interpolated_points = [];
        let last_point_idx = this.points.length - 2;

        for(let idx = this.current_point_idx; idx < last_point_idx; idx++)
        {
            let old_pt = this.points[idx];
            interpolated_points.push(old_pt);

            for(let start = 0.0; start <= 1.0; start += this.draw_step)
            {
                let new_pt = this.#interpolateAt(start, 0.5);
                interpolated_points.push(new_pt);
                old_pt = new_pt;
            }

            this.current_point_idx++;
        }

        return interpolated_points;
    }

    addPoint(point)
    {
        if(!(point instanceof Vector2))
        {
            throw new CatmullRomError("expected type Vector2, got: " + typeof(point));
        }

        this.points.push(point);

        if(this.points.length >= 4 && this.current_point_idx + 2 < this.points.length)
        {
            this.#draw();
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
            this.#draw();
        }
    }
}