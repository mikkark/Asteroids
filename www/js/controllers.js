'use strict'

app.controller('main', ['$scope',
    function ($scope) {

        var isGameOn = false;

        $scope.asteroids = [];

        for (var i = 0; i < 10 ; i++) {
            var newAsteroid = new model.Asteroid(i, Math.floor(Math.random() * 361));

            newAsteroid.xPos = Math.floor(Math.random() * 801);
            newAsteroid.yPos = Math.floor(Math.random() * 801);
            newAsteroid.width = Math.floor(Math.random() * 91) + 30;
            newAsteroid.height = Math.floor(Math.random() * 91) + 30;

            $scope.asteroids.push(newAsteroid);
        }

        $scope.startGame = function () {
            isGameOn = !isGameOn;
        };

        Rx.Observable.interval(0, 15).takeWhile(function () { return isGameOn; }).repeat().subscribe(function () {
            for (var i = 0; i < 10 ; i++) {
                var asteroid = $scope.asteroids[i];

                asteroid.move();
                $scope.$apply();
            }
        });

        $scope.spaceshuttles = [
            new model.Spaceshuttle()
        ];
}]);

app.controller('cpController', ['$scope', '$element', 'checkpointService', 'eventBroadcast', function ($scope, $element, checkpointService, eventBroadcast) {

    var currController = this;

    var getLineIntersection = function (p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
        var s1_x, s1_y, s2_x, s2_y;
        s1_x = p1_x - p0_x;
        s1_y = p1_y - p0_y;
        s2_x = p3_x - p2_x;
        s2_y = p3_y - p2_y;

        var s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
        var t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            // Collision detected
            return true;
        }

        // No collision
        return false;
    };

    eventBroadcast.oncarMoved($scope, function (data) {
        if (data.car.nextCheckpointCtrl === currController) {
            var normalizedOldPos = getNormalizedCarPos(data.oldX, data.oldY);
            var normalizedCurrPos = getNormalizedCarPos(data.x, data.y);
            var intersect = getLineIntersection(normalizedOldPos.X, normalizedOldPos.Y, normalizedCurrPos.X, normalizedCurrPos.Y,
                currController.checkpoint.x1, currController.checkpoint.y1,
                currController.checkpoint.x2, currController.checkpoint.y2);

            if (intersect) {
                checkpointService.checkpointReached(currController, data.car);
            }
        }
    });

    this.checkpoint =  {
        id: Number($element.attr('checkpointId')),
        x1: Number($element.attr('x1')),
        y1: Number($element.attr('y1')),
        x2: Number($element.attr('x2')),
        y2: Number($element.attr('y2'))
    };

    checkpointService.registerCheckpoint(currController);
}]);