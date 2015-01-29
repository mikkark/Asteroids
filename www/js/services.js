/*
 Eventbroadcast service. The first version was By Eric Terpstra, see http://ericterpstra.com/2012/09/angular-cats-part-3-communicating-with-broadcast/.
 This has now been modified according to http://www.theroks.com/angularjs-communication-controllers/.
 */
app.factory('eventBroadcast', function ($rootScope) {

    var CAR_STOPS = "car_stops";
    var carStops = function (car) {
        $rootScope.$broadcast(CAR_STOPS, car);
    };

    var onCarStops = function ($scope, handler) {
        $scope.$on(CAR_STOPS, function (event, message) {
            handler(message);
        });
    };

    var CAR_MOVED = "car_moved";
    var carMoved = function (data) {
        $rootScope.$broadcast(CAR_MOVED, data);
    };

    var onCarMoved = function ($scope, handler) {
        $scope.$on(CAR_MOVED, function (event, message) {
            handler(message);
        });
    };

    return {
        carStops: carStops,
        onCarStops: onCarStops,
        carMoved: carMoved,
        oncarMoved: onCarMoved
    };
});