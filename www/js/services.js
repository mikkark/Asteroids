/*
 Eventbroadcast service. The first version was By Eric Terpstra, see http://ericterpstra.com/2012/09/angular-cats-part-3-communicating-with-broadcast/.
 This has now been modified according to http://www.theroks.com/angularjs-communication-controllers/.
 */
app.factory('eventBroadcast', function ($rootScope) {

    var GAME_TICK = "gameTick";
    var gameTick = function () {
        $rootScope.$broadcast(GAME_TICK);
    };

    var onGameTick = function ($scope, handler) {
        $scope.$on(GAME_TICK, function (event, message) {
            handler(message);
        });
    };

    return {
        gameTick: gameTick,
        onGameTick: onGameTick
    };
});