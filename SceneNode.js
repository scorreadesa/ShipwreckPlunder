

/**
 * SceneNode wrapper around a gameObject that is part of a hierarchy of objects.
 * Node can be added, removed, drawn.
 * Transforms (translation, rotation, scale) of a node are relative to the transforms of its parent.
 */

class SceneNode
{
    constructor(sprite)
    {
        this.sprite = sprite;
        this.parent = null;
        this.children = [];
        this.x = sprite.x;
        this.y = sprite.y;
        this.angle = sprite.angle;
    }

    addChild(sprite)
    {
        this.parent = this;
        this.children.push(sprite);
    }

    removeChild(sprite)
    {
        this.children = this.children.filter((v) => {
            return v !== sprite;
        });
    }

    update(delta)
    {
        this.updateSelf(delta);
        this.updateChildren(delta);
    }

    updateSelf(delta)
    {
    }

    updateChildren(delta)
    {
        for(let i = 0; i < this.children.length; i++)
        {
            this.children[i].update(delta);
        }
    }
}