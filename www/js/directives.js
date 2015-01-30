'use strict'

app.directive('asteroid', ['eventBroadcast', function (eventBroadcast) {
    return {
        templateNamespace: 'svg',
        restrict: 'E',
        replace: true,
        templateUrl: './html/asteroid.html',
        link: function (scope, element) {
            eventBroadcast.onGameTick(scope, function () {
                scope.asteroid.move();

                if (scope.asteroid.xPos > 800 || scope.asteroid.xPos < 0 ||
                    scope.asteroid.yPos > 800 || scope.asteroid.yPos < 0) {
                        scope.asteroid.direction = scope.asteroid.direction + 180;
                }
            });
        }
    }
}]);

app.directive('missile', ['eventBroadcast', function (eventBroadcast) {
    return {
        templateNamespace: 'svg',
        restrict: 'E',
        replace: true,
        templateUrl: './html/missile.html',
        link: function (scope, element) {
            console.log(scope.missile.xPos + "," + scope.missile.yPos);


            eventBroadcast.onGameTick(scope, function () {
                scope.missile.yPos = (Math.sin(toRadians(scope.missile.direction)) * 10) + scope.missile.yPos;
                scope.missile.xPos = (Math.cos(toRadians(scope.missile.direction)) * 10) + scope.missile.xPos;

                if (scope.missile.xPos > 800 || scope.missile.xPos < 0 ||
                    scope.missile.yPos > 800 || scope.missile.yPos < 0) {
                    var index = scope.missiles.indexOf(scope.missile);
                    scope.missiles.splice(index, 1);
                }
            });
        }
    }
}]);

app.directive('spaceshuttle', ['eventBroadcast', function (eventBroadcast) {
    return {
        templateNamespace: 'svg',
        restrict: 'E',
        replace: true,
        templateUrl: './html/spaceshuttle.html',
        link: function (scope, element) {

            var shuttle = new model.Spaceshuttle();
            shuttle.xPos = 200;
            shuttle.yPos = 200;
            shuttle.direction = 0;

            scope.spaceshuttle = shuttle;

            var keys = { gas: 87, left: 65, right: 68, fire: 70 };
            var move = false;

            var keyup = Rx.Observable.fromEvent(document, 'keyup');
            var keydown = Rx.Observable.fromEvent(document, 'keydown');

            var gasKeyFilter = function (kbevent) {
                return kbevent.which === keys.gas;
            };
            var steerLeftFilter = function (kbevent) {
                return kbevent.which === keys.left;
            };
            var steerRightFilter = function (kbevent) {
                return kbevent.which === keys.right;
            };
            var fireFilter = function (kbevent) {
                return kbevent.which === keys.fire;
            };

            eventBroadcast.onGameTick(scope, function () {
                if (move) {
                    shuttle.yPos = (Math.sin(toRadians(shuttle.direction)) * 5) + shuttle.yPos;
                    shuttle.xPos = (Math.cos(toRadians(shuttle.direction)) * 5) + shuttle.xPos;
                }
            });

            keydown.filter(gasKeyFilter)
                .subscribe(function () {
                    move = true;
                });

            keydown.filter(fireFilter)
                .subscribe(function () {
                    scope.missiles.push(new model.Missile(shuttle.direction, shuttle.xPos, shuttle.yPos));
                });

            var turnLeft = keydown.filter(steerLeftFilter)
                .selectMany(function () {
                    return Rx.Observable.interval(15)
                        .takeUntil(keyup.filter(steerLeftFilter));
                })
                .repeat();

            turnLeft.subscribe(function () {
                var newAngle = shuttle.direction - 2;

                if (newAngle > 360) { newAngle = newAngle - 360; }
                if (newAngle < -360) { newAngle = newAngle + 360; }

                shuttle.direction = newAngle;
            });

            var turnRight = keydown.filter(steerRightFilter)
                .selectMany(function () {
                    return Rx.Observable.interval(15)
                        .takeUntil(keyup.filter(steerRightFilter));
                })
                .repeat();

            turnRight.subscribe(function () {
                var newAngle = shuttle.direction + 2;

                if (newAngle > 360) { newAngle = newAngle - 360; }
                if (newAngle < -360) { newAngle = newAngle + 360; }

                shuttle.direction = newAngle;
            });

            keyup.filter(gasKeyFilter).subscribe(function () {
                move = false;
            });
        }
    };
}]);

app.directive('movingobject', ['eventBroadcast',
    function(eventBroadcast) {

        return {
            link: function (scope, element) {
                var currX, currY, newX, newY, newAngle;
                var prevAngle = 0;
                var angleReturnedToZero = function () {
                    return scope.car.steering.angle === 0 && prevAngle !== 0;
                };
                var steeringTurnedTheOtherWay = function () {
                    return Math.abs(scope.car.steering.angle) < prevAngle;
                };
                var steeringStartedChanging = function () {
                    return scope.car.steering.angle !== 0 && prevAngle === 0;
                };

                moveToStartPos(scope.car, element);

                scope.car.direction = 0;

                var revs = observeOnScope(scope, 'car.engine.revs')
                    .filter(function (revs) { return revs.newValue > 0; })
                    .take(1)
                    .selectMany(function () {
                        return Rx.Observable.interval(model.MOVING_RATE)
                            .takeWhile(function () {
                                return  checkpointService.isRaceOn() &&
                                    scope.car.gearbox.currentGear > 0 &&
                                    scope.car.engine.revs > 0 &&
                                    scope.car.fuelTank.fuelLeft > 0 });
                    })
                    .repeat();

                revs.sample(model.STEERING_SAMPLING_RATE).subscribe(function () {
                    newAngle = scope.car.direction + scope.car.steering.angle;

                    if (newAngle > 360) { newAngle = newAngle - 360; }
                    if (newAngle < -360) { newAngle = newAngle + 360; }

                    if (angleReturnedToZero() ||
                        steeringTurnedTheOtherWay() ||
                        steeringStartedChanging()) {
                            socketService.send('carMoves', { name: scope.car.name, angle: scope.car.steering.angle} );
                    }

                    scope.car.direction = newAngle;

                    prevAngle = Math.abs(scope.car.steering.angle);
                });

                revs.takeWhile(function () {
                    return scope.car.currentPresumedSpeed === 0;
                })
                    .repeat()
                    .subscribe(function () {
                        console.log('car start');
                        socketService.send('carStart', { name: scope.car.name, X: scope.car.X, Y: scope.car.Y, direction: scope.car.direction} );
                    });

                revs.subscribe(function () {

                    eventBroadcast.carMoved({ car: scope.car, x: currX, y: currY, oldX: newX, oldY: newY });

                    scope.car.actualSpeed = Math.sqrt(Math.pow(Math.abs(newX - currX), 2) + Math.pow(Math.abs(newY - currY), 2));

                    scope.car.setCurrentSpeed();
                    scope.car.fuelTank.consumeFuel(0.1);

                    scope.$apply();
                });
            }
        };
    }]);