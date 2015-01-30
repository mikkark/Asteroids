var createModel;
createModel = function () {
    'use strict';

    var model = {};

    function Asteroid(speed, direction) {
        this.speed = speed;
        this.xPos = 0;
        this.yPos = 0;
        this.direction = direction;
    }

    Asteroid.prototype.move = function () {
        var newY = (Math.sin(toRadians(this.direction)) * (this.speed / 2)) + this.yPos;
        var newX = (Math.cos(toRadians(this.direction)) * (this.speed / 2)) + this.xPos;

        this.xPos = newX;
        this.yPos = newY;
    };

    function Spaceshuttle() {

    }

    function Missile(direction, xPos, yPos) {
        this.direction = direction;
        this.xPos = xPos;
        this.yPos = yPos;
    }

    model.Spaceshuttle = Spaceshuttle;
    model.Asteroid = Asteroid;
    model.Missile = Missile;

    return model;
};

var model = createModel();