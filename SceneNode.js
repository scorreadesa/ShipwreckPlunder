

/**
 * SceneNode wrapper around a gameObject that is part of a hierarchy of objects.
 * Node can be added, removed, drawn.
 * Transforms (translation, rotation, scale) of a node are relative to the transforms of its parent.
 */

class SceneNode
{
    constructor(game_object)
    {
        this.game_object_ = game_object;
        this.parent_ = null;
        this.children_ = [];
        this.transform = identity2x2();
    }

    addChild(game_object)
    {
        this.parent_ = this;
        this.children_.push(game_object);
    }

    removeChild(game_object)
    {

    }

    updateChildren(delta)
    {
        //TODO: issue every object is automatically added to the game object array and is automatically updated
        //TODO: maybe dont use game object, use sprite instead?
        for(let i = 0; i < this.children_.length; i++)
        {
            this.children_[i].update(delta);
        }
    }

    getModelMatrix()
    {

    }
}

function identity2x2()
{
    return [
        new Vector2(1.0, 0.0),
        new Vector2(0.0, 1.0)
    ]
}