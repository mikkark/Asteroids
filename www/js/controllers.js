'use strict'

app.controller('main', ['$scope', 'eventBroadcast',
    function ($scope, eventBroadcast) {

        var isGameOn = false;

        $scope.asteroids = [];

        for (var i = 0; i < 50 ; i++) {
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

        var gameLoop = Rx.Observable.interval(15).timeInterval().takeWhile(function () { return isGameOn; }).repeat();
        gameLoop.subscribe(function (data) {
            eventBroadcast.gameTick();

            $scope.$apply();
        });

        $scope.missiles = [];
}]);