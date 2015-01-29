'use strict'

app.directive('asteroid', function () {
    return {
        templateNamespace: 'svg',
        restrict: 'E',
        replace: true,
        templateUrl: './html/asteroid.html',
        link: function (scope, element) {

        }
    }
});

app.directive('spaceshuttle', function () {
    return {
        templateNamespace: 'svg',
        restrict: 'E',
        replace: true,
        templateUrl: './html/spaceshuttle.html',
        link: function (scope, element) {

            var keys = { gas: 87, left: 65, right: 68 };
            var car = scope.car;

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
            //currX = scope.car.X;
            //currY = scope.car.Y;
            //
            //newY = (Math.sin(toRadians(scope.car.direction)) * model.UNIT_OF_MOVEMENT) + currY;
            //newX = (Math.cos(toRadians(scope.car.direction)) * model.UNIT_OF_MOVEMENT) + currX;
            //
            //element.attr('transform', 'translate ( ' + newX + ' ' + newY + ')');
            //
            //scope.car.X = newX;
            //scope.car.Y = newY;

            keydown.filter(gasKeyFilter)
                .selectMany(function () {
                    return Rx.Observable.interval(0, model.GAS_PEDAL_SAMPLING_RATE)
                        .takeUntil(keyup.filter(gasKeyFilter))
                })
                .repeat()
                .subscribe(function () {
                    car.accelerate();
                    scope.$apply();
                });

            var turnLeft = keydown.filter(steerLeftFilter).select(function (kb) {
                return kb.keyCode;
            })
                .selectMany(function (keyCode) {
                    return Rx.Observable.interval(0, model.STEERING_SAMPLING_RATE)
                        .select(function () { return keyCode; })
                        .takeUntil(keyup.filter(steerLeftFilter))
                        .takeWhile(function () { return car.steering.angle > -(car.steering.maxAngle); });
                })
                .repeat();

            turnLeft.subscribe(function () {
                car.steering.turnLeft();
                scope.$apply();
            });

            var turnRight = keydown.filter(steerRightFilter).select(function (kb) {
                return kb.keyCode;
            })
                .selectMany(function (keyCode) {
                    return Rx.Observable.interval(0, model.STEERING_SAMPLING_RATE)
                        .select(function () { return keyCode; })
                        .takeUntil(keyup.filter(steerRightFilter))
                        .takeWhile(function () { return car.steering.angle < car.steering.maxAngle; });
                })
                .repeat();

            turnRight.subscribe(function () {
                car.steering.turnRight();
                scope.$apply();
            });
        }
    };
});

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